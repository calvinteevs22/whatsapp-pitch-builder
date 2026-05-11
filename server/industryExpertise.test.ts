import { describe, it, expect } from "vitest";
import { buildIndustryExpertise, getSupportedIndustries } from "./industryExpertise";
import { getIndustryPrompts, INDUSTRY_PROMPTS } from "../shared/industryPrompts";

const ALL_INDUSTRIES = [
  "E-Commerce", "Healthcare", "Food & Beverage", "Finance & Banking",
  "Travel & Hospitality", "Education", "Real Estate", "Automotive",
  "Retail", "Technology", "Beauty & Wellness", "Entertainment",
  "Logistics", "Insurance", "Telecommunications",
];

const ALL_MESSAGE_TYPES = ["marketing", "utility", "authentication"];

describe("Industry Prompts", () => {
  it("should have prompts for all 15 industries", () => {
    for (const industry of ALL_INDUSTRIES) {
      expect(INDUSTRY_PROMPTS[industry]).toBeDefined();
    }
  });

  it("should have prompts for all 3 message types per industry", () => {
    for (const industry of ALL_INDUSTRIES) {
      for (const type of ALL_MESSAGE_TYPES) {
        const prompts = getIndustryPrompts(type, industry);
        expect(prompts.length).toBe(4);
      }
    }
  });

  it("should return exactly 4 prompts per combination (180 total)", () => {
    let total = 0;
    for (const industry of ALL_INDUSTRIES) {
      for (const type of ALL_MESSAGE_TYPES) {
        const prompts = getIndustryPrompts(type, industry);
        expect(prompts).toHaveLength(4);
        total += prompts.length;
      }
    }
    expect(total).toBe(180);
  });

  it("should return unique prompts per industry (no duplicates within same industry)", () => {
    for (const industry of ALL_INDUSTRIES) {
      const allPrompts: string[] = [];
      for (const type of ALL_MESSAGE_TYPES) {
        allPrompts.push(...getIndustryPrompts(type, industry));
      }
      const unique = new Set(allPrompts);
      expect(unique.size).toBe(allPrompts.length);
    }
  });

  it("should have industry-relevant keywords in marketing prompts", () => {
    // Spot-check: E-Commerce marketing should mention shopping-related terms
    const ecomPrompts = getIndustryPrompts("marketing", "E-Commerce");
    const ecomText = ecomPrompts.join(" ").toLowerCase();
    expect(
      ecomText.includes("cart") || ecomText.includes("sale") ||
      ecomText.includes("discount") || ecomText.includes("product") ||
      ecomText.includes("shop")
    ).toBe(true);

    // Healthcare marketing should mention health-related terms
    const healthPrompts = getIndustryPrompts("marketing", "Healthcare");
    const healthText = healthPrompts.join(" ").toLowerCase();
    expect(
      healthText.includes("health") || healthText.includes("checkup") ||
      healthText.includes("doctor") || healthText.includes("vaccination") ||
      healthText.includes("telemedicine")
    ).toBe(true);

    // Automotive marketing should mention car-related terms
    const autoPrompts = getIndustryPrompts("marketing", "Automotive");
    const autoText = autoPrompts.join(" ").toLowerCase();
    expect(
      autoText.includes("model") || autoText.includes("test drive") ||
      autoText.includes("service") || autoText.includes("vehicle")
    ).toBe(true);
  });

  it("should have utility prompts focused on transactional flows", () => {
    for (const industry of ALL_INDUSTRIES) {
      const prompts = getIndustryPrompts("utility", industry);
      const text = prompts.join(" ").toLowerCase();
      // Utility prompts should contain action-oriented words
      expect(
        text.includes("confirmation") || text.includes("reminder") ||
        text.includes("tracking") || text.includes("update") ||
        text.includes("notification") || text.includes("receipt") ||
        text.includes("status") || text.includes("delivery") ||
        text.includes("schedule") || text.includes("alert")
      ).toBe(true);
    }
  });

  it("should have authentication prompts focused on security", () => {
    for (const industry of ALL_INDUSTRIES) {
      const prompts = getIndustryPrompts("authentication", industry);
      const text = prompts.join(" ").toLowerCase();
      expect(
        text.includes("verification") || text.includes("otp") ||
        text.includes("confirm") || text.includes("secure") ||
        text.includes("identity") || text.includes("authorization") ||
        text.includes("login") || text.includes("authenticate")
      ).toBe(true);
    }
  });

  it("should fall back gracefully for unknown industries", () => {
    const prompts = getIndustryPrompts("marketing", "Unknown Industry XYZ");
    expect(prompts).toHaveLength(4);
    // Should return generic fallback prompts
    expect(prompts[0]).toBeTruthy();
  });

  it("should fall back gracefully for unknown message types", () => {
    const prompts = getIndustryPrompts("unknown_type", "E-Commerce");
    expect(prompts).toHaveLength(4);
  });

  it("should do partial matching for industry names", () => {
    // "Telecom" should match "Telecommunications"
    const prompts = getIndustryPrompts("marketing", "Telecom");
    expect(prompts).toHaveLength(4);
    const text = prompts.join(" ").toLowerCase();
    expect(
      text.includes("plan") || text.includes("device") ||
      text.includes("5g") || text.includes("data")
    ).toBe(true);
  });
});

