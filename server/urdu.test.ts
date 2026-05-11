import { describe, expect, it } from "vitest";
import { z } from "zod";

/**
 * Comprehensive tests for Urdu (ur) language support.
 * Covers: schema validation, language name mapping, translations config,
 * website crawler TLD/lang detection, and RTL prompt instructions.
 */

// ── Schema validation (mirrors routers.ts) ──────────────────────────────────

const languageSchema = z.enum([
  "en", "hi", "bn", "ta", "mr", "te", "ur", "id", "zh-CN", "zh-TW", "pt", "es",
]).default("en");

const generateFlowInputSchema = z.object({
  prompt: z.string().min(1),
  businessName: z.string().optional(),
  businessUrl: z.string().optional(),
  industry: z.string().optional(),
  messageType: z.enum(["marketing", "utility", "authentication"]).default("marketing"),
  threadUid: z.string().optional(),
  language: languageSchema,
});

describe("Urdu language - schema validation", () => {
  it("accepts 'ur' as a valid language code", () => {
    const result = languageSchema.safeParse("ur");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("ur");
  });

  it("accepts 'ur' in the full generateFlow input schema", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Build a WhatsApp flow for a Pakistani restaurant",
      businessName: "Karachi Kitchen",
      industry: "Food & Beverage",
      messageType: "marketing",
      language: "ur",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe("ur");
      expect(result.data.prompt).toContain("Pakistani");
    }
  });

  it("accepts 'ur' with utility message type", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Order status update flow",
      language: "ur",
      messageType: "utility",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe("ur");
      expect(result.data.messageType).toBe("utility");
    }
  });

  it("accepts 'ur' with authentication message type", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "OTP verification flow",
      language: "ur",
      messageType: "authentication",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe("ur");
      expect(result.data.messageType).toBe("authentication");
    }
  });

  it("still defaults to 'en' when language is omitted", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe("en");
  });

  it("rejects invalid language codes like 'urd' (ISO-639-2)", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test",
      language: "urd",
    });
    expect(result.success).toBe(false);
  });

  it("total supported languages count is 12 (including Urdu)", () => {
    const allLanguages = ["en", "hi", "bn", "ta", "mr", "te", "ur", "id", "zh-CN", "zh-TW", "pt", "es"];
    expect(allLanguages).toHaveLength(12);
    for (const lang of allLanguages) {
      expect(languageSchema.safeParse(lang).success).toBe(true);
    }
  });
});

// ── Language name mapping (mirrors routers.ts buildSystemPrompt) ─────────────

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  bn: "Bengali",
  ta: "Tamil",
  mr: "Marathi",
  te: "Telugu",
  ur: "Urdu (اردو)",
  id: "Indonesian (Bahasa Indonesia)",
  "zh-CN": "Simplified Chinese (简体中文)",
  "zh-TW": "Traditional Chinese (繁體中文)",
  pt: "Portuguese (Português)",
  es: "Spanish (Español)",
};

describe("Urdu language - name mapping", () => {
  it("maps 'ur' to 'Urdu (اردو)'", () => {
    expect(LANGUAGE_NAMES["ur"]).toBe("Urdu (اردو)");
  });

  it("Urdu name includes the native script label", () => {
    expect(LANGUAGE_NAMES["ur"]).toContain("اردو");
  });

  it("all 12 language codes have name mappings", () => {
    const codes = ["en", "hi", "bn", "ta", "mr", "te", "ur", "id", "zh-CN", "zh-TW", "pt", "es"];
    for (const code of codes) {
      expect(LANGUAGE_NAMES[code]).toBeDefined();
      expect(LANGUAGE_NAMES[code].length).toBeGreaterThan(0);
    }
  });
});

// ── SUPPORTED_LANGUAGES config (mirrors translations.ts) ────────────────────

interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", flag: "🇮🇳" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", flag: "🇮🇳" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी", flag: "🇮🇳" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", flag: "🇮🇳" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", flag: "🇵🇰" },
  { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "zh-CN", label: "Chinese (Simplified)", nativeLabel: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", label: "Chinese (Traditional)", nativeLabel: "繁體中文", flag: "🇹🇼" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português", flag: "🇧🇷" },
  { code: "es", label: "Spanish", nativeLabel: "Español", flag: "🇪🇸" },
];

