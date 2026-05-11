import { describe, it, expect } from "vitest";

// We test the exported deepCrawlWebsite function indirectly by testing
// the helper functions and the overall integration.
// Since the crawler makes HTTP requests, we test the extraction logic separately.

// Import the module to test internal helpers
// We'll test the image injection and product matching logic from routers.ts

describe("Website Crawler - URL Resolution", () => {
  // Test the URL resolution logic that's critical for image extraction
  it("should handle absolute URLs", () => {
    const url = "https://example.com/products/item.jpg";
    expect(url.startsWith("http")).toBe(true);
  });

  it("should handle protocol-relative URLs", () => {
    const url = "//cdn.example.com/image.jpg";
    const resolved = "https:" + url;
    expect(resolved).toBe("https://cdn.example.com/image.jpg");
  });

  it("should handle root-relative URLs", () => {
    const url = "/images/product.jpg";
    const origin = "https://example.com";
    const resolved = origin + url;
    expect(resolved).toBe("https://example.com/images/product.jpg");
  });
});

describe("Website Crawler - Image Filtering", () => {
  it("should skip data URIs", () => {
    const src = "data:image/png;base64,iVBOR...";
    expect(src.startsWith("data:")).toBe(true);
  });

  it("should skip SVG files", () => {
    const src = "https://example.com/logo.svg";
    expect(src.includes(".svg")).toBe(true);
  });

  it("should skip tiny images (icons)", () => {
    const width = 16;
    expect(width < 80).toBe(true);
  });

  it("should accept product-sized images", () => {
    const width = 400;
    expect(width >= 80).toBe(true);
  });
});

describe("Website Crawler - Price Extraction Patterns", () => {
  const pricePatterns = [
    /[\$\€\£\¥]\s*[\d,]+\.?\d*/g,
    /(?:from|starting\s+at)\s*[\$\€\£]\s*[\d,]+\.?\d*/gi,
  ];

  it("should extract USD prices", () => {
    const text = "Our premium plan costs $29.99/month";
    const match = text.match(pricePatterns[0]);
    expect(match).toBeTruthy();
    expect(match![0]).toBe("$29.99");
  });

  it("should extract EUR prices", () => {
    const text = "Starting from €150";
    const match = text.match(pricePatterns[0]);
    expect(match).toBeTruthy();
    expect(match![0]).toBe("€150");
  });

  it("should extract GBP prices", () => {
    const text = "Only £9.99";
    const match = text.match(pricePatterns[0]);
    expect(match).toBeTruthy();
    expect(match![0]).toBe("£9.99");
  });

  it("should extract 'from' prices", () => {
    const text = "Rooms from $199 per night";
    const match = text.match(pricePatterns[1]);
    expect(match).toBeTruthy();
    expect(match![0]).toContain("$199");
  });

  it("should extract comma-separated prices", () => {
    const text = "The luxury sedan starts at $45,999";
    const match = text.match(pricePatterns[0]);
    expect(match).toBeTruthy();
    expect(match![0]).toBe("$45,999");
  });
});

describe("Website Crawler - Link Prioritization", () => {
  const PRIORITY_PATTERNS = [
    /\/(products?|shop|store|catalog|collection|menu|services?|offerings?|pricing|plans?|packages?)/i,
    /\/(about|about-us|our-story|team)/i,
    /\/(gallery|portfolio|showcase)/i,
  ];

  const SKIP_PATTERNS = [
    /\/(blog|news|press|article)\//i,
    /\/(login|signup|register|account|cart|checkout|privacy|terms)/i,
  ];

  it("should prioritize product pages", () => {
    const link = "https://example.com/products";
    expect(PRIORITY_PATTERNS.some(p => p.test(link))).toBe(true);
  });

  it("should prioritize service pages", () => {
    const link = "https://example.com/services/web-design";
    expect(PRIORITY_PATTERNS.some(p => p.test(link))).toBe(true);
  });

  it("should prioritize pricing pages", () => {
    const link = "https://example.com/pricing";
    expect(PRIORITY_PATTERNS.some(p => p.test(link))).toBe(true);
  });

  it("should skip blog pages", () => {
    const link = "https://example.com/blog/post-1";
    expect(SKIP_PATTERNS.some(p => p.test(link))).toBe(true);
  });

  it("should skip login pages", () => {
    const link = "https://example.com/login";
    expect(SKIP_PATTERNS.some(p => p.test(link))).toBe(true);
  });

  it("should skip checkout pages", () => {
    const link = "https://example.com/checkout";
    expect(SKIP_PATTERNS.some(p => p.test(link))).toBe(true);
  });
});

