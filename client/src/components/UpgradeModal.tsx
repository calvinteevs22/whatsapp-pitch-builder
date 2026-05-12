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
  reason?: string;
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
