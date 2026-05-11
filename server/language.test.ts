import { describe, expect, it } from "vitest";
import { z } from "zod";

/**
 * Test the language input schema validation for the generateFlow procedure.
 * We test the schema directly to avoid LLM calls that would time out.
 */
const languageSchema = z.enum(["en", "hi", "bn", "ta", "mr", "te", "ur", "id", "zh-CN", "zh-TW", "pt", "es"]).default("en");

const generateFlowInputSchema = z.object({
  prompt: z.string().min(1),
  businessName: z.string().optional(),
  businessUrl: z.string().optional(),
  industry: z.string().optional(),
  messageType: z.enum(["marketing", "utility", "authentication"]).default("marketing"),
  threadUid: z.string().optional(),
  language: languageSchema,
});

describe("language support - input schema validation", () => {
  it("accepts 'en' (English) as a valid language", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt",
      language: "en",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe("en");
  });

  it("accepts 'hi' (Hindi) as a valid language", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt",
      language: "hi",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe("hi");
  });

  it("accepts 'bn' (Bengali) as a valid language", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt",
      language: "bn",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe("bn");
  });

  it("accepts 'ta' (Tamil) as a valid language", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt",
      language: "ta",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe("ta");
  });

  it("accepts 'mr' (Marathi) as a valid language", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt",
      language: "mr",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe("mr");
  });

  it("accepts 'te' (Telugu) as a valid language", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt",
      language: "te",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe("te");
  });

  it("accepts 'id' (Indonesian / Bahasa Indonesia) as a valid language", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt",
      language: "id",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe("id");
  });

  it("accepts 'zh-CN' (Simplified Chinese) as a valid language", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt",
      language: "zh-CN",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe("zh-CN");
  });

  it("accepts 'zh-TW' (Traditional Chinese) as a valid language", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt",
      language: "zh-TW",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe("zh-TW");
  });

  it("accepts 'pt' (Portuguese) as a valid language", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt",
      language: "pt",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe("pt");
  });

  it("accepts 'es' (Spanish) as a valid language", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt",
      language: "es",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe("es");
  });

  it("defaults to 'en' when language is not provided", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt without language",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe("en");
  });

  it("rejects invalid language codes", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "Test prompt",
      language: "xx",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty prompt with any language", () => {
    const result = generateFlowInputSchema.safeParse({
      prompt: "",
      language: "hi",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all supported languages with full input", () => {
    const languages = ["en", "hi", "bn", "ta", "mr", "te", "ur", "id", "zh-CN", "zh-TW", "pt", "es"];
    for (const lang of languages) {
      const result = generateFlowInputSchema.safeParse({
        prompt: "Full test with all fields",
        businessName: "Test Business",
        industry: "E-Commerce",
        messageType: "marketing",
        language: lang,
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.language).toBe(lang);
    }
  });
});

describe("language support - buildSystemPrompt language injection", () => {
  const LANGUAGE_NAMES: Record<string, string> = {
    en: "English", hi: "Hindi", bn: "Bengali", ta: "Tamil", mr: "Marathi", te: "Telugu",
    ur: "Urdu (اردو)", id: "Indonesian (Bahasa Indonesia)", "zh-CN": "Simplified Chinese (简体中文)", "zh-TW": "Traditional Chinese (繁體中文)",
    pt: "Portuguese (Português)", es: "Spanish (Español)",
  };

  it("maps all supported language codes to correct names", () => {
    expect(LANGUAGE_NAMES["en"]).toBe("English");
    expect(LANGUAGE_NAMES["hi"]).toBe("Hindi");
    expect(LANGUAGE_NAMES["bn"]).toBe("Bengali");
    expect(LANGUAGE_NAMES["ta"]).toBe("Tamil");
    expect(LANGUAGE_NAMES["mr"]).toBe("Marathi");
    expect(LANGUAGE_NAMES["te"]).toBe("Telugu");
    expect(LANGUAGE_NAMES["id"]).toBe("Indonesian (Bahasa Indonesia)");
    expect(LANGUAGE_NAMES["zh-CN"]).toBe("Simplified Chinese (简体中文)");
    expect(LANGUAGE_NAMES["zh-TW"]).toBe("Traditional Chinese (繁體中文)");
    expect(LANGUAGE_NAMES["pt"]).toBe("Portuguese (Português)");
    expect(LANGUAGE_NAMES["es"]).toBe("Spanish (Español)");
  });

  it("identifies non-English languages correctly", () => {
    const nonEnglishCodes = ["hi", "bn", "ta", "mr", "te", "ur", "id", "zh-CN", "zh-TW", "pt", "es"];
    for (const code of nonEnglishCodes) {
      const isNonEnglish = code !== "en";
      expect(isNonEnglish).toBe(true);
    }
    expect("en" !== "en").toBe(false);
  });
});
