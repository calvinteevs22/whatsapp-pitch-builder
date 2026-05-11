import { useState, useMemo, useCallback, useEffect } from "react";
import {
  COUNTRIES, REGIONS, ROI_INDUSTRIES, CURRENCIES,
  UTILITY_USE_CASES, INDUSTRY_USE_CASE_MAP,
  calcUtilityAggregate, calcUtilityUseCase, fmt, dm,
  type CountryData, type CurrencyInfo, type UtilityUseCaseConfig, type UtilityAggregateResult, type UtilityCategory,
} from "../../../shared/roiData";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Globe, Building2, ArrowRight, ArrowLeft, Layers, Settings, BarChart3,
  Info, TrendingUp, DollarSign, MessageSquare, CheckCircle2, XCircle, ChevronDown,
} from "lucide-react";

// ─── Category icons & colors ───
const CATEGORY_META: Record<UtilityCategory, { icon: string; color: string; bg: string }> = {
  "Cost Deflection": { icon: "🛡️", color: "#0ea5e9", bg: "#f0f9ff" },
  "Revenue Recovery": { icon: "💰", color: "#f59e0b", bg: "#fffbeb" },
  "Productivity": { icon: "⚡", color: "#8b5cf6", bg: "#f5f3ff" },
};

// ─── Step Indicator ───
function StepIndicator({ steps, current, onStep }: { steps: string[]; current: number; onStep: (i: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1">
          <button
            onClick={() => i < current ? onStep(i) : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              i === current
                ? "bg-[#25D366] text-white shadow-sm"
                : i < current
                  ? "bg-[#edfaf2] text-[#0d7a3e] cursor-pointer hover:bg-[#d1f5e0]"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              i === current ? "bg-white/20" : i < current ? "bg-[#25D366]/20" : "bg-muted-foreground/20"
            }`}>
              {i < current ? "✓" : i + 1}
            </span>
            <span className="hidden sm:inline">{s}</span>
          </button>
          {i < steps.length - 1 && <div className={`w-6 h-px ${i < current ? "bg-[#25D366]" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

// ─── Tooltip Input Field ───
function InputField({
  label, value, onChange, tooltip, prefix, suffix, min, max, step,
}: {
  label: string; value: number; onChange: (v: number) => void;
  tooltip?: string; prefix?: string; suffix?: string;
  min?: number; max?: number; step?: number;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">{prefix}</span>}
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`h-9 text-sm font-mono ${prefix ? "pl-7" : ""} ${suffix ? "pr-8" : ""}`}
          min={min}
          max={max}
          step={step}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">{suffix}</span>}
      </div>
    </div>
  );
}

// ─── Use Case Card (Step 3) ───
function UseCaseCard({
  uc, enabled, isRecommended, onToggle,
}: {
  uc: typeof UTILITY_USE_CASES[0]; enabled: boolean; isRecommended: boolean;
  onToggle: () => void;
}) {
  const cat = CATEGORY_META[uc.category];
  return (
    <button
      onClick={onToggle}
      className={`w-full p-4 rounded-lg border text-left transition-all hover:shadow-sm ${
        enabled ? "border-[#25D366] bg-[#edfaf2]/50 shadow-sm" : "border-border hover:border-[#25D366]/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{cat.icon}</span>
            <span className="font-bold text-sm">{uc.name}</span>
            {isRecommended && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-[#25D366]/10 text-[#0d7a3e] font-bold">
                Recommended
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono" style={{ borderColor: cat.color, color: cat.color }}>
              {uc.category}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{uc.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {uc.keyIndustries.slice(0, 3).map((ind) => (
              <span key={ind} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{ind}</span>
            ))}
            {uc.keyIndustries.length > 3 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{uc.keyIndustries.length - 3}</span>
            )}
          </div>
        </div>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          enabled ? "bg-[#25D366] text-white" : "border-2 border-muted-foreground/30"
        }`}>
          {enabled && <CheckCircle2 className="w-3.5 h-3.5" />}
        </div>
      </div>
    </button>
  );
}

// ─── Configure Card (Step 4) ───
function ConfigureCard({
  uc, fields, onChange, utilityPrice, dmFn,
}: {
  uc: typeof UTILITY_USE_CASES[0];
  fields: Record<string, number>;
  onChange: (key: string, value: number) => void;
  utilityPrice: number;
  dmFn: (n: number) => string;
}) {
  const cat = CATEGORY_META[uc.category];

  // Live mini-preview calculation
  const preview = useMemo(() => {
    const result = calcUtilityUseCase(uc.id, fields, utilityPrice);
    return result;
  }, [uc.id, fields, utilityPrice]);

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2">
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">{cat.icon}</span>
          <h3 className="font-bold text-sm">{uc.name}</h3>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono ml-auto" style={{ borderColor: cat.color, color: cat.color }}>
            {uc.category}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0">
          {uc.defaultFields.map((f) => (
            <InputField
              key={f.key}
              label={f.label}
              value={fields[f.key] ?? f.defaultValue}
              onChange={(v) => onChange(f.key, v)}
              tooltip={f.tooltip}
              prefix={f.prefix}
              suffix={f.suffix}
              min={f.min}
              max={f.max}
              step={f.step}
            />
          ))}
        </div>

        {/* Live mini-preview */}
        <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Live Preview</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-muted-foreground">Monthly Savings</div>
              <div className="text-sm font-bold text-[#0d7a3e]">{dmFn(preview.monthlySavings)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">WA Cost</div>
              <div className="text-sm font-bold text-[#f59e0b]">{dmFn(preview.whatsappCost)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Conversations</div>
              <div className="text-sm font-bold text-foreground">{fmt(preview.conversationsPerMonth)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Results Component (Step 5) ───
function UtilityResults({
  result, clientName, dmFn, bspMonthlyFee = 0, bspSetupCost = 0,
}: {
  result: UtilityAggregateResult; clientName: string; dmFn: (n: number) => string; bspMonthlyFee?: number; bspSetupCost?: number;
}) {
  // Sort use cases by net value for the ranked bar chart
  const sortedResults = useMemo(
    () => [...result.useCaseResults].sort((a, b) => b.netValue - a.netValue),
    [result.useCaseResults]
  );
  const maxNetValue = Math.max(...sortedResults.map((r) => Math.abs(r.netValue)), 1);

  const hasBsp = bspMonthlyFee > 0 || bspSetupCost > 0;
  const totalMonthlyCost = result.totalWhatsappCost + bspMonthlyFee;
  const adjustedNetValue = result.totalMonthlySavings - totalMonthlyCost;
  const adjustedROI = totalMonthlyCost > 0 ? result.totalMonthlySavings / totalMonthlyCost : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3">
      {/* Aggregate Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-[#edfaf2] to-white border-[#25D366]/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-4 h-4 text-[#25D366]" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Monthly Savings</span>
            </div>
            <div className="text-xl font-black text-[#0d7a3e]">{dmFn(result.totalMonthlySavings)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#fffbeb] to-white border-[#f59e0b]/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare className="w-4 h-4 text-[#f59e0b]" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{hasBsp ? "Total Cost" : "WA Cost"}</span>
            </div>
            <div className="text-xl font-black text-[#b45309]">{dmFn(hasBsp ? totalMonthlyCost : result.totalWhatsappCost)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#f0fdf4] to-white border-[#22c55e]/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4 text-[#22c55e]" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Net Value</span>
            </div>
            <div className="text-xl font-black text-[#15803d]">{dmFn(hasBsp ? adjustedNetValue : result.totalNetValue)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#eef2ff] to-white border-[#6366f1]/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 className="w-4 h-4 text-[#6366f1]" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{hasBsp ? "True ROI" : "ROI Multiplier"}</span>
            </div>
            <div className="text-xl font-black text-[#4338ca]">{(hasBsp ? adjustedROI : result.overallROI).toFixed(1)}×</div>
          </CardContent>
        </Card>
      </div>

      {/* BSP Cost Breakdown */}
      {hasBsp && (
        <div className="-mt-3 p-3 rounded-lg border border-[#f59e0b]/20 bg-[#fffbeb]/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🏢</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cost Breakdown (incl. 3rd Party BSP)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] text-muted-foreground">WA Messaging</div>
              <div className="text-sm font-bold text-foreground">{dmFn(result.totalWhatsappCost)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">BSP Platform Fee</div>
              <div className="text-sm font-bold text-[#f59e0b]">{dmFn(bspMonthlyFee)}/mo</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Total Monthly</div>
              <div className="text-sm font-bold text-foreground">{dmFn(totalMonthlyCost)}</div>
            </div>
            {bspSetupCost > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground">One-time Setup</div>
                <div className="text-sm font-bold text-[#b45309]">{dmFn(bspSetupCost)}</div>
              </div>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-2 font-mono">
            Net value: {dmFn(adjustedNetValue)} | ROI without BSP: {result.overallROI.toFixed(1)}× → True ROI: {adjustedROI.toFixed(1)}×
          </div>
        </div>
      )}

      {/* Annual Projection + Message Volume */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Annual Projection</div>
            <div className="text-2xl font-black text-[#0d7a3e]">{dmFn(hasBsp ? adjustedNetValue * 12 : result.annualProjection)}</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Estimated annual net value for {clientName || "your business"}{hasBsp ? " (incl. BSP costs)" : ""}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Billable Conversations</div>
            <div className="text-2xl font-black text-foreground">{fmt(result.totalConversations)}</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {fmt(result.totalMessages)} messages across {fmt(result.totalConversations)} conversations/mo
            </div>
            <div className="text-[10px] text-muted-foreground/70 mt-0.5 italic">
              WhatsApp charges per conversation (24h window), not per message
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranked Bar Chart — Per Use Case Breakdown */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#25D366]" />
            <h3 className="font-bold text-sm">ROI by Use Case</h3>
            <span className="text-[10px] text-muted-foreground ml-auto">Ranked by net value</span>
          </div>
          <div className="space-y-3">
            {sortedResults.map((r) => {
              const cat = CATEGORY_META[r.category];
              const barWidth = maxNetValue > 0 ? Math.max((r.netValue / maxNetValue) * 100, 2) : 2;
              return (
                <div key={r.useCaseId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cat.icon}</span>
                      <span className="text-xs font-semibold">{r.name}</span>
                      <Badge variant="outline" className="text-[8px] px-1 py-0 font-mono" style={{ borderColor: cat.color, color: cat.color }}>
                        {r.roiMultiplier.toFixed(1)}× ROI
                      </Badge>
                    </div>
                    <span className="text-xs font-bold text-[#0d7a3e]">{dmFn(r.netValue)}</span>
                  </div>
                  <div className="h-6 bg-muted rounded-md overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all duration-500"
                      style={{ width: `${barWidth}%`, background: `linear-gradient(90deg, ${cat.color}40, ${cat.color}80)` }}
                    />
                    <div className="absolute inset-0 flex items-center px-2 text-[9px] font-mono text-muted-foreground gap-4">
                      <span>Savings: {dmFn(r.monthlySavings)}</span>
                      <span>WA Cost: {dmFn(r.whatsappCost)}</span>
                      <span>Convos: {fmt(r.conversationsPerMonth)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Per-Use-Case Detail Table */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="font-bold text-sm mb-4">Detailed Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-bold text-muted-foreground">Use Case</th>
                  <th className="text-left py-2 font-bold text-muted-foreground">Category</th>
                  <th className="text-right py-2 font-bold text-muted-foreground">Convos/Mo</th>
                  <th className="text-right py-2 font-bold text-muted-foreground">Msgs/Mo</th>
                  <th className="text-right py-2 font-bold text-muted-foreground">Savings</th>
                  <th className="text-right py-2 font-bold text-muted-foreground">WA Cost</th>
                  <th className="text-right py-2 font-bold text-muted-foreground">Net Value</th>
                  <th className="text-right py-2 font-bold text-muted-foreground">ROI</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((r) => (
                  <tr key={r.useCaseId} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 font-semibold">{r.name}</td>
                    <td className="py-2.5">
                      <Badge variant="outline" className="text-[8px] px-1 py-0 font-mono" style={{ borderColor: CATEGORY_META[r.category].color, color: CATEGORY_META[r.category].color }}>
                        {r.category}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right font-mono">{fmt(r.conversationsPerMonth)}</td>
                    <td className="py-2.5 text-right font-mono text-muted-foreground">{fmt(r.messagesPerMonth)}</td>
                    <td className="py-2.5 text-right font-mono text-[#0d7a3e]">{dmFn(r.monthlySavings)}</td>
                    <td className="py-2.5 text-right font-mono text-[#b45309]">{dmFn(r.whatsappCost)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#15803d]">{dmFn(r.netValue)}</td>
                    <td className="py-2.5 text-right font-mono font-bold">{r.roiMultiplier.toFixed(1)}×</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td className="py-2.5" colSpan={2}>Total</td>
                  <td className="py-2.5 text-right font-mono">{fmt(result.totalConversations)}</td>
                  <td className="py-2.5 text-right font-mono text-muted-foreground">{fmt(result.totalMessages)}</td>
                  <td className="py-2.5 text-right font-mono text-[#0d7a3e]">{dmFn(result.totalMonthlySavings)}</td>
                  <td className="py-2.5 text-right font-mono text-[#b45309]">{dmFn(result.totalWhatsappCost)}</td>
                  <td className="py-2.5 text-right font-mono text-[#15803d]">{dmFn(result.totalNetValue)}</td>
                  <td className="py-2.5 text-right font-mono">{result.overallROI.toFixed(1)}×</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Industry Icons (reuse from main calculator) ───
const INDUSTRY_ICONS: Record<string, string> = {
  "E-Commerce": "🛒", "Healthcare": "🏥", "Food & Beverage": "🍔",
  "Finance & Banking": "🏦", "Travel & Hospitality": "✈️", "Education": "🎓",
  "Real Estate": "🏠", "Automotive": "🚗", "Retail": "🏬",
  "Technology": "💻", "Beauty & Wellness": "💅", "Entertainment": "🎬",
  "Logistics": "📦", "Insurance": "🛡️", "Telecommunications": "📶",
};

// ─── Main UtilityCalculator Component ───
export default function UtilityCalculator() {
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [currencyMode, setCM] = useState<"usd" | "local">("usd");

  // 3rd Party BSP Costs (optional)
  const [bspMonthlyFee, setBspMonthlyFee] = useState(0);
  const [bspSetupCost, setBspSetupCost] = useState(0);
  const [bspOpen, setBspOpen] = useState(false);

  // Use case configs
  const [useCaseConfigs, setUseCaseConfigs] = useState<UtilityUseCaseConfig[]>(
    UTILITY_USE_CASES.map((uc) => ({
      useCaseId: uc.id,
      enabled: false,
      fields: Object.fromEntries(uc.defaultFields.map((f) => [f.key, f.defaultValue])),
    }))
  );

  const countryData = COUNTRIES.find((c) => c.name === country);
  const currencyInfo = country ? CURRENCIES[country] : null;
  const utilityPrice = countryData?.wapUtility || 0.0113;

  const stepLabels = ["Country", "Industry", "Use Cases", "Configure", "Results"];

  // Currency
  const cRate = currencyMode === "local" && currencyInfo && currencyInfo.code !== "USD" ? currencyInfo.rate : 1;
  const cSym = currencyMode === "local" && currencyInfo && currencyInfo.code !== "USD" ? currencyInfo.symbol : "$";
  const dmFn = useCallback((n: number) => dm(n, cRate, cSym), [cRate, cSym]);

  // Auto-select use cases when industry changes
  useEffect(() => {
    if (!industry) return;
    const recommended = INDUSTRY_USE_CASE_MAP[industry] || [];
    setUseCaseConfigs((prev) =>
      prev.map((c) => ({
        ...c,
        enabled: recommended.includes(c.useCaseId),
      }))
    );
  }, [industry]);

  const enabledConfigs = useCaseConfigs.filter((c) => c.enabled);
  const enabledUseCases = enabledConfigs.map((c) => UTILITY_USE_CASES.find((uc) => uc.id === c.useCaseId)!).filter(Boolean);

  // Compute results
  const result = useMemo<UtilityAggregateResult | null>(() => {
    if (enabledConfigs.length === 0) return null;
    return calcUtilityAggregate(useCaseConfigs, utilityPrice);
  }, [useCaseConfigs, utilityPrice, enabledConfigs.length]);

  const toggleUseCase = (id: string) => {
    setUseCaseConfigs((prev) =>
      prev.map((c) => c.useCaseId === id ? { ...c, enabled: !c.enabled } : c)
    );
  };

  const updateField = (useCaseId: string, key: string, value: number) => {
    setUseCaseConfigs((prev) =>
      prev.map((c) =>
        c.useCaseId === useCaseId
          ? { ...c, fields: { ...c.fields, [key]: value } }
          : c
      )
    );
  };

  const canGo = () => {
    if (step === 0) return !!country;
    if (step === 1) return !!industry;
    if (step === 2) return enabledConfigs.length > 0;
    return true;
  };

  const recommendedIds = industry ? (INDUSTRY_USE_CASE_MAP[industry] || []) : [];

  // Group use cases by category for step 3
  const categories: UtilityCategory[] = ["Cost Deflection", "Revenue Recovery", "Productivity"];

  return (
    <div className="space-y-0">
      {/* Step Indicator */}
      <StepIndicator steps={stepLabels} current={step} onStep={setStep} />

      {/* ─── Step 0: Country ─── */}
      {step === 0 && (
        <Card className="max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-3">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-5">
              <Globe className="w-5 h-5 text-[#25D366]" />
              <h2 className="font-bold text-lg">Select Country</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Choose the country for WhatsApp utility messaging pricing</p>
            <Select value={country || ""} onValueChange={(v) => setCountry(v)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Choose a country..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {REGIONS.map((r) => (
                  <div key={r}>
                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{r}</div>
                    {COUNTRIES.filter((c) => c.region === r).map((c) => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {country && countryData && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="text-xs font-semibold text-muted-foreground">Currency:</Label>
                  <div className="flex gap-0.5 bg-muted rounded-md p-0.5">
                    <button onClick={() => setCM("usd")} className={`px-3 py-1 rounded text-xs font-bold transition-all ${currencyMode === "usd" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>USD ($)</button>
                    {currencyInfo && currencyInfo.code !== "USD" && (
                      <button onClick={() => setCM("local")} className={`px-3 py-1 rounded text-xs font-bold transition-all ${currencyMode === "local" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>{currencyInfo.code} ({currencyInfo.symbol})</button>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#edfaf2]/50 border border-[#25D366]/20">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">WhatsApp Utility Price</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-[#0d7a3e]">${countryData.wapUtility.toFixed(4)}</span>
                    <span className="text-[10px] text-muted-foreground">per message (USD)</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    vs Marketing: ${countryData.wap.toFixed(4)} · Utility is {((1 - countryData.wapUtility / countryData.wap) * 100).toFixed(0)}% cheaper
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Step 1: Industry ─── */}
      {step === 1 && (
        <Card className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-3">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-5 h-5 text-[#25D366]" />
              <h2 className="font-bold text-lg">Select Industry</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Industry determines which utility use cases are recommended and pre-selected</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {ROI_INDUSTRIES.map((ind) => (
                <button
                  key={ind.name}
                  onClick={() => setIndustry(ind.name)}
                  className={`p-3.5 rounded-lg border text-left transition-all hover:border-[#25D366]/50 ${industry === ind.name ? "border-[#25D366] bg-[#edfaf2] shadow-sm" : "border-border"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{INDUSTRY_ICONS[ind.name] || "📊"}</span>
                    <span className="font-semibold text-sm">{ind.name}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {(INDUSTRY_USE_CASE_MAP[ind.name] || []).length} recommended use cases
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Step 2: Use Cases ─── */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-[#25D366]" />
                <h2 className="font-bold text-lg">Select Use Cases</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Choose the utility messaging use cases to include in the ROI calculation.
                Relevant cases for <span className="font-semibold text-foreground">{industry}</span> are pre-selected.
              </p>

              {categories.map((cat) => {
                const catUCs = UTILITY_USE_CASES.filter((uc) => uc.category === cat);
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat} className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">{meta.icon}</span>
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.color }}>{cat}</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {catUCs.map((uc) => (
                        <UseCaseCard
                          key={uc.id}
                          uc={uc}
                          enabled={useCaseConfigs.find((c) => c.useCaseId === uc.id)?.enabled || false}
                          isRecommended={recommendedIds.includes(uc.id)}
                          onToggle={() => toggleUseCase(uc.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{enabledConfigs.length}</span> use case{enabledConfigs.length !== 1 ? "s" : ""} selected
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Step 3: Configure ─── */}
      {step === 3 && (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center gap-2 mb-5">
            <Settings className="w-5 h-5 text-[#25D366]" />
            <h2 className="font-bold text-lg">Configure Use Cases</h2>
          </div>

          {/* Client name */}
          <Card className="mb-4">
            <CardContent className="pt-4 pb-4">
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Client Name (optional)</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Enter client name for personalized reports..." className="h-10" />

              {/* 3rd Party BSP Costs (optional) */}
              <Collapsible open={bspOpen} onOpenChange={setBspOpen} className="mt-4">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏢</span>
                    <span className="text-xs font-bold text-muted-foreground">3rd Party BSP Costs (optional)</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${bspOpen ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-3">
                    <p className="text-[10px] text-muted-foreground">Include platform licensing or implementation costs charged by a 3rd party BSP (e.g., Twilio, Gupshup, Infobip)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Monthly Platform Fee</Label>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">$</span>
                          <Input type="number" value={bspMonthlyFee || ""} onChange={(e) => setBspMonthlyFee(parseFloat(e.target.value) || 0)} placeholder="0" min={0} className="h-8 text-sm" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] font-semibold text-muted-foreground mb-1 block">One-time Setup Cost</Label>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">$</span>
                          <Input type="number" value={bspSetupCost || ""} onChange={(e) => setBspSetupCost(parseFloat(e.target.value) || 0)} placeholder="0" min={0} className="h-8 text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* One card per enabled use case */}
          <div className="space-y-4">
            {enabledUseCases.map((uc) => {
              const config = useCaseConfigs.find((c) => c.useCaseId === uc.id)!;
              return (
                <ConfigureCard
                  key={uc.id}
                  uc={uc}
                  fields={config.fields}
                  onChange={(key, value) => updateField(uc.id, key, value)}
                  utilityPrice={utilityPrice}
                  dmFn={dmFn}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Step 4: Results ─── */}
      {step === 4 && result && (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#25D366]" />
              <h2 className="font-bold text-lg">Utility Messaging ROI Results</h2>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono bg-[#edfaf2] text-[#0d7a3e]">
              {country} · {industry}
            </Badge>
          </div>
          <UtilityResults result={result} clientName={clientName || industry || "your business"} dmFn={dmFn} bspMonthlyFee={bspMonthlyFee} bspSetupCost={bspSetupCost} />
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        ) : <div />}
        {step < stepLabels.length - 1 && (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canGo()}
            className="bg-[#25D366] hover:bg-[#1da851] gap-1.5"
          >
            {step === stepLabels.length - 2 ? "Calculate Results" : "Next"} <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
