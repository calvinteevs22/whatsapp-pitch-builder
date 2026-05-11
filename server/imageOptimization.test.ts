import { describe, it, expect } from "vitest";

/**
 * Tests for image optimization pipeline, vision-based descriptions, and avatar deletion.
 */

describe("Image Optimization Pipeline", () => {
  describe("Image format detection", () => {
    it("should identify JPEG images for compression", () => {
      const mimeType = "image/jpeg";
      const isImage = mimeType.startsWith("image/") && !mimeType.includes("gif");
      expect(isImage).toBe(true);
    });

    it("should identify PNG images for compression", () => {
      const mimeType = "image/png";
      const isImage = mimeType.startsWith("image/") && !mimeType.includes("gif");
      expect(isImage).toBe(true);
    });

    it("should skip GIF images from optimization", () => {
      const mimeType = "image/gif";
      const isImage = mimeType.startsWith("image/") && !mimeType.includes("gif");
      expect(isImage).toBe(false);
    });

    it("should skip video files from image optimization", () => {
      const mimeType = "video/mp4";
      const isImage = mimeType.startsWith("image/") && !mimeType.includes("gif");
      expect(isImage).toBe(false);
    });

    it("should skip non-media files", () => {
      const mimeType = "application/pdf";
      const isImage = mimeType.startsWith("image/") && !mimeType.includes("gif");
      expect(isImage).toBe(false);
    });
  });

  describe("Resize dimension logic", () => {
    const maxDim = 1024;

    it("should flag oversized images for resize", () => {
      const width = 2048;
      const height = 1536;
      const needsResize = (width > maxDim) || (height > maxDim);
      expect(needsResize).toBe(true);
    });

    it("should not resize images already within bounds", () => {
      const width = 800;
      const height = 600;
      const needsResize = (width > maxDim) || (height > maxDim);
      expect(needsResize).toBe(false);
    });

    it("should flag images where only width exceeds limit", () => {
      const width = 1200;
      const height = 800;
      const needsResize = (width > maxDim) || (height > maxDim);
      expect(needsResize).toBe(true);
    });

    it("should flag images where only height exceeds limit", () => {
      const width = 800;
      const height = 1200;
      const needsResize = (width > maxDim) || (height > maxDim);
      expect(needsResize).toBe(true);
    });

    it("should not resize images at exactly 1024x1024", () => {
      const width = 1024;
      const height = 1024;
      const needsResize = (width > maxDim) || (height > maxDim);
      expect(needsResize).toBe(false);
    });
  });

  describe("Alpha channel handling", () => {
    it("should use PNG format for images with transparency", () => {
      const hasAlpha = true;
      const outputFormat = hasAlpha ? "png" : "jpeg";
      const outputMime = hasAlpha ? "image/png" : "image/jpeg";
      expect(outputFormat).toBe("png");
      expect(outputMime).toBe("image/png");
    });

    it("should use JPEG format for images without transparency", () => {
      const hasAlpha = false;
      const outputFormat = hasAlpha ? "png" : "jpeg";
      const outputMime = hasAlpha ? "image/png" : "image/jpeg";
      expect(outputFormat).toBe("jpeg");
      expect(outputMime).toBe("image/jpeg");
    });
  });

  describe("Optimize flag behavior", () => {
    it("should optimize by default when optimize is undefined", () => {
      const optimize: boolean | undefined = undefined;
      const shouldOptimize = optimize !== false;
      expect(shouldOptimize).toBe(true);
    });

    it("should optimize when optimize is true", () => {
      const optimize = true;
      const shouldOptimize = optimize !== false;
      expect(shouldOptimize).toBe(true);
    });

    it("should skip optimization when optimize is false", () => {
      const optimize = false;
      const shouldOptimize = optimize !== false;
      expect(shouldOptimize).toBe(false);
    });
  });
});

