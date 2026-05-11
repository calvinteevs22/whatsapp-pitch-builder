// ROI Calculator Data Constants
// Extracted from the Paid Messaging ROI Calculator specification

export interface CountryData {
  name: string;
  region: string;
  wap: number; // WhatsApp marketing cost per message
  wapUtility: number; // WhatsApp utility cost per message (Meta rate card Jan 2026)
  sms: number; // SMS cost per message
}

export interface IndustryData {
  name: string;
  archetype: "direct" | "leadgen" | "footfall";
  rateLabel: string; // Industry-specific outcome metric label
  dealValueLabel: string; // What the deal value represents
  defaultDealValue: number; // Default deal value in USD
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number; // Exchange rate to USD
}

export interface ChannelConfig {
  color: string;
  dark: string;
  bg: string;
  label: string;
  icon: string;
}

export interface BenchmarkData {
  deliveryRate: number;
  openRate: number;
  ctr: number;
  optOutRate: number;
}

export interface ChannelInputs {
  messages: number;
  deliveryRate: number;
  openRate: number;
  ctr: number;
  convRate: number;
  optOutRate: number;
  costPerMsg: number;
}

export interface DerivedMetrics {
  messages: number;
  delivered: number;
  opened: number;
  clicked: number;
  conversions: number;
  revenue: number;
  spend: number;
  roi: number;
  rev1k: number;
  cpConv: number;
  cpClick: number;
  reachRate: number;
  moLost: number;
  yrLost: number;
  revAtRisk: number;
  deliveryRate: number;
  openRate: number;
  ctr: number;
  convRate: number;
  optOutRate: number;
  costPerMsg: number;
}

export interface ScenarioData {
  name: string;
  icon: string;
  country: string;
  industry: string;
  messages: number; // messages per broadcast
  dealValue: number;
  broadcastsPerMonth: number; // how many broadcasts per month (default 2)
}

/**
 * Broadcast-level metrics derived from per-broadcast funnel + monthly aggregation.
 * WhatsApp Paid Messaging is broadcast-based: advertisers send N messages in one go,
 * repeated K times per month, NOT spread linearly across 30 days.
 */
export interface BroadcastMetrics {
  // Per-broadcast
  perBroadcast: DerivedMetrics;
  // Monthly aggregates
  broadcastsPerMonth: number;
  monthlyMessages: number;
  monthlyRevenue: number;
  monthlySpend: number;
  monthlyConversions: number;
  monthlyProfit: number;
  monthlyROI: number;
  // Break-even (per broadcast)
  beConversions: number;   // conversions needed to cover one broadcast's cost
  beMessages: number;      // messages into the funnel to generate beConversions
  bePctOfBroadcast: number; // % of broadcast volume at which break-even occurs
  broadcastsToBreakEven: number; // if single broadcast is unprofitable, how many needed
}

// Channel configuration
export const CH_CFG: Record<string, ChannelConfig> = {
  whatsapp: { color: "#25D366", dark: "#0d7a3e", bg: "#edfaf2", label: "WhatsApp", icon: "💬" },
  sms: { color: "#6366f1", dark: "#4338ca", bg: "#eef2ff", label: "SMS", icon: "📱" },
  email: { color: "#f59e0b", dark: "#b45309", bg: "#fffbeb", label: "Email", icon: "📧" },
  inapp: { color: "#ec4899", dark: "#be185d", bg: "#fdf2f8", label: "In-App Notification", icon: "🔔" },
};

// ─── Regions (standard continent groupings) ───
export const REGIONS = [
  "Asia Pacific",
  "Europe",
  "North America",
  "Latin America",
  "Middle East & Africa",
] as const;

// Countries with WhatsApp and SMS costs
export const COUNTRIES: CountryData[] = [
  // Utility prices from Meta's official rate card (effective Jan 1, 2026)
  // Source: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
  // Countries not individually listed by Meta use the regional "Rest of" rate
  // Asia Pacific
  { name: "Australia", region: "Asia Pacific", wap: 0.0732, wapUtility: 0.0113, sms: 0.0550 },
  { name: "Bangladesh", region: "Asia Pacific", wap: 0.0180, wapUtility: 0.0113, sms: 0.0080 },
  { name: "Cambodia", region: "Asia Pacific", wap: 0.0300, wapUtility: 0.0113, sms: 0.0120 },
  { name: "Hong Kong", region: "Asia Pacific", wap: 0.0745, wapUtility: 0.0113, sms: 0.0520 },
  { name: "India", region: "Asia Pacific", wap: 0.0118, wapUtility: 0.0014, sms: 0.0045 },
  { name: "Indonesia", region: "Asia Pacific", wap: 0.0411, wapUtility: 0.0250, sms: 0.0180 },
  { name: "Japan", region: "Asia Pacific", wap: 0.1100, wapUtility: 0.0113, sms: 0.0600 },
  { name: "Malaysia", region: "Asia Pacific", wap: 0.0860, wapUtility: 0.0140, sms: 0.0350 },
  { name: "Myanmar", region: "Asia Pacific", wap: 0.0310, wapUtility: 0.0113, sms: 0.0130 },
  { name: "New Zealand", region: "Asia Pacific", wap: 0.0750, wapUtility: 0.0113, sms: 0.0500 },
  { name: "Pakistan", region: "Asia Pacific", wap: 0.0473, wapUtility: 0.0054, sms: 0.0090 },
  { name: "Philippines", region: "Asia Pacific", wap: 0.0340, wapUtility: 0.0113, sms: 0.0150 },
  { name: "Singapore", region: "Asia Pacific", wap: 0.0400, wapUtility: 0.0113, sms: 0.0300 },
  { name: "South Korea", region: "Asia Pacific", wap: 0.0950, wapUtility: 0.0113, sms: 0.0500 },
  { name: "Sri Lanka", region: "Asia Pacific", wap: 0.0280, wapUtility: 0.0113, sms: 0.0100 },
  { name: "Taiwan", region: "Asia Pacific", wap: 0.0650, wapUtility: 0.0113, sms: 0.0400 },
  { name: "Thailand", region: "Asia Pacific", wap: 0.0350, wapUtility: 0.0113, sms: 0.0160 },
  { name: "Vietnam", region: "Asia Pacific", wap: 0.0280, wapUtility: 0.0113, sms: 0.0120 },
  // Europe
  { name: "Denmark", region: "Europe", wap: 0.0660, wapUtility: 0.0171, sms: 0.0540 },
  { name: "France", region: "Europe", wap: 0.0859, wapUtility: 0.0300, sms: 0.0700 },
  { name: "Germany", region: "Europe", wap: 0.1365, wapUtility: 0.0550, sms: 0.0750 },
  { name: "Ireland", region: "Europe", wap: 0.0520, wapUtility: 0.0171, sms: 0.0450 },
  { name: "Italy", region: "Europe", wap: 0.0691, wapUtility: 0.0300, sms: 0.0550 },
  { name: "Netherlands", region: "Europe", wap: 0.1597, wapUtility: 0.0500, sms: 0.0680 },
  { name: "Norway", region: "Europe", wap: 0.0680, wapUtility: 0.0171, sms: 0.0560 },
  { name: "Poland", region: "Europe", wap: 0.0860, wapUtility: 0.0212, sms: 0.0350 },
  { name: "Portugal", region: "Europe", wap: 0.0480, wapUtility: 0.0171, sms: 0.0380 },
  { name: "Spain", region: "Europe", wap: 0.0615, wapUtility: 0.0200, sms: 0.0420 },
  { name: "Sweden", region: "Europe", wap: 0.0620, wapUtility: 0.0171, sms: 0.0500 },
  { name: "Switzerland", region: "Europe", wap: 0.0800, wapUtility: 0.0171, sms: 0.0650 },
  { name: "UK", region: "Europe", wap: 0.0529, wapUtility: 0.0220, sms: 0.0400 },
  // North America
  { name: "Canada", region: "North America", wap: 0.0250, wapUtility: 0.0034, sms: 0.0085 },
  { name: "US", region: "North America", wap: 0.0250, wapUtility: 0.0034, sms: 0.0075 },
  // Latin America
  { name: "Argentina", region: "Latin America", wap: 0.0618, wapUtility: 0.0260, sms: 0.0200 },
  { name: "Brazil", region: "Latin America", wap: 0.0625, wapUtility: 0.0068, sms: 0.0250 },
  { name: "Chile", region: "Latin America", wap: 0.0889, wapUtility: 0.0200, sms: 0.0190 },
  { name: "Colombia", region: "Latin America", wap: 0.0125, wapUtility: 0.0008, sms: 0.0160 },
  { name: "Mexico", region: "Latin America", wap: 0.0305, wapUtility: 0.0085, sms: 0.0180 },
  { name: "Peru", region: "Latin America", wap: 0.0703, wapUtility: 0.0200, sms: 0.0150 },
  // Middle East & Africa
  { name: "Egypt", region: "Middle East & Africa", wap: 0.0644, wapUtility: 0.0036, sms: 0.0280 },
  { name: "Israel", region: "Middle East & Africa", wap: 0.0353, wapUtility: 0.0053, sms: 0.0250 },
  { name: "Qatar", region: "Middle East & Africa", wap: 0.0420, wapUtility: 0.0091, sms: 0.0360 },
  { name: "Saudi Arabia", region: "Middle East & Africa", wap: 0.0455, wapUtility: 0.0107, sms: 0.0350 },
  { name: "South Africa", region: "Middle East & Africa", wap: 0.0379, wapUtility: 0.0076, sms: 0.0200 },
  { name: "Turkey", region: "Middle East & Africa", wap: 0.0109, wapUtility: 0.0053, sms: 0.0100 },
  { name: "UAE", region: "Middle East & Africa", wap: 0.0499, wapUtility: 0.0157, sms: 0.0350 },
];

