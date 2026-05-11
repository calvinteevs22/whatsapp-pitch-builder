/**
 * Deep Website Crawler — extracts structured product/service data with images
 * from client websites for hyper-personalized WhatsApp conversation mockups.
 *
 * Architecture:
 * 1. Crawl homepage + discover internal links (products, services, menu, about)
 * 2. Crawl up to 8 internal pages in parallel
 * 3. Extract raw HTML → structured data (images, prices, product names)
 * 4. Use LLM to intelligently structure the catalog from raw extractions
 * 5. Return a rich BusinessProfile with products/services ready for mockup generation
 */

import axios from "axios";
import { invokeLLM } from "./_core/llm";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExtractedProduct {
  name: string;
  description: string;
  price: string; // e.g. "$29.99", "From $50", "Free consultation"
  imageUrl: string; // absolute URL to the product image
  category: string; // e.g. "Main Course", "Sedan", "Premium Plan"
}

export interface ExtractedService {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
}

export interface BusinessProfile {
  businessName: string;
  industry: string;
  description: string;
  tagline: string;
  targetAudience: string;
  brandTone: string;
  logoUrl: string;
  heroImageUrl: string;
  products: ExtractedProduct[];
  services: ExtractedService[];
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  socialProof: {
    reviews: string[];
    ratings: string;
    testimonials: string[];
  };
  suggestedUseCases: Array<{
    title: string;
    messageType: "marketing" | "utility" | "authentication";
    description: string;
  }>;
  rawPageData: string; // condensed text for AI context
  detectedLanguage: string; // ISO language code detected from the website (e.g., 'pt', 'es', 'id', 'zh-CN')
}

interface CrawledPage {
  url: string;
  title: string;
  content: string;
  rawHtml: string; // raw HTML for language detection
  images: ExtractedImage[];
  links: string[];
  structuredData: any[];
  priceElements: PriceElement[];
  productCards: RawProductCard[];
}

interface ExtractedImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  context: string; // surrounding text
}

interface PriceElement {
  price: string;
  context: string; // surrounding text/heading
}

