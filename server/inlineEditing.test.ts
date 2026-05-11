import { describe, it, expect } from "vitest";
import type { MessageContent } from "../shared/types";

// ==================== Inline Editing Logic Tests ====================
// These tests validate the content update logic that powers inline editing
// on the WhatsApp mockup. The actual UI is in React components, but the
// data transformation logic can be tested independently.

// Simulate the onMessageEdit handler logic from Builder.tsx
function applyTextEdit(content: MessageContent, field: string, newValue: string): MessageContent {
  const updated = { ...content };
  
  // Handle button edits: button-{index}
  if (field.startsWith("button-")) {
    const idx = parseInt(field.split("-")[1]);
    if (updated.buttons?.[idx]) {
      updated.buttons = updated.buttons.map((b, i) =>
        i === idx ? { ...b, title: newValue } : b
      );
    }
    return updated;
  }
  
  // Handle list row edits: listRow-{sectionIdx}-{rowIdx}
  if (field.startsWith("listRow-")) {
    const parts = field.split("-");
    const sIdx = parseInt(parts[1]);
    const rIdx = parseInt(parts[2]);
    if (updated.listSections?.[sIdx]?.rows?.[rIdx]) {
      updated.listSections = updated.listSections.map((s, si) =>
        si === sIdx
          ? {
              ...s,
              rows: s.rows.map((r, ri) =>
                ri === rIdx ? { ...r, title: newValue } : r
              ),
            }
          : s
      );
    }
    return updated;
  }
  
  // Direct field edits
  (updated as any)[field] = newValue;
  return updated;
}

// Simulate the onMessageImageUpload handler logic from Builder.tsx
function applyImageUpload(content: MessageContent, field: string, imageUrl: string): MessageContent {
  const updated = { ...content };
  
  // Handle carousel card image fields: card-idx-imageUrl
  if (field.startsWith("card-")) {
    const parts = field.split("-");
    const cardIdx = parseInt(parts[1]);
    const cardField = parts[2];
    if (updated.carouselCards?.[cardIdx]) {
      updated.carouselCards = updated.carouselCards.map((c, ci) =>
        ci === cardIdx ? { ...c, [cardField]: imageUrl } : c
      );
    }
    return updated;
  }
  
  // Direct field: headerImageUrl, imageUrl, videoPosterUrl
  (updated as any)[field] = imageUrl;
  return updated;
}

// Simulate carousel card text edit logic from CarouselScroller
function applyCarouselCardEdit(content: MessageContent, field: string, newValue: string): MessageContent {
  const updated = { ...content };
  const parts = field.split("-");
  const cardIdx = parseInt(parts[1]);
  const cardField = parts[2];
  if (updated.carouselCards?.[cardIdx]) {
    updated.carouselCards = updated.carouselCards.map((c, ci) =>
      ci === cardIdx ? { ...c, [cardField]: newValue } : c
    );
  }
  return updated;
}

