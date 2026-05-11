import { describe, it, expect } from "vitest";
import {
  validateMessageCompliance,
  validateUtilityCompliance,
  sanitizeUtilityMessages,
  type ComplianceResult,
} from "../shared/utilityComplianceRules";

// Helper to create a mock outbound message
function outbound(content: any): any {
  return { direction: "outbound", contentType: content.type || "text", content };
}

// Helper to create a mock inbound message
function inbound(content: any): any {
  return { direction: "inbound", contentType: content.type || "text", content };
}

describe("Utility Compliance Validation", () => {
  describe("validateMessageCompliance", () => {
    it("should pass a clean transactional message", () => {
      const msg = outbound({
        type: "text",
        text: "Your order #WA-78432 has been shipped. Track it with the link below.",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations).toEqual([]);
    });

    it("should skip inbound messages (customer messages are not checked)", () => {
      const msg = inbound({
        type: "text",
        text: "I want to buy now and get the best deal!",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations).toEqual([]);
    });

    // ── Discount detection ──
    it("should flag percentage-off discount language", () => {
      const msg = outbound({
        type: "text",
        text: "Get 20% off your next purchase with code SAVE20!",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].severity).toBe("high");
      expect(violations[0].rule).toContain("Discount");
    });

    it("should flag discount code language", () => {
      const msg = outbound({
        type: "text",
        text: "Use discount code WINTER2026 at checkout for savings.",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some(v => v.rule.includes("Discount"))).toBe(true);
    });

    it("should flag promo code language", () => {
      const msg = outbound({
        type: "text",
        text: "Apply promo code FLASH50 for an exclusive deal.",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
    });

    it("should flag flash sale language", () => {
      const msg = outbound({
        type: "text",
        text: "Flash sale happening now! Don't miss out.",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
    });

    it("should flag limited-time offer", () => {
      const msg = outbound({
        type: "text",
        text: "Limited-time offer: free shipping on all orders!",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
    });

    it("should flag price comparison (was/now)", () => {
      const msg = outbound({
        type: "text",
        text: "Was $99.99, now $49.99 — save 50%!",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
    });

    // ── Cross-sell detection ──
    it("should flag cross-selling language", () => {
      const msg = outbound({
        type: "text",
        text: "You might also like our new arrivals collection!",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some(v => v.rule.includes("Cross-selling"))).toBe(true);
    });

    it("should flag 'shop now' in message text", () => {
      const msg = outbound({
        type: "text",
        text: "Check out our latest products. Shop now before they're gone!",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
    });

    it("should flag 'try something new'", () => {
      const msg = outbound({
        type: "text",
        text: "Want to try something new? Browse our collection.",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
    });

    // ── Upsell detection ──
    it("should flag upgrade language", () => {
      const msg = outbound({
        type: "text",
        text: "Upgrade to our Premium plan for more features!",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some(v => v.rule.includes("Upselling"))).toBe(true);
    });

    it("should flag 'go premium'", () => {
      const msg = outbound({
        type: "text",
        text: "Go premium today and unlock all features.",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
    });

    // ── Loyalty detection ──
    it("should flag loyalty rewards language", () => {
      const msg = outbound({
        type: "text",
        text: "You've earned 500 points! Redeem them for exclusive rewards.",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some(v => v.rule.includes("Loyalty"))).toBe(true);
    });

    it("should flag refer a friend", () => {
      const msg = outbound({
        type: "text",
        text: "Refer a friend and earn bonus rewards!",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
    });

    // ── FOMO detection ──
    it("should flag urgency/FOMO language", () => {
      const msg = outbound({
        type: "text",
        text: "Hurry! Only 3 left in stock. Act now!",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some(v => v.rule.includes("FOMO"))).toBe(true);
    });

    it("should flag 'last chance'", () => {
      const msg = outbound({
        type: "text",
        text: "Last chance to grab this deal before it's gone!",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
    });

    // ── Button detection ──
    it("should flag promotional button labels", () => {
      const msg = outbound({
        type: "interactive_buttons",
        text: "Your order is ready.",
        buttons: [
          { id: "1", title: "Shop Now" },
          { id: "2", title: "Track Order" },
        ],
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.some(v => v.field.includes("button") && v.rule.includes("Promotional CTA"))).toBe(true);
    });

    it("should flag 'Upgrade Now' button", () => {
      const msg = outbound({
        type: "interactive_buttons",
        text: "Your subscription expires tomorrow.",
        buttons: [
          { id: "1", title: "Upgrade Now" },
          { id: "2", title: "Renew" },
        ],
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.some(v => v.matchedText.toLowerCase().includes("upgrade now"))).toBe(true);
    });

    it("should pass legitimate transactional buttons", () => {
      const msg = outbound({
        type: "interactive_buttons",
        text: "Your appointment is confirmed for March 25.",
        buttons: [
          { id: "1", title: "Confirm" },
          { id: "2", title: "Reschedule" },
          { id: "3", title: "Cancel" },
        ],
      });
      const violations = validateMessageCompliance(msg);
      expect(violations).toEqual([]);
    });

    // ── Carousel detection ──
    it("should flag product carousel with prices", () => {
      const msg = outbound({
        type: "carousel",
        text: "Check out our products:",
        carouselCards: [
          { id: "1", title: "Product A", description: "Great item", price: "$29.99", buttonText: "Buy Now" },
          { id: "2", title: "Product B", description: "Another item", price: "$39.99", buttonText: "Learn More" },
        ],
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.some(v => v.rule.includes("Product catalog carousels"))).toBe(true);
    });

    // ── Allowlist tests ──
    it("should allow 'offer to reschedule' (utility context)", () => {
      const msg = outbound({
        type: "text",
        text: "We'd like to offer to reschedule your appointment to a more convenient time.",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations).toEqual([]);
    });

    it("should allow 'free repair' (warranty context)", () => {
      const msg = outbound({
        type: "text",
        text: "Your vehicle is eligible for a free repair under the recall program.",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations).toEqual([]);
    });

    it("should allow 'premium' in insurance payment context", () => {
      const msg = outbound({
        type: "text",
        text: "Your premium payment of $250 is due on March 30.",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations).toEqual([]);
    });

    it("should allow 'dealership' (location name)", () => {
      const msg = outbound({
        type: "text",
        text: "Visit our dealership at 42 Marina Bay Drive for your service appointment.",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations).toEqual([]);
    });

    it("should allow 'collection appointment' (pickup context)", () => {
      const msg = outbound({
        type: "text",
        text: "Your key collection appointment is scheduled for Monday at 10 AM.",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations).toEqual([]);
    });

    it("should allow 'offer pickup or delivery' (logistics context)", () => {
      const msg = outbound({
        type: "text",
        text: "We can offer pickup or delivery for your prescription refill.",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations).toEqual([]);
    });

    // ── Template content types ──
    it("should check template headerText and bodyText", () => {
      const msg = outbound({
        type: "template",
        headerText: "Flash Sale Alert!",
        bodyText: "Get 50% off everything today only!",
        buttons: [{ id: "1", title: "Shop Now" }],
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
    });

    it("should check image captions", () => {
      const msg = outbound({
        type: "image",
        imageDescription: "product photo",
        caption: "Limited-time offer: Buy one get one free!",
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
    });

    // ── List section content ──
    it("should check list section row titles and descriptions", () => {
      const msg = outbound({
        type: "interactive_list",
        text: "Choose an option:",
        listButtonText: "View",
        listSections: [{
          title: "Special Offers",
          rows: [
            { id: "1", title: "Flash Sale Items", description: "Save 30% on selected items" },
            { id: "2", title: "Track Order", description: "Check your order status" },
          ],
        }],
      });
      const violations = validateMessageCompliance(msg);
      expect(violations.length).toBeGreaterThan(0);
    });
  });

  describe("validateUtilityCompliance", () => {
    it("should skip validation for marketing messages", () => {
      const result = validateUtilityCompliance(
        [outbound({ type: "text", text: "Flash sale! 50% off everything!" })],
        "marketing"
      );
      expect(result.isCompliant).toBe(true);
      expect(result.summary).toContain("skipped");
    });

    it("should skip validation for authentication messages", () => {
      const result = validateUtilityCompliance(
        [outbound({ type: "text", text: "Shop now for deals!" })],
        "authentication"
      );
      expect(result.isCompliant).toBe(true);
    });

    it("should validate utility messages and find violations", () => {
      const messages = [
        outbound({ type: "template", headerText: "Order Update", bodyText: "Your order shipped!", buttons: [{ id: "1", title: "Track" }] }),
        inbound({ type: "text", text: "Track" }),
        outbound({ type: "text", text: "Your package is on its way. Also, check out our new arrivals!" }),
      ];
      const result = validateUtilityCompliance(messages, "utility");
      expect(result.isCompliant).toBe(false);
      expect(result.violationCount).toBeGreaterThan(0);
    });

    it("should pass a clean utility flow", () => {
      const messages = [
        outbound({ type: "template", headerText: "Appointment Reminder", bodyText: "Your appointment is tomorrow at 2 PM.", buttons: [{ id: "1", title: "Confirm" }, { id: "2", title: "Reschedule" }] }),
        inbound({ type: "text", text: "Confirm" }),
        outbound({ type: "text", text: "Great! Your appointment is confirmed. See you tomorrow at 2 PM." }),
      ];
      const result = validateUtilityCompliance(messages, "utility");
      expect(result.isCompliant).toBe(true);
      expect(result.summary).toContain("no promotional content");
    });

    it("should handle empty messages", () => {
      const result = validateUtilityCompliance([], "utility");
      expect(result.isCompliant).toBe(true);
    });

    it("should count high and medium severity separately in summary", () => {
      const messages = [
        outbound({
          type: "interactive_buttons",
          text: "Your order is ready. Get 20% off your next order!",
          buttons: [{ id: "1", title: "Shop Now" }, { id: "2", title: "Track Order" }],
        }),
      ];
      const result = validateUtilityCompliance(messages, "utility");
      expect(result.isCompliant).toBe(false);
      expect(result.violations.some(v => v.severity === "high")).toBe(true);
    });
  });

  describe("sanitizeUtilityMessages", () => {
    it("should replace promotional button labels", () => {
      const messages = [
        outbound({
          type: "interactive_buttons",
          text: "Your order is ready.",
          buttons: [
            { id: "1", title: "Shop Now" },
            { id: "2", title: "Track Order" },
          ],
        }),
      ];
      const result = sanitizeUtilityMessages(messages);
      expect(result.fixCount).toBe(1);
      expect(result.messages[0].content.buttons[0].title).toBe("View Details");
      expect(result.messages[0].content.buttons[1].title).toBe("Track Order");
    });

    it("should replace 'Upgrade Now' with 'Manage Plan'", () => {
      const messages = [
        outbound({
          type: "interactive_buttons",
          text: "Your subscription renews tomorrow.",
          buttons: [
            { id: "1", title: "Upgrade Now" },
            { id: "2", title: "Renew" },
          ],
        }),
      ];
      const result = sanitizeUtilityMessages(messages);
      expect(result.fixCount).toBe(1);
      expect(result.messages[0].content.buttons[0].title).toBe("Manage Plan");
    });

    it("should remove product carousel with prices", () => {
      const messages = [
        outbound({
          type: "carousel",
          text: "Related products:",
          carouselCards: [
            { id: "1", title: "Product A", price: "$29.99", buttonText: "Buy" },
            { id: "2", title: "Product B", price: "$39.99", buttonText: "Buy" },
          ],
        }),
      ];
      const result = sanitizeUtilityMessages(messages);
      expect(result.fixCount).toBe(1);
      expect(result.messages[0].content.type).toBe("text");
      expect(result.messages[0].content.carouselCards).toBeUndefined();
    });

    it("should not modify inbound messages", () => {
      const messages = [
        inbound({ type: "text", text: "I want to shop now!" }),
      ];
      const result = sanitizeUtilityMessages(messages);
      expect(result.fixCount).toBe(0);
      expect(result.messages[0].content.text).toBe("I want to shop now!");
    });

    it("should not modify already-compliant messages", () => {
      const messages = [
        outbound({
          type: "interactive_buttons",
          text: "Your delivery is scheduled for tomorrow.",
          buttons: [
            { id: "1", title: "Confirm" },
            { id: "2", title: "Reschedule" },
          ],
        }),
      ];
      const result = sanitizeUtilityMessages(messages);
      expect(result.fixCount).toBe(0);
    });

    it("should handle multiple fixes in one flow", () => {
      const messages = [
        outbound({
          type: "interactive_buttons",
          text: "Your order shipped!",
          buttons: [{ id: "1", title: "Track Order" }],
        }),
        inbound({ type: "text", text: "Track Order" }),
        outbound({
          type: "interactive_buttons",
          text: "Package is on its way!",
          buttons: [
            { id: "1", title: "Buy Now" },
            { id: "2", title: "View Offers" },
          ],
        }),
      ];
      const result = sanitizeUtilityMessages(messages);
      expect(result.fixCount).toBe(2);
      expect(result.messages[2].content.buttons[0].title).toBe("View Details");
      expect(result.messages[2].content.buttons[1].title).toBe("View Options");
    });
  });

  describe("Template catalog compliance", () => {
    it("should validate that all utility templates in the catalog are compliant (prompt-level check)", async () => {
      // This test checks the template PROMPTS (not generated messages) for obvious promotional patterns
      const { TEMPLATE_CATALOG } = await import("../shared/templateCatalog");
      const utilityTemplates = TEMPLATE_CATALOG.filter(t => t.messageType === "utility");

      expect(utilityTemplates.length).toBeGreaterThan(50);

      const highSeverityPatterns = [
        /\bdiscount\s+code\b/i,
        /\bcoupon\s+code\b/i,
        /\bpromo\s*code\b/i,
        /\b\d+%\s*off\b/i,
        /\bflash\s+sale\b/i,
        /\bbuy\s+one\s+get\s+one\b/i,
        /\bloyalty\s+(bonus|reward|program)\b/i,
        /\brefer\s+a\s+friend\b/i,
        /\btry\s+something\s+new\b/i,
        /\bupgrade\s+to\s+(premium|pro|plus)\b/i,
        /\bcross[\s-]sell/i,
        /\bupsell/i,
      ];

      const violations: string[] = [];
      for (const t of utilityTemplates) {
        const text = `${t.prompt} ${t.description}`;
        for (const pattern of highSeverityPatterns) {
          if (pattern.test(text)) {
            violations.push(`${t.id}: matched "${pattern.source}" in prompt/description`);
            break;
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });
});
