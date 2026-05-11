import { describe, it, expect } from "vitest";

/**
 * Tests to verify the image loading detection logic used in Builder.tsx
 * to auto-detect pending images and start polling for updates.
 */

// Replicate the hasPendingImages detection logic from Builder.tsx
function hasPendingImages(messages: any[]): boolean {
  return messages.some((m: any) => {
    const c = m.content;
    if (!c) return false;
    // Image message with description but no URL
    if (c.imageDescription && !c.imageUrl) return true;
    // Template header with GENERATE_IMAGE prefix
    if (c.headerImageUrl && typeof c.headerImageUrl === "string" && c.headerImageUrl.startsWith("GENERATE_IMAGE:")) return true;
    // Video with description but no poster
    if (c.videoDescription && !c.videoPosterUrl) return true;
    // Carousel cards with description but no URL
    if (c.carouselCards && Array.isArray(c.carouselCards)) {
      return c.carouselCards.some((card: any) => card.imageDescription && !card.imageUrl);
    }
    return false;
  });
}

describe("Image Loading Detection", () => {
  describe("hasPendingImages", () => {
    it("should return false for empty messages", () => {
      expect(hasPendingImages([])).toBe(false);
    });

    it("should return false for text-only messages", () => {
      const messages = [
        { content: { type: "text", text: "Hello" } },
        { content: { type: "text", text: "World" } },
      ];
      expect(hasPendingImages(messages)).toBe(false);
    });

    it("should return false for messages with loaded images", () => {
      const messages = [
        {
          content: {
            type: "image",
            imageUrl: "https://example.com/image.jpg",
            imageDescription: "A product photo",
          },
        },
      ];
      expect(hasPendingImages(messages)).toBe(false);
    });

    it("should return true for image message with description but no URL", () => {
      const messages = [
        {
          content: {
            type: "image",
            imageDescription: "A product photo",
            imageUrl: undefined,
          },
        },
      ];
      expect(hasPendingImages(messages)).toBe(true);
    });

    it("should return true for image message with description and empty URL", () => {
      const messages = [
        {
          content: {
            type: "image",
            imageDescription: "A product photo",
            imageUrl: "",
          },
        },
      ];
      expect(hasPendingImages(messages)).toBe(true);
    });

    it("should return true for template with GENERATE_IMAGE header", () => {
      const messages = [
        {
          content: {
            type: "template",
            headerImageUrl: "GENERATE_IMAGE: a professional headshot",
            bodyText: "Some text",
          },
        },
      ];
      expect(hasPendingImages(messages)).toBe(true);
    });

    it("should return false for template with actual header image URL", () => {
      const messages = [
        {
          content: {
            type: "template",
            headerImageUrl: "https://example.com/header.jpg",
            bodyText: "Some text",
          },
        },
      ];
      expect(hasPendingImages(messages)).toBe(false);
    });

    it("should return true for video with description but no poster", () => {
      const messages = [
        {
          content: {
            type: "video",
            videoDescription: "A product demo video",
            videoPosterUrl: undefined,
          },
        },
      ];
      expect(hasPendingImages(messages)).toBe(true);
    });

    it("should return false for video with poster URL", () => {
      const messages = [
        {
          content: {
            type: "video",
            videoDescription: "A product demo video",
            videoPosterUrl: "https://example.com/poster.jpg",
          },
        },
      ];
      expect(hasPendingImages(messages)).toBe(false);
    });

    it("should return true for carousel with card missing imageUrl", () => {
      const messages = [
        {
          content: {
            type: "carousel",
            carouselCards: [
              { id: "1", title: "Product 1", imageUrl: "https://example.com/1.jpg" },
              { id: "2", title: "Product 2", imageDescription: "A nice product", imageUrl: undefined },
            ],
          },
        },
      ];
      expect(hasPendingImages(messages)).toBe(true);
    });

    it("should return false for carousel with all cards having imageUrl", () => {
      const messages = [
        {
          content: {
            type: "carousel",
            carouselCards: [
              { id: "1", title: "Product 1", imageUrl: "https://example.com/1.jpg" },
              { id: "2", title: "Product 2", imageUrl: "https://example.com/2.jpg", imageDescription: "A nice product" },
            ],
          },
        },
      ];
      expect(hasPendingImages(messages)).toBe(false);
    });

    it("should return true if any message in the array has pending images", () => {
      const messages = [
        { content: { type: "text", text: "Hello" } },
        { content: { type: "image", imageUrl: "https://example.com/loaded.jpg" } },
        { content: { type: "image", imageDescription: "Pending image" } },
        { content: { type: "text", text: "Goodbye" } },
      ];
      expect(hasPendingImages(messages)).toBe(true);
    });

    it("should handle null content gracefully", () => {
      const messages = [
        { content: null },
        { content: { type: "text", text: "Hello" } },
      ];
      expect(hasPendingImages(messages)).toBe(false);
    });

    it("should handle carousel cards with empty imageDescription", () => {
      const messages = [
        {
          content: {
            type: "carousel",
            carouselCards: [
              { id: "1", title: "Product 1", imageDescription: "", imageUrl: undefined },
            ],
          },
        },
      ];
      // Empty imageDescription is falsy, so should not trigger
      expect(hasPendingImages(messages)).toBe(false);
    });

    it("should detect mixed pending scenarios", () => {
      // Template with GENERATE_IMAGE + loaded image + carousel with pending
      const messages = [
        {
          content: {
            type: "template",
            headerImageUrl: "https://example.com/loaded.jpg",
            bodyText: "Template text",
          },
        },
        {
          content: {
            type: "carousel",
            carouselCards: [
              { id: "1", title: "P1", imageUrl: "https://example.com/1.jpg" },
              { id: "2", title: "P2", imageDescription: "pending card image" },
            ],
          },
        },
      ];
      expect(hasPendingImages(messages)).toBe(true);
    });
  });
});

