import { describe, it, expect } from "vitest";
import { TEMPLATE_CATALOG } from "../shared/templateCatalog";

/**
 * Template Journey Coherence Tests
 * 
 * These tests ensure that every template prompt follows journey coherence rules:
 * 1. Every carousel must have a post-selection acknowledgment step
 * 2. Every "View Details" / "Learn More" button must lead to details being shown
 * 3. Booking flows must have explicit date/time selection
 * 4. No premature action buttons after carousels without selection
 */

describe("Template Journey Coherence", () => {
  const marketingTemplatesWithCarousel = TEMPLATE_CATALOG.filter(
    (t) =>
      t.messageType === "marketing" &&
      t.prompt.toLowerCase().includes("carousel")
  );

  const allTemplates = TEMPLATE_CATALOG;

  it("should have at least 100 templates in the catalog", () => {
    expect(allTemplates.length).toBeGreaterThanOrEqual(100);
  });

  describe("Carousel Post-Selection Acknowledgment", () => {
    it("every marketing template with a carousel must have explicit post-selection instruction", () => {
      const failures: string[] = [];

      for (const t of marketingTemplatesWithCarousel) {
        const promptLower = t.prompt.toLowerCase();
        const hasPostSelectionAck =
          promptLower.includes("after the customer select") ||
          promptLower.includes("after customer select") ||
          promptLower.includes("after the customer pick") ||
          promptLower.includes("after the customer choose") ||
          promptLower.includes("after the customer click") ||
          promptLower.includes("after the student select") ||
          promptLower.includes("after the student pick") ||
          promptLower.includes("after the student choose") ||
          promptLower.includes("after the user select") ||
          promptLower.includes("after the member select") ||
          promptLower.includes("after the prospect select") ||
          promptLower.includes("after the traveler select") ||
          promptLower.includes("after the patient select") ||
          promptLower.includes("after the investor select") ||
          promptLower.includes("after the buyer select") ||
          promptLower.includes("after the partner select") ||
          promptLower.includes("after the fan select") ||
          promptLower.includes("after the business select") ||
          promptLower.includes("after the driver select") ||
          promptLower.includes("after the policyholder select") ||
          promptLower.includes("after the subscriber select") ||
          promptLower.includes("after they select") ||
          promptLower.includes("after selection") ||
          promptLower.includes("after selections") ||
          promptLower.includes("after the shopper select") ||
          promptLower.includes("let the customer select") ||
          promptLower.includes("let them select") ||
          promptLower.includes("let the user select");

        if (!hasPostSelectionAck) {
          failures.push(
            `${t.id} (${t.industry}): Missing post-selection acknowledgment after carousel`
          );
        }
      }

      expect(failures).toEqual([]);
    });

    it("every carousel should have button labels specified", () => {
      const failures: string[] = [];

      for (const t of marketingTemplatesWithCarousel) {
        const promptLower = t.prompt.toLowerCase();
        const hasButtonLabels =
          promptLower.includes("'view details'") ||
          promptLower.includes("'learn more'") ||
          promptLower.includes("'select") ||
          promptLower.includes("'buy now'") ||
          promptLower.includes("'order now'") ||
          promptLower.includes("'add to") ||
          promptLower.includes("'redeem'") ||
          promptLower.includes("'upgrade'") ||
          promptLower.includes("'invest") ||
          promptLower.includes("'view deal'") ||
          promptLower.includes("'view benefits'") ||
          promptLower.includes("'view tour'") ||
          promptLower.includes("'watch") ||
          promptLower.includes("'partner") ||
          promptLower.includes("buttons");

        if (!hasButtonLabels) {
          failures.push(
            `${t.id} (${t.industry}): Carousel missing explicit button labels`
          );
        }
      }

      expect(failures).toEqual([]);
    });
  });

  describe("Journey Step Completeness", () => {
    it("every template must have at least 3 flow steps", () => {
      const failures: string[] = [];

      for (const t of allTemplates) {
        if (t.flowSteps.length < 3) {
          failures.push(
            `${t.id}: Only ${t.flowSteps.length} flow steps (minimum 3)`
          );
        }
      }

      expect(failures).toEqual([]);
    });

    it("every template prompt should be at least 100 characters long", () => {
      const failures: string[] = [];

      for (const t of allTemplates) {
        if (t.prompt.length < 100) {
          failures.push(
            `${t.id}: Prompt only ${t.prompt.length} chars (minimum 100)`
          );
        }
      }

      expect(failures).toEqual([]);
    });
  });

  describe("Booking Flow Validation", () => {
    it("booking flows with date/time selection should use interactive_list or interactive buttons", () => {
      // Exclude notification/update templates that mention 'schedule' but aren't booking flows
      const nonBookingIds = ["entertainment-schedule", "realestate-construction-update"]; // notifications/updates, not booking flows
      const bookingTemplates = allTemplates.filter((t) => {
        if (nonBookingIds.includes(t.id)) return false;
        const hasBooking =
          /\b(book|booking|appointment|reservation|schedule)\b/i.test(
            t.prompt
          );
        const hasDateTimeInSteps = t.flowSteps.some(
          (s) =>
            s.toLowerCase().includes("date") ||
            s.toLowerCase().includes("time") ||
            s.toLowerCase().includes("slot")
        );
        return hasBooking && hasDateTimeInSteps;
      });

      const failures: string[] = [];

      for (const t of bookingTemplates) {
        const promptLower = t.prompt.toLowerCase();
        const hasInteractiveSelection =
          promptLower.includes("interactive_list") ||
          promptLower.includes("interactive buttons") ||
          promptLower.includes("interactive list");

        if (!hasInteractiveSelection) {
          failures.push(
            `${t.id} (${t.industry}): Booking flow with date/time steps but no interactive selection method`
          );
        }
      }

      expect(failures).toEqual([]);
    });
  });

  describe("No Broken Journey Patterns", () => {
    it("no template should have a carousel immediately followed by a confirmation without selection", () => {
      const failures: string[] = [];

      for (const t of allTemplates) {
        const stepsLower = t.flowSteps.map((s) => s.toLowerCase());

        for (let i = 0; i < stepsLower.length - 1; i++) {
          const current = stepsLower[i];
          const next = stepsLower[i + 1];

          if (
            (current.includes("carousel") || current.includes("showcase")) &&
            (next.includes("confirmed") || next.includes("confirmation"))
          ) {
            // Check if the prompt handles this
            const promptLower = t.prompt.toLowerCase();
            const promptHandlesIt =
              promptLower.includes("after the customer") ||
              promptLower.includes("after the student") ||
              promptLower.includes("after the user") ||
              promptLower.includes("let the customer") ||
              promptLower.includes("let them");

            if (!promptHandlesIt) {
              failures.push(
                `${t.id}: Flow steps "${t.flowSteps[i]}" → "${t.flowSteps[i + 1]}" without selection handling in prompt`
              );
            }
          }
        }
      }

      expect(failures).toEqual([]);
    });
  });

  describe("Template Metadata Completeness", () => {
    it("every template must have all required fields", () => {
      const failures: string[] = [];

      for (const t of allTemplates) {
        if (!t.id) failures.push(`Missing id`);
        if (!t.title) failures.push(`${t.id}: Missing title`);
        if (!t.description) failures.push(`${t.id}: Missing description`);
        if (!t.industry) failures.push(`${t.id}: Missing industry`);
        if (!t.messageType) failures.push(`${t.id}: Missing messageType`);
        if (!t.tags || t.tags.length === 0)
          failures.push(`${t.id}: Missing or empty tags`);
        if (!t.flowSteps || t.flowSteps.length === 0)
          failures.push(`${t.id}: Missing or empty flowSteps`);
        if (!t.prompt) failures.push(`${t.id}: Missing prompt`);
      }

      expect(failures).toEqual([]);
    });

    it("every template ID must be unique", () => {
      const ids = allTemplates.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });
});