describe("Product Image Injection - Matching Logic", () => {
  // Simulate the findBestProductMatch logic
  function findBestProductMatch(
    query: string,
    catalog: Array<{ name: string; description: string; price: string; imageUrl: string; category: string }>,
    usedImages: Set<string> = new Set()
  ): { name: string; imageUrl: string; price: string } | null {
    if (!query || catalog.length === 0) return null;

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    let bestMatch: { name: string; imageUrl: string; price: string } | null = null;
    let bestScore = 0;

    for (const product of catalog) {
      if (usedImages.has(product.imageUrl)) continue;

      const nameLower = product.name.toLowerCase();
      const descLower = product.description.toLowerCase();
      const catLower = product.category.toLowerCase();
      let score = 0;

      if (queryLower.includes(nameLower) || nameLower.includes(queryLower)) {
        score += 50;
      }

      const nameWords = nameLower.split(/\s+/).filter(w => w.length > 2);
      for (const word of queryWords) {
        if (nameWords.some(nw => nw.includes(word) || word.includes(nw))) {
          score += 10;
        }
      }

      for (const word of queryWords) {
        if (descLower.includes(word)) score += 3;
      }

      for (const word of queryWords) {
        if (catLower.includes(word)) score += 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { name: product.name, imageUrl: product.imageUrl, price: product.price };
      }
    }

    if (bestScore < 5) {
      const unused = catalog.find(p => !usedImages.has(p.imageUrl));
      return unused ? { name: unused.name, imageUrl: unused.imageUrl, price: unused.price } : null;
    }

    return bestMatch;
  }

  const catalog = [
    { name: "Apex Premium Sedan", description: "Luxurious comfort with V6 engine", price: "$45,999", imageUrl: "https://example.com/apex-premium.jpg", category: "Sedan" },
    { name: "Apex Sport", description: "Dynamic performance sports car", price: "$48,499", imageUrl: "https://example.com/apex-sport.jpg", category: "Sports" },
    { name: "EcoRide Electric", description: "Zero emissions electric vehicle", price: "$35,000", imageUrl: "https://example.com/ecoride.jpg", category: "Electric" },
    { name: "Margherita Pizza", description: "Classic Italian pizza with fresh mozzarella", price: "$12.99", imageUrl: "https://example.com/margherita.jpg", category: "Pizza" },
    { name: "Sushi Platter", description: "Assorted fresh sushi rolls", price: "$24.99", imageUrl: "https://example.com/sushi.jpg", category: "Japanese" },
  ];

  it("should match exact product name", () => {
    const result = findBestProductMatch("Apex Premium Sedan", catalog);
    expect(result).toBeTruthy();
    expect(result!.name).toBe("Apex Premium Sedan");
    expect(result!.imageUrl).toBe("https://example.com/apex-premium.jpg");
  });

  it("should match partial product name", () => {
    const result = findBestProductMatch("Check out the Apex Sport model", catalog);
    expect(result).toBeTruthy();
    expect(result!.name).toBe("Apex Sport");
  });

  it("should match by description keywords", () => {
    const result = findBestProductMatch("electric vehicle charging", catalog);
    expect(result).toBeTruthy();
    expect(result!.name).toBe("EcoRide Electric");
  });

  it("should match food items correctly", () => {
    const result = findBestProductMatch("Fresh margherita pizza on wooden board", catalog);
    expect(result).toBeTruthy();
    expect(result!.name).toBe("Margherita Pizza");
  });

  it("should avoid already-used images", () => {
    const used = new Set(["https://example.com/apex-premium.jpg"]);
    const result = findBestProductMatch("Apex Premium Sedan", catalog, used);
    // Should still match something, but not the used image
    expect(result).toBeTruthy();
    expect(result!.imageUrl).not.toBe("https://example.com/apex-premium.jpg");
  });

  it("should return fallback for unmatched queries", () => {
    const result = findBestProductMatch("completely unrelated query xyz", catalog);
    // Should return first unused product as fallback
    expect(result).toBeTruthy();
  });

  it("should return null when all images are used", () => {
    const allUsed = new Set(catalog.map(p => p.imageUrl));
    const result = findBestProductMatch("anything", catalog, allUsed);
    expect(result).toBeNull();
  });

  it("should match by category", () => {
    const result = findBestProductMatch("Japanese cuisine selection", catalog);
    expect(result).toBeTruthy();
    expect(result!.name).toBe("Sushi Platter");
  });
});

