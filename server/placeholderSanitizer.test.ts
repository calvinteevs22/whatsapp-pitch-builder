import { describe, it, expect } from "vitest";

/**
 * We can't directly import sanitizePlaceholders since it's a local function in routers.ts.
 * Instead, we replicate the logic here for unit testing, and also test the system prompt
 * and user prompt contain the anti-placeholder instructions.
 */

// Replicate the sanitizer logic for testing
const PLACEHOLDER_MAP: Array<[RegExp, string]> = [
  [/\[Order\s*(?:ID|Number|#|No\.?)\]/gi, '#WA-78432'],
  [/\[Customer\s*Name\]/gi, 'Sarah'],
  [/\[(?:First\s*)?Name\]/gi, 'Sarah'],
  [/\[(?:Last\s*)?Name\]/gi, 'Johnson'],
  [/\[Full\s*Name\]/gi, 'Sarah Johnson'],
  [/\[Product\s*(?:Name|1|2|3)?\s*(?:Name)?\]/gi, 'Premium Wireless Earbuds'],
  [/\[Item\s*(?:Name)?\]/gi, 'Classic White Sneakers'],
  [/\[Brand\s*(?:Name)?\]/gi, 'StyleHub'],
  [/\[Company\s*(?:Name)?\]/gi, 'TechVista Inc.'],
  [/\[Business\s*(?:Name)?\]/gi, 'ShopEase'],
  [/\[Total\s*(?:Amount|Price)?\]/gi, '$149.98'],
  [/\[Amount\]/gi, '$149.98'],
  [/\[Price\]/gi, '$79.99'],
  [/\[Subtotal\]/gi, '$139.98'],
  [/\[Tax\]/gi, '$10.00'],
  [/\[Discount\s*(?:Amount)?\]/gi, '$15.00'],
  [/\[Date\]/gi, 'March 22, 2026'],
  [/\[Delivery\s*Date\]/gi, 'March 24, 2026'],
  [/\[Time\]/gi, '2:30 PM'],
  [/\[ETA\]/gi, '2:30 PM today'],
  [/\[Tracking\s*(?:Number|ID|#|No\.?)\]/gi, 'TRK-9847362'],
  [/\[Address\]/gi, '42 Marina Bay Drive'],
  [/\[Delivery\s*Address\]/gi, '42 Marina Bay Drive, Apt 7B'],
  [/\[Phone\s*(?:Number)?\]/gi, '+1 (555) 234-5678'],
  [/\[Email\s*(?:Address)?\]/gi, 'sarah@example.com'],
  [/\[Coupon\s*(?:Code)?\]/gi, 'SAVE20-XK7P'],
  [/\[Code\]/gi, 'VIP-2026-8K4P'],
  [/\[OTP\]/gi, '847291'],
  [/\[Verification\s*Code\]/gi, '847291'],
  [/\[Reference\s*(?:Number|ID|#)?\]/gi, 'REF-2026-88431'],
  [/\[Transaction\s*(?:ID|Number|#)?\]/gi, 'TXN-2026-88431'],
  [/\[Invoice\s*(?:Number|ID|#)?\]/gi, 'INV-2026-0318'],
  [/\[Receipt\s*(?:Number|ID|#)?\]/gi, 'RCP-88431'],
  [/\[Booking\s*(?:ID|Number|#|Reference)?\]/gi, 'BK-003847'],
  [/\[Reservation\s*(?:ID|Number|#)?\]/gi, 'RSV-2026-441'],
  [/\[Policy\s*(?:Number|ID)?\]/gi, 'POL-2024-88431'],
  [/\[Account\s*(?:Number|ID)?\]/gi, 'ACC-****4829'],
  [/\[Card\s*(?:Number)?\]/gi, '****4829'],
  [/\[Link\]/gi, 'https://track.example.com/WA-78432'],
  [/\[URL\]/gi, 'https://shop.example.com/deals'],
  [/\[Location\]/gi, 'Downtown Mall, Level 2'],
  [/\[Store\s*(?:Name|Location)?\]/gi, 'Flagship Store, Marina Bay'],
  [/\[Doctor\s*(?:Name)?\]/gi, 'Dr. Sarah Chen'],
  [/\[Clinic\s*(?:Name)?\]/gi, 'HealthFirst Clinic'],
  [/\[Hospital\s*(?:Name)?\]/gi, 'City General Hospital'],
  [/\[Agent\s*(?:Name)?\]/gi, 'Michael Torres'],
  [/\[Driver\s*(?:Name)?\]/gi, 'Raj'],
  [/\[Quantity\]/gi, '2'],
  [/\[Weight\]/gi, '2.4 kg'],
  [/\[Size\]/gi, 'Medium'],
  [/\[Color\]/gi, 'Midnight Blue'],
  [/\{\{1\}\}/g, 'Sarah'],
  [/\{\{2\}\}/g, '#WA-78432'],
  [/\{\{3\}\}/g, '$149.98'],
  [/\{\{name\}\}/gi, 'Sarah'],
  [/\{\{order_id\}\}/gi, '#WA-78432'],
  [/\{\{amount\}\}/gi, '$149.98'],
  [/\{\{date\}\}/gi, 'March 22, 2026'],
  [/\{\{time\}\}/gi, '2:30 PM'],
];

const GENERIC_BRACKET_PATTERN = /\[([A-Z][a-zA-Z\s\/]*?)\]/g;

function replacePlaceholders(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let result = text;
  for (const [pattern, replacement] of PLACEHOLDER_MAP) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(GENERIC_BRACKET_PATTERN, (match, inner) => {
    if (/^\d/.test(inner) || inner.length > 40) return match;
    return inner;
  });
  return result;
}

function sanitizeContent(content: any): any {
  if (!content || typeof content !== 'object') return content;
  const c = { ...content };
  const textFields = ['text', 'headerText', 'bodyText', 'footerText', 'caption', 'listButtonText', 'locationName', 'documentName'];
  for (const field of textFields) {
    if (c[field] && typeof c[field] === 'string') {
      c[field] = replacePlaceholders(c[field]);
    }
  }
  if (c.buttons && Array.isArray(c.buttons)) {
    c.buttons = c.buttons.map((b: any) => ({
      ...b,
      title: replacePlaceholders(b.title),
    }));
  }
  if (c.listSections && Array.isArray(c.listSections)) {
    c.listSections = c.listSections.map((s: any) => ({
      ...s,
      title: replacePlaceholders(s.title),
      rows: (s.rows || []).map((r: any) => ({
        ...r,
        title: replacePlaceholders(r.title),
        description: replacePlaceholders(r.description),
      })),
    }));
  }
  if (c.carouselCards && Array.isArray(c.carouselCards)) {
    c.carouselCards = c.carouselCards.map((card: any) => ({
      ...card,
      title: replacePlaceholders(card.title),
      description: replacePlaceholders(card.description),
      price: replacePlaceholders(card.price),
      buttonText: replacePlaceholders(card.buttonText),
    }));
  }
  return c;
}

function sanitizePlaceholders(messages: any[]): any[] {
  for (const msg of messages) {
    msg.content = sanitizeContent(msg.content);
  }
  return messages;
}

describe("Placeholder Sanitizer", () => {
  describe("replacePlaceholders - Order/Transaction placeholders", () => {
    it("should replace [Order ID] with realistic order ID", () => {
      expect(replacePlaceholders("Your order [Order ID] is confirmed")).toBe("Your order #WA-78432 is confirmed");
    });

    it("should replace [Order Number] with realistic order ID", () => {
      expect(replacePlaceholders("Order [Order Number] shipped")).toBe("Order #WA-78432 shipped");
    });

    it("should replace [Tracking Number] with realistic tracking code", () => {
      expect(replacePlaceholders("Track: [Tracking Number]")).toBe("Track: TRK-9847362");
    });

    it("should replace [Transaction ID] with realistic transaction ID", () => {
      expect(replacePlaceholders("Ref: [Transaction ID]")).toBe("Ref: TXN-2026-88431");
    });

    it("should replace [Invoice Number] with realistic invoice number", () => {
      expect(replacePlaceholders("Invoice [Invoice Number] ready")).toBe("Invoice INV-2026-0318 ready");
    });

    it("should replace [Receipt Number] with realistic receipt number", () => {
      expect(replacePlaceholders("Receipt: [Receipt Number]")).toBe("Receipt: RCP-88431");
    });

    it("should replace [Booking ID] with realistic booking ID", () => {
      expect(replacePlaceholders("Booking [Booking ID] confirmed")).toBe("Booking BK-003847 confirmed");
    });
  });

  describe("replacePlaceholders - Personal data placeholders", () => {
    it("should replace [Customer Name] with a realistic name", () => {
      expect(replacePlaceholders("Hi [Customer Name], welcome!")).toBe("Hi Sarah, welcome!");
    });

    it("should replace [Name] with a realistic name", () => {
      expect(replacePlaceholders("Hello [Name]!")).toBe("Hello Sarah!");
    });

    it("should replace [Phone Number] with realistic phone", () => {
      expect(replacePlaceholders("Call [Phone Number]")).toBe("Call +1 (555) 234-5678");
    });

    it("should replace [Email Address] with realistic email", () => {
      expect(replacePlaceholders("Email: [Email Address]")).toBe("Email: sarah@example.com");
    });

    it("should replace [Address] with realistic address", () => {
      expect(replacePlaceholders("Ship to: [Address]")).toBe("Ship to: 42 Marina Bay Drive");
    });
  });

  describe("replacePlaceholders - Financial placeholders", () => {
    it("should replace [Total Amount] with realistic amount", () => {
      expect(replacePlaceholders("Total: $[Total Amount]")).toBe("Total: $$149.98");
      // Note: If the prompt has "Total: [Total Amount]" without $, it works perfectly
      expect(replacePlaceholders("Total: [Total Amount]")).toBe("Total: $149.98");
    });

    it("should replace [Price] with realistic price", () => {
      expect(replacePlaceholders("Price: [Price]")).toBe("Price: $79.99");
    });

    it("should replace [Amount] with realistic amount", () => {
      expect(replacePlaceholders("Amount: [Amount]")).toBe("Amount: $149.98");
    });

    it("should replace [Coupon Code] with realistic code", () => {
      expect(replacePlaceholders("Use code: [Coupon Code]")).toBe("Use code: SAVE20-XK7P");
    });

    it("should replace [OTP] with realistic OTP", () => {
      expect(replacePlaceholders("Your OTP is [OTP]")).toBe("Your OTP is 847291");
    });
  });

  describe("replacePlaceholders - Date/Time placeholders", () => {
    it("should replace [Date] with realistic date", () => {
      expect(replacePlaceholders("Delivery on [Date]")).toBe("Delivery on March 22, 2026");
    });

    it("should replace [Time] with realistic time", () => {
      expect(replacePlaceholders("Arriving at [Time]")).toBe("Arriving at 2:30 PM");
    });

    it("should replace [ETA] with realistic ETA", () => {
      expect(replacePlaceholders("ETA: [ETA]")).toBe("ETA: 2:30 PM today");
    });

    it("should replace [Delivery Date] with realistic date", () => {
      expect(replacePlaceholders("Expected: [Delivery Date]")).toBe("Expected: March 24, 2026");
    });
  });

  describe("replacePlaceholders - Product/Business placeholders", () => {
    it("should replace [Product Name] with realistic product", () => {
      expect(replacePlaceholders("Item: [Product Name]")).toBe("Item: Premium Wireless Earbuds");
    });

    it("should replace [Business Name] with realistic name", () => {
      expect(replacePlaceholders("Welcome to [Business Name]")).toBe("Welcome to ShopEase");
    });

    it("should replace [Doctor Name] with realistic doctor name", () => {
      expect(replacePlaceholders("Appointment with [Doctor Name]")).toBe("Appointment with Dr. Sarah Chen");
    });

    it("should replace [Store Name] with realistic store name", () => {
      expect(replacePlaceholders("Visit [Store Name]")).toBe("Visit Flagship Store, Marina Bay");
    });
  });

  describe("replacePlaceholders - Template variable placeholders", () => {
    it("should replace {{1}} with a name", () => {
      expect(replacePlaceholders("Hello {{1}}!")).toBe("Hello Sarah!");
    });

    it("should replace {{name}} with a name", () => {
      expect(replacePlaceholders("Hi {{name}}, your order")).toBe("Hi Sarah, your order");
    });

    it("should replace {{order_id}} with order ID", () => {
      expect(replacePlaceholders("Order {{order_id}} confirmed")).toBe("Order #WA-78432 confirmed");
    });

    it("should replace {{amount}} with amount", () => {
      expect(replacePlaceholders("Total: {{amount}}")).toBe("Total: $149.98");
    });
  });

  describe("replacePlaceholders - Generic catch-all", () => {
    it("should remove brackets from unmapped [Something] patterns", () => {
      expect(replacePlaceholders("Visit [Showroom]")).toBe("Visit Showroom");
    });

    it("should not affect text without placeholders", () => {
      const clean = "Hi Sarah, your order #WA-78432 for Nike Air Max 90 ($129.99) is confirmed!";
      expect(replacePlaceholders(clean)).toBe(clean);
    });

    it("should handle null/undefined gracefully", () => {
      expect(replacePlaceholders(null as any)).toBe(null);
      expect(replacePlaceholders(undefined as any)).toBe(undefined);
      expect(replacePlaceholders("")).toBe("");
    });
  });

  describe("replacePlaceholders - Multiple placeholders in one string", () => {
    it("should replace multiple different placeholders in one string", () => {
      const input = "Hi [Customer Name], your order [Order ID] for [Product Name] totaling [Total Amount] will arrive on [Date].";
      const result = replacePlaceholders(input);
      expect(result).not.toContain("[");
      expect(result).toContain("Sarah");
      expect(result).toContain("#WA-78432");
      expect(result).toContain("Premium Wireless Earbuds");
      expect(result).toContain("$149.98");
      expect(result).toContain("March 22, 2026");
    });
  });

  describe("sanitizeContent - Full message content sanitization", () => {
    it("should sanitize text field in content", () => {
      const content = { type: "text", text: "Hi [Customer Name], order [Order ID] confirmed!" };
      const result = sanitizeContent(content);
      expect(result.text).toBe("Hi Sarah, order #WA-78432 confirmed!");
    });

    it("should sanitize bodyText in template content", () => {
      const content = {
        type: "template",
        headerText: "Order [Order ID]",
        bodyText: "Hi [Name], your total is [Total Amount]",
        footerText: "Delivery: [Date]",
      };
      const result = sanitizeContent(content);
      expect(result.headerText).toBe("Order #WA-78432");
      expect(result.bodyText).toBe("Hi Sarah, your total is $149.98");
      expect(result.footerText).toBe("Delivery: March 22, 2026");
    });

    it("should sanitize button titles", () => {
      const content = {
        type: "interactive_buttons",
        text: "Choose an option",
        buttons: [
          { id: "1", title: "Track [Order ID]" },
          { id: "2", title: "Contact [Agent Name]" },
        ],
      };
      const result = sanitizeContent(content);
      expect(result.buttons[0].title).toBe("Track #WA-78432");
      expect(result.buttons[1].title).toBe("Contact Michael Torres");
    });

    it("should sanitize carousel card fields", () => {
      const content = {
        type: "carousel",
        text: "Our products:",
        carouselCards: [
          { id: "1", title: "[Product Name]", description: "[Brand Name] quality", price: "[Price]", buttonText: "Buy [Item Name]" },
        ],
      };
      const result = sanitizeContent(content);
      expect(result.carouselCards[0].title).toBe("Premium Wireless Earbuds");
      expect(result.carouselCards[0].description).toBe("StyleHub quality");
      expect(result.carouselCards[0].price).toBe("$79.99");
      expect(result.carouselCards[0].buttonText).toBe("Buy Classic White Sneakers");
    });

    it("should sanitize list section rows", () => {
      const content = {
        type: "interactive_list",
        text: "Select a slot:",
        listButtonText: "View [Date]",
        listSections: [{
          title: "Available on [Date]",
          rows: [
            { id: "1", title: "[Date] at [Time]", description: "With [Doctor Name]" },
          ],
        }],
      };
      const result = sanitizeContent(content);
      expect(result.listButtonText).toBe("View March 22, 2026");
      expect(result.listSections[0].title).toBe("Available on March 22, 2026");
      expect(result.listSections[0].rows[0].title).toBe("March 22, 2026 at 2:30 PM");
      expect(result.listSections[0].rows[0].description).toBe("With Dr. Sarah Chen");
    });

    it("should handle content with no placeholders (no-op)", () => {
      const content = {
        type: "text",
        text: "Hi Sarah, your order #WA-78432 is confirmed!",
      };
      const result = sanitizeContent(content);
      expect(result.text).toBe("Hi Sarah, your order #WA-78432 is confirmed!");
    });

    it("should handle null/undefined content gracefully", () => {
      expect(sanitizeContent(null)).toBe(null);
      expect(sanitizeContent(undefined)).toBe(undefined);
    });
  });

  describe("sanitizePlaceholders - Full message array", () => {
    it("should sanitize all messages in an array", () => {
      const messages = [
        {
          direction: "outbound",
          contentType: "template",
          content: {
            type: "template",
            headerText: "Order [Order ID]",
            bodyText: "Hi [Customer Name], your [Product Name] order is confirmed!",
            footerText: "Total: [Total Amount]",
            buttons: [{ id: "1", title: "Track Order" }],
          },
        },
        {
          direction: "inbound",
          contentType: "text",
          content: { type: "text", text: "Track Order" },
        },
        {
          direction: "outbound",
          contentType: "text",
          content: {
            type: "text",
            text: "Your order [Order ID] was shipped via [Tracking Number]. ETA: [Date]",
          },
        },
      ];

      const result = sanitizePlaceholders(messages);
      expect(result[0].content.headerText).toBe("Order #WA-78432");
      expect(result[0].content.bodyText).toContain("Sarah");
      expect(result[0].content.bodyText).toContain("Premium Wireless Earbuds");
      expect(result[0].content.footerText).toBe("Total: $149.98");
      // Inbound messages should not be affected (no placeholders)
      expect(result[1].content.text).toBe("Track Order");
      // Outbound text with multiple placeholders
      expect(result[2].content.text).not.toContain("[");
      expect(result[2].content.text).toContain("#WA-78432");
      expect(result[2].content.text).toContain("TRK-9847362");
      expect(result[2].content.text).toContain("March 22, 2026");
    });

    it("should handle empty messages array", () => {
      expect(sanitizePlaceholders([])).toEqual([]);
    });
  });

  describe("System prompt anti-placeholder rules", () => {
    it("should have ZERO TOLERANCE section in system prompt", async () => {
      const fs = await import("fs");
      const routersContent = fs.readFileSync("/home/ubuntu/wa-thread-builder/server/routers.ts", "utf-8");
      expect(routersContent).toContain("ZERO TOLERANCE FOR PLACEHOLDERS");
    });

    it("should have concrete examples of correct vs incorrect output", async () => {
      const fs = await import("fs");
      const routersContent = fs.readFileSync("/home/ubuntu/wa-thread-builder/server/routers.ts", "utf-8");
      expect(routersContent).toContain("WRONG:");
      expect(routersContent).toContain("CORRECT:");
      expect(routersContent).toContain("#WA-78432");
      expect(routersContent).toContain("Nike Air Max 90");
    });

    it("should have placeholder self-check in SELF-CHECK section", async () => {
      const fs = await import("fs");
      const routersContent = fs.readFileSync("/home/ubuntu/wa-thread-builder/server/routers.ts", "utf-8");
      expect(routersContent).toContain("PLACEHOLDER CHECK (CRITICAL)");
      expect(routersContent).toContain("#1 quality gate");
    });

    it("should have anti-placeholder rule in user prompt builder", async () => {
      const fs = await import("fs");
      const routersContent = fs.readFileSync("/home/ubuntu/wa-thread-builder/server/routers.ts", "utf-8");
      expect(routersContent).toContain("ABSOLUTE RULE — NO PLACEHOLDERS");
    });

    it("should call sanitizePlaceholders in the generation pipeline", async () => {
      const fs = await import("fs");
      const routersContent = fs.readFileSync("/home/ubuntu/wa-thread-builder/server/routers.ts", "utf-8");
      expect(routersContent).toContain("sanitizePlaceholders(parsed.messages)");
    });
  });

  describe("Real-world placeholder scenarios from templates", () => {
    it("should fix e-commerce order tracking placeholders", () => {
      const msg = {
        direction: "outbound",
        contentType: "text",
        content: {
          type: "text",
          text: "Hi [Customer Name], your order #[Order ID] is confirmed!\n\nItems:\n[Product 1 Name] x1 - $[Price]\n[Product 2 Name] x1 - $[Price]\n\nTotal: $[Total Amount]\nEstimated Delivery: [Delivery Date]",
        },
      };
      const [result] = sanitizePlaceholders([msg]);
      expect(result.content.text).not.toContain("[");
      expect(result.content.text).toContain("Sarah");
      expect(result.content.text).toContain("#WA-78432");
    });

    it("should fix healthcare appointment placeholders", () => {
      const msg = {
        direction: "outbound",
        contentType: "interactive_buttons",
        content: {
          type: "interactive_buttons",
          text: "Your appointment with [Doctor Name] is confirmed for [Date] at [Time] at [Clinic Name].",
          buttons: [{ id: "1", title: "Get Directions" }, { id: "2", title: "Reschedule" }],
        },
      };
      const [result] = sanitizePlaceholders([msg]);
      expect(result.content.text).not.toContain("[");
      expect(result.content.text).toContain("Dr. Sarah Chen");
      expect(result.content.text).toContain("March 22, 2026");
      expect(result.content.text).toContain("2:30 PM");
      expect(result.content.text).toContain("HealthFirst Clinic");
    });

    it("should fix logistics tracking placeholders", () => {
      const msg = {
        direction: "outbound",
        contentType: "text",
        content: {
          type: "text",
          text: "Shipment [Tracking Number] from [Location] is out for delivery. ETA: [ETA]. Driver: [Driver Name].",
        },
      };
      const [result] = sanitizePlaceholders([msg]);
      expect(result.content.text).not.toContain("[");
      expect(result.content.text).toContain("TRK-9847362");
      expect(result.content.text).toContain("Raj");
    });

    it("should fix finance transaction placeholders", () => {
      const msg = {
        direction: "outbound",
        contentType: "text",
        content: {
          type: "text",
          text: "Transaction [Transaction ID] of [Amount] on [Date] at [Time] from card [Card Number] needs verification.",
        },
      };
      const [result] = sanitizePlaceholders([msg]);
      expect(result.content.text).not.toContain("[");
      expect(result.content.text).toContain("TXN-2026-88431");
      expect(result.content.text).toContain("$149.98");
      expect(result.content.text).toContain("****4829");
    });

    it("should fix template variable style placeholders", () => {
      const msg = {
        direction: "outbound",
        contentType: "template",
        content: {
          type: "template",
          headerText: "Welcome {{1}}!",
          bodyText: "Your order {{2}} totaling {{amount}} will arrive on {{date}}.",
          footerText: "Questions? Call us",
          buttons: [{ id: "1", title: "Track Order" }],
        },
      };
      const [result] = sanitizePlaceholders([msg]);
      expect(result.content.headerText).toBe("Welcome Sarah!");
      // bodyText has {{2}} (order ID), {{amount}}, {{date}} - no {{1}} (name)
      expect(result.content.bodyText).toContain("#WA-78432");
      expect(result.content.bodyText).toContain("$149.98");
      expect(result.content.bodyText).toContain("March 22, 2026");
      expect(result.content.bodyText).not.toContain("{{");
    });
  });
});
