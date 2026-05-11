/**
 * Server-side Image Proxy
 * 
 * Proxies external images through the server to bypass hotlink protection,
 * CORS restrictions, and referrer checks. Images are fetched server-side
 * and streamed directly to the client with proper caching headers.
 * 
 * Features:
 * - Multiple fetch strategies (different Referer/User-Agent combos) for hotlink-protected sites
 * - Server-side batch validation endpoint for pre-checking image URLs
 * - Fallback URL parameter: if primary URL fails, redirect to fallback
 * - In-memory cache for recently validated URLs
 * 
 * Usage: GET /api/image-proxy?url=<encoded-url>&fallback=<encoded-fallback-url>
 * Validation: POST /api/image-validate { urls: string[] }
 */

import type { Express, Request, Response } from "express";
import axios from "axios";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const PROXY_TIMEOUT = 12000; // 12 seconds
const CACHE_DURATION = 86400; // 24 hours
const VALIDATION_TIMEOUT = 5000; // 5 seconds for validation

// Allowed image MIME types
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "image/bmp",
  "image/tiff",
]);

// In-memory cache: URL → { valid: boolean, checkedAt: number }
const validationCache = new Map<string, { valid: boolean; checkedAt: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Multiple fetch strategies to try when fetching an image.
 * Some sites block based on Referer, some on User-Agent, some on both.
 */
function getFetchStrategies(url: string) {
  const parsed = new URL(url);
  const origin = `${parsed.protocol}//${parsed.hostname}`;
  
  return [
    // Strategy 1: Pretend to be from the same site (Referer = origin)
    {
      name: "same-origin-referer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": origin + "/",
        "Origin": origin,
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "same-origin",
      },
    },
    // Strategy 2: No Referer at all (some sites allow direct access)
    {
      name: "no-referer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    },
    // Strategy 3: Google Referer (some sites whitelist Google)
    {
      name: "google-referer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": "https://www.google.com/",
        "Accept-Language": "en-US,en;q=0.9",
      },
    },
  ];
}

/**
 * Validate that a URL is a reasonable image URL
 */
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") return false;
    if (hostname.startsWith("10.") || hostname.startsWith("192.168.") || hostname.startsWith("172.")) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Try to fetch an image using multiple strategies.
 * Returns the response data and content-type, or null if all strategies fail.
 */
async function fetchImageWithStrategies(
  url: string,
  timeout: number = PROXY_TIMEOUT
): Promise<{ data: Buffer; contentType: string } | null> {
  const strategies = getFetchStrategies(url);

  for (const strategy of strategies) {
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout,
        maxContentLength: MAX_IMAGE_SIZE,
        headers: strategy.headers,
        maxRedirects: 5,
      });

      const contentType = response.headers["content-type"] || "image/jpeg";
      const baseType = contentType.split(";")[0].trim().toLowerCase();

      // Verify it's actually an image
      if (!ALLOWED_TYPES.has(baseType) && !baseType.startsWith("image/")) {
        continue; // Try next strategy
      }

      // Verify it's not a tiny placeholder (< 1KB is suspicious for a real product image)
      const data = Buffer.from(response.data);
      if (data.length < 500) {
        console.log(`[ImageProxy] Strategy "${strategy.name}" returned tiny image (${data.length} bytes) for ${url.substring(0, 80)}`);
        continue; // Try next strategy
      }

      return { data, contentType };
    } catch (err: any) {
      // Try next strategy
      continue;
    }
  }

  return null; // All strategies failed
}

/**
 * Validate a single URL: can we actually fetch it as an image?
 * Uses cache to avoid repeated checks.
 */
export async function validateImageUrlDeep(url: string): Promise<boolean> {
  // Check cache first
  const cached = validationCache.get(url);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL) {
    return cached.valid;
  }

  if (!isValidImageUrl(url)) {
    validationCache.set(url, { valid: false, checkedAt: Date.now() });
    return false;
  }

  const result = await fetchImageWithStrategies(url, VALIDATION_TIMEOUT);
  const valid = result !== null;
  validationCache.set(url, { valid, checkedAt: Date.now() });
  return valid;
}

/**
 * Batch validate multiple image URLs.
 * Returns a Set of URLs that are actually fetchable.
 */
export async function batchValidateImageUrls(urls: string[]): Promise<Set<string>> {
  const valid = new Set<string>();
  if (urls.length === 0) return valid;

  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const isValid = await validateImageUrlDeep(url);
      return { url, isValid };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.isValid) {
      valid.add(result.value.url);
    }
  }

  return valid;
}

/**
 * Register the image proxy route on the Express app
 */
export function registerImageProxyRoute(app: Express): void {
  // Main proxy endpoint
  app.get("/api/image-proxy", async (req: Request, res: Response) => {
    const url = req.query.url as string;
    const fallbackUrl = req.query.fallback as string | undefined;

    if (!url) {
      res.status(400).json({ error: "Missing url parameter" });
      return;
    }

    if (!isValidImageUrl(url)) {
      res.status(400).json({ error: "Invalid image URL" });
      return;
    }

    try {
      const result = await fetchImageWithStrategies(url);

      if (result) {
        // Success — serve the image
        res.set({
          "Content-Type": result.contentType,
          "Content-Length": result.data.length.toString(),
          "Cache-Control": `public, max-age=${CACHE_DURATION}, immutable`,
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff",
          "X-Image-Source": "proxy",
        });
        res.send(result.data);
        return;
      }

      // All strategies failed — try fallback URL if provided
      if (fallbackUrl && isValidImageUrl(fallbackUrl)) {
        const fallbackResult = await fetchImageWithStrategies(fallbackUrl);
        if (fallbackResult) {
          res.set({
            "Content-Type": fallbackResult.contentType,
            "Content-Length": fallbackResult.data.length.toString(),
            "Cache-Control": `public, max-age=${CACHE_DURATION}, immutable`,
            "Access-Control-Allow-Origin": "*",
            "X-Content-Type-Options": "nosniff",
            "X-Image-Source": "fallback",
          });
          res.send(fallbackResult.data);
          return;
        }
      }

      // Everything failed — return error so browser onError fires
      res.status(502).json({ error: "Failed to fetch image" });
    } catch (err: any) {
      res.status(502).json({ error: "Failed to fetch image" });
    }
  });

  // Batch validation endpoint — used by server-side code to pre-check URLs
  app.post("/api/image-validate", async (req: Request, res: Response) => {
    const { urls } = req.body || {};
    if (!Array.isArray(urls) || urls.length === 0) {
      res.status(400).json({ error: "Missing urls array" });
      return;
    }

    // Limit to 20 URLs per request
    const urlsToCheck = urls.slice(0, 20).filter((u: string) => typeof u === "string" && isValidImageUrl(u));
    const validUrls = await batchValidateImageUrls(urlsToCheck);

    res.json({
      results: urlsToCheck.map((url: string) => ({
        url,
        valid: validUrls.has(url),
      })),
    });
  });
}

/**
 * Convert an external image URL to a proxied URL.
 * Optionally include a fallback URL that will be tried if the primary fails.
 */
export function getProxiedImageUrl(originalUrl: string, fallbackUrl?: string): string {
  if (!originalUrl || !originalUrl.startsWith("http")) return originalUrl;
  let proxyUrl = `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
  if (fallbackUrl && fallbackUrl.startsWith("http")) {
    proxyUrl += `&fallback=${encodeURIComponent(fallbackUrl)}`;
  }
  return proxyUrl;
}
