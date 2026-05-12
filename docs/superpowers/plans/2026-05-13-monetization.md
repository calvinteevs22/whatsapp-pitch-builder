# Monetization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Stripe-powered tiered SaaS billing (Free / Pro $29 / Agency $79) with AI generation quotas, feature gates, pricing page, upgrade modal, account page, email verification, and password reset.

**Architecture:** New `server/usage.ts` handles quota logic; `server/billing.ts` adds tRPC billing procedures; `server/stripeWebhook.ts` handles Stripe events as a raw Express route. All gated tRPC procedures call `checkAndIncrementUsage` or `requiresPlan` before proceeding. Frontend gets a `<UpgradeModal>`, `<UsageIndicator>`, `/pricing`, and `/account` pages.

**Tech Stack:** Stripe SDK (`stripe`), Resend (`resend`) for transactional email, Drizzle ORM (MySQL), tRPC 11, React 19, shadcn/ui, wouter, vitest

---

## File Map

**New files:**
- `server/usage.ts` — `getPlanLimits`, `checkAndIncrementUsage`, `requiresPlan`
- `server/billing.ts` — tRPC billing router (`createCheckoutSession`, `createPortalSession`, `getSubscription`)
- `server/stripeWebhook.ts` — Express POST `/api/stripe/webhook` handler
- `server/_core/email.ts` — Resend email client + `sendVerificationEmail`, `sendPasswordResetEmail`
- `server/usage.test.ts` — unit tests for usage logic
- `client/src/components/UpgradeModal.tsx` — reusable upgrade modal
- `client/src/components/UsageIndicator.tsx` — generation counter pill for nav
- `client/src/pages/Pricing.tsx` — public `/pricing` page
- `client/src/pages/Account.tsx` — authenticated `/account` page

**Modified files:**
- `drizzle/schema.ts` — add 8 columns to `users` (plan, gen_count, gen_reset_at, stripe_*, email_verified, reset_token_*)
- `server/db.ts` — add `updateUserBilling`, `getUserById`, `setEmailVerified`, `setResetToken`, `getUserByResetToken`
- `server/_core/env.ts` — add Stripe + Resend + app URL vars
- `server/_core/index.ts` — register webhook route before `express.json()`, update register to set `gen_reset_at`
- `server/_core/oauth.ts` — on register: set `gen_reset_at`, send verification email; add forgot-password + reset-password routes
- `server/routers.ts` — add `billing` router; add `checkAndIncrementUsage` to `ai.generateFlow`; add `requiresPlan` to `crawlWebsite`, `thread.exportHtml`, `ai.generateAdCreative`
- `client/src/App.tsx` — add `/pricing` and `/account` routes
- `.env.example` — document new env vars

---

## Task 1: Install dependencies

**Files:** `package.json`

- [ ] **Step 1: Install stripe and resend**

```bash
pnpm add stripe resend
```

- [ ] **Step 2: Verify installation**

```bash
pnpm list stripe resend
```

Expected: both packages listed with versions.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add stripe and resend dependencies"
```

---

## Task 2: DB schema — billing + auth columns

**Files:**
- Modify: `drizzle/schema.ts`
- Run: Drizzle migration

- [ ] **Step 1: Add columns to the `users` table in `drizzle/schema.ts`**

In `drizzle/schema.ts`, replace the `users` table definition with the following (add 8 new fields after `loginCount`):

```typescript
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  loginCount: int("loginCount").default(0).notNull(),
  // Billing
  plan: mysqlEnum("plan", ["free", "pro", "agency"]).default("free").notNull(),
  genCount: int("genCount").default(0).notNull(),
  genResetAt: timestamp("genResetAt"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "canceled", "past_due", "trialing"]),
  // Email verification
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerifyToken: varchar("emailVerifyToken", { length: 64 }),
  // Password reset
  resetToken: varchar("resetToken", { length: 64 }),
  resetTokenExpiresAt: timestamp("resetTokenExpiresAt"),
});
```

- [ ] **Step 2: Generate migration**

```bash
pnpm drizzle-kit generate
```

Expected: a new `.sql` migration file created in `./drizzle/`.

- [ ] **Step 3: Apply migration to your database**

```bash
pnpm drizzle-kit migrate
```

Expected: `[✓] All migrations applied successfully.`

- [ ] **Step 4: Commit**

```bash
git add drizzle/schema.ts drizzle/
git commit -m "feat: add billing and auth columns to users table"
```

---

## Task 3: Env vars

**Files:**
- Modify: `server/_core/env.ts`
- Modify: `.env.example`

- [ ] **Step 1: Update `server/_core/env.ts`**

```typescript
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "wa-thread-builder",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceIdPro: process.env.STRIPE_PRICE_ID_PRO ?? "",
  stripePriceIdAgency: process.env.STRIPE_PRICE_ID_AGENCY ?? "",
  // Email (Resend)
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "noreply@example.com",
  // App URL (used in email links)
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
};
```

- [ ] **Step 2: Update `.env.example`** — append after the `PORT=3000` line:

```bash
# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_PRO="price_..."
STRIPE_PRICE_ID_AGENCY="price_..."

