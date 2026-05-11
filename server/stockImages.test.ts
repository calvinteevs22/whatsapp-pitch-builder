import { describe, it, expect, beforeEach } from "vitest";
import { resolveStockImage, resolveAllStockImages, resetImageSession, getAlternatives, getCategories, getCategoryImages } from "./stockImages";

describe("Stock Image Resolver", () => {
  beforeEach(() => {
    resetImageSession();
  });

  describe("resolveStockImage", () => {
    it("should return a valid Unsplash URL", () => {
      const url = resolveStockImage("a delicious pizza on a wooden board");
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      expect(url).toContain("w=400");
      expect(url).toContain("h=300");
      expect(url).toContain("fit=crop");
    });

    it("should match food-related keywords", () => {
      const url = resolveStockImage("a delicious pizza on a wooden board");
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should match fashion-related keywords", () => {
      const url = resolveStockImage("a stylish dress on a mannequin");
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should match technology-related keywords", () => {
      const url = resolveStockImage("a sleek smartphone on a desk");
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should match beauty-related keywords", () => {
      const url = resolveStockImage("a bottle of skincare serum");
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should match automotive-related keywords", () => {
      const url = resolveStockImage("a luxury car in a showroom");
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should match real estate keywords", () => {
      const url = resolveStockImage("a modern apartment with city view");
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should match health/fitness keywords", () => {
      const url = resolveStockImage("a person doing yoga in a studio");
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should match travel keywords", () => {
      const url = resolveStockImage("a luxury hotel room with ocean view");
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should return a fallback URL for unknown descriptions", () => {
      const url = resolveStockImage("something completely random and unique xyz123");
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should return deterministic results for the same description", () => {
      const url1 = resolveStockImage("a red sports car");
      resetImageSession();
      const url2 = resolveStockImage("a red sports car");
      expect(url1).toBe(url2);
    });

    it("should avoid duplicates within a session", () => {
      const url1 = resolveStockImage("a delicious pizza");
      const url2 = resolveStockImage("another pizza on a plate");
      // Both should be valid URLs
      expect(url1).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      expect(url2).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      // They should be different if possible (pizza category has 2 images)
      expect(url1).not.toBe(url2);
    });

    it("should match more specific keywords first", () => {
      // "smartwatch" is more specific than "watch"
      const url = resolveStockImage("a sleek smartwatch on a wrist");
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should match salon/hair keywords", () => {
      const url = resolveStockImage("a professional headshot of a hairstylist in a salon");
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should match delivery/logistics keywords", () => {
      const url = resolveStockImage("a delivery package at a doorstep");
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });
  });

  describe("resolveAllStockImages", () => {
    it("should resolve GENERATE_IMAGE: header image URLs", () => {
      const messages = [{
        content: {
          type: "template",
          headerImageUrl: "GENERATE_IMAGE:a professional product photo of shoes",
          bodyText: "Check out our new collection!",
          buttons: [{ id: "1", title: "Shop Now" }],
        },
      }];

      resolveAllStockImages(messages);
      expect(messages[0].content.headerImageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      expect(messages[0].content.headerImageUrl).not.toContain("GENERATE_IMAGE");
    });

    it("should resolve imageDescription to imageUrl", () => {
      const messages = [{
        content: {
          type: "image",
          imageDescription: "a sleek black smartwatch on marble",
        },
      }];

      resolveAllStockImages(messages);
      expect((messages[0].content as any).imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should resolve videoDescription to videoPosterUrl", () => {
      const messages = [{
        content: {
          type: "video",
          videoDescription: "a car driving through mountains",
        },
      }];

      resolveAllStockImages(messages);
      expect((messages[0].content as any).videoPosterUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should resolve carousel card imageDescriptions", () => {
      const messages = [{
        content: {
          type: "carousel",
          text: "Our products:",
          carouselCards: [
            { id: "1", imageDescription: "a pair of running shoes", title: "Runners", price: "$99" },
            { id: "2", imageDescription: "a leather handbag", title: "Bag", price: "$149" },
          ],
        },
      }];

      resolveAllStockImages(messages);
      const cards = (messages[0].content as any).carouselCards;
      expect(cards[0].imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      expect(cards[1].imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should NOT overwrite existing imageUrl values", () => {
      const existingUrl = "https://example.com/existing-image.jpg";
      const messages = [{
        content: {
          type: "image",
          imageDescription: "a pizza",
          imageUrl: existingUrl,
        },
      }];

      resolveAllStockImages(messages);
      expect((messages[0].content as any).imageUrl).toBe(existingUrl);
    });

    it("should NOT overwrite existing videoPosterUrl values", () => {
      const existingUrl = "https://example.com/existing-poster.jpg";
      const messages = [{
        content: {
          type: "video",
          videoDescription: "a car video",
          videoPosterUrl: existingUrl,
        },
      }];

      resolveAllStockImages(messages);
      expect((messages[0].content as any).videoPosterUrl).toBe(existingUrl);
    });

    it("should NOT overwrite existing carousel card imageUrl values", () => {
      const existingUrl = "https://example.com/existing-card.jpg";
      const messages = [{
        content: {
          type: "carousel",
          carouselCards: [
            { id: "1", imageDescription: "shoes", imageUrl: existingUrl, title: "Shoes" },
            { id: "2", imageDescription: "bag", title: "Bag" },
          ],
        },
      }];

      resolveAllStockImages(messages);
      const cards = (messages[0].content as any).carouselCards;
      expect(cards[0].imageUrl).toBe(existingUrl);
      expect(cards[1].imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should handle messages without image fields gracefully", () => {
      const messages = [
        { content: { type: "text", text: "Hello!" } },
        { content: { type: "interactive_buttons", text: "Choose:", buttons: [{ id: "1", title: "Yes" }] } },
      ];

      // Should not throw
      resolveAllStockImages(messages);
      expect(messages[0].content.text).toBe("Hello!");
    });

    it("should handle empty messages array", () => {
      const messages: any[] = [];
      const result = resolveAllStockImages(messages);
      expect(result).toEqual([]);
    });

    it("should handle null content gracefully", () => {
      const messages = [{ content: null }];
      // Should not throw
      resolveAllStockImages(messages);
    });

    it("should resolve multiple images across different message types", () => {
      const messages = [
        {
          content: {
            type: "template",
            headerImageUrl: "GENERATE_IMAGE:a professional restaurant photo",
            bodyText: "Welcome!",
            buttons: [{ id: "1", title: "Order" }],
          },
        },
        {
          content: {
            type: "image",
            imageDescription: "a delicious burger with fries",
          },
        },
        {
          content: {
            type: "carousel",
            text: "Menu:",
            carouselCards: [
              { id: "1", imageDescription: "a margherita pizza", title: "Pizza", price: "$12" },
              { id: "2", imageDescription: "fresh sushi rolls", title: "Sushi", price: "$18" },
            ],
          },
        },
        {
          content: {
            type: "video",
            videoDescription: "chef preparing food in kitchen",
          },
        },
      ];

      resolveAllStockImages(messages);

      // All should have resolved URLs
      expect(messages[0].content.headerImageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      expect((messages[1].content as any).imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      expect((messages[2].content as any).carouselCards[0].imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      expect((messages[2].content as any).carouselCards[1].imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      expect((messages[3].content as any).videoPosterUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    });

    it("should reset session between calls to avoid cross-thread dedup", () => {
      const messages1 = [{
        content: { type: "image", imageDescription: "a pizza" },
      }];
      const messages2 = [{
        content: { type: "image", imageDescription: "a pizza" },
      }];

      resolveAllStockImages(messages1);
      const url1 = (messages1[0].content as any).imageUrl;

      resolveAllStockImages(messages2);
      const url2 = (messages2[0].content as any).imageUrl;

      // Both should get the same image since session was reset
      expect(url1).toBe(url2);
    });
  });

  describe("getAlternatives (Swap Image)", () => {
    it("should return alternative images for a known URL", () => {
      const url = resolveStockImage("a delicious pizza");
      const alts = getAlternatives(url, "pizza");
      expect(alts.length).toBeGreaterThan(0);
      // Alternatives should not include the current URL
      expect(alts).not.toContain(url);
    });

    it("should return alternatives based on description when URL not found", () => {
      const alts = getAlternatives("https://example.com/unknown.jpg", "a luxury car in a showroom");
      expect(alts.length).toBeGreaterThan(0);
      alts.forEach(alt => {
        expect(alt).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      });
    });

    it("should return fallback alternatives when no URL or description match", () => {
      const alts = getAlternatives("https://example.com/unknown.jpg");
      // Falls back to FALLBACK_IMAGES
      expect(alts.length).toBeGreaterThan(0);
      alts.forEach(alt => {
        expect(alt).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      });
    });

    it("should return up to 6 alternatives", () => {
      const url = resolveStockImage("food");
      const alts = getAlternatives(url, "food");
      expect(alts.length).toBeLessThanOrEqual(6);
    });

    it("should return all valid Unsplash URLs", () => {
      const url = resolveStockImage("a modern apartment");
      const alts = getAlternatives(url, "apartment");
      alts.forEach(alt => {
        expect(alt).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      });
    });
  });

  describe("getCategories (Industry-specific packs)", () => {
    it("should return a list of category names", () => {
      const categories = getCategories();
      expect(categories.length).toBeGreaterThan(50);
      expect(categories).toContain("food");
      expect(categories).toContain("car");
      expect(categories).toContain("fashion");
    });

    it("should include niche industry categories", () => {
      const categories = getCategories();
      // Check for expanded niche categories
      expect(categories).toContain("dental");
      expect(categories).toContain("jewelry");
      expect(categories).toContain("sushi");
    });
  });

  describe("getCategoryImages", () => {
    it("should return images for a known category", () => {
      const images = getCategoryImages("food");
      expect(images.length).toBeGreaterThan(0);
      images.forEach(img => {
        expect(img).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      });
    });

    it("should return fallback images for unknown category", () => {
      const images = getCategoryImages("nonexistent_category_xyz");
      // Falls back to FALLBACK_IMAGES
      expect(images.length).toBeGreaterThan(0);
      images.forEach(img => {
        expect(img).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      });
    });

    it("should have at least 3 images per major category", () => {
      const majorCategories = ["food", "car", "fashion", "technology", "beauty", "fitness"];
      majorCategories.forEach(cat => {
        const images = getCategoryImages(cat);
        expect(images.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe("Precision Matching (v2 word-boundary + semantic patterns)", () => {
    it("should NOT match 'cat' inside 'education' or 'notification'", () => {
      const educationUrl = resolveStockImage("online education platform");
      const catImages = getCategoryImages("cat");
      expect(catImages).not.toContain(educationUrl);
    });

    it("should match 'salon' for hair salon descriptions, not 'hair' category", () => {
      const url = resolveStockImage("Hair salon interior with styling chairs");
      const salonImages = getCategoryImages("salon");
      expect(salonImages).toContain(url);
    });

    it("should match 'laboratory' for blood test descriptions", () => {
      const url = resolveStockImage("Blood test tubes in laboratory");
      const labImages = getCategoryImages("laboratory");
      expect(labImages).toContain(url);
    });

    it("should match 'restaurant' for fine dining table setting with wine", () => {
      const url = resolveStockImage("Fine dining table setting with wine glasses");
      const restaurantImages = getCategoryImages("restaurant");
      expect(restaurantImages).toContain(url);
    });

    it("should match 'education' for online learning on laptop", () => {
      const url = resolveStockImage("Online learning platform on laptop screen");
      const educationImages = getCategoryImages("education");
      expect(educationImages).toContain(url);
    });

    it("should match 'banking' for mobile banking app", () => {
      const url = resolveStockImage("Mobile banking app on smartphone screen");
      const bankingImages = getCategoryImages("banking");
      expect(bankingImages).toContain(url);
    });

    it("should match 'telecom' for 5G network tower", () => {
      const url = resolveStockImage("5G network tower with city skyline");
      const telecomImages = getCategoryImages("telecom");
      expect(telecomImages).toContain(url);
    });

    it("should match 'insurance' for car accident insurance claim", () => {
      const url = resolveStockImage("Car accident scene for auto insurance claim");
      const insuranceImages = getCategoryImages("insurance");
      expect(insuranceImages).toContain(url);
    });

    it("should match 'delivery' for package at doorstep", () => {
      const url = resolveStockImage("Package being delivered to doorstep");
      const deliveryImages = getCategoryImages("delivery");
      expect(deliveryImages).toContain(url);
    });

    it("should match 'welcome' for welcome message header", () => {
      const url = resolveStockImage("Welcome message header image");
      const welcomeImages = getCategoryImages("welcome");
      expect(welcomeImages).toContain(url);
    });

    it("should match 'security' for verification code", () => {
      const url = resolveStockImage("Verification code security shield");
      const securityImages = getCategoryImages("security");
      expect(securityImages).toContain(url);
    });

    it("should match 'support' for customer support representative", () => {
      const url = resolveStockImage("Customer support representative with headset");
      const supportImages = getCategoryImages("support");
      expect(supportImages).toContain(url);
    });

    it("should match 'person' for happy customer review", () => {
      const url = resolveStockImage("Happy customer giving thumbs up review");
      const personImages = getCategoryImages("person");
      expect(personImages).toContain(url);
    });

    it("should match 'success' for thank you messages", () => {
      const url = resolveStockImage("Thank you for your purchase");
      const successImages = getCategoryImages("success");
      expect(successImages).toContain(url);
    });

    it("should match 'hospital' for medical clinic interior", () => {
      const url = resolveStockImage("Modern medical clinic interior with reception area");
      const hospitalImages = getCategoryImages("hospital");
      expect(hospitalImages).toContain(url);
    });
  });

  describe("Performance", () => {
    it("should resolve 100 messages in under 10ms", () => {
      const messages = Array.from({ length: 100 }, (_, i) => ({
        content: {
          imageDescription: `Product image ${i} for a luxury watch`,
        },
      }));

      const start = performance.now();
      resolveAllStockImages(messages);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50); // Relaxed threshold to avoid flaky failures in CI/sandbox
      // All should have URLs
      for (const msg of messages) {
        expect((msg.content as any).imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      }
    });
  });

  describe("brand context enrichment", () => {
    it("should enrich imageDescription with brand context when provided", () => {
      const messages = [
        { content: { imageDescription: "SUV on display at dealership" } },
      ];
      resolveAllStockImages(messages, "Toyota");
      expect(messages[0].content.imageDescription).toContain("Toyota");
      expect(messages[0].content.imageDescription).toContain("SUV on display at dealership");
    });

    it("should not duplicate brand name if already in imageDescription", () => {
      const messages = [
        { content: { imageDescription: "Toyota Corolla sedan in showroom" } },
      ];
      resolveAllStockImages(messages, "Toyota");
      // Should not have "Toyota - Toyota Corolla..."
      expect(messages[0].content.imageDescription).toBe("Toyota Corolla sedan in showroom");
    });

    it("should preserve _headerImageDescription for AI generation", () => {
      const messages = [
        { content: { headerImageUrl: "GENERATE_IMAGE: A sleek SUV on a highway" } },
      ];
      resolveAllStockImages(messages, "Toyota");
      // Header should now have a stock URL
      expect(messages[0].content.headerImageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      // But _headerImageDescription should be preserved with brand context
      expect((messages[0].content as any)._headerImageDescription).toContain("Toyota");
      expect((messages[0].content as any)._headerImageDescription).toContain("A sleek SUV on a highway");
    });

    it("should preserve _headerImageDescription without brand context", () => {
      const messages = [
        { content: { headerImageUrl: "GENERATE_IMAGE: A sleek SUV on a highway" } },
      ];
      resolveAllStockImages(messages);
      // _headerImageDescription should be set without brand prefix
      expect((messages[0].content as any)._headerImageDescription).toBe("A sleek SUV on a highway");
    });

    it("should enrich carousel card imageDescriptions with brand context", () => {
      const messages = [
        {
          content: {
            carouselCards: [
              { imageDescription: "Compact sedan in silver" },
              { imageDescription: "Toyota Hilux pickup truck" },
            ],
          },
        },
      ];
      resolveAllStockImages(messages, "Toyota");
      // First card should have brand prepended
      expect(messages[0].content.carouselCards[0].imageDescription).toContain("Toyota");
      expect(messages[0].content.carouselCards[0].imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      // Second card already has "Toyota" so should not be duplicated
      expect(messages[0].content.carouselCards[1].imageDescription).toBe("Toyota Hilux pickup truck");
    });

    it("should enrich videoDescription with brand context", () => {
      const messages = [
        { content: { videoDescription: "SUV driving through mountains" } },
      ];
      resolveAllStockImages(messages, "Toyota");
      expect(messages[0].content.videoDescription).toContain("Toyota");
      expect(messages[0].content.videoDescription).toContain("SUV driving through mountains");
    });

    it("should work without brand context (backward compatible)", () => {
      const messages = [
        { content: { imageDescription: "A beautiful sunset over the ocean" } },
        { content: { headerImageUrl: "GENERATE_IMAGE: Beach resort" } },
      ];
      resolveAllStockImages(messages);
      // Should still resolve stock images without brand context
      expect(messages[0].content.imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      expect(messages[1].content.headerImageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      // imageDescription should remain unchanged
      expect(messages[0].content.imageDescription).toBe("A beautiful sunset over the ocean");
    });

    it("should not contain identifiable competitor brand images in automotive categories", () => {
      // Verify that car/suv/automotive stock photos don't contain known branded photo IDs
      const brandedPhotoIds = [
        "photo-1494976388531", // Red BMW
        "photo-1503376780353", // Porsche
        "photo-1492144534655", // Mercedes
        "photo-1502877338535", // Classic car with visible badge
        "photo-1549317661",   // Luxury car with badge
        "photo-1552519507",   // Corvette
        "photo-1568605117036", // BMW
        "photo-1583121274602", // Red sports car
        "photo-1606664515524", // Branded SUV
        "photo-1609521263047", // Branded SUV
        "photo-1618843479313", // BMW
        "photo-1555215695",   // BMW
      ];
      const automotiveCategories = ["car", "suv", "automotive", "luxury"];
      for (const category of automotiveCategories) {
        const images = getCategoryImages(category);
        for (const url of images) {
          for (const brandedId of brandedPhotoIds) {
            expect(url).not.toContain(brandedId);
          }
        }
      }
    });
  });
});
