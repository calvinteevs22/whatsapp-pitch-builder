import { describe, it, expect } from "vitest";
import {
  calcUtilityUseCase,
  calcUtilityAggregate,
  UTILITY_USE_CASES,
  INDUSTRY_USE_CASE_MAP,
} from "../shared/roiData";

const UTILITY_PRICE = 0.0113; // Singapore utility rate

describe("Utility ROI Calculator — Corrected Calculations", () => {
  // ─── Conversation-based pricing ───
  describe("Conversation-based pricing (CRITICAL fix)", () => {
    it("FAQ Self-Service: charges per conversation, not per message", () => {
      const result = calcUtilityUseCase("faq_selfservice", {
        supportTicketsPerMonth: 15000,
        automationRate: 40,
        costPerTicket: 8,
      }, UTILITY_PRICE);

      // 15000 * 0.4 = 6000 automated conversations
      // messages = 6000 * 3 = 18000 (3 msgs per convo)
      // conversations = 6000 (one 24h window per FAQ session)
      expect(result.messagesPerMonth).toBe(18000);
      expect(result.conversationsPerMonth).toBe(6000);
      // WA cost should be based on conversations, NOT messages
      expect(result.whatsappCost).toBeCloseTo(6000 * UTILITY_PRICE, 2);
      // NOT 18000 * UTILITY_PRICE (old incorrect calculation)
      expect(result.whatsappCost).not.toBeCloseTo(18000 * UTILITY_PRICE, 2);
    });

    it("Lead Qualification: charges per conversation, not per message", () => {
      const result = calcUtilityUseCase("lead_qualification", {
        leadsPerMonth: 3000,
        qualificationRate: 60,
        costPerManualQual: 12,
        conversionLift: 15,
        avgDealValue: 500,
      }, UTILITY_PRICE);

      // 3000 * 0.6 = 1800 qualified leads
      // messages = 1800 * 4 = 7200 (4 msgs per qualification)
      // conversations = 1800 (one 24h window per qualification)
      expect(result.messagesPerMonth).toBe(7200);
      expect(result.conversationsPerMonth).toBe(1800);
      // WA cost should be based on conversations
      expect(result.whatsappCost).toBeCloseTo(1800 * UTILITY_PRICE, 2);
    });

    it("Order & Shipping: 2 conversations is correct (different 24h windows)", () => {
      const result = calcUtilityUseCase("order_shipping", {
        ordersPerMonth: 10000,
        wismoCallRate: 15,
        callCenterCostPerCall: 5,
        deflectionRate: 65,
      }, UTILITY_PRICE);

      // 2 messages = 2 conversations (order day vs ship day)
      expect(result.messagesPerMonth).toBe(20000);
      expect(result.conversationsPerMonth).toBe(20000);
      expect(result.whatsappCost).toBeCloseTo(20000 * UTILITY_PRICE, 2);
    });

    it("Booking Confirmations: 1 message = 1 conversation", () => {
      const result = calcUtilityUseCase("booking_confirmations", {
        bookingsPerMonth: 4000,
        confirmationCallRate: 30,
        callCost: 4,
        deflectionRate: 70,
      }, UTILITY_PRICE);

      expect(result.messagesPerMonth).toBe(4000);
      expect(result.conversationsPerMonth).toBe(4000);
    });

    it("Renewal Reminders: 3 conversations correct (30-day, 7-day, 1-day windows)", () => {
      const result = calcUtilityUseCase("renewal_subscription", {
        expiringPerMonth: 2000,
        currentRenewalRate: 60,
        avgSubscriptionValue: 300,
        renewalLift: 20,
      }, UTILITY_PRICE);

      expect(result.messagesPerMonth).toBe(6000);
      expect(result.conversationsPerMonth).toBe(6000);
    });
  });

  // ─── Lead Qualification conversionLift now used ───
  describe("Lead Qualification conversionLift (MODERATE fix)", () => {
    it("includes revenue uplift from conversionLift in savings", () => {
      const result = calcUtilityUseCase("lead_qualification", {
        leadsPerMonth: 3000,
        qualificationRate: 60,
        costPerManualQual: 12,
        conversionLift: 15,
        avgDealValue: 500,
      }, UTILITY_PRICE);

      // Cost savings: 1800 * $12 = $21,600
      const costSavings = 1800 * 12;
      // Revenue uplift: 1800 * 0.15 * $500 = $135,000
      const revenueUplift = 1800 * 0.15 * 500;
      expect(result.monthlySavings).toBeCloseTo(costSavings + revenueUplift, 2);
      expect(result.monthlySavings).toBeCloseTo(156600, 2);
    });

    it("with 0% conversionLift, only cost savings are counted", () => {
      const result = calcUtilityUseCase("lead_qualification", {
        leadsPerMonth: 3000,
        qualificationRate: 60,
        costPerManualQual: 12,
        conversionLift: 0,
        avgDealValue: 500,
      }, UTILITY_PRICE);

      expect(result.monthlySavings).toBeCloseTo(1800 * 12, 2);
    });

    it("with 0 avgDealValue, only cost savings are counted", () => {
      const result = calcUtilityUseCase("lead_qualification", {
        leadsPerMonth: 3000,
        qualificationRate: 60,
        costPerManualQual: 12,
        conversionLift: 15,
        avgDealValue: 0,
      }, UTILITY_PRICE);

      expect(result.monthlySavings).toBeCloseTo(1800 * 12, 2);
    });
  });

  // ─── Appointment Reminders category fix ───
  describe("Appointment Reminders category (MINOR fix)", () => {
    it("category is Revenue Recovery, not Cost Deflection", () => {
      const uc = UTILITY_USE_CASES.find((u) => u.id === "appointment_reminders");
      expect(uc?.category).toBe("Revenue Recovery");
    });

    it("calculates recovered revenue correctly", () => {
      const result = calcUtilityUseCase("appointment_reminders", {
        appointmentsPerMonth: 5000,
        noShowRate: 20,
        revenuePerAppointment: 120,
        reductionRate: 50,
      }, UTILITY_PRICE);

      // 5000 * 0.2 * 0.5 = 500 recovered appointments
      // 500 * $120 = $60,000 recovered revenue
      expect(result.monthlySavings).toBeCloseTo(60000, 2);
      expect(result.category).toBe("Revenue Recovery");
    });
  });

  // ─── Payment Reminders: only overdue invoices ───
  describe("Payment Reminders: target overdue invoices only (MINOR fix)", () => {
    it("messages sent only to overdue invoices, not all invoices", () => {
      const result = calcUtilityUseCase("payment_invoice", {
        invoicesPerMonth: 5000,
        overdueRate: 25,
        avgInvoiceValue: 200,
        collectionImprovement: 35,
      }, UTILITY_PRICE);

      // Overdue invoices: 5000 * 0.25 = 1250
      // Messages: 1250 * 2 = 2500 (only to overdue, not all 5000)
      expect(result.messagesPerMonth).toBe(2500);
      // NOT 10000 (old: invoices * 2 = all invoices)
      expect(result.messagesPerMonth).not.toBe(10000);
      // Conversations: 1250 * 2 = 2500 (2 separate 24h windows)
      expect(result.conversationsPerMonth).toBe(2500);
    });

    it("recovered revenue based on overdue invoices", () => {
      const result = calcUtilityUseCase("payment_invoice", {
        invoicesPerMonth: 5000,
        overdueRate: 25,
        avgInvoiceValue: 200,
        collectionImprovement: 35,
      }, UTILITY_PRICE);

      // 1250 overdue * 0.35 improvement * $200 = $87,500
      expect(result.monthlySavings).toBeCloseTo(87500, 2);
    });
  });

  // ─── Abandoned Cart: 2-message sequence ───
  describe("Abandoned Cart: 2-message sequence (MINOR fix)", () => {
    it("sends 2 messages per cart but charges 1 conversation", () => {
      const result = calcUtilityUseCase("abandoned_cart", {
        abandonedCartsPerMonth: 8000,
        avgCartValue: 65,
        recoveryRate: 12,
      }, UTILITY_PRICE);

      // 2 messages per cart (initial + follow-up)
      expect(result.messagesPerMonth).toBe(16000);
      // But only 1 conversation per cart (both within 24h)
      expect(result.conversationsPerMonth).toBe(8000);
      // WA cost based on conversations
      expect(result.whatsappCost).toBeCloseTo(8000 * UTILITY_PRICE, 2);
    });
  });

  // ─── Aggregate calculations ───
  describe("Aggregate calculations", () => {
    it("totalConversations sums correctly across use cases", () => {
      const configs = [
        { useCaseId: "faq_selfservice", enabled: true, fields: { supportTicketsPerMonth: 10000, automationRate: 40, costPerTicket: 8 } },
        { useCaseId: "order_shipping", enabled: true, fields: { ordersPerMonth: 5000, wismoCallRate: 15, callCenterCostPerCall: 5, deflectionRate: 65 } },
      ];

      const result = calcUtilityAggregate(configs, UTILITY_PRICE);

      // FAQ: 10000 * 0.4 = 4000 conversations
      // Order: 5000 * 2 = 10000 conversations
      expect(result.totalConversations).toBe(14000);
      // FAQ: 4000 * 3 = 12000 messages
      // Order: 5000 * 2 = 10000 messages
      expect(result.totalMessages).toBe(22000);
      // WA cost based on conversations
      expect(result.totalWhatsappCost).toBeCloseTo(14000 * UTILITY_PRICE, 2);
    });

    it("disabled use cases are excluded", () => {
      const configs = [
        { useCaseId: "faq_selfservice", enabled: true, fields: { supportTicketsPerMonth: 10000, automationRate: 40, costPerTicket: 8 } },
        { useCaseId: "order_shipping", enabled: false, fields: { ordersPerMonth: 5000, wismoCallRate: 15, callCenterCostPerCall: 5, deflectionRate: 65 } },
      ];

      const result = calcUtilityAggregate(configs, UTILITY_PRICE);
      expect(result.useCaseResults.length).toBe(1);
      expect(result.totalConversations).toBe(4000);
    });

    it("annual projection is 12× monthly net value", () => {
      const configs = [
        { useCaseId: "booking_confirmations", enabled: true, fields: { bookingsPerMonth: 4000, confirmationCallRate: 30, callCost: 4, deflectionRate: 70 } },
      ];

      const result = calcUtilityAggregate(configs, UTILITY_PRICE);
      expect(result.annualProjection).toBeCloseTo(result.totalNetValue * 12, 2);
    });
  });

  // ─── Edge cases ───
  describe("Edge cases", () => {
    it("all zero inputs produce zero results", () => {
      const result = calcUtilityUseCase("faq_selfservice", {
        supportTicketsPerMonth: 0,
        automationRate: 0,
        costPerTicket: 0,
      }, UTILITY_PRICE);

      expect(result.monthlySavings).toBe(0);
      expect(result.whatsappCost).toBe(0);
      expect(result.messagesPerMonth).toBe(0);
      expect(result.conversationsPerMonth).toBe(0);
      expect(result.roiMultiplier).toBe(0);
    });

    it("unknown use case throws error", () => {
      expect(() => calcUtilityUseCase("nonexistent", {}, UTILITY_PRICE)).toThrow("Unknown use case");
    });

    it("every industry has at least one use case mapped", () => {
      for (const [industry, useCases] of Object.entries(INDUSTRY_USE_CASE_MAP)) {
        expect(useCases.length).toBeGreaterThan(0);
        // Verify all mapped use case IDs exist
        for (const ucId of useCases) {
          const exists = UTILITY_USE_CASES.some((u) => u.id === ucId);
          expect(exists).toBe(true);
        }
      }
    });

    it("Lead Qualification has avgDealValue field defined", () => {
      const uc = UTILITY_USE_CASES.find((u) => u.id === "lead_qualification");
      const hasAvgDealValue = uc?.defaultFields.some((f) => f.key === "avgDealValue");
      expect(hasAvgDealValue).toBe(true);
    });
  });
});
