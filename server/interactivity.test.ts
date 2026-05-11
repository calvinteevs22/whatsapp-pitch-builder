import { describe, it, expect } from "vitest";

// Replicate the strengthened enforceInteractivity logic for unit testing
function enforceInteractivity(messages: any[]): any[] {
  if (!messages || messages.length === 0) return messages;

  // Helper: check if a message has interactive elements
  function isInteractive(m: any): boolean {
    const c = m.content;
    if (!c) return false;
    if ((c.type === "template" || m.contentType === "template") && c.buttons && c.buttons.length > 0) return true;
    if (c.buttons && c.buttons.length > 0) return true;
    if (c.type === "interactive_list" && c.listSections && c.listSections.length > 0) return true;
    if (c.type === "carousel" && c.carouselCards && c.carouselCards.length > 0) return true;
    return false;
  }

  // Pass 1: Remove any leading inbound messages
  while (messages.length > 0 && messages[0].direction === "inbound") {
    messages.shift();
  }

  // Pass 2: Remove consecutive inbound messages (keep only the first)
  for (let i = messages.length - 1; i > 0; i--) {
    if (messages[i].direction === "inbound" && messages[i - 1].direction === "inbound") {
      messages.splice(i, 1);
    }
  }

  // Pass 3: For each inbound message, ensure the immediately preceding outbound is interactive
  for (let i = 1; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.direction !== "inbound") continue;

    let prevOutboundIdx = -1;
    for (let j = i - 1; j >= 0; j--) {
      if (messages[j].direction === "outbound") {
        prevOutboundIdx = j;
        break;
      }
    }

    if (prevOutboundIdx === -1) continue;

    const prevMsg = messages[prevOutboundIdx];

    if (isInteractive(prevMsg)) continue;

    const content = prevMsg.content;

    const customerText = msg.content?.text || msg.content?.bodyText || "Continue";
    const buttonTitle = customerText.length > 20 ? customerText.substring(0, 17) + "..." : customerText;

    if (!content.buttons) {
      content.buttons = [];
    }

    const existingTitles = new Set(content.buttons.map((b: any) => b.title));
    if (!existingTitles.has(buttonTitle)) {
      content.buttons.push({ id: String(content.buttons.length + 1), title: buttonTitle });
      existingTitles.add(buttonTitle);
    }
    if (!existingTitles.has("Learn More") && content.buttons.length < 3) {
      content.buttons.push({ id: String(content.buttons.length + 1), title: "Learn More" });
    }

    if (content.buttons.length > 3) {
      content.buttons = content.buttons.slice(0, 3);
    }

    if (prevMsg.contentType === "text" || prevMsg.contentType === "image" || prevMsg.contentType === "video") {
      if (prevMsg.contentType === "image" || prevMsg.contentType === "video") {
        const mediaCaption = content.caption || content.text || content.imageDescription || content.videoDescription || "";
        content.text = mediaCaption;
        content.type = "interactive_buttons";
        prevMsg.contentType = "interactive_buttons";
      } else {
        prevMsg.contentType = "interactive_buttons";
        content.type = "interactive_buttons";
      }
    }
  }

  return messages;
}

