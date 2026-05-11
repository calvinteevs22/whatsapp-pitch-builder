import { describe, it, expect } from "vitest";

/**
 * Tests for the injectClientAssets function.
 * We import the function indirectly by testing the logic patterns.
 * Since injectClientAssets is a private function in routers.ts, we replicate the logic here for testing.
 */

// Replicate the injectClientAssets logic for testing
function injectClientAssets(
  messages: any[],
  assets: Array<{ url: string; name: string; type: string }>
): void {
  const imageAssets = assets.filter(a => a.type === "image");
  const videoAssets = assets.filter(a => a.type === "video");
  let imageIdx = 0;
  let videoIdx = 0;

  // Pass 1: Template headers — use first client image
  for (const msg of messages) {
    const c = msg.content;
    if (!c) continue;
    if (c.headerImageUrl && imageIdx < imageAssets.length) {
      c.headerImageUrl = imageAssets[imageIdx].url;
      c._clientAsset = true;
      imageIdx++;
    }
  }

  // Pass 2: Carousel cards — distribute images across cards
  for (const msg of messages) {
    const c = msg.content;
    if (!c || !c.carouselCards || !Array.isArray(c.carouselCards)) continue;
    for (const card of c.carouselCards) {
      if (imageIdx < imageAssets.length) {
        card.imageUrl = imageAssets[imageIdx].url;
        card._clientAsset = true;
        delete card.imageDescription;
        imageIdx++;
      }
    }
  }

  // Pass 3: Standalone image messages — use remaining images
  for (const msg of messages) {
    const c = msg.content;
    if (!c) continue;
    if ((c.type === "image" || c.imageDescription || c.imageUrl) && imageIdx < imageAssets.length) {
      if (!c._clientAsset) {
        c.imageUrl = imageAssets[imageIdx].url;
        c._clientAsset = true;
        delete c.imageDescription;
        imageIdx++;
      }
    }
  }

  // Pass 4: Video messages — inject client videos
  for (const msg of messages) {
    const c = msg.content;
    if (!c) continue;
    if ((c.type === "video" || c.videoUrl || c.videoDescription) && videoIdx < videoAssets.length) {
      c.videoUrl = videoAssets[videoIdx].url;
      c._clientAsset = true;
      delete c.videoDescription;
      videoIdx++;
    }
  }
}

