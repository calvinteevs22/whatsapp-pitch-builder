import { describe, it, expect } from "vitest";
import {
  calcUtilityUseCase,
  calcUtilityAggregate,
  UTILITY_USE_CASES,
  INDUSTRY_USE_CASE_MAP,
} from "../shared/roiData";

const UTILITY_PRICE = 0.0113; // Singapore utility rate

// ─── Delivery Failure Recovery (NDR/RTO) ───

describe("Delivery Failure Recovery (NDR/RTO)", () => {
  const defaults = {
    monthlyOrders: 10000,
    ndrRate: 15,
    avgOrderValue: 50,
    rtoShippingCost: 5,
    recoveryRate: 35,
  };

  it("calculates correctly with default values", () => {
    const r = calcUtilityUseCase("delivery_failure_recovery", defaults, UTILITY_PRICE);
    // failedDeliveries = 10000 * 0.15 = 1500
    // recoveredOrders = 1500 * 0.35 = 525
    // revenueSaved = 525 * 50 = 26250
    // shippingCostSaved = 525 * 5 = 2625
    // monthlySavings = 26250 + 2625 = 28875
    expect(r.monthlySavings).toBeCloseTo(28875, 0);
    // messagesPerMonth = 1500 * 2 = 3000
    expect(r.messagesPerMonth).toBe(3000);
    // conversationsPerMonth = 1500 (both msgs in same 24h window)
    expect(r.conversationsPerMonth).toBe(1500);
    // waCost = 1500 * 0.0113 = 16.95
    expect(r.whatsappCost).toBeCloseTo(16.95, 1);
    expect(r.netValue).toBeCloseTo(28875 - 16.95, 0);
    expect(r.category).toBe("Revenue Recovery");
  });

  it("returns zero when no delivery failures", () => {
    const r = calcUtilityUseCase("delivery_failure_recovery", { ...defaults, ndrRate: 0 }, UTILITY_PRICE);
    expect(r.monthlySavings).toBe(0);
    expect(r.messagesPerMonth).toBe(0);
    expect(r.conversationsPerMonth).toBe(0);
  });

  it("returns zero when recovery rate is zero", () => {
    const r = calcUtilityUseCase("delivery_failure_recovery", { ...defaults, recoveryRate: 0 }, UTILITY_PRICE);
    expect(r.monthlySavings).toBe(0);
    // Messages still sent to all failed deliveries
    expect(r.messagesPerMonth).toBe(3000);
  });

  it("scales linearly with order volume", () => {
    const r1 = calcUtilityUseCase("delivery_failure_recovery", defaults, UTILITY_PRICE);
    const r2 = calcUtilityUseCase("delivery_failure_recovery", { ...defaults, monthlyOrders: 20000 }, UTILITY_PRICE);
    expect(r2.monthlySavings).toBeCloseTo(r1.monthlySavings * 2, 0);
  });

  it("includes both revenue saved and shipping cost saved", () => {
    // With $0 shipping cost, only revenue saved
    const r1 = calcUtilityUseCase("delivery_failure_recovery", { ...defaults, rtoShippingCost: 0 }, UTILITY_PRICE);
    expect(r1.monthlySavings).toBeCloseTo(26250, 0); // only revenue
    // With $0 order value, only shipping saved
    const r2 = calcUtilityUseCase("delivery_failure_recovery", { ...defaults, avgOrderValue: 0 }, UTILITY_PRICE);
    expect(r2.monthlySavings).toBeCloseTo(2625, 0); // only shipping
  });
});

// ─── Returns & Refund Processing ───

describe("Returns & Refund Processing", () => {
  const defaults = {
    monthlyOrders: 10000,
    returnRate: 15,
    currentProcessingCost: 12,
    waProcessingCost: 2,
  };

  it("calculates correctly with default values", () => {
    const r = calcUtilityUseCase("returns_refund", defaults, UTILITY_PRICE);
    // monthlyReturns = 10000 * 0.15 = 1500
    // savings = 1500 * (12 - 2) = 15000
    expect(r.monthlySavings).toBeCloseTo(15000, 0);
    // messagesPerMonth = 1500 * 4 = 6000
    expect(r.messagesPerMonth).toBe(6000);
    // conversationsPerMonth = 1500 (all 4 msgs in same 24h window)
    expect(r.conversationsPerMonth).toBe(1500);
    // waCost = 1500 * 0.0113 = 16.95
    expect(r.whatsappCost).toBeCloseTo(16.95, 1);
    expect(r.category).toBe("Cost Deflection");
  });

  it("returns zero when no returns", () => {
    const r = calcUtilityUseCase("returns_refund", { ...defaults, returnRate: 0 }, UTILITY_PRICE);
    expect(r.monthlySavings).toBe(0);
    expect(r.conversationsPerMonth).toBe(0);
  });

  it("returns zero when WA cost equals current cost", () => {
    const r = calcUtilityUseCase("returns_refund", { ...defaults, waProcessingCost: 12 }, UTILITY_PRICE);
    expect(r.monthlySavings).toBe(0);
  });

  it("handles negative savings when WA cost exceeds current cost", () => {
    const r = calcUtilityUseCase("returns_refund", { ...defaults, waProcessingCost: 15 }, UTILITY_PRICE);
    expect(r.monthlySavings).toBeLessThan(0);
  });
});

