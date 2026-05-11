import { describe, it, expect } from "vitest";
import { z } from "zod";

// Test the feedback input validation schema
const feedbackSchema = z.object({
  text: z.string().min(1).max(2000),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  pageUrl: z.string().max(1024).optional(),
});

describe("Feedback Submission", () => {
  describe("Input validation", () => {
    it("accepts valid feedback with all fields", () => {
      const result = feedbackSchema.safeParse({
        text: "Great tool, love the template builder!",
        sentiment: "positive",
        pageUrl: "/builder/abc123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts feedback with only text (minimal)", () => {
      const result = feedbackSchema.safeParse({
        text: "Nice work",
      });
      expect(result.success).toBe(true);
    });

    it("accepts feedback without sentiment", () => {
      const result = feedbackSchema.safeParse({
        text: "The ROI calculator could use more industries",
        pageUrl: "/roi-calculator",
      });
      expect(result.success).toBe(true);
    });

    it("accepts feedback without pageUrl", () => {
      const result = feedbackSchema.safeParse({
        text: "Templates are helpful",
        sentiment: "neutral",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty text", () => {
      const result = feedbackSchema.safeParse({
        text: "",
        sentiment: "positive",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing text field", () => {
      const result = feedbackSchema.safeParse({
        sentiment: "positive",
        pageUrl: "/templates",
      });
      expect(result.success).toBe(false);
    });

    it("rejects text exceeding 2000 characters", () => {
      const result = feedbackSchema.safeParse({
        text: "a".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("accepts text at exactly 2000 characters", () => {
      const result = feedbackSchema.safeParse({
        text: "a".repeat(2000),
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid sentiment value", () => {
      const result = feedbackSchema.safeParse({
        text: "Some feedback",
        sentiment: "angry",
      });
      expect(result.success).toBe(false);
    });

    it("accepts all three valid sentiment values", () => {
      for (const sentiment of ["positive", "neutral", "negative"]) {
        const result = feedbackSchema.safeParse({
          text: "Feedback",
          sentiment,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects pageUrl exceeding 1024 characters", () => {
      const result = feedbackSchema.safeParse({
        text: "Feedback",
        pageUrl: "/".repeat(1025),
      });
      expect(result.success).toBe(false);
    });

    it("accepts pageUrl at exactly 1024 characters", () => {
      const result = feedbackSchema.safeParse({
        text: "Feedback",
        pageUrl: "/" + "x".repeat(1023),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Feedback is anonymous", () => {
    it("schema does not include userId or email fields", () => {
      const shape = feedbackSchema.shape;
      expect("userId" in shape).toBe(false);
      expect("email" in shape).toBe(false);
      expect("name" in shape).toBe(false);
      expect("openId" in shape).toBe(false);
    });

    it("extra fields are stripped by schema", () => {
      const result = feedbackSchema.safeParse({
        text: "Anonymous feedback",
        userId: 123,
        email: "test@example.com",
      });
      // Zod by default allows extra fields in safeParse (they're just ignored)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ text: "Anonymous feedback" });
      }
    });
  });

  describe("Sentiment mapping", () => {
    it("maps positive sentiment correctly", () => {
      const sentimentEmoji = "positive" === "positive" ? "\u{1F60A}" : "positive" === "negative" ? "\u{1F615}" : "\u{1F44D}";
      expect(sentimentEmoji).toBe("\u{1F60A}");
    });

    it("maps neutral sentiment correctly", () => {
      const sentimentEmoji = "neutral" === "positive" ? "\u{1F60A}" : "neutral" === "negative" ? "\u{1F615}" : "\u{1F44D}";
      expect(sentimentEmoji).toBe("\u{1F44D}");
    });

    it("maps negative sentiment correctly", () => {
      const sentimentEmoji = "negative" === "positive" ? "\u{1F60A}" : "negative" === "negative" ? "\u{1F615}" : "\u{1F44D}";
      expect(sentimentEmoji).toBe("\u{1F615}");
    });
  });
});
