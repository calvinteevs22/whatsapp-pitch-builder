import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { UpgradeModal } from "./UpgradeModal";
import { cn } from "@/lib/utils";

// Inline limits to keep server code out of client bundle
const PLAN_LIMITS: Record<string, number> = { free: 3, pro: 30 };

export function UsageIndicator() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { data } = trpc.billing.getSubscription.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  if (!data) return null;
  const { plan, genCount } = data;
  if (plan === "agency") return null; // unlimited

  const limit = PLAN_LIMITS[plan] ?? 3;
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