# Email (Resend - https://resend.com)
RESEND_API_KEY="re_..."
EMAIL_FROM="WhatsApp Pitch Builder <noreply@yourdomain.com>"

# App URL (used in email links)
APP_URL="https://yourdomain.com"
```

- [ ] **Step 3: Commit**

```bash
git add server/_core/env.ts .env.example
git commit -m "feat: add Stripe and Resend env vars"
```

---

## Task 4: Usage tracking helpers

**Files:**
- Create: `server/usage.ts`
- Create: `server/usage.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/usage.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getPlanLimits, isOverLimit, getNextResetDate } from "./usage";

describe("getPlanLimits", () => {
  it("returns 3 for free", () => {
    expect(getPlanLimits("free")).toBe(3);
  });
  it("returns 30 for pro", () => {
    expect(getPlanLimits("pro")).toBe(30);
  });
  it("returns Infinity for agency", () => {
    expect(getPlanLimits("agency")).toBe(Infinity);
  });
});

describe("isOverLimit", () => {
  it("returns false when count is below limit", () => {
    expect(isOverLimit("free", 2)).toBe(false);
  });
  it("returns true when count equals limit", () => {
    expect(isOverLimit("free", 3)).toBe(true);
  });
  it("returns false for agency regardless of count", () => {
    expect(isOverLimit("agency", 99999)).toBe(false);
  });
});