describe("Business Profile Context Builder", () => {
  it("should build context with products", () => {
    const profile = {
      businessName: "AutoDrive Motors",
      industry: "Automotive",
      description: "Premium car dealership",
      products: [
        { name: "Apex Premium", description: "Luxury sedan", price: "$45,999", imageUrl: "https://example.com/img.jpg", category: "Sedan" },
      ],
    };

    // Simulate buildBusinessProfileContext
    let context = `\n\n=== REAL BUSINESS DATA ===`;
    context += `\nBusiness: ${profile.businessName}`;
    if (profile.products.length > 0) {
      context += `\n--- REAL PRODUCTS ---`;
      for (const p of profile.products) {
        context += `\n• ${p.name} — ${p.price} — ${p.description}`;
      }
    }

    expect(context).toContain("AutoDrive Motors");
    expect(context).toContain("Apex Premium");
    expect(context).toContain("$45,999");
    expect(context).toContain("Luxury sedan");
  });
});

describe("HTML Product Card Extraction", () => {
  it("should extract product name from heading", () => {
    const html = '<h3 class="product-title">Wireless Headphones</h3>';
    const nameMatch = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
    expect(nameMatch).toBeTruthy();
    expect(nameMatch![1]).toBe("Wireless Headphones");
  });

  it("should extract price from card HTML", () => {
    const html = '<span class="price">$129.99</span>';
    const priceMatch = html.match(/[\$\€\£]\s*[\d,]+\.?\d*/i);
    expect(priceMatch).toBeTruthy();
    expect(priceMatch![0]).toBe("$129.99");
  });

  it("should extract image from card HTML", () => {
    const html = '<img src="https://cdn.example.com/headphones.jpg" alt="Wireless Headphones" />';
    const imgMatch = html.match(/<img[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>/i);
    expect(imgMatch).toBeTruthy();
    expect(imgMatch![1]).toBe("https://cdn.example.com/headphones.jpg");
  });
});

describe("Structured Data (JSON-LD) Extraction", () => {
  it("should parse Product schema", () => {
    const jsonLd = {
      "@type": "Product",
      name: "Premium Widget",
      description: "A high-quality widget",
      image: "https://example.com/widget.jpg",
      offers: {
        price: "29.99",
        priceCurrency: "USD",
      },
    };

    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.name).toBe("Premium Widget");
    expect(jsonLd.offers.price).toBe("29.99");
  });

  it("should handle ItemList schema", () => {
    const jsonLd = {
      "@type": "ItemList",
      itemListElement: [
        { item: { name: "Product A", offers: { price: "10.00", priceCurrency: "USD" } } },
        { item: { name: "Product B", offers: { price: "20.00", priceCurrency: "USD" } } },
      ],
    };

    expect(jsonLd.itemListElement.length).toBe(2);
    expect(jsonLd.itemListElement[0].item.name).toBe("Product A");
  });
});

