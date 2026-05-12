import { sql } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import { getNextResetDate } from "./usage";

/**
 * Resets genCount for all users whose genResetAt has passed.
 * Runs automatically at midnight every day. The lazy per-request reset in
 * usage.ts handles individual users; this job cleans up inactive users in bulk.
 */
async function runGenerationReset(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const now = new Date();
    const result = await db.update(users)
      .set({ genCount: 0, genResetAt: getNextResetDate() })
      .where(sql`${users.genResetAt} IS NOT NULL AND ${users.genResetAt} <= ${now}`);
    const affected = (result[0] as any).affectedRows ?? 0;
    if (affected > 0) {
      console.log(`[ResetJob] Reset generation counts for ${affected} user(s)`);
    }
  } catch (err) {
    console.error("[ResetJob] Generation reset failed:", err);
  }
}

function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

export function startResetJobs(): void {
  // Run once at the next midnight, then every 24 hours
  const scheduleNext = () => {
    setTimeout(async () => {
      await runGenerationReset();
      setInterval(runGenerationReset, 24 * 60 * 60 * 1000);
    }, msUntilMidnight());
  };
  scheduleNext();
  console.log(`[ResetJob] Generation reset scheduled (next run in ${Math.round(msUntilMidnight() / 60000)} min)`);
}
