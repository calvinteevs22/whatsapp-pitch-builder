import { describe, it, expect } from "vitest";
import {
  TEMPLATE_CATALOG,
  ECOMMERCE_SUB_VERTICALS,
  REAL_ESTATE_SUB_VERTICALS,
  HEALTHCARE_SUB_VERTICALS,
} from "../shared/templateCatalog";

/* ─── Sub-Vertical Arrays ─── */
describe("Sub-Vertical Arrays", () => {
  it("E-Commerce sub-verticals should have at least 5 options", () => {
    expect(ECOMMERCE_SUB_VERTICALS.length).toBeGreaterThanOrEqual(5);
  });

  it("Real Estate sub-verticals should have at least 4 options", () => {
    expect(REAL_ESTATE_SUB_VERTICALS.length).toBeGreaterThanOrEqual(4);
  });

  it("Healthcare sub-verticals should have at least 5 options", () => {
    expect(HEALTHCARE_SUB_VERTICALS.length).toBeGreaterThanOrEqual(5);
  });

  it("Real Estate sub-verticals should include key property types", () => {
    const names = REAL_ESTATE_SUB_VERTICALS as unknown as string[];
    expect(names).toContain("Residential Sales");
    expect(names).toContain("Commercial Real Estate");
    expect(names).toContain("Luxury & Premium");
    expect(names).toContain("Rental & Leasing");
    expect(names).toContain("New Development / Off-Plan");
  });

  it("Healthcare sub-verticals should include key specialties", () => {
    const names = HEALTHCARE_SUB_VERTICALS as unknown as string[];
    expect(names).toContain("Dental Clinics");
    expect(names).toContain("Dermatology & Aesthetics");
    expect(names).toContain("Pediatrics & Family Medicine");
    expect(names).toContain("Cardiology");
    expect(names).toContain("Mental Health & Wellness");
    expect(names).toContain("Ophthalmology & Optometry");
    expect(names).toContain("OB/GYN & Women's Health");
    expect(names).toContain("Orthopedics & Sports Medicine");
  });

  it("All sub-vertical arrays should have unique values", () => {
    const ecomSet = new Set(ECOMMERCE_SUB_VERTICALS);
    expect(ecomSet.size).toBe(ECOMMERCE_SUB_VERTICALS.length);

    const reSet = new Set(REAL_ESTATE_SUB_VERTICALS);
    expect(reSet.size).toBe(REAL_ESTATE_SUB_VERTICALS.length);

    const hcSet = new Set(HEALTHCARE_SUB_VERTICALS);
    expect(hcSet.size).toBe(HEALTHCARE_SUB_VERTICALS.length);
  });

  it("Sub-vertical values should not be empty strings", () => {
    [...ECOMMERCE_SUB_VERTICALS, ...REAL_ESTATE_SUB_VERTICALS, ...HEALTHCARE_SUB_VERTICALS].forEach(sv => {
      expect(sv.trim().length).toBeGreaterThan(0);
    });
  });
});

/* ─── Template Quality Checks ─── */
describe("Template Quality", () => {
  it("all templates should have non-empty titles", () => {
    TEMPLATE_CATALOG.forEach(t => {
      expect(t.title.trim().length, `Template ${t.id} has empty title`).toBeGreaterThan(0);
    });
  });

  it("all templates should have non-empty descriptions", () => {
    TEMPLATE_CATALOG.forEach(t => {
      expect(t.description.trim().length, `Template ${t.id} has empty description`).toBeGreaterThan(0);
    });
  });

  it("all templates should have at least 1 tag", () => {
    TEMPLATE_CATALOG.forEach(t => {
      expect(t.tags.length, `Template ${t.id} has no tags`).toBeGreaterThanOrEqual(1);
    });
  });

  it("all templates should have at least 2 flow steps", () => {
    TEMPLATE_CATALOG.forEach(t => {
      expect(t.flowSteps.length, `Template ${t.id} has fewer than 2 flow steps`).toBeGreaterThanOrEqual(2);
    });
  });

  it("all template IDs should be unique", () => {
    const ids = TEMPLATE_CATALOG.map(t => t.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it("Real Estate templates should exist", () => {
    const reTemplates = TEMPLATE_CATALOG.filter(t => t.industry === "Real Estate");
    expect(reTemplates.length).toBeGreaterThanOrEqual(5);
  });

  it("Healthcare templates should exist", () => {
    const hcTemplates = TEMPLATE_CATALOG.filter(t => t.industry === "Healthcare");
    expect(hcTemplates.length).toBeGreaterThanOrEqual(5);
  });

  it("no template prompt should contain placeholder brackets like [Order ID]", () => {
    const bracketPattern = /\[(Order ID|Customer Name|Product Name|Company Name|Business Name|Amount|Date|Time|Phone|Email|Address|URL|Link)\]/i;
    const bad = TEMPLATE_CATALOG.filter(t => bracketPattern.test(t.prompt));
    expect(bad.map(t => `${t.id}: ${t.prompt.substring(0, 80)}`)).toEqual([]);
  });
});

/* ─── Industry Coverage ─── */
describe("Industry Coverage", () => {
  it("should have templates across all major industries", () => {
    const industries = new Set(TEMPLATE_CATALOG.map(t => t.industry));
    expect(industries.has("E-Commerce")).toBe(true);
    expect(industries.has("Healthcare")).toBe(true);
    expect(industries.has("Real Estate")).toBe(true);
    expect(industries.has("Finance & Banking")).toBe(true);
    expect(industries.has("Food & Beverage")).toBe(true);
    expect(industries.has("Travel & Hospitality")).toBe(true);
    expect(industries.has("Education")).toBe(true);
    expect(industries.has("Automotive")).toBe(true);
  });

  it("each industry should have at least 5 templates", () => {
    const byCounts: Record<string, number> = {};
    TEMPLATE_CATALOG.forEach(t => {
      byCounts[t.industry] = (byCounts[t.industry] || 0) + 1;
    });
    Object.entries(byCounts).forEach(([industry, count]) => {
      expect(count, `${industry} has only ${count} templates`).toBeGreaterThanOrEqual(5);
    });
  });
});