interface RawProductCard {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  link: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_PAGES = 5;
const CRAWL_TIMEOUT = 6000;
const IMAGE_CHECK_TIMEOUT = 3000;
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Pages we want to prioritize crawling
const PRIORITY_PATH_PATTERNS = [
  /\/(products?|shop|store|catalog|collection|menu|services?|offerings?|pricing|plans?|packages?)/i,
  /\/(about|about-us|our-story|team|who-we-are)/i,
  /\/(gallery|portfolio|showcase|work|projects)/i,
  /\/(contact|locations?|find-us|branches)/i,
  /\/(specials?|deals?|offers?|promotions?|sale)/i,
];

// Pages to skip
const SKIP_PATH_PATTERNS = [
  /\/(blog|news|press|media|article|post)\//i,
  /\/(login|signup|register|account|cart|checkout|privacy|terms|cookie|sitemap|faq)/i,
  /\.(pdf|jpg|png|gif|svg|css|js|xml|json|ico)$/i,
  /\/(wp-admin|wp-content|wp-includes|cdn-cgi)/i,
  /#/,
  /mailto:/i,
  /tel:/i,
  /javascript:/i,
];

// ─── Core Crawler ────────────────────────────────────────────────────────────

/**
 * Deep crawl a website and extract structured business data.
 * Returns a rich BusinessProfile with real products, images, and pricing.
 */
export async function deepCrawlWebsite(url: string): Promise<BusinessProfile> {
  const startTime = Date.now();
  console.log(`[Crawler] Starting deep crawl of ${url}`);

  // Step 1: Crawl the homepage
  const homepage = await crawlSinglePage(url);
  console.log(`[Crawler] Homepage crawled: ${homepage.title}, ${homepage.images.length} images, ${homepage.links.length} links, ${homepage.productCards.length} product cards (${Date.now() - startTime}ms)`);

  // Step 2: Discover and prioritize internal pages
  const internalLinks = discoverInternalLinks(url, homepage.links);
  console.log(`[Crawler] Found ${internalLinks.length} internal pages to crawl`);

  // Step 3: Crawl internal pages in parallel (up to MAX_PAGES)
  const pagesToCrawl = internalLinks.slice(0, MAX_PAGES);
  const crawlResults = await Promise.allSettled(
    pagesToCrawl.map(link => crawlSinglePage(link))
  );

  const allPages: CrawledPage[] = [homepage];
  for (const result of crawlResults) {
    if (result.status === "fulfilled") {
      allPages.push(result.value);
    }
  }
  console.log(`[Crawler] Successfully crawled ${allPages.length} pages total (${Date.now() - startTime}ms)`);

  // Step 4: Aggregate all extracted data
  const allImages = aggregateImages(allPages, url);
  const allProductCards = aggregateProductCards(allPages);
  const allPrices = aggregatePrices(allPages);
  const combinedContent = allPages.map(p => `[${p.title}] ${p.content}`).join("\n\n").substring(0, 8000);
  const structuredDataItems = allPages.flatMap(p => p.structuredData);

  console.log(`[Crawler] Aggregated: ${allImages.length} images, ${allProductCards.length} product cards, ${allPrices.length} prices (${Date.now() - startTime}ms)`);

  // Step 5: Validate image URLs in parallel (HEAD requests to check they actually load)
  const imagesToValidate = [
    ...allImages.map(img => img.src),
    ...allProductCards.filter(c => c.imageUrl).map(c => c.imageUrl),
  ];
  const uniqueUrls = Array.from(new Set(imagesToValidate));
  const validImageUrls = await validateImageUrls(uniqueUrls);
  console.log(`[Crawler] Image validation: ${validImageUrls.size}/${imagesToValidate.length} URLs accessible (${Date.now() - startTime}ms)`);

  // Filter out invalid images from product cards and images
  const validatedProductCards = allProductCards.map(card => ({
    ...card,
    imageUrl: validImageUrls.has(card.imageUrl) ? card.imageUrl : "",
  }));
  const validatedImages = allImages.filter(img => validImageUrls.has(img.src));

  // Step 6: Use LLM to intelligently structure the catalog
  const profile = await structureWithLLM({
    url,
    combinedContent,
    images: validatedImages,
    productCards: validatedProductCards,
    prices: allPrices,
    structuredData: structuredDataItems,
    pageCount: allPages.length,
  });

  // Step 7: Detect language from the homepage HTML (already crawled, no extra request)
  const detectedLanguage = detectLanguageFromHtml(homepage.rawHtml, url);
  console.log(`[Crawler] Detected language: ${detectedLanguage} (from ${url})`);

  console.log(`[Crawler] Deep crawl complete in ${Date.now() - startTime}ms`);
  return { ...profile, detectedLanguage };
}

/**
 * Validate image URLs by making HEAD requests.
 * Returns a Set of URLs that are accessible (return 200 with image content-type).
 */
async function validateImageUrls(urls: string[]): Promise<Set<string>> {
  const valid = new Set<string>();
  if (urls.length === 0) return valid;

  // Check up to 20 URLs in parallel with short timeout
  const urlsToCheck = urls.slice(0, 20);
  const results = await Promise.allSettled(
    urlsToCheck.map(async (url) => {
      try {
        const response = await axios.head(url, {
          timeout: IMAGE_CHECK_TIMEOUT,
          headers: {
            "User-Agent": USER_AGENT,
            "Accept": "image/*,*/*;q=0.8",
          },
          maxRedirects: 3,
          validateStatus: (status) => status < 400,
        });
        const contentType = response.headers["content-type"] || "";
        // Accept image content types, or unknown types that don't explicitly say HTML
        if (contentType.includes("image") || (!contentType.includes("text/html") && response.status === 200)) {
          return url;
        }
        return null;
      } catch {
        return null;
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      valid.add(result.value);
    }
  }

  return valid;
}

// ─── Single Page Crawler ─────────────────────────────────────────────────────

/**
 * Detect the primary language of a webpage from HTML attributes, meta tags, and TLD.
 * Returns a supported language code or 'en' as default.
 */
function detectLanguageFromHtml(html: string, url: string): string {
  // 1. Check <html lang="..."> attribute (most reliable)
  const htmlLangMatch = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);
  const htmlLang = htmlLangMatch?.[1]?.toLowerCase().trim() || "";

  // 2. Check <meta> language tags
  const metaLangMatch = html.match(/<meta[^>]*(?:http-equiv=["']content-language["'][^>]*content=["']([^"']+)["']|name=["']language["'][^>]*content=["']([^"']+)["'])/i);
  const metaLang = (metaLangMatch?.[1] || metaLangMatch?.[2] || "").toLowerCase().trim();

  // 3. Check og:locale
  const ogLocaleMatch = html.match(/<meta[^>]*property=["']og:locale["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:locale["']/i);
  const ogLocale = (ogLocaleMatch?.[1] || "").toLowerCase().replace("_", "-").trim();

  // 4. Extract TLD from URL
  let tld = "";
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split(".");
    tld = parts[parts.length - 1].toLowerCase();
    // Handle country-code second-level domains like .co.id, .com.br, .com.mx
    if (parts.length >= 3 && ["com", "co", "org", "net", "gov", "ac", "edu"].includes(parts[parts.length - 2])) {
      tld = parts[parts.length - 1].toLowerCase();
    }
  } catch {}

  // Language code mapping: normalize various codes to our supported languages
  const LANG_CODE_MAP: Record<string, string> = {
    // Hindi
    "hi": "hi", "hi-in": "hi", "hin": "hi",
    // Bengali
    "bn": "bn", "bn-in": "bn", "bn-bd": "bn", "ben": "bn",
    // Tamil
    "ta": "ta", "ta-in": "ta", "tam": "ta",
    // Marathi
    "mr": "mr", "mr-in": "mr", "mar": "mr",
    // Telugu
    "te": "te", "te-in": "te", "tel": "te",
    // Urdu
    "ur": "ur", "ur-pk": "ur", "ur-in": "ur", "urd": "ur",
    // Indonesian
    "id": "id", "id-id": "id", "in": "id", "ind": "id",
    // Simplified Chinese
    "zh": "zh-CN", "zh-cn": "zh-CN", "zh-hans": "zh-CN", "zh-sg": "zh-CN",
    // Traditional Chinese
    "zh-tw": "zh-TW", "zh-hk": "zh-TW", "zh-hant": "zh-TW", "zh-mo": "zh-TW",
    // Portuguese
    "pt": "pt", "pt-br": "pt", "pt-pt": "pt", "por": "pt",
    // Spanish
    "es": "es", "es-es": "es", "es-mx": "es", "es-ar": "es", "es-co": "es",
    "es-cl": "es", "es-pe": "es", "es-419": "es", "spa": "es",
    // English (default)
    "en": "en", "en-us": "en", "en-gb": "en", "en-au": "en", "en-in": "en",
  };

  // TLD to language mapping for country-code TLDs
  const TLD_LANG_MAP: Record<string, string> = {
    "br": "pt",       // Brazil
    "pt": "pt",       // Portugal
    "mx": "es",       // Mexico
    "ar": "es",       // Argentina
    "co": "es",       // Colombia
    "cl": "es",       // Chile
    "pe": "es",       // Peru
    "ve": "es",       // Venezuela
    "ec": "es",       // Ecuador
    "id": "id",       // Indonesia
    "cn": "zh-CN",    // China
    "tw": "zh-TW",    // Taiwan
    "hk": "zh-TW",    // Hong Kong
    "in": "hi",       // India (default to Hindi)
    "bd": "bn",       // Bangladesh
    "pk": "ur",       // Pakistan
  };

  // Priority: html lang > meta lang > og:locale > TLD
  const candidates = [htmlLang, metaLang, ogLocale].filter(Boolean);

  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase();
    // Try exact match first, then prefix match
    if (LANG_CODE_MAP[normalized]) return LANG_CODE_MAP[normalized];
    const prefix = normalized.split("-")[0];
    if (LANG_CODE_MAP[prefix]) return LANG_CODE_MAP[prefix];
  }

  // Fallback to TLD
  if (tld && TLD_LANG_MAP[tld]) return TLD_LANG_MAP[tld];

  return "en";
}

async function crawlSinglePage(url: string): Promise<CrawledPage> {
  try {
    const response = await axios.get(url, {
      timeout: CRAWL_TIMEOUT,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      maxRedirects: 3,
      validateStatus: (status) => status < 400,
    });

    const html = response.data as string;
    return {
      url,
      title: extractTitle(html),
      content: extractTextContent(html),
      rawHtml: html.substring(0, 2000), // keep first 2KB for language detection
      images: extractImages(html, url),
      links: extractLinks(html, url),
      structuredData: extractStructuredData(html),
      priceElements: extractPrices(html),
      productCards: extractProductCards(html, url),
    };
  } catch (error: any) {
    console.log(`[Crawler] Failed to crawl ${url}: ${error.message?.substring(0, 100)}`);
    return {
      url,
      title: "",
      content: "",
      rawHtml: "",
      images: [],
      links: [],
      structuredData: [],
      priceElements: [],
      productCards: [],
    };
  }
}

// ─── HTML Extraction Helpers ─────────────────────────────────────────────────

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  return (ogTitleMatch?.[1] || titleMatch?.[1] || "").replace(/\s+/g, " ").trim();
}

function extractTextContent(html: string): string {
  // Remove scripts, styles, nav, footer, header (keep main content)
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " [HEADER] ")
    // Keep headings with markers
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n## $1\n")
    // Keep list items
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    // Remove remaining tags
    .replace(/<[^>]+>/g, " ")
    // Decode entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    // Clean whitespace
    .replace(/\s+/g, " ")
    .trim();

  return text.substring(0, 5000);
}

function extractImages(html: string, baseUrl: string): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  const baseOrigin = new URL(baseUrl).origin;

  // Extract <img> tags
  const imgRegex = /<img[^>]*\s+(?:src|data-src|data-lazy-src)=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null && images.length < 30) {
    let src = match[1];
    if (!src || src.startsWith("data:") || src.includes(".svg") || src.includes("pixel.") || src.includes("spacer.")) continue;

    const resolved = resolveUrl(src, baseUrl, baseOrigin);
    if (!resolved) continue;
    src = resolved;

    // Extract alt text
    const altMatch = match[0].match(/alt=["']([^"']*?)["']/i);
    const alt = altMatch?.[1] || "";

    // Extract dimensions
    const widthMatch = match[0].match(/width=["']?(\d+)/i);
    const heightMatch = match[0].match(/height=["']?(\d+)/i);
    const width = widthMatch ? parseInt(widthMatch[1]) : undefined;
    const height = heightMatch ? parseInt(heightMatch[1]) : undefined;

    // Skip tiny images (icons, spacers)
    if (width && width < 80) continue;
    if (height && height < 80) continue;

    // Get surrounding context (text near the image)
    const imgPos = match.index;
    const contextStart = Math.max(0, imgPos - 200);
    const contextEnd = Math.min(html.length, imgPos + match[0].length + 200);
    const contextHtml = html.substring(contextStart, contextEnd);
    const context = contextHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 150);

    images.push({ src, alt, width, height, context });
  }

  // Also extract background images from CSS
  const bgRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgRegex.exec(html)) !== null && images.length < 30) {
    let src = match[1];
    if (!src || src.startsWith("data:") || src.includes(".svg")) continue;
    const resolvedBg = resolveUrl(src, baseUrl, baseOrigin);
    if (resolvedBg) {
      images.push({ src: resolvedBg, alt: "", context: "background image" });
    }
  }

  // Extract og:image
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    const src = resolveUrl(ogImageMatch[1], baseUrl, baseOrigin);
    if (src) {
      images.unshift({ src, alt: "og:image", context: "Open Graph hero image" });
    }
  }

  return images;
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const baseOrigin = new URL(baseUrl).origin;
  const linkRegex = /<a[^>]*href=["']([^"'#]+)["'][^>]*>/gi;
  let match;
  const seen = new Set<string>();

  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1].trim();
    if (!href) continue;

    const resolved = resolveUrl(href, baseUrl, baseOrigin);
    if (!resolved) continue;

    // Only same-origin links
    try {
      const linkUrl = new URL(resolved);
      if (linkUrl.origin !== baseOrigin) continue;
      const normalized = linkUrl.origin + linkUrl.pathname.replace(/\/$/, "");
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      links.push(normalized);
    } catch {
      continue;
    }
  }