// ─── Customer Feedback & NPS Collection ───

describe("Customer Feedback & NPS Collection", () => {
  const defaults = {
    monthlyInteractions: 10000,
    surveyRate: 50,
    waResponseRate: 45,
    phoneSurveyVolume: 500,
    costPerPhoneSurvey: 5,
    avgCustomerValue: 200,
    detractorRecoveryRate: 20,
  };

  it("calculates correctly with default values", () => {
    const r = calcUtilityUseCase("feedback_nps", defaults, UTILITY_PRICE);
    // surveysSent = 10000 * 0.5 = 5000
    // responsesCollected = 5000 * 0.45 = 2250
    // phoneSurveySavings = 500 * 5 = 2500
    // detractorsIdentified = 2250 * 0.15 = 337.5
    // recoveredCustomers = 337.5 * 0.20 = 67.5
    // retentionValue = 67.5 * (200 / 12) = 67.5 * 16.667 = 1125
    // monthlySavings = 2500 + 1125 = 3625
    expect(r.monthlySavings).toBeCloseTo(3625, 0);
    // messagesPerMonth = 5000
    expect(r.messagesPerMonth).toBe(5000);
    // conversationsPerMonth = 5000
    expect(r.conversationsPerMonth).toBe(5000);
    // waCost = 5000 * 0.0113 = 56.50
    expect(r.whatsappCost).toBeCloseTo(56.50, 1);
    expect(r.category).toBe("Productivity");
  });

  it("works with zero phone surveys (only detractor recovery value)", () => {
    const r = calcUtilityUseCase("feedback_nps", { ...defaults, phoneSurveyVolume: 0 }, UTILITY_PRICE);
    // Only retentionValue = 1125
    expect(r.monthlySavings).toBeCloseTo(1125, 0);
  });

  it("works with zero detractor recovery (only phone savings)", () => {
    const r = calcUtilityUseCase("feedback_nps", { ...defaults, detractorRecoveryRate: 0 }, UTILITY_PRICE);
    // Only phoneSurveySavings = 2500
    expect(r.monthlySavings).toBeCloseTo(2500, 0);
  });

  it("returns zero when no surveys sent", () => {
    const r = calcUtilityUseCase("feedback_nps", { ...defaults, surveyRate: 0, phoneSurveyVolume: 0 }, UTILITY_PRICE);
    expect(r.monthlySavings).toBe(0);
    expect(r.messagesPerMonth).toBe(0);
  });
});

// ─── Fraud & Transaction Alerts ───

