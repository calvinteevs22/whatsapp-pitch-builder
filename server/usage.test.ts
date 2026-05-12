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
