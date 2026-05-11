import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  Calculator, ArrowRight, ArrowLeft, Check, ChevronDown,
  Globe, Building2, BarChart3, TrendingUp, Target, Zap,
  Download, FileText, Table2, Code2, DollarSign, Users,
  Loader2, User, LogOut, FolderOpen, BookOpen, Hammer,
  HelpCircle, ArrowLeftRight, Shield, Clock, Rocket,
  LineChart, GitCompare, Activity, Info, RefreshCw,
  MessageSquare, Mail, Smartphone, ChevronRight
} from "lucide-react";
import {
  COUNTRIES, ROI_INDUSTRIES, CONV, BENCH, CURRENCIES, SCENARIOS, CH_CFG, REGIONS,
  deriveAdv, deriveBasic, deriveBroadcast, deriveBroadcastBasic, projectBroadcastRevenue,
  fmt, fmtMoney, pct, dm, initChannelInputs,
  type CountryData, type ChannelInputs, type DerivedMetrics, type CurrencyInfo, type BroadcastMetrics,
} from "@shared/roiData";
import UtilityCalculator from "./UtilityCalculator";

// ─── Industry icons mapping ───
const INDUSTRY_ICONS: Record<string, string> = {
  "E-Commerce": "🛒",
  "Healthcare": "🏥",
  "Food & Beverage": "🍽️",
  "Finance & Banking": "🏦",
  "Travel & Hospitality": "✈️",
  "Education": "🎓",
  "Real Estate": "🏠",
  "Automotive": "🚗",
  "Retail": "🏬",
  "Technology": "💻",
  "Beauty & Wellness": "💅",
  "Entertainment": "🎬",
  "Logistics": "📦",
  "Insurance": "🛡️",
  "Telecommunications": "📶",
};

// ─── Sub-components ───

function StepIndicator({ steps, current, onStep }: { steps: string[]; current: number; onStep: (i: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={i} className="flex items-center gap-1">
            <button
              onClick={() => done && onStep(i)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                active
                  ? "bg-[#25D366] text-white shadow-[0_0_0_4px_rgba(37,211,102,0.2)]"
                  : done
                  ? "bg-[#0d7a3e] text-white cursor-pointer hover:bg-[#0a6633]"
                  : "bg-muted text-muted-foreground cursor-default"
              }`}
            >
              {done ? <Check className="w-4 h-4" /> : i + 1}
            </button>
            <span className={`text-xs font-medium hidden sm:inline mx-1 ${active ? "text-foreground" : "text-muted-foreground"}`}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${done ? "bg-[#0d7a3e]" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InputField({
  label, value, onChange, suffix, prefix, tooltip, min, max, step, disabled
}: {
  label: string; value: number; onChange: (v: number) => void;
  suffix?: string; prefix?: string; tooltip?: string;
  min?: number; max?: number; step?: number; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-xs font-semibold text-muted-foreground">{label}</label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-[10px] text-muted-foreground cursor-help font-bold">?</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px] text-xs">{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className={`flex items-center rounded-md border transition-all duration-200 ${focused ? "border-[#25D366] ring-2 ring-[#25D366]/10" : "border-input"} ${disabled ? "bg-muted/50" : "bg-background"}`}>
        {prefix && <span className="pl-3 text-sm text-muted-foreground font-mono">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          min={min}
          max={max}
          step={step || "any"}
          disabled={disabled}
          className="flex-1 border-none outline-none px-3 py-2.5 text-sm font-mono font-medium bg-transparent w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="pr-3 text-xs text-muted-foreground font-mono">{suffix}</span>}
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtext, color, icon, delay = 0 }: {
  label: string; value: string; subtext?: string; color: string; icon?: string; delay?: number;
}) {
  return (
    <div
      className="rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}20`,
        animationDelay: `${delay}s`,
        animationFillMode: "both",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && <span className="text-sm">{icon}</span>}
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="text-xl font-extrabold tracking-tight" style={{ color }}>{value}</div>
      {subtext && <div className="text-[10px] text-muted-foreground mt-1 font-mono">{subtext}</div>}
    </div>
  );
}

function InsightBox({ pills, narrative, color = "#25D366" }: {
  pills?: { label: string; value: string; icon?: string; color?: string }[];
  narrative?: string;
  color?: string;
}) {
  return (
    <div className="bg-[#0f172a] rounded-xl p-5 text-white border border-[#1e293b]">
      {pills && pills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {pills.map((p, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium"
              style={{
                background: `${p.color || color}18`,
                color: p.color || color,
                border: `1px solid ${p.color || color}30`,
              }}
            >
              {p.icon && <span>{p.icon}</span>}
              {p.label}: <strong>{p.value}</strong>
            </span>
          ))}
        </div>
      )}
      {narrative && <p className="text-sm leading-relaxed text-slate-400">{narrative}</p>}
    </div>
  );
}