describe("Fraud & Transaction Alerts", () => {
  const defaults = {
    monthlyTransactions: 50000,
    flaggedRate: 3,
    avgFlaggedValue: 150,
    fraudPreventionRate: 25,
    chargebackCost: 50,
    callDeflectionRate: 60,
    costPerCall: 8,
  };

  it("calculates correctly with default values", () => {
    const r = calcUtilityUseCase("fraud_alerts", defaults, UTILITY_PRICE);
    // flaggedTxns = 50000 * 0.03 = 1500
    // fraudsPrevented = 1500 * 0.25 = 375
    // chargebackSavings = 375 * 50 = 18750
    // callsDeflected = 1500 * 0.60 = 900
    // callCenterSavings = 900 * 8 = 7200
    // monthlySavings = 18750 + 7200 = 25950
    expect(r.monthlySavings).toBeCloseTo(25950, 0);
    // messagesPerMonth = 1500
    expect(r.messagesPerMonth).toBe(1500);
    // conversationsPerMonth = 1500
    expect(r.conversationsPerMonth).toBe(1500);
    // waCost = 1500 * 0.0113 = 16.95
    expect(r.whatsappCost).toBeCloseTo(16.95, 1);
    expect(r.category).toBe("Revenue Recovery");
  });

  it("works with zero fraud prevention (only call deflection)", () => {
    const r = calcUtilityUseCase("fraud_alerts", { ...defaults, fraudPreventionRate: 0 }, UTILITY_PRICE);
    // Only callCenterSavings = 7200
    expect(r.monthlySavings).toBeCloseTo(7200, 0);
  });

  it("works with zero call deflection (only chargeback savings)", () => {
    const r = calcUtilityUseCase("fraud_alerts", { ...defaults, callDeflectionRate: 0 }, UTILITY_PRICE);
    // Only chargebackSavings = 18750
    expect(r.monthlySavings).toBeCloseTo(18750, 0);
  });

  it("returns zero when no flagged transactions", () => {
    const r = calcUtilityUseCase("fraud_alerts", { ...defaults, flaggedRate: 0 }, UTILITY_PRICE);
    expect(r.monthlySavings).toBe(0);
    expect(r.messagesPerMonth).toBe(0);
  });
});

// ─── Service Reminders (Recurring) ───

describe("Service Reminders (Recurring)", () => {
  const defaults = {
    activeCustomers: 5000,
    dueRate: 15,
    currentRebookRate: 40,
    waRebookRate: 65,
    avgServiceValue: 150,
  };

  it("calculates correctly with default values", () => {
    const r = calcUtilityUseCase("service_reminders", defaults, UTILITY_PRICE);
    // customersDue = 5000 * 0.15 = 750
    // incrementalBookings = 750 * (0.65 - 0.40) = 750 * 0.25 = 187.5
    // monthlySavings = 187.5 * 150 = 28125
    expect(r.monthlySavings).toBeCloseTo(28125, 0);
    // messagesPerMonth = 750 * 2 = 1500
    expect(r.messagesPerMonth).toBe(1500);
    // conversationsPerMonth = 750 (both msgs in same 24h window)
    expect(r.conversationsPerMonth).toBe(750);
    // waCost = 750 * 0.0113 = 8.475
    expect(r.whatsappCost).toBeCloseTo(8.475, 1);
    expect(r.category).toBe("Revenue Recovery");
  });

  it("returns zero when WA rebook rate equals current rate", () => {
    const r = calcUtilityUseCase("service_reminders", { ...defaults, waRebookRate: 40 }, UTILITY_PRICE);
    expect(r.monthlySavings).toBe(0);
  });

  it("returns negative when WA rebook rate is lower than current", () => {
    const r = calcUtilityUseCase("service_reminders", { ...defaults, waRebookRate: 30 }, UTILITY_PRICE);
    expect(r.monthlySavings).toBeLessThan(0);
  });

  it("returns zero when no customers are due", () => {
    const r = calcUtilityUseCase("service_reminders", { ...defaults, dueRate: 0 }, UTILITY_PRICE);
    expect(r.monthlySavings).toBe(0);
    expect(r.messagesPerMonth).toBe(0);
  });
});

// ─── Waitlist & Queue Management ───

describe("Waitlist & Queue Management", () => {
  const defaults = {
    monthlyWaitlistEntries: 3000,
    currentWalkawayRate: 25,
    waWalkawayRate: 10,
    avgTransactionValue: 40,
  };

  it("calculates correctly with default values", () => {
    const r = calcUtilityUseCase("waitlist_queue", defaults, UTILITY_PRICE);
    // additionalServed = 3000 * (0.25 - 0.10) = 3000 * 0.15 = 450
    // monthlySavings = 450 * 40 = 18000
    expect(r.monthlySavings).toBeCloseTo(18000, 0);
    // messagesPerMonth = 3000 * 3 = 9000
    expect(r.messagesPerMonth).toBe(9000);
    // conversationsPerMonth = 3000 (all 3 msgs in same 24h window)
    expect(r.conversationsPerMonth).toBe(3000);
    // waCost = 3000 * 0.0113 = 33.90
    expect(r.whatsappCost).toBeCloseTo(33.90, 1);
    expect(r.category).toBe("Cost Deflection");
  });

  it("returns zero when walk-away rates are equal", () => {
    const r = calcUtilityUseCase("waitlist_queue", { ...defaults, waWalkawayRate: 25 }, UTILITY_PRICE);
    expect(r.monthlySavings).toBe(0);
  });

  it("returns zero when no waitlist entries", () => {
    const r = calcUtilityUseCase("waitlist_queue", { ...defaults, monthlyWaitlistEntries: 0 }, UTILITY_PRICE);
    expect(r.monthlySavings).toBe(0);
    expect(r.messagesPerMonth).toBe(0);
  });
});