describe("Client Asset Injection", () => {
  describe("Image injection priority", () => {
    it("should inject first image into template header", () => {
      const messages = [
        {
          content: {
            type: "template",
            headerImageUrl: "GENERATE_IMAGE:some description",
            bodyText: "Welcome!",
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/logo.jpg", name: "logo.jpg", type: "image" },
      ];
      injectClientAssets(messages, assets);
      expect(messages[0].content.headerImageUrl).toBe("https://s3.example.com/logo.jpg");
      expect(messages[0].content._clientAsset).toBe(true);
    });

    it("should inject images into carousel cards after header", () => {
      const messages = [
        {
          content: {
            type: "template",
            headerImageUrl: "GENERATE_IMAGE:hero",
            bodyText: "Check out our products",
          },
        },
        {
          content: {
            type: "carousel",
            carouselCards: [
              { title: "Product A", imageDescription: "A nice product", imageUrl: "" },
              { title: "Product B", imageDescription: "Another product", imageUrl: "" },
              { title: "Product C", imageDescription: "Third product", imageUrl: "" },
            ],
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/hero.jpg", name: "hero.jpg", type: "image" },
        { url: "https://s3.example.com/prod1.jpg", name: "prod1.jpg", type: "image" },
        { url: "https://s3.example.com/prod2.jpg", name: "prod2.jpg", type: "image" },
        { url: "https://s3.example.com/prod3.jpg", name: "prod3.jpg", type: "image" },
      ];
      injectClientAssets(messages, assets);
      expect(messages[0].content.headerImageUrl).toBe("https://s3.example.com/hero.jpg");
      expect(messages[1].content.carouselCards[0].imageUrl).toBe("https://s3.example.com/prod1.jpg");
      expect(messages[1].content.carouselCards[1].imageUrl).toBe("https://s3.example.com/prod2.jpg");
      expect(messages[1].content.carouselCards[2].imageUrl).toBe("https://s3.example.com/prod3.jpg");
    });

    it("should inject remaining images into standalone image messages", () => {
      const messages = [
        {
          content: {
            type: "image",
            imageDescription: "A beautiful sunset",
            imageUrl: "",
          },
        },
        {
          content: {
            type: "image",
            imageDescription: "A mountain view",
            imageUrl: "",
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/sunset.jpg", name: "sunset.jpg", type: "image" },
        { url: "https://s3.example.com/mountain.jpg", name: "mountain.jpg", type: "image" },
      ];
      injectClientAssets(messages, assets);
      expect(messages[0].content.imageUrl).toBe("https://s3.example.com/sunset.jpg");
      expect(messages[1].content.imageUrl).toBe("https://s3.example.com/mountain.jpg");
      // imageDescription should be cleared
      expect(messages[0].content.imageDescription).toBeUndefined();
      expect(messages[1].content.imageDescription).toBeUndefined();
    });

    it("should clear imageDescription when client asset is injected", () => {
      const messages = [
        {
          content: {
            type: "carousel",
            carouselCards: [
              { title: "Product", imageDescription: "AI generated desc", imageUrl: "" },
            ],
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/product.jpg", name: "product.jpg", type: "image" },
      ];
      injectClientAssets(messages, assets);
      expect(messages[0].content.carouselCards[0].imageUrl).toBe("https://s3.example.com/product.jpg");
      expect(messages[0].content.carouselCards[0].imageDescription).toBeUndefined();
    });
  });

  describe("Video injection", () => {
    it("should inject videos into video messages", () => {
      const messages = [
        {
          content: {
            type: "video",
            videoDescription: "A product demo video",
            videoUrl: "",
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/demo.mp4", name: "demo.mp4", type: "video" },
      ];
      injectClientAssets(messages, assets);
      expect(messages[0].content.videoUrl).toBe("https://s3.example.com/demo.mp4");
      expect(messages[0].content.videoDescription).toBeUndefined();
      expect(messages[0].content._clientAsset).toBe(true);
    });

    it("should handle mixed image and video assets", () => {
      const messages = [
        {
          content: {
            type: "template",
            headerImageUrl: "GENERATE_IMAGE:hero",
            bodyText: "Welcome",
          },
        },
        {
          content: {
            type: "video",
            videoDescription: "Product walkthrough",
            videoUrl: "",
          },
        },
        {
          content: {
            type: "image",
            imageDescription: "Store front",
            imageUrl: "",
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/hero.jpg", name: "hero.jpg", type: "image" },
        { url: "https://s3.example.com/store.jpg", name: "store.jpg", type: "image" },
        { url: "https://s3.example.com/walkthrough.mp4", name: "walkthrough.mp4", type: "video" },
      ];
      injectClientAssets(messages, assets);
      expect(messages[0].content.headerImageUrl).toBe("https://s3.example.com/hero.jpg");
      expect(messages[1].content.videoUrl).toBe("https://s3.example.com/walkthrough.mp4");
      expect(messages[2].content.imageUrl).toBe("https://s3.example.com/store.jpg");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty assets array gracefully", () => {
      const messages = [
        {
          content: {
            type: "template",
            headerImageUrl: "GENERATE_IMAGE:hero",
            bodyText: "Welcome",
          },
        },
      ];
      injectClientAssets(messages, []);
      expect(messages[0].content.headerImageUrl).toBe("GENERATE_IMAGE:hero");
    });

    it("should handle more images than slots", () => {
      const messages = [
        {
          content: {
            type: "image",
            imageDescription: "Only one slot",
            imageUrl: "",
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/img1.jpg", name: "img1.jpg", type: "image" },
        { url: "https://s3.example.com/img2.jpg", name: "img2.jpg", type: "image" },
        { url: "https://s3.example.com/img3.jpg", name: "img3.jpg", type: "image" },
      ];
      injectClientAssets(messages, assets);
      expect(messages[0].content.imageUrl).toBe("https://s3.example.com/img1.jpg");
    });

    it("should handle fewer images than slots", () => {
      const messages = [
        {
          content: {
            type: "carousel",
            carouselCards: [
              { title: "A", imageDescription: "desc A", imageUrl: "" },
              { title: "B", imageDescription: "desc B", imageUrl: "" },
              { title: "C", imageDescription: "desc C", imageUrl: "" },
            ],
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/only-one.jpg", name: "only-one.jpg", type: "image" },
      ];
      injectClientAssets(messages, assets);
      expect(messages[0].content.carouselCards[0].imageUrl).toBe("https://s3.example.com/only-one.jpg");
      expect(messages[0].content.carouselCards[0].imageDescription).toBeUndefined();
      // Second and third cards keep their original descriptions
      expect(messages[0].content.carouselCards[1].imageDescription).toBe("desc B");
      expect(messages[0].content.carouselCards[2].imageDescription).toBe("desc C");
    });

    it("should handle messages with null content", () => {
      const messages = [
        { content: null },
        {
          content: {
            type: "image",
            imageDescription: "Valid message",
            imageUrl: "",
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/img.jpg", name: "img.jpg", type: "image" },
      ];
      injectClientAssets(messages, assets);
      expect(messages[1].content.imageUrl).toBe("https://s3.example.com/img.jpg");
    });

    it("should not double-inject into already-injected messages", () => {
      const messages = [
        {
          content: {
            type: "template",
            headerImageUrl: "GENERATE_IMAGE:hero",
            bodyText: "Welcome",
            // Also has an imageUrl field
            imageUrl: "",
            imageDescription: "Some image",
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/hero.jpg", name: "hero.jpg", type: "image" },
        { url: "https://s3.example.com/extra.jpg", name: "extra.jpg", type: "image" },
      ];
      injectClientAssets(messages, assets);
      // Header gets first image
      expect(messages[0].content.headerImageUrl).toBe("https://s3.example.com/hero.jpg");
      // The _clientAsset flag prevents double injection in pass 3
      expect(messages[0].content._clientAsset).toBe(true);
    });

    it("should handle only video assets with no video messages", () => {
      const messages = [
        {
          content: {
            type: "text",
            text: "Hello!",
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/video.mp4", name: "video.mp4", type: "video" },
      ];
      injectClientAssets(messages, assets);
      // No video messages to inject into
      expect(messages[0].content.videoUrl).toBeUndefined();
    });

    it("should handle only image assets with no image messages", () => {
      const messages = [
        {
          content: {
            type: "text",
            text: "Hello!",
          },
        },
        {
          content: {
            type: "interactive_buttons",
            bodyText: "Choose an option",
            buttons: [{ id: "1", title: "Option A" }],
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/img.jpg", name: "img.jpg", type: "image" },
      ];
      injectClientAssets(messages, assets);
      // No image slots to inject into
      expect(messages[0].content.imageUrl).toBeUndefined();
    });
  });

  describe("Full conversation flow with client assets", () => {
    it("should correctly distribute 5 images across a realistic conversation", () => {
      const messages = [
        {
          direction: "outbound",
          content: {
            type: "template",
            headerImageUrl: "GENERATE_IMAGE:Restaurant hero image",
            bodyText: "Welcome to Gourmet Kitchen!",
            buttons: [{ id: "1", title: "View Menu" }],
          },
        },
        {
          direction: "inbound",
          content: {
            type: "text",
            text: "View Menu",
          },
        },
        {
          direction: "outbound",
          content: {
            type: "carousel",
            carouselCards: [
              { title: "Margherita Pizza", imageDescription: "Fresh pizza", price: "$12.99", imageUrl: "" },
              { title: "Caesar Salad", imageDescription: "Green salad", price: "$8.99", imageUrl: "" },
              { title: "Pasta Carbonara", imageDescription: "Creamy pasta", price: "$14.99", imageUrl: "" },
            ],
          },
        },
        {
          direction: "inbound",
          content: {
            type: "text",
            text: "Margherita Pizza",
          },
        },
        {
          direction: "outbound",
          content: {
            type: "image",
            imageDescription: "Close-up of Margherita Pizza",
            imageUrl: "",
            caption: "Our famous Margherita Pizza - $12.99",
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/restaurant-hero.jpg", name: "restaurant-hero.jpg", type: "image" },
        { url: "https://s3.example.com/pizza.jpg", name: "pizza.jpg", type: "image" },
        { url: "https://s3.example.com/salad.jpg", name: "salad.jpg", type: "image" },
        { url: "https://s3.example.com/pasta.jpg", name: "pasta.jpg", type: "image" },
        { url: "https://s3.example.com/pizza-closeup.jpg", name: "pizza-closeup.jpg", type: "image" },
      ];
      injectClientAssets(messages, assets);

      // Header gets first image
      expect(messages[0].content.headerImageUrl).toBe("https://s3.example.com/restaurant-hero.jpg");
      // Carousel cards get next 3 images
      expect(messages[2].content.carouselCards[0].imageUrl).toBe("https://s3.example.com/pizza.jpg");
      expect(messages[2].content.carouselCards[1].imageUrl).toBe("https://s3.example.com/salad.jpg");
      expect(messages[2].content.carouselCards[2].imageUrl).toBe("https://s3.example.com/pasta.jpg");
      // Standalone image gets last image
      expect(messages[4].content.imageUrl).toBe("https://s3.example.com/pizza-closeup.jpg");
      // All imageDescriptions should be cleared
      expect(messages[2].content.carouselCards[0].imageDescription).toBeUndefined();
      expect(messages[4].content.imageDescription).toBeUndefined();
    });

    it("should handle a conversation with both images and videos", () => {
      const messages = [
        {
          direction: "outbound",
          content: {
            type: "template",
            headerImageUrl: "GENERATE_IMAGE:Fitness studio",
            bodyText: "Join our fitness classes!",
          },
        },
        {
          direction: "outbound",
          content: {
            type: "video",
            videoDescription: "Workout class in action",
            videoUrl: "",
            caption: "See our classes in action!",
          },
        },
        {
          direction: "outbound",
          content: {
            type: "image",
            imageDescription: "Gym equipment",
            imageUrl: "",
          },
        },
      ];
      const assets = [
        { url: "https://s3.example.com/studio.jpg", name: "studio.jpg", type: "image" },
        { url: "https://s3.example.com/equipment.jpg", name: "equipment.jpg", type: "image" },
        { url: "https://s3.example.com/class-video.mp4", name: "class-video.mp4", type: "video" },
      ];
      injectClientAssets(messages, assets);

      expect(messages[0].content.headerImageUrl).toBe("https://s3.example.com/studio.jpg");
      expect(messages[1].content.videoUrl).toBe("https://s3.example.com/class-video.mp4");
      expect(messages[2].content.imageUrl).toBe("https://s3.example.com/equipment.jpg");
    });
  });
});

describe("Client Asset Context Builder", () => {
  it("should build correct context string for image assets", () => {
    const assets = [
      { url: "https://s3.example.com/hero.jpg", name: "hero.jpg", type: "image" },
      { url: "https://s3.example.com/product.jpg", name: "product.jpg", type: "image" },
    ];
    const imageAssets = assets.filter(a => a.type === "image");
    const videoAssets = assets.filter(a => a.type === "video");

    let context = `\n\n=== CLIENT-PROVIDED ASSETS (USE THESE INSTEAD OF STOCK IMAGES) ===`;
    if (imageAssets.length > 0) {
      context += `\nClient uploaded ${imageAssets.length} image(s). Use these REAL client images in the conversation:`;
      imageAssets.forEach((a, i) => {
        context += `\n  Image ${i + 1}: "${a.name}" → URL: ${a.url}`;
      });
    }
    context += `\n=== END CLIENT ASSETS ===\n`;

    expect(context).toContain("CLIENT-PROVIDED ASSETS");
    expect(context).toContain("hero.jpg");
    expect(context).toContain("product.jpg");
    expect(context).toContain("https://s3.example.com/hero.jpg");
    expect(context).toContain("2 image(s)");
  });

  it("should build correct context for video assets", () => {
    const assets = [
      { url: "https://s3.example.com/demo.mp4", name: "demo.mp4", type: "video" },
    ];
    const videoAssets = assets.filter(a => a.type === "video");

    let context = "";
    if (videoAssets.length > 0) {
      context += `\nClient uploaded ${videoAssets.length} video(s):`;
      videoAssets.forEach((a, i) => {
        context += `\n  Video ${i + 1}: "${a.name}" → URL: ${a.url}`;
      });
    }

    expect(context).toContain("1 video(s)");
    expect(context).toContain("demo.mp4");
    expect(context).toContain("https://s3.example.com/demo.mp4");
  });

  it("should build correct context for mixed assets", () => {
    const assets = [
      { url: "https://s3.example.com/img.jpg", name: "img.jpg", type: "image" },
      { url: "https://s3.example.com/vid.mp4", name: "vid.mp4", type: "video" },
    ];
    const imageAssets = assets.filter(a => a.type === "image");
    const videoAssets = assets.filter(a => a.type === "video");

    expect(imageAssets.length).toBe(1);
    expect(videoAssets.length).toBe(1);
  });
});
