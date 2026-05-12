import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  MessageSquare, Target, Layers, Shield,
  ShoppingCart, Heart, Utensils, Landmark, Plane, GraduationCap,
  Home as HomeIcon, Car, Store, Cpu, Sparkles, ArrowRight, Loader2,
  User, LogOut, Search, X, ChevronDown, LayoutGrid, Package,
  Tv, Truck, ShieldCheck, Phone, Filter, Calculator, Globe, BookOpen,
  Crosshair, Users, Megaphone, BarChart3, Info, ChevronRight, Check, Clock,
  Link2, ChevronUp, ExternalLink
} from "lucide-react";
import { MESSAGE_TYPES, INDUSTRIES } from "@shared/types";
import { TEMPLATE_CATALOG, ECOMMERCE_SUB_VERTICALS, REAL_ESTATE_SUB_VERTICALS, HEALTHCARE_SUB_VERTICALS, type TemplateUseCase } from "@shared/templateCatalog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { templateBusinessContext, type TemplateBusinessContext } from "@shared/templateBusinessContext";
import MyThreadsDropdown from "@/components/MyThreadsDropdown";
import { LanguageSelector } from "@/components/LanguageSelector";
import type { SupportedLanguage } from "@/lib/translations";
import { Progress } from "@/components/ui/progress";

const industryIcons: Record<string, any> = {
  "E-Commerce": ShoppingCart,
  "Healthcare": Heart,
  "Food & Beverage": Utensils,
  "Finance & Banking": Landmark,
  "Travel & Hospitality": Plane,
  "Education": GraduationCap,
  "Real Estate": HomeIcon,
  "Automotive": Car,
  "Retail": Store,
  "Technology": Cpu,
  "Beauty & Wellness": Sparkles,
  "Entertainment": Tv,
  "Logistics": Truck,
  "Insurance": ShieldCheck,
  "Telecommunications": Phone,
};

const messageTypeIcons: Record<string, any> = {
  marketing: Target,
  utility: Layers,
  authentication: Shield,
};

