import { describe, expect, it } from "vitest";
import {
  COUNTRIES, ROI_INDUSTRIES, CONV, BENCH, CURRENCIES, SCENARIOS, CH_CFG, REGIONS,
  deriveAdv, deriveBasic, fmt, fmtMoney, pct, dm, initChannelInputs,
  type ChannelInputs,
} from "../shared/roiData";

describe("ROI Calculator Data Constants", () => {
  it("has at least 40 countries", () => {
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(40);
  });

  it("every country has name, region, wap, and sms costs", () => {
    for (const c of COUNTRIES) {
      expect(c.name).toBeTruthy();
      expect(c.region).toBeTruthy();
      expect(c.wap).toBeGreaterThan(0);
      expect(c.sms).toBeGreaterThan(0);
    }
  });

  it("has 5 continent-based regions", () => {
    expect(REGIONS).toHaveLength(5);
    expect(REGIONS).toContain("Asia Pacific");
    expect(REGIONS).toContain("Europe");
    expect(REGIONS).toContain("North America");
    expect(REGIONS).toContain("Latin America");
    expect(REGIONS).toContain("Middle East & Africa");
  });

  it("every country region matches a known region", () => {
    for (const c of COUNTRIES) {
      expect(REGIONS).toContain(c.region);
    }
  });

  it("has 15 industries matching the template library", () => {
    expect(ROI_INDUSTRIES).toHaveLength(15);
    const names = ROI_INDUSTRIES.map(i => i.name);
    expect(names).toContain("E-Commerce");
    expect(names).toContain("Healthcare");
    expect(names).toContain("Food & Beverage");
    expect(names).toContain("Finance & Banking");
    expect(names).toContain("Travel & Hospitality");
    expect(names).toContain("Education");
    expect(names).toContain("Real Estate");
    expect(names).toContain("Automotive");
    expect(names).toContain("Retail");
    expect(names).toContain("Technology");
    expect(names).toContain("Beauty & Wellness");
    expect(names).toContain("Entertainment");
    expect(names).toContain("Logistics");
    expect(names).toContain("Insurance");
    expect(names).toContain("Telecommunications");
  });

  it("each industry has name, archetype, rateLabel, dealValueLabel, and defaultDealValue", () => {
    for (const ind of ROI_INDUSTRIES) {
      expect(ind.name).toBeTruthy();
      expect(["direct", "leadgen", "footfall"]).toContain(ind.archetype);
      expect(ind.rateLabel).toBeTruthy();
      expect(ind.dealValueLabel).toBeTruthy();
      expect(ind.defaultDealValue).toBeGreaterThan(0);
    }
  });

  it("industries have industry-specific outcome labels", () => {
    const healthcare = ROI_INDUSTRIES.find(i => i.name === "Healthcare");
    expect(healthcare?.rateLabel).toBe("Appointment Rate");

    const travel = ROI_INDUSTRIES.find(i => i.name === "Travel & Hospitality");
    expect(travel?.rateLabel).toBe("Booking Rate");

    const ecommerce = ROI_INDUSTRIES.find(i => i.name === "E-Commerce");
    expect(ecommerce?.rateLabel).toBe("Conversion Rate");

    const education = ROI_INDUSTRIES.find(i => i.name === "Education");
    expect(education?.rateLabel).toBe("Enrollment Rate");

    const automotive = ROI_INDUSTRIES.find(i => i.name === "Automotive");
    expect(automotive?.rateLabel).toBe("Test Drive Rate");

    const insurance = ROI_INDUSTRIES.find(i => i.name === "Insurance");
    expect(insurance?.rateLabel).toBe("Policy Rate");

    const telecom = ROI_INDUSTRIES.find(i => i.name === "Telecommunications");
    expect(telecom?.rateLabel).toBe("Subscription Rate");
  });

  it("CONV has data for every region-industry combination", () => {
    for (const region of REGIONS) {
      expect(CONV[region]).toBeDefined();
      for (const ind of ROI_INDUSTRIES) {
        expect(CONV[region][ind.name]).toBeGreaterThan(0);
      }
    }
  });

  it("BENCH has data for all 3 channels and all regions", () => {
    for (const ch of ["whatsapp", "sms", "email"]) {
      expect(BENCH[ch]).toBeDefined();
      for (const region of REGIONS) {
        const b = BENCH[ch][region];
        expect(b).toBeDefined();
        expect(b.deliveryRate).toBeGreaterThan(0);
        expect(b.openRate).toBeGreaterThan(0);
        expect(b.ctr).toBeGreaterThan(0);
        expect(b.optOutRate).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("every country has a currency entry", () => {
    for (const c of COUNTRIES) {
      const curr = CURRENCIES[c.name];
      expect(curr).toBeDefined();
      expect(curr.code).toBeTruthy();
      expect(curr.symbol).toBeTruthy();
      expect(curr.rate).toBeGreaterThan(0);
    }
  });

  it("has at least 5 pre-built scenarios", () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(5);
    for (const s of SCENARIOS) {
      expect(s.name).toBeTruthy();
      expect(s.country).toBeTruthy();
      expect(s.industry).toBeTruthy();
      expect(s.messages).toBeGreaterThan(0);
      expect(s.dealValue).toBeGreaterThan(0);
    }
  });

  it("CH_CFG has whatsapp, sms, and email", () => {
    expect(CH_CFG.whatsapp).toBeDefined();
    expect(CH_CFG.sms).toBeDefined();
    expect(CH_CFG.email).toBeDefined();
    expect(CH_CFG.whatsapp.label).toBe("WhatsApp");
  });
});

describe("deriveAdv - Core Calculation Engine", () => {
  const baseInput: ChannelInputs = {
    messages: 50000,
    deliveryRate: 96,
    openRate: 90,
    ctr: 25,
    convRate: 10,
    optOutRate: 0.5,
    costPerMsg: 0.05,
  };

  it("calculates funnel metrics correctly", () => {
    const r = deriveAdv(baseInput, 50);
    expect(r.messages).toBe(50000);
    expect(r.delivered).toBe(48000); // 50000 * 0.96
    expect(r.opened).toBe(43200);   // 48000 * 0.90
    expect(r.clicked).toBe(10800);  // 43200 * 0.25
    expect(r.conversions).toBe(1080); // 10800 * 0.10
    expect(r.revenue).toBe(54000);  // 1080 * 50
    expect(r.spend).toBe(2500);     // 50000 * 0.05
  });

  it("calculates ROI correctly", () => {
    const r = deriveAdv(baseInput, 50);
    expect(r.roi).toBeCloseTo(21.6, 1); // 54000 / 2500
  });

  it("calculates revenue per 1K messages", () => {
    const r = deriveAdv(baseInput, 50);
    expect(r.rev1k).toBeCloseTo(1080, 0);
  });

  it("calculates cost per conversion", () => {
    const r = deriveAdv(baseInput, 50);
    expect(r.cpConv).toBeCloseTo(2.31, 1);
  });

  it("calculates opt-out metrics", () => {
    const r = deriveAdv(baseInput, 50);
    expect(r.moLost).toBe(250);
    expect(r.yrLost).toBe(3000);
  });

  it("handles zero messages gracefully", () => {
    const zeroInput: ChannelInputs = { ...baseInput, messages: 0 };
    const r = deriveAdv(zeroInput, 50);
    expect(r.messages).toBe(0);
    expect(r.revenue).toBe(0);
    expect(r.roi).toBe(0);
    expect(r.rev1k).toBe(0);
  });

  it("handles zero cost per message", () => {
    const freeInput: ChannelInputs = { ...baseInput, costPerMsg: 0 };
    const r = deriveAdv(freeInput, 50);
    expect(r.spend).toBe(0);
    expect(r.roi).toBe(0);
  });

  it("handles zero conversions", () => {
    const noConvInput: ChannelInputs = { ...baseInput, convRate: 0 };
    const r = deriveAdv(noConvInput, 50);
    expect(r.conversions).toBe(0);
    expect(r.revenue).toBe(0);
    expect(r.cpConv).toBe(0);
  });
});

describe("deriveBasic - Simplified Basic Mode Calculation", () => {
  it("calculates basic metrics using region benchmarks", () => {
    const r = deriveBasic(50000, 2.5, 0.086, 50, "Asia Pacific");
    expect(r.messages).toBe(50000);
    expect(r.revenue).toBeGreaterThan(0);
    expect(r.spend).toBeCloseTo(50000 * 0.086, 0);
    expect(r.conversions).toBeGreaterThan(0);
    expect(r.roi).toBeGreaterThan(0);
  });

  it("uses WhatsApp benchmarks for the specified region", () => {
    const apac = deriveBasic(10000, 5, 0.05, 100, "Asia Pacific");
    const europe = deriveBasic(10000, 5, 0.05, 100, "Europe");
    // Different regions should produce different results due to different benchmarks
    expect(apac.delivered).not.toBe(europe.delivered);
  });

  it("falls back to Asia Pacific when region not found", () => {
    const r = deriveBasic(10000, 5, 0.05, 100, "Unknown Region");
    expect(r.messages).toBe(10000);
    expect(r.revenue).toBeGreaterThan(0);
  });

  it("handles zero messages", () => {
    const r = deriveBasic(0, 5, 0.05, 100, "Asia Pacific");
    expect(r.revenue).toBe(0);
    expect(r.conversions).toBe(0);
  });

  it("accepts benchmark overrides that change results", () => {
    const defaultResult = deriveBasic(50000, 2.5, 0.086, 50, "Asia Pacific");
    const overrideResult = deriveBasic(50000, 2.5, 0.086, 50, "Asia Pacific", {
      deliveryRate: 80,
      openRate: 70,
      ctr: 15,
      optOutRate: 1.0,
    });
    // Lower benchmarks should produce fewer conversions and less revenue
    expect(overrideResult.delivered).toBeLessThan(defaultResult.delivered);
    expect(overrideResult.opened).toBeLessThan(defaultResult.opened);
    expect(overrideResult.clicked).toBeLessThan(defaultResult.clicked);
    expect(overrideResult.conversions).toBeLessThan(defaultResult.conversions);
    expect(overrideResult.revenue).toBeLessThan(defaultResult.revenue);
  });

  it("benchmark overrides produce correct funnel values", () => {
    const r = deriveBasic(10000, 5, 0.05, 100, "Asia Pacific", {
      deliveryRate: 90,
      openRate: 80,
      ctr: 20,
      optOutRate: 0.5,
    });
    expect(r.delivered).toBe(9000);   // 10000 * 0.90
    expect(r.opened).toBe(7200);      // 9000 * 0.80
    expect(r.clicked).toBe(1440);     // 7200 * 0.20
    expect(r.conversions).toBe(72);   // 1440 * 0.05
    expect(r.revenue).toBe(7200);     // 72 * 100
    expect(r.spend).toBe(500);        // 10000 * 0.05
  });

  it("benchmark overrides with higher values increase results", () => {
    const defaultResult = deriveBasic(50000, 2.5, 0.086, 50, "Europe");
    const higherResult = deriveBasic(50000, 2.5, 0.086, 50, "Europe", {
      deliveryRate: 99,
      openRate: 98,
      ctr: 50,
      optOutRate: 0.1,
    });
    expect(higherResult.conversions).toBeGreaterThan(defaultResult.conversions);
    expect(higherResult.revenue).toBeGreaterThan(defaultResult.revenue);
  });

  it("undefined overrides use region defaults", () => {
    const withoutOverride = deriveBasic(50000, 2.5, 0.086, 50, "Asia Pacific");
    const withUndefined = deriveBasic(50000, 2.5, 0.086, 50, "Asia Pacific", undefined);
    expect(withoutOverride.delivered).toBe(withUndefined.delivered);
    expect(withoutOverride.revenue).toBe(withUndefined.revenue);
  });
});

describe("Formatting Utilities", () => {
  describe("fmt", () => {
    it("formats numbers with abbreviations", () => {
      expect(fmt(50000)).toBe("50.0K");
      expect(fmt(1500000)).toBe("1.5M");
      expect(fmt(2500000000)).toBe("2.5B");
    });

    it("formats small numbers without abbreviation", () => {
      expect(fmt(500)).toBe("500");
      expect(fmt(9999)).toBe("9,999");
    });

    it("handles null/undefined/NaN", () => {
      expect(fmt(null)).toBe("0");
      expect(fmt(undefined)).toBe("0");
      expect(fmt(NaN)).toBe("0");
    });
  });

  describe("fmtMoney", () => {
    it("formats money with dollar sign and abbreviations", () => {
      expect(fmtMoney(45000)).toBe("$45.0K");
      expect(fmtMoney(2500000)).toBe("$2.50M");
      expect(fmtMoney(500)).toBe("$500.00");
    });

    it("handles negative values", () => {
      expect(fmtMoney(-5000)).toBe("-$5.0K");
    });

    it("handles null/undefined", () => {
      expect(fmtMoney(null)).toBe("$0");
      expect(fmtMoney(undefined)).toBe("$0");
    });
  });

  describe("pct", () => {
    it("formats percentages", () => {
      expect(pct(96)).toBe("96.0%");
      expect(pct(0.5)).toBe("0.5%");
      expect(pct(25, 0)).toBe("25%");
    });

    it("handles null", () => {
      expect(pct(null)).toBe("0.0%");
    });
  });

  describe("dm - currency-aware money display", () => {
    it("converts and formats with custom currency", () => {
      expect(dm(1000, 0.92, "€")).toBe("€920.00");
    });

    it("formats large amounts with abbreviations", () => {
      expect(dm(50000, 1, "$")).toBe("$50.0K");
      expect(dm(2000000, 1, "$")).toBe("$2.00M");
    });

    it("suppresses decimals for high exchange rates", () => {
      expect(dm(100, 83.5, "₹")).toBe("₹8K");
    });

    it("handles null/undefined", () => {
      expect(dm(null)).toBe("$0");
      expect(dm(undefined)).toBe("$0");
    });
  });
});

describe("initChannelInputs", () => {
  it("returns inputs for whatsapp, sms, and email", () => {
    const country = COUNTRIES.find(c => c.name === "US")!;
    const inputs = initChannelInputs("North America", "E-Commerce", country);
    expect(inputs.whatsapp).toBeDefined();
    expect(inputs.sms).toBeDefined();
    expect(inputs.email).toBeDefined();
  });

  it("uses correct country costs", () => {
    const country = COUNTRIES.find(c => c.name === "India")!;
    const inputs = initChannelInputs("Asia Pacific", "E-Commerce", country);
    expect(inputs.whatsapp.costPerMsg).toBe(country.wap);
    expect(inputs.sms.costPerMsg).toBe(country.sms);
    expect(inputs.email.costPerMsg).toBe(0.003);
  });

  it("uses correct benchmark rates for the region", () => {
    const country = COUNTRIES.find(c => c.name === "Singapore")!;
    const inputs = initChannelInputs("Asia Pacific", "E-Commerce", country);
    const waBench = BENCH.whatsapp["Asia Pacific"];
    expect(inputs.whatsapp.deliveryRate).toBe(waBench.deliveryRate);
    expect(inputs.whatsapp.openRate).toBe(waBench.openRate);
    expect(inputs.whatsapp.ctr).toBe(waBench.ctr);
  });

  it("preserves existing message volumes when provided", () => {
    const country = COUNTRIES.find(c => c.name === "US")!;
    const existing = {
      whatsapp: { messages: 100000, deliveryRate: 96, openRate: 90, ctr: 25, convRate: 5, optOutRate: 0.5, costPerMsg: 0.05 },
      sms: { messages: 75000, deliveryRate: 90, openRate: 98, ctr: 20, convRate: 1.5, optOutRate: 1.5, costPerMsg: 0.04 },
    };
    const inputs = initChannelInputs("North America", "E-Commerce", country, existing);
    expect(inputs.whatsapp.messages).toBe(100000);
    expect(inputs.sms.messages).toBe(75000);
  });

  it("defaults to 50000 messages when no existing inputs", () => {
    const country = COUNTRIES.find(c => c.name === "Brazil")!;
    const inputs = initChannelInputs("Latin America", "Food & Beverage", country);
    expect(inputs.whatsapp.messages).toBe(50000);
    expect(inputs.sms.messages).toBe(50000);
  });

  it("calculates positive conversion rates for all channels", () => {
    const country = COUNTRIES.find(c => c.name === "UK")!;
    const inputs = initChannelInputs("Europe", "Travel & Hospitality", country);
    expect(inputs.whatsapp.convRate).toBeGreaterThan(0);
    expect(inputs.sms.convRate).toBeGreaterThan(0);
    expect(inputs.email.convRate).toBeGreaterThan(0);
  });

  it("works for all 15 industries across all regions", () => {
    for (const region of REGIONS) {
      const country = COUNTRIES.find(c => c.region === region)!;
      for (const ind of ROI_INDUSTRIES) {
        const inputs = initChannelInputs(region, ind.name, country);
        expect(inputs.whatsapp.convRate).toBeGreaterThan(0);
      }
    }
  });
});