describe("Industry Expertise", () => {
  it("should have expertise for all 15 industries", () => {
    const supported = getSupportedIndustries();
    expect(supported.length).toBe(15);
    for (const industry of ALL_INDUSTRIES) {
      expect(supported).toContain(industry);
    }
  });

  it("should build non-empty expertise text for all industries", () => {
    for (const industry of ALL_INDUSTRIES) {
      const expertise = buildIndustryExpertise(industry);
      expect(expertise.length).toBeGreaterThan(200);
    }
  });

  it("should include best practices in expertise text", () => {
    const expertise = buildIndustryExpertise("E-Commerce");
    expect(expertise).toContain("Best Practices");
    expect(expertise).toContain("urgency");
  });

  it("should include tone guide in expertise text", () => {
    const expertise = buildIndustryExpertise("Healthcare");
    expect(expertise).toContain("Tone & Style");
    expect(expertise).toContain("empathetic");
  });

  it("should include flow patterns in expertise text", () => {
    const expertise = buildIndustryExpertise("Automotive");
    expect(expertise).toContain("Proven Flow Patterns");
    expect(expertise).toContain("test drive");
  });

  it("should include terminology in expertise text", () => {
    const expertise = buildIndustryExpertise("Finance & Banking");
    expect(expertise).toContain("Industry Terminology");
    expect(expertise).toContain("EMI");
  });

  it("should include product types in expertise text", () => {
    const expertise = buildIndustryExpertise("Travel & Hospitality");
    expect(expertise).toContain("Product/Service Types");
    expect(expertise).toContain("Hotel Rooms");
  });

  it("should return empty string for unknown industries", () => {
    const expertise = buildIndustryExpertise("Unknown Industry");
    expect(expertise).toBe("");
  });

  it("should have industry name in uppercase header", () => {
    for (const industry of ALL_INDUSTRIES) {
      const expertise = buildIndustryExpertise(industry);
      expect(expertise).toContain(industry.toUpperCase());
    }
  });

  it("should have at least 5 best practices per industry", () => {
    for (const industry of ALL_INDUSTRIES) {
      const expertise = buildIndustryExpertise(industry);
      // Count numbered best practices (1. 2. 3. etc.)
      const matches = expertise.match(/^\d+\./gm);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("should have at least 3 flow patterns per industry", () => {
    for (const industry of ALL_INDUSTRIES) {
      const expertise = buildIndustryExpertise(industry);
      const matches = expertise.match(/Pattern \d+:/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    }
  });
});
