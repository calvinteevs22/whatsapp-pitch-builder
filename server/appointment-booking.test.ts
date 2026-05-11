import { describe, it, expect } from "vitest";
import { TEMPLATE_CATALOG } from "../shared/templateCatalog";

/**
 * Tests to verify that all appointment/booking templates follow the required flow:
 * 1. Include an interactive_list for date/time selection in their prompt
 * 2. Include "Date/Time Selection" in their flowSteps
 * 3. End with a "Thank You" step
 * 4. Include booking confirmation step
 */

// Templates that involve appointment/booking/scheduling
const BOOKING_TEMPLATE_IDS = [
  // E-Commerce
  "ecom-return-exchange",
  // Healthcare
  "health-screening",
  "health-vaccination",
  "health-appointment",
  "health-lab-results",
  "health-telemedicine",
  // Food & Beverage
  "food-new-menu",
  "food-reservation",
  // Travel & Hospitality
  "travel-package-deal",
  "travel-early-bird",
  "travel-booking-confirm",
  // Education
  "edu-open-day",
  // Real Estate
  "realestate-new-listing",
  "realestate-investment",
  "realestate-viewing-confirm",
  "realestate-open-house",
  "realestate-virtual-tour",
  // Automotive
  "auto-new-model",
  "auto-service-promo",
  "auto-trade-in",
  "auto-trade-in-v2",
  // Beauty & Wellness
  "beauty-spa-promo",
  "beauty-appointment-reminder",
  "beauty-aftercare",
  "beauty-spa-package",
  // Entertainment
  "entertainment-event-promo",
  // Logistics
  "logistics-warehouse",
  "logistics-reschedule",
  // Insurance
  "insurance-life-policy",
];

describe("Appointment Booking Templates", () => {
  // Verify all booking template IDs exist in the catalog
  it("all booking template IDs should exist in the catalog", () => {
    const catalogIds = new Set(TEMPLATE_CATALOG.map((t) => t.id));
    for (const id of BOOKING_TEMPLATE_IDS) {
      expect(catalogIds.has(id), `Template "${id}" should exist in catalog`).toBe(true);
    }
  });

  describe("each booking template should have proper date/time selection flow", () => {
    for (const templateId of BOOKING_TEMPLATE_IDS) {
      const template = TEMPLATE_CATALOG.find((t) => t.id === templateId);
      if (!template) continue;

      describe(`${template.title} (${templateId})`, () => {
        it("should mention interactive_list in the prompt", () => {
          expect(template.prompt.toLowerCase()).toContain("interactive_list");
        });

        it("should mention date and time slots in the prompt", () => {
          const prompt = template.prompt.toLowerCase();
          const hasDateTimeSlots =
            prompt.includes("date and time") ||
            prompt.includes("date/time") ||
            prompt.includes("time slot") ||
            prompt.includes("check-in time") ||
            prompt.includes("travel dates") ||
            prompt.includes("flight dates and times") ||
            prompt.includes("event dates and sessions") ||
            prompt.includes("dates and sessions");
          expect(hasDateTimeSlots, `Prompt should mention date/time slots`).toBe(true);
        });

        it("should include Date/Time Selection in flowSteps", () => {
          const hasDateTimeStep = template.flowSteps.some(
            (step) =>
              step.toLowerCase().includes("date/time") ||
              step.toLowerCase().includes("time selection")
          );
          expect(hasDateTimeStep, `flowSteps should include a date/time selection step`).toBe(true);
        });

        it("should end with Thank You or Confirmed step", () => {
          const lastStep = template.flowSteps[template.flowSteps.length - 1];
          const hasThankYou = lastStep.toLowerCase().includes("thank you");
          expect(hasThankYou, `Last flowStep should be 'Thank You', got: "${lastStep}"`).toBe(true);
        });

        it("should include a confirmation step before thank you", () => {
          const hasConfirmed = template.flowSteps.some(
            (step) =>
              step.toLowerCase().includes("confirmed") ||
              step.toLowerCase().includes("confirmation")
          );
          expect(hasConfirmed, `flowSteps should include a confirmation step`).toBe(true);
        });

        it("should mention confirmation after date/time selection in prompt", () => {
          const prompt = template.prompt.toLowerCase();
          const hasConfirmAfterSelect =
            prompt.includes("after the customer selects") ||
            prompt.includes("after the customer picks") ||
            prompt.includes("after the patient selects") ||
            prompt.includes("after the student selects");
          expect(
            hasConfirmAfterSelect,
            `Prompt should describe confirmation after customer selects a slot`
          ).toBe(true);
        });

        it("should mention thank you message in prompt", () => {
          expect(template.prompt.toLowerCase()).toContain("thank you message");
        });
      });
    }
  });
});

describe("AI Prompt Booking Keyword Detection", () => {
  // Test the same regex used in buildUserPrompt
  const bookingKeywords =
    /\b(book|booking|appointment|schedule|scheduling|reservation|reserv|reserve|consult|test drive|viewing|visit|check-in|slot|reschedule)\b/i;

  const shouldMatch = [
    "Book a doctor appointment",
    "Schedule a test drive",
    "Make a reservation at a restaurant",
    "Book a consultation with an advisor",
    "Schedule a property viewing",
    "Reserve a table for dinner",
    "Reschedule my delivery",
    "Book a spa appointment",
    "Check-in for my hotel",
    "Pick a time slot for vaccination",
    "Visit the dealership",
  ];

  const shouldNotMatch = [
    "Send a promotional offer for shoes",
    "Create an order tracking notification",
    "Send a payment reminder",
    "Verify customer identity with OTP",
    "Show product catalog with prices",
    "Send a loyalty program update",
  ];

  for (const prompt of shouldMatch) {
    it(`should detect booking intent in: "${prompt}"`, () => {
      expect(bookingKeywords.test(prompt)).toBe(true);
    });
  }

  for (const prompt of shouldNotMatch) {
    it(`should NOT detect booking intent in: "${prompt}"`, () => {
      expect(bookingKeywords.test(prompt)).toBe(false);
    });
  }
});

describe("Template Catalog Integrity", () => {
  it("all templates should have non-empty prompts", () => {
    for (const t of TEMPLATE_CATALOG) {
      expect(t.prompt.length, `Template "${t.id}" should have a non-empty prompt`).toBeGreaterThan(
        10
      );
    }
  });

  it("all templates should have at least 3 flowSteps", () => {
    for (const t of TEMPLATE_CATALOG) {
      expect(
        t.flowSteps.length,
        `Template "${t.id}" should have at least 3 flowSteps`
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("no template should have duplicate flowSteps", () => {
    for (const t of TEMPLATE_CATALOG) {
      const unique = new Set(t.flowSteps);
      expect(
        unique.size,
        `Template "${t.id}" has duplicate flowSteps: ${t.flowSteps.join(", ")}`
      ).toBe(t.flowSteps.length);
    }
  });
});
