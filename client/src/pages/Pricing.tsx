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
              className="border-white/20 text-white hover:bg-white/10 bg-transparent">
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
                      !tier.popular && "border-white/20 text-white hover:bg-white/10 bg-transparent"
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
