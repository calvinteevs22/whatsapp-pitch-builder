import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.name).toBe("Test User 1");
    expect(result?.email).toBe("test1@example.com");
  });
});

describe("thread operations", () => {
  it("thread.create requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.thread.create({
        name: "Test Thread",
        messageType: "marketing",
      })
    ).rejects.toThrow();
  });

  it("thread.create validates input", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.thread.create({
        name: "",
        messageType: "marketing",
      })
    ).rejects.toThrow();
  });

  it("thread.list requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.thread.list()).rejects.toThrow();
  });

  it("thread.get requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.thread.get({ uid: "nonexistent" })
    ).rejects.toThrow();
  });

  it("thread.delete requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.thread.delete({ uid: "test-uid" })
    ).rejects.toThrow();
  });

  it("thread.toggleShare requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.thread.toggleShare({ uid: "test-uid" })
    ).rejects.toThrow();
  });
});

describe("message operations", () => {
  it("message.create requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.message.create({
        threadUid: "test-uid",
        direction: "outbound",
        contentType: "text",
        content: { type: "text", text: "Hello" },
      })
    ).rejects.toThrow();
  });

  it("message.update requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.message.update({
        id: 1,
        content: { type: "text", text: "Updated" },
      })
    ).rejects.toThrow();
  });

  it("message.delete requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.message.delete({ id: 1 })
    ).rejects.toThrow();
  });
});

describe("AI operations", () => {
  it("ai.generateFlow requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ai.generateFlow({
        prompt: "Create a marketing flow",
        messageType: "marketing",
      })
    ).rejects.toThrow();
  });

  it("ai.crawlWebsite requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ai.crawlWebsite({ url: "https://example.com" })
    ).rejects.toThrow();
  });

  it("ai.generateFlow validates prompt is not empty", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ai.generateFlow({
        prompt: "",
        messageType: "marketing",
      })
    ).rejects.toThrow();
  });

  it("ai.crawlWebsite validates URL format", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ai.crawlWebsite({ url: "not-a-url" })
    ).rejects.toThrow();
  });
});

describe("useCase operations", () => {
  it("useCase.list is publicly accessible", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw - public procedure
    const result = await caller.useCase.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("useCase.list accepts industry filter", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.useCase.list({ industry: "E-Commerce" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("useCase.list accepts messageType filter", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.useCase.list({ messageType: "marketing" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("shared thread", () => {
  it("thread.getShared is publicly accessible", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Should throw NOT_FOUND for invalid token, not UNAUTHORIZED
    await expect(
      caller.thread.getShared({ token: "nonexistent-token" })
    ).rejects.toThrow("Shared thread not found");
  });
});