describe("Inline Text Editing", () => {
  it("should edit template bodyText", () => {
    const content: MessageContent = {
      type: "template",
      headerText: "Welcome!",
      bodyText: "Original body text",
      footerText: "Footer",
      buttons: [{ id: "1", title: "Click me" }],
    };
    const result = applyTextEdit(content, "bodyText", "Updated body text");
    expect(result.bodyText).toBe("Updated body text");
    expect(result.headerText).toBe("Welcome!");
    expect(result.footerText).toBe("Footer");
  });

  it("should edit template headerText", () => {
    const content: MessageContent = {
      type: "template",
      headerText: "Old Header",
      bodyText: "Body",
    };
    const result = applyTextEdit(content, "headerText", "New Header");
    expect(result.headerText).toBe("New Header");
    expect(result.bodyText).toBe("Body");
  });

  it("should edit template footerText", () => {
    const content: MessageContent = {
      type: "template",
      bodyText: "Body",
      footerText: "Old Footer",
    };
    const result = applyTextEdit(content, "footerText", "New Footer");
    expect(result.footerText).toBe("New Footer");
  });

  it("should edit button title by index", () => {
    const content: MessageContent = {
      type: "template",
      bodyText: "Body",
      buttons: [
        { id: "b1", title: "Button 1" },
        { id: "b2", title: "Button 2" },
        { id: "b3", title: "Button 3" },
      ],
    };
    const result = applyTextEdit(content, "button-1", "Updated Button 2");
    expect(result.buttons![0].title).toBe("Button 1");
    expect(result.buttons![1].title).toBe("Updated Button 2");
    expect(result.buttons![2].title).toBe("Button 3");
  });

  it("should edit interactive_buttons text", () => {
    const content: MessageContent = {
      type: "interactive_buttons",
      text: "Choose an option:",
      buttons: [{ id: "opt1", title: "Option A" }],
    };
    const result = applyTextEdit(content, "text", "Pick one:");
    expect(result.text).toBe("Pick one:");
    expect(result.buttons![0].title).toBe("Option A");
  });

  it("should edit interactive_list text", () => {
    const content: MessageContent = {
      type: "interactive_list",
      text: "Browse options:",
      listButtonText: "View",
      listSections: [
        { title: "Section", rows: [{ id: "r1", title: "Row 1", description: "" }] },
      ],
    };
    const result = applyTextEdit(content, "text", "Updated list text");
    expect(result.text).toBe("Updated list text");
    expect(result.listButtonText).toBe("View");
  });

  it("should edit listButtonText", () => {
    const content: MessageContent = {
      type: "interactive_list",
      text: "Text",
      listButtonText: "Select",
      listSections: [
        { title: "Section", rows: [{ id: "r1", title: "Row 1", description: "" }] },
      ],
    };
    const result = applyTextEdit(content, "listButtonText", "Choose");
    expect(result.listButtonText).toBe("Choose");
  });

  it("should edit list row title", () => {
    const content: MessageContent = {
      type: "interactive_list",
      text: "Text",
      listButtonText: "Select",
      listSections: [
        {
          title: "Section 1",
          rows: [
            { id: "r1", title: "Row 1", description: "Desc 1" },
            { id: "r2", title: "Row 2", description: "Desc 2" },
          ],
        },
        {
          title: "Section 2",
          rows: [
            { id: "r3", title: "Row 3", description: "Desc 3" },
          ],
        },
      ],
    };
    const result = applyTextEdit(content, "listRow-0-1", "Updated Row 2");
    expect(result.listSections![0].rows[0].title).toBe("Row 1");
    expect(result.listSections![0].rows[1].title).toBe("Updated Row 2");
    expect(result.listSections![1].rows[0].title).toBe("Row 3");
  });

  it("should edit default text message", () => {
    const content: MessageContent = {
      type: "text",
      text: "Hello there!",
    };
    const result = applyTextEdit(content, "text", "Hi!");
    expect(result.text).toBe("Hi!");
  });

  it("should edit image caption", () => {
    const content: MessageContent = {
      type: "image",
      imageUrl: "https://example.com/img.jpg",
      caption: "Old caption",
    };
    const result = applyTextEdit(content, "caption", "New caption");
    expect(result.caption).toBe("New caption");
    expect(result.imageUrl).toBe("https://example.com/img.jpg");
  });

  it("should edit video caption", () => {
    const content: MessageContent = {
      type: "video",
      videoUrl: "https://example.com/vid.mp4",
      caption: "Old caption",
    };
    const result = applyTextEdit(content, "caption", "New video caption");
    expect(result.caption).toBe("New video caption");
  });

  it("should edit carousel intro text", () => {
    const content: MessageContent = {
      type: "carousel",
      text: "Check out our products:",
      carouselCards: [
        { id: "c1", title: "Product 1", description: "", price: "$10", buttonText: "Buy", imageUrl: "" },
      ],
    };
    const result = applyTextEdit(content, "text", "Browse our catalog:");
    expect(result.text).toBe("Browse our catalog:");
    expect(result.carouselCards![0].title).toBe("Product 1");
  });
});