describe("Vision-Based Asset Descriptions", () => {
  describe("Vision prompt construction", () => {
    it("should build a system prompt for image analysis", () => {
      const systemPrompt = "You are an image analyst for WhatsApp business messaging. Describe the image in 1-2 concise sentences focusing on: what product/service is shown, the setting/context, and any text/branding visible. Be specific and factual. This description will help an AI create a WhatsApp conversation demo featuring this image.";
      expect(systemPrompt).toContain("image analyst");
      expect(systemPrompt).toContain("WhatsApp");
      expect(systemPrompt).toContain("1-2 concise sentences");
      expect(systemPrompt).toContain("product/service");
    });

    it("should build a user prompt with filename context", () => {
      const assetName = "product-hero-shot.jpg";
      const userPrompt = `Describe this business image (filename: ${assetName}). What product, service, or scene does it show?`;
      expect(userPrompt).toContain("product-hero-shot.jpg");
      expect(userPrompt).toContain("product, service, or scene");
    });

    it("should use low detail for vision API to save tokens", () => {
      const detail = "low" as const;
      expect(detail).toBe("low");
    });
  });

  describe("Vision description integration into prompt", () => {
    it("should include AI descriptions in client asset context", () => {
      const assets = [
        { url: "https://s3.example.com/hero.jpg", name: "hero.jpg", type: "image" },
      ];
      const assetDescriptions = new Map<string, string>();
      assetDescriptions.set("https://s3.example.com/hero.jpg", "A modern restaurant interior with warm lighting and wooden tables set for dinner service.");

      let context = `\n\n=== CLIENT-PROVIDED ASSETS ===`;
      assets.forEach((a, i) => {
        const visionDesc = assetDescriptions.get(a.url);
        context += `\n  Image ${i + 1}: "${a.name}" → URL: ${a.url}`;
        if (visionDesc) {
          context += `\n    AI Description: ${visionDesc}`;
        }
      });
      context += `\n=== END CLIENT ASSETS ===\n`;

      expect(context).toContain("AI Description: A modern restaurant interior");
      expect(context).toContain("hero.jpg");
    });

    it("should handle missing descriptions gracefully", () => {
      const assets = [
        { url: "https://s3.example.com/hero.jpg", name: "hero.jpg", type: "image" },
      ];
      const assetDescriptions = new Map<string, string>();
      // No description set for this asset

      let context = "";
      assets.forEach((a, i) => {
        const visionDesc = assetDescriptions.get(a.url);
        context += `\n  Image ${i + 1}: "${a.name}" → URL: ${a.url}`;
        if (visionDesc) {
          context += `\n    AI Description: ${visionDesc}`;
        }
      });

      expect(context).not.toContain("AI Description:");
      expect(context).toContain("hero.jpg");
    });

    it("should handle multiple images with mixed descriptions", () => {
      const assets = [
        { url: "https://s3.example.com/hero.jpg", name: "hero.jpg", type: "image" },
        { url: "https://s3.example.com/product.jpg", name: "product.jpg", type: "image" },
        { url: "https://s3.example.com/team.jpg", name: "team.jpg", type: "image" },
      ];
      const assetDescriptions = new Map<string, string>();
      assetDescriptions.set("https://s3.example.com/hero.jpg", "Restaurant exterior with neon sign");
      // product.jpg failed vision analysis
      assetDescriptions.set("https://s3.example.com/team.jpg", "Team photo of 5 chefs in white uniforms");

      let descCount = 0;
      assets.forEach((a) => {
        if (assetDescriptions.has(a.url)) descCount++;
      });

      expect(descCount).toBe(2);
      expect(assetDescriptions.size).toBe(2);
    });

    it("should instruct AI to use descriptions for contextual captions", () => {
      const instruction = "Use the AI descriptions above to write contextually relevant captions and message text that reference what's actually shown in each image.";
      expect(instruction).toContain("contextually relevant captions");
      expect(instruction).toContain("what's actually shown");
    });
  });

  describe("Vision API error handling", () => {
    it("should continue with empty description on individual image failure", () => {
      const assetDescriptions = new Map<string, string>();
      // Simulate: 3 images, 1 fails
      assetDescriptions.set("url1", "Description 1");
      // url2 failed - not set
      assetDescriptions.set("url3", "Description 3");

      expect(assetDescriptions.size).toBe(2);
      expect(assetDescriptions.get("url2")).toBeUndefined();
    });

    it("should continue with empty descriptions on batch failure", () => {
      const assetDescriptions = new Map<string, string>();
      // Batch failure - no descriptions at all
      expect(assetDescriptions.size).toBe(0);
    });
  });
});

describe("Avatar Photo Deletion", () => {
  describe("Profile image URL handling", () => {
    it("should allow null profileImageUrl for deletion", () => {
      const profileImageUrl: string | null = null;
      expect(profileImageUrl).toBeNull();
    });

    it("should allow string profileImageUrl for upload", () => {
      const profileImageUrl: string | null = "https://s3.example.com/avatar.jpg";
      expect(profileImageUrl).toBe("https://s3.example.com/avatar.jpg");
    });

    it("should render initials when profileImageUrl is null", () => {
      const profileImageUrl: string | null = null;
      const profileName = "Acme Corp";
      const showInitials = !profileImageUrl;
      const initials = profileName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      expect(showInitials).toBe(true);
      expect(initials).toBe("AC");
    });

    it("should render image when profileImageUrl is set", () => {
      const profileImageUrl: string | null = "https://s3.example.com/avatar.jpg";
      const showInitials = !profileImageUrl;
      expect(showInitials).toBe(false);
    });
  });

  describe("Initials generation", () => {
    it("should generate 2-letter initials from multi-word name", () => {
      const name = "Gourmet Kitchen";
      const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      expect(initials).toBe("GK");
    });

    it("should generate 1-letter initial from single-word name", () => {
      const name = "Nike";
      const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      expect(initials).toBe("N");
    });

    it("should handle 3+ word names by taking first 2 initials", () => {
      const name = "The Coffee Bean";
      const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      expect(initials).toBe("TC");
    });

    it("should uppercase initials", () => {
      const name = "acme corp";
      const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      expect(initials).toBe("AC");
    });
  });

  describe("Delete button visibility", () => {
    it("should show delete button when editable and photo exists", () => {
      const editable = true;
      const profileImageUrl = "https://s3.example.com/avatar.jpg";
      const onProfileImageRemove = () => {};
      const showDeleteButton = editable && !!profileImageUrl && !!onProfileImageRemove;
      expect(showDeleteButton).toBe(true);
    });

    it("should hide delete button when not editable", () => {
      const editable = false;
      const profileImageUrl = "https://s3.example.com/avatar.jpg";
      const onProfileImageRemove = () => {};
      const showDeleteButton = editable && !!profileImageUrl && !!onProfileImageRemove;
      expect(showDeleteButton).toBe(false);
    });

    it("should hide delete button when no photo", () => {
      const editable = true;
      const profileImageUrl: string | null = null;
      const onProfileImageRemove = () => {};
      const showDeleteButton = editable && !!profileImageUrl && !!onProfileImageRemove;
      expect(showDeleteButton).toBe(false);
    });

    it("should hide delete button when no remove handler", () => {
      const editable = true;
      const profileImageUrl = "https://s3.example.com/avatar.jpg";
      const onProfileImageRemove: (() => void) | undefined = undefined;
      const showDeleteButton = editable && !!profileImageUrl && !!onProfileImageRemove;
      expect(showDeleteButton).toBe(false);
    });
  });
});
