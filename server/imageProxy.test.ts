import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock axios
vi.mock("axios", () => {
  return {
    default: {
      get: vi.fn(),
    },
  };
});

import axios from "axios";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("imageProxy.fetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a base64 data URL for a valid image URL", async () => {
    const fakeImageBuffer = Buffer.from("fake-image-data");
    (axios.get as any).mockResolvedValueOnce({
      data: fakeImageBuffer,
      headers: { "content-type": "image/png" },
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.imageProxy.fetch({ url: "https://example.com/image.png" });

    expect(result.dataUrl).toBeTruthy();
    expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(axios.get).toHaveBeenCalledWith("https://example.com/image.png", {
      responseType: "arraybuffer",
      timeout: 10000,
    });
  });

  it("returns null dataUrl when fetch fails", async () => {
    (axios.get as any).mockRejectedValueOnce(new Error("Network error"));

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.imageProxy.fetch({ url: "https://example.com/broken.png" });

    expect(result.dataUrl).toBeNull();
  });

  it("uses image/png as default content type when not provided", async () => {
    const fakeImageBuffer = Buffer.from("fake-image-data");
    (axios.get as any).mockResolvedValueOnce({
      data: fakeImageBuffer,
      headers: {},
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.imageProxy.fetch({ url: "https://example.com/image" });

    expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