function ChannelInputPanel({
  channel, inputs, onChange, region, country, rateLabel, dmFn,
}: {
  channel: string; inputs: ChannelInputs; onChange: (inputs: ChannelInputs) => void;
  region: string; country: string; rateLabel: string;
  dmFn: (n: number) => string;
}) {
  const cfg = CH_CFG[channel];
  const bench = BENCH[channel]?.[region];
  if (!bench || !cfg) return null;
  const u = (f: keyof ChannelInputs, v: number) => onChange({ ...inputs, [f]: v });

  return (
    <Card className="mb-4 overflow-hidden" style={{ borderTop: `3px solid ${cfg.color}` }}>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="text-xl">{cfg.icon}</span>
          <span className="font-extrabold text-lg" style={{ color: cfg.dark }}>{cfg.label}</span>
          <Badge variant="secondary" className="text-[10px] font-mono" style={{ background: cfg.bg, color: cfg.dark }}>
            {region}
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5">
          <InputField label="Messages per Broadcast" value={inputs.messages} onChange={(v) => u("messages", v)} tooltip="Number of messages sent in a single broadcast" min={0} />
          <InputField label="Delivery Rate" value={inputs.deliveryRate} onChange={(v) => u("deliveryRate", v)} suffix="%" tooltip={`Benchmark: ${bench.deliveryRate}%`} min={0} max={100} />
          <InputField label={channel === "whatsapp" ? "Read Rate" : "Open Rate"} value={inputs.openRate} onChange={(v) => u("openRate", v)} suffix="%" tooltip={`Benchmark: ${bench.openRate}%`} min={0} max={100} />
          <InputField label="Click-Through Rate" value={inputs.ctr} onChange={(v) => u("ctr", v)} suffix="%" tooltip={`% of readers who click. Benchmark: ${bench.ctr}%`} min={0} max={100} />
          <InputField label={rateLabel || "Conversion Rate"} value={inputs.convRate} onChange={(v) => u("convRate", v)} suffix="%" tooltip="% of clickers who convert (post-click rate)" min={0} max={100} />
          <InputField label={channel === "inapp" ? "Notification Disable Rate" : "Opt-Out Rate"} value={inputs.optOutRate} onChange={(v) => u("optOutRate", v)} suffix="%" tooltip={channel === "inapp" ? `% of users who disable notifications per month. Benchmark: ${bench.optOutRate}%` : `Benchmark: ${bench.optOutRate}%`} min={0} max={100} />
          <InputField label="Cost per Message" value={inputs.costPerMsg} onChange={(v) => u("costPerMsg", v)} prefix="$" tooltip={channel === "email" ? "Your email platform cost per send" : channel === "inapp" ? "In-app notification platform cost per send (e.g., OneSignal, Firebase)" : `${cfg.label} cost in ${country}`} min={0} step={0.001} />
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelViz({ data, color, label, maxMessages }: {
  data: DerivedMetrics; color: string; label: string; maxMessages?: number;
}) {
  const steps = [
    { name: "Sent", value: data.messages },
    { name: "Delivered", value: data.delivered },
    { name: "Opened", value: data.opened },
    { name: "Clicked", value: data.clicked },
    { name: "Converted", value: data.conversions },
  ];
  const mx = maxMessages || data.messages || 1;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3 font-bold text-sm" style={{ color }}>
        <span>{CH_CFG[label]?.icon}</span>
        {CH_CFG[label]?.label || label}
      </div>
      {steps.map((s, i) => {
        const w = mx > 0 ? Math.max((s.value / mx) * 100, 2) : 2;
        return (
          <div key={i} className="flex items-center gap-2.5 mb-1.5 animate-in slide-in-from-left" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "both" }}>
            <span className="w-[70px] text-[11px] text-muted-foreground font-medium text-right shrink-0">{s.name}</span>
            <div className="flex-1 relative h-[26px] flex items-center">
              <div className="h-[22px] rounded" style={{ width: `${w}%`, background: `${color}25`, minWidth: 4 }}>
                <div className="h-full rounded" style={{ background: color, width: "100%", opacity: 0.7 }} />
              </div>
              <span className="ml-2 text-[11px] font-mono font-medium text-muted-foreground">{fmt(s.value)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScorecardTable({ channels, data, dmFn }: {
  channels: string[]; data: Record<string, DerivedMetrics>;
  dmFn: (n: number) => string;
}) {
  const metrics: { label: string; key: string; fn: (d: DerivedMetrics) => string; higher: boolean }[] = [
    { label: "Messages/Broadcast", key: "messages", fn: (d) => fmt(d.messages), higher: true },
    { label: "Delivered", key: "delivered", fn: (d) => fmt(d.delivered), higher: true },
    { label: "Opened / Read", key: "opened", fn: (d) => fmt(d.opened), higher: true },
    { label: "Clicked", key: "clicked", fn: (d) => fmt(d.clicked), higher: true },
    { label: "Conversions / Broadcast", key: "conversions", fn: (d) => fmt(d.conversions), higher: true },
    { label: "Revenue / Broadcast", key: "revenue", fn: (d) => dmFn(d.revenue), higher: true },
    { label: "ROI", key: "roi", fn: (d) => d.roi.toFixed(1) + "×", higher: true },
    { label: "Cost / Conversion", key: "cpConv", fn: (d) => dmFn(d.cpConv), higher: false },
    { label: "Rev / 1K Msgs", key: "rev1k", fn: (d) => dmFn(d.rev1k), higher: true },
    { label: "Opt-Out Rate", key: "optOutRate", fn: (d) => pct(d.optOutRate, 2), higher: false },
  ];

  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-bold text-xs text-muted-foreground">Metric</th>
                {channels.map((ch) => (
                  <th key={ch} className="text-right px-4 py-3 font-bold text-xs" style={{ color: CH_CFG[ch]?.dark }}>
                    <span className="inline-flex items-center gap-1.5">{CH_CFG[ch]?.icon} {CH_CFG[ch]?.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, mi) => {
                const vals = channels.map((ch) => ({ ch, raw: (data[ch] as any)?.[m.key] || 0 }));
                const best = m.higher ? Math.max(...vals.map((v) => v.raw)) : Math.min(...vals.map((v) => v.raw));
                return (
                  <tr key={mi} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-xs text-muted-foreground">{m.label}</td>
                    {channels.map((ch) => {
                      const d = data[ch];
                      if (!d) return <td key={ch} className="px-4 py-3 text-right text-xs">-</td>;
                      const raw = (d as any)[m.key] || 0;
                      const isBest = channels.length > 1 && raw === best;
                      return (
                        <td key={ch} className="px-4 py-3 text-right font-mono text-xs">
                          <span className={isBest ? "font-bold" : ""} style={isBest ? { color: CH_CFG[ch]?.dark } : {}}>
                            {m.fn(d)} {isBest && channels.length > 1 && <span className="text-[10px]">✓</span>}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ShiftSimulator({ waData, compData, compChannel, dealValue, dmFn }: {
  waData: DerivedMetrics; compData: DerivedMetrics; compChannel: string; dealValue: number;
  dmFn: (n: number) => string;
}) {
  const [shiftPct, setShiftPct] = useState(25);
  const totalVol = waData.messages + compData.messages;
  const shifted = Math.round(compData.messages * shiftPct / 100);
  const newWA = waData.messages + shifted;
  const newComp = compData.messages - shifted;

  const waConvRate = waData.messages > 0 ? waData.conversions / waData.messages : 0;
  const compConvRate = compData.messages > 0 ? compData.conversions / compData.messages : 0;

  const newWAConv = newWA * waConvRate;
  const newCompConv = newComp * compConvRate;
  const origTotalConv = waData.conversions + compData.conversions;
  const newTotalConv = newWAConv + newCompConv;
  const convDelta = newTotalConv - origTotalConv;
  const revDelta = convDelta * dealValue;

  return (
    <div>
      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔄</span>
            <span className="font-bold text-base">Shift {CH_CFG[compChannel]?.label} → WhatsApp</span>
          </div>
          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-muted-foreground">Shift {shiftPct}% of {CH_CFG[compChannel]?.label} volume to WhatsApp</span>
              <span className="text-xs font-mono font-bold text-[#25D366]">{fmt(shifted)} messages</span>
            </div>
            <Slider value={[shiftPct]} onValueChange={([v]) => setShiftPct(v)} min={0} max={100} step={5} className="my-3" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0% (keep current)</span>
              <span>100% (full migration)</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Extra Conversions/Broadcast" value={`+${fmt(convDelta)}`} color="#25D366" icon="🎯" />
            <MetricCard label="Extra Revenue/Broadcast" value={`+${dmFn(revDelta)}`} color="#0d7a3e" icon="💰" />
            <MetricCard label="Extra Revenue/Year" value={`+${dmFn(revDelta * 12)}`} color="#25D366" icon="📈" />
            <MetricCard label="Messages Shifted" value={fmt(shifted)} color="#64748b" icon="📨" />
          </div>
        </CardContent>
      </Card>
      <InsightBox
        pills={[
          { label: "Shifted", value: `${shiftPct}%`, icon: "🔄", color: "#25D366" },
          { label: "New WA Volume", value: fmt(newWA), icon: "💬", color: "#25D366" },
          { label: `New ${CH_CFG[compChannel]?.label} Volume`, value: fmt(newComp), icon: CH_CFG[compChannel]?.icon, color: CH_CFG[compChannel]?.color },
        ]}
        narrative={`Shifting ${shiftPct}% of ${CH_CFG[compChannel]?.label} volume (${fmt(shifted)} messages) to WhatsApp would generate an additional ${fmt(convDelta)} conversions per broadcast, worth ${dmFn(revDelta)} in incremental revenue per broadcast. WhatsApp's higher engagement rates make each shifted message more productive.`}
      />
    </div>
  );
}

function AudienceHealthPanel({ waData, compData, compChannel, dmFn }: {
  waData: DerivedMetrics; compData: DerivedMetrics; compChannel: string;
  dmFn: (n: number) => string;
}) {
  const waOO = waData.optOutRate || 0;
  const cOO = compData.optOutRate || 0;
  const waML = waData.moLost || 0;
  const cML = compData.moLost || 0;
  const waYL = waData.yrLost || 0;
  const cYL = compData.yrLost || 0;
  const waRisk = waData.revAtRisk || 0;
  const cRisk = compData.revAtRisk || 0;

  return (
    <div>
      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🛡️</span>
            <span className="font-bold text-base">Audience Health: WhatsApp vs {CH_CFG[compChannel]?.label}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg p-3 bg-[#edfaf2] border border-[#25D366]/20">
              <div className="text-[10px] text-muted-foreground mb-1">WA Opt-Out Rate</div>
              <div className="text-xl font-extrabold text-[#0d7a3e]">{pct(waOO, 2)}</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: CH_CFG[compChannel]?.bg, border: `1px solid ${CH_CFG[compChannel]?.color}20` }}>
              <div className="text-[10px] text-muted-foreground mb-1">{CH_CFG[compChannel]?.label} Opt-Out Rate</div>
              <div className="text-xl font-extrabold" style={{ color: CH_CFG[compChannel]?.dark }}>{pct(cOO, 2)}</div>
            </div>
            <div className="rounded-lg p-3 bg-[#edfaf2] border border-[#25D366]/20">
              <div className="text-[10px] text-muted-foreground mb-1">WA Yearly Audience Loss</div>
              <div className="text-xl font-extrabold text-[#0d7a3e]">{fmt(waYL)}</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: CH_CFG[compChannel]?.bg, border: `1px solid ${CH_CFG[compChannel]?.color}20` }}>
              <div className="text-[10px] text-muted-foreground mb-1">{CH_CFG[compChannel]?.label} Yearly Audience Loss</div>
              <div className="text-xl font-extrabold" style={{ color: CH_CFG[compChannel]?.dark }}>{fmt(cYL)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <InsightBox
        pills={[
          { label: "WA Rev at Risk", value: dmFn(waRisk), icon: "💬", color: "#25D366" },
          { label: `${CH_CFG[compChannel]?.label} Rev at Risk`, value: dmFn(cRisk), icon: CH_CFG[compChannel]?.icon, color: CH_CFG[compChannel]?.color },
          { label: "Risk Difference", value: dmFn(Math.abs(cRisk - waRisk)), icon: "⚠️", color: "#f59e0b" },
        ]}
        narrative={`WhatsApp's ${pct(waOO, 2)} opt-out rate means you lose ${fmt(waYL)} subscribers per year, putting ${dmFn(waRisk)} in revenue at risk. ${CH_CFG[compChannel]?.label}'s ${pct(cOO, 2)} opt-out rate loses ${fmt(cYL)} subscribers yearly, risking ${dmFn(cRisk)} in revenue. ${waRisk < cRisk ? `WhatsApp protects ${dmFn(cRisk - waRisk)} more in annual revenue through better audience retention.` : `Consider optimizing WhatsApp message frequency to reduce opt-outs.`}`}
      />
    </div>
  );
}

function BreakEvenCard({ waData, broadcastMetrics, dealValue, clientName, dmFn, bspMonthlyFee = 0, bspSetupCost = 0 }: {
  waData: DerivedMetrics; broadcastMetrics?: BroadcastMetrics; dealValue: number; clientName?: string;
  dmFn: (n: number) => string; bspMonthlyFee?: number; bspSetupCost?: number;
}) {
  // Use broadcast metrics if available, otherwise fall back to per-message calc
  const bm = broadcastMetrics;
  const broadcastSpend = waData.spend;
  const beConversions = bm?.beConversions ?? (dealValue > 0 ? Math.ceil(broadcastSpend / dealValue) : 0);
  const convPerMsg = waData.messages > 0 ? waData.conversions / waData.messages : 0;
  const beMsgs = bm?.beMessages ?? (convPerMsg > 0 ? Math.ceil(beConversions / convPerMsg) : 0);
  const bePctOfBroadcast = bm?.bePctOfBroadcast ?? (waData.messages > 0 ? (beMsgs / waData.messages) * 100 : 0);
  const bpm = bm?.broadcastsPerMonth ?? 1;
  const rawMonthlyProfit = bm?.monthlyProfit ?? (waData.revenue - broadcastSpend);
  const rawMonthlySpend = bm?.monthlySpend ?? broadcastSpend;
  const monthlyRevenue = bm?.monthlyRevenue ?? waData.revenue;
  // Adjust for BSP costs
  const monthlySpend = rawMonthlySpend + bspMonthlyFee;
  const monthlyProfit = rawMonthlyProfit - bspMonthlyFee;

  return (
    <div className="bg-gradient-to-br from-[#0f172a] to-[#162033] rounded-xl p-6 text-white border border-[#1e293b] animate-in fade-in">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-xl">🎯</span>
        <span className="font-bold text-base">Break-Even Analysis</span>
        {bpm > 1 && (
          <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-slate-400">
            {bpm} broadcasts/mo
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 mb-1">Break-Even Conversions</div>
          <div className="text-2xl font-extrabold text-[#25D366]">{fmt(beConversions)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">per broadcast of {fmt(waData.messages)}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 mb-1">Break-Even Point</div>
          <div className="text-2xl font-extrabold" style={{ color: bePctOfBroadcast <= 50 ? "#25D366" : bePctOfBroadcast <= 100 ? "#f59e0b" : "#ef4444" }}>
            {bePctOfBroadcast > 100 ? ">100" : bePctOfBroadcast.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">of broadcast volume</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 mb-1">Monthly Spend</div>
          <div className="text-2xl font-extrabold text-slate-300">{dmFn(monthlySpend)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{dmFn(broadcastSpend)}/broadcast × {bpm}{bspMonthlyFee > 0 ? ` + ${dmFn(bspMonthlyFee)} BSP` : ""}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 mb-1">Monthly Profit</div>
          <div className="text-2xl font-extrabold" style={{ color: monthlyProfit >= 0 ? "#25D366" : "#ef4444" }}>{dmFn(monthlyProfit)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{dmFn(monthlyRevenue)} rev − {dmFn(monthlySpend)} cost</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-1.5">
          <span className="text-[11px] text-slate-400">Break-even point within each broadcast</span>
          <span className="text-[11px] text-[#25D366] font-mono">{Math.min(bePctOfBroadcast, 100).toFixed(1)}% of broadcast</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500 to-[#25D366] transition-all duration-700"
            style={{ width: `${Math.min(bePctOfBroadcast, 100)}%` }}
          />
          <div
            className="absolute right-0 top-0 h-full rounded-full"
            style={{ background: "#25D36630", width: `${Math.max(100 - bePctOfBroadcast, 0)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-500">Cost recovery</span>
          <span className="text-[10px] text-[#25D366]">Pure profit zone</span>
        </div>
      </div>

      <p className="text-[13px] leading-relaxed text-slate-400">
        {clientName ? `For ${clientName}, each` : "Each"} broadcast of <strong className="text-white">{fmt(waData.messages)} messages</strong> costs{" "}
        <strong className="text-white">{dmFn(broadcastSpend)}</strong>. It pays for itself after just{" "}
        <strong className="text-white">{fmt(beConversions)} conversions</strong> ({fmt(beMsgs)} messages) — that's{" "}
        <strong className="text-[#25D366]">{bePctOfBroadcast.toFixed(1)}% of the broadcast</strong>.
        {bpm > 1 && <> With <strong className="text-white">{bpm} broadcasts/month</strong>, total monthly spend is {dmFn(monthlySpend)}{bspMonthlyFee > 0 ? ` (incl. ${dmFn(bspMonthlyFee)} BSP fee)` : ""} generating {dmFn(monthlyRevenue)} in revenue.</>}
        {" "}{bePctOfBroadcast < 50
          ? `The remaining ${(100 - bePctOfBroadcast).toFixed(0)}% of each broadcast is pure profit. A strong investment case.`
          : bePctOfBroadcast <= 100
          ? `You recover costs within each broadcast. Increasing volume or conversion rate would strengthen the case further.`
          : `Each broadcast doesn't fully cover its cost. Consider increasing deal value or conversion rate.`
        }
      </p>
    </div>
  );
}

function ExecutiveSummary({ waData, compData, channels, country, industry, clientName, dmFn, bspMonthlyFee = 0 }: {
  waData: DerivedMetrics; compData: Record<string, DerivedMetrics>; channels: string[];
  country: string; industry: string; clientName?: string;
  dmFn: (n: number) => string; bspMonthlyFee?: number;
}) {
  const cc = channels.filter((c) => c !== "whatsapp");
  const name = clientName || industry;

  return (
    <Card className="bg-gradient-to-br from-[#0f172a] to-[#1a2744] text-white border-none mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📊</span>
            <span className="font-bold text-lg">Executive Summary</span>
          </div>
          {clientName && (
            <Badge variant="secondary" className="bg-white/10 text-slate-400 text-xs font-mono border-0">
              Prepared for {clientName}
            </Badge>
          )}
        </div>
        <div className="text-sm leading-relaxed text-slate-300">
          <p className="mb-3">
            For <strong className="text-white">{name}</strong>{clientName ? ` (${industry})` : ""} in{" "}
            <strong className="text-white">{country}</strong>, WhatsApp messaging generates{" "}
            <strong className="text-[#25D366]">{dmFn(waData.revenue)}/month</strong> in revenue with a{" "}
            <strong className="text-[#25D366]">{((waData.spend + bspMonthlyFee) > 0 ? waData.revenue / (waData.spend + bspMonthlyFee) : waData.roi).toFixed(1)}× ROI</strong> based on {fmt(waData.messages)} monthly messages.{bspMonthlyFee > 0 && ` This includes a ${dmFn(bspMonthlyFee)}/mo BSP platform fee.`}
          </p>
          {cc.map((ch, i) => {
            const c = compData[ch];
            if (!c) return null;
            const rd = waData.revenue - c.revenue;
            return (
              <p key={i} className="mb-2">
                vs {CH_CFG[ch]?.label}: WhatsApp drives{" "}
                <strong className="text-[#25D366]">{dmFn(Math.abs(rd))}</strong>
                {rd >= 0 ? " more" : " less"} monthly revenue and delivers a{" "}
                <strong className="text-[#25D366]">{Math.abs(waData.roi - c.roi).toFixed(1)}×</strong>
                {waData.roi >= c.roi ? " higher" : " lower"} ROI for {name}.
              </p>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function MonthlyProjection({ waData, compData, channels, dealValue, broadcastsPerMonth, dmFn }: {
  waData: DerivedMetrics; compData: Record<string, DerivedMetrics>; channels: string[]; dealValue: number;
  broadcastsPerMonth: number;
  dmFn: (n: number) => string;
}) {
  const cc = channels.filter((c) => c !== "whatsapp");
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const bpm = Math.max(broadcastsPerMonth, 1);

  // Broadcast-based projection: opt-outs compound per broadcast, not per month
  const waProj = projectBroadcastRevenue(waData, bpm, dealValue, 12);
  const wP = waProj.monthlyRevenue;

  // Competitor channels also use broadcast model (same frequency)
  const cP: Record<string, number[]> = {};
  cc.forEach((ch) => {
    if (compData[ch]) {
      const p = projectBroadcastRevenue(compData[ch], bpm, dealValue, 12);
      cP[ch] = p.monthlyRevenue;
    }
  });

  const all = [...wP, ...Object.values(cP).flat()];
  const mx = Math.max(...all, 1);
  const waTotal12 = wP.reduce((a, b) => a + b, 0);
  const waSpendTotal12 = waProj.monthlySpend.reduce((a, b) => a + b, 0);
  const audienceDecay = waData.messages > 0 ? ((waData.messages - waProj.monthlyAudience[11]) / waData.messages * 100) : 0;

  return (
    <Card className="mb-6">
      <CardContent className="pt-5">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="text-xl">📈</span>
          <span className="font-extrabold text-base">12-Month Revenue Projection</span>
          <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
            {bpm} broadcast{bpm > 1 ? "s" : ""}/mo
          </span>
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          Accounts for audience decay from opt-outs compounding per broadcast ({bpm}×/month = {bpm * 12} total broadcasts over 12 months)
        </div>

        <div className="relative h-[240px] mb-4">
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <div key={i} className="absolute left-0 w-full flex items-center" style={{ bottom: f * 200 + 24 }}>
              <span className="w-14 text-[10px] font-mono text-muted-foreground/50 text-right pr-2">{dmFn(mx * f)}</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
          ))}
          <div className="absolute left-[60px] right-0 bottom-6 h-[200px] flex items-end gap-0.5">
            {months.map((m, mi) => {
              const bg = [
                { v: wP[mi], c: "#25D366" },
                ...cc.map((ch) => ({ v: cP[ch]?.[mi] || 0, c: CH_CFG[ch]?.color || "#666" })),
              ];
              return (
                <div key={mi} className="flex-1 flex items-end gap-px justify-center h-full">
                  {bg.map((b, bi) => (
                    <div
                      key={bi}
                      className="rounded-t transition-all duration-300"
                      style={{
                        width: `${90 / bg.length}%`,
                        maxWidth: 20,
                        height: `${(b.v / mx) * 100}%`,
                        minHeight: 2,
                        background: b.c,
                        opacity: 0.85,
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
          <div className="absolute left-[60px] right-0 bottom-0 flex">
            {months.map((m) => (
              <div key={m} className="flex-1 text-center text-[10px] font-mono text-muted-foreground/50">M{m}</div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center mb-4">
          {[{ l: "WhatsApp", c: "#25D366" }, ...cc.map((ch) => ({ l: CH_CFG[ch]?.label || ch, c: CH_CFG[ch]?.color || "#666" }))].map((x, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: x.c }} />
              <span className="text-xs text-muted-foreground">{x.l}</span>
            </div>
          ))}
        </div>

        <div className={`grid gap-3 mt-4`} style={{ gridTemplateColumns: `repeat(${1 + cc.length}, 1fr)` }}>
          <div className="text-center p-3 bg-[#edfaf2] rounded-lg">
            <div className="text-[11px] text-muted-foreground mb-1">WhatsApp (12-Mo Revenue)</div>
            <div className="text-lg font-extrabold text-[#0d7a3e]">{dmFn(waTotal12)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{dmFn(waSpendTotal12)} spend · {audienceDecay.toFixed(1)}% audience decay</div>
          </div>
          {cc.map((ch) => (
            <div key={ch} className="text-center p-3 rounded-lg" style={{ background: CH_CFG[ch]?.bg }}>
              <div className="text-[11px] text-muted-foreground mb-1">{CH_CFG[ch]?.label} (12-Mo)</div>
              <div className="text-lg font-extrabold" style={{ color: CH_CFG[ch]?.dark }}>{dmFn(cP[ch]?.reduce((a, b) => a + b, 0) || 0)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ScenarioCompare({ baseInputs, dealValue: baseDV, dmFn }: {
  baseInputs?: ChannelInputs; dealValue: number;
  dmFn: (n: number) => string;
}) {
  const [scA, setScA] = useState({ messages: 50000, dealValue: baseDV, ctr: baseInputs?.ctr || 25, convRate: baseInputs?.convRate || 7 });
  const [scB, setScB] = useState({ messages: 100000, dealValue: baseDV, ctr: baseInputs?.ctr || 25, convRate: baseInputs?.convRate || 7 });

  useEffect(() => {
    if (baseInputs) {
      setScA((prev) => ({ ...prev, ctr: baseInputs.ctr || 25, convRate: baseInputs.convRate || 7, dealValue: baseDV }));
      setScB((prev) => ({ ...prev, ctr: baseInputs.ctr || 25, convRate: baseInputs.convRate || 7, dealValue: baseDV }));
    }
  }, [baseInputs, baseDV]);

  const calcScenario = (sc: typeof scA) => {
    const dr = (baseInputs?.deliveryRate || 96) / 100;
    const or = (baseInputs?.openRate || 90) / 100;
    const ctr = (sc.ctr || 25) / 100;
    const cv = (sc.convRate || 5) / 100;
    const cpm = baseInputs?.costPerMsg || 0;
    const delivered = sc.messages * dr;
    const opened = delivered * or;
    const clicked = opened * ctr;
    const conversions = clicked * cv;
    const revenue = conversions * sc.dealValue;
    const spend = sc.messages * cpm;
    const roi = spend > 0 ? revenue / spend : 0;
    const rev1k = sc.messages > 0 ? (conversions / sc.messages) * 1000 * sc.dealValue : 0;
    const cpConv = conversions > 0 ? spend / conversions : 0;
    return { messages: sc.messages, conversions, revenue, spend, roi, rev1k, cpConv, ctr: sc.ctr, convRate: sc.convRate, dealValue: sc.dealValue };
  };

  const rA = calcScenario(scA);
  const rB = calcScenario(scB);
  const revDiff = rA.revenue - rB.revenue;
  const winner = rA.revenue >= rB.revenue ? "A" : "B";

  const ScenarioCol = ({ label, color, sc, setSc, result, idx }: any) => (
    <div className="flex-1 min-w-[250px]">
      <div className="font-extrabold text-base mb-4 flex items-center gap-2" style={{ color }}>
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold" style={{ background: `${color}15`, color, border: `2px solid ${color}` }}>{idx}</span>
        {label}
      </div>
      <InputField label="Messages / Month" value={sc.messages} onChange={(v) => setSc({ ...sc, messages: v })} min={0} />
      <InputField label="Deal Value ($)" value={sc.dealValue} onChange={(v) => setSc({ ...sc, dealValue: v })} prefix="$" min={0} />
      <InputField label="CTR (%)" value={sc.ctr} onChange={(v) => setSc({ ...sc, ctr: v })} suffix="%" min={0} max={100} />
      <InputField label="Post-Click Conv. Rate (%)" value={sc.convRate} onChange={(v) => setSc({ ...sc, convRate: v })} suffix="%" min={0} max={100} />
      <div className="rounded-lg p-4 mt-2" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { l: "Revenue/Broadcast", v: dmFn(result.revenue) },
            { l: "Conversions", v: fmt(result.conversions) },
            { l: "ROI", v: result.roi.toFixed(1) + "×" },
            { l: "Spend/Mo", v: dmFn(result.spend) },
            { l: "Cost/Conv", v: dmFn(result.cpConv) },
            { l: "Rev/1K Msgs", v: dmFn(result.rev1k) },
          ].map((m, i) => (
            <div key={i}>
              <div className="text-[10px] text-muted-foreground mb-0.5">{m.l}</div>
              <div className="text-sm font-bold" style={{ color }}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex gap-5 flex-wrap mb-5">
        <ScenarioCol label="Scenario A" color="#25D366" sc={scA} setSc={setScA} result={rA} idx="A" />
        <div className="flex items-center justify-center px-1">
          <span className="text-2xl text-muted-foreground/30">vs</span>
        </div>
        <ScenarioCol label="Scenario B" color="#8b5cf6" sc={scB} setSc={setScB} result={rB} idx="B" />
      </div>
      <InsightBox
        pills={[
          { label: "Scenario A Rev", value: dmFn(rA.revenue), icon: "A", color: "#25D366" },
          { label: "Scenario B Rev", value: dmFn(rB.revenue), icon: "B", color: "#8b5cf6" },
          { label: "Difference", value: dmFn(Math.abs(revDiff)), icon: winner === "A" ? "🟢" : "🟣", color: winner === "A" ? "#25D366" : "#8b5cf6" },
        ]}
        narrative={`Scenario ${winner} generates ${dmFn(Math.abs(revDiff))} more monthly revenue (${dmFn(Math.abs(revDiff) * 12)}/year). ${winner === "A" ? `Scenario A achieves a ${rA.roi.toFixed(1)}× ROI vs B's ${rB.roi.toFixed(1)}×.` : `Scenario B achieves a ${rB.roi.toFixed(1)}× ROI vs A's ${rA.roi.toFixed(1)}×.`} ${Math.abs(rA.messages - rB.messages) > 0 ? `The volume difference of ${fmt(Math.abs(rA.messages - rB.messages))} messages accounts for ${dmFn(Math.abs(rA.spend - rB.spend))} in spend difference.` : ""}`}
      />
    </div>
  );
}

function ExportModal({ onClose, allData, channels, dealValue, country, industry, clientName: initName, broadcastsPerMonth, dmFn }: {
  onClose: () => void;
  allData: Record<string, DerivedMetrics>;
  channels: string[];
  dealValue: number;
  country: string;
  industry: string;
  clientName?: string;
  broadcastsPerMonth: number;
  dmFn: (n: number) => string;
}) {
  const [cn, setCn] = useState(initName || "");
  const [st, setSt] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const name = cn.trim() || "Client";
  const cc = channels.filter((c) => c !== "whatsapp");
  const wa = allData?.whatsapp;

  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  };

  const genCSV = async () => {
    try {
      setSt((s) => ({ ...s, csv: "loading" }));
      setErr("");
      const rows: string[][] = [["Metric", ...channels.map((c) => CH_CFG[c]?.label || c)]];
      const metrics: [string, (c: DerivedMetrics) => string][] = [
        ["Messages/Broadcast", (c) => fmt(c.messages)],
        ["Delivery Rate", (c) => pct(c.deliveryRate)],
        ["Open/Read Rate", (c) => pct(c.openRate)],
        ["CTR", (c) => pct(c.ctr)],
        ["Conversion Rate", (c) => pct(c.convRate, 2)],
        ["Conversions/Broadcast", (c) => fmt(c.conversions)],
        ["Revenue/Broadcast", (c) => "$" + c.revenue.toFixed(2)],
        ["Spend/Mo", (c) => "$" + c.spend.toFixed(2)],
        ["ROI", (c) => c.roi.toFixed(1) + "x"],
        ["Cost/Conversion", (c) => "$" + c.cpConv.toFixed(2)],
        ["Rev/1K Msgs", (c) => "$" + c.rev1k.toFixed(2)],
        ["Opt-Out Rate", (c) => pct(c.optOutRate, 2)],
      ];
      metrics.forEach(([label, fn]) => { rows.push([label, ...channels.map((c) => fn(allData[c]))]); });
      rows.push([]);
      rows.push(["Prepared for", name]);
      rows.push(["Country", country]);
      rows.push(["Industry", industry]);
      rows.push(["Deal Value", "$" + dealValue]);
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
      download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${name}_WhatsApp_ROI.csv`);
      setSt((s) => ({ ...s, csv: "done" }));
    } catch (e: any) {
      setErr(`CSV: ${e.message}`);
      setSt((s) => ({ ...s, csv: "" }));
    }
  };

  const genSummary = async () => {
    try {
      setSt((s) => ({ ...s, txt: "loading" }));
      setErr("");
      let txt = `WHATSAPP ROI ANALYSIS\n${"=".repeat(50)}\nPrepared for: ${name}\nCountry: ${country} | Industry: ${industry}\nDeal Value: $${dealValue}\nDate: ${new Date().toLocaleDateString()}\n\n`;
      txt += `CHANNEL COMPARISON\n${"-".repeat(50)}\n`;
      channels.forEach((ch) => {
        const d = allData[ch];
        const cfg = CH_CFG[ch];
        txt += `\n${cfg?.label}:\n  Messages/Broadcast: ${fmt(d.messages)}\n  Revenue/Broadcast: ${fmtMoney(d.revenue)}\n  ROI: ${d.roi.toFixed(1)}x\n  Conversions/Broadcast: ${fmt(d.conversions)}\n  Cost/Conversion: ${fmtMoney(d.cpConv)}\n  Rev/1K Messages: ${fmtMoney(d.rev1k)}\n  CTR: ${pct(d.ctr)}\n  Opt-Out Rate: ${pct(d.optOutRate, 2)}\n  Broadcasts/Month: ${broadcastsPerMonth}\n`;
      });
      if (cc.length > 0 && wa) {
        txt += `\nKEY INSIGHTS\n${"-".repeat(50)}\n`;
        cc.forEach((ch) => {
          const c = allData[ch];
          const rd = wa.revenue - c.revenue;
          txt += `\nWhatsApp vs ${CH_CFG[ch]?.label}:\n  Revenue advantage: ${fmtMoney(rd)}/month (${fmtMoney(rd * 12)}/year)\n  ROI advantage: ${(wa.roi - c.roi).toFixed(1)}x\n  Extra conversions: ${fmt(wa.conversions - c.conversions)}/month\n`;
        });
      }
      if (wa) {
        txt += `\nANNUAL PROJECTION\n${"-".repeat(50)}\n  WhatsApp: ${fmtMoney(wa.revenue * 12)}\n`;
        cc.forEach((ch) => { txt += `  ${CH_CFG[ch]?.label}: ${fmtMoney(allData[ch].revenue * 12)}\n`; });
      }
      download(new Blob([txt], { type: "text/plain;charset=utf-8" }), `${name}_WhatsApp_ROI_Summary.txt`);
      setSt((s) => ({ ...s, txt: "done" }));
    } catch (e: any) {
      setErr(`Summary: ${e.message}`);
      setSt((s) => ({ ...s, txt: "" }));
    }
  };

  const genHTML = async () => {
    try {
      setSt((s) => ({ ...s, html: "loading" }));
      setErr("");
      const scRows = channels.map((ch) => {
        const d = allData[ch];
        return { label: CH_CFG[ch]?.label || ch, msgs: fmt(d.messages), rev: fmtMoney(d.revenue), roi: d.roi.toFixed(1) + "x", cpconv: fmtMoney(d.cpConv), rev1k: fmtMoney(d.rev1k), ctr: pct(d.ctr), conv: fmt(d.conversions) };
      });
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name} - WhatsApp ROI Report</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,system-ui,sans-serif;background:#f8fafc;color:#1e293b;padding:0}.page{max-width:900px;margin:0 auto;padding:24px}.cover{background:linear-gradient(135deg,#0d7a3e,#25D366);color:#fff;padding:60px 40px;border-radius:16px;margin-bottom:24px}.cover h1{font-size:36px;margin-bottom:8px}.cover p{font-size:16px;opacity:0.85}.card{background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.06);margin-bottom:20px}h2{color:#0d7a3e;font-size:22px;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:10px 14px;text-align:right;border-bottom:1px solid #e2e8f0}th{background:#f8fafc;font-weight:600;color:#64748b}td:first-child,th:first-child{text-align:left}.best{color:#0d7a3e;font-weight:600}@media print{body{background:#fff}.cover{break-after:page}.card{break-inside:avoid;box-shadow:none;border:1px solid #e2e8f0}}</style></head><body><div class="page"><div class="cover"><h1>WhatsApp ROI Analysis</h1><p>Prepared for: ${name}</p><p>${country} &middot; ${industry}</p></div><div class="card"><h2>Channel Scorecard</h2><table><thead><tr><th>Metric</th>${scRows.map((r) => "<th>" + r.label + "</th>").join("")}</tr></thead><tbody><tr><td>Messages/Broadcast</td>${scRows.map((r) => "<td>" + r.msgs + "</td>").join("")}</tr><tr><td>CTR</td>${scRows.map((r) => "<td>" + r.ctr + "</td>").join("")}</tr><tr><td>Conversions/Broadcast</td>${scRows.map((r) => "<td>" + r.conv + "</td>").join("")}</tr><tr><td>Revenue/Broadcast</td>${scRows.map((r) => "<td class='best'>" + r.rev + "</td>").join("")}</tr><tr><td>ROI</td>${scRows.map((r) => "<td>" + r.roi + "</td>").join("")}</tr><tr><td>Cost/Conversion</td>${scRows.map((r) => "<td>" + r.cpconv + "</td>").join("")}</tr><tr><td>Rev/1K Messages</td>${scRows.map((r) => "<td>" + r.rev1k + "</td>").join("")}</tr></tbody></table></div><div class="card" style="text-align:center;color:#64748b;font-size:12px">Generated by WhatsApp ROI Calculator &middot; ${new Date().toLocaleDateString()}</div></div></body></html>`;
      download(new Blob([html], { type: "text/html;charset=utf-8" }), `${name}_WhatsApp_ROI_Report.html`);
      setSt((s) => ({ ...s, html: "done" }));
    } catch (e: any) {
      setErr(`HTML: ${e.message}`);
      setSt((s) => ({ ...s, html: "" }));
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-[#25D366]" /> Export Report
          </DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Client Name</Label>
          <Input value={cn} onChange={(e) => setCn(e.target.value)} placeholder="Enter client name for the report..." className="h-10" />
        </div>
        {err && <div className="text-xs text-red-500 mb-3 p-2 bg-red-50 rounded">{err}</div>}
        <div className="space-y-2.5">
          {[
            { k: "html", l: "HTML Report", d: "Branded, printable report with scorecard table", i: "📄", fn: genHTML },
            { k: "csv", l: "CSV Data", d: "Spreadsheet-ready data for all channels", i: "📊", fn: genCSV },
            { k: "txt", l: "Text Summary", d: "Plain text executive summary", i: "📝", fn: genSummary },
          ].map((x) => (
            <button
              key={x.k}
              onClick={x.fn}
              disabled={st[x.k] === "loading"}
              className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all hover:border-[#25D366]/50 w-full ${st[x.k] === "done" ? "bg-[#edfaf2] border-[#25D366]/30" : "bg-background"} ${st[x.k] === "loading" ? "cursor-wait opacity-70" : "cursor-pointer"}`}
            >
              <span className="text-xl">{st[x.k] === "loading" ? "⏳" : st[x.k] === "done" ? "✅" : x.i}</span>
              <div>
                <div className="font-bold text-sm">{st[x.k] === "done" ? "Downloaded!" : x.l}</div>
                <div className="text-xs text-muted-foreground">{x.d}</div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main ROI Calculator Page ───

export default function ROICalculator() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  // Wizard state
  const [mode, setMode] = useState<"marketing" | "utility">("marketing");
  const [marketingSubMode, setMarketingSubMode] = useState<"basic" | "advanced">("basic");
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [compChannels, setCompCh] = useState<string[]>(["sms"]);
  const [dealValue, setDV] = useState(50);
  const [chInputs, setChI] = useState<Record<string, ChannelInputs>>({});
  const [rTab, setRTab] = useState("scorecard");
  const [showExport, setShowExport] = useState(false);
  const [showSc, setShowSc] = useState(false);
  const [currencyMode, setCM] = useState<"usd" | "local">("usd");
  const [inputMode, setInputMode] = useState<"volume" | "goal">("volume");
  const [targetRevenue, setTargetRev] = useState(50000);
  const [clientName, setClientName] = useState("");

  // Broadcast frequency (shared across basic & advanced)
  const [broadcastsPerMonth, setBroadcastsPerMonth] = useState(2);

  // Basic mode simplified inputs
  const [basicMessages, setBasicMessages] = useState(50000);
  const [basicConvRate, setBasicConvRate] = useState(2.5);
  const [basicCostPerMsg, setBasicCostPerMsg] = useState(0.04);

  // 3rd Party BSP Costs (optional)
  const [bspMonthlyFee, setBspMonthlyFee] = useState(0);
  const [bspSetupCost, setBspSetupCost] = useState(0);
  const [bspOpen, setBspOpen] = useState(false);

  // Basic mode benchmark overrides
  const [benchmarkEditing, setBenchmarkEditing] = useState(false);
  const [benchDeliveryRate, setBenchDeliveryRate] = useState(97);
  const [benchReadRate, setBenchReadRate] = useState(95);
  const [benchCtr, setBenchCtr] = useState(30);
  const [benchOptOutRate, setBenchOptOutRate] = useState(0.35);

  const region = country ? COUNTRIES.find((c) => c.name === country)?.region ?? null : null;
  const countryData = COUNTRIES.find((c) => c.name === country);
  const indData = ROI_INDUSTRIES.find((i) => i.name === industry);
  const currencyInfo = country ? CURRENCIES[country] : null;

  // Step labels differ by mode
  const stepLabels = marketingSubMode === "basic"
    ? ["Country", "Industry", "Inputs", "Results"]
    : ["Country", "Industry", "Channels", "Inputs", "Results"];
  const totalSteps = stepLabels.length;
  const inputsStepIndex = marketingSubMode === "basic" ? 2 : 3;
  const resultsStepIndex = marketingSubMode === "basic" ? 3 : 4;

  // Currency
  const cRate = currencyMode === "local" && currencyInfo && currencyInfo.code !== "USD" ? currencyInfo.rate : 1;
  const cSym = currencyMode === "local" && currencyInfo && currencyInfo.code !== "USD" ? currencyInfo.symbol : "$";
  const dmFn = useCallback((n: number) => dm(n, cRate, cSym), [cRate, cSym]);

  // Reset on mode change
  useEffect(() => {
    setStep(0);
    setMarketingSubMode("basic");
    setCountry(null);
    setIndustry(null);
    setCompCh(["sms"]);
    setDV(50);
    setChI({});
    setRTab("scorecard");
    setCM("usd");
    setInputMode("volume");
    setTargetRev(50000);
    setClientName("");
    setBasicMessages(50000);
    setBasicConvRate(2.5);
    setBasicCostPerMsg(0.04);
    setBenchmarkEditing(false);
    setBroadcastsPerMonth(2);
    setBspMonthlyFee(0);
    setBspSetupCost(0);
    setBspOpen(false);
  }, [mode]);

  // Initialize basic mode defaults when country/industry change
  useEffect(() => {
    if (!region || !industry || !countryData) return;
    const convRate = CONV[region]?.[industry] || 2;
    setBasicConvRate(convRate);
    setBasicCostPerMsg(countryData.wap);
    const ind = ROI_INDUSTRIES.find((i) => i.name === industry);
    if (ind) setDV(ind.defaultDealValue);
    // Reset benchmark overrides to region defaults
    const wb = BENCH.whatsapp[region];
    if (wb) {
      setBenchDeliveryRate(wb.deliveryRate);
      setBenchReadRate(wb.openRate);
      setBenchCtr(wb.ctr);
      setBenchOptOutRate(wb.optOutRate);
    }
    setBenchmarkEditing(false);
  }, [region, industry, countryData]);

  // Initialize advanced channel inputs when region/industry/country change
  useEffect(() => {
    if (!(mode === "marketing" && marketingSubMode === "advanced") || !region || !industry || !countryData) return;
    const ni = initChannelInputs(region, industry, countryData, chInputs);
    setChI(ni);
  }, [region, industry, country, mode, marketingSubMode]);

  // Goal mode: reverse-calculate messages from target revenue (advanced only)
  useEffect(() => {
    if (!(mode === "marketing" && marketingSubMode === "advanced") || inputMode !== "goal" || !chInputs.whatsapp) return;
    const wa = chInputs.whatsapp;
    const dr = (wa.deliveryRate || 96) / 100;
    const or = (wa.openRate || 90) / 100;
    const ctr = (wa.ctr || 25) / 100;
    const cv = (wa.convRate || 5) / 100;
    const revenuePerMsg = dr * or * ctr * cv * dealValue;
    if (revenuePerMsg <= 0) return;
    const neededMsgs = Math.ceil(targetRevenue / revenuePerMsg);
    if (neededMsgs !== wa.messages) {
      setChI((p) => ({ ...p, whatsapp: { ...p.whatsapp, messages: neededMsgs } }));
    }
  }, [mode, marketingSubMode, inputMode, targetRevenue, dealValue, chInputs.whatsapp?.deliveryRate, chInputs.whatsapp?.openRate, chInputs.whatsapp?.ctr, chInputs.whatsapp?.convRate]);

  // Goal summary (advanced only)
  const goalSummary = useMemo(() => {
    if (!(mode === "marketing" && marketingSubMode === "advanced") || inputMode !== "goal" || !chInputs.whatsapp) return null;
    const wa = chInputs.whatsapp;
    const dr = (wa.deliveryRate || 96) / 100;
    const or = (wa.openRate || 90) / 100;
    const ctr = (wa.ctr || 25) / 100;
    const cv = (wa.convRate || 5) / 100;
    const revenuePerMsg = dr * or * ctr * cv * dealValue;
    const neededMsgs = revenuePerMsg > 0 ? Math.ceil(targetRevenue / revenuePerMsg) : 0;
    const spend = neededMsgs * (wa.costPerMsg || 0);
    const roi = spend > 0 ? targetRevenue / spend : 0;
    const conversions = dealValue > 0 ? Math.ceil(targetRevenue / dealValue) : 0;
    return { neededMsgs, spend, roi, conversions, targetRevenue };
  }, [mode, marketingSubMode, inputMode, targetRevenue, dealValue, chInputs.whatsapp]);

  // Compute all results — per-broadcast DerivedMetrics (unchanged for funnel/scorecard)
  const allR = useMemo(() => {
    if (marketingSubMode === "basic") {
      if (!region) return {};
      const benchOverrides = benchmarkEditing ? {
        deliveryRate: benchDeliveryRate,
        openRate: benchReadRate,
        ctr: benchCtr,
        optOutRate: benchOptOutRate,
      } : undefined;
      const waResult = deriveBasic(basicMessages, basicConvRate, basicCostPerMsg, dealValue, region, benchOverrides);
      return { whatsapp: waResult };
    } else {
      const r: Record<string, DerivedMetrics> = {};
      const ac = ["whatsapp", ...compChannels];
      ac.forEach((ch) => {
        if (chInputs[ch]) r[ch] = deriveAdv(chInputs[ch], dealValue);
      });
      return r;
    }
  }, [mode, marketingSubMode, basicMessages, basicConvRate, basicCostPerMsg, dealValue, region, chInputs, compChannels, benchmarkEditing, benchDeliveryRate, benchReadRate, benchCtr, benchOptOutRate]);

  // Compute broadcast-level metrics (aggregated monthly view)
  const allBR = useMemo(() => {
    if (marketingSubMode === "basic") {
      if (!region) return {};
      const benchOverrides = benchmarkEditing ? {
        deliveryRate: benchDeliveryRate,
        openRate: benchReadRate,
        ctr: benchCtr,
        optOutRate: benchOptOutRate,
      } : undefined;
      const waBR = deriveBroadcastBasic(basicMessages, basicConvRate, basicCostPerMsg, dealValue, region, broadcastsPerMonth, benchOverrides);
      return { whatsapp: waBR };
    } else {
      const r: Record<string, BroadcastMetrics> = {};
      const ac = ["whatsapp", ...compChannels];
      ac.forEach((ch) => {
        if (chInputs[ch]) r[ch] = deriveBroadcast(chInputs[ch], dealValue, broadcastsPerMonth);
      });
      return r;
    }
  }, [mode, marketingSubMode, basicMessages, basicConvRate, basicCostPerMsg, dealValue, region, chInputs, compChannels, benchmarkEditing, benchDeliveryRate, benchReadRate, benchCtr, benchOptOutRate, broadcastsPerMonth]);

  const activeChannels = marketingSubMode === "basic" ? ["whatsapp"] : ["whatsapp", ...compChannels];
  const displayName = clientName.trim() || industry || "your business";

  const applySc = (sc: typeof SCENARIOS[0]) => {
    setCountry(sc.country);
    setIndustry(sc.industry);
    setDV(sc.dealValue);
    setBroadcastsPerMonth(sc.broadcastsPerMonth);
    if (marketingSubMode === "basic") {
      setBasicMessages(sc.messages);
    } else {
      setTimeout(() => {
        setChI((p) => {
          const u = { ...p };
          Object.keys(u).forEach((ch) => {
            if (u[ch]) u[ch] = { ...u[ch], messages: sc.messages };
          });
          return u;
        });
      }, 100);
    }
    setShowSc(false);
    setStep(inputsStepIndex);
  };

  const canGo = () => {
    if (step === 0) return !!country;
    if (step === 1) return !!industry;
    if (marketingSubMode === "advanced" && step === 2) return compChannels.length > 0;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edfaf2]/50 via-background to-[#eef2ff]/30">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663344446488/YocM5kPJZcUQjCCGhq86Jj/whatsapp-logo_55bb387d.png" alt="WhatsApp" className="w-7 h-7" />
              <span className="font-bold text-[15px] tracking-tight hidden sm:inline">WhatsApp Pitch Builder</span>
            </div>
            {isAuthenticated && (
              <>
                <div className="h-5 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-1 hidden sm:flex">
                  <Button variant="ghost" size="sm" onClick={() => navigate("/threads")} className="text-sm text-muted-foreground hover:text-foreground h-8">
                    <FolderOpen className="w-3.5 h-3.5 mr-1.5" /> My Threads
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/templates")} className="text-sm text-muted-foreground hover:text-foreground h-8">
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Template Library
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/roi-calculator")} className="text-sm text-foreground font-semibold h-8 bg-[#25D366]/10">
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
                    <FolderOpen className="w-4 h-4 mr-2" /> My Threads
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/templates")} className="sm:hidden">
                    <BookOpen className="w-4 h-4 mr-2" /> Template Library
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/roi-calculator")} className="sm:hidden">
                    <Calculator className="w-4 h-4 mr-2" /> ROI Calculator
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

      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-[#25D366]" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              WhatsApp Paid Messaging <span className="text-[#25D366]">ROI Calculator</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            {mode === "utility"
              ? "Calculate ROI for WhatsApp Utility Messages across operational use cases"
              : "Quickly estimate WhatsApp Paid Messaging ROI with just a few inputs"
            }
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
              {(["marketing", "utility"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-5 py-2 rounded-md text-xs font-bold capitalize transition-all ${mode === m ? "bg-[#0f172a] text-white" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            {mode === "marketing" && (
              <Button variant="outline" size="sm" onClick={() => setShowSc(true)} className="text-xs h-8 gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Quick Scenarios
              </Button>
            )}
          </div>
        </div>

        {/* ─── Disclaimer ─── */}
        <div className="flex items-center justify-center gap-2 mb-6 px-4">
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 border border-border/50 rounded-lg px-4 py-2.5 max-w-2xl">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/70" />
            <span>Disclaimer: All figures presented are estimates based on industry benchmarks and publicly available data. Actual results may vary depending on implementation, audience, and market conditions. These projections do not constitute a guarantee of performance.</span>
          </div>
        </div>

        {/* ─── UTILITY MODE: Separate flow ─── */}
        {mode === "utility" ? (
          <UtilityCalculator />
        ) : (
        <>
          {/* Marketing sub-mode toggle: Basic / Advanced */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground font-medium">Mode:</span>
            <div className="flex gap-0.5 bg-muted rounded-md p-0.5">
              <button onClick={() => { setMarketingSubMode("basic"); setStep(0); }} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${marketingSubMode === "basic" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Basic</button>
              <button onClick={() => { setMarketingSubMode("advanced"); setStep(0); }} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${marketingSubMode === "advanced" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Advanced</button>
            </div>
          </div>
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
              <p className="text-sm text-muted-foreground mb-5">Choose the country for messaging cost benchmarks and currency</p>
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
              {country && currencyInfo && (
                <div className="mt-4 flex items-center gap-3">
                  <Label className="text-xs font-semibold text-muted-foreground">Currency:</Label>
                  <div className="flex gap-0.5 bg-muted rounded-md p-0.5">
                    <button onClick={() => setCM("usd")} className={`px-3 py-1 rounded text-xs font-bold transition-all ${currencyMode === "usd" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>USD ($)</button>
                    <button onClick={() => setCM("local")} className={`px-3 py-1 rounded text-xs font-bold transition-all ${currencyMode === "local" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>{currencyInfo.code} ({currencyInfo.symbol})</button>
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
              <p className="text-sm text-muted-foreground mb-5">Industry determines conversion benchmarks and the outcome metric that matters most</p>
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
                    <div className="text-[10px] text-muted-foreground">{ind.rateLabel}</div>
                    <div className="text-[9px] text-muted-foreground/70 mt-0.5">{ind.dealValueLabel}: ${fmt(ind.defaultDealValue)}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Step 2 (Advanced): Channels ─── */}
        {marketingSubMode === "advanced" && step === 2 && (
          <Card className="max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-3">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-5">
                <ArrowLeftRight className="w-5 h-5 text-[#25D366]" />
                <h2 className="font-bold text-lg">Compare Channels</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5">Select channels to compare against WhatsApp</p>
              <div className="space-y-3">
                {(["sms", "email", "inapp"] as const).map((ch) => {
                  const cfg = CH_CFG[ch];
                  const selected = compChannels.includes(ch);
                  const desc: Record<string, string> = {
                    sms: "Traditional text messaging with high open rates but limited rich media",
                    email: "Cost-effective for newsletters and promotions, lower engagement rates",
                    inapp: "Push & in-app notifications — high delivery, lower open rates, app-only reach",
                  };
                  return (
                    <button
                      key={ch}
                      onClick={() => setCompCh(selected ? compChannels.filter((c) => c !== ch) : [...compChannels, ch])}
                      className={`w-full p-4 rounded-lg border flex items-center gap-3 transition-all ${selected ? "border-2" : "border-border"}`}
                      style={selected ? { borderColor: cfg.color, background: cfg.bg } : {}}
                    >
                      <span className="text-xl">{cfg.icon}</span>
                      <div className="text-left">
                        <span className="font-bold block" style={{ color: selected ? cfg.dark : undefined }}>{cfg.label}</span>
                        <span className="text-xs text-muted-foreground">{desc[ch]}</span>
                      </div>
                      {selected && <Check className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: cfg.dark }} />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Inputs Step ─── */}
        {step === inputsStepIndex && (
          <div className="animate-in fade-in slide-in-from-bottom-3">
            {marketingSubMode === "basic" ? (
              /* ─── BASIC MODE: Simple WhatsApp-only inputs ─── */
              <Card className="max-w-2xl mx-auto">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="text-xl">💬</span>
                    <span className="font-extrabold text-lg text-[#0d7a3e]">WhatsApp Inputs</span>
                    <Badge variant="secondary" className="text-[10px] font-mono bg-[#edfaf2] text-[#0d7a3e]">
                      {region}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Enter your WhatsApp messaging parameters. Benchmarks are pre-filled based on {region} averages for {industry}.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                    <InputField
                      label="Messages per Broadcast"
                      value={basicMessages}
                      onChange={setBasicMessages}
                      tooltip="Number of messages sent in a single broadcast (e.g., 50,000 contacts reached per send)"
                      min={0}
                    />
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Broadcasts per Month</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-[10px] text-muted-foreground cursor-help font-bold">?</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[240px] text-xs">How many times per month you send a broadcast to your audience (e.g., 2 = twice a month)</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[Math.min(broadcastsPerMonth, 12)]}
                          onValueChange={([v]) => setBroadcastsPerMonth(v)}
                          min={1}
                          max={12}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={broadcastsPerMonth}
                          onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setBroadcastsPerMonth(v); }}
                          min={1}
                          className="w-16 h-8 text-center text-sm font-mono font-bold text-[#0d7a3e] px-1"
                        />
                        <span className="text-xs text-muted-foreground">×/mo</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                        {fmt(basicMessages * broadcastsPerMonth)} total messages/month &middot; {dmFn(basicCostPerMsg * basicMessages * broadcastsPerMonth)} total spend/month
                      </div>
                    </div>
                    <InputField
                      label={indData?.rateLabel || "Conversion Rate"}
                      value={basicConvRate}
                      onChange={setBasicConvRate}
                      suffix="%"
                      tooltip={`Overall ${indData?.rateLabel?.toLowerCase() || "conversion rate"} for ${industry} in ${region}. Benchmark: ${CONV[region || ""]?.[industry || ""] || 2}%`}
                      min={0}
                      max={100}
                    />
                    <InputField
                      label="Cost per Message"
                      value={basicCostPerMsg}
                      onChange={setBasicCostPerMsg}
                      prefix="$"
                      tooltip={`WhatsApp messaging cost in ${country}. Pre-filled: $${countryData?.wap || 0.04}`}
                      min={0}
                      step={0.001}
                    />
                    <InputField
                      label={indData?.dealValueLabel || "Avg Deal Value"}
                      value={dealValue}
                      onChange={setDV}
                      prefix="$"
                      tooltip={`Average revenue per ${indData?.rateLabel?.toLowerCase()?.replace(" rate", "") || "conversion"}`}
                      min={0}
                    />
                  </div>

                  {/* Benchmark section with edit toggle */}
                  <div className={`mt-4 p-3 rounded-lg border transition-all duration-200 ${benchmarkEditing ? "bg-[#edfaf2]/50 border-[#25D366]/30" : "bg-muted/50 border-border"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {benchmarkEditing ? "Custom" : "Auto-applied"} {region} WhatsApp Benchmarks
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-medium">{benchmarkEditing ? "Editing" : "Locked"}</span>
                        <Switch
                          checked={benchmarkEditing}
                          onCheckedChange={(checked) => {
                            setBenchmarkEditing(checked);
                            if (!checked && region) {
                              // Reset to defaults when turning off
                              const wb = BENCH.whatsapp[region];
                              if (wb) {
                                setBenchDeliveryRate(wb.deliveryRate);
                                setBenchReadRate(wb.openRate);
                                setBenchCtr(wb.ctr);
                                setBenchOptOutRate(wb.optOutRate);
                              }
                            }
                          }}
                          className="h-4 w-7 data-[state=checked]:bg-[#25D366]"
                        />
                      </div>
                    </div>
                    {benchmarkEditing ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <InputField label="Delivery Rate" value={benchDeliveryRate} onChange={setBenchDeliveryRate} suffix="%" min={0} max={100} tooltip="% of messages successfully delivered" />
                        <InputField label="Read Rate" value={benchReadRate} onChange={setBenchReadRate} suffix="%" min={0} max={100} tooltip="% of delivered messages that are read" />
                        <InputField label="Click-Through Rate" value={benchCtr} onChange={setBenchCtr} suffix="%" min={0} max={100} tooltip="% of readers who click a link" />
                        <InputField label="Opt-Out Rate" value={benchOptOutRate} onChange={setBenchOptOutRate} suffix="%" min={0} max={100} step={0.01} tooltip="% of recipients who opt out per send" />
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {[
                          { l: "Delivery Rate", v: `${benchDeliveryRate}%` },
                          { l: "Read Rate", v: `${benchReadRate}%` },
                          { l: "Click-Through Rate", v: `${benchCtr}%` },
                          { l: "Opt-Out Rate", v: `${benchOptOutRate}%` },
                        ].map((b, i) => (
                          <span key={i} className="text-[11px] text-muted-foreground">
                            <span className="font-medium">{b.l}:</span> <span className="font-mono font-bold text-[#0d7a3e]">{b.v}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Optional client name */}
                  <div className="mt-4">
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Client Name (optional)</Label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Enter client name for personalized reports..." className="h-10" />
                  </div>

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
                          <InputField
                            label="Monthly Platform Fee"
                            value={bspMonthlyFee}
                            onChange={setBspMonthlyFee}
                            prefix="$"
                            tooltip="Recurring monthly licensing or subscription fee paid to the BSP"
                            min={0}
                          />
                          <InputField
                            label="One-time Setup Cost"
                            value={bspSetupCost}
                            onChange={setBspSetupCost}
                            prefix="$"
                            tooltip="One-time implementation or onboarding fee (shown separately in results)"
                            min={0}
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            ) : (
              /* ─── ADVANCED MODE: Full channel inputs ─── */
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#25D366]" />
                    <h2 className="font-bold text-lg">Configure Inputs</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5 bg-muted rounded-md p-0.5">
                      <button onClick={() => setInputMode("volume")} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${inputMode === "volume" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>By Volume</button>
                      <button onClick={() => setInputMode("goal")} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${inputMode === "goal" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>By Revenue Goal</button>
                    </div>
                  </div>
                </div>

                {inputMode === "goal" && (
                  <Card className="mb-5 border-[#25D366]/30 bg-[#edfaf2]/50">
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-[#25D366]" />
                        <span className="font-bold text-sm text-[#0d7a3e]">Revenue Goal Mode</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="Target Monthly Revenue ($)" value={targetRevenue} onChange={setTargetRev} prefix="$" min={0} tooltip="Set your desired monthly revenue and we'll calculate the messages needed" />
                        <InputField label={indData?.dealValueLabel || "Avg Deal Value"} value={dealValue} onChange={setDV} prefix="$" min={0} tooltip={`Average revenue per ${indData?.rateLabel?.toLowerCase()?.replace(" rate", "") || "conversion"}`} />
                      </div>
                      {goalSummary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <MetricCard label="Messages Needed" value={fmt(goalSummary.neededMsgs)} color="#25D366" icon="📨" />
                          <MetricCard label="Monthly Spend" value={dmFn(goalSummary.spend)} color="#64748b" icon="💰" />
                          <MetricCard label="Projected ROI" value={goalSummary.roi.toFixed(1) + "×"} color="#0d7a3e" icon="📈" />
                          <MetricCard label="Conversions Needed" value={fmt(goalSummary.conversions)} color="#25D366" icon="🎯" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {inputMode === "volume" && (
                  <Card className="mb-5">
                    <CardContent className="pt-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InputField label={indData?.dealValueLabel || "Avg Deal Value"} value={dealValue} onChange={setDV} prefix="$" min={0} tooltip={`Average revenue per ${indData?.rateLabel?.toLowerCase()?.replace(" rate", "") || "conversion"}`} />
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Broadcasts per Month</label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-[10px] text-muted-foreground cursor-help font-bold">?</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[240px] text-xs">How many times per month you send a broadcast to your audience</TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="flex items-center gap-3">
                            <Slider
                              value={[Math.min(broadcastsPerMonth, 12)]}
                              onValueChange={([v]) => setBroadcastsPerMonth(v)}
                              min={1}
                              max={12}
                              step={1}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={broadcastsPerMonth}
                              onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setBroadcastsPerMonth(v); }}
                              min={1}
                              className="w-16 h-8 text-center text-sm font-mono font-bold text-[#0d7a3e] px-1"
                            />
                            <span className="text-xs text-muted-foreground">×/mo</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Client Name (optional)</Label>
                          <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Enter client name..." className="h-10" />
                        </div>
                      </div>
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
                              <InputField
                                label="Monthly Platform Fee"
                                value={bspMonthlyFee}
                                onChange={setBspMonthlyFee}
                                prefix="$"
                                tooltip="Recurring monthly licensing or subscription fee paid to the BSP"
                                min={0}
                              />
                              <InputField
                                label="One-time Setup Cost"
                                value={bspSetupCost}
                                onChange={setBspSetupCost}
                                prefix="$"
                                tooltip="One-time implementation or onboarding fee (shown separately in results)"
                                min={0}
                              />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                )}

                {activeChannels.map((ch) => chInputs[ch] && region && (
                  <ChannelInputPanel
                    key={ch}
                    channel={ch}
                    inputs={chInputs[ch]}
                    onChange={(v) => setChI((p) => ({ ...p, [ch]: v }))}
                    region={region}
                    country={country || ""}
                    rateLabel={indData?.rateLabel || "Conversion Rate"}
                    dmFn={dmFn}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* ─── Results Step ─── */}
        {step === resultsStepIndex && allR.whatsapp && (
          <div className="animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#25D366]" />
                <h2 className="font-bold text-lg">Results for {displayName}</h2>
              </div>
              <Button onClick={() => setShowExport(true)} size="sm" className="bg-[#25D366] hover:bg-[#1da851] gap-1.5 h-8">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
            </div>

            {marketingSubMode === "basic" ? (
              /* ─── BASIC MODE RESULTS: Simplified single-channel view ─── */
              <div className="space-y-6">
                {/* Key metrics cards - broadcast-based with monthly aggregates */}
                {(() => {
                  const baseMonthlySpend = allBR.whatsapp?.monthlySpend ?? allR.whatsapp.spend;
                  const baseMonthlyRevenue = allBR.whatsapp?.monthlyRevenue ?? allR.whatsapp.revenue;
                  const totalMonthlySpend = baseMonthlySpend + bspMonthlyFee;
                  const adjustedROI = totalMonthlySpend > 0 ? baseMonthlyRevenue / totalMonthlySpend : 0;
                  const hasBsp = bspMonthlyFee > 0 || bspSetupCost > 0;
                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MetricCard label="Monthly Revenue" value={dmFn(baseMonthlyRevenue)} color="#25D366" icon="💰" delay={0} />
                        <MetricCard label={hasBsp ? "True ROI" : "ROI"} value={adjustedROI.toFixed(1) + "×"} color="#0d7a3e" icon="📈" delay={0.05} />
                        <MetricCard label={`Monthly ${indData?.rateLabel?.replace(" Rate", "s") || "Conversions"}`} value={fmt(allBR.whatsapp?.monthlyConversions ?? allR.whatsapp.conversions)} color="#25D366" icon="🎯" delay={0.1} />
                        <MetricCard label={hasBsp ? "Total Monthly Cost" : "Monthly Spend"} value={dmFn(totalMonthlySpend)} color="#64748b" icon="📨" delay={0.15} />
                      </div>
                      {hasBsp && (
                        <div className="-mt-3 p-3 rounded-lg border border-[#f59e0b]/20 bg-[#fffbeb]/50">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">🏢</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cost Breakdown (incl. 3rd Party BSP)</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <div className="text-[10px] text-muted-foreground">Meta Messaging</div>
                              <div className="text-sm font-bold text-foreground">{dmFn(baseMonthlySpend)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground">BSP Platform Fee</div>
                              <div className="text-sm font-bold text-[#f59e0b]">{dmFn(bspMonthlyFee)}/mo</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground">Total Monthly</div>
                              <div className="text-sm font-bold text-foreground">{dmFn(totalMonthlySpend)}</div>
                            </div>
                            {bspSetupCost > 0 && (
                              <div>
                                <div className="text-[10px] text-muted-foreground">One-time Setup</div>
                                <div className="text-sm font-bold text-[#b45309]">{dmFn(bspSetupCost)}</div>
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-2 font-mono">
                            Monthly profit: {dmFn(baseMonthlyRevenue - totalMonthlySpend)} | ROI without BSP: {(baseMonthlySpend > 0 ? baseMonthlyRevenue / baseMonthlySpend : 0).toFixed(1)}× → True ROI: {adjustedROI.toFixed(1)}×
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
                {broadcastsPerMonth > 1 && (
                  <div className="text-[11px] text-muted-foreground text-center -mt-3 font-mono">
                    Based on {broadcastsPerMonth} broadcasts/month × {fmt(basicMessages)} messages/broadcast = {fmt(basicMessages * broadcastsPerMonth)} total messages/month
                  </div>
                )}

                {/* Funnel */}
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">📊</span>
                      <span className="font-bold text-base">WhatsApp Messaging Funnel</span>
                    </div>
                    <FunnelViz data={allR.whatsapp} color="#25D366" label="whatsapp" />
                  </CardContent>
                </Card>

                {/* Additional metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <MetricCard label={`Cost per ${indData?.rateLabel?.replace(" Rate", "") || "Conversion"}`} value={dmFn(allR.whatsapp.cpConv)} color="#f59e0b" icon="💵" />
                  <MetricCard label="Revenue per 1K Messages" value={dmFn(allR.whatsapp.rev1k)} color="#0d7a3e" icon="📊" />
                  <MetricCard label="Annual Revenue (est.)" value={dmFn((allBR.whatsapp?.monthlyRevenue ?? allR.whatsapp.revenue) * 12)} color="#25D366" icon="📅" />
                </div>

                {/* Break-Even */}
                <BreakEvenCard waData={allR.whatsapp} broadcastMetrics={allBR.whatsapp} dealValue={dealValue} clientName={clientName || undefined} dmFn={dmFn} bspMonthlyFee={bspMonthlyFee} bspSetupCost={bspSetupCost} />

                {/* Executive Summary */}
                <ExecutiveSummary
                  waData={allR.whatsapp}
                  compData={allR}
                  channels={["whatsapp"]}
                  country={country || ""}
                  industry={industry || ""}
                  clientName={clientName || undefined}
                  dmFn={dmFn}
                  bspMonthlyFee={bspMonthlyFee}
                />
              </div>
            ) : (
              /* ─── ADVANCED MODE RESULTS: Unified single-page view with insights ─── */
              <Tabs value={rTab} onValueChange={setRTab}>
                <TabsList className="w-full flex overflow-x-auto mb-6 bg-muted/50 p-1 rounded-lg h-auto flex-wrap">
                  <TabsTrigger value="scorecard" className="text-xs flex-1 min-w-fit">📊 Scorecard</TabsTrigger>
                  {compChannels.length > 0 && <TabsTrigger value="shift" className="text-xs flex-1 min-w-fit">🔄 Shift Simulator</TabsTrigger>}
                  {compChannels.length > 0 && <TabsTrigger value="health" className="text-xs flex-1 min-w-fit">🛡️ Audience Health</TabsTrigger>}
                  <TabsTrigger value="breakeven" className="text-xs flex-1 min-w-fit">🎯 Break-Even</TabsTrigger>
                  <TabsTrigger value="summary" className="text-xs flex-1 min-w-fit">🚀 Summary</TabsTrigger>
                  <TabsTrigger value="compare" className="text-xs flex-1 min-w-fit">⚖️ Scenarios</TabsTrigger>
                  <TabsTrigger value="projection" className="text-xs flex-1 min-w-fit">📈 Projection</TabsTrigger>
                </TabsList>

                {/* ─── SCORECARD: Unified table + funnels + insights ─── */}
                <TabsContent value="scorecard">
                  <ScorecardTable channels={activeChannels} data={allR} dmFn={dmFn} />
                  {(bspMonthlyFee > 0 || bspSetupCost > 0) && allR.whatsapp && (() => {
                    const waSpend = allBR.whatsapp?.monthlySpend ?? allR.whatsapp.spend;
                    const waRevenue = allBR.whatsapp?.monthlyRevenue ?? allR.whatsapp.revenue;
                    const totalCost = waSpend + bspMonthlyFee;
                    const trueROI = totalCost > 0 ? waRevenue / totalCost : 0;
                    return (
                      <div className="mb-4 p-3 rounded-lg border border-[#f59e0b]/20 bg-[#fffbeb]/50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">🏢</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cost Breakdown (incl. 3rd Party BSP)</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <div className="text-[10px] text-muted-foreground">Meta Messaging</div>
                            <div className="text-sm font-bold text-foreground">{dmFn(waSpend)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground">BSP Platform Fee</div>
                            <div className="text-sm font-bold text-[#f59e0b]">{dmFn(bspMonthlyFee)}/mo</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground">Total Monthly</div>
                            <div className="text-sm font-bold text-foreground">{dmFn(totalCost)}</div>
                          </div>
                          {bspSetupCost > 0 && (
                            <div>
                              <div className="text-[10px] text-muted-foreground">One-time Setup</div>
                              <div className="text-sm font-bold text-[#b45309]">{dmFn(bspSetupCost)}</div>
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-2 font-mono">
                          Monthly profit: {dmFn(waRevenue - totalCost)} | ROI without BSP: {(waSpend > 0 ? waRevenue / waSpend : 0).toFixed(1)}× → True ROI: {trueROI.toFixed(1)}×
                        </div>
                      </div>
                    );
                  })()}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {activeChannels.map((ch) => allR[ch] && (
                      <FunnelViz key={ch} data={allR[ch]} color={CH_CFG[ch]?.color || "#666"} label={ch} maxMessages={Math.max(...activeChannels.map((c) => allR[c]?.messages || 0))} />
                    ))}
                  </div>
                  {/* Scorecard insights for each competitor channel */}
                  {compChannels.map((ch) => {
                    const c = allR[ch];
                    const wa = allR.whatsapp;
                    if (!c || !wa) return null;
                    const efficiencyX = c.rev1k > 0 ? wa.rev1k / c.rev1k : 0;
                    const opportunityCost = wa.revenue - c.revenue;
                    const waReach = (wa.deliveryRate / 100) * (wa.openRate / 100) * 100;
                    const cReach = (c.deliveryRate / 100) * (c.openRate / 100) * 100;
                    const ctrMultiplier = c.ctr > 0 ? wa.ctr / c.ctr : 0;
                    const waConvPer100 = wa.messages > 0 ? (wa.conversions / wa.messages) * 100 : 0;
                    const cConvPer100 = c.messages > 0 ? (c.conversions / c.messages) * 100 : 0;
                    return (
                      <div key={ch} className="mb-4">
                        <InsightBox
                          pills={[
                            { label: "Efficiency", value: efficiencyX.toFixed(1) + "×", icon: "⚡", color: "#25D366" },
                            { label: "Opportunity Cost", value: dmFn(Math.abs(opportunityCost)), icon: "💸", color: opportunityCost > 0 ? "#f59e0b" : "#ef4444" },
                            { label: "WA Rev/1K", value: dmFn(wa.rev1k), icon: "💰", color: "#25D366" },
                          ]}
                          narrative={`WhatsApp is ${efficiencyX.toFixed(1)}× more efficient than ${CH_CFG[ch]?.label}. The opportunity cost of using ${CH_CFG[ch]?.label} for your ${fmt(c.messages)} monthly messages is ~${dmFn(Math.abs(opportunityCost))}/month in foregone revenue.`}
                        />
                        <div className="mt-3">
                          <InsightBox
                            pills={[
                              { label: "WA Reach", value: pct(waReach), icon: "💬", color: "#25D366" },
                              { label: `${CH_CFG[ch]?.label} Reach`, value: pct(cReach), icon: CH_CFG[ch]?.icon, color: CH_CFG[ch]?.color },
                              { label: "CTR Mul", value: ctrMultiplier.toFixed(1) + "×", icon: "🎯", color: "#25D366" },
                            ]}
                            narrative={`WhatsApp's ${pct(wa.ctr)} CTR is ${ctrMultiplier.toFixed(1)}× stronger than ${CH_CFG[ch]?.label}'s ${pct(c.ctr)}. Per 100 messages, WhatsApp generates ${waConvPer100.toFixed(2)} conversions vs ${cConvPer100.toFixed(2)}. This translates to ${dmFn(Math.abs(opportunityCost))} more monthly revenue.`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>

                {/* ─── SHIFT SIMULATOR: All channels unified on one page ─── */}
                {compChannels.length > 0 && (
                  <TabsContent value="shift">
                    <div className="space-y-6">
                      {compChannels.map((ch) => allR[ch] && (
                        <ShiftSimulator key={ch} waData={allR.whatsapp!} compData={allR[ch]} compChannel={ch} dealValue={dealValue} dmFn={dmFn} />
                      ))}
                    </div>
                  </TabsContent>
                )}

                {/* ─── AUDIENCE HEALTH: All channels unified on one page ─── */}
                {compChannels.length > 0 && (
                  <TabsContent value="health">
                    <div className="space-y-6">
                      {compChannels.map((ch) => allR[ch] && (
                        <AudienceHealthPanel key={ch} waData={allR.whatsapp!} compData={allR[ch]} compChannel={ch} dmFn={dmFn} />
                      ))}
                    </div>
                  </TabsContent>
                )}

                {/* ─── BREAK-EVEN ─── */}
                <TabsContent value="breakeven">
                  <BreakEvenCard waData={allR.whatsapp!} broadcastMetrics={allBR.whatsapp} dealValue={dealValue} clientName={clientName || undefined} dmFn={dmFn} bspMonthlyFee={bspMonthlyFee} bspSetupCost={bspSetupCost} />
                  {/* Break-even comparison insight for competitor channels */}
                  {compChannels.map((ch) => {
                    const c = allR[ch];
                    const wa = allR.whatsapp;
                    if (!c || !wa) return null;
                    const waProfit = wa.revenue - wa.spend;
                    const cProfit = c.revenue - c.spend;
                    const waBEConv = dealValue > 0 ? Math.ceil(wa.spend / dealValue) : 0;
                    const cBEConv = dealValue > 0 ? Math.ceil(c.spend / dealValue) : 0;
                    const waConvPerMsg = wa.messages > 0 ? wa.conversions / wa.messages : 0;
                    const cConvPerMsg = c.messages > 0 ? c.conversions / c.messages : 0;
                    const waBEMsgs = waConvPerMsg > 0 ? Math.ceil(waBEConv / waConvPerMsg) : 0;
                    const cBEMsgs = cConvPerMsg > 0 ? Math.ceil(cBEConv / cConvPerMsg) : 0;
                    const waBEDays = wa.messages > 0 ? Math.ceil(waBEMsgs / (wa.messages / 30)) : 30;
                    const cBEDays = c.messages > 0 ? Math.ceil(cBEMsgs / (c.messages / 30)) : 30;
                    return (
                      <div key={ch} className="mt-4">
                        <InsightBox
                          pills={[
                            { label: "WA Break-Even", value: `Day ${waBEDays}`, icon: "💬", color: "#25D366" },
                            { label: `${CH_CFG[ch]?.label} Break-Even`, value: `Day ${cBEDays}`, icon: CH_CFG[ch]?.icon, color: CH_CFG[ch]?.color },
                            { label: "Profit Delta", value: dmFn(Math.abs(waProfit - cProfit)), icon: "📊", color: waProfit > cProfit ? "#25D366" : "#ef4444" },
                          ]}
                          narrative={`WhatsApp reaches break-even by day ${waBEDays} of the 30-day cycle, needing just ${fmt(waBEConv)} conversions. ${CH_CFG[ch]?.label} requires ${fmt(cBEConv)} conversions, reaching break-even by day ${cBEDays}. WhatsApp generates ${dmFn(Math.abs(waProfit - cProfit))} ${waProfit > cProfit ? "more" : "less"} monthly profit (${dmFn(waProfit)} vs ${dmFn(cProfit)}), making it the ${waProfit > cProfit ? "stronger" : "comparable"} investment.`}
                        />
                      </div>
                    );
                  })}
                </TabsContent>

                {/* ─── EXECUTIVE SUMMARY with enhanced insights ─── */}
                <TabsContent value="summary">
                  <ExecutiveSummary
                    waData={allR.whatsapp!}
                    compData={allR}
                    channels={activeChannels}
                    country={country || ""}
                    industry={industry || ""}
                    clientName={clientName || undefined}
                    dmFn={dmFn}
                    bspMonthlyFee={bspMonthlyFee}
                  />
                  {/* Summary-level strategic insights */}
                  {compChannels.length > 0 && allR.whatsapp && (() => {
                    const wa = allR.whatsapp!;
                    const totalOppCost = compChannels.reduce((sum, ch) => sum + Math.max(wa.revenue - (allR[ch]?.revenue || 0), 0), 0);
                    const avgEfficiency = compChannels.reduce((sum, ch) => {
                      const c = allR[ch];
                      return sum + (c && c.rev1k > 0 ? wa.rev1k / c.rev1k : 0);
                    }, 0) / compChannels.length;
                    const waAnnual = wa.revenue * 12;
                    const bestCompAnnual = Math.max(...compChannels.map((ch) => (allR[ch]?.revenue || 0) * 12));
                    return (
                      <InsightBox
                        pills={[
                          { label: "WA Annual Rev", value: dmFn(waAnnual), icon: "💰", color: "#25D366" },
                          { label: "Best Alt Annual", value: dmFn(bestCompAnnual), icon: "📊", color: "#6366f1" },
                          { label: "Avg Efficiency", value: avgEfficiency.toFixed(1) + "×", icon: "⚡", color: "#25D366" },
                        ]}
                        narrative={`Across all channels analyzed, WhatsApp delivers an average ${avgEfficiency.toFixed(1)}× efficiency advantage. The combined monthly opportunity cost of not using WhatsApp is ${dmFn(totalOppCost)}. Over 12 months, WhatsApp is projected to generate ${dmFn(waAnnual)} — ${dmFn(waAnnual - bestCompAnnual)} more than the next best channel. This data makes a compelling case for shifting messaging investment to WhatsApp as the primary customer engagement channel.`}
                      />
                    );
                  })()}
                </TabsContent>

                {/* ─── SCENARIO COMPARE ─── */}
                <TabsContent value="compare">
                  <ScenarioCompare baseInputs={chInputs.whatsapp} dealValue={dealValue} dmFn={dmFn} />
                </TabsContent>

                {/* ─── MONTHLY PROJECTION with insights ─── */}
                <TabsContent value="projection">
                  <MonthlyProjection waData={allR.whatsapp!} compData={allR} channels={activeChannels} dealValue={dealValue} broadcastsPerMonth={broadcastsPerMonth} dmFn={dmFn} />
                  {/* Projection insights */}
                  {compChannels.length > 0 && allR.whatsapp && (() => {
                    const wa = allR.whatsapp!;
                    // Calculate 12-month projections accounting for opt-out decay
                    const projRevenue = (d: DerivedMetrics) => {
                      let audience = d.messages;
                      let total = 0;
                      for (let i = 0; i < 12; i++) {
                        total += audience * (d.deliveryRate / 100) * (d.openRate / 100) * (d.ctr / 100) * (d.convRate / 100) * dealValue;
                        audience *= (1 - (d.optOutRate || 0.5) / 100);
                      }
                      return total;
                    };
                    const wa12 = projRevenue(wa);
                    return (
                      <div className="space-y-3">
                        {compChannels.map((ch) => {
                          const c = allR[ch];
                          if (!c) return null;
                          const c12 = projRevenue(c);
                          const revPremium = c12 > 0 ? ((wa12 - c12) / c12) * 100 : 0;
                          const extraSalesPerMo = wa.conversions - c.conversions;
                          const roiDelta = wa.roi - c.roi;
                          return (
                            <InsightBox
                              key={ch}
                              pills={[
                                { label: "Revenue Premium", value: Math.abs(revPremium).toFixed(0) + "%", icon: "📈", color: "#25D366" },
                                { label: "Extra Sales/Broadcast", value: fmt(Math.abs(Math.round(extraSalesPerMo))), icon: "🛒", color: "#25D366" },
                                { label: "ROI Delta", value: Math.abs(roiDelta).toFixed(1) + "×", icon: "⚡", color: "#25D366" },
                              ]}
                              narrative={`WhatsApp delivers a ${Math.abs(revPremium).toFixed(0)}% revenue premium over ${CH_CFG[ch]?.label}, generating ${fmt(Math.abs(Math.round(extraSalesPerMo)))} additional sales per month. Over 12 months, WhatsApp projects ${dmFn(wa12)} vs ${CH_CFG[ch]?.label}'s ${dmFn(c12)} — a ${dmFn(Math.abs(wa12 - c12))} advantage. ${wa.optOutRate < c.optOutRate ? `WhatsApp's lower opt-out rate (${pct(wa.optOutRate, 2)} vs ${pct(c.optOutRate, 2)}) means the revenue gap widens each month as ${CH_CFG[ch]?.label} loses audience faster.` : `Optimizing WhatsApp message frequency could further widen this gap.`}`}
                            />
                          );
                        })}
                      </div>
                    );
                  })()}
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          ) : <div />}
          {step < totalSteps - 1 && (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canGo()}
              className="bg-[#25D366] hover:bg-[#1da851] gap-1.5"
            >
              {step === totalSteps - 2 ? "Calculate Results" : "Next"} <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
        </>
        )}
      </div>

      {/* Scenarios Modal */}
      <Dialog open={showSc} onOpenChange={setShowSc}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#25D366]" /> Quick Scenarios
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">Pre-built scenarios to quickly demonstrate ROI across different industries</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto">
            {SCENARIOS.map((sc, i) => (
              <button
                key={i}
                onClick={() => applySc(sc)}
                className="p-3.5 rounded-lg border text-left transition-all hover:border-[#25D366]/50 hover:bg-[#edfaf2]/50"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{sc.icon}</span>
                  <span className="font-bold text-sm">{sc.name}</span>
                </div>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <div>{sc.country} · {sc.industry}</div>
                  <div>{fmt(sc.messages)} msgs · ${fmt(sc.dealValue)} deal value</div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      {showExport && allR.whatsapp && (
        <ExportModal
          onClose={() => setShowExport(false)}
          allData={allR}
          channels={activeChannels}
          dealValue={dealValue}
          country={country || ""}
          industry={industry || ""}
          clientName={clientName || undefined}
          broadcastsPerMonth={broadcastsPerMonth}
          dmFn={dmFn}
        />
      )}
    </div>
  );
}