describe("getNextResetDate", () => {
  it("returns a date in the future", () => {
    const next = getNextResetDate();
    expect(next.getTime()).toBeGreaterThan(Date.now());
  });
  it("returns a date on the 1st of next month", () => {
    const next = getNextResetDate();
    expect(next.getDate()).toBe(1);
    expect(next.getHours()).toBe(0);
    expect(next.getMinutes()).toBe(0);
    expect(next.getSeconds()).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm vitest run server/usage.test.ts
```

Expected: FAIL — `Cannot find module './usage'`

- [ ] **Step 3: Create `server/usage.ts`**

```typescript
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";

export type Plan = "free" | "pro" | "agency";

export function getPlanLimits(plan: Plan): number {
  if (plan === "free") return 3;
  if (plan === "pro") return 30;
  return Infinity; // agency
}

export function isOverLimit(plan: Plan, count: number): boolean {
  const limit = getPlanLimits(plan);
  return count >= limit;
}

export function getNextResetDate(): Date {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return next;
}

/**
 * Call before every AI generation. Lazy-resets monthly counter, checks limit,
 * then increments. Throws FORBIDDEN if at limit.
 */
export async function checkAndIncrementUsage(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return; // No DB in test/demo mode — allow through

  const rows = await db.select({
    plan: users.plan,
    genCount: users.genCount,
    genResetAt: users.genResetAt,
  }).from(users).where(eq(users.id, userId)).limit(1);

  if (rows.length === 0) return;
  const { plan, genCount, genResetAt } = rows[0];

  // Lazy reset
  let currentCount = genCount;
  const now = new Date();
  if (!genResetAt || now >= genResetAt) {
    currentCount = 0;
    await db.update(users).set({
      genCount: 0,
      genResetAt: getNextResetDate(),
    }).where(eq(users.id, userId));
  }

  if (isOverLimit(plan, currentCount)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "generation_limit_reached",
    });
  }

  await db.update(users).set({
    genCount: currentCount + 1,
  }).where(eq(users.id, userId));
}

/**
 * Throws FORBIDDEN if user's plan is below the required plan.
 */
export async function requiresPlan(userId: number, minPlan: "pro" | "agency"): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const rows = await db.select({ plan: users.plan }).from(users).where(eq(users.id, userId)).limit(1);
  if (rows.length === 0) return;

  const { plan } = rows[0];
  const planRank: Record<Plan, number> = { free: 0, pro: 1, agency: 2 };
  const required = planRank[minPlan];
  const actual = planRank[plan];

  if (actual < required) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `requires_plan:${minPlan}`,
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run server/usage.test.ts
```

Expected: PASS — 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add server/usage.ts server/usage.test.ts
git commit -m "feat: add usage tracking and plan limit helpers"
```

---

## Task 5: DB helpers for billing

**Files:**
- Modify: `server/db.ts`

- [ ] **Step 1: Add billing helpers at the end of `server/db.ts`**

```typescript
// ==================== BILLING QUERIES ====================

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserBilling(userId: number, data: {
  plan?: "free" | "pro" | "agency";
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "trialing" | null;
  genResetAt?: Date;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data as any).where(eq(users.id, userId));
}

export async function getUserByStripeCustomerId(customerId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
  return result[0];
}

export async function getUserByStripeSubscriptionId(subscriptionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.stripeSubscriptionId, subscriptionId)).limit(1);
  return result[0];
}

// ==================== EMAIL AUTH QUERIES ====================

export async function setEmailVerified(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ emailVerified: true, emailVerifyToken: null }).where(eq(users.id, userId));
}

export async function setEmailVerifyToken(userId: number, token: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ emailVerifyToken: token }).where(eq(users.id, userId));
}

export async function getUserByEmailVerifyToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.emailVerifyToken, token)).limit(1);
  return result[0];
}

export async function setResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ resetToken: token, resetTokenExpiresAt: expiresAt }).where(eq(users.id, userId));
}

export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
  return result[0];
}

export async function clearResetToken(userId: number, newPasswordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ resetToken: null, resetTokenExpiresAt: null, loginMethod: newPasswordHash }).where(eq(users.id, userId));
}
```

- [ ] **Step 2: Verify it compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors on `server/db.ts`.

- [ ] **Step 3: Commit**

```bash
git add server/db.ts
git commit -m "feat: add billing and email-auth DB helpers"
```

---

## Task 6: Email service

**Files:**
- Create: `server/_core/email.ts`

- [ ] **Step 1: Create `server/_core/email.ts`**

```typescript
import { Resend } from "resend";
import { ENV } from "./env";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!ENV.resendApiKey) return null;
  if (!_resend) _resend = new Resend(ENV.resendApiKey);
  return _resend;
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log(`[Email] Verification token for ${to}: ${token} (Resend not configured)`);
    return;
  }
  const url = `${ENV.appUrl}/api/auth/verify-email?token=${token}`;
  await resend.emails.send({
    from: ENV.emailFrom,
    to,
    subject: "Verify your email — WhatsApp Pitch Builder",
    html: `
      <p>Click the link below to verify your email address:</p>
      <p><a href="${url}">${url}</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log(`[Email] Password reset token for ${to}: ${token} (Resend not configured)`);
    return;
  }
  const url = `${ENV.appUrl}/reset-password?token=${token}`;
  await resend.emails.send({
    from: ENV.emailFrom,
    to,
    subject: "Reset your password — WhatsApp Pitch Builder",
    html: `
      <p>Click the link below to reset your password:</p>
      <p><a href="${url}">${url}</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });
}
```

- [ ] **Step 2: Verify it compiles**

```bash
pnpm tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add server/_core/email.ts
git commit -m "feat: add Resend email service with graceful no-op fallback"
```

---

## Task 7: Email verification + password reset routes

**Files:**
- Modify: `server/_core/oauth.ts`

- [ ] **Step 1: Update `server/_core/oauth.ts`**

Add these imports at the top (after existing imports):
```typescript
import { randomBytes } from "crypto"; // already imported as `crypto`, use crypto.randomBytes
import * as email from "./email";
import {
  setEmailVerifyToken,
  getUserByEmailVerifyToken,
  setEmailVerified,
  setResetToken,
  getUserByResetToken,
  clearResetToken,
  getUserByEmail as getUserByEmailDb,
} from "../db";
import { getNextResetDate } from "../usage";
```

Update the register handler to (a) set `gen_reset_at` and (b) send verification email. In the `app.post("/api/auth/register", ...)` handler, replace the `upsertUser` call block:

```typescript
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

// Get the newly created user to get their id
const newUser = await db.getUserByEmail(email);
if (newUser) {
  await db.updateUserBilling(newUser.id, { genResetAt: getNextResetDate() });
  await setEmailVerifyToken(newUser.id, verifyToken);
}

await email.sendVerificationEmail(email, verifyToken);
```

Then add three new routes inside `registerOAuthRoutes` after the register route:

```typescript
// Email verification
app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
  const { token } = req.query as { token?: string };
  if (!token) { res.status(400).send("Invalid token"); return; }
  try {
    const user = await getUserByEmailVerifyToken(token);
    if (!user) { res.status(400).send("Invalid or expired verification link"); return; }
    await setEmailVerified(user.id);
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
    const user = await getUserByEmailDb(userEmail);
    // Always return success to prevent email enumeration
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await setResetToken(user.id, token, expiresAt);
      await email.sendPasswordResetEmail(userEmail, token);
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
    const user = await getUserByResetToken(token);
    if (!user || !user.resetTokenExpiresAt || new Date() > user.resetTokenExpiresAt) {
      res.status(400).json({ error: "Invalid or expired reset link" });
      return;
    }
    const newHash = await hashPassword(newPassword);
    await clearResetToken(user.id, newHash);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Password reset failed" });
  }
});
```

- [ ] **Step 2: Verify it compiles**

```bash
pnpm tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add server/_core/oauth.ts
git commit -m "feat: email verification and password reset flows"
```

---

## Task 8: Apply usage gate to AI generation

**Files:**
- Modify: `server/routers.ts` (lines ~756)

- [ ] **Step 1: Add usage import at the top of `server/routers.ts`**

After the existing imports, add:
```typescript
import { checkAndIncrementUsage, requiresPlan } from "./usage";
```

- [ ] **Step 2: Gate `ai.generateFlow` — add before `let websiteContext = ""`**

In the `ai.generateFlow` mutation handler (around line 756), right after `.mutation(async ({ ctx, input }) => {`, add:

```typescript
await checkAndIncrementUsage(ctx.user.id);
```

- [ ] **Step 3: Gate `ai.crawlWebsite` — add Pro+ check**

In the `crawlWebsite` mutation handler (around line 1267), right after `.mutation(async ({ input }) => {`, the handler uses `({ input })` not `({ ctx, input })`. Change the signature to `({ ctx, input })` and add:

```typescript
await requiresPlan(ctx.user.id, "pro");
```

- [ ] **Step 4: Gate `thread.exportHtml` — add Pro+ check**

In the `thread.exportHtml` query handler (around line 253), change the handler signature from `({ ctx, input })` (already correct) and add before the DB call:

```typescript
await requiresPlan(ctx.user.id, "pro");
```

- [ ] **Step 5: Gate `ai.generateAdCreative` — add Pro+ check**

Find the `generateAdCreative` procedure (around line 1317). Add at the top of its mutation handler:

```typescript
await requiresPlan(ctx.user.id, "pro");
```

- [ ] **Step 6: Verify it compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add server/routers.ts
git commit -m "feat: apply generation quota and feature gates to gated procedures"
```

---

## Task 9: Billing tRPC router

**Files:**
- Create: `server/billing.ts`
- Modify: `server/routers.ts`

- [ ] **Step 1: Create `server/billing.ts`**

```typescript
import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { ENV } from "./_core/env";
import { getUserById, updateUserBilling } from "./db";

function getStripe(): Stripe {
  if (!ENV.stripeSecretKey) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe is not configured" });
  }
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2025-04-30.basil" });
}

export const billingRouter = router({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return {
      plan: user.plan,
      genCount: user.genCount,
      genResetAt: user.genResetAt,
      subscriptionStatus: user.subscriptionStatus,
      emailVerified: user.emailVerified,
    };
  }),

  createCheckoutSession: protectedProcedure
    .input(z.object({ priceId: z.enum(["pro", "agency"]) }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      // Create or reuse Stripe customer
      let customerId = user.stripeCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          metadata: { userId: String(ctx.user.id) },
        });
        customerId = customer.id;
        await updateUserBilling(ctx.user.id, { stripeCustomerId: customerId });
      }

      const priceId = input.priceId === "pro" ? ENV.stripePriceIdPro : ENV.stripePriceIdAgency;
      if (!priceId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Price not configured" });

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${ENV.appUrl}/account?checkout=success`,
        cancel_url: `${ENV.appUrl}/pricing`,
        allow_promotion_codes: true,
      });

      return { url: session.url };
    }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    const user = await getUserById(ctx.user.id);
    if (!user?.stripeCustomerId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No billing account found" });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${ENV.appUrl}/account`,
    });
    return { url: session.url };
  }),
});
```

- [ ] **Step 2: Add `billing` router to `appRouter` in `server/routers.ts`**

At the top of `routers.ts`, add import:
```typescript
import { billingRouter } from "./billing";
```

Inside the `appRouter = router({ ... })` object, add:
```typescript
billing: billingRouter,
```

- [ ] **Step 3: Verify it compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/billing.ts server/routers.ts
git commit -m "feat: add billing tRPC router with checkout and portal sessions"
```

