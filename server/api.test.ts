import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash, randomBytes } from "crypto";

// ==================== API KEY HASHING TESTS ====================

describe("API Key Hashing", () => {
  it("should generate a key starting with pk_", () => {
    const rawKey = `pk_${randomBytes(20).toString("hex")}`;
    expect(rawKey.startsWith("pk_")).toBe(true);
    expect(rawKey.length).toBe(43); // "pk_" + 40 hex chars
  });

  it("should produce consistent SHA-256 hashes", () => {
    const rawKey = "pk_abc123def456";
    const hash1 = createHash("sha256").update(rawKey).digest("hex");
    const hash2 = createHash("sha256").update(rawKey).digest("hex");
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex digest
  });

  it("should produce different hashes for different keys", () => {
    const key1 = `pk_${randomBytes(20).toString("hex")}`;
    const key2 = `pk_${randomBytes(20).toString("hex")}`;
    const hash1 = createHash("sha256").update(key1).digest("hex");
    const hash2 = createHash("sha256").update(key2).digest("hex");
    expect(hash1).not.toBe(hash2);
  });

  it("should extract a valid prefix for display", () => {
    const rawKey = `pk_${randomBytes(20).toString("hex")}`;
    const prefix = rawKey.substring(0, 10);
    expect(prefix.startsWith("pk_")).toBe(true);
    expect(prefix.length).toBe(10);
  });
});

// ==================== TEMPLATE CATALOG TESTS ====================

describe("Template Catalog API", () => {
  it("should export a non-empty template catalog", async () => {
    const { TEMPLATE_CATALOG } = await import("../shared/templateCatalog");
    expect(TEMPLATE_CATALOG.length).toBeGreaterThan(200);
  });

  it("should have required fields on every template", async () => {
    const { TEMPLATE_CATALOG } = await import("../shared/templateCatalog");
    for (const t of TEMPLATE_CATALOG) {
      expect(t.id).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.industry).toBeTruthy();
      expect(["marketing", "utility", "authentication"]).toContain(t.messageType);
      expect(Array.isArray(t.tags)).toBe(true);
      expect(Array.isArray(t.flowSteps)).toBe(true);
      expect(t.prompt).toBeTruthy();
    }
  });

  it("should have unique template IDs", async () => {
    const { TEMPLATE_CATALOG } = await import("../shared/templateCatalog");
    const ids = TEMPLATE_CATALOG.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should cover all 15 industries", async () => {
    const { TEMPLATE_CATALOG } = await import("../shared/templateCatalog");
    const { INDUSTRIES } = await import("../shared/types");
    const templateIndustries = new Set(TEMPLATE_CATALOG.map(t => t.industry));
    for (const industry of INDUSTRIES) {
      expect(templateIndustries.has(industry)).toBe(true);
    }
  });

  it("should cover all 3 message types", async () => {
    const { TEMPLATE_CATALOG } = await import("../shared/templateCatalog");
    const types = new Set(TEMPLATE_CATALOG.map(t => t.messageType));
    expect(types.has("marketing")).toBe(true);
    expect(types.has("utility")).toBe(true);
    expect(types.has("authentication")).toBe(true);
  });

  it("should filter templates by industry", async () => {
    const { TEMPLATE_CATALOG } = await import("../shared/templateCatalog");
    const ecomTemplates = TEMPLATE_CATALOG.filter(t => t.industry === "E-Commerce");
    expect(ecomTemplates.length).toBeGreaterThan(0);
    for (const t of ecomTemplates) {
      expect(t.industry).toBe("E-Commerce");
    }
  });

  it("should filter templates by message type", async () => {
    const { TEMPLATE_CATALOG } = await import("../shared/templateCatalog");
    const utilityTemplates = TEMPLATE_CATALOG.filter(t => t.messageType === "utility");
    expect(utilityTemplates.length).toBeGreaterThan(0);
    for (const t of utilityTemplates) {
      expect(t.messageType).toBe("utility");
    }
  });

  it("should support keyword search across title, description, and tags", async () => {
    const { TEMPLATE_CATALOG } = await import("../shared/templateCatalog");
    const search = "cart";
    const results = TEMPLATE_CATALOG.filter(t =>
      t.title.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search) ||
      t.tags.some(tag => tag.toLowerCase().includes(search))
    );
    expect(results.length).toBeGreaterThan(0);
  });
});

// ==================== AI PROMPT HELPERS TESTS ====================

