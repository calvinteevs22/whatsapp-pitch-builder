import { describe, it, expect } from "vitest";
import { getProxiedImageUrl } from "./imageProxyRoute";

describe("getProxiedImageUrl", () => {
  it("wraps a valid HTTP URL in the proxy endpoint", () => {
    const url = "https://example.com/images/product.jpg";
    const result = getProxiedImageUrl(url);
    expect(result).toBe(`/api/image-proxy?url=${encodeURIComponent(url)}`);
  });

  it("wraps HTTPS URLs correctly", () => {
    const url = "https://cdn.shopify.com/s/files/product.png";
    const result = getProxiedImageUrl(url);
    expect(result).toContain("/api/image-proxy?url=");
    expect(result).toContain(encodeURIComponent(url));
  });

  it("returns empty string unchanged", () => {
    expect(getProxiedImageUrl("")).toBe("");
  });

  it("returns non-HTTP URLs unchanged", () => {
    expect(getProxiedImageUrl("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
    expect(getProxiedImageUrl("/local/image.png")).toBe("/local/image.png");
  });

  it("handles URLs with special characters", () => {
    const url = "https://example.com/img?id=123&size=large";
    const result = getProxiedImageUrl(url);
    expect(result).toContain(encodeURIComponent(url));
  });

  it("handles URLs with unicode characters", () => {
    const url = "https://example.com/产品/image.jpg";
    const result = getProxiedImageUrl(url);
    expect(result).toContain("/api/image-proxy?url=");
  });

  it("preserves the full URL including path and query params", () => {
    const url = "https://unifi.com.my/sites/default/files/2024-11/iPhone-16-Pro-Max.png";
    const result = getProxiedImageUrl(url);
    const decoded = decodeURIComponent(result.replace("/api/image-proxy?url=", ""));
    expect(decoded).toBe(url);
  });

  it("includes fallback URL when provided", () => {
    const url = "https://example.com/product.jpg";
    const fallback = "https://images.unsplash.com/photo-123?w=400";
    const result = getProxiedImageUrl(url, fallback);
    expect(result).toContain(`url=${encodeURIComponent(url)}`);
    expect(result).toContain(`fallback=${encodeURIComponent(fallback)}`);
  });

  it("does not include fallback when not provided", () => {
    const url = "https://example.com/product.jpg";
    const result = getProxiedImageUrl(url);
    expect(result).not.toContain("fallback=");
  });

  it("does not include fallback when fallback is non-HTTP", () => {
    const url = "https://example.com/product.jpg";
    const result = getProxiedImageUrl(url, "/local/fallback.png");
    expect(result).not.toContain("fallback=");
  });

  it("does not include fallback when fallback is empty", () => {
    const url = "https://example.com/product.jpg";
    const result = getProxiedImageUrl(url, "");
    expect(result).not.toContain("fallback=");
  });
});