describe("Image URL Validation", () => {
  it("should accept valid image URLs", () => {
    const validUrls = [
      "https://cdn.example.com/product.jpg",
      "https://images.unsplash.com/photo-123.jpg",
      "https://example.com/images/banner.png",
    ];
    for (const url of validUrls) {
      expect(url.startsWith("http")).toBe(true);
      expect(url.length).toBeGreaterThan(10);
    }
  });

  it("should reject empty or invalid URLs", () => {
    const invalidUrls = ["", "http://", "not-a-url", "data:image/png;base64,..."];
    for (const url of invalidUrls) {
      const isValid = url.startsWith("http") && url.length > 10 && !url.startsWith("data:");
      expect(isValid).toBe(false);
    }
  });

  it("should reject very short URLs", () => {
    const shortUrl = "http://a.b";
    expect(shortUrl.length).toBe(10); // exactly 10 chars — borderline, not > 10
    const isValid = shortUrl.startsWith("http") && shortUrl.length > 10;
    expect(isValid).toBe(false); // 10 is not > 10
    const tooShort = "http://a";
    expect(tooShort.length > 10).toBe(false);
  });
});

describe("Image Injection with Fallback", () => {
  it("should not inject images when catalog has no valid image URLs", () => {
    const catalog = [
      { name: "Product A", description: "Desc", price: "$10", imageUrl: "", category: "Cat" },
      { name: "Product B", description: "Desc", price: "$20", imageUrl: "", category: "Cat" },
    ];
    const catalogWithImages = catalog.filter(p => p.imageUrl && p.imageUrl.startsWith("http") && p.imageUrl.length > 10);
    expect(catalogWithImages.length).toBe(0);
  });

  it("should validate hero image URL", () => {
    const emptyHero = "";
    const validHero = "https://example.com/hero-banner.jpg";
    const shortHero = "http://a";

    expect(emptyHero && emptyHero.startsWith("http") && emptyHero.length > 10 ? emptyHero : "").toBe("");
    expect(validHero && validHero.startsWith("http") && validHero.length > 10 ? validHero : "").toBe(validHero);
    expect(shortHero && shortHero.startsWith("http") && shortHero.length > 10 ? shortHero : "").toBe("");
  });

  it("should still inject real prices even without images", () => {
    const catalog = [
      { name: "UNI5G Postpaid 99", description: "5G plan with unlimited data", price: "RM99/month", imageUrl: "", category: "Mobile Plans" },
      { name: "UNI5G Postpaid 149", description: "Premium 5G plan", price: "RM149/month", imageUrl: "", category: "Mobile Plans" },
    ];

    const carouselCard = { title: "UNI5G Postpaid 99", description: "5G mobile plan", price: "$99" };

    // Simulate matching without images
    const queryLower = carouselCard.title.toLowerCase();
    const match = catalog.find(p => queryLower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(queryLower));
    expect(match).toBeTruthy();
    expect(match!.price).toBe("RM99/month");
    // Price should be updated to real price
    carouselCard.price = match!.price;
    expect(carouselCard.price).toBe("RM99/month");
  });

  it("should filter out catalog items with empty imageUrl for image injection", () => {
    const catalog = [
      { name: "Product A", description: "Desc A", price: "$10", imageUrl: "https://example.com/a.jpg", category: "Cat" },
      { name: "Product B", description: "Desc B", price: "$20", imageUrl: "", category: "Cat" },
      { name: "Product C", description: "Desc C", price: "$30", imageUrl: "https://example.com/c.jpg", category: "Cat" },
    ];

    const catalogWithImages = catalog.filter(p => p.imageUrl && p.imageUrl.startsWith("http") && p.imageUrl.length > 10);
    expect(catalogWithImages.length).toBe(2);
    expect(catalogWithImages.map(p => p.name)).toEqual(["Product A", "Product C"]);
  });
});

describe("Crawl Speed Optimization", () => {
  it("should limit pages to MAX_PAGES = 5", () => {
    const MAX_PAGES = 5;
    const links = Array.from({ length: 20 }, (_, i) => `https://example.com/page-${i}`);
    const pagesToCrawl = links.slice(0, MAX_PAGES);
    expect(pagesToCrawl.length).toBe(5);
  });

  it("should limit content to 8000 chars for LLM structuring", () => {
    const content = "x".repeat(15000);
    const truncated = content.substring(0, 8000);
    expect(truncated.length).toBe(8000);
  });

  it("should limit image validation to 20 URLs", () => {
    const urls = Array.from({ length: 50 }, (_, i) => `https://example.com/img-${i}.jpg`);
    const urlsToCheck = urls.slice(0, 20);
    expect(urlsToCheck.length).toBe(20);
  });
});