---

## Task 10: Stripe webhook handler

**Files:**
- Create: `server/stripeWebhook.ts`
- Modify: `server/_core/index.ts`

- [ ] **Step 1: Create `server/stripeWebhook.ts`**

```typescript
import type { Express, Request, Response } from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getUserByStripeCustomerId, getUserByStripeSubscriptionId, updateUserBilling } from "./db";

const planByPriceId: Record<string, "pro" | "agency"> = {};

function getPlanFromSubscription(subscription: Stripe.Subscription): "free" | "pro" | "agency" {
  const priceId = subscription.items.data[0]?.price.id;
  if (priceId === ENV.stripePriceIdPro) return "pro";
  if (priceId === ENV.stripePriceIdAgency) return "agency";
  return "free";
}

export function registerStripeWebhook(app: Express): void {
  // Raw body needed for webhook signature verification — must be before express.json()
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    if (!ENV.stripeSecretKey) {
      res.status(200).json({ received: true });
      return;
    }

    const stripe = new Stripe(ENV.stripeSecretKey, { apiVersion: "2025-04-30.basil" });
    const sig = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, ENV.stripeWebhookSecret);
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode !== "subscription" || !session.subscription) break;
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const user = await getUserByStripeCustomerId(session.customer as string);
          if (!user) break;
          await updateUserBilling(user.id, {
            plan: getPlanFromSubscription(sub),
            stripeSubscriptionId: sub.id,
            subscriptionStatus: sub.status as any,
          });
          console.log(`[Stripe] User ${user.id} upgraded to ${getPlanFromSubscription(sub)}`);
          break;
        }
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const user = await getUserByStripeSubscriptionId(sub.id);
          if (!user) break;
          await updateUserBilling(user.id, {
            plan: getPlanFromSubscription(sub),
            subscriptionStatus: sub.status as any,
          });
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const user = await getUserByStripeSubscriptionId(sub.id);
          if (!user) break;
          await updateUserBilling(user.id, {
            plan: "free",
            stripeSubscriptionId: null,
            subscriptionStatus: null,
          });
          console.log(`[Stripe] User ${user.id} downgraded to free`);
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          if (!invoice.subscription) break;
          const user = await getUserByStripeSubscriptionId(invoice.subscription as string);
          if (!user) break;
          await updateUserBilling(user.id, { subscriptionStatus: "past_due" });
          break;
        }
      }
    } catch (err) {
      console.error("[Stripe Webhook] Handler error:", err);
    }

    res.json({ received: true });
  });
}
```