describe("Inline Image Upload", () => {
  it("should update template headerImageUrl", () => {
    const content: MessageContent = {
      type: "template",
      headerImageUrl: "https://old.com/img.jpg",
      bodyText: "Body",
    };
    const result = applyImageUpload(content, "headerImageUrl", "https://new.com/img.jpg");
    expect(result.headerImageUrl).toBe("https://new.com/img.jpg");
    expect(result.bodyText).toBe("Body");
  });

  it("should update image message imageUrl", () => {
    const content: MessageContent = {
      type: "image",
      imageUrl: "https://old.com/img.jpg",
      caption: "Caption",
    };
    const result = applyImageUpload(content, "imageUrl", "https://new.com/photo.png");
    expect(result.imageUrl).toBe("https://new.com/photo.png");
    expect(result.caption).toBe("Caption");
  });

  it("should update video poster image", () => {
    const content: MessageContent = {
      type: "video",
      videoUrl: "https://example.com/vid.mp4",
      videoPosterUrl: "https://old.com/poster.jpg",
      caption: "Video caption",
    };
    const result = applyImageUpload(content, "videoPosterUrl", "https://new.com/poster.png");
    expect(result.videoPosterUrl).toBe("https://new.com/poster.png");
    expect(result.videoUrl).toBe("https://example.com/vid.mp4");
  });

  it("should update carousel card image by index", () => {
    const content: MessageContent = {
      type: "carousel",
      text: "Products",
      carouselCards: [
        { id: "c1", title: "Product 1", description: "", price: "$10", buttonText: "Buy", imageUrl: "https://old.com/1.jpg" },
        { id: "c2", title: "Product 2", description: "", price: "$20", buttonText: "Buy", imageUrl: "https://old.com/2.jpg" },
        { id: "c3", title: "Product 3", description: "", price: "$30", buttonText: "Buy", imageUrl: "https://old.com/3.jpg" },
      ],
    };
    const result = applyImageUpload(content, "card-1-imageUrl", "https://new.com/product2.png");
    expect(result.carouselCards![0].imageUrl).toBe("https://old.com/1.jpg");
    expect(result.carouselCards![1].imageUrl).toBe("https://new.com/product2.png");
    expect(result.carouselCards![2].imageUrl).toBe("https://old.com/3.jpg");
  });

  it("should handle card image upload for first card", () => {
    const content: MessageContent = {
      type: "carousel",
      text: "Products",
      carouselCards: [
        { id: "c1", title: "Product 1", description: "", price: "$10", buttonText: "Buy", imageUrl: "" },
      ],
    };
    const result = applyImageUpload(content, "card-0-imageUrl", "https://cdn.com/new.jpg");
    expect(result.carouselCards![0].imageUrl).toBe("https://cdn.com/new.jpg");
  });
});

describe("Carousel Card Text Editing", () => {
  it("should edit card title", () => {
    const content: MessageContent = {
      type: "carousel",
      text: "Products",
      carouselCards: [
        { id: "c1", title: "Old Title", description: "Desc", price: "$10", buttonText: "Buy", imageUrl: "" },
      ],
    };
    const result = applyCarouselCardEdit(content, "card-0-title", "New Title");
    expect(result.carouselCards![0].title).toBe("New Title");
    expect(result.carouselCards![0].description).toBe("Desc");
  });

  it("should edit card description", () => {
    const content: MessageContent = {
      type: "carousel",
      text: "Products",
      carouselCards: [
        { id: "c1", title: "Title", description: "Old Desc", price: "$10", buttonText: "Buy", imageUrl: "" },
      ],
    };
    const result = applyCarouselCardEdit(content, "card-0-description", "New Description");
    expect(result.carouselCards![0].description).toBe("New Description");
    expect(result.carouselCards![0].title).toBe("Title");
  });

  it("should edit card price", () => {
    const content: MessageContent = {
      type: "carousel",
      text: "Products",
      carouselCards: [
        { id: "c1", title: "Title", description: "Desc", price: "$10.00", buttonText: "Buy", imageUrl: "" },
      ],
    };
    const result = applyCarouselCardEdit(content, "card-0-price", "$25.99");
    expect(result.carouselCards![0].price).toBe("$25.99");
  });

  it("should edit card buttonText", () => {
    const content: MessageContent = {
      type: "carousel",
      text: "Products",
      carouselCards: [
        { id: "c1", title: "Title", description: "Desc", price: "$10", buttonText: "Buy Now", imageUrl: "" },
      ],
    };
    const result = applyCarouselCardEdit(content, "card-0-buttonText", "Add to Cart");
    expect(result.carouselCards![0].buttonText).toBe("Add to Cart");
  });

  it("should only edit the targeted card in a multi-card carousel", () => {
    const content: MessageContent = {
      type: "carousel",
      text: "Products",
      carouselCards: [
        { id: "c1", title: "Card 1", description: "", price: "$10", buttonText: "Buy", imageUrl: "" },
        { id: "c2", title: "Card 2", description: "", price: "$20", buttonText: "Buy", imageUrl: "" },
        { id: "c3", title: "Card 3", description: "", price: "$30", buttonText: "Buy", imageUrl: "" },
      ],
    };
    const result = applyCarouselCardEdit(content, "card-1-title", "Updated Card 2");
    expect(result.carouselCards![0].title).toBe("Card 1");
    expect(result.carouselCards![1].title).toBe("Updated Card 2");
    expect(result.carouselCards![2].title).toBe("Card 3");
  });
});

