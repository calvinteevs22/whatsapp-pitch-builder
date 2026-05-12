import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", agency: "Agency" };
const PLAN_LIMITS: Record<string, number | string> = { free: 3, pro: 30, agency: "Unlimited" };

export default function Account() {
  const [, navigate] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: sub } = trpc.billing.getSubscription.useQuery(undefined, {
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
                {sub?.genCount ?? 0} / {PLAN_LIMITS[sub?.plan ?? "free"]}
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