- [ ] **Step 2: Register webhook in `server/_core/index.ts` BEFORE `express.json()`**

In `server/_core/index.ts`, add import:
```typescript
import { registerStripeWebhook } from "../stripeWebhook";
```

After `const app = express();` and `const server = createServer(app);` but **before** `app.use(express.json(...))`, add:

```typescript
// Stripe webhook needs raw body — must be registered before express.json()
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
registerStripeWebhook(app);
```

- [ ] **Step 3: Verify it compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/stripeWebhook.ts server/_core/index.ts
git commit -m "feat: add Stripe webhook handler for subscription lifecycle events"
```

---

## Task 11: Thread count limit for Free tier

**Files:**
- Modify: `server/routers.ts`

The Free tier allows 10 saved threads. Enforce this on `thread.create`.

- [ ] **Step 1: Add thread count check in `thread.create` mutation**

Find the `thread.create` mutation in `server/routers.ts`. Add at the start of the mutation body (after `ctx.user` is available):

```typescript
// Free tier: max 10 threads
const { plan } = ctx.user;
if (plan === "free") {
  const existingThreads = await getThreadsByUser(ctx.user.id);
  if (existingThreads.length >= 10) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "requires_plan:pro",
    });
  }
}
```

Note: `ctx.user` comes from the DB via `sdk.authenticateRequest`. The `plan` field is now on the user object after the schema migration.

- [ ] **Step 2: Verify it compiles**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add server/routers.ts
git commit -m "feat: enforce 10-thread limit for free tier"
```

---

## Task 12: Frontend — UpgradeModal component

**Files:**
- Create: `client/src/components/UpgradeModal.tsx`

- [ ] **Step 1: Create `client/src/components/UpgradeModal.tsx`**

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

const PRO_BENEFITS = [
  "30 AI generations per month",
  "Unlimited saved threads",
  "Website crawl & auto-personalization",
  "Multi-language support",
  "CTWA ad creative generation",
  "HTML & PowerPoint exports",
];

const AGENCY_BENEFITS = [
  "Unlimited AI generations",
  "Everything in Pro",
  "API access for integrations",
  "Priority support",
];

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: string; // e.g. "generation_limit_reached" | "requires_plan:pro" | "requires_plan:agency"
}

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const targetPlan = reason === "requires_plan:agency" ? "agency" : "pro";
  const benefits = targetPlan === "agency" ? AGENCY_BENEFITS : PRO_BENEFITS;
  const price = targetPlan === "agency" ? "$79" : "$29";
  const planName = targetPlan === "agency" ? "Agency" : "Pro";

  const headline =
    reason === "generation_limit_reached"
      ? "You've used all your generations this month"
      : reason === "requires_plan:agency"
      ? "API access is an Agency feature"
      : "This is a Pro feature";

  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Upgrade to {planName}
            </span>
          </div>
          <DialogTitle className="text-xl">{headline}</DialogTitle>
          <DialogDescription>
            Upgrade to {planName} at {price}/month and unlock:
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 my-2">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary shrink-0" />
              {b}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 mt-2">
          <Button
            className="w-full"
            onClick={() => checkoutMutation.mutate({ priceId: targetPlan as "pro" | "agency" })}
            disabled={checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? "Redirecting..." : `Upgrade to ${planName} — ${price}/mo`}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/UpgradeModal.tsx