// ─── Industry Mapping Validation ───

describe("Industry-to-Use-Case Mapping", () => {
  it("all mapped use case IDs exist in UTILITY_USE_CASES", () => {
    const validIds = UTILITY_USE_CASES.map((uc) => uc.id);
    for (const [industry, useCaseIds] of Object.entries(INDUSTRY_USE_CASE_MAP)) {
      for (const id of useCaseIds) {
        expect(validIds, `Unknown use case "${id}" in industry "${industry}"`).toContain(id);
      }
    }
  });

  it("every use case is mapped to at least one industry", () => {
    const allMappedIds = new Set(Object.values(INDUSTRY_USE_CASE_MAP).flat());
    for (const uc of UTILITY_USE_CASES) {
      expect(allMappedIds, `Use case "${uc.id}" not mapped to any industry`).toContain(uc.id);
    }
  });

  it("E-Commerce includes delivery_failure_recovery and returns_refund", () => {
    expect(INDUSTRY_USE_CASE_MAP["E-Commerce"]).toContain("delivery_failure_recovery");
    expect(INDUSTRY_USE_CASE_MAP["E-Commerce"]).toContain("returns_refund");
  });

  it("Finance & Banking includes fraud_alerts", () => {
    expect(INDUSTRY_USE_CASE_MAP["Finance & Banking"]).toContain("fraud_alerts");
  });

  it("Healthcare includes service_reminders and waitlist_queue", () => {
    expect(INDUSTRY_USE_CASE_MAP["Healthcare"]).toContain("service_reminders");
    expect(INDUSTRY_USE_CASE_MAP["Healthcare"]).toContain("waitlist_queue");
  });

  it("Automotive includes service_reminders", () => {
    expect(INDUSTRY_USE_CASE_MAP["Automotive"]).toContain("service_reminders");
  });

  it("feedback_nps is mapped to all 15 industries", () => {
    for (const industry of Object.keys(INDUSTRY_USE_CASE_MAP)) {
      expect(INDUSTRY_USE_CASE_MAP[industry], `feedback_nps missing from ${industry}`).toContain("feedback_nps");
    }
  });
});

// ─── Aggregate with New Use Cases ───

describe("Aggregate calculation with new use cases", () => {
  it("aggregates all 14 use cases correctly", () => {
    const configs = UTILITY_USE_CASES.map((uc) => ({
      useCaseId: uc.id,
      enabled: true,
      fields: Object.fromEntries(uc.defaultFields.map((f) => [f.key, f.defaultValue])),
    }));
    const agg = calcUtilityAggregate(configs, UTILITY_PRICE);
    expect(agg.useCaseResults).toHaveLength(14);
    expect(agg.totalMonthlySavings).toBeGreaterThan(0);
    expect(agg.totalWhatsappCost).toBeGreaterThan(0);
    expect(agg.totalNetValue).toBe(agg.totalMonthlySavings - agg.totalWhatsappCost);
    expect(agg.totalMessages).toBeGreaterThan(0);
    expect(agg.totalConversations).toBeGreaterThan(0);
    expect(agg.totalConversations).toBeLessThanOrEqual(agg.totalMessages);
    expect(agg.annualProjection).toBeCloseTo(agg.totalNetValue * 12, 0);
  });

  it("conversation-based pricing: conversations <= messages for all use cases", () => {
    for (const uc of UTILITY_USE_CASES) {
      const fields = Object.fromEntries(uc.defaultFields.map((f) => [f.key, f.defaultValue]));
      const r = calcUtilityUseCase(uc.id, fields, UTILITY_PRICE);
      expect(r.conversationsPerMonth, `${uc.id}: conversations should be <= messages`).toBeLessThanOrEqual(r.messagesPerMonth);
    }
  });

  it("all 14 use cases have positive ROI with default values", () => {
    for (const uc of UTILITY_USE_CASES) {
      const fields = Object.fromEntries(uc.defaultFields.map((f) => [f.key, f.defaultValue]));
      const r = calcUtilityUseCase(uc.id, fields, UTILITY_PRICE);
      expect(r.roiMultiplier, `${uc.id} should have positive ROI`).toBeGreaterThan(1);
    }
  });
});
