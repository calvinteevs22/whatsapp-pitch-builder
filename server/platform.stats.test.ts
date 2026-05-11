import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@meta.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      country: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("platform.stats", () => {
  it("returns stats object with expected shape from public endpoint", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.platform.stats();

    expect(result).toHaveProperty("totalTemplates");
    expect(result).toHaveProperty("totalMetamates");
    expect(result).toHaveProperty("totalCountries");
    expect(result).toHaveProperty("countries");
    expect(typeof result.totalTemplates).toBe("number");
    expect(typeof result.totalMetamates).toBe("number");
    expect(typeof result.totalCountries).toBe("number");
    expect(Array.isArray(result.countries)).toBe(true);
  });

  it("returns non-negative numbers for all stats", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.platform.stats();

    expect(result.totalTemplates).toBeGreaterThanOrEqual(0);
    expect(result.totalMetamates).toBeGreaterThanOrEqual(0);
    expect(result.totalCountries).toBeGreaterThanOrEqual(0);
  });

  it("countries array length matches totalCountries", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.platform.stats();

    expect(result.countries.length).toBe(result.totalCountries);
  });
});

describe("platform.updateCountry", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.platform.updateCountry({ country: "Singapore" })
    ).rejects.toThrow();
  });

  it("accepts valid country string from authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.platform.updateCountry({ country: "Singapore" });

    expect(result).toEqual({ success: true });
  });

  it("rejects empty country string", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.platform.updateCountry({ country: "" })
    ).rejects.toThrow();
  });
});