git commit -m "feat: add UpgradeModal component"
```

---

## Task 13: Frontend — UsageIndicator component

**Files:**
- Create: `client/src/components/UsageIndicator.tsx`

- [ ] **Step 1: Create `client/src/components/UsageIndicator.tsx`**

```tsx
import { trpc } from "@/lib/trpc";
import { UpgradeModal } from "./UpgradeModal";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getPlanLimits } from "../../../server/usage";

// Inline limits to avoid server import in client bundle
const LIMITS: Record<string, number> = { free: 3, pro: 30, agency: Infinity };

export function UsageIndicator() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { data } = trpc.billing.getSubscription.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  if (!data) return null;
  const { plan, genCount } = data;
  if (plan === "agency") return null; // unlimited

  const limit = LIMITS[plan] ?? 3;
  const pct = genCount / limit;
  const isAmber = pct >= 0.66 && pct < 1;
  const isRed = pct >= 1;

  return (
    <>
      <button
        onClick={() => setShowUpgrade(true)}
        className={cn(
          "text-xs px-2.5 py-1 rounded-full border font-medium transition-colors",
          isRed
            ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            : isAmber
            ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            : "bg-muted border-border text-muted-foreground hover:bg-accent"
        )}
      >
        {genCount} / {limit} generations
      </button>
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason="generation_limit_reached"
      />
    </>
  );
}
```

**Note:** The `UsageIndicator` imports plan limits inline rather than from `server/usage.ts` to avoid bundling server code. The limits are duplicated as a plain object — if limits change, update both `server/usage.ts` and this component.

- [ ] **Step 2: Verify it compiles**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/UsageIndicator.tsx
git commit -m "feat: add UsageIndicator pill component"
```

---

## Task 14: Frontend — Pricing page

**Files:**
- Create: `client/src/pages/Pricing.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create `client/src/pages/Pricing.tsx`**

```tsx
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    id: "free" as const,
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try the builder with no commitment.",
    limit: "3 AI generations / month",
    features: [
      "3 AI generations per month",
      "10 saved threads",
      "Template browsing",
      "Manual message editing",
      "Share links",
    ],
    cta: "Get started free",
    popular: false,
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$29",
    period: "/ month",
    description: "For freelancers and growing agencies.",
    limit: "30 AI generations / month",
    features: [
      "30 AI generations per month",
      "Unlimited saved threads",
      "Website crawl & auto-personalization",
      "Multi-language support",
      "CTWA ad creative generation",
      "HTML & PowerPoint exports",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    id: "agency" as const,
    name: "Agency",
    price: "$79",
    period: "/ month",
    description: "For teams pitching at scale.",
    limit: "Unlimited AI generations",
    features: [
      "Unlimited AI generations",
      "Everything in Pro",
      "API access for integrations",
      "Priority support",
    ],
    cta: "Upgrade to Agency",
    popular: false,
  },
];