// ─── Industries (aligned with WhatsApp Template Library) ───
export const ROI_INDUSTRIES: IndustryData[] = [
  { name: "E-Commerce", archetype: "direct", rateLabel: "Conversion Rate", dealValueLabel: "Avg Order Value", defaultDealValue: 50 },
  { name: "Healthcare", archetype: "footfall", rateLabel: "Appointment Rate", dealValueLabel: "Avg Consultation Fee", defaultDealValue: 120 },
  { name: "Food & Beverage", archetype: "direct", rateLabel: "Order Rate", dealValueLabel: "Avg Order Value", defaultDealValue: 25 },
  { name: "Finance & Banking", archetype: "direct", rateLabel: "Conversion Rate", dealValueLabel: "Avg Product Value", defaultDealValue: 500 },
  { name: "Travel & Hospitality", archetype: "direct", rateLabel: "Booking Rate", dealValueLabel: "Avg Booking Value", defaultDealValue: 350 },
  { name: "Education", archetype: "leadgen", rateLabel: "Enrollment Rate", dealValueLabel: "Avg Course Fee", defaultDealValue: 800 },
  { name: "Real Estate", archetype: "leadgen", rateLabel: "Viewing Rate", dealValueLabel: "Avg Commission", defaultDealValue: 5000 },
  { name: "Automotive", archetype: "leadgen", rateLabel: "Test Drive Rate", dealValueLabel: "Avg Deal Value", defaultDealValue: 25000 },
  { name: "Retail", archetype: "direct", rateLabel: "Conversion Rate", dealValueLabel: "Avg Transaction Value", defaultDealValue: 65 },
  { name: "Technology", archetype: "direct", rateLabel: "Conversion Rate", dealValueLabel: "Avg Subscription Value", defaultDealValue: 200 },
  { name: "Beauty & Wellness", archetype: "footfall", rateLabel: "Appointment Rate", dealValueLabel: "Avg Service Value", defaultDealValue: 80 },
  { name: "Entertainment", archetype: "direct", rateLabel: "Ticket Conversion Rate", dealValueLabel: "Avg Ticket Value", defaultDealValue: 45 },
  { name: "Logistics", archetype: "leadgen", rateLabel: "Signup Rate", dealValueLabel: "Avg Shipment Value", defaultDealValue: 150 },
  { name: "Insurance", archetype: "leadgen", rateLabel: "Policy Rate", dealValueLabel: "Avg Premium Value", defaultDealValue: 600 },
  { name: "Telecommunications", archetype: "direct", rateLabel: "Subscription Rate", dealValueLabel: "Avg Plan Value", defaultDealValue: 40 },
];

// Conversion rates by region and industry (overall post-send conversion %)
export const CONV: Record<string, Record<string, number>> = {
  "Asia Pacific": {
    "E-Commerce": 2.5, "Healthcare": 3.0, "Food & Beverage": 3.8,
    "Finance & Banking": 1.8, "Travel & Hospitality": 2.5, "Education": 1.5,
    "Real Estate": 0.6, "Automotive": 0.9, "Retail": 2.8,
    "Technology": 2.0, "Beauty & Wellness": 3.2, "Entertainment": 3.5,
    "Logistics": 1.0, "Insurance": 1.3, "Telecommunications": 2.8,
  },
  "Europe": {
    "E-Commerce": 1.8, "Healthcare": 2.5, "Food & Beverage": 2.5,
    "Finance & Banking": 1.5, "Travel & Hospitality": 2.2, "Education": 1.2,
    "Real Estate": 0.5, "Automotive": 0.8, "Retail": 2.0,
    "Technology": 1.8, "Beauty & Wellness": 2.5, "Entertainment": 2.8,
    "Logistics": 0.8, "Insurance": 1.0, "Telecommunications": 2.2,
  },
  "North America": {
    "E-Commerce": 1.8, "Healthcare": 2.5, "Food & Beverage": 2.8,
    "Finance & Banking": 1.5, "Travel & Hospitality": 2.0, "Education": 1.2,
    "Real Estate": 0.5, "Automotive": 0.8, "Retail": 2.0,
    "Technology": 2.0, "Beauty & Wellness": 2.5, "Entertainment": 3.0,
    "Logistics": 0.8, "Insurance": 1.0, "Telecommunications": 2.5,
  },
  "Latin America": {
    "E-Commerce": 3.2, "Healthcare": 3.5, "Food & Beverage": 5.5,
    "Finance & Banking": 2.0, "Travel & Hospitality": 3.0, "Education": 1.8,
    "Real Estate": 0.6, "Automotive": 0.9, "Retail": 3.0,
    "Technology": 2.2, "Beauty & Wellness": 3.5, "Entertainment": 4.0,
    "Logistics": 1.2, "Insurance": 1.3, "Telecommunications": 3.0,
  },
  "Middle East & Africa": {
    "E-Commerce": 2.5, "Healthcare": 3.2, "Food & Beverage": 4.0,
    "Finance & Banking": 2.0, "Travel & Hospitality": 3.2, "Education": 1.6,
    "Real Estate": 0.8, "Automotive": 1.0, "Retail": 2.8,
    "Technology": 2.0, "Beauty & Wellness": 3.0, "Entertainment": 3.5,
    "Logistics": 1.0, "Insurance": 1.3, "Telecommunications": 2.8,
  },
};

// Benchmark data by channel and region
export const BENCH: Record<string, Record<string, BenchmarkData>> = {
  whatsapp: {
    "Asia Pacific": { deliveryRate: 97, openRate: 95, ctr: 30, optOutRate: 0.35 },
    "Europe": { deliveryRate: 96, openRate: 90, ctr: 25, optOutRate: 0.50 },
    "North America": { deliveryRate: 96, openRate: 90, ctr: 25, optOutRate: 0.50 },
    "Latin America": { deliveryRate: 97, openRate: 98, ctr: 38, optOutRate: 0.28 },
    "Middle East & Africa": { deliveryRate: 96, openRate: 97, ctr: 32, optOutRate: 0.32 },
  },
  sms: {
    "Asia Pacific": { deliveryRate: 88, openRate: 98, ctr: 18, optOutRate: 1.30 },
    "Europe": { deliveryRate: 90, openRate: 98, ctr: 20, optOutRate: 1.50 },
    "North America": { deliveryRate: 90, openRate: 98, ctr: 20, optOutRate: 1.50 },
    "Latin America": { deliveryRate: 80, openRate: 98, ctr: 10, optOutRate: 2.00 },
    "Middle East & Africa": { deliveryRate: 83, openRate: 98, ctr: 11, optOutRate: 1.80 },
  },
  email: {
    "Asia Pacific": { deliveryRate: 88, openRate: 24, ctr: 2.0, optOutRate: 0.22 },
    "Europe": { deliveryRate: 90, openRate: 26, ctr: 2.3, optOutRate: 0.30 },
    "North America": { deliveryRate: 90, openRate: 26, ctr: 2.3, optOutRate: 0.30 },
    "Latin America": { deliveryRate: 84, openRate: 20, ctr: 2.0, optOutRate: 0.10 },
    "Middle East & Africa": { deliveryRate: 86, openRate: 22, ctr: 1.9, optOutRate: 0.18 },
  },
  inapp: {
    "Asia Pacific": { deliveryRate: 100, openRate: 20, ctr: 4.5, optOutRate: 3.5 },
    "Europe": { deliveryRate: 100, openRate: 15, ctr: 3.5, optOutRate: 4.0 },
    "North America": { deliveryRate: 100, openRate: 18, ctr: 4.0, optOutRate: 4.0 },
    "Latin America": { deliveryRate: 100, openRate: 22, ctr: 5.0, optOutRate: 3.0 },
    "Middle East & Africa": { deliveryRate: 100, openRate: 20, ctr: 4.5, optOutRate: 3.2 },
  },
};