describe("Image Generation Pipeline", () => {
  // These tests verify the image generation job detection logic
  // used in server/routers.ts generateImagesForMessages

  function detectImageJobs(messages: any[]): Array<{ msgIdx: number; cardIdx?: number; field: string; description: string }> {
    const imageJobs: Array<{ msgIdx: number; cardIdx?: number; field: string; description: string }> = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const content = msg.content;

      // Template header image with GENERATE_IMAGE: prefix
      if (content.headerImageUrl && content.headerImageUrl.startsWith("GENERATE_IMAGE:")) {
        const desc = content.headerImageUrl.replace("GENERATE_IMAGE:", "").trim();
        imageJobs.push({ msgIdx: i, field: "headerImageUrl", description: desc });
      }

      // Image message with imageDescription
      if (content.imageDescription) {
        imageJobs.push({ msgIdx: i, field: "imageUrl", description: content.imageDescription });
      }

      // Video message with videoDescription
      if (content.videoDescription) {
        imageJobs.push({ msgIdx: i, field: "videoPosterUrl", description: `video thumbnail: ${content.videoDescription}` });
      }

      // Carousel cards with imageDescription
      if (content.carouselCards && Array.isArray(content.carouselCards)) {
        for (let j = 0; j < content.carouselCards.length; j++) {
          const card = content.carouselCards[j];
          if (card.imageDescription) {
            imageJobs.push({ msgIdx: i, cardIdx: j, field: "imageUrl", description: card.imageDescription });
          }
        }
      }
    }

    return imageJobs;
  }

  it("should detect no jobs for text-only messages", () => {
    const messages = [{ content: { type: "text", text: "Hello" } }];
    expect(detectImageJobs(messages)).toHaveLength(0);
  });

  it("should detect image job for imageDescription", () => {
    const messages = [{ content: { type: "image", imageDescription: "A product photo" } }];
    const jobs = detectImageJobs(messages);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toEqual({ msgIdx: 0, field: "imageUrl", description: "A product photo" });
  });

  it("should detect header image job for GENERATE_IMAGE prefix", () => {
    const messages = [{ content: { type: "template", headerImageUrl: "GENERATE_IMAGE: a headshot" } }];
    const jobs = detectImageJobs(messages);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toEqual({ msgIdx: 0, field: "headerImageUrl", description: "a headshot" });
  });

  it("should detect video poster job", () => {
    const messages = [{ content: { type: "video", videoDescription: "product demo" } }];
    const jobs = detectImageJobs(messages);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].field).toBe("videoPosterUrl");
    expect(jobs[0].description).toContain("product demo");
  });

  it("should detect carousel card image jobs", () => {
    const messages = [{
      content: {
        type: "carousel",
        carouselCards: [
          { id: "1", title: "P1", imageDescription: "product 1 photo" },
          { id: "2", title: "P2", imageUrl: "https://existing.jpg" },
          { id: "3", title: "P3", imageDescription: "product 3 photo" },
        ],
      },
    }];
    const jobs = detectImageJobs(messages);
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toEqual({ msgIdx: 0, cardIdx: 0, field: "imageUrl", description: "product 1 photo" });
    expect(jobs[1]).toEqual({ msgIdx: 0, cardIdx: 2, field: "imageUrl", description: "product 3 photo" });
  });

  it("should detect multiple job types across messages", () => {
    const messages = [
      { content: { type: "template", headerImageUrl: "GENERATE_IMAGE: banner" } },
      { content: { type: "text", text: "Hello" } },
      { content: { type: "image", imageDescription: "product shot" } },
      { content: { type: "video", videoDescription: "demo video" } },
      {
        content: {
          type: "carousel",
          carouselCards: [
            { id: "1", title: "P1", imageDescription: "card image" },
          ],
        },
      },
    ];
    const jobs = detectImageJobs(messages);
    expect(jobs).toHaveLength(4);
    expect(jobs.map(j => j.field)).toEqual(["headerImageUrl", "imageUrl", "videoPosterUrl", "imageUrl"]);
  });
});