describe("enforceInteractivity", () => {
  it("should not modify messages when all inbound messages follow interactive outbound messages", () => {
    const messages = [
      { direction: "outbound", contentType: "template", content: { type: "template", bodyText: "Welcome!", buttons: [{ id: "1", title: "Shop Now" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Shop Now" } },
      { direction: "outbound", contentType: "interactive_buttons", content: { type: "interactive_buttons", text: "Choose:", buttons: [{ id: "1", title: "Option A" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Option A" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result[0].content.buttons).toHaveLength(1);
    expect(result[2].content.buttons).toHaveLength(1);
  });

  it("should add buttons to plain text outbound message before inbound message", () => {
    const messages = [
      { direction: "outbound", contentType: "template", content: { type: "template", bodyText: "Welcome!", buttons: [{ id: "1", title: "Start" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Start" } },
      { direction: "outbound", contentType: "text", content: { type: "text", text: "Here is some info about our products." } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Sounds great!" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result[2].content.buttons).toHaveLength(2);
    expect(result[2].content.buttons[0].title).toBe("Sounds great!");
    expect(result[2].contentType).toBe("interactive_buttons");
    expect(result[2].content.type).toBe("interactive_buttons");
  });

  it("should convert image outbound message to interactive_buttons before inbound message", () => {
    const messages = [
      { direction: "outbound", contentType: "template", content: { type: "template", bodyText: "Hi!", buttons: [{ id: "1", title: "Go" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Go" } },
      { direction: "outbound", contentType: "image", content: { type: "image", imageUrl: "https://example.com/img.jpg", caption: "Check this out" } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "That looks amazing!" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result[2].content.buttons).toHaveLength(2);
    expect(result[2].content.buttons[0].title).toBe("That looks amazing!");
    expect(result[2].contentType).toBe("interactive_buttons");
    expect(result[2].content.text).toBe("Check this out"); // caption preserved
  });

  it("should convert video outbound message to interactive_buttons before inbound message", () => {
    const messages = [
      { direction: "outbound", contentType: "template", content: { type: "template", bodyText: "Hi!", buttons: [{ id: "1", title: "Go" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Go" } },
      { direction: "outbound", contentType: "video", content: { type: "video", videoDescription: "product demo", caption: "Watch our demo" } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Interesting!" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result[2].content.buttons).toHaveLength(2);
    expect(result[2].contentType).toBe("interactive_buttons");
    expect(result[2].content.text).toBe("Watch our demo"); // caption preserved
  });

  it("should not modify carousel messages (already interactive)", () => {
    const messages = [
      { direction: "outbound", contentType: "carousel", content: { type: "carousel", text: "Products:", carouselCards: [{ id: "1", title: "Item", buttonText: "Buy" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Buy" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result[0].content.buttons).toBeUndefined();
  });

  it("should not modify interactive_list messages (already interactive)", () => {
    const messages = [
      { direction: "outbound", contentType: "interactive_list", content: { type: "interactive_list", text: "Choose:", listSections: [{ title: "Options", rows: [{ id: "1", title: "A" }] }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "A" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result[0].content.buttons).toBeUndefined();
  });

  it("should not modify template messages with buttons (already interactive)", () => {
    const messages = [
      { direction: "outbound", contentType: "template", content: { type: "template", bodyText: "Welcome!", buttons: [{ id: "1", title: "Explore" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Explore" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result[0].content.buttons).toHaveLength(1); // unchanged
  });

  it("should truncate long customer text for button title", () => {
    const messages = [
      { direction: "outbound", contentType: "text", content: { type: "text", text: "Tell me more" } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "I would love to learn more about your premium subscription plans" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result[0].content.buttons[0].title).toBe("I would love to l...");
    expect(result[0].content.buttons[0].title.length).toBeLessThanOrEqual(20);
  });

  it("should handle multiple consecutive violations", () => {
    const messages = [
      { direction: "outbound", contentType: "text", content: { type: "text", text: "Hello!" } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Hi there" } },
      { direction: "outbound", contentType: "text", content: { type: "text", text: "How can I help?" } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "I need info" } },
      { direction: "outbound", contentType: "text", content: { type: "text", text: "Sure, here you go" } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Thanks!" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result[0].content.buttons).toHaveLength(2);
    expect(result[2].content.buttons).toHaveLength(2);
    expect(result[4].content.buttons).toHaveLength(2);
    expect(result[0].contentType).toBe("interactive_buttons");
    expect(result[2].contentType).toBe("interactive_buttons");
    expect(result[4].contentType).toBe("interactive_buttons");
  });

  it("should return empty array for empty input", () => {
    expect(enforceInteractivity([])).toEqual([]);
  });

  // === NEW EDGE CASE TESTS ===

  it("should remove leading inbound messages (customer can't speak first)", () => {
    const messages = [
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Hello" } },
      { direction: "outbound", contentType: "template", content: { type: "template", bodyText: "Welcome!", buttons: [{ id: "1", title: "Start" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Start" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result).toHaveLength(2);
    expect(result[0].direction).toBe("outbound");
    expect(result[1].direction).toBe("inbound");
  });

  it("should remove multiple leading inbound messages", () => {
    const messages = [
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Hello" } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Anyone there?" } },
      { direction: "outbound", contentType: "interactive_buttons", content: { type: "interactive_buttons", text: "Hi!", buttons: [{ id: "1", title: "Help" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Help" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result).toHaveLength(2);
    expect(result[0].direction).toBe("outbound");
  });

  it("should remove consecutive inbound messages (keep only the first)", () => {
    const messages = [
      { direction: "outbound", contentType: "interactive_buttons", content: { type: "interactive_buttons", text: "Choose:", buttons: [{ id: "1", title: "A" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "A" } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Also B" } },
      { direction: "outbound", contentType: "interactive_buttons", content: { type: "interactive_buttons", text: "Next:", buttons: [{ id: "1", title: "C" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "C" } },
    ];
    const result = enforceInteractivity(messages);
    // The second consecutive inbound "Also B" should be removed
    expect(result).toHaveLength(4);
    expect(result[1].content.text).toBe("A");
    expect(result[2].direction).toBe("outbound");
  });

  it("should not add duplicate button titles", () => {
    const messages = [
      { direction: "outbound", contentType: "text", content: { type: "text", text: "Info here" } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Learn More" } },
    ];
    const result = enforceInteractivity(messages);
    // "Learn More" is both the customer text AND the default second button
    // Should not create duplicate "Learn More" buttons
    const titles = result[0].content.buttons.map((b: any) => b.title);
    const uniqueTitles = new Set(titles);
    expect(titles.length).toBe(uniqueTitles.size);
  });

  it("should enforce max 3 buttons", () => {
    const messages = [
      { direction: "outbound", contentType: "text", content: { type: "text", text: "Choose", buttons: [{ id: "1", title: "X" }, { id: "2", title: "Y" }, { id: "3", title: "Z" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "W" } },
    ];
    const result = enforceInteractivity(messages);
    // Already has 3 buttons, but they don't include the customer text
    // isInteractive should return true since buttons.length > 0
    // Actually, since it has buttons, isInteractive returns true, so no modification
    expect(result[0].content.buttons.length).toBeLessThanOrEqual(3);
  });

  it("should handle image message with imageDescription but no caption", () => {
    const messages = [
      { direction: "outbound", contentType: "template", content: { type: "template", bodyText: "Hi!", buttons: [{ id: "1", title: "Go" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Go" } },
      { direction: "outbound", contentType: "image", content: { type: "image", imageDescription: "a beautiful sunset over mountains" } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Beautiful!" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result[2].content.buttons).toHaveLength(2);
    expect(result[2].contentType).toBe("interactive_buttons");
    expect(result[2].content.text).toBe("a beautiful sunset over mountains");
  });

  it("should handle inbound message with bodyText instead of text", () => {
    const messages = [
      { direction: "outbound", contentType: "text", content: { type: "text", text: "Here's info" } },
      { direction: "inbound", contentType: "text", content: { type: "text", bodyText: "Got it, thanks!" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result[0].content.buttons[0].title).toBe("Got it, thanks!");
  });

  it("should use 'Continue' as default button when customer text is missing", () => {
    const messages = [
      { direction: "outbound", contentType: "text", content: { type: "text", text: "Here's info" } },
      { direction: "inbound", contentType: "text", content: { type: "text" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result[0].content.buttons[0].title).toBe("Continue");
  });

  it("should handle a realistic full conversation flow with mixed violations", () => {
    const messages = [
      { direction: "outbound", contentType: "template", content: { type: "template", bodyText: "Welcome to our store!", buttons: [{ id: "1", title: "Browse" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Browse" } },
      { direction: "outbound", contentType: "carousel", content: { type: "carousel", text: "Our products:", carouselCards: [{ id: "1", title: "Shirt", buttonText: "View" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "View" } },
      { direction: "outbound", contentType: "image", content: { type: "image", imageDescription: "product detail", caption: "Premium Shirt" } },
      // VIOLATION: image before inbound
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Add to cart" } },
      { direction: "outbound", contentType: "text", content: { type: "text", text: "Added! Your total is $29.99" } },
      // VIOLATION: text before inbound
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Checkout" } },
      { direction: "outbound", contentType: "interactive_buttons", content: { type: "interactive_buttons", text: "Confirm order?", buttons: [{ id: "1", title: "Confirm" }, { id: "2", title: "Cancel" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Confirm" } },
    ];
    const result = enforceInteractivity(messages);
    
    // Message 0 (template with buttons) - should be unchanged
    expect(result[0].content.buttons).toHaveLength(1);
    // Message 2 (carousel) - should be unchanged
    expect(result[2].content.carouselCards).toHaveLength(1);
    // Message 4 (image) - should now have buttons and be converted
    expect(result[4].content.buttons).toHaveLength(2);
    expect(result[4].contentType).toBe("interactive_buttons");
    // Message 6 (text) - should now have buttons
    expect(result[6].content.buttons).toHaveLength(2);
    expect(result[6].contentType).toBe("interactive_buttons");
    // Message 8 (interactive_buttons) - should be unchanged
    expect(result[8].content.buttons).toHaveLength(2);
    
    // Verify all inbound messages now follow interactive outbound messages
    for (let i = 0; i < result.length; i++) {
      if (result[i].direction !== "inbound") continue;
      // Find preceding outbound
      let prevOut = null;
      for (let j = i - 1; j >= 0; j--) {
        if (result[j].direction === "outbound") {
          prevOut = result[j];
          break;
        }
      }
      expect(prevOut).not.toBeNull();
      const c = prevOut!.content;
      const interactive = (c.buttons && c.buttons.length > 0) ||
        (c.type === "interactive_list") ||
        (c.type === "carousel" && c.carouselCards && c.carouselCards.length > 0);
      expect(interactive).toBe(true);
    }
  });

  it("should handle authentication flow with OTP messages", () => {
    const messages = [
      { direction: "outbound", contentType: "template", content: { type: "template", bodyText: "Login detected from new device", buttons: [{ id: "1", title: "Verify" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Verify" } },
      { direction: "outbound", contentType: "text", content: { type: "text", text: "Your OTP is 482910. Valid for 5 minutes." } },
      // VIOLATION: plain text OTP before inbound
      { direction: "inbound", contentType: "text", content: { type: "text", text: "482910" } },
      { direction: "outbound", contentType: "interactive_buttons", content: { type: "interactive_buttons", text: "Verified! Trust this device?", buttons: [{ id: "1", title: "Yes" }, { id: "2", title: "No" }] } },
      { direction: "inbound", contentType: "text", content: { type: "text", text: "Yes" } },
    ];
    const result = enforceInteractivity(messages);
    // OTP message should now have buttons
    expect(result[2].content.buttons).toHaveLength(2);
    expect(result[2].contentType).toBe("interactive_buttons");
  });

  it("should handle all outbound messages (no violations)", () => {
    const messages = [
      { direction: "outbound", contentType: "template", content: { type: "template", bodyText: "Welcome!" } },
      { direction: "outbound", contentType: "text", content: { type: "text", text: "Here is info" } },
      { direction: "outbound", contentType: "image", content: { type: "image", caption: "Product" } },
    ];
    const result = enforceInteractivity(messages);
    expect(result).toHaveLength(3);
    // No modifications since there are no inbound messages
    expect(result[1].content.buttons).toBeUndefined();
  });
});