// Currency data by country
export const CURRENCIES: Record<string, CurrencyInfo> = {
  "Argentina": { code: "ARS", symbol: "AR$", rate: 870 },
  "Australia": { code: "AUD", symbol: "A$", rate: 1.53 },
  "Bangladesh": { code: "BDT", symbol: "৳", rate: 110 },
  "Brazil": { code: "BRL", symbol: "R$", rate: 4.95 },
  "Cambodia": { code: "KHR", symbol: "៛", rate: 4100 },
  "Canada": { code: "CAD", symbol: "C$", rate: 1.36 },
  "Chile": { code: "CLP", symbol: "CL$", rate: 890 },
  "Colombia": { code: "COP", symbol: "COL$", rate: 3950 },
  "Denmark": { code: "DKK", symbol: "kr", rate: 6.88 },
  "Egypt": { code: "EGP", symbol: "E£", rate: 30.90 },
  "France": { code: "EUR", symbol: "€", rate: 0.92 },
  "Germany": { code: "EUR", symbol: "€", rate: 0.92 },
  "Hong Kong": { code: "HKD", symbol: "HK$", rate: 7.82 },
  "India": { code: "INR", symbol: "₹", rate: 83.50 },
  "Indonesia": { code: "IDR", symbol: "Rp", rate: 15700 },
  "Ireland": { code: "EUR", symbol: "€", rate: 0.92 },
  "Israel": { code: "ILS", symbol: "₪", rate: 3.68 },
  "Italy": { code: "EUR", symbol: "€", rate: 0.92 },
  "Japan": { code: "JPY", symbol: "¥", rate: 149.50 },
  "Malaysia": { code: "MYR", symbol: "RM", rate: 4.42 },
  "Mexico": { code: "MXN", symbol: "MX$", rate: 17.20 },
  "Myanmar": { code: "MMK", symbol: "K", rate: 2100 },
  "Netherlands": { code: "EUR", symbol: "€", rate: 0.92 },
  "New Zealand": { code: "NZD", symbol: "NZ$", rate: 1.66 },
  "Norway": { code: "NOK", symbol: "kr", rate: 10.80 },
  "Pakistan": { code: "PKR", symbol: "Rs", rate: 280 },
  "Peru": { code: "PEN", symbol: "S/", rate: 3.72 },
  "Philippines": { code: "PHP", symbol: "₱", rate: 56.20 },
  "Poland": { code: "PLN", symbol: "zł", rate: 4.05 },
  "Portugal": { code: "EUR", symbol: "€", rate: 0.92 },
  "Qatar": { code: "QAR", symbol: "QR", rate: 3.64 },
  "Saudi Arabia": { code: "SAR", symbol: "﷼", rate: 3.75 },
  "Singapore": { code: "SGD", symbol: "S$", rate: 1.34 },
  "South Africa": { code: "ZAR", symbol: "R", rate: 18.80 },
  "South Korea": { code: "KRW", symbol: "₩", rate: 1320 },
  "Spain": { code: "EUR", symbol: "€", rate: 0.92 },
  "Sri Lanka": { code: "LKR", symbol: "Rs", rate: 320 },
  "Sweden": { code: "SEK", symbol: "kr", rate: 10.50 },
  "Switzerland": { code: "CHF", symbol: "CHF", rate: 0.88 },
  "Taiwan": { code: "TWD", symbol: "NT$", rate: 31.50 },
  "Thailand": { code: "THB", symbol: "฿", rate: 35.80 },
  "Turkey": { code: "TRY", symbol: "₺", rate: 32.50 },
  "UAE": { code: "AED", symbol: "د.إ", rate: 3.67 },
  "UK": { code: "GBP", symbol: "£", rate: 0.79 },
  "US": { code: "USD", symbol: "$", rate: 1 },
  "Vietnam": { code: "VND", symbol: "₫", rate: 24500 },
};

// Pre-built scenarios for quick demos (updated to match new industry names)
export const SCENARIOS: ScenarioData[] = [
  { name: "E-Commerce Promo", icon: "🛒", country: "Singapore", industry: "E-Commerce", messages: 50000, dealValue: 45, broadcastsPerMonth: 3 },
  { name: "Auto Dealership", icon: "🚗", country: "UAE", industry: "Automotive", messages: 10000, dealValue: 25000, broadcastsPerMonth: 1 },
  { name: "Food & Beverage", icon: "🍔", country: "Brazil", industry: "Food & Beverage", messages: 100000, dealValue: 20, broadcastsPerMonth: 4 },
  { name: "Insurance Leads", icon: "🛡️", country: "India", industry: "Insurance", messages: 200000, dealValue: 500, broadcastsPerMonth: 2 },
  { name: "Travel Bookings", icon: "✈️", country: "UK", industry: "Travel & Hospitality", messages: 30000, dealValue: 850, broadcastsPerMonth: 2 },
  { name: "Healthcare", icon: "🏥", country: "US", industry: "Healthcare", messages: 25000, dealValue: 150, broadcastsPerMonth: 2 },
  { name: "Retail Campaign", icon: "🏬", country: "Germany", industry: "Retail", messages: 80000, dealValue: 65, broadcastsPerMonth: 3 },
  { name: "Tech SaaS", icon: "💻", country: "US", industry: "Technology", messages: 40000, dealValue: 200, broadcastsPerMonth: 2 },
  { name: "Beauty Salon", icon: "💅", country: "Thailand", industry: "Beauty & Wellness", messages: 20000, dealValue: 80, broadcastsPerMonth: 2 },
  { name: "Telco Upgrade", icon: "📶", country: "Indonesia", industry: "Telecommunications", messages: 150000, dealValue: 30, broadcastsPerMonth: 2 },
];

// ─── Calculation Engine ───

/**
 * Core ROI calculation function
 * Derives all metrics from channel inputs and deal value
 */
export function deriveAdv(inp: ChannelInputs, dealValue: number): DerivedMetrics {
  const m = inp.messages || 0;
  const dr = (inp.deliveryRate || 0) / 100;
  const or = (inp.openRate || 0) / 100;
  const ctrV = (inp.ctr || 0) / 100;
  const cv = (inp.convRate || 0) / 100;
  const oo = (inp.optOutRate || 0) / 100;
  const cpm = inp.costPerMsg || 0;

  const delivered = m * dr;
  const opened = delivered * or;
  const clicked = opened * ctrV;
  const conversions = clicked * cv;
  const revenue = conversions * dealValue;
  const spend = m * cpm;
  const roi = spend > 0 ? revenue / spend : 0;
  const rev1k = m > 0 ? (conversions / m) * 1000 * dealValue : 0;
  const cpConv = conversions > 0 ? spend / conversions : 0;
  const cpClick = clicked > 0 ? spend / clicked : 0;
  const reachRate = dr * or * 100;
  const moLost = m * oo;
  const yrLost = moLost * 12;
  const revAtRisk = yrLost * dr * or * ctrV * cv * dealValue;

  return {
    messages: m, delivered, opened, clicked, conversions, revenue, spend, roi,
    rev1k, cpConv, cpClick, reachRate, moLost, yrLost, revAtRisk,
    deliveryRate: inp.deliveryRate, openRate: inp.openRate,
    ctr: inp.ctr, convRate: inp.convRate, optOutRate: inp.optOutRate,
    costPerMsg: cpm,
  };
}

/**
 * Simplified Basic mode calculation
 * Only needs messages, conversion rate, cost per message, and deal value
 * Uses WhatsApp benchmarks for the region to fill in delivery/open/ctr
 */
