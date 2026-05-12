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
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
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