  return links;
}

function extractStructuredData(html: string): any[] {
  const items: any[] = [];
  const ldJsonRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = ldJsonRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (Array.isArray(data)) {
        items.push(...data);
      } else {
        items.push(data);
      }
    } catch {
      // Invalid JSON-LD
    }
  }
  return items;
}

function extractPrices(html: string): PriceElement[] {
  const prices: PriceElement[] = [];

  // Common price patterns
  const pricePatterns = [
    // Currency symbol + number: $29.99, €50, £100
    /(?:[\$\€\£\¥]|USD|EUR|GBP|MYR|SGD|AED|INR|PHP|THB|IDR|VND|BRL|CAD|AUD|NZD|HKD|KRW|JPY|CNY|TWD|SAR|QAR|BHD|KWD|OMR|ZAR|NGN|KES|EGP|TRY|RUB|PLN|CZK|SEK|NOK|DKK|CHF|MXN|COP|PEN|CLP|ARS)\s*[\d,]+\.?\d*/gi,
    // Number + currency: 29.99 USD
    /[\d,]+\.?\d*\s*(?:USD|EUR|GBP|MYR|SGD|AED|INR)/gi,
    // "From $X" / "Starting at $X" patterns
    /(?:from|starting\s+at|as\s+low\s+as)\s*[\$\€\£]\s*[\d,]+\.?\d*/gi,
    // "price" class or data attribute patterns
    /class=["'][^"']*price[^"']*["'][^>]*>([^<]+)</gi,
  ];

  for (const pattern of pricePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null && prices.length < 30) {
      const price = (match[1] || match[0]).replace(/<[^>]+>/g, "").trim();
      if (price.length > 2 && price.length < 30) {
        // Get surrounding context
        const start = Math.max(0, match.index - 150);
        const end = Math.min(html.length, match.index + match[0].length + 150);
        const context = html.substring(start, end).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 100);
        prices.push({ price, context });
      }
    }
  }

  return prices;
}