export function deriveBasic(
  messages: number,
  convRate: number,
  costPerMsg: number,
  dealValue: number,
  region: string,
  benchmarkOverrides?: { deliveryRate?: number; openRate?: number; ctr?: number; optOutRate?: number },
): DerivedMetrics {
  const bench = BENCH.whatsapp[region] || BENCH.whatsapp["Asia Pacific"];
  const inp: ChannelInputs = {
    messages,
    deliveryRate: benchmarkOverrides?.deliveryRate ?? bench.deliveryRate,
    openRate: benchmarkOverrides?.openRate ?? bench.openRate,
    ctr: benchmarkOverrides?.ctr ?? bench.ctr,
    convRate,
    optOutRate: benchmarkOverrides?.optOutRate ?? bench.optOutRate,
    costPerMsg,
  };
  return deriveAdv(inp, dealValue);
}

/**
 * Broadcast-based ROI calculation.
 * Takes per-broadcast channel inputs and broadcasts/month,
 * computes per-broadcast funnel then aggregates to monthly.
 */
export function deriveBroadcast(
  inp: ChannelInputs,
  dealValue: number,
  broadcastsPerMonth: number,
): BroadcastMetrics {
  const perBroadcast = deriveAdv(inp, dealValue);
  const bpm = Math.max(broadcastsPerMonth, 1);

  const monthlyMessages = perBroadcast.messages * bpm;
  const monthlyRevenue = perBroadcast.revenue * bpm;
  const monthlySpend = perBroadcast.spend * bpm;
  const monthlyConversions = perBroadcast.conversions * bpm;
  const monthlyProfit = monthlyRevenue - monthlySpend;
  const monthlyROI = monthlySpend > 0 ? monthlyRevenue / monthlySpend : 0;

  // Break-even: how much of a single broadcast covers its own cost
  const broadcastSpend = perBroadcast.spend;
  const beConversions = dealValue > 0 ? Math.ceil(broadcastSpend / dealValue) : 0;
  const convPerMsg = perBroadcast.messages > 0 ? perBroadcast.conversions / perBroadcast.messages : 0;
  const beMessages = convPerMsg > 0 ? Math.ceil(beConversions / convPerMsg) : 0;
  const bePctOfBroadcast = perBroadcast.messages > 0 ? (beMessages / perBroadcast.messages) * 100 : 0;

  // If a single broadcast is unprofitable (bePct > 100%), how many broadcasts to break even cumulatively?
  let broadcastsToBreakEven = 1;
  if (perBroadcast.revenue > 0 && perBroadcast.revenue < broadcastSpend) {
    // Each broadcast generates some revenue but not enough to cover cost
    // Need N broadcasts where N * revenue >= N * cost → never breaks even if per-broadcast is unprofitable
    // Actually: cumulative revenue = N * perBroadcast.revenue, cumulative cost = N * perBroadcast.spend
    // Since per-broadcast ROI < 1, it never breaks even by repeating. Set to 0 to indicate "not achievable"
    broadcastsToBreakEven = 0;
  } else if (perBroadcast.revenue <= 0) {
    broadcastsToBreakEven = 0; // no revenue at all
  }

  return {
    perBroadcast,
    broadcastsPerMonth: bpm,
    monthlyMessages,
    monthlyRevenue,
    monthlySpend,
    monthlyConversions,
    monthlyProfit,
    monthlyROI,
    beConversions,
    beMessages,
    bePctOfBroadcast,
    broadcastsToBreakEven,
  };
}

/**
 * Simplified broadcast-based calculation for Basic mode.
 */
export function deriveBroadcastBasic(
  messagesPerBroadcast: number,
  convRate: number,
  costPerMsg: number,
  dealValue: number,
  region: string,
  broadcastsPerMonth: number,
  benchmarkOverrides?: { deliveryRate?: number; openRate?: number; ctr?: number; optOutRate?: number },
): BroadcastMetrics {
  const bench = BENCH.whatsapp[region] || BENCH.whatsapp["Asia Pacific"];
  const inp: ChannelInputs = {
    messages: messagesPerBroadcast,
    deliveryRate: benchmarkOverrides?.deliveryRate ?? bench.deliveryRate,
    openRate: benchmarkOverrides?.openRate ?? bench.openRate,
    ctr: benchmarkOverrides?.ctr ?? bench.ctr,
    convRate,
    optOutRate: benchmarkOverrides?.optOutRate ?? bench.optOutRate,
    costPerMsg,
  };
  return deriveBroadcast(inp, dealValue, broadcastsPerMonth);
}

/**
 * 12-month projection with broadcast-based opt-out decay.
 * Opt-outs compound per broadcast (not per month), so higher broadcast
 * frequency = faster audience decay.
 */
export function projectBroadcastRevenue(
  perBroadcast: DerivedMetrics,
  broadcastsPerMonth: number,
  dealValue: number,
  months: number = 12,
): { monthlyRevenue: number[]; monthlySpend: number[]; monthlyAudience: number[]; cumulativeRevenue: number[]; cumulativeProfit: number[] } {
  const bpm = Math.max(broadcastsPerMonth, 1);
  const dr = (perBroadcast.deliveryRate || 96) / 100;
  const or = (perBroadcast.openRate || 90) / 100;
  const ctr = (perBroadcast.ctr || 25) / 100;
  const cv = (perBroadcast.convRate || 5) / 100;
  const oo = (perBroadcast.optOutRate || 0.5) / 100;
  const cpm = perBroadcast.costPerMsg || 0;

  let audience = perBroadcast.messages;
  const monthlyRevenue: number[] = [];
  const monthlySpend: number[] = [];
  const monthlyAudience: number[] = [];
  const cumulativeRevenue: number[] = [];
  const cumulativeProfit: number[] = [];
  let cumRev = 0;
  let cumSpend = 0;

  for (let m = 0; m < months; m++) {
    let monthRev = 0;
    let monthSpend = 0;
    // Each broadcast in this month
    for (let b = 0; b < bpm; b++) {
      const broadcastRev = audience * dr * or * ctr * cv * dealValue;
      const broadcastCost = audience * cpm;
      monthRev += broadcastRev;
      monthSpend += broadcastCost;
      // Opt-outs happen after each broadcast
      audience *= (1 - oo);
    }
    monthlyRevenue.push(monthRev);
    monthlySpend.push(monthSpend);
    monthlyAudience.push(audience);
    cumRev += monthRev;
    cumSpend += monthSpend;
    cumulativeRevenue.push(cumRev);
    cumulativeProfit.push(cumRev - cumSpend);
  }

  return { monthlyRevenue, monthlySpend, monthlyAudience, cumulativeRevenue, cumulativeProfit };
}

// ─── Formatting Utilities ───

