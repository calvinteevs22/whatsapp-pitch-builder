import { describe, it, expect } from "vitest";
import {
  deriveBroadcast,
  deriveBroadcastBasic,
  projectBroadcastRevenue,
  deriveAdv,
  deriveBasic,
  type ChannelInputs,
  type DerivedMetrics,
  type BroadcastMetrics,
} from "../shared/roiData";

describe("Broadcast ROI Calculator", () => {
  // Standard test inputs
  const baseInputs: ChannelInputs = {
    messages: 50000,
    deliveryRate: 97,
    openRate: 95,
    ctr: 30,
    convRate: 7,
    costPerMsg: 0.04,
    optOutRate: 0.5,
  };
  const dealValue = 50;

  describe("deriveBroadcast", () => {
    it("should compute per-broadcast metrics identical to deriveAdv", () => {
      const adv = deriveAdv(baseInputs, dealValue);
      const bm = deriveBroadcast(baseInputs, dealValue, 1);

      // With 1 broadcast/month, per-broadcast = per-month
      expect(bm.perBroadcast.revenue).toBeCloseTo(adv.revenue, 2);
      expect(bm.perBroadcast.spend).toBeCloseTo(adv.spend, 2);
      expect(bm.perBroadcast.conversions).toBeCloseTo(adv.conversions, 2);
    });

    it("should multiply monthly metrics by broadcastsPerMonth", () => {
      const bm2 = deriveBroadcast(baseInputs, dealValue, 2);
      const bm1 = deriveBroadcast(baseInputs, dealValue, 1);

      expect(bm2.monthlyRevenue).toBeCloseTo(bm1.monthlyRevenue * 2, 2);
      expect(bm2.monthlySpend).toBeCloseTo(bm1.monthlySpend * 2, 2);
      expect(bm2.monthlyConversions).toBeCloseTo(bm1.monthlyConversions * 2, 2);
    });

    it("should correctly compute monthly profit", () => {
      const bm = deriveBroadcast(baseInputs, dealValue, 2);
      expect(bm.monthlyProfit).toBeCloseTo(bm.monthlyRevenue - bm.monthlySpend, 2);
    });

    it("should correctly compute monthly ROI", () => {
      const bm = deriveBroadcast(baseInputs, dealValue, 2);
      expect(bm.monthlyROI).toBeCloseTo(bm.monthlyRevenue / bm.monthlySpend, 2);
    });

    it("should compute break-even conversions correctly", () => {
      const bm = deriveBroadcast(baseInputs, dealValue, 2);
      // Break-even conversions = spend per broadcast / deal value
      const expectedBEConv = Math.ceil(bm.perBroadcast.spend / dealValue);
      expect(bm.beConversions).toBe(expectedBEConv);
    });

    it("should compute break-even percentage of broadcast volume", () => {
      const bm = deriveBroadcast(baseInputs, dealValue, 2);
      // bePctOfBroadcast should be between 0 and 100 for a profitable broadcast
      expect(bm.bePctOfBroadcast).toBeGreaterThan(0);
      expect(bm.bePctOfBroadcast).toBeLessThan(100); // Should be profitable
    });

    it("should store broadcastsPerMonth in the result", () => {
      const bm = deriveBroadcast(baseInputs, dealValue, 3);
      expect(bm.broadcastsPerMonth).toBe(3);
    });

    it("should handle 0 deal value gracefully", () => {
      const bm = deriveBroadcast(baseInputs, 0, 2);
      expect(bm.beConversions).toBe(0);
      expect(bm.beMessages).toBe(0);
      expect(bm.bePctOfBroadcast).toBe(0);
    });

    it("should handle high broadcast frequency (8/month)", () => {
      const bm = deriveBroadcast(baseInputs, dealValue, 8);
      const bm1 = deriveBroadcast(baseInputs, dealValue, 1);

      expect(bm.monthlySpend).toBeCloseTo(bm1.monthlySpend * 8, 2);
      expect(bm.monthlyRevenue).toBeCloseTo(bm1.monthlyRevenue * 8, 2);
      // Per-broadcast metrics should be the same regardless of frequency
      expect(bm.perBroadcast.revenue).toBeCloseTo(bm1.perBroadcast.revenue, 2);
    });
  });

  describe("deriveBroadcastBasic", () => {
    it("should compute broadcast metrics from basic mode inputs", () => {
      // Signature: (messagesPerBroadcast, convRate, costPerMsg, dealValue, region, broadcastsPerMonth)
      const bm = deriveBroadcastBasic(
        50000,    // messagesPerBroadcast
        7,        // convRate
        0.04,     // costPerMsg
        dealValue, // dealValue
        "Asia Pacific", // region
        2          // broadcastsPerMonth
      );

      expect(bm.broadcastsPerMonth).toBe(2);
      expect(bm.monthlySpend).toBeGreaterThan(0);
      expect(bm.monthlyRevenue).toBeGreaterThan(0);
      expect(bm.perBroadcast).toBeDefined();
    });

    it("should return monthly metrics that are broadcastsPerMonth × per-broadcast", () => {
      const bm = deriveBroadcastBasic(50000, 7, 0.04, dealValue, "Asia Pacific", 2);
      // monthlyRevenue = perBroadcast.revenue * broadcastsPerMonth
      expect(bm.monthlyRevenue).toBeCloseTo(bm.perBroadcast.revenue * bm.broadcastsPerMonth, 2);
      expect(bm.monthlySpend).toBeCloseTo(bm.perBroadcast.spend * bm.broadcastsPerMonth, 2);
    });
  });

  describe("projectBroadcastRevenue", () => {
    it("should return 12 months of data", () => {
      const adv = deriveAdv(baseInputs, dealValue);
      const proj = projectBroadcastRevenue(adv, 2, dealValue, 12);

      expect(proj.monthlyRevenue).toHaveLength(12);
      expect(proj.monthlySpend).toHaveLength(12);
      expect(proj.monthlyAudience).toHaveLength(12);
      // monthlyConversions is not returned by projectBroadcastRevenue
      expect(proj.cumulativeRevenue).toHaveLength(12);
    });

    it("should show declining revenue over time due to opt-out decay", () => {
      const adv = deriveAdv(baseInputs, dealValue);
      const proj = projectBroadcastRevenue(adv, 2, dealValue, 12);

      // Month 1 revenue should be higher than month 12
      expect(proj.monthlyRevenue[0]).toBeGreaterThan(proj.monthlyRevenue[11]);
    });

    it("should show declining audience over time", () => {
      const adv = deriveAdv(baseInputs, dealValue);
      const proj = projectBroadcastRevenue(adv, 2, dealValue, 12);

      // Audience should decrease each month
      for (let i = 1; i < 12; i++) {
        expect(proj.monthlyAudience[i]).toBeLessThan(proj.monthlyAudience[i - 1]);
      }
    });

    it("should decay faster with more broadcasts per month", () => {
      const adv = deriveAdv(baseInputs, dealValue);
      const proj1 = projectBroadcastRevenue(adv, 1, dealValue, 12);
      const proj4 = projectBroadcastRevenue(adv, 4, dealValue, 12);

      // After 12 months, 4 broadcasts/month should have smaller audience than 1/month
      expect(proj4.monthlyAudience[11]).toBeLessThan(proj1.monthlyAudience[11]);
    });

    it("should have higher monthly revenue with more broadcasts (initially)", () => {
      const adv = deriveAdv(baseInputs, dealValue);
      const proj1 = projectBroadcastRevenue(adv, 1, dealValue, 12);
      const proj2 = projectBroadcastRevenue(adv, 2, dealValue, 12);

      // Month 1 with 2 broadcasts should have ~2x revenue of 1 broadcast
      expect(proj2.monthlyRevenue[0]).toBeGreaterThan(proj1.monthlyRevenue[0] * 1.8);
    });

    it("should compute cumulative revenue correctly", () => {
      const adv = deriveAdv(baseInputs, dealValue);
      const proj = projectBroadcastRevenue(adv, 2, dealValue, 12);

      const expectedCumulative = proj.monthlyRevenue.reduce((a, b) => a + b, 0);
      // cumulativeRevenue is an array; last element should equal total
      expect(proj.cumulativeRevenue[11]).toBeCloseTo(expectedCumulative, 2);
    });

    it("should compute cumulative spend correctly", () => {
      const adv = deriveAdv(baseInputs, dealValue);
      const proj = projectBroadcastRevenue(adv, 2, dealValue, 12);

      const expectedCumulative = proj.monthlySpend.reduce((a, b) => a + b, 0);
      // cumulativeProfit = cumulativeRevenue - cumulativeSpend, so verify via profit
      const lastCumProfit = proj.cumulativeProfit[11];
      const lastCumRev = proj.cumulativeRevenue[11];
      const impliedCumSpend = lastCumRev - lastCumProfit;
      expect(impliedCumSpend).toBeCloseTo(expectedCumulative, 2);
    });

    it("should show very slow decay with minimal opt-out rate", () => {
      // Note: projectBroadcastRevenue uses `|| 0.5` fallback for optOutRate,
      // so 0 is treated as 0.5%. Use a very small non-zero value to test minimal decay.
      const lowDecayMetrics: DerivedMetrics = {
        messages: 50000,
        delivered: 48500,
        opened: 46075,
        clicked: 13822,
        conversions: 967,
        revenue: 48375,
        spend: 2000,
        roi: 24.19,
        cpConv: 2.07,
        rev1k: 967.5,
        deliveryRate: 97,
        openRate: 95,
        ctr: 30,
        convRate: 7,
        optOutRate: 0.01, // Very low opt-out
        costPerMsg: 0.04,
      };
      const proj = projectBroadcastRevenue(lowDecayMetrics, 1, dealValue, 12);

      // With very low opt-out, month 12 should still be close to month 1 (within 5%)
      const decayPct = (proj.monthlyRevenue[0] - proj.monthlyRevenue[11]) / proj.monthlyRevenue[0] * 100;
      expect(decayPct).toBeLessThan(5);
    });
  });

  describe("Break-even analysis", () => {
    it("should show break-even under 100% for a profitable broadcast", () => {
      const bm = deriveBroadcast(baseInputs, dealValue, 2);
      // With 50K messages at $0.04 = $2K spend, and decent conversion, should be profitable
      expect(bm.bePctOfBroadcast).toBeLessThan(100);
    });

    it("should show break-even over 100% for an unprofitable broadcast", () => {
      const expensiveInputs: ChannelInputs = {
        ...baseInputs,
        costPerMsg: 5.0, // Very expensive
        convRate: 0.01, // Very low conversion
      };
      const bm = deriveBroadcast(expensiveInputs, dealValue, 1);
      expect(bm.bePctOfBroadcast).toBeGreaterThan(100);
    });

    it("should have consistent break-even regardless of broadcast frequency", () => {
      const bm1 = deriveBroadcast(baseInputs, dealValue, 1);
      const bm4 = deriveBroadcast(baseInputs, dealValue, 4);

      // Break-even % of broadcast should be the same regardless of frequency
      expect(bm1.bePctOfBroadcast).toBeCloseTo(bm4.bePctOfBroadcast, 2);
    });
  });

  describe("Monthly aggregation consistency", () => {
    it("monthly spend should equal per-broadcast spend × broadcasts/month", () => {
      for (const bpm of [1, 2, 3, 4, 8]) {
        const bm = deriveBroadcast(baseInputs, dealValue, bpm);
        expect(bm.monthlySpend).toBeCloseTo(bm.perBroadcast.spend * bpm, 2);
      }
    });

    it("monthly conversions should equal per-broadcast conversions × broadcasts/month", () => {
      for (const bpm of [1, 2, 3, 4, 8]) {
        const bm = deriveBroadcast(baseInputs, dealValue, bpm);
        expect(bm.monthlyConversions).toBeCloseTo(bm.perBroadcast.conversions * bpm, 2);
      }
    });

    it("monthly profit should equal monthly revenue minus monthly spend", () => {
      for (const bpm of [1, 2, 3, 4, 8]) {
        const bm = deriveBroadcast(baseInputs, dealValue, bpm);
        expect(bm.monthlyProfit).toBeCloseTo(bm.monthlyRevenue - bm.monthlySpend, 2);
      }
    });
  });
});