function extractProductCards(html: string, baseUrl: string): RawProductCard[] {
  const cards: RawProductCard[] = [];
  const baseOrigin = new URL(baseUrl).origin;

  // Pattern 1: Look for common product card HTML patterns
  // <div class="product-card"> or similar
  const cardPatterns = [
    // Generic product card containers
    /class=["'][^"']*(?:product-card|product-item|menu-item|service-card|pricing-card|plan-card|package-card|listing-card|item-card|card-product)[^"']*["'][^>]*>([\s\S]*?)(?=<\/div>\s*<div[^>]*class=["'][^"']*(?:product-card|product-item|menu-item|service-card|pricing-card|plan-card|package-card|listing-card|item-card|card-product)|$)/gi,
    // Shopify product grids
    /class=["'][^"']*(?:grid__item|product-grid-item|collection-product)[^"']*["'][^>]*>([\s\S]*?)(?=<\/div>\s*<div[^>]*class=["'][^"']*(?:grid__item|product-grid-item|collection-product)|$)/gi,
    // WooCommerce products
    /class=["'][^"']*(?:woocommerce-loop-product|type-product)[^"']*["'][^>]*>([\s\S]*?)(?=<\/(?:li|div)>)/gi,
  ];

  for (const pattern of cardPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null && cards.length < 20) {
      const cardHtml = match[1] || match[0];
      const card = parseProductCard(cardHtml, baseUrl, baseOrigin);
      if (card && card.name) {
        cards.push(card);
      }
    }
  }

  // Pattern 2: Look for JSON-LD Product data
  const structuredData = extractStructuredData(html);
  for (const item of structuredData) {
    if (item["@type"] === "Product" || item["@type"] === "MenuItem" || item["@type"] === "Service") {
      const price = item.offers?.price || item.offers?.lowPrice || item.priceRange || "";
      const currency = item.offers?.priceCurrency || "";
      const imageUrl = Array.isArray(item.image) ? item.image[0] : item.image;
      cards.push({
        name: item.name || "",
        description: item.description?.substring(0, 150) || "",
        price: price ? `${currency} ${price}`.trim() : "",
        imageUrl: imageUrl ? resolveUrl(imageUrl, baseUrl, baseOrigin) || "" : "",
        link: item.url || "",
      });
    }
    // Handle ItemList with ListItems
    if (item["@type"] === "ItemList" && item.itemListElement) {
      for (const listItem of item.itemListElement) {
        if (listItem.item && listItem.item.name) {
          cards.push({
            name: listItem.item.name,
            description: listItem.item.description?.substring(0, 150) || "",
            price: listItem.item.offers?.price ? `${listItem.item.offers.priceCurrency || ""} ${listItem.item.offers.price}`.trim() : "",
            imageUrl: listItem.item.image ? resolveUrl(listItem.item.image, baseUrl, baseOrigin) || "" : "",
            link: listItem.item.url || "",
          });
        }
      }
    }
  }

  return cards;
}

