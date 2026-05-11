import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { useCountUp } from "@/hooks/useCountUp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Sparkles, ArrowRight, MessageSquare, Target, Layers, Shield,
  Zap, Globe, BarChart3, Clock, TrendingUp, Users,
  CheckCircle2, Loader2, User, LogOut, BookOpen, Plus, Hammer, Calculator,
  LayoutGrid, Wand2,
} from "lucide-react";
import { INDUSTRIES, MESSAGE_TYPES } from "@shared/types";
import MyThreadsDropdown from "@/components/MyThreadsDropdown";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SupportedLanguage } from "@/lib/translations";

export default function Home() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showBuildDialog, setShowBuildDialog] = useState(false);
  const [buildName, setBuildName] = useState("");
  const [buildIndustry, setBuildIndustry] = useState("");
  const [buildType, setBuildType] = useState<string>("marketing");
  const [buildClientUrl, setBuildClientUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [buildLanguage, setBuildLanguage] = useState<SupportedLanguage>("en");
  const { language: globalLanguage } = useLanguage();

  // Real-time platform stats
  const { data: platformStats } = trpc.platform.stats.useQuery(undefined, {
    staleTime: 60_000, // cache for 1 minute
    refetchOnWindowFocus: false,
  });

  // Animated count-up values
  const animatedTemplates = useCountUp(platformStats?.totalTemplates, 1400);
  const animatedMetamates = useCountUp(platformStats?.totalMetamates, 1000);
  const animatedCountries = useCountUp(platformStats?.totalCountries, 800);

  // Auto-detect and update country on login
  const updateCountry = trpc.platform.updateCountry.useMutation();
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const country = timezoneToCountry(tz);
      if (country) {
        updateCountry.mutate({ country });
      }
    } catch {}
  }, [isAuthenticated, user?.id]);

  const createThread = trpc.thread.create.useMutation();

  const handleBuildNow = async () => {
    if (!buildName.trim()) {
      toast.error("Please enter a name for your thread");
      return;
    }
    setIsCreating(true);
    try {
      const result = await createThread.mutateAsync({
        name: buildName.trim(),
        industry: buildIndustry || undefined,
        messageType: (buildType as "marketing" | "utility" | "authentication") || "marketing",
      });
      setShowBuildDialog(false);
      setBuildName("");
      setBuildIndustry("");
      setBuildType("marketing");
      setBuildClientUrl("");
      if (buildClientUrl.trim()) {
        const params = new URLSearchParams({
          businessUrl: buildClientUrl.trim(),
          prompt: `Build a personalized WhatsApp marketing flow for this business based on their website: ${buildClientUrl.trim()}`,
          autoGenerate: 'true',
          ...(buildLanguage !== 'en' ? { lang: buildLanguage } : {}),
        });
        navigate(`/builder/${result.uid}?${params.toString()}`);
      } else {
        const langParam = buildLanguage !== 'en' ? `?lang=${buildLanguage}` : '';
        navigate(`/builder/${result.uid}${langParam}`);
      }
    } catch (e) {
      toast.error("Failed to create thread");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663344446488/YocM5kPJZcUQjCCGhq86Jj/whatsapp-logo_55bb387d.png" alt="WhatsApp" className="w-7 h-7" />
              <span className="font-bold text-[15px] tracking-tight hidden sm:inline">WhatsApp Pitch Builder</span>
            </div>
            {isAuthenticated && (
              <>
                <div className="h-5 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-1 hidden sm:flex">
                  <MyThreadsDropdown />
                  <Button variant="ghost" size="sm" onClick={() => navigate("/templates")} className="text-sm text-muted-foreground hover:text-foreground h-8">
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Industry Templates
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/roi-calculator")} className="text-sm text-muted-foreground hover:text-foreground h-8">
                    <Calculator className="w-3.5 h-3.5 mr-1.5" /> ROI Calculator
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 h-8">
                    <div className="w-6 h-6 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#25D366]" />
                    </div>
                    <span className="text-sm hidden sm:inline">{user?.name || "User"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/threads")} className="sm:hidden">
                    <MessageSquare className="w-4 h-4 mr-2" /> My Threads
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/templates")} className="sm:hidden">
                    <BookOpen className="w-4 h-4 mr-2" /> Template Library
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/roi-calculator")}>
                    <Calculator className="w-4 h-4 mr-2" /> ROI Calculator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/api-docs")}>
                    <Globe className="w-4 h-4 mr-2" /> API Docs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { logout(); }}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild className="bg-[#25D366] hover:bg-[#1da851] text-sm h-9 px-5">
                <a href={getLoginUrl()}>
                  Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-16 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#075E54]/[0.03] via-transparent to-[#25D366]/[0.03]" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* ─── Live Usage Stats Ticker ─── */}
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              <Badge variant="secondary" className="text-xs font-semibold px-3 py-1.5 bg-[#25D366]/10 text-[#075E54] border-0 gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {platformStats ? (
                  <span><span className="font-extrabold tabular-nums">{animatedTemplates.toLocaleString()}</span> Demos Built</span>
                ) : (
                  <span className="animate-pulse">Loading...</span>
                )}
              </Badge>
              <Badge variant="secondary" className="text-xs font-semibold px-3 py-1.5 bg-[#075E54]/10 text-[#075E54] border-0 gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {platformStats ? (
                  <span>Used by <span className="font-extrabold tabular-nums">{animatedMetamates}</span> Metamates</span>
                ) : (
                  <span className="animate-pulse">Loading...</span>
                )}
              </Badge>
              <Badge variant="secondary" className="text-xs font-semibold px-3 py-1.5 bg-[#34B7F1]/10 text-[#075E54] border-0 gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {platformStats ? (
                  <span>Across <span className="font-extrabold tabular-nums">{animatedCountries}</span> Countries</span>
                ) : (
                  <span className="animate-pulse">Loading...</span>
                )}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] mb-5">
              Create WhatsApp Paid Messaging Demos
              <span className="text-[#25D366]"> in Seconds</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
              Stop spending hours building WhatsApp mockups manually. Describe your use case in plain English
              and get a pixel-perfect, interactive conversation flow instantly — ready to pitch to your clients.
            </p>

            {/* ─── Two Clean CTAs ─── */}
            <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
              {isAuthenticated ? (
                <>
                  <Button
                    size="lg"
                    onClick={() => navigate("/templates")}
                    className="w-full text-base h-13 px-8 bg-[#25D366] hover:bg-[#1da851] shadow-lg shadow-[#25D366]/20"
                  >
                    <LayoutGrid className="w-4.5 h-4.5 mr-2" /> Browse Industry Templates <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowBuildDialog(true)}
                    className="w-full text-base h-13 px-8"
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> Create a Tailored Pitch
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/roi-calculator")}
                    className="w-full text-base h-13 px-8"
                  >
                    <Calculator className="w-4 h-4 mr-2" /> ROI Calculator
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" asChild className="w-full text-base h-13 px-8 bg-[#25D366] hover:bg-[#1da851] shadow-lg shadow-[#25D366]/20">
                    <a href={getLoginUrl()}>
                      <LayoutGrid className="w-4.5 h-4.5 mr-2" /> Browse Industry Templates <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="w-full text-base h-13 px-8">
                    <a href={getLoginUrl()}>
                      <Sparkles className="w-4 h-4 mr-2" /> Create a Tailored Pitch
                    </a>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/roi-calculator")}
                    className="w-full text-base h-13 px-8"
                  >
                    <Calculator className="w-4 h-4 mr-2" /> ROI Calculator
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof Stats ─── */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: "98%", label: "Message Open Rate", sublabel: "vs 20% for email", icon: BarChart3 },
              { value: "3-5x", label: "Higher CTR", sublabel: "vs traditional channels", icon: TrendingUp },
              { value: "2B+", label: "Monthly Active Users", sublabel: "on WhatsApp globally", icon: Users },
              { value: "<30s", label: "Template Creation", sublabel: "with AI generation", icon: Clock },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-2">
                  <stat.icon className="w-5 h-5 text-[#25D366]" />
                </div>
                <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</div>
                <div className="text-xs font-semibold text-foreground mt-0.5">{stat.label}</div>
                <div className="text-[10px] text-muted-foreground">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Three Steps to a Perfect Pitch</h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Go from idea to interactive WhatsApp demo in under a minute
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Describe Your Use Case",
                desc: "Type what you need in plain English, or paste a client's website URL. Our AI extracts business context, products, and brand information automatically.",
                icon: MessageSquare,
                color: "#25D366",
              },
              {
                step: "02",
                title: "AI Generates the Flow",
                desc: "Get a complete, industry-aware conversation flow with the right message types, buttons, and customer responses — all in seconds.",
                icon: Sparkles,
                color: "#075E54",
              },
              {
                step: "03",
                title: "Share with Your Client",
                desc: "Preview the interactive simulation, fine-tune if needed, then share a link or present the pixel-perfect WhatsApp mockup directly.",
                icon: ArrowRight,
                color: "#34B7F1",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-black text-foreground/20 absolute -top-2 -left-1 select-none">{item.step}</div>
                <div className="pt-12">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${item.color}12` }}>
                    <item.icon className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WhatsApp Paid Messaging Types ─── */}
      <section className="py-20 bg-muted/20 border-y">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Cover Every WhatsApp Messaging Use Case</h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto">
              Build demos across all three WhatsApp Paid Messaging categories, each mapped to the business outcomes your clients care about
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Marketing */}
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-white overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#25D366] to-[#25D366]/60" />
              <CardContent className="pt-6 pb-5">
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-[#25D366]" />
                </div>
                <h3 className="font-bold text-lg mb-1">Marketing Messages</h3>
                <p className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wide">Drive Sales & Customer Retention</p>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {[
                    "Product launches & flash sales",
                    "Personalized recommendations",
                    "Re-engagement campaigns",
                    "Loyalty program updates",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className="w-3.5 h-3.5 text-[#25D366]" />
                    <span className="text-muted-foreground">Businesses see <strong className="text-foreground">45-60% open rates</strong> on marketing messages</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Utility */}
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-white overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#34B7F1] to-[#34B7F1]/60" />
              <CardContent className="pt-6 pb-5">
                <div className="w-12 h-12 rounded-xl bg-[#34B7F1]/10 flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6 text-[#34B7F1]" />
                </div>
                <h3 className="font-bold text-lg mb-1">Utility Messages</h3>
                <p className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wide">Drive Operational Efficiency</p>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {[
                    "Order confirmations & tracking",
                    "Appointment reminders",
                    "Payment receipts & invoices",
                    "Shipping & delivery updates",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#34B7F1] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="w-3.5 h-3.5 text-[#34B7F1]" />
                    <span className="text-muted-foreground">Reduces support tickets by <strong className="text-foreground">up to 35%</strong> with proactive updates</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Authentication */}
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-white overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#FF6B35] to-[#FF6B35]/60" />
              <CardContent className="pt-6 pb-5">
                <div className="w-12 h-12 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#FF6B35]" />
                </div>
                <h3 className="font-bold text-lg mb-1">Authentication Messages</h3>
                <p className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wide">Enhance Security & Trust</p>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {[
                    "One-time passcode (OTP) delivery",
                    "Login verification",
                    "Transaction confirmation",
                    "Account recovery flows",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#FF6B35] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs">
                    <Shield className="w-3.5 h-3.5 text-[#FF6B35]" />
                    <span className="text-muted-foreground">WhatsApp OTPs have <strong className="text-foreground">95%+ delivery rate</strong> vs SMS</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Why Better Templates Matter ─── */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Why Template Quality Matters</h2>
              <p className="text-muted-foreground text-base max-w-2xl mx-auto">
                The difference between a good and great WhatsApp template can mean 2-3x more conversions for your clients
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                {
                  metric: "2.5x higher CTR",
                  insight: "Templates with interactive buttons (quick replies, CTAs) see 2.5x more click-throughs than plain text messages.",
                  source: "Meta Business Messaging Data",
                },
                {
                  metric: "40% better read rates",
                  insight: "Messages with rich media headers (images, videos) achieve 40% higher read rates compared to text-only templates.",
                  source: "WhatsApp Business Platform",
                },
                {
                  metric: "60% faster resolution",
                  insight: "Utility templates with structured flows reduce customer service resolution time by 60% through automated responses.",
                  source: "Industry Benchmark Report",
                },
                {
                  metric: "3x conversion lift",
                  insight: "Personalized marketing templates that reference customer context see 3x higher conversion rates than generic broadcasts.",
                  source: "Conversational Commerce Study",
                },
              ].map((item) => (
                <Card key={item.metric} className="border shadow-sm">
                  <CardContent className="pt-5 pb-4">
                    <div className="text-2xl font-extrabold text-[#075E54] mb-2">{item.metric}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.insight}</p>
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">{item.source}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 bg-gradient-to-br from-[#075E54] to-[#0a3d38]">
        <div className="container text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Pitch WhatsApp More Effectively?
            </h2>
            <p className="text-white/70 text-base mb-8 leading-relaxed">
              Create professional, interactive WhatsApp conversation demos in seconds.
              Show your clients exactly what their messaging experience will look like.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {isAuthenticated ? (
                <>
                  <Button size="lg" onClick={() => navigate("/templates")} className="text-base px-8 h-12 bg-[#25D366] hover:bg-[#1da851] shadow-lg shadow-black/20">
                    <LayoutGrid className="w-4.5 h-4.5 mr-2" /> Browse Templates <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setShowBuildDialog(true)} className="text-base px-8 h-12 text-white border-white/30 hover:bg-white/10 hover:text-white">
                    <Sparkles className="w-4 h-4 mr-2" /> Create a Tailored Pitch
                  </Button>
                </>
              ) : (
                <Button size="lg" asChild className="text-base px-10 h-12 bg-[#25D366] hover:bg-[#1da851] shadow-lg shadow-black/20">
                  <a href={getLoginUrl()}>
                    Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t py-6 bg-white">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663344446488/YocM5kPJZcUQjCCGhq86Jj/whatsapp-logo_55bb387d.png" alt="WhatsApp" className="w-4 h-4" />
            <span className="font-medium text-foreground">WhatsApp Pitch Builder</span>
          </div>
          <p>Built for Meta Account Managers to pitch WhatsApp Paid Messaging</p>
        </div>
      </footer>

      {/* ─── Build Now Dialog ─── */}
      <Dialog open={showBuildDialog} onOpenChange={setShowBuildDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#25D366]" />
              Create a Tailored Pitch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="build-name">Thread Name</Label>
              <Input
                id="build-name"
                placeholder="e.g., FoodArt Store Marketing Campaign"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuildNow()}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select value={buildIndustry} onValueChange={setBuildIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Message Type</Label>
                <Select value={buildType} onValueChange={setBuildType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MESSAGE_TYPES).map(([key, t]) => (
                      <SelectItem key={key} value={key}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-url" className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Client Website URL
                <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="client-url"
                placeholder="e.g., https://www.clientbrand.com"
                value={buildClientUrl}
                onChange={(e) => setBuildClientUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">AI will analyze the website to personalize your pitch with real products and branding</p>
            </div>
            <div className="space-y-1.5">
              <LanguageSelector
                value={buildLanguage}
                onChange={setBuildLanguage}
                label="Conversation Language"
                hint="The AI-generated WhatsApp conversation will be in this language"
              />
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-[10px]">🆕</span>
                <span className="text-[10px] text-[#25D366] font-medium">Now supporting 12 languages including Hindi, Urdu, Chinese, Portuguese, Spanish & more</span>
              </div>
            </div>
            <Button
              onClick={handleBuildNow}
              disabled={isCreating || !buildName.trim()}
              className="w-full h-11 bg-[#25D366] hover:bg-[#1da851] text-base"
            >
              {isCreating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><ArrowRight className="w-4 h-4 mr-2" /> Create & Start Building</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* First-time user onboarding */}
      {isAuthenticated && (
        <OnboardingOverlay
          onBrowseTemplates={() => navigate("/templates")}
          onCreateTailored={() => setShowBuildDialog(true)}
        />
      )}
    </div>
  );
}

/** Map IANA timezone to country name */
function timezoneToCountry(tz: string): string | null {
  const map: Record<string, string> = {
    'Asia/Singapore': 'Singapore', 'Asia/Kuala_Lumpur': 'Malaysia',
    'Asia/Jakarta': 'Indonesia', 'Asia/Makassar': 'Indonesia',
    'Asia/Manila': 'Philippines', 'Asia/Hong_Kong': 'Hong Kong',
    'Asia/Bangkok': 'Thailand', 'Asia/Kolkata': 'India', 'Asia/Calcutta': 'India',
    'Asia/Seoul': 'South Korea', 'Asia/Taipei': 'Taiwan',
    'Asia/Ho_Chi_Minh': 'Vietnam', 'Asia/Saigon': 'Vietnam',
    'Asia/Tokyo': 'Japan', 'Asia/Shanghai': 'China', 'Asia/Chongqing': 'China',
    'Australia/Sydney': 'Australia', 'Australia/Melbourne': 'Australia',
    'Australia/Brisbane': 'Australia', 'Australia/Perth': 'Australia',
    'Pacific/Auckland': 'New Zealand',
    'America/New_York': 'United States', 'America/Chicago': 'United States',
    'America/Denver': 'United States', 'America/Los_Angeles': 'United States',
    'America/Sao_Paulo': 'Brazil', 'America/Mexico_City': 'Mexico',
    'America/Argentina/Buenos_Aires': 'Argentina', 'America/Bogota': 'Colombia',
    'Europe/London': 'United Kingdom', 'Europe/Dublin': 'Ireland',
    'Europe/Paris': 'France', 'Europe/Berlin': 'Germany',
    'Europe/Rome': 'Italy', 'Europe/Madrid': 'Spain',
    'Europe/Amsterdam': 'Netherlands', 'Europe/Istanbul': 'Turkey',
    'Europe/Stockholm': 'Sweden', 'Europe/Zurich': 'Switzerland',
    'Europe/Warsaw': 'Poland', 'Europe/Lisbon': 'Portugal',
    'Africa/Lagos': 'Nigeria', 'Africa/Johannesburg': 'South Africa',
    'Africa/Cairo': 'Egypt', 'Africa/Nairobi': 'Kenya',
    'Asia/Dubai': 'UAE', 'Asia/Riyadh': 'Saudi Arabia',
    'Asia/Karachi': 'Pakistan', 'Asia/Dhaka': 'Bangladesh',
  };
  return map[tz] || null;
}
