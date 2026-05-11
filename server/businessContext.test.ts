import { describe, it, expect } from "vitest";
import { templateBusinessContext } from "../shared/templateBusinessContext";
import { TEMPLATE_CATALOG } from "../shared/templateCatalog";

describe("Business Context Data", () => {
  it("should have business context for all 230 templates", () => {
    const contextIds = Object.keys(templateBusinessContext);
    expect(contextIds.length).toBe(230);
  });

  it("should have business context for every template in the catalog", () => {
    const missingContext: string[] = [];
    for (const template of TEMPLATE_CATALOG) {
      if (!templateBusinessContext[template.id]) {
        missingContext.push(template.id);
      }
    }
    expect(missingContext).toEqual([]);
  });

  it("should have all required fields for each business context entry", () => {
    const requiredFields = ["objective", "targetAudience", "messagingStrategy", "kpis"];
    const issues: string[] = [];

    for (const [id, ctx] of Object.entries(templateBusinessContext)) {
      for (const field of requiredFields) {
        if (!(field in ctx)) {
          issues.push(`${id}: missing ${field}`);
        }
      }
    }

    expect(issues).toEqual([]);
  });

  it("should have non-empty strings for text fields", () => {
    const issues: string[] = [];

    for (const [id, ctx] of Object.entries(templateBusinessContext)) {
      if (!ctx.objective || ctx.objective.trim().length === 0) {
        issues.push(`${id}: empty objective`);
      }
      if (!ctx.targetAudience || ctx.targetAudience.trim().length === 0) {
        issues.push(`${id}: empty targetAudience`);
      }
      if (!ctx.messagingStrategy || ctx.messagingStrategy.trim().length === 0) {
        issues.push(`${id}: empty messagingStrategy`);
      }
    }

    expect(issues).toEqual([]);
  });

  it("should have at least 2 KPIs for each template", () => {
    const issues: string[] = [];

    for (const [id, ctx] of Object.entries(templateBusinessContext)) {
      if (!Array.isArray(ctx.kpis) || ctx.kpis.length < 2) {
        issues.push(`${id}: has ${ctx.kpis?.length ?? 0} KPIs (need at least 2)`);
      }
    }

    expect(issues).toEqual([]);
  });

  it("should have KPIs as non-empty strings", () => {
    const issues: string[] = [];

    for (const [id, ctx] of Object.entries(templateBusinessContext)) {
      if (Array.isArray(ctx.kpis)) {
        ctx.kpis.forEach((kpi, i) => {
          if (!kpi || kpi.trim().length === 0) {
            issues.push(`${id}: KPI[${i}] is empty`);
          }
        });
      }
    }

    expect(issues).toEqual([]);
  });

  it("should not have any template IDs in context that are not in the catalog", () => {
    const catalogIds = new Set(TEMPLATE_CATALOG.map(t => t.id));
    const orphanedIds: string[] = [];

    for (const id of Object.keys(templateBusinessContext)) {
      if (!catalogIds.has(id)) {
        orphanedIds.push(id);
      }
    }

    expect(orphanedIds).toEqual([]);
  });

  it("should have objectives that mention business outcomes", () => {
    // Spot-check that objectives are business-focused, not generic
    const businessKeywords = [
      "revenue", "sales", "retention", "conversion", "engagement",
      "reduce", "increase", "improve", "drive", "boost", "grow",
      "acquire", "cost", "satisfaction", "loyalty", "adoption",
      "compliance", "security", "efficiency", "streamline", "prevent",
      "expedite", "maximize", "minimize", "enhance", "build", "ensure",
      "generate", "recover", "promote", "encourage", "establish",
      "protect", "verify", "authenticate", "confirm", "validate",
      "educate", "inform", "notify", "remind", "alert"
    ];

    let contextWithBusinessFocus = 0;
    for (const ctx of Object.values(templateBusinessContext)) {
      const objLower = ctx.objective.toLowerCase();
      if (businessKeywords.some(kw => objLower.includes(kw))) {
        contextWithBusinessFocus++;
      }
    }

    // At least 95% should have business-focused objectives
    expect(contextWithBusinessFocus / 230).toBeGreaterThan(0.95);
  });
});