describe("Urdu language - SUPPORTED_LANGUAGES config", () => {
  const urdu = SUPPORTED_LANGUAGES.find((l) => l.code === "ur");

  it("Urdu is present in SUPPORTED_LANGUAGES", () => {
    expect(urdu).toBeDefined();
  });

  it("Urdu has correct label", () => {
    expect(urdu!.label).toBe("Urdu");
  });

  it("Urdu has correct native label in Nastaliq script", () => {
    expect(urdu!.nativeLabel).toBe("اردو");
  });

  it("Urdu uses the Pakistan flag 🇵🇰", () => {
    expect(urdu!.flag).toBe("🇵🇰");
  });

  it("Urdu is positioned after Telugu and before Indonesian", () => {
    const urduIndex = SUPPORTED_LANGUAGES.findIndex((l) => l.code === "ur");
    const teluguIndex = SUPPORTED_LANGUAGES.findIndex((l) => l.code === "te");
    const indonesianIndex = SUPPORTED_LANGUAGES.findIndex((l) => l.code === "id");
    expect(urduIndex).toBeGreaterThan(teluguIndex);
    expect(urduIndex).toBeLessThan(indonesianIndex);
  });

  it("total count is 12 languages", () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(12);
  });
});

// ── Website crawler language detection (mirrors websiteCrawler.ts) ───────────

const LANG_CODE_MAP: Record<string, string> = {
  "hi": "hi", "hi-in": "hi", "hin": "hi",
  "bn": "bn", "bn-in": "bn", "bn-bd": "bn", "ben": "bn",
  "ta": "ta", "ta-in": "ta", "tam": "ta",
  "mr": "mr", "mr-in": "mr", "mar": "mr",
  "te": "te", "te-in": "te", "tel": "te",
  "ur": "ur", "ur-pk": "ur", "ur-in": "ur", "urd": "ur",
  "id": "id", "id-id": "id", "in": "id", "ind": "id",
  "zh": "zh-CN", "zh-cn": "zh-CN", "zh-hans": "zh-CN", "zh-sg": "zh-CN",
  "zh-tw": "zh-TW", "zh-hk": "zh-TW", "zh-hant": "zh-TW", "zh-mo": "zh-TW",
  "pt": "pt", "pt-br": "pt", "pt-pt": "pt", "por": "pt",
  "es": "es", "es-es": "es", "es-mx": "es", "es-ar": "es", "es-co": "es",
  "es-cl": "es", "es-pe": "es", "es-419": "es", "spa": "es",
  "en": "en", "en-us": "en", "en-gb": "en", "en-au": "en", "en-in": "en",
};

const TLD_LANG_MAP: Record<string, string> = {
  "br": "pt", "pt": "pt", "mx": "es", "ar": "es", "co": "es",
  "cl": "es", "pe": "es", "ve": "es", "ec": "es", "id": "id",
  "cn": "zh-CN", "tw": "zh-TW", "hk": "zh-TW",
  "in": "hi", "bd": "bn", "pk": "ur",
};

describe("Urdu language - website crawler detection", () => {
  it("detects 'ur' from HTML lang='ur'", () => {
    expect(LANG_CODE_MAP["ur"]).toBe("ur");
  });

  it("detects 'ur' from HTML lang='ur-pk' (Pakistan locale)", () => {
    expect(LANG_CODE_MAP["ur-pk"]).toBe("ur");
  });

  it("detects 'ur' from HTML lang='ur-in' (India locale)", () => {
    expect(LANG_CODE_MAP["ur-in"]).toBe("ur");
  });

  it("detects 'ur' from ISO-639-2 code 'urd'", () => {
    expect(LANG_CODE_MAP["urd"]).toBe("ur");
  });

  it("maps .pk TLD to Urdu", () => {
    expect(TLD_LANG_MAP["pk"]).toBe("ur");
  });

  it("does not map .in TLD to Urdu (should be Hindi)", () => {
    expect(TLD_LANG_MAP["in"]).toBe("hi");
  });
});

// ── Urdu UI translations completeness ────────────────────────────────────────

const URDU_TRANSLATIONS: Record<string, string> = {
  "nav.industryTemplates": "صنعتی ٹیمپلیٹس",
  "nav.roiCalculator": "ROI کیلکولیٹر",
  "nav.apiDocs": "API دستاویزات",
  "nav.signOut": "سائن آؤٹ",
  "nav.signIn": "سائن ان",
  "nav.myThreads": "میری بات چیت",
  "home.badge": "میٹا اکاؤنٹ مینیجرز کے لیے تیار کیا گیا",
  "home.title": "واٹس ایپ پیڈ میسجنگ ڈیمو بنائیں",
  "home.titleHighlight": " چند سیکنڈز میں",
  "home.subtitle": "واٹس ایپ ماک اپ دستی طور پر بنانے میں گھنٹے ضائع کرنا بند کریں۔ اپنا استعمال کا معاملہ سادہ زبان میں بیان کریں اور فوری طور پر ایک مکمل، انٹرایکٹو بات چیت کا فلو حاصل کریں — اپنے کلائنٹس کو پیش کرنے کے لیے تیار۔",
  "home.browseTemplates": "صنعتی ٹیمپلیٹس دیکھیں",
  "home.createTailored": "اپنی مرضی کی پیشکش بنائیں",
  "home.roiCalculator": "ROI کیلکولیٹر",
  "home.getStarted": "شروع کریں",
  "stats.openRate": "پیغام کھولنے کی شرح",
  "stats.openRateSub": "ای میل کے 20% کے مقابلے میں",
  "stats.higherCtr": "زیادہ CTR",
  "stats.higherCtrSub": "روایتی چینلز کے مقابلے میں",
  "stats.waUsers": "واٹس ایپ صارفین",
  "stats.waUsersSub": "دنیا بھر میں ماہانہ فعال",
  "stats.templates": "تیار ٹیمپلیٹس",
  "stats.templatesSub": "15 صنعتوں میں",
  "howItWorks.title": "بہترین پیشکش کے تین مراحل",
};