export function fmt(n: number | null | undefined, d = 0): string {
  if (n == null || isNaN(n)) return "0";
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function fmtMoney(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "$0";
  const a = Math.abs(n);
  const s = n < 0 ? "-" : "";
  if (a >= 1e9) return s + "$" + (a / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return s + "$" + (a / 1e3).toFixed(1) + "K";
  return s + "$" + a.toFixed(2);
}

export function pct(n: number | null | undefined, d = 1): string {
  return (n || 0).toFixed(d) + "%";
}

/**
 * Currency-aware display money function
 */
export function dm(n: number | null | undefined, cRate = 1, cSym = "$"): string {
  if (n == null || isNaN(n)) return cSym + "0";
  const c = n * cRate;
  const a = Math.abs(c);
  const s = c < 0 ? "-" : "";
  const noDec = cRate >= 10;
  if (a >= 1e9) return s + cSym + (a / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return s + cSym + (a / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return s + cSym + (a / 1e3).toFixed(noDec ? 0 : 1) + "K";
  return s + cSym + a.toFixed(noDec ? 0 : 2);
}

/**
 * Initialize channel inputs based on region, industry, and country data
 */
// ─── Utility Mode Types & Data ───

export type UtilityCategory = "Cost Deflection" | "Revenue Recovery" | "Productivity";

export interface UtilityUseCase {
  id: string;
  name: string;
  category: UtilityCategory;
  description: string;
  keyIndustries: string[]; // Industries where this use case is most relevant
  defaultFields: UtilityUseCaseField[];
}

export interface UtilityUseCaseField {
  key: string;
  label: string;
  tooltip: string;
  defaultValue: number;
  suffix?: string;
  prefix?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface UtilityUseCaseConfig {
  useCaseId: string;
  enabled: boolean;
  fields: Record<string, number>;
}

export interface UtilityUseCaseResult {
  useCaseId: string;
  name: string;
  category: UtilityCategory;
  monthlySavings: number;
  whatsappCost: number;
  netValue: number;
  messagesPerMonth: number;
  conversationsPerMonth: number; // WhatsApp charges per conversation (24h window), not per message
  roiMultiplier: number;
}

export interface UtilityAggregateResult {
  totalMonthlySavings: number;
  totalWhatsappCost: number;
  totalNetValue: number;
  totalMessages: number;
  totalConversations: number; // WhatsApp charges per conversation, not per message
  overallROI: number;
  annualProjection: number;
  useCaseResults: UtilityUseCaseResult[];
}

// The 14 utility use cases organized by value driver
export const UTILITY_USE_CASES: UtilityUseCase[] = [
  {
    id: "order_shipping",
    name: "Order & Shipping Updates",
    category: "Cost Deflection",
    description: "Proactive order confirmation and shipping status updates that reduce inbound WISMO (Where Is My Order) calls",
    keyIndustries: ["E-Commerce", "Food & Beverage", "Retail"],
    defaultFields: [
      { key: "ordersPerMonth", label: "Orders / Month", tooltip: "Total orders processed per month", defaultValue: 10000, min: 0 },
      { key: "wismoCallRate", label: "WISMO Call Rate", tooltip: "% of orders that generate a support call without proactive updates", defaultValue: 15, suffix: "%", min: 0, max: 100 },
      { key: "callCenterCostPerCall", label: "Cost per Support Call", tooltip: "Average cost of handling one inbound support call", defaultValue: 5, prefix: "$", min: 0, step: 0.5 },
      { key: "deflectionRate", label: "Call Deflection Rate", tooltip: "% of calls avoided by sending proactive WhatsApp updates", defaultValue: 65, suffix: "%", min: 0, max: 100 },
    ],
  },
  {
    id: "appointment_reminders",
    name: "Appointment Reminders",
    category: "Revenue Recovery",
    description: "Automated appointment reminders that reduce no-shows and last-minute cancellations",
    keyIndustries: ["Healthcare", "Automotive", "Real Estate", "Education"],
    defaultFields: [
      { key: "appointmentsPerMonth", label: "Appointments / Month", tooltip: "Total appointments scheduled per month", defaultValue: 5000, min: 0 },
      { key: "noShowRate", label: "Current No-Show Rate", tooltip: "% of appointments that result in no-shows without reminders", defaultValue: 20, suffix: "%", min: 0, max: 100 },
      { key: "revenuePerAppointment", label: "Revenue per Appointment", tooltip: "Average revenue from a completed appointment", defaultValue: 120, prefix: "$", min: 0 },
      { key: "reductionRate", label: "No-Show Reduction", tooltip: "% reduction in no-shows after implementing WhatsApp reminders", defaultValue: 50, suffix: "%", min: 0, max: 100 },
    ],
  },
  {
    id: "abandoned_cart",
    name: "Abandoned Cart Recovery",
    category: "Revenue Recovery",
    description: "Timely cart abandonment notifications that recover lost revenue with personalized reminders",
    keyIndustries: ["E-Commerce", "Food & Beverage", "Retail"],
    defaultFields: [
      { key: "abandonedCartsPerMonth", label: "Abandoned Carts / Month", tooltip: "Total cart abandonments per month", defaultValue: 8000, min: 0 },
      { key: "avgCartValue", label: "Avg Cart Value", tooltip: "Average value of an abandoned cart", defaultValue: 65, prefix: "$", min: 0 },
      { key: "recoveryRate", label: "Recovery Rate", tooltip: "% of abandoned carts recovered via WhatsApp reminders", defaultValue: 12, suffix: "%", min: 0, max: 100 },
    ],
  },
  {
    id: "payment_invoice",
    name: "Payment & Invoice Reminders",
    category: "Revenue Recovery",
    description: "Automated payment reminders and invoice notifications that accelerate collections",
    keyIndustries: ["Finance & Banking", "Insurance", "E-Commerce"],
    defaultFields: [
      { key: "invoicesPerMonth", label: "Invoices / Month", tooltip: "Total invoices or payment reminders sent per month", defaultValue: 5000, min: 0 },
      { key: "overdueRate", label: "Overdue Rate", tooltip: "% of invoices that go overdue without reminders", defaultValue: 25, suffix: "%", min: 0, max: 100 },
      { key: "avgInvoiceValue", label: "Avg Invoice Value", tooltip: "Average invoice amount", defaultValue: 200, prefix: "$", min: 0 },
      { key: "collectionImprovement", label: "Collection Improvement", tooltip: "% improvement in on-time payment after WhatsApp reminders", defaultValue: 35, suffix: "%", min: 0, max: 100 },
    ],
  },
  {
    id: "faq_selfservice",
    name: "Automated FAQ & Self-Service",
    category: "Productivity",
    description: "AI-powered FAQ responses that handle common queries without human agents",
    keyIndustries: ["E-Commerce", "Healthcare", "Food & Beverage", "Finance & Banking", "Travel & Hospitality", "Education", "Real Estate", "Automotive", "Retail", "Technology", "Beauty & Wellness", "Entertainment", "Logistics", "Insurance", "Telecommunications"],
    defaultFields: [
      { key: "supportTicketsPerMonth", label: "Support Tickets / Month", tooltip: "Total inbound support queries per month", defaultValue: 15000, min: 0 },
      { key: "automationRate", label: "Automation Rate", tooltip: "% of queries that can be resolved by automated FAQ bot", defaultValue: 40, suffix: "%", min: 0, max: 100 },
      { key: "costPerTicket", label: "Cost per Ticket", tooltip: "Average cost of handling one support ticket by a human agent", defaultValue: 8, prefix: "$", min: 0, step: 0.5 },
    ],
  },
  {
    id: "lead_qualification",
    name: "Lead Qualification Chatbot",
    category: "Productivity",
    description: "Automated lead qualification that scores and routes prospects to the right sales team",
    keyIndustries: ["Automotive", "Real Estate", "Insurance", "Education"],
    defaultFields: [
      { key: "leadsPerMonth", label: "Inbound Leads / Month", tooltip: "Total inbound leads per month", defaultValue: 3000, min: 0 },
      { key: "qualificationRate", label: "Auto-Qualification Rate", tooltip: "% of leads that can be qualified automatically", defaultValue: 60, suffix: "%", min: 0, max: 100 },
      { key: "costPerManualQual", label: "Cost per Manual Qualification", tooltip: "Average cost of manually qualifying one lead (agent time)", defaultValue: 12, prefix: "$", min: 0, step: 0.5 },
      { key: "conversionLift", label: "Conversion Lift", tooltip: "% increase in lead-to-sale conversion from faster qualification", defaultValue: 15, suffix: "%", min: 0, max: 100 },
      { key: "avgDealValue", label: "Avg Deal Value", tooltip: "Average revenue per converted lead (used to calculate revenue uplift from faster qualification)", defaultValue: 500, prefix: "$", min: 0 },
    ],
  },
  {
    id: "renewal_subscription",
    name: "Renewal & Subscription Reminders",
    category: "Revenue Recovery",
    description: "Proactive renewal notifications that reduce churn and recover expiring subscriptions",
    keyIndustries: ["Insurance", "Education", "Telecommunications"],
    defaultFields: [
      { key: "expiringPerMonth", label: "Expiring Subscriptions / Month", tooltip: "Number of subscriptions or policies expiring per month", defaultValue: 2000, min: 0 },
      { key: "currentRenewalRate", label: "Current Renewal Rate", tooltip: "% of subscriptions that renew without proactive outreach", defaultValue: 60, suffix: "%", min: 0, max: 100 },
      { key: "avgSubscriptionValue", label: "Avg Subscription Value", tooltip: "Average annual value of a subscription or policy", defaultValue: 300, prefix: "$", min: 0 },
      { key: "renewalLift", label: "Renewal Lift from WhatsApp", tooltip: "% increase in renewal rate from WhatsApp reminders", defaultValue: 20, suffix: "%", min: 0, max: 100 },
    ],
  },
  {
    id: "booking_confirmations",
    name: "Booking Confirmations",
    category: "Cost Deflection",
    description: "Instant booking confirmations with details, reducing confirmation calls and emails",
    keyIndustries: ["Travel & Hospitality", "Healthcare", "Beauty & Wellness"],
    defaultFields: [
      { key: "bookingsPerMonth", label: "Bookings / Month", tooltip: "Total bookings processed per month", defaultValue: 4000, min: 0 },
      { key: "confirmationCallRate", label: "Confirmation Call Rate", tooltip: "% of bookings that generate an inbound confirmation call", defaultValue: 30, suffix: "%", min: 0, max: 100 },
      { key: "callCost", label: "Cost per Call", tooltip: "Average cost of handling one confirmation call", defaultValue: 4, prefix: "$", min: 0, step: 0.5 },
      { key: "deflectionRate", label: "Call Deflection Rate", tooltip: "% of confirmation calls avoided by sending WhatsApp confirmations", defaultValue: 70, suffix: "%", min: 0, max: 100 },
    ],
  },
  // ─── New Use Cases ───
  {
    id: "delivery_failure_recovery",
    name: "Delivery Failure Recovery (NDR/RTO)",
    category: "Revenue Recovery",
    description: "Automated address confirmation and delivery rescheduling that prevents return-to-origin (RTO) and recovers failed deliveries",
    keyIndustries: ["E-Commerce", "Retail", "Food & Beverage", "Logistics"],
    defaultFields: [
      { key: "monthlyOrders", label: "Orders Shipped / Month", tooltip: "Total orders shipped per month", defaultValue: 10000, min: 0 },
      { key: "ndrRate", label: "Delivery Failure Rate", tooltip: "% of orders that result in a failed delivery attempt (NDR)", defaultValue: 15, suffix: "%", min: 0, max: 100 },
      { key: "avgOrderValue", label: "Avg Order Value", tooltip: "Average value of an order (lost if returned to origin)", defaultValue: 50, prefix: "$", min: 0 },
      { key: "rtoShippingCost", label: "RTO Shipping Cost", tooltip: "Cost of return-to-origin shipping per undelivered package", defaultValue: 5, prefix: "$", min: 0, step: 0.5 },
      { key: "recoveryRate", label: "WhatsApp Recovery Rate", tooltip: "% of failed deliveries resolved via WhatsApp (address update, reschedule, redirect)", defaultValue: 35, suffix: "%", min: 0, max: 100 },
    ],
  },
  {
    id: "returns_refund",
    name: "Returns & Refund Processing",
    category: "Cost Deflection",
    description: "Automated returns initiation, eligibility checks, and refund status updates that replace call center interactions",
    keyIndustries: ["E-Commerce", "Retail", "Food & Beverage"],
    defaultFields: [
      { key: "monthlyOrders", label: "Orders / Month", tooltip: "Total orders per month", defaultValue: 10000, min: 0 },
      { key: "returnRate", label: "Return Rate", tooltip: "% of orders that are returned", defaultValue: 15, suffix: "%", min: 0, max: 100 },
      { key: "currentProcessingCost", label: "Current Cost per Return", tooltip: "Average cost to process a return via call center or email", defaultValue: 12, prefix: "$", min: 0, step: 0.5 },
      { key: "waProcessingCost", label: "WhatsApp Cost per Return", tooltip: "Average cost to process a return via WhatsApp automation (agent time saved)", defaultValue: 2, prefix: "$", min: 0, step: 0.5 },
    ],
  },
  {
    id: "feedback_nps",
    name: "Customer Feedback & NPS Collection",
    category: "Productivity",
    description: "Post-interaction surveys via WhatsApp with 3-5x higher response rates than email, enabling faster detractor recovery",
    keyIndustries: ["E-Commerce", "Healthcare", "Food & Beverage", "Finance & Banking", "Travel & Hospitality", "Education", "Retail", "Automotive", "Real Estate", "Technology", "Beauty & Wellness", "Entertainment", "Logistics", "Insurance", "Telecommunications"],
    defaultFields: [
      { key: "monthlyInteractions", label: "Customer Interactions / Month", tooltip: "Total customer interactions or transactions per month", defaultValue: 10000, min: 0 },
      { key: "surveyRate", label: "Survey Send Rate", tooltip: "% of interactions that trigger a feedback survey", defaultValue: 50, suffix: "%", min: 0, max: 100 },
      { key: "waResponseRate", label: "WhatsApp Response Rate", tooltip: "% of surveyed customers who respond via WhatsApp", defaultValue: 45, suffix: "%", min: 0, max: 100 },
      { key: "phoneSurveyVolume", label: "Phone Surveys Replaced / Month", tooltip: "Number of phone-based surveys currently conducted that WhatsApp will replace", defaultValue: 500, min: 0 },
      { key: "costPerPhoneSurvey", label: "Cost per Phone Survey", tooltip: "Average cost of conducting one phone-based survey", defaultValue: 5, prefix: "$", min: 0, step: 0.5 },
      { key: "avgCustomerValue", label: "Annual Customer Value", tooltip: "Average annual revenue per customer (used to value detractor recovery)", defaultValue: 200, prefix: "$", min: 0 },
      { key: "detractorRecoveryRate", label: "Detractor Recovery Rate", tooltip: "% of identified detractors recovered through follow-up action", defaultValue: 20, suffix: "%", min: 0, max: 100 },
    ],
  },
  {
    id: "fraud_alerts",
    name: "Fraud & Transaction Alerts",
    category: "Revenue Recovery",
    description: "Real-time transaction verification alerts that prevent chargebacks and reduce fraud-related call center volume",
    keyIndustries: ["Finance & Banking", "E-Commerce", "Technology", "Insurance"],
    defaultFields: [
      { key: "monthlyTransactions", label: "Transactions / Month", tooltip: "Total transactions processed per month", defaultValue: 50000, min: 0 },
      { key: "flaggedRate", label: "Flagged Transaction Rate", tooltip: "% of transactions flagged for verification (suspicious activity)", defaultValue: 3, suffix: "%", min: 0, max: 100 },
      { key: "avgFlaggedValue", label: "Avg Flagged Transaction Value", tooltip: "Average value of a flagged transaction", defaultValue: 150, prefix: "$", min: 0 },
      { key: "fraudPreventionRate", label: "Fraud Prevention Rate", tooltip: "% of flagged transactions where fraud is actually prevented via WhatsApp verification", defaultValue: 25, suffix: "%", min: 0, max: 100 },
      { key: "chargebackCost", label: "Cost per Chargeback", tooltip: "Total cost per chargeback (processing fee + lost goods + penalty)", defaultValue: 50, prefix: "$", min: 0 },
      { key: "callDeflectionRate", label: "Call Deflection Rate", tooltip: "% of verification calls avoided by WhatsApp alerts (customers self-verify)", defaultValue: 60, suffix: "%", min: 0, max: 100 },
      { key: "costPerCall", label: "Cost per Verification Call", tooltip: "Average cost of a fraud verification call", defaultValue: 8, prefix: "$", min: 0, step: 0.5 },
    ],
  },
  {
    id: "service_reminders",
    name: "Service Reminders (Recurring)",
    category: "Revenue Recovery",
    description: "Proactive periodic service reminders that drive incremental rebookings for recurring maintenance and check-ups",
    keyIndustries: ["Automotive", "Healthcare", "Beauty & Wellness"],
    defaultFields: [
      { key: "activeCustomers", label: "Active Customers", tooltip: "Total customers in database eligible for recurring services", defaultValue: 5000, min: 0 },
      { key: "dueRate", label: "Due for Service This Month", tooltip: "% of customers due for a service this month", defaultValue: 15, suffix: "%", min: 0, max: 100 },
      { key: "currentRebookRate", label: "Current Rebook Rate", tooltip: "% of due customers who rebook without proactive reminders", defaultValue: 40, suffix: "%", min: 0, max: 100 },
      { key: "waRebookRate", label: "WhatsApp Rebook Rate", tooltip: "% of due customers who rebook after receiving WhatsApp reminders", defaultValue: 65, suffix: "%", min: 0, max: 100 },
      { key: "avgServiceValue", label: "Avg Service Revenue", tooltip: "Average revenue per service appointment", defaultValue: 150, prefix: "$", min: 0 },
    ],
  },
  {
    id: "waitlist_queue",
    name: "Waitlist & Queue Management",
    category: "Cost Deflection",
    description: "Real-time queue position updates and ready-notifications that reduce walk-aways and improve slot utilization",
    keyIndustries: ["Food & Beverage", "Healthcare", "Retail", "Beauty & Wellness"],
    defaultFields: [
      { key: "monthlyWaitlistEntries", label: "Waitlist Entries / Month", tooltip: "Total customers added to waitlists per month", defaultValue: 3000, min: 0 },
      { key: "currentWalkawayRate", label: "Current Walk-Away Rate", tooltip: "% of waitlisted customers who leave without being served", defaultValue: 25, suffix: "%", min: 0, max: 100 },
      { key: "waWalkawayRate", label: "Walk-Away Rate with WhatsApp", tooltip: "% of waitlisted customers who leave after receiving WhatsApp updates", defaultValue: 10, suffix: "%", min: 0, max: 100 },
      { key: "avgTransactionValue", label: "Avg Transaction Value", tooltip: "Average spend per customer served", defaultValue: 40, prefix: "$", min: 0 },
    ],
  },
];

// Map industries to their typical use cases (for auto-selection)
export const INDUSTRY_USE_CASE_MAP: Record<string, string[]> = {
  "E-Commerce": ["order_shipping", "abandoned_cart", "faq_selfservice", "payment_invoice", "delivery_failure_recovery", "returns_refund", "feedback_nps"],
  "Healthcare": ["appointment_reminders", "booking_confirmations", "faq_selfservice", "service_reminders", "feedback_nps", "waitlist_queue"],
  "Food & Beverage": ["order_shipping", "abandoned_cart", "faq_selfservice", "delivery_failure_recovery", "returns_refund", "waitlist_queue", "feedback_nps"],
  "Finance & Banking": ["payment_invoice", "faq_selfservice", "lead_qualification", "fraud_alerts", "feedback_nps"],
  "Travel & Hospitality": ["booking_confirmations", "faq_selfservice", "renewal_subscription", "feedback_nps"],
  "Education": ["appointment_reminders", "faq_selfservice", "renewal_subscription", "feedback_nps"],
  "Real Estate": ["appointment_reminders", "lead_qualification", "faq_selfservice", "feedback_nps"],
  "Automotive": ["appointment_reminders", "lead_qualification", "faq_selfservice", "service_reminders", "feedback_nps"],
  "Retail": ["order_shipping", "abandoned_cart", "faq_selfservice", "delivery_failure_recovery", "returns_refund", "feedback_nps", "waitlist_queue"],
  "Technology": ["faq_selfservice", "renewal_subscription", "payment_invoice", "fraud_alerts", "feedback_nps"],
  "Beauty & Wellness": ["appointment_reminders", "booking_confirmations", "faq_selfservice", "service_reminders", "waitlist_queue", "feedback_nps"],
  "Entertainment": ["booking_confirmations", "faq_selfservice", "abandoned_cart", "feedback_nps"],
  "Logistics": ["order_shipping", "faq_selfservice", "payment_invoice", "delivery_failure_recovery", "feedback_nps"],
  "Insurance": ["renewal_subscription", "payment_invoice", "lead_qualification", "faq_selfservice", "fraud_alerts", "feedback_nps"],
  "Telecommunications": ["renewal_subscription", "faq_selfservice", "payment_invoice", "feedback_nps"],
};

/**
 * Calculate ROI for a single utility use case
 */
export function calcUtilityUseCase(
  useCaseId: string,
  fields: Record<string, number>,
  utilityPricePerMsg: number,
): UtilityUseCaseResult {
  const uc = UTILITY_USE_CASES.find((u) => u.id === useCaseId);
  if (!uc) throw new Error(`Unknown use case: ${useCaseId}`);

  let monthlySavings = 0;
  let messagesPerMonth = 0;
  let conversationsPerMonth = 0; // WhatsApp charges per conversation (24h window)

  switch (useCaseId) {
    case "order_shipping": {
      const orders = fields.ordersPerMonth || 0;
      const wismoRate = (fields.wismoCallRate || 0) / 100;
      const callCost = fields.callCenterCostPerCall || 0;
      const deflection = (fields.deflectionRate || 0) / 100;
      messagesPerMonth = orders * 2; // confirmation + shipping update
      conversationsPerMonth = orders * 2; // 2 separate 24h windows (order day vs ship day)
      const callsDeflected = orders * wismoRate * deflection;
      monthlySavings = callsDeflected * callCost;
      break;
    }
    case "appointment_reminders": {
      const appts = fields.appointmentsPerMonth || 0;
      const noShowRate = (fields.noShowRate || 0) / 100;
      const revPerAppt = fields.revenuePerAppointment || 0;
      const reduction = (fields.reductionRate || 0) / 100;
      messagesPerMonth = appts * 2; // reminder + confirmation
      conversationsPerMonth = appts * 2; // 2 separate 24h windows (reminder day vs confirmation day)
      const recoveredAppts = appts * noShowRate * reduction;
      monthlySavings = recoveredAppts * revPerAppt;
      break;
    }
    case "abandoned_cart": {
      const carts = fields.abandonedCartsPerMonth || 0;
      const avgValue = fields.avgCartValue || 0;
      const recovery = (fields.recoveryRate || 0) / 100;
      messagesPerMonth = carts * 2; // initial reminder + follow-up nudge
      conversationsPerMonth = carts; // both messages within same 24h window
      monthlySavings = carts * recovery * avgValue;
      break;
    }
    case "payment_invoice": {
      const invoices = fields.invoicesPerMonth || 0;
      const overdueRate = (fields.overdueRate || 0) / 100;
      const avgInvoice = fields.avgInvoiceValue || 0;
      const improvement = (fields.collectionImprovement || 0) / 100;
      const overdueInvoices = invoices * overdueRate;
      messagesPerMonth = overdueInvoices * 2; // initial + follow-up (only to overdue invoices)
      conversationsPerMonth = overdueInvoices * 2; // 2 separate 24h windows
      const recoveredRevenue = overdueInvoices * improvement * avgInvoice;
      monthlySavings = recoveredRevenue;
      break;
    }
    case "faq_selfservice": {
      const tickets = fields.supportTicketsPerMonth || 0;
      const autoRate = (fields.automationRate || 0) / 100;
      const costPerTicket = fields.costPerTicket || 0;
      const automatedConversations = tickets * autoRate;
      messagesPerMonth = automatedConversations * 3; // avg 3 messages per FAQ conversation
      conversationsPerMonth = automatedConversations; // all messages within one 24h window
      monthlySavings = automatedConversations * costPerTicket;
      break;
    }
    case "lead_qualification": {
      const leads = fields.leadsPerMonth || 0;
      const qualRate = (fields.qualificationRate || 0) / 100;
      const costPerQual = fields.costPerManualQual || 0;
      const convLift = (fields.conversionLift || 0) / 100;
      const avgDealValue = fields.avgDealValue || 0;
      const qualifiedLeads = leads * qualRate;
      messagesPerMonth = qualifiedLeads * 4; // avg 4 messages per qualification
      conversationsPerMonth = qualifiedLeads; // all messages within one 24h window
      // Cost savings from automated qualification
      const costSavings = qualifiedLeads * costPerQual;
      // Revenue uplift from faster qualification → higher conversion
      const revenueUplift = qualifiedLeads * convLift * avgDealValue;
      monthlySavings = costSavings + revenueUplift;
      break;
    }
    case "renewal_subscription": {
      const expiring = fields.expiringPerMonth || 0;
      const currentRate = (fields.currentRenewalRate || 0) / 100;
      const avgValue = fields.avgSubscriptionValue || 0;
      const lift = (fields.renewalLift || 0) / 100;
      messagesPerMonth = expiring * 3; // 3 reminder touchpoints
      conversationsPerMonth = expiring * 3; // 3 separate 24h windows (30-day, 7-day, 1-day)
      const additionalRenewals = expiring * (1 - currentRate) * lift;
      monthlySavings = additionalRenewals * avgValue;
      break;
    }
    case "booking_confirmations": {
      const bookings = fields.bookingsPerMonth || 0;
      const callRate = (fields.confirmationCallRate || 0) / 100;
      const callCost = fields.callCost || 0;
      const deflection = (fields.deflectionRate || 0) / 100;
      messagesPerMonth = bookings; // one confirmation per booking
      conversationsPerMonth = bookings; // one conversation per booking
      const callsDeflected = bookings * callRate * deflection;
      monthlySavings = callsDeflected * callCost;
      break;
    }
    // ─── New Use Cases ───
    case "delivery_failure_recovery": {
      const orders = fields.monthlyOrders || 0;
      const ndrRate = (fields.ndrRate || 0) / 100;
      const avgOV = fields.avgOrderValue || 0;
      const rtoCost = fields.rtoShippingCost || 0;
      const recRate = (fields.recoveryRate || 0) / 100;
      const failedDeliveries = orders * ndrRate;
      const recoveredOrders = failedDeliveries * recRate;
      const revenueSaved = recoveredOrders * avgOV; // orders that would have been lost
      const shippingCostSaved = recoveredOrders * rtoCost; // avoided return shipping
      monthlySavings = revenueSaved + shippingCostSaved;
      messagesPerMonth = failedDeliveries * 2; // initial alert + confirmation
      conversationsPerMonth = failedDeliveries; // both messages within same 24h window
      break;
    }
    case "returns_refund": {
      const retOrders = fields.monthlyOrders || 0;
      const retRate = (fields.returnRate || 0) / 100;
      const curCost = fields.currentProcessingCost || 0;
      const waCost = fields.waProcessingCost || 0;
      const monthlyReturns = retOrders * retRate;
      monthlySavings = monthlyReturns * (curCost - waCost); // processing cost saved per return
      messagesPerMonth = monthlyReturns * 4; // initiation, photo request, confirmation, label
      conversationsPerMonth = monthlyReturns; // all 4 messages within same 24h window
      break;
    }
    case "feedback_nps": {
      const interactions = fields.monthlyInteractions || 0;
      const surveyRate = (fields.surveyRate || 0) / 100;
      const waRespRate = (fields.waResponseRate || 0) / 100;
      const phoneVol = fields.phoneSurveyVolume || 0;
      const phoneCost = fields.costPerPhoneSurvey || 0;
      const annualCustValue = fields.avgCustomerValue || 0;
      const detRecovery = (fields.detractorRecoveryRate || 0) / 100;
      const surveysSent = interactions * surveyRate;
      const responsesCollected = surveysSent * waRespRate;
      // Phone survey cost savings
      const phoneSurveySavings = phoneVol * phoneCost;
      // Detractor recovery value: ~15% of respondents are detractors
      const detractorsIdentified = responsesCollected * 0.15;
      const recoveredCustomers = detractorsIdentified * detRecovery;
      const retentionValue = recoveredCustomers * (annualCustValue / 12); // monthly value
      monthlySavings = phoneSurveySavings + retentionValue;
      messagesPerMonth = surveysSent; // 1 survey message per interaction
      conversationsPerMonth = surveysSent; // 1 conversation per survey
      break;
    }
    case "fraud_alerts": {
      const txns = fields.monthlyTransactions || 0;
      const flagRate = (fields.flaggedRate || 0) / 100;
      const fraudPrev = (fields.fraudPreventionRate || 0) / 100;
      const cbCost = fields.chargebackCost || 0;
      const callDefl = (fields.callDeflectionRate || 0) / 100;
      const callCostFraud = fields.costPerCall || 0;
      const flaggedTxns = txns * flagRate;
      const fraudsPrevented = flaggedTxns * fraudPrev;
      const chargebackSavings = fraudsPrevented * cbCost;
      const callsDeflectedFraud = flaggedTxns * callDefl;
      const callCenterSavings = callsDeflectedFraud * callCostFraud;
      monthlySavings = chargebackSavings + callCenterSavings;
      messagesPerMonth = flaggedTxns; // 1 alert per flagged transaction
      conversationsPerMonth = flaggedTxns; // 1 conversation per alert
      break;
    }
    case "service_reminders": {
      const activeCust = fields.activeCustomers || 0;
      const dueRate = (fields.dueRate || 0) / 100;
      const curRebook = (fields.currentRebookRate || 0) / 100;
      const waRebook = (fields.waRebookRate || 0) / 100;
      const svcValue = fields.avgServiceValue || 0;
      const customersDue = activeCust * dueRate;
      const incrementalBookings = customersDue * (waRebook - curRebook);
      monthlySavings = incrementalBookings * svcValue; // incremental revenue
      messagesPerMonth = customersDue * 2; // reminder + booking confirmation
      conversationsPerMonth = customersDue; // both messages within same 24h window
      break;
    }
    case "waitlist_queue": {
      const entries = fields.monthlyWaitlistEntries || 0;
      const curWalkaway = (fields.currentWalkawayRate || 0) / 100;
      const waWalkaway = (fields.waWalkawayRate || 0) / 100;
      const avgTxnValue = fields.avgTransactionValue || 0;
      const additionalServed = entries * (curWalkaway - waWalkaway);
      monthlySavings = additionalServed * avgTxnValue; // incremental revenue
      messagesPerMonth = entries * 3; // confirmation, update, ready notification
      conversationsPerMonth = entries; // all 3 messages within same 24h window
      break;
    }
  }

  // WhatsApp charges per CONVERSATION (24h window), not per message
  const whatsappCost = conversationsPerMonth * utilityPricePerMsg;
  const netValue = monthlySavings - whatsappCost;
  const roiMultiplier = whatsappCost > 0 ? monthlySavings / whatsappCost : 0;

  return {
    useCaseId,
    name: uc.name,
    category: uc.category,
    monthlySavings,
    whatsappCost,
    netValue,
    messagesPerMonth,
    conversationsPerMonth,
    roiMultiplier,
  };
}

/**
 * Calculate aggregate utility ROI across all enabled use cases
 */
export function calcUtilityAggregate(
  configs: UtilityUseCaseConfig[],
  utilityPricePerMsg: number,
): UtilityAggregateResult {
  const enabledConfigs = configs.filter((c) => c.enabled);
  const useCaseResults = enabledConfigs.map((c) =>
    calcUtilityUseCase(c.useCaseId, c.fields, utilityPricePerMsg)
  );

  const totalMonthlySavings = useCaseResults.reduce((s, r) => s + r.monthlySavings, 0);
  const totalWhatsappCost = useCaseResults.reduce((s, r) => s + r.whatsappCost, 0);
  const totalNetValue = totalMonthlySavings - totalWhatsappCost;
  const totalMessages = useCaseResults.reduce((s, r) => s + r.messagesPerMonth, 0);
  const totalConversations = useCaseResults.reduce((s, r) => s + r.conversationsPerMonth, 0);
  const overallROI = totalWhatsappCost > 0 ? totalMonthlySavings / totalWhatsappCost : 0;
  const annualProjection = totalNetValue * 12;

  return {
    totalMonthlySavings,
    totalWhatsappCost,
    totalNetValue,
    totalMessages,
    totalConversations,
    overallROI,
    annualProjection,
    useCaseResults,
  };
}

export function initChannelInputs(
  region: string,
  industry: string,
  countryData: CountryData,
  existingInputs?: Record<string, ChannelInputs>
): Record<string, ChannelInputs> {
  const wCO = CONV[region]?.[industry] || 2;
  const wB = BENCH.whatsapp[region];
  const wCtr = wB?.ctr || 25;
  const wDR = (wB?.deliveryRate || 96) / 100;
  const wOR = (wB?.openRate || 90) / 100;
  // postClickConv = overall / (dr × or × ctr)
  const wPC = wCO / (wDR * wOR * (wCtr / 100));

  const ni: Record<string, ChannelInputs> = {
    whatsapp: {
      messages: existingInputs?.whatsapp?.messages || 50000,
      deliveryRate: wB?.deliveryRate || 96,
      openRate: wB?.openRate || 90,
      ctr: wCtr,
      convRate: parseFloat(wPC.toFixed(2)),
      optOutRate: wB?.optOutRate || 0.5,
      costPerMsg: countryData.wap,
    },
  };

  (["sms", "email", "inapp"] as const).forEach((ch) => {
    const b = BENCH[ch]?.[region];
    if (!b) return;
    let pc: number;
    if (ch === "sms") {
      const sDR = b.deliveryRate / 100;
      const sOR = b.openRate / 100;
      const sCTR = b.ctr / 100;
      pc = (wCO * 0.15) / (sDR * sOR * sCTR);
    } else if (ch === "inapp") {
      // In-app notifications: high delivery but low engagement, conversion ~10% of WhatsApp
      const iDR = b.deliveryRate / 100;
      const iOR = b.openRate / 100;
      const iCTR = b.ctr / 100;
      pc = (wCO * 0.10) / (iDR * iOR * iCTR);
    } else {
      pc = wPC * 0.30;
    }
    ni[ch] = {
      messages: existingInputs?.[ch]?.messages || 50000,
      deliveryRate: b.deliveryRate,
      openRate: b.openRate,
      ctr: b.ctr,
      convRate: parseFloat(pc.toFixed(2)),
      optOutRate: b.optOutRate,
      costPerMsg: ch === "sms" ? countryData.sms : ch === "inapp" ? 0.001 : 0.003,
    };
  });

  return ni;
}