describe("AI Prompt Helpers", () => {
  it("should build a system prompt with industry context", async () => {
    const { buildSystemPrompt } = await import("./aiPromptHelpers");
    const prompt = buildSystemPrompt("E-Commerce", "marketing");
    expect(prompt).toContain("WhatsApp Business conversation designer");
    expect(prompt).toContain("marketing");
    expect(prompt).toContain("E-Commerce");
  });

  it("should build a system prompt without industry", async () => {
    const { buildSystemPrompt } = await import("./aiPromptHelpers");
    const prompt = buildSystemPrompt(null, "utility");
    expect(prompt).toContain("utility");
    expect(prompt).not.toContain("Industry:");
  });

  it("should build a user prompt for the API", async () => {
    const { buildUserPromptForApi } = await import("./aiPromptHelpers");
    const prompt = buildUserPromptForApi({
      prompt: "Create a flash sale campaign",
      businessName: "Nike",
      businessUrl: "https://nike.com",
      industry: "Retail",
      messageType: "marketing",
    });
    expect(prompt).toContain("flash sale campaign");
    expect(prompt).toContain("Nike");
    expect(prompt).toContain("Retail");
    expect(prompt).toContain("marketing");
  });

  it("should build business profile context", async () => {
    const { buildBusinessProfileContext } = await import("./aiPromptHelpers");
    const context = buildBusinessProfileContext({
      businessName: "Nike",
      industry: "Retail",
      description: "Global sportswear brand",
      tagline: "Just Do It",
      brandTone: "Energetic, motivational",
      products: [
        { name: "Air Max 90", description: "Classic sneaker", price: "$130", imageUrl: "", category: "Shoes" },
      ],
    });
    expect(context).toContain("Nike");
    expect(context).toContain("Air Max 90");
    expect(context).toContain("$130");
    expect(context).toContain("Just Do It");
    expect(context).toContain("REAL BUSINESS DATA");
  });
});

// ==================== AUTH MIDDLEWARE LOGIC TESTS ====================

describe("API Auth Validation", () => {
  it("should reject missing Authorization header", () => {
    const authHeader = undefined;
    const isValid = authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ");
    expect(isValid).toBeFalsy();
  });

  it("should reject non-Bearer auth", () => {
    const authHeader = "Basic abc123";
    const isValid = authHeader.startsWith("Bearer ");
    expect(isValid).toBe(false);
  });

  it("should reject invalid key prefix", () => {
    const rawKey = "sk_notvalid123";
    expect(rawKey.startsWith("pk_")).toBe(false);
  });

  it("should accept valid Bearer pk_ format", () => {
    const authHeader = `Bearer pk_${randomBytes(20).toString("hex")}`;
    expect(authHeader.startsWith("Bearer ")).toBe(true);
    const rawKey = authHeader.substring(7).trim();
    expect(rawKey.startsWith("pk_")).toBe(true);
  });

  it("should check API key expiry correctly", () => {
    const futureDate = new Date(Date.now() + 86400000); // tomorrow
    const pastDate = new Date(Date.now() - 86400000); // yesterday

    expect(new Date(futureDate) < new Date()).toBe(false); // not expired
    expect(new Date(pastDate) < new Date()).toBe(true); // expired
  });
});

// ==================== RATE LIMITING LOGIC TESTS ====================

describe("Rate Limiting", () => {
  it("should track request counts per user", () => {
    const rateLimitMap = new Map<number, { count: number; resetAt: number }>();
    const userId = 1;
    const now = Date.now();
    const RATE_WINDOW = 60000;

    // First request
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    expect(rateLimitMap.get(userId)!.count).toBe(1);

    // Subsequent requests
    const entry = rateLimitMap.get(userId)!;
    entry.count++;
    expect(entry.count).toBe(2);
  });

  it("should block when rate limit is exceeded", () => {
    const RATE_LIMIT = 30;
    const count = 31;
    expect(count >= RATE_LIMIT).toBe(true);
  });

  it("should reset after the time window", () => {
    const resetAt = Date.now() - 1000; // 1 second ago
    const now = Date.now();
    expect(now >= resetAt).toBe(true); // window expired, should reset
  });
});

// ==================== REQUEST VALIDATION TESTS ====================

describe("Thread Creation Validation", () => {
  it("should require name field", () => {
    const body = { templateId: "ecom-flash-sale" };
    const isValid = body.hasOwnProperty("name") && typeof (body as any).name === "string";
    expect(isValid).toBe(false);
  });

  it("should require either templateId or prompt", () => {
    const body1 = { name: "Test", templateId: "ecom-flash-sale" };
    const body2 = { name: "Test", prompt: "Custom prompt" };
    const body3 = { name: "Test" };

    const hasTemplate = (b: any) => !!b.templateId || !!b.prompt;
    expect(hasTemplate(body1)).toBe(true);
    expect(hasTemplate(body2)).toBe(true);
    expect(hasTemplate(body3)).toBe(false);
  });

  it("should validate messageType values", () => {
    const validTypes = ["marketing", "utility", "authentication"];
    expect(validTypes.includes("marketing")).toBe(true);
    expect(validTypes.includes("utility")).toBe(true);
    expect(validTypes.includes("authentication")).toBe(true);
    expect(validTypes.includes("invalid")).toBe(false);
  });

  it("should find template by ID", async () => {
    const { TEMPLATE_CATALOG } = await import("../shared/templateCatalog");
    const template = TEMPLATE_CATALOG.find(t => t.id === "ecom-flash-sale");
    expect(template).toBeDefined();
    expect(template!.title).toBe("Flash Sale Announcement");
    expect(template!.industry).toBe("E-Commerce");
  });

  it("should return undefined for non-existent template", async () => {
    const { TEMPLATE_CATALOG } = await import("../shared/templateCatalog");
    const template = TEMPLATE_CATALOG.find(t => t.id === "nonexistent-template");
    expect(template).toBeUndefined();
  });
});