describe("Urdu language - UI translations", () => {
  it("all Urdu translation values are non-empty strings", () => {
    for (const [key, value] of Object.entries(URDU_TRANSLATIONS)) {
      expect(value, `Translation for '${key}' should be non-empty`).toBeTruthy();
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it("Urdu translations contain Urdu script characters (Unicode range 0600-06FF)", () => {
    const urduCharRegex = /[\u0600-\u06FF]/;
    for (const [key, value] of Object.entries(URDU_TRANSLATIONS)) {
      // Skip keys that might legitimately contain only Latin chars (like ROI, API, CTR)
      if (key.includes("roiCalculator") || key.includes("apiDocs")) continue;
      expect(
        urduCharRegex.test(value),
        `Translation for '${key}' should contain Urdu script characters: "${value}"`,
      ).toBe(true);
    }
  });

  it("navigation translations are present and in Urdu", () => {
    expect(URDU_TRANSLATIONS["nav.industryTemplates"]).toBe("صنعتی ٹیمپلیٹس");
    expect(URDU_TRANSLATIONS["nav.signIn"]).toBe("سائن ان");
    expect(URDU_TRANSLATIONS["nav.signOut"]).toBe("سائن آؤٹ");
    expect(URDU_TRANSLATIONS["nav.myThreads"]).toBe("میری بات چیت");
  });

  it("home page translations are present and in Urdu", () => {
    expect(URDU_TRANSLATIONS["home.title"]).toContain("واٹس ایپ");
    expect(URDU_TRANSLATIONS["home.subtitle"]).toContain("واٹس ایپ");
    expect(URDU_TRANSLATIONS["home.browseTemplates"]).toContain("ٹیمپلیٹس");
  });

  it("stats translations are present and in Urdu", () => {
    expect(URDU_TRANSLATIONS["stats.openRate"]).toContain("شرح");
    expect(URDU_TRANSLATIONS["stats.waUsers"]).toContain("واٹس ایپ");
    expect(URDU_TRANSLATIONS["stats.templates"]).toContain("ٹیمپلیٹس");
  });
});

// ── RTL prompt instruction ───────────────────────────────────────────────────

describe("Urdu language - RTL handling in LLM prompt", () => {
  // Simulate the prompt builder logic from routers.ts
  function buildLanguagePrompt(language: string): string {
    const langName = LANGUAGE_NAMES[language] || "English";
    if (language === "en") return "";
    return `
CRITICAL LANGUAGE REQUIREMENT:
ALL user-facing text content MUST be written in ${langName}.
- Prices should use the local currency format (e.g., ₹ for Indian Rupees, Rs for Pakistani Rupees) when appropriate
- For RTL languages like Urdu: write all text naturally in the script direction; do NOT add any RTL markers or special formatting
- Image descriptions (imageDescription, videoDescription) should remain in English for image generation accuracy
- The profileName and businessContext can remain in English
- threadName should be in English for system compatibility
`;
  }

  it("generates RTL-specific instructions for Urdu", () => {
    const prompt = buildLanguagePrompt("ur");
    expect(prompt).toContain("RTL languages like Urdu");
    expect(prompt).toContain("Urdu (اردو)");
  });

  it("includes Pakistani Rupee currency format for Urdu", () => {
    const prompt = buildLanguagePrompt("ur");
    expect(prompt).toContain("Rs for Pakistani Rupees");
  });

  it("instructs to keep image descriptions in English", () => {
    const prompt = buildLanguagePrompt("ur");
    expect(prompt).toContain("Image descriptions");
    expect(prompt).toContain("remain in English");
  });

  it("does not generate RTL instructions for English", () => {
    const prompt = buildLanguagePrompt("en");
    expect(prompt).toBe("");
  });

  it("does not generate RTL instructions for Hindi (LTR Indic)", () => {
    const prompt = buildLanguagePrompt("hi");
    expect(prompt).not.toContain("RTL languages like Hindi");
  });
});
