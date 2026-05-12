import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  CheckCircle2, Loader2, User, LogOut, BookOpen, Calculator,
  LayoutGrid, ChevronRight,
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
      <div className="min-h-screen flex items-center justify-center bg-[#0B1210]">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1210] text-white">

      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B1210]/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663344446488/YocM5kPJZcUQjCCGhq86Jj/whatsapp-logo_55bb387d.png" alt="WhatsApp" className="w-7 h-7" />
              <span className="font-semibold text-[15px] tracking-tight hidden sm:inline text-white">WhatsApp Pitch Builder</span>
            </div>
            {isAuthenticated && (
              <>
                <div className="h-5 w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-1 hidden sm:flex">
                  <MyThreadsDropdown />
                  <Button variant="ghost" size="sm" onClick={() => navigate("/templates")} className="text-sm text-white/60 hover:text-white hover:bg-white/5 h-8">
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Industry Templates
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/roi-calculator")} className="text-sm text-white/60 hover:text-white hover:bg-white/5 h-8">
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
                  <Button variant="ghost" size="sm" className="gap-2 h-8 text-white/70 hover:text-white hover:bg-white/5">
                    <div className="w-6 h-6 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#25D366]" />
                    </div>
                    <span className="text-sm hidden sm:inline">{user?.name || "User"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#111a17] border-white/10 text-white">
                  <DropdownMenuItem onClick={() => navigate("/threads")} className="sm:hidden text-white/70 hover:text-white focus:bg-white/5 focus:text-white">
                    <MessageSquare className="w-4 h-4 mr-2" /> My Threads
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/templates")} className="sm:hidden text-white/70 hover:text-white focus:bg-white/5 focus:text-white">
                    <BookOpen className="w-4 h-4 mr-2" /> Template Library
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/roi-calculator")} className="text-white/70 hover:text-white focus:bg-white/5 focus:text-white">
                    <Calculator className="w-4 h-4 mr-2" /> ROI Calculator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/api-docs")} className="text-white/70 hover:text-white focus:bg-white/5 focus:text-white">
                    <Globe className="w-4 h-4 mr-2" /> API Docs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { logout(); }} className="text-white/70 hover:text-white focus:bg-white/5 focus:text-white">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild className="bg-[#25D366] hover:bg-[#1da851] text-sm h-9 px-5 text-white font-medium">
                <a href={getLoginUrl()}>
                  Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        {/* Ambient glow effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#25D366]/10 rounded-full blur-[120px]" />
          <div className="absolute top-40 -left-20 w-[400px] h-[400px] bg-[#075E54]/15 rounded-full blur-[100px]" />
          <div className="absolute top-20 -right-20 w-[350px] h-[350px] bg-[#25D366]/8 rounded-full blur-[100px]" />
        </div>

        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 text-[#4ade80] text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
              Built for Meta Account Managers
            </div>

            <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] mb-5 text-white">
              Create WhatsApp Paid Messaging Demos{" "}
              <span className="bg-gradient-to-r from-[#25D366] to-[#4ade80] bg-clip-text text-transparent">in Seconds</span>
            </h1>

            <p className="text-base md:text-lg text-white/55 leading-relaxed max-w-2xl mx-auto mb-10">
              Stop spending hours building WhatsApp mockups manually. Describe your use case in plain English
              and get a pixel-perfect, interactive conversation flow instantly — ready to pitch to your clients.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              {isAuthenticated ? (
                <>
                  <Button
                    size="lg"
                    onClick={() => navigate("/templates")}
                    className="w-full sm:w-auto text-base h-12 px-7 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold shadow-lg shadow-[#25D366]/25"
                  >
                    <LayoutGrid className="w-4.5 h-4.5 mr-2" /> Browse Templates <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowBuildDialog(true)}
                    className="w-full sm:w-auto text-base h-12 px-7 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/25"
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> Custom Pitch
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" asChild className="w-full sm:w-auto text-base h-12 px-7 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold shadow-lg shadow-[#25D366]/25">
                    <a href={getLoginUrl()}>
                      <LayoutGrid className="w-4.5 h-4.5 mr-2" /> Browse Templates <ChevronRight className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base h-12 px-7 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25">
                    <a href={getLoginUrl()}>
                      <Sparkles className="w-4 h-4 mr-2" /> Custom Pitch
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof Stats ─── */}
      <section className="py-12 border-y border-white/[0.06] bg-white/[0.02]">
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
                <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{stat.value}</div>
                <div className="text-xs font-semibold text-white/70 mt-0.5">{stat.label}</div>
                <div className="text-[10px] text-white/35">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-14">
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white">Three Steps to a Perfect Pitch</h2>
            <p className="text-white/50 text-base max-w-xl mx-auto">
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
                color: "#4ade80",
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
                <div className="text-6xl font-black text-white/[0.06] absolute -top-2 -left-1 select-none">{item.step}</div>
                <div className="pt-12">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${item.color}18` }}>
                    <item.icon className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WhatsApp Paid Messaging Types ─── */}
      <section className="py-20 border-y border-white/[0.06] bg-white/[0.015]">
        <div className="container">
          <div className="text-center mb-14">
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white">Cover Every WhatsApp Messaging Use Case</h2>
            <p className="text-white/50 text-base max-w-2xl mx-auto">
              Build demos across all three WhatsApp Paid Messaging categories, each mapped to the business outcomes your clients care about
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                color: "#25D366",
                icon: Target,
                title: "Marketing Messages",
                subtitle: "Drive Sales & Customer Retention",
                items: ["Product launches & flash sales", "Personalized recommendations", "Re-engagement campaigns", "Loyalty program updates"],
                stat: { icon: TrendingUp, text: "Businesses see ", highlight: "45-60% open rates", suffix: " on marketing messages" },
              },
              {
                color: "#34B7F1",
                icon: Layers,
                title: "Utility Messages",
                subtitle: "Drive Operational Efficiency",
                items: ["Order confirmations & tracking", "Appointment reminders", "Payment receipts & invoices", "Shipping & delivery updates"],
                stat: { icon: Zap, text: "Reduces support tickets by ", highlight: "up to 35%", suffix: " with proactive updates" },
              },
              {
                color: "#fb923c",
                icon: Shield,
                title: "Authentication Messages",
                subtitle: "Enhance Security & Trust",
                items: ["One-time passcode (OTP) delivery", "Login verification", "Transaction confirmation", "Account recovery flows"],
                stat: { icon: Shield, text: "WhatsApp OTPs have ", highlight: "95%+ delivery rate", suffix: " vs SMS" },
              },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden hover:border-white/[0.12] hover:bg-white/[0.05] transition-all group">
                <div className="h-0.5" style={{ background: `linear-gradient(to right, ${card.color}, ${card.color}40)` }} />
                <div className="p-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${card.color}15` }}>
                    <card.icon className="w-6 h-6" style={{ color: card.color }} />
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-white">{card.title}</h3>
                  <p className="text-[10px] text-white/35 mb-4 font-medium uppercase tracking-widest">{card.subtitle}</p>
                  <ul className="space-y-2.5 text-sm text-white/55 mb-5">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: card.color }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 border-t border-white/[0.07]">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <card.stat.icon className="w-3.5 h-3.5 shrink-0" style={{ color: card.color }} />
                      <span>{card.stat.text}<strong className="text-white/70">{card.stat.highlight}</strong>{card.stat.suffix}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Template Quality Matters ─── */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 style={{ fontFamily: "var(--font-display)" }} className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white">Why Template Quality Matters</h2>
              <p className="text-white/50 text-base max-w-2xl mx-auto">
                The difference between a good and great WhatsApp template can mean 2-3x more conversions for your clients
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  metric: "2.5x higher CTR",
                  insight: "Templates with interactive buttons (quick replies, CTAs) see 2.5x more click-throughs than plain text messages.",
                  source: "Meta Business Messaging Data",
                  color: "#25D366",
                },
                {
                  metric: "40% better read rates",
                  insight: "Messages with rich media headers (images, videos) achieve 40% higher read rates compared to text-only templates.",
                  source: "WhatsApp Business Platform",
                  color: "#4ade80",
                },
                {
                  metric: "60% faster resolution",
                  insight: "Utility templates with structured flows reduce customer service resolution time by 60% through automated responses.",
                  source: "Industry Benchmark Report",
                  color: "#34B7F1",
                },
                {
                  metric: "3x conversion lift",
                  insight: "Personalized marketing templates that reference customer context see 3x higher conversion rates than generic broadcasts.",
                  source: "Conversational Commerce Study",
                  color: "#a78bfa",
                },
              ].map((item) => (
                <div key={item.metric} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:border-white/[0.12] transition-all">
                  <div className="text-2xl font-extrabold mb-2" style={{ color: item.color }}>{item.metric}</div>
                  <p className="text-sm text-white/55 leading-relaxed mb-3">{item.insight}</p>
                  <p className="text-[10px] text-white/25 uppercase tracking-wider font-medium">{item.source}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#075E54]/30 to-[#0a3d38]/50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#25D366]/10 rounded-full blur-[120px]" />
        </div>
        <div className="container text-center relative">
          <div className="max-w-2xl mx-auto">
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Pitch WhatsApp More Effectively?
            </h2>
            <p className="text-white/55 text-base mb-8 leading-relaxed">
              Create professional, interactive WhatsApp conversation demos in seconds.
              Show your clients exactly what their messaging experience will look like.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {isAuthenticated ? (
                <>
                  <Button size="lg" onClick={() => navigate("/templates")} className="text-base px-8 h-12 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold shadow-xl shadow-[#25D366]/25">
                    <LayoutGrid className="w-4.5 h-4.5 mr-2" /> Browse Templates <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setShowBuildDialog(true)} className="text-base px-8 h-12 text-white border-white/20 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/30">
                    <Sparkles className="w-4 h-4 mr-2" /> Custom Pitch
                  </Button>
                </>
              ) : (
                <Button size="lg" asChild className="text-base px-10 h-12 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold shadow-xl shadow-[#25D366]/25">
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
      <footer className="border-t border-white/[0.06] py-6 bg-[#0B1210]">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/35">
          <div className="flex items-center gap-2">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663344446488/YocM5kPJZcUQjCCGhq86Jj/whatsapp-logo_55bb387d.png" alt="WhatsApp" className="w-4 h-4" />
            <span className="font-medium text-white/60">WhatsApp Pitch Builder</span>
          </div>
          <p>Built for Meta Account Managers to pitch WhatsApp Paid Messaging</p>
        </div>
      </footer>

      {/* ─── Build Now Dialog ─── */}
      <Dialog open={showBuildDialog} onOpenChange={setShowBuildDialog}>
        <DialogContent className="sm:max-w-md bg-[#111a17] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-[#25D366]" />
              Create a Tailored Pitch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="build-name" className="text-white/70">Thread Name</Label>
              <Input
                id="build-name"
                placeholder="e.g., FoodArt Store Marketing Campaign"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuildNow()}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#25D366]/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-white/70">Industry</Label>
                <Select value={buildIndustry} onValueChange={setBuildIndustry}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111a17] border-white/10">
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind} className="text-white/70 focus:bg-white/10 focus:text-white">{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Message Type</Label>
                <Select value={buildType} onValueChange={setBuildType}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111a17] border-white/10">
                    {Object.entries(MESSAGE_TYPES).map(([key, t]) => (
                      <SelectItem key={key} value={key} className="text-white/70 focus:bg-white/10 focus:text-white">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-url" className="flex items-center gap-1.5 text-white/70">
                <Globe className="w-3.5 h-3.5 text-white/40" />
                Client Website URL
                <span className="text-xs text-white/35 font-normal">(optional)</span>
              </Label>
              <Input
                id="client-url"
                placeholder="e.g., https://www.clientbrand.com"
                value={buildClientUrl}
                onChange={(e) => setBuildClientUrl(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#25D366]/50"
              />
              <p className="text-xs text-white/35">AI will analyze the website to personalize your pitch with real products and branding</p>
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
              className="w-full h-11 bg-[#25D366] hover:bg-[#1da851] text-base text-white font-semibold"
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