function parseProductCard(cardHtml: string, baseUrl: string, baseOrigin: string): RawProductCard | null {
  // Extract image
  const imgMatch = cardHtml.match(/<img[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>/i);
  let imageUrl = "";
  if (imgMatch) {
    imageUrl = resolveUrl(imgMatch[1], baseUrl, baseOrigin) || "";
  }

  // Extract name from heading or title
  const nameMatch = cardHtml.match(/<(?:h[1-6]|span|a|div)[^>]*class=["'][^"']*(?:title|name|heading|product-name)[^"']*["'][^>]*>(.*?)<\/(?:h[1-6]|span|a|div)>/i)
    || cardHtml.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
  const name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, "").trim() : "";

  // Extract price
  const priceMatch = cardHtml.match(/(?:[\$\€\£\¥]|USD|EUR|GBP|MYR|SGD|AED|INR)\s*[\d,]+\.?\d*/i)
    || cardHtml.match(/class=["'][^"']*price[^"']*["'][^>]*>([^<]+)</i);
  const price = priceMatch ? (priceMatch[1] || priceMatch[0]).replace(/<[^>]+>/g, "").trim() : "";

  // Extract description
  const descMatch = cardHtml.match(/<(?:p|span|div)[^>]*class=["'][^"']*(?:description|desc|excerpt|summary|subtitle)[^"']*["'][^>]*>(.*?)<\/(?:p|span|div)>/i)
    || cardHtml.match(/<p[^>]*>(.*?)<\/p>/i);
  const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim().substring(0, 150) : "";

  // Extract link
    const linkMatch = cardHtml.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/i);
    const link: string = linkMatch ? (resolveUrl(linkMatch[1], baseUrl, baseOrigin) ?? "") : "";

  if (!name && !imageUrl) return null;

  return { name, description, price, imageUrl, link };
}

// ─── URL Resolution ──────────────────────────────────────────────────────────

function resolveUrl(href: string, baseUrl: string, baseOrigin: string): string | null {
  try {
    if (href.startsWith("data:") || href.startsWith("javascript:") || href.startsWith("mailto:")) return null;
    if (href.startsWith("//")) return "https:" + href;
    if (href.startsWith("/")) return baseOrigin + href;
    if (href.startsWith("http")) return href;
    // Relative URL
    const base = baseUrl.replace(/[^/]*$/, "");
    return base + href;
  } catch {
    return null;
  }
}

// ─── Link Discovery & Prioritization ─────────────────────────────────────────

function discoverInternalLinks(baseUrl: string, links: string[]): string[] {
  const baseOrigin = new URL(baseUrl).origin;
  const basePath = new URL(baseUrl).pathname;

  // Filter and score links
  const scored = links
    .filter(link => {
      // Skip the homepage itself
      try {
        const linkPath = new URL(link).pathname;
        if (linkPath === basePath || linkPath === basePath + "/") return false;
      } catch { return false; }
      // Skip unwanted paths
      return !SKIP_PATH_PATTERNS.some(p => p.test(link));
    })
    .map(link => {
      let score = 0;
      // Boost priority paths
      for (const pattern of PRIORITY_PATH_PATTERNS) {
        if (pattern.test(link)) {
          score += 10;
          break;
        }
      }
      // Prefer shorter paths (closer to root)
      const depth = (new URL(link).pathname.match(/\//g) || []).length;
      score -= depth;
      return { link, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.map(s => s.link);
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

function aggregateImages(pages: CrawledPage[], baseUrl: string): ExtractedImage[] {
  const seen = new Set<string>();
  const all: ExtractedImage[] = [];

  for (const page of pages) {
    for (const img of page.images) {
      // Deduplicate by URL
      const normalized = img.src.split("?")[0]; // Remove query params for dedup
      if (seen.has(normalized)) continue;
      seen.add(normalized);

      // Score image quality
      const isLikelyProduct = img.alt.length > 3 || img.context.length > 20;
      const isLargeEnough = !img.width || img.width >= 150;
      const isNotIcon = !img.src.includes("icon") && !img.src.includes("logo") && !img.src.includes("favicon");

      if (isLargeEnough && isNotIcon) {
        all.push(img);
      }
    }
  }

  // Sort: images with alt text and context first (more likely to be product images)
  return all.sort((a, b) => {
    const scoreA = (a.alt.length > 3 ? 10 : 0) + (a.context.length > 20 ? 5 : 0) + (a.width && a.width > 300 ? 5 : 0);
    const scoreB = (b.alt.length > 3 ? 10 : 0) + (b.context.length > 20 ? 5 : 0) + (b.width && b.width > 300 ? 5 : 0);
    return scoreB - scoreA;
  }).slice(0, 25);
}

function aggregateProductCards(pages: CrawledPage[]): RawProductCard[] {
  const seen = new Set<string>();
  const all: RawProductCard[] = [];

  for (const page of pages) {
    for (const card of page.productCards) {
      const key = `${card.name}|${card.price}`;
      if (seen.has(key) || !card.name) continue;
      seen.add(key);
      all.push(card);
    }
  }

  return all.slice(0, 30);
}

function aggregatePrices(pages: CrawledPage[]): PriceElement[] {
  const all: PriceElement[] = [];
  for (const page of pages) {
    all.push(...page.priceElements);
  }
  return all.slice(0, 30);
}

// ─── LLM Structuring ────────────────────────────────────────────────────────

interface CrawlData {
  url: string;
  combinedContent: string;
  images: ExtractedImage[];
  productCards: RawProductCard[];
  prices: PriceElement[];
  structuredData: any[];
  pageCount: number;
}

async function structureWithLLM(data: CrawlData): Promise<BusinessProfile> {
  // Build a rich context for the LLM
  const imageContext = data.images.slice(0, 15).map((img, i) =>
    `Image ${i + 1}: URL="${img.src}" | Alt="${img.alt}" | Context="${img.context}"`
  ).join("\n");

  const productCardContext = data.productCards.map((card, i) =>
    `Product ${i + 1}: Name="${card.name}" | Price="${card.price}" | Desc="${card.description}" | Image="${card.imageUrl}" | Link="${card.link}"`
  ).join("\n");

  const priceContext = data.prices.slice(0, 15).map((p, i) =>
    `Price ${i + 1}: ${p.price} — Context: "${p.context}"`
  ).join("\n");

  const structuredDataContext = data.structuredData.length > 0
    ? `Structured Data (JSON-LD):\n${JSON.stringify(data.structuredData.slice(0, 5), null, 2).substring(0, 2000)}`
    : "";

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a business analyst extracting structured data from crawled websites. Use ONLY real data — never invent products, prices, or descriptions. Match each product with its ACTUAL image URL from the crawled data. If no image, leave imageUrl empty. If no price found, use "Contact for pricing".

Industry must be one of: "E-Commerce", "Healthcare", "Food & Beverage", "Finance & Banking", "Travel & Hospitality", "Education", "Real Estate", "Automotive", "Retail", "Technology", "Beauty & Wellness", "Entertainment", "Logistics", "Insurance", "Telecommunications".

Suggest 3 WhatsApp conversation flows for THIS business using THEIR actual products.`
      },
      {
        role: "user",
        content: `Website: ${data.url} (${data.pageCount} pages crawled)

${productCardContext ? "PRODUCTS:\n" + productCardContext + "\n\n" : ""}${imageContext ? "IMAGES:\n" + imageContext + "\n\n" : ""}${priceContext ? "PRICES:\n" + priceContext + "\n\n" : ""}${structuredDataContext ? structuredDataContext + "\n\n" : ""}CONTENT:\n${data.combinedContent.substring(0, 4000)}

Extract up to 6 products and 4 services with REAL names, prices, descriptions, and image URLs from above.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "business_profile",
        strict: true,
        schema: {
          type: "object",
          properties: {
            businessName: { type: "string", description: "The business name as shown on the website" },
            industry: { type: "string", description: "One of the predefined industry values" },
            description: { type: "string", description: "2-3 sentence business description" },
            tagline: { type: "string", description: "Business tagline or slogan from the website" },
            targetAudience: { type: "string", description: "Who this business serves" },
            brandTone: { type: "string", description: "Brand voice/tone (e.g. professional, friendly, luxury)" },
            logoUrl: { type: "string", description: "URL to the business logo image" },
            heroImageUrl: { type: "string", description: "URL to the main hero/banner image" },
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  price: { type: "string" },
                  imageUrl: { type: "string" },
                  category: { type: "string" },
                },
                required: ["name", "description", "price", "imageUrl", "category"],
                additionalProperties: false,
              },
            },
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  price: { type: "string" },
                  imageUrl: { type: "string" },
                  category: { type: "string" },
                },
                required: ["name", "description", "price", "imageUrl", "category"],
                additionalProperties: false,
              },
            },
            contactPhone: { type: "string" },
            contactEmail: { type: "string" },
            contactAddress: { type: "string" },
            reviews: {
              type: "array",
              items: { type: "string" },
            },
            ratings: { type: "string" },
            testimonials: {
              type: "array",
              items: { type: "string" },
            },
            suggestedUseCases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  messageType: { type: "string", enum: ["marketing", "utility", "authentication"] },
                  description: { type: "string" },
                },
                required: ["title", "messageType", "description"],
                additionalProperties: false,
              },
            },
          },
          required: ["businessName", "industry", "description", "tagline", "targetAudience", "brandTone", "logoUrl", "heroImageUrl", "products", "services", "contactPhone", "contactEmail", "contactAddress", "reviews", "ratings", "testimonials", "suggestedUseCases"],
          additionalProperties: false,
        },
      },
    },
  });

  const parsed = JSON.parse(response.choices[0].message.content as string || "{}");

  // Validate and clean image URLs
  const validatedProducts = (parsed.products || []).map((p: any) => ({
    ...p,
    imageUrl: p.imageUrl && p.imageUrl.startsWith("http") ? p.imageUrl : "",
  }));

  const validatedServices = (parsed.services || []).map((s: any) => ({
    ...s,
    imageUrl: s.imageUrl && s.imageUrl.startsWith("http") ? s.imageUrl : "",
  }));

  return {
    businessName: parsed.businessName || "",
    industry: parsed.industry || "Retail",
    description: parsed.description || "",
    tagline: parsed.tagline || "",
    targetAudience: parsed.targetAudience || "",
    brandTone: parsed.brandTone || "professional",
    logoUrl: parsed.logoUrl && parsed.logoUrl.startsWith("http") ? parsed.logoUrl : "",
    heroImageUrl: parsed.heroImageUrl && parsed.heroImageUrl.startsWith("http") ? parsed.heroImageUrl : "",
    products: validatedProducts,
    services: validatedServices,
    contactInfo: {
      phone: parsed.contactPhone || "",
      email: parsed.contactEmail || "",
      address: parsed.contactAddress || "",
    },
    socialProof: {
      reviews: parsed.reviews || [],
      ratings: parsed.ratings || "",
      testimonials: parsed.testimonials || [],
    },
    suggestedUseCases: parsed.suggestedUseCases || [],
    rawPageData: data.combinedContent.substring(0, 3000),
    detectedLanguage: "en", // placeholder — overridden by deepCrawlWebsite
  };
}
