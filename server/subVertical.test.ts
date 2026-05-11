import { describe, it, expect } from "vitest";
import {
  TEMPLATE_CATALOG,
  ECOMMERCE_SUB_VERTICALS,
} from "../shared/templateCatalog";
import { templateBusinessContext } from "../shared/templateBusinessContext";

describe("E-Commerce Sub-Vertical Configuration", () => {
  it("should have 8 sub-verticals for the dropdown", () => {
    expect(ECOMMERCE_SUB_VERTICALS).toHaveLength(8);
  });

  it("should include all expected sub-verticals", () => {
    expect(ECOMMERCE_SUB_VERTICALS).toContain("Fashion & Apparel");
    expect(ECOMMERCE_SUB_VERTICALS).toContain("Grocery & Food Delivery");
    expect(ECOMMERCE_SUB_VERTICALS).toContain("Electronics & Gadgets");
    expect(ECOMMERCE_SUB_VERTICALS).toContain("Beauty & Cosmetics");
    expect(ECOMMERCE_SUB_VERTICALS).toContain("Home & Furniture");
    expect(ECOMMERCE_SUB_VERTICALS).toContain("Health & Pharmacy");
    expect(ECOMMERCE_SUB_VERTICALS).toContain("Jewelry & Luxury");
    expect(ECOMMERCE_SUB_VERTICALS).toContain("Sports & Outdoors");
  });

  it("should not include 'General' as a sub-vertical (it is the default)", () => {
    expect(ECOMMERCE_SUB_VERTICALS).not.toContain("General");
  });

  it("all sub-vertical names should be non-empty strings", () => {
    for (const sv of ECOMMERCE_SUB_VERTICALS) {
      expect(typeof sv).toBe("string");
      expect(sv.length).toBeGreaterThan(0);
    }
  });
});

describe("E-Commerce Templates (General Only)", () => {
  const ecomTemplates = TEMPLATE_CATALOG.filter(t => t.industry === "E-Commerce");

  it("should have exactly 16 E-Commerce templates", () => {
    expect(ecomTemplates).toHaveLength(16);
  });

  it("E-Commerce templates should not have subVertical field", () => {
    for (const t of ecomTemplates) {
      expect(t.subVertical, `Template ${t.id} should not have subVertical`).toBeUndefined();
    }
  });

  it("all E-Commerce template IDs should be unique", () => {
    const ids = ecomTemplates.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("all E-Commerce templates should have business context", () => {
    for (const t of ecomTemplates) {
      const ctx = templateBusinessContext[t.id];
      expect(ctx, `${t.id} missing business context`).toBeDefined();
    }
  });

  it("all E-Commerce templates should have non-empty prompts", () => {
    for (const t of ecomTemplates) {
      expect(t.prompt.length, `${t.id} has empty prompt`).toBeGreaterThan(50);
    }
  });

  it("all E-Commerce templates should have 3-5 flow steps", () => {
    for (const t of ecomTemplates) {
      expect(t.flowSteps.length, `${t.id} has ${t.flowSteps.length} flow steps`).toBeGreaterThanOrEqual(3);
      expect(t.flowSteps.length, `${t.id} has ${t.flowSteps.length} flow steps`).toBeLessThanOrEqual(5);
    }
  });
});

describe("Sub-Vertical Dropdown Approach", () => {
  it("sub-verticals are designed for prompt injection, not separate templates", () => {
    // Verify no sub-vertical-specific templates exist in the catalog
    const subVerticalTemplates = TEMPLATE_CATALOG.filter(
      t => t.industry === "E-Commerce" && t.subVertical !== undefined
    );
    expect(subVerticalTemplates).toHaveLength(0);
  });

  it("no templates in the catalog should have ecom- prefix IDs from old sub-vertical templates", () => {
    const oldSubVerticalIds = TEMPLATE_CATALOG.filter(
      t => t.id.startsWith("ecom-fashion-") ||
           t.id.startsWith("ecom-grocery-") ||
           t.id.startsWith("ecom-electronics-") ||
           t.id.startsWith("ecom-beauty-") ||
           t.id.startsWith("ecom-home-") ||
           t.id.startsWith("ecom-health-") ||
           t.id.startsWith("ecom-jewelry-") ||
           t.id.startsWith("ecom-sports-")
    );
    expect(oldSubVerticalIds).toHaveLength(0);
  });
});

describe("Total Catalog Integrity", () => {
  it("total catalog should have 230 templates (no sub-vertical template bloat)", () => {
    expect(TEMPLATE_CATALOG.length).toBe(230);
  });

  it("all template IDs in the full catalog should be unique", () => {
    const ids = TEMPLATE_CATALOG.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("no templates should have subVertical field set", () => {
    for (const t of TEMPLATE_CATALOG) {
      expect(t.subVertical, `Template ${t.id} has subVertical`).toBeUndefined();
    }
  });
});