export default function Samples() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialIndustry = urlParams.get("industry") || "all";
  const [selectedIndustry, setSelectedIndustry] = useState<string>(initialIndustry);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [conversationLanguage, setConversationLanguage] = useState<SupportedLanguage>("en");
  const [contextTemplate, setContextTemplate] = useState<TemplateUseCase | null>(null);
  // Sub-vertical selection dialog for E-Commerce, Real Estate, Healthcare templates
  const [subVerticalDialogOpen, setSubVerticalDialogOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<TemplateUseCase | null>(null);
  const [selectedSubVertical, setSelectedSubVertical] = useState<string>("");
  // Client website URL for personalization
  const [clientWebsiteUrl, setClientWebsiteUrl] = useState<string>("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  // Personalization dialog for non-sub-vertical templates
  const [personalizeDialogOpen, setPersonalizeDialogOpen] = useState(false);

  // Progress overlay state
  const [generationProgress, setGenerationProgress] = useState<{
    active: boolean;
    step: number;
    templateTitle: string;
    startTime: number;
    elapsed: number;
  }>({ active: false, step: 0, templateTitle: "", startTime: 0, elapsed: 0 });
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const PROGRESS_STEPS_DEFAULT = [
    { label: "Creating thread", description: "Setting up your conversation workspace...", pct: 10 },
    { label: "Generating conversation", description: "AI is crafting your WhatsApp conversation flow...", pct: 40 },
    { label: "Generating images", description: "Creating product visuals and media assets...", pct: 75 },
    { label: "Finalizing", description: "Saving messages and preparing your thread...", pct: 95 },
    { label: "Done!", description: "Redirecting to your conversation builder...", pct: 100 },
  ];

  const PROGRESS_STEPS_WITH_CRAWL = [
    { label: "Creating thread", description: "Setting up your conversation workspace...", pct: 8 },
    { label: "Crawling website", description: "Extracting products, images, and business context...", pct: 25 },
    { label: "Generating conversation", description: "AI is crafting a personalized WhatsApp flow...", pct: 50 },
    { label: "Generating images", description: "Using real product images from the website...", pct: 75 },
    { label: "Finalizing", description: "Saving messages and preparing your thread...", pct: 95 },
    { label: "Done!", description: "Redirecting to your conversation builder...", pct: 100 },
  ];

  // Dynamic progress steps based on whether URL was provided
  const [useCrawlSteps, setUseCrawlSteps] = useState(false);
  const PROGRESS_STEPS = useCrawlSteps ? PROGRESS_STEPS_WITH_CRAWL : PROGRESS_STEPS_DEFAULT;

  const startProgress = useCallback((templateTitle: string) => {
    const now = Date.now();
    setGenerationProgress({ active: true, step: 0, templateTitle, startTime: now, elapsed: 0 });
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setGenerationProgress(prev => ({ ...prev, elapsed: Math.floor((Date.now() - prev.startTime) / 1000) }));
    }, 1000);
  }, []);

  const advanceProgress = useCallback((step: number) => {
    setGenerationProgress(prev => ({ ...prev, step }));
  }, []);

  const stopProgress = useCallback(() => {
    if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null; }
    setGenerationProgress(prev => ({ ...prev, active: false }));
  }, []);

  useEffect(() => {
    return () => { if (progressTimerRef.current) clearInterval(progressTimerRef.current); };
  }, []);

  const createThread = trpc.thread.create.useMutation();
  const generateFlow = trpc.ai.generateFlow.useMutation();
  const crawlWebsite = trpc.ai.crawlWebsite.useMutation();

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let results = TEMPLATE_CATALOG;

    if (selectedIndustry !== "all") {
      results = results.filter(t => t.industry === selectedIndustry);
    }

    if (selectedType !== "all") {
      results = results.filter(t => t.messageType === selectedType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    return results;
  }, [selectedIndustry, selectedType, searchQuery]);

  // Category sort order: Marketing first, Utility second, Authentication last
  const CATEGORY_ORDER: Record<string, number> = { marketing: 0, utility: 1, authentication: 2 };

  // Group by industry for display
  const groupedByIndustry = useMemo(() => {
    const groups: Record<string, TemplateUseCase[]> = {};
    filteredTemplates.forEach(t => {
      if (!groups[t.industry]) groups[t.industry] = [];
      groups[t.industry].push(t);
    });
    // Sort templates within each group: by category order, then alphabetically by title
    Object.values(groups).forEach(templates => {
      templates.sort((a, b) => {
        const catDiff = (CATEGORY_ORDER[a.messageType] ?? 9) - (CATEGORY_ORDER[b.messageType] ?? 9);
        if (catDiff !== 0) return catDiff;
        return a.title.localeCompare(b.title);
      });
    });
    // Sort industries alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredTemplates]);

  // Stats
  const stats = useMemo(() => {
    const byType = { marketing: 0, utility: 0, authentication: 0 };
    filteredTemplates.forEach(t => byType[t.messageType]++);
    return byType;
  }, [filteredTemplates]);

  // Industries that support sub-vertical selection
  const SUB_VERTICAL_INDUSTRIES = ["E-Commerce", "Real Estate", "Healthcare"];

  // Get the sub-vertical options for the pending template's industry
  const getSubVerticalOptions = (industry: string): string[] => {
    switch (industry) {
      case "E-Commerce": return ECOMMERCE_SUB_VERTICALS as unknown as string[];
      case "Real Estate": return REAL_ESTATE_SUB_VERTICALS as unknown as string[];
      case "Healthcare": return HEALTHCARE_SUB_VERTICALS as unknown as string[];
      default: return [];
    }
  };

  // Get the label for the sub-vertical selector based on industry
  const getSubVerticalLabel = (industry: string): { title: string; description: string; selectLabel: string; hint: string } => {
    switch (industry) {
      case "E-Commerce": return {
        title: "Choose a product category",
        description: "Select what type of e-commerce business this template is for. The AI will tailor the conversation flow with relevant products, pricing, and messaging for your chosen category.",
        selectLabel: "Product Category",
        hint: "The AI will generate product names, prices, and messaging specific to this category.",
      };
      case "Real Estate": return {
        title: "Choose a property type",
        description: "Select what type of real estate business this template is for. The AI will tailor the conversation with relevant property types, pricing, and terminology.",
        selectLabel: "Property Type",
        hint: "The AI will generate property details, pricing, and messaging specific to this segment.",
      };
      case "Healthcare": return {
        title: "Choose a medical specialty",
        description: "Select what type of healthcare practice this template is for. The AI will tailor the conversation with relevant services, pricing, and clinical terminology.",
        selectLabel: "Medical Specialty",
        hint: "The AI will generate services, pricing, and clinical details specific to this specialty.",
      };
      default: return {
        title: "Choose a sub-category",
        description: "Select a sub-category to tailor the conversation.",
        selectLabel: "Sub-Category",
        hint: "The AI will tailor the conversation for this sub-category.",
      };
    }
  };

  // When a template is selected, show personalization dialog
  const handleUseSample = async (sample: TemplateUseCase) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    setPendingTemplate(sample);
    setClientWebsiteUrl("");
    setShowUrlInput(false);

    // For industries with sub-verticals, show the sub-vertical dialog (which now includes URL input)
    if (SUB_VERTICAL_INDUSTRIES.includes(sample.industry)) {
      setSelectedSubVertical("");
      setSubVerticalDialogOpen(true);
      return;
    }

    // For other templates, show the personalization dialog
    setPersonalizeDialogOpen(true);
  };

  // Execute the actual template generation (called directly or after sub-vertical/personalization selection)
  const executeTemplateGeneration = async (sample: TemplateUseCase, subVertical?: string, businessUrl?: string) => {
    setLoadingId(sample.id);
    const hasCrawl = !!businessUrl;
    setUseCrawlSteps(hasCrawl);
    startProgress(sample.title);

    try {
      // Step 0: Creating thread
      advanceProgress(0);
      const thread = await createThread.mutateAsync({
        name: sample.title,
        industry: sample.industry,
        messageType: sample.messageType,
        ...(businessUrl ? { businessUrl } : {}),
      });

      if (hasCrawl) {
        // Step 1: Crawling website — do this as a SEPARATE step (like the tailored pitch flow)
        // This ensures we get the full business profile with products/images BEFORE generating
        advanceProgress(1);
        let businessProfile: {
          businessName: string;
          industry: string;
          description: string;
          tagline?: string;
          brandTone?: string;
          logoUrl?: string;
          heroImageUrl?: string;
          products?: Array<{ name: string; description: string; price: string; imageUrl: string; category: string }>;
          services?: Array<{ name: string; description: string; price: string; imageUrl: string; category: string }>;
        } | undefined;

        try {
          const crawlResult = await crawlWebsite.mutateAsync({ url: businessUrl });
          const hasProducts = (crawlResult.products?.length || 0) > 0 || (crawlResult.services?.length || 0) > 0;
          if (hasProducts) {
            businessProfile = {
              businessName: crawlResult.businessName || sample.title,
              industry: crawlResult.industry || sample.industry,
              description: crawlResult.description || "",
              tagline: crawlResult.tagline || undefined,
              brandTone: crawlResult.brandTone || undefined,
              logoUrl: crawlResult.logoUrl || undefined,
              heroImageUrl: crawlResult.heroImageUrl || undefined,
              products: crawlResult.products,
              services: crawlResult.services,
            };
            console.log(`[Templates] Crawl extracted ${crawlResult.products?.length || 0} products, ${crawlResult.services?.length || 0} services`);
          } else {
            console.log(`[Templates] Crawl returned no products/services, proceeding with URL-only fallback`);
          }
        } catch (crawlErr) {
          console.warn(`[Templates] Website crawl failed, proceeding with URL-only fallback:`, crawlErr);
          toast.info("Couldn't fully extract website data — generating with available context", { duration: 3000 });
        }

        // Step 2: Generating conversation with the full business profile
        advanceProgress(2);
        const imageStepTimer = setTimeout(() => advanceProgress(3), 8000);

        const genResult = await generateFlow.mutateAsync({
          prompt: sample.prompt,
          industry: sample.industry,
          subVertical: subVertical || undefined,
          messageType: sample.messageType,
          threadUid: thread.uid,
          // Pass the full business profile (like the tailored pitch flow) instead of just businessUrl
          // This ensures the server uses pre-crawled data with validated product images
          ...(businessProfile ? { businessProfile } : { businessUrl }),
          ...(conversationLanguage !== 'en' ? { language: conversationLanguage } : {}),
        });

        clearTimeout(imageStepTimer);

        // Step 4: Finalizing
        advanceProgress(4);

        // Store saved messages
        if (genResult.savedMessages && Array.isArray(genResult.savedMessages)) {
          try {
            sessionStorage.setItem(`thread-messages-${thread.uid}`, JSON.stringify(genResult.savedMessages));
          } catch (e) { /* fallback to refetch */ }
        }

        // Step 5: Done
        advanceProgress(5);
      } else {
        // Step 1: Generating conversation (includes AI + image generation on server)
        advanceProgress(1);

        // Simulate step 2 (images) after a delay since server does both conversation + images synchronously
        const imageStepTimer = setTimeout(() => advanceProgress(2), 8000);

        const genResult = await generateFlow.mutateAsync({
          prompt: sample.prompt,
          industry: sample.industry,
          subVertical: subVertical || undefined,
          messageType: sample.messageType,
          threadUid: thread.uid,
          ...(conversationLanguage !== 'en' ? { language: conversationLanguage } : {}),
        });

        clearTimeout(imageStepTimer);

        // Step 3: Finalizing
        advanceProgress(3);

        // Store saved messages
        if (genResult.savedMessages && Array.isArray(genResult.savedMessages)) {
          try {
            sessionStorage.setItem(`thread-messages-${thread.uid}`, JSON.stringify(genResult.savedMessages));
          } catch (e) { /* fallback to refetch */ }
        }

        // Step 4: Done
        advanceProgress(4);
      }

      await new Promise(r => setTimeout(r, 600));

      stopProgress();
      toast.success(businessUrl ? "Personalized template created!" : "Template created!", { id: "sample-create" });
      navigate(`/builder/${thread.uid}${conversationLanguage !== 'en' ? `?lang=${conversationLanguage}` : ''}`);
    } catch (error) {
      stopProgress();
      toast.error("Failed to create template. Please try again.", { id: "sample-create" });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate(isAuthenticated ? "/threads" : "/")}>
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663344446488/YocM5kPJZcUQjCCGhq86Jj/whatsapp-logo_55bb387d.png" alt="WhatsApp" className="w-7 h-7" />
              <span className="font-semibold text-[15px] tracking-tight hidden sm:inline">WhatsApp Pitch Builder</span>
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-1">
              {isAuthenticated && <MyThreadsDropdown />}
              <Button variant="ghost" size="sm" className="text-sm text-[#25D366] font-medium h-8 bg-[#25D366]/5">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Industry Templates
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/roi-calculator")} className="text-sm text-muted-foreground hover:text-foreground h-8">
                <Calculator className="w-3.5 h-3.5 mr-1.5" /> ROI Calculator
              </Button>
            </div>
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
                  <DropdownMenuItem onClick={() => navigate("/api-docs")}>
                    <Globe className="w-4 h-4 mr-2" /> API Docs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { logout(); navigate("/"); }}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild className="bg-[#25D366] hover:bg-[#1da851] h-8">
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="border-b bg-gradient-to-b from-[#f0fdf4] to-transparent">
        <div className="container py-7 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#25D366] bg-[#25D366]/8 px-2.5 py-1 rounded-full border border-[#25D366]/20 mb-3">
                <BookOpen className="w-3 h-3" />
                Template Library
              </div>
              <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-bold tracking-tight mb-1">Industry Use Case Templates</h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                {TEMPLATE_CATALOG.length} ready-made templates across {INDUSTRIES.length} industries — spot whitespace opportunities and pitch new WhatsApp use cases to your clients.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366]/10 border border-[#25D366]/20">
                <Target className="w-3 h-3 text-[#25D366]" />
                <span className="font-semibold text-[#25D366]">{TEMPLATE_CATALOG.filter(t => t.messageType === "marketing").length}</span>
                <span className="text-[#25D366]/70">Marketing</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#34B7F1]/10 border border-[#34B7F1]/20">
                <Layers className="w-3 h-3 text-[#34B7F1]" />
                <span className="font-semibold text-[#34B7F1]">{TEMPLATE_CATALOG.filter(t => t.messageType === "utility").length}</span>
                <span className="text-[#34B7F1]/70">Utility</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fb923c]/10 border border-[#fb923c]/20">
                <Shield className="w-3 h-3 text-[#fb923c]" />
                <span className="font-semibold text-[#fb923c]">{TEMPLATE_CATALOG.filter(t => t.messageType === "authentication").length}</span>
                <span className="text-[#fb923c]/70">Auth</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-sm border-b">
        <div className="container py-3 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Industry filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 min-w-[180px] justify-between">
                  <div className="flex items-center gap-2">
                    {selectedIndustry !== "all" ? (
                      <>
                        {(() => { const Icon = industryIcons[selectedIndustry] || LayoutGrid; return <Icon className="w-3.5 h-3.5" />; })()}
                        <span className="text-xs">{selectedIndustry}</span>
                      </>
                    ) : (
                      <>
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="text-xs">All Industries</span>
                      </>
                    )}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
                <DropdownMenuItem onClick={() => setSelectedIndustry("all")} className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  <span>All Industries</span>
                  <Badge variant="secondary" className="ml-auto text-[10px] h-4">{TEMPLATE_CATALOG.length}</Badge>
                </DropdownMenuItem>
                <div className="h-px bg-border my-1" />
                {INDUSTRIES.map(industry => {
                  const Icon = industryIcons[industry] || MessageSquare;
                  const count = TEMPLATE_CATALOG.filter(t => t.industry === industry).length;
                  return (
                    <DropdownMenuItem key={industry} onClick={() => setSelectedIndustry(industry)} className="gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{industry}</span>
                      <Badge variant="secondary" className="ml-auto text-[10px] h-4">{count}</Badge>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Message type filter pills */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedType("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedType === "all"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All Types ({filteredTemplates.length})
              </button>
              {(Object.entries(MESSAGE_TYPES) as [string, typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES]][]).map(([key, val]) => {
                const Icon = messageTypeIcons[key];
                const count = key === "marketing" ? stats.marketing : key === "utility" ? stats.utility : stats.authentication;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedType(selectedType === key ? "all" : key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      selectedType === key
                        ? "text-white"
                        : "text-gray-600 hover:opacity-80"
                    }`}
                    style={{
                      backgroundColor: selectedType === key ? val.color : `${val.color}15`,
                      color: selectedType === key ? "white" : val.color,
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {val.label.replace(" Messages", "")} ({count})
                  </button>
                );
              })}
            </div>

            {/* Language selector */}
            <LanguageSelector
              value={conversationLanguage}
              onChange={setConversationLanguage}
              compact
            />

            {/* Search */}
            <div className="relative ml-auto w-full sm:w-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs w-full sm:w-56"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>



          {/* Active filter badges */}
          {(selectedIndustry !== "all" || selectedType !== "all" || searchQuery) && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-muted-foreground">Active filters:</span>
              {selectedIndustry !== "all" && (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => setSelectedIndustry("all")}>
                  {selectedIndustry} <X className="w-2.5 h-2.5" />
                </Badge>
              )}
              {selectedType !== "all" && (
                <Badge
                  variant="secondary"
                  className="text-[10px] h-5 gap-1 cursor-pointer hover:bg-destructive/10"
                  onClick={() => setSelectedType("all")}
                  style={{ backgroundColor: `${MESSAGE_TYPES[selectedType as keyof typeof MESSAGE_TYPES].color}15`, color: MESSAGE_TYPES[selectedType as keyof typeof MESSAGE_TYPES].color }}
                >
                  {MESSAGE_TYPES[selectedType as keyof typeof MESSAGE_TYPES].label} <X className="w-2.5 h-2.5" />
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => setSearchQuery("")}>
                  "{searchQuery}" <X className="w-2.5 h-2.5" />
                </Badge>
              )}
              <button
                onClick={() => { setSelectedIndustry("all"); setSelectedType("all"); setSearchQuery(""); }}
                className="text-[10px] text-muted-foreground hover:text-foreground underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Template Grid - Grouped by Industry */}
      <div className="container py-6 max-w-7xl">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No templates match your filters.</p>
            <Button
              variant="link"
              size="sm"
              className="text-xs mt-1"
              onClick={() => { setSelectedIndustry("all"); setSelectedType("all"); setSearchQuery(""); }}
            >
              Clear all filters
            </Button>
          </div>
        ) : selectedIndustry !== "all" ? (
          // Single industry view - sorted by category then alphabetical
          <div>
            <div className="flex items-center gap-3 mb-4">
              {(() => { const Icon = industryIcons[selectedIndustry] || LayoutGrid; return <Icon className="w-5 h-5 text-[#25D366]" />; })()}
              <h2 className="text-lg font-bold">{selectedIndustry}</h2>
              <Badge variant="secondary" className="text-xs">{filteredTemplates.length} templates</Badge>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...filteredTemplates].sort((a, b) => {
                const catDiff = (CATEGORY_ORDER[a.messageType] ?? 9) - (CATEGORY_ORDER[b.messageType] ?? 9);
                if (catDiff !== 0) return catDiff;
                return a.title.localeCompare(b.title);
              }).map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  loading={loadingId === template.id}
                  disabled={loadingId !== null}
                  onUse={handleUseSample}
                  onViewContext={setContextTemplate}
                />
              ))}
            </div>
          </div>
        ) : (
          // All industries view - grouped
          <div className="space-y-8">
            {groupedByIndustry.map(([industry, templates]) => {
              const Icon = industryIcons[industry] || MessageSquare;
              return (
                <div key={industry}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#25D366]" />
                    </div>
                    <h2 className="text-base font-bold">{industry}</h2>
                    <Badge variant="secondary" className="text-[10px] h-4">{templates.length}</Badge>
                    <button
                      onClick={() => setSelectedIndustry(industry)}
                      className="text-[10px] text-[#25D366] hover:underline ml-auto"
                    >
                      View all {industry} templates →
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {templates.map(template => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        loading={loadingId === template.id}
                        disabled={loadingId !== null}
                        onUse={handleUseSample}
                        onViewContext={setContextTemplate}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sub-Vertical Selection Dialog (E-Commerce, Real Estate, Healthcare) — now with URL input */}
      <Dialog open={subVerticalDialogOpen} onOpenChange={(v) => { if (!v) { setSubVerticalDialogOpen(false); setPendingTemplate(null); setShowUrlInput(false); setClientWebsiteUrl(""); } }}>
        <DialogContent className="max-w-md">
          {pendingTemplate && (() => {
            const labels = getSubVerticalLabel(pendingTemplate.industry);
            const options = getSubVerticalOptions(pendingTemplate.industry);
            const urlTrimmed = clientWebsiteUrl.trim();
            const isValidUrl = urlTrimmed.length === 0 || /^https?:\/\/.+\..+/.test(urlTrimmed);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base">{labels.title}</DialogTitle>
                  <DialogDescription className="text-xs">
                    {labels.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="p-3 rounded-lg bg-muted/50 border mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4"
                      style={{ backgroundColor: `${MESSAGE_TYPES[pendingTemplate.messageType].color}12`, color: MESSAGE_TYPES[pendingTemplate.messageType].color }}
                    >
                      {MESSAGE_TYPES[pendingTemplate.messageType].label.replace(" Messages", "")}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-4">{pendingTemplate.industry}</Badge>
                    <span className="text-xs font-medium">{pendingTemplate.title}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{pendingTemplate.description}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block">{labels.selectLabel}</label>
                    <Select value={selectedSubVertical} onValueChange={setSelectedSubVertical}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder={`Select a ${labels.selectLabel.toLowerCase()}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map(sv => (
                          <SelectItem key={sv} value={sv} className="text-xs">
                            {sv}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-1">{labels.hint}</p>
                  </div>

                  {/* Personalize for a client — collapsible URL input */}
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                        <Link2 className="w-3 h-3 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium">Personalize for a client</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">Optional</span>
                      </div>
                      {showUrlInput ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    {showUrlInput && (
                      <div className="px-3 pb-3 pt-1 border-t bg-muted/20">
                        <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Client Website URL</label>
                        <div className="relative">
                          <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            placeholder="https://www.client-website.com"
                            value={clientWebsiteUrl}
                            onChange={(e) => setClientWebsiteUrl(e.target.value)}
                            className="pl-8 h-8 text-xs"
                          />
                        </div>
                        {urlTrimmed && !isValidUrl && (
                          <p className="text-[10px] text-red-500 mt-1">Please enter a valid URL starting with http:// or https://</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                          We'll crawl the website to extract real product images and business context for a hyper-personalized template.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-9"
                      onClick={() => {
                        setSubVerticalDialogOpen(false);
                        if (pendingTemplate) executeTemplateGeneration(pendingTemplate, undefined, urlTrimmed || undefined);
                        setPendingTemplate(null);
                        setShowUrlInput(false);
                        setClientWebsiteUrl("");
                      }}
                    >
                      Skip — use default
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs h-9 bg-[#25D366] hover:bg-[#1da851]"
                      disabled={!selectedSubVertical || (urlTrimmed.length > 0 && !isValidUrl)}
                      onClick={() => {
                        setSubVerticalDialogOpen(false);
                        if (pendingTemplate) executeTemplateGeneration(pendingTemplate, selectedSubVertical, urlTrimmed || undefined);
                        setPendingTemplate(null);
                        setShowUrlInput(false);
                        setClientWebsiteUrl("");
                      }}
                    >
                      <Sparkles className="w-3 h-3 mr-1.5" />
                      {urlTrimmed ? "Generate Personalized" : "Generate"}
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Personalization Dialog for non-sub-vertical templates */}
      <Dialog open={personalizeDialogOpen} onOpenChange={(v) => { if (!v) { setPersonalizeDialogOpen(false); setPendingTemplate(null); setShowUrlInput(false); setClientWebsiteUrl(""); } }}>
        <DialogContent className="max-w-md">
          {pendingTemplate && (() => {
            const urlTrimmed = clientWebsiteUrl.trim();
            const isValidUrl = urlTrimmed.length === 0 || /^https?:\/\/.+\..+/.test(urlTrimmed);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base">Generate Template</DialogTitle>
                  <DialogDescription className="text-xs">
                    Ready to create your WhatsApp conversation flow. Optionally personalize it for a specific client.
                  </DialogDescription>
                </DialogHeader>

                <div className="p-3 rounded-lg bg-muted/50 border mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4"
                      style={{ backgroundColor: `${MESSAGE_TYPES[pendingTemplate.messageType].color}12`, color: MESSAGE_TYPES[pendingTemplate.messageType].color }}
                    >
                      {MESSAGE_TYPES[pendingTemplate.messageType].label.replace(" Messages", "")}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-4">{pendingTemplate.industry}</Badge>
                    <span className="text-xs font-medium">{pendingTemplate.title}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{pendingTemplate.description}</p>
                </div>

                <div className="space-y-3">
                  {/* Personalize for a client — collapsible URL input */}
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                        <Link2 className="w-3 h-3 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium">Personalize for a client</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">Optional</span>
                      </div>
                      {showUrlInput ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    {showUrlInput && (
                      <div className="px-3 pb-3 pt-1 border-t bg-muted/20">
                        <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Client Website URL</label>
                        <div className="relative">
                          <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            placeholder="https://www.client-website.com"
                            value={clientWebsiteUrl}
                            onChange={(e) => setClientWebsiteUrl(e.target.value)}
                            className="pl-8 h-8 text-xs"
                          />
                        </div>
                        {urlTrimmed && !isValidUrl && (
                          <p className="text-[10px] text-red-500 mt-1">Please enter a valid URL starting with http:// or https://</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                          We'll crawl the website to extract real product images and business context for a hyper-personalized template.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 text-xs h-9 bg-[#25D366] hover:bg-[#1da851]"
                      disabled={urlTrimmed.length > 0 && !isValidUrl}
                      onClick={() => {
                        setPersonalizeDialogOpen(false);
                        if (pendingTemplate) executeTemplateGeneration(pendingTemplate, undefined, urlTrimmed || undefined);
                        setPendingTemplate(null);
                        setShowUrlInput(false);
                        setClientWebsiteUrl("");
                      }}
                    >
                      {urlTrimmed && isValidUrl ? (
                        <>
                          <ExternalLink className="w-3 h-3 mr-1.5" />
                          Generate Personalized
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-1.5" />
                          Generate Template
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Business Context Dialog */}
      <BusinessContextDialog
        template={contextTemplate}
        open={contextTemplate !== null}
        onClose={() => setContextTemplate(null)}
      />

      {/* Generation Progress Overlay */}
      {generationProgress.active && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-md mx-4">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366]/10 mb-4">
                <Sparkles className="w-7 h-7 text-[#25D366] animate-pulse" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Building your conversation</h2>
              <p className="text-sm text-muted-foreground">{generationProgress.templateTitle}</p>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <Progress
                value={PROGRESS_STEPS[generationProgress.step]?.pct || 0}
                className="h-2.5 bg-muted"
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {PROGRESS_STEPS[generationProgress.step]?.pct || 0}%
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {generationProgress.elapsed}s
                </span>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {PROGRESS_STEPS.map((step, i) => {
                const isActive = i === generationProgress.step;
                const isComplete = i < generationProgress.step;
                const isPending = i > generationProgress.step;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-[#25D366]/10 border border-[#25D366]/20"
                        : isComplete
                        ? "bg-muted/50 border border-transparent"
                        : "border border-transparent opacity-40"
                    }`}
                  >
                    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-[#25D366] text-white"
                        : isComplete
                        ? "bg-[#25D366]/20 text-[#25D366]"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {isComplete ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : isActive ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span className="text-xs font-medium">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        isActive ? "text-foreground" : isComplete ? "text-muted-foreground" : "text-muted-foreground/60"
                      }`}>{step.label}</p>
                      {(isActive || isComplete) && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tip */}
            <p className="text-center text-[11px] text-muted-foreground/60 mt-6">
              This typically takes 15-30 seconds depending on conversation complexity
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  loading,
  disabled,
  onUse,
  onViewContext,
}: {
  template: TemplateUseCase;
  loading: boolean;
  disabled: boolean;
  onUse: (t: TemplateUseCase) => void;
  onViewContext: (t: TemplateUseCase) => void;
}) {
  const typeInfo = MESSAGE_TYPES[template.messageType];
  const bizCtx = templateBusinessContext[template.id];

  return (
    <div className="group relative rounded-xl border border-border bg-card hover:border-[#25D366]/30 hover:shadow-md transition-all overflow-hidden flex flex-col">
      <div className="h-0.5 shrink-0" style={{ background: `linear-gradient(to right, ${typeInfo.color}, ${typeInfo.color}55)` }} />
      <div className="pt-4 pb-3 px-4 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2.5">
          <span
            className="inline-flex items-center text-[10px] h-4 px-2 rounded-full font-medium"
            style={{ backgroundColor: `${typeInfo.color}12`, color: typeInfo.color }}
          >
            {typeInfo.label.replace(" Messages", "")}
          </span>
          {bizCtx && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewContext(template); }}
              className="text-muted-foreground hover:text-[#25D366] transition-colors"
              title="View business context"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <h3 className="font-semibold text-sm mb-1 leading-tight">{template.title}</h3>
        <p className="text-[11px] text-muted-foreground mb-2.5 leading-relaxed line-clamp-2 flex-1">{template.description}</p>

        {/* Business objective preview */}
        {bizCtx && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewContext(template); }}
            className="mb-2.5 p-2 rounded-lg bg-[#25D366]/5 border border-[#25D366]/10 text-left hover:border-[#25D366]/25 hover:bg-[#25D366]/8 transition-all group/ctx cursor-pointer"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Crosshair className="w-2.5 h-2.5 text-[#25D366]" />
              <span className="text-[9px] font-semibold text-[#25D366] uppercase tracking-wider">Business Objective</span>
              <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40 ml-auto group-hover/ctx:text-[#25D366] transition-colors" />
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{bizCtx.objective}</p>
          </button>
        )}

        <div className="flex flex-wrap gap-1 mb-2.5">
          {template.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] h-4 px-1.5 py-0 rounded-full border border-border bg-muted text-muted-foreground inline-flex items-center">
              {tag}
            </span>
          ))}
        </div>

        {/* Flow steps */}
        <div className="flex items-center gap-0.5 mb-3 overflow-x-auto pb-0.5">
          {template.flowSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-0.5 shrink-0">
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                {step}
              </span>
              {i < template.flowSteps.length - 1 && (
                <ArrowRight className="w-2 h-2 text-muted-foreground/25" />
              )}
            </div>
          ))}
        </div>

        <Button
          size="sm"
          className="w-full text-xs bg-[#25D366] hover:bg-[#1da851] h-8 text-white font-medium"
          onClick={() => onUse(template)}
          disabled={disabled}
        >
          {loading ? (
            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Creating...</>
          ) : (
            <><Sparkles className="w-3 h-3 mr-1.5" /> Use Template</>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ─── Business Context Detail Dialog ─── */
function BusinessContextDialog({
  template,
  open,
  onClose,
}: {
  template: TemplateUseCase | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!template) return null;
  const bizCtx = templateBusinessContext[template.id];
  if (!bizCtx) return null;
  const typeInfo = MESSAGE_TYPES[template.messageType];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="secondary"
              className="text-[10px] h-4"
              style={{ backgroundColor: `${typeInfo.color}12`, color: typeInfo.color }}
            >
              {typeInfo.label.replace(" Messages", "")}
            </Badge>
            <Badge variant="outline" className="text-[10px] h-4">{template.industry}</Badge>

          </div>
          <DialogTitle className="text-base">{template.title}</DialogTitle>
          <DialogDescription className="text-xs">{template.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Business Objective */}
          <div className="p-3 rounded-lg bg-[#25D366]/5 border border-[#25D366]/15">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-[#25D366]/15 flex items-center justify-center">
                <Crosshair className="w-3.5 h-3.5 text-[#25D366]" />
              </div>
              <h4 className="text-xs font-semibold text-foreground">Business Objective</h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed pl-8">{bizCtx.objective}</p>
          </div>

          {/* Target Audience */}
          <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <h4 className="text-xs font-semibold text-foreground">Target Audience</h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed pl-8">{bizCtx.targetAudience}</p>
          </div>

          {/* Messaging Strategy */}
          <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center">
                <Megaphone className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <h4 className="text-xs font-semibold text-foreground">Messaging Strategy</h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed pl-8">{bizCtx.messagingStrategy}</p>
          </div>

          {/* KPIs */}
          <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h4 className="text-xs font-semibold text-foreground">Key Performance Indicators</h4>
            </div>
            <div className="pl-8 space-y-1">
              {bizCtx.kpis.map((kpi, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="text-[11px] text-muted-foreground">{kpi}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
