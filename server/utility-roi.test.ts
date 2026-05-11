import { describe, it, expect } from "vitest";
import {
  UTILITY_USE_CASES,
  INDUSTRY_USE_CASE_MAP,
  COUNTRIES,
  calcUtilityUseCase,
  calcUtilityAggregate,
  type UtilityUseCaseConfig,
} from "../shared/roiData";

describe("Utility ROI Calculator - Data Integrity", () => {
  it("should have 14 utility use cases defined", () => {
    expect(UTILITY_USE_CASES).toHaveLength(14);
  });

  it("should have unique IDs for all use cases", () => {
    const ids = UTILITY_USE_CASES.map((uc) => uc.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each use case should have required fields", () => {
    for (const uc of UTILITY_USE_CASES) {
      expect(uc.id).toBeTruthy();
      expect(uc.name).toBeTruthy();
      expect(uc.description).toBeTruthy();
      expect(["Cost Deflection", "Revenue Recovery", "Productivity"]).toContain(uc.category);
      expect(uc.keyIndustries.length).toBeGreaterThan(0);
      expect(uc.defaultFields.length).toBeGreaterThanOrEqual(3);
      expect(uc.defaultFields.length).toBeLessThanOrEqual(7);
    }
  });

  it("each use case default field should have required properties", () => {
    for (const uc of UTILITY_USE_CASES) {
      for (const f of uc.defaultFields) {
        expect(f.key).toBeTruthy();
        expect(f.label).toBeTruthy();
        expect(typeof f.defaultValue).toBe("number");
        expect(f.defaultValue).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("should have industry-to-use-case mappings for all ROI industries", () => {
    const mappedIndustries = Object.keys(INDUSTRY_USE_CASE_MAP);
    expect(mappedIndustries.length).toBeGreaterThanOrEqual(10);
  });

  it("all mapped use case IDs should reference existing use cases", () => {
    const validIds = new Set(UTILITY_USE_CASES.map((uc) => uc.id));
    for (const [industry, ids] of Object.entries(INDUSTRY_USE_CASE_MAP)) {
      for (const id of ids) {
        expect(validIds.has(id)).toBe(true);
      }
    }
  });

  it("all countries should have wapUtility pricing", () => {
    for (const c of COUNTRIES) {
      expect(c.wapUtility).toBeDefined();
      expect(c.wapUtility).toBeGreaterThan(0);
      // Utility should be cheaper than marketing
      expect(c.wapUtility).toBeLessThan(c.wap);
    }
  });
});

describe("Utility ROI Calculator - calcUtilityUseCase", () => {
  const utilityPrice = 0.014; // Malaysia

  it("should calculate Order & Shipping Updates correctly", () => {
    const fields = {
      ordersPerMonth: 10000,
      wismoCallRate: 15,
      callCenterCostPerCall: 5,
      deflectionRate: 65,
    };
    const result = calcUtilityUseCase("order_shipping", fields, utilityPrice);
    expect(result.messagesPerMonth).toBe(10000 * 2); // 2 msgs per order
    expect(result.conversationsPerMonth).toBe(10000 * 2); // 2 separate 24h windows
    // savings = orders * wismoRate * deflection * costPerCall = 10000 * 0.15 * 0.65 * 5 = 4875
    expect(result.monthlySavings).toBe(4875);
    expect(result.whatsappCost).toBeCloseTo(utilityPrice * result.conversationsPerMonth, 1);
    expect(result.netValue).toBe(result.monthlySavings - result.whatsappCost);
    expect(result.roiMultiplier).toBeGreaterThan(0);
  });

  it("should calculate Abandoned Cart Recovery correctly", () => {
    const fields = {
      abandonedCartsPerMonth: 8000,
      avgCartValue: 65,
      recoveryRate: 12,
    };
    const result = calcUtilityUseCase("abandoned_cart", fields, utilityPrice);
    expect(result.messagesPerMonth).toBe(8000 * 2); // 2-message sequence per cart
    expect(result.conversationsPerMonth).toBe(8000); // 1 conversation per cart (within 24h)
    expect(result.monthlySavings).toBeCloseTo(8000 * 0.12 * 65, 2); // carts * rate * value
    expect(result.whatsappCost).toBeCloseTo(utilityPrice * 8000, 1); // charged per conversation
    expect(result.netValue).toBeCloseTo(result.monthlySavings - result.whatsappCost, 2);
  });

  it("should calculate Appointment Reminders correctly", () => {
    const fields = {
      appointmentsPerMonth: 5000,
      noShowRate: 20,
      revenuePerAppointment: 100,
      reductionRate: 60,
    };
    const result = calcUtilityUseCase("appointment_reminders", fields, utilityPrice);
    expect(result.messagesPerMonth).toBe(5000 * 2); // reminder + confirmation
    expect(result.conversationsPerMonth).toBe(5000 * 2); // 2 separate 24h windows
    expect(result.monthlySavings).toBe(5000 * 0.20 * 0.60 * 100);
    expect(result.whatsappCost).toBeCloseTo(utilityPrice * result.conversationsPerMonth, 1);
  });

  it("should calculate Payment & Invoice Reminders correctly", () => {
    const fields = {
      invoicesPerMonth: 5000,
      overdueRate: 25,
      avgInvoiceValue: 200,
      collectionImprovement: 35,
    };
    const result = calcUtilityUseCase("payment_invoice", fields, utilityPrice);
    const overdueInvoices = 5000 * 0.25; // 1250 overdue
    expect(result.messagesPerMonth).toBe(overdueInvoices * 2); // 2 msgs per overdue invoice
    expect(result.conversationsPerMonth).toBe(overdueInvoices * 2); // 2 separate 24h windows
    expect(result.monthlySavings).toBe(5000 * 0.25 * 200 * 0.35);
    expect(result.whatsappCost).toBeCloseTo(utilityPrice * result.conversationsPerMonth, 1); // charged per conversation
  });

  it("should calculate Automated FAQ correctly", () => {
    const fields = {
      supportTicketsPerMonth: 15000,
      automationRate: 40,
      costPerTicket: 8,
    };
    const result = calcUtilityUseCase("faq_selfservice", fields, utilityPrice);
    const automatedTickets = 15000 * 0.40;
    expect(result.messagesPerMonth).toBe(automatedTickets * 3); // 3 msgs per ticket
    expect(result.conversationsPerMonth).toBe(automatedTickets); // 1 conversation per FAQ session
    expect(result.monthlySavings).toBe(automatedTickets * 8);
    expect(result.whatsappCost).toBeCloseTo(utilityPrice * result.conversationsPerMonth, 1); // charged per conversation
  });

  it("should calculate Lead Qualification correctly", () => {
    const fields = {
      leadsPerMonth: 3000,
      qualificationRate: 60,
      costPerManualQual: 12,
      conversionLift: 15,
    };
    const result = calcUtilityUseCase("lead_qualification", fields, utilityPrice);
    const qualifiedLeads = 3000 * 0.60;
    expect(result.messagesPerMonth).toBe(qualifiedLeads * 4); // 4 msgs per lead
    expect(result.conversationsPerMonth).toBe(qualifiedLeads); // 1 conversation per qualification
    // monthlySavings now includes conversionLift revenue uplift
    // costSavings = 1800 * 12 = 21600, but conversionLift needs avgDealValue which is missing (0)
    // So only cost savings are counted here
    expect(result.monthlySavings).toBe(qualifiedLeads * 12); // qualified * costPerManualQual (no avgDealValue)
    expect(result.whatsappCost).toBeCloseTo(utilityPrice * result.conversationsPerMonth, 1); // charged per conversation
  });

  it("should calculate Renewal & Subscription correctly", () => {
    const fields = {
      expiringPerMonth: 2000,
      currentRenewalRate: 60,
      avgSubscriptionValue: 300,
      renewalLift: 20,
    };
    const result = calcUtilityUseCase("renewal_subscription", fields, utilityPrice);
    expect(result.messagesPerMonth).toBe(2000 * 3); // 3 reminder touchpoints
    expect(result.conversationsPerMonth).toBe(2000 * 3); // 3 separate 24h windows
    // additionalRenewals = 2000 * (1 - 0.60) * 0.20 = 160
    expect(result.monthlySavings).toBe(160 * 300);
    expect(result.whatsappCost).toBeCloseTo(utilityPrice * result.conversationsPerMonth, 1);
  });

  it("should calculate Booking Confirmations correctly", () => {
    const fields = {
      bookingsPerMonth: 4000,
      confirmationCallRate: 30,
      callCost: 4,
      deflectionRate: 70,
    };
    const result = calcUtilityUseCase("booking_confirmations", fields, utilityPrice);
    expect(result.messagesPerMonth).toBe(4000); // one confirmation per booking
    expect(result.conversationsPerMonth).toBe(4000); // 1 conversation per booking
    // callsDeflected = 4000 * 0.30 * 0.70 = 840
    expect(result.monthlySavings).toBe(840 * 4);
    expect(result.whatsappCost).toBeCloseTo(utilityPrice * result.conversationsPerMonth, 1);
  });

  it("should throw for unknown use case", () => {
    expect(() => calcUtilityUseCase("nonexistent", {}, utilityPrice)).toThrow("Unknown use case");
  });
});

describe("Utility ROI Calculator - calcUtilityAggregate", () => {
  const utilityPrice = 0.014; // Malaysia

  it("should aggregate results for multiple enabled use cases", () => {
    const configs: UtilityUseCaseConfig[] = [
      {
        useCaseId: "order_shipping",
        enabled: true,
        fields: { ordersPerMonth: 10000, wismoCallRate: 15, callCenterCostPerCall: 5, deflectionRate: 65 },
      },
      {
        useCaseId: "abandoned_cart",
        enabled: true,
        fields: { abandonedCartsPerMonth: 8000, avgCartValue: 65, recoveryRate: 12 },
      },
      {
        useCaseId: "appointment_reminders",
        enabled: false,
        fields: { appointmentsPerMonth: 5000, noShowRate: 20, revenuePerAppointment: 100, reductionRate: 60 },
      },
    ];

    const result = calcUtilityAggregate(configs, utilityPrice);
    expect(result.useCaseResults).toHaveLength(2); // only enabled ones
    expect(result.totalMonthlySavings).toBeGreaterThan(0);
    expect(result.totalWhatsappCost).toBeGreaterThan(0);
    expect(result.totalNetValue).toBe(result.totalMonthlySavings - result.totalWhatsappCost);
    expect(result.totalMessages).toBeGreaterThan(0);
    expect(result.annualProjection).toBe(result.totalNetValue * 12);
    expect(result.overallROI).toBe(result.totalMonthlySavings / result.totalWhatsappCost);
  });

  it("should return empty results when no use cases are enabled", () => {
    const configs: UtilityUseCaseConfig[] = [
      {
        useCaseId: "order_shipping",
        enabled: false,
        fields: { ordersPerMonth: 10000, wismoCallRate: 15, costPerCall: 5, callDeflectionRate: 65 },
      },
    ];

    const result = calcUtilityAggregate(configs, utilityPrice);
    expect(result.useCaseResults).toHaveLength(0);
    expect(result.totalMonthlySavings).toBe(0);
    expect(result.totalWhatsappCost).toBe(0);
    expect(result.totalNetValue).toBe(0);
  });

  it("should include use case metadata in results", () => {
    const configs: UtilityUseCaseConfig[] = [
      {
        useCaseId: "faq_selfservice",
        enabled: true,
        fields: { supportTicketsPerMonth: 15000, automationRate: 40, costPerTicket: 8 },
      },
    ];

    const result = calcUtilityAggregate(configs, utilityPrice);
    expect(result.useCaseResults[0].useCaseId).toBe("faq_selfservice");
    expect(result.useCaseResults[0].name).toBe("Automated FAQ & Self-Service");
    expect(result.useCaseResults[0].category).toBe("Productivity");
  });
});

describe("Utility Pricing Validation", () => {
  it("Malaysia utility price should match Meta rate card ($0.0140)", () => {
    const malaysia = COUNTRIES.find((c) => c.name === "Malaysia");
    expect(malaysia?.wapUtility).toBeCloseTo(0.014, 4);
  });

  it("US utility price should match Meta rate card ($0.0034)", () => {
    const us = COUNTRIES.find((c) => c.name === "US");
    expect(us?.wapUtility).toBeCloseTo(0.0034, 4);
  });

  it("India utility price should match Meta rate card ($0.0014)", () => {
    const india = COUNTRIES.find((c) => c.name === "India");
    expect(india?.wapUtility).toBeCloseTo(0.0014, 4);
  });

  it("Brazil utility price should match Meta rate card ($0.0068)", () => {
    const brazil = COUNTRIES.find((c) => c.name === "Brazil");
    expect(brazil?.wapUtility).toBeCloseTo(0.0068, 4);
  });

  it("UK utility price should match Meta rate card ($0.0220)", () => {
    const uk = COUNTRIES.find((c) => c.name === "UK");
    expect(uk?.wapUtility).toBeCloseTo(0.0220, 4);
  });

  it("Singapore utility price should match Meta rate card ($0.0113)", () => {
    const sg = COUNTRIES.find((c) => c.name === "Singapore");
    expect(sg?.wapUtility).toBeCloseTo(0.0113, 4);
  });

  it("utility prices should always be lower than marketing prices", () => {
    for (const c of COUNTRIES) {
      expect(c.wapUtility).toBeLessThan(c.wap);
    }
  });
});