describe("Edge Cases", () => {
  it("should handle editing when buttons array is empty", () => {
    const content: MessageContent = {
      type: "template",
      bodyText: "Body",
      buttons: [],
    };
    const result = applyTextEdit(content, "button-0", "New Button");
    expect(result.buttons).toEqual([]);
  });

  it("should handle editing when listSections is undefined", () => {
    const content: MessageContent = {
      type: "interactive_list",
      text: "Text",
      listButtonText: "Select",
    };
    const result = applyTextEdit(content, "listRow-0-0", "New Row");
    // Should not crash, listSections stays undefined
    expect(result.listSections).toBeUndefined();
  });

  it("should handle card edit with out-of-bounds index", () => {
    const content: MessageContent = {
      type: "carousel",
      text: "Products",
      carouselCards: [
        { id: "c1", title: "Card 1", description: "", price: "$10", buttonText: "Buy", imageUrl: "" },
      ],
    };
    const result = applyCarouselCardEdit(content, "card-5-title", "Ghost Card");
    // Should not crash, card at index 5 doesn't exist
    expect(result.carouselCards![0].title).toBe("Card 1");
    expect(result.carouselCards!.length).toBe(1);
  });

  it("should handle image upload to non-existent carousel card", () => {
    const content: MessageContent = {
      type: "carousel",
      text: "Products",
      carouselCards: [
        { id: "c1", title: "Card 1", description: "", price: "$10", buttonText: "Buy", imageUrl: "" },
      ],
    };
    const result = applyImageUpload(content, "card-99-imageUrl", "https://new.com/img.jpg");
    expect(result.carouselCards![0].imageUrl).toBe("");
  });

  it("should preserve all other fields when editing one field", () => {
    const content: MessageContent = {
      type: "template",
      headerText: "Header",
      headerImageUrl: "https://example.com/img.jpg",
      bodyText: "Body text here",
      footerText: "Footer text",
      buttons: [
        { id: "b1", title: "Button 1" },
        { id: "b2", title: "Button 2" },
      ],
    };
    const result = applyTextEdit(content, "bodyText", "New body");
    expect(result.type).toBe("template");
    expect(result.headerText).toBe("Header");
    expect(result.headerImageUrl).toBe("https://example.com/img.jpg");
    expect(result.bodyText).toBe("New body");
    expect(result.footerText).toBe("Footer text");
    expect(result.buttons!.length).toBe(2);
    expect(result.buttons![0].title).toBe("Button 1");
    expect(result.buttons![1].title).toBe("Button 2");
  });

  it("should handle empty string edits", () => {
    const content: MessageContent = {
      type: "text",
      text: "Hello!",
    };
    const result = applyTextEdit(content, "text", "");
    expect(result.text).toBe("");
  });

  it("should handle special characters in text edits", () => {
    const content: MessageContent = {
      type: "text",
      text: "Hello!",
    };
    const result = applyTextEdit(content, "text", "Hello *bold* _italic_ ~strike~ 🎉");
    expect(result.text).toBe("Hello *bold* _italic_ ~strike~ 🎉");
  });

  it("should handle multiline text edits", () => {
    const content: MessageContent = {
      type: "template",
      bodyText: "Single line",
    };
    const result = applyTextEdit(content, "bodyText", "Line 1\nLine 2\nLine 3");
    expect(result.bodyText).toBe("Line 1\nLine 2\nLine 3");
  });
});
