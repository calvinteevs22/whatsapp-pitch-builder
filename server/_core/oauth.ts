import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as emailService from "./email";
import { getNextResetDate } from "../usage";

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}

export function registerOAuthRoutes(app: Express) {
  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    try {
      const user = await db.getUserByEmail(email);
      if (!user || !user.loginMethod) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const valid = await verifyPassword(password, user.loginMethod);
      if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    try {
      const existing = await db.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "An account with this email already exists" });
        return;
      }

      const passwordHash = await hashPassword(password);
      const openId = crypto.randomUUID();
      const verifyToken = crypto.randomBytes(32).toString("hex");

      await db.upsertUser({
        openId,
        name: name || null,
        email,
        loginMethod: passwordHash,
        lastSignedIn: new Date(),
      });

      // Set genResetAt and email verify token on new user
      const newUser = await db.getUserByEmail(email);
      if (newUser) {
        await db.updateUserBilling(newUser.id, { genResetAt: getNextResetDate() });
        await db.setEmailVerifyToken(newUser.id, verifyToken);
      }

      // Fire-and-forget — don't fail registration if email fails
      emailService.sendVerificationEmail(email, verifyToken).catch((err) => {
        console.warn("[Auth] Failed to send verification email:", err.message);
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Register failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Email verification
  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    const { token } = req.query as { token?: string };
    if (!token) { res.status(400).send("Invalid token"); return; }
    try {
      const user = await db.getUserByEmailVerifyToken(token);
      if (!user) { res.status(400).send("Invalid or expired verification link"); return; }
      await db.setEmailVerified(user.id);
      res.redirect("/?verified=1");
    } catch {
      res.status(500).send("Verification failed");
    }
  });

  // Forgot password — request reset
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    const { email: userEmail } = req.body;
    if (!userEmail) { res.status(400).json({ error: "Email is required" }); return; }
    try {
      const user = await db.getUserByEmail(userEmail);
      // Always return success to prevent email enumeration
      if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await db.setResetToken(user.id, token, expiresAt);
        emailService.sendPasswordResetEmail(userEmail, token).catch((err) => {
          console.warn("[Auth] Failed to send reset email:", err.message);
        });
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Request failed" });
    }
  });

  // Reset password — apply new password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    const { token, password: newPassword } = req.body;
    if (!token || !newPassword) { res.status(400).json({ error: "Token and password are required" }); return; }
    if (newPassword.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters" }); return; }
    try {
      const user = await db.getUserByResetToken(token);
      if (!user || !user.resetTokenExpiresAt || new Date() > user.resetTokenExpiresAt) {
        res.status(400).json({ error: "Invalid or expired reset link" });
        return;
      }
      const newHash = await hashPassword(newPassword);
      await db.clearResetToken(user.id, newHash);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Password reset failed" });
    }
  });
}