export default function Pricing() {
  const [, navigate] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: sub } = trpc.billing.getSubscription.useQuery(undefined, {
    enabled: !!user,
  });
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
  });

  function handleCta(tier: typeof TIERS[number]) {
    if (tier.id === "free") {
      navigate(user ? "/threads" : "/login");
      return;
    }
    if (!user) { navigate("/login"); return; }
    checkoutMutation.mutate({ priceId: tier.id });
  }

  return (
    <div className="min-h-screen bg-[#0B1210] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B1210]/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <button onClick={() => navigate("/")} className="font-display font-bold text-lg text-white">
            WA Pitch Builder
          </button>
          {user ? (
            <Button variant="outline" size="sm" onClick={() => navigate("/threads")}
              className="border-white/20 text-white hover:bg-white/10">
              Dashboard
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate("/login")}>Get started</Button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="container pt-20 pb-12 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-white/60 text-lg max-w-xl mx-auto">
          Pick the plan that matches your pitch volume. Upgrade or cancel anytime.
        </p>
      </div>

      {/* Tier cards */}
      <div className="container pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TIERS.map((tier) => {
            const isCurrent = sub?.plan === tier.id;
            return (
              <div
                key={tier.id}
                className={cn(
                  "relative rounded-2xl border p-6 flex flex-col",
                  tier.popular
                    ? "border-primary/50 bg-white/[0.06]"
                    : "border-white/[0.08] bg-white/[0.03]"
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h2 className="font-display text-xl font-bold mb-1">{tier.name}</h2>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-white/50 text-sm">{tier.period}</span>
                  </div>
                  <p className="text-white/50 text-sm">{tier.description}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="w-full text-center py-2 rounded-xl border border-white/20 text-white/50 text-sm font-medium">
                    Current plan
                  </div>
                ) : (
                  <Button
                    onClick={() => handleCta(tier)}
                    variant={tier.popular ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      !tier.popular && "border-white/20 text-white hover:bg-white/10"
                    )}
                    disabled={checkoutMutation.isPending}
                  >
                    {tier.cta}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add `/pricing` route in `client/src/App.tsx`**

Add import:
```typescript
import Pricing from "./pages/Pricing";
```

Add route inside `<Switch>`:
```tsx
<Route path={"/pricing"} component={Pricing} />
```

- [ ] **Step 3: Verify it compiles**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Pricing.tsx client/src/App.tsx
git commit -m "feat: add /pricing page with tier cards and Stripe checkout"
```

---

## Task 15: Frontend — Account page

**Files:**
- Create: `client/src/pages/Account.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create `client/src/pages/Account.tsx`**

```tsx
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", agency: "Agency" };
const LIMITS: Record<string, number | string> = { free: 3, pro: 30, agency: "Unlimited" };

export default function Account() {
  const [, navigate] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: sub, isLoading } = trpc.billing.getSubscription.useQuery(undefined, {
    enabled: !!user,
  });
  const portalMutation = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-white/85 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <button onClick={() => navigate("/threads")} className="font-display font-bold text-lg">
            WA Pitch Builder
          </button>
          <Button variant="outline" size="sm" onClick={() => navigate("/threads")}>
            Dashboard
          </Button>
        </div>
      </nav>

      <div className="container py-12 max-w-2xl">
        <h1 className="font-display text-2xl font-bold mb-8">Account & Billing</h1>

        {/* Past-due banner */}
        {sub?.subscriptionStatus === "past_due" && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Payment failed</p>
              <p className="text-sm text-red-700 mt-0.5">
                Your last payment failed. Please update your payment method to keep your subscription active.
              </p>
              <Button
                size="sm"
                variant="destructive"
                className="mt-3"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
              >
                Update payment method
              </Button>
            </div>
          </div>
        )}

        {/* Email verification banner */}
        {sub && !sub.emailVerified && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Please verify your email address. Check your inbox for a verification link.
            </p>
          </div>
        )}

        {/* Plan card */}
        <div className="rounded-2xl border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-0.5">Current plan</p>
              <p className="text-2xl font-bold font-display">{PLAN_LABELS[sub?.plan ?? "free"]}</p>
            </div>
            {sub?.subscriptionStatus === "active" && (
              <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                <CheckCircle2 className="w-4 h-4" />
                Active
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/50 mb-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">AI Generations</p>
              <p className="font-semibold">
                {sub?.genCount ?? 0} / {LIMITS[sub?.plan ?? "free"]}
              </p>
            </div>
            {sub?.genResetAt && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Resets on</p>
                <p className="font-semibold">
                  {new Date(sub.genResetAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {sub?.plan !== "agency" && (
              <Button onClick={() => navigate("/pricing")} className="flex-1">
                {sub?.plan === "free" ? "Upgrade to Pro" : "Upgrade to Agency"}
              </Button>
            )}
            {sub?.plan !== "free" && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
              >
                {portalMutation.isPending ? "Loading..." : "Manage subscription"}
              </Button>
            )}
          </div>
        </div>

        {/* Profile info */}
        <div className="rounded-2xl border p-6">
          <h2 className="font-semibold mb-4">Profile</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{user.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{user.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add `/account` route in `client/src/App.tsx`**

Add import:
```typescript
import Account from "./pages/Account";
```

Add route inside `<Switch>`:
```tsx
<Route path={"/account"} component={Account} />
```

- [ ] **Step 3: Verify it compiles**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Account.tsx client/src/App.tsx
git commit -m "feat: add /account page with plan info, portal link, past-due banner"
```

---

## Task 16: Frontend — UsageIndicator in Dashboard nav + feature lock UI

**Files:**
- Modify: `client/src/pages/Dashboard.tsx`
- Modify: `client/src/pages/Builder.tsx`

- [ ] **Step 1: Add `UsageIndicator` to Dashboard nav**

In `client/src/pages/Dashboard.tsx`, add import:
```typescript
import { UsageIndicator } from "@/components/UsageIndicator";
```

In the nav bar (the `<nav>` element), add `<UsageIndicator />` between the tab buttons and the user menu/logout area. The exact position depends on the current nav layout — place it in the right side of the nav.

- [ ] **Step 2: Add upgrade modal to Dashboard for thread limit**

In `client/src/pages/Dashboard.tsx`:

1. Add import: `import { UpgradeModal } from "@/components/UpgradeModal";`
2. Add state: `const [upgradeReason, setUpgradeReason] = useState<string | null>(null);`
3. In the `thread.create` mutation's `onError` callback, check for the `requires_plan:pro` message and set state:

```typescript
onError: (err) => {
  if (err.message === "requires_plan:pro") {
    setUpgradeReason("requires_plan:pro");
  } else {
    toast.error("Failed to create thread");
  }
},
```

4. Add the modal to the JSX:
```tsx
<UpgradeModal
  open={upgradeReason !== null}
  onClose={() => setUpgradeReason(null)}
  reason={upgradeReason ?? undefined}
/>
```

- [ ] **Step 3: Add upgrade modal to Builder for generation limit**

In `client/src/pages/Builder.tsx`:

1. Add import: `import { UpgradeModal } from "@/components/UpgradeModal";`
2. Add state: `const [upgradeReason, setUpgradeReason] = useState<string | null>(null);`
3. In the `ai.generateFlow` mutation's `onError` callback:

```typescript
onError: (err) => {
  if (err.message === "generation_limit_reached" || err.message?.startsWith("requires_plan:")) {
    setUpgradeReason(err.message);
  } else {
    toast.error("Generation failed. Please try again.");
  }
},
```

4. Add modal to JSX:
```tsx
<UpgradeModal
  open={upgradeReason !== null}
  onClose={() => setUpgradeReason(null)}
  reason={upgradeReason ?? undefined}
/>
```

- [ ] **Step 4: Dim and lock website crawl button in Builder**

In `client/src/pages/Builder.tsx`, find the website crawl button/section. Add this wrapping pattern:

```tsx
// Find the crawl button and wrap it:
<div className="relative">
  {userPlan === "free" && (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-[2px] cursor-pointer"
      onClick={() => setUpgradeReason("requires_plan:pro")}
    >
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Lock className="w-3 h-3" /> Pro feature
      </span>
    </div>
  )}
  {/* existing crawl UI */}
</div>
```

To get `userPlan`: query `trpc.billing.getSubscription` in the Builder component.

- [ ] **Step 5: Verify it compiles**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Dashboard.tsx client/src/pages/Builder.tsx
git commit -m "feat: add usage indicator, upgrade modals, and feature lock UI"
```

---

## Task 17: Frontend — forgot/reset password pages

**Files:**
- Modify: `client/src/pages/Login.tsx`
- Create: `client/src/pages/ResetPassword.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Add "Forgot password?" link to Login page**

In `client/src/pages/Login.tsx`, below the password input, add:

```tsx
<div className="text-right">
  <button
    type="button"
    className="text-xs text-muted-foreground hover:text-foreground underline"
    onClick={() => setMode("forgot")}
  >
    Forgot password?
  </button>
</div>
```

Add a `mode` state: `const [mode, setMode] = useState<"login" | "register" | "forgot">("login")`.

When `mode === "forgot"`, show a simple form with email input and a submit button that calls `POST /api/auth/forgot-password`. On success show "Check your email for a reset link."

- [ ] **Step 2: Create `client/src/pages/ResetPassword.tsx`**

```tsx
import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") ?? "";
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Reset failed"); return; }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-green-700 font-medium">
          Password updated! Redirecting to login…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="font-display text-2xl font-bold text-center">Reset your password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Set new password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add `/reset-password` route in `client/src/App.tsx`**

```typescript
import ResetPassword from "./pages/ResetPassword";
```

```tsx
<Route path={"/reset-password"} component={ResetPassword} />
```

- [ ] **Step 4: Verify it compiles**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Login.tsx client/src/pages/ResetPassword.tsx client/src/App.tsx
git commit -m "feat: forgot password flow and reset password page"
```

---

## Task 18: Add Pricing link to homepage nav

**Files:**
- Modify: `client/src/pages/Home.tsx`

- [ ] **Step 1: Add `/pricing` link to the homepage nav**

In `client/src/pages/Home.tsx`, find the nav and add a "Pricing" link:

```tsx
<a href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">
  Pricing
</a>
```

Place it alongside other nav links (Features, Templates, etc.).

- [ ] **Step 2: Verify and commit**

```bash
pnpm tsc --noEmit
git add client/src/pages/Home.tsx
git commit -m "feat: add pricing nav link to homepage"
```

---

## Post-implementation checklist

Before going live with payments:

- [ ] Create Stripe products + prices in Stripe Dashboard, copy price IDs to `.env`
- [ ] Set up Stripe webhook endpoint pointing to `https://yourdomain.com/api/stripe/webhook`, subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] Add production env vars to Railway: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_AGENCY`, `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`
- [ ] Verify domain in Resend and update `EMAIL_FROM` to use your domain
- [ ] Test full checkout flow end-to-end with Stripe test card `4242 4242 4242 4242`
- [ ] Test webhook events with `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Test generation limit enforcement on Free tier
- [ ] Test feature gate (crawl website) on Free tier
