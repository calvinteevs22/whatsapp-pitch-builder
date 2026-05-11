import { describe, expect, it } from "vitest";

// Test the pure JS GIF encoding pipeline (omggif + pngjs)
// These are server-side tests for the encoding utilities
// The actual GIF generation now happens client-side using html-to-image + modern-gif

describe("gifGenerator - pure JS pipeline", () => {
  it("can create a valid GIF from quantized pixel data using omggif", async () => {
    const omggif = await import("omggif");

    const WIDTH = 50;
    const HEIGHT = 50;

    const gifBuf = Buffer.alloc(WIDTH * HEIGHT * 10);
    const gif = new omggif.GifWriter(gifBuf, WIDTH, HEIGHT, { loop: 0 });

    // Create 3 frames with different palette colors
    const colors = [
      [0x075e54, 0x25d366, 0xece5dd, 0xffffff],
      [0x25d366, 0x075e54, 0xece5dd, 0xffffff],
      [0xece5dd, 0x25d366, 0x075e54, 0xffffff],
    ];

    for (const palette of colors) {
      const indices = new Uint8Array(WIDTH * HEIGHT);
      indices.fill(0);
      gif.addFrame(0, 0, WIDTH, HEIGHT, indices, { palette, delay: 80 });
    }

    const gifData = gifBuf.slice(0, gif.end());

    // Verify it's a valid GIF89a
    expect(gifData).toBeTruthy();
    expect(gifData.length).toBeGreaterThan(0);
    expect(gifData.slice(0, 6).toString()).toBe("GIF89a");
  });

  it("can decode PNG with pngjs and extract pixel data", async () => {
    const { PNG } = await import("pngjs");

    // Create a test PNG
    const png = new PNG({ width: 10, height: 10 });
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const idx = (y * 10 + x) * 4;
        png.data[idx] = 255;   // R
        png.data[idx + 1] = 0; // G
        png.data[idx + 2] = 0; // B
        png.data[idx + 3] = 255; // A
      }
    }
    const pngBuffer = PNG.sync.write(png);

    // Decode it back
    const decoded = PNG.sync.read(pngBuffer);
    expect(decoded.width).toBe(10);
    expect(decoded.height).toBe(10);
    expect(decoded.data[0]).toBe(255); // R
    expect(decoded.data[1]).toBe(0);   // G
    expect(decoded.data[2]).toBe(0);   // B
    expect(decoded.data[3]).toBe(255); // A
  });

  it("generates a multi-frame animated GIF with correct structure", async () => {
    const omggif = await import("omggif");
    const { PNG } = await import("pngjs");

    const WIDTH = 20;
    const HEIGHT = 20;
    const FRAME_COUNT = 5;

    // Create PNG frames
    const pngFrames: Buffer[] = [];
    for (let f = 0; f < FRAME_COUNT; f++) {
      const png = new PNG({ width: WIDTH, height: HEIGHT });
      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          const idx = (y * WIDTH + x) * 4;
          png.data[idx] = f * 50;         // R varies by frame
          png.data[idx + 1] = 255 - f * 50; // G varies
          png.data[idx + 2] = 128;        // B constant
          png.data[idx + 3] = 255;        // A
        }
      }
      pngFrames.push(PNG.sync.write(png));
    }

    // Decode and quantize each frame, then encode as GIF
    const gifBuf = Buffer.alloc(WIDTH * HEIGHT * FRAME_COUNT * 10);
    const gif = new omggif.GifWriter(gifBuf, WIDTH, HEIGHT, { loop: 0 });

    for (const framePng of pngFrames) {
      const decoded = PNG.sync.read(framePng);
      // Simple quantization
      const colorMap = new Map<number, { r: number; g: number; b: number; count: number }>();
      for (let i = 0; i < decoded.data.length; i += 4) {
        const r = decoded.data[i] & 0xf8;
        const g = decoded.data[i + 1] & 0xfc;
        const b = decoded.data[i + 2] & 0xf8;
        const key = (r << 8) | (g << 4) | b;
        const existing = colorMap.get(key);
        if (existing) existing.count++;
        else colorMap.set(key, { r: decoded.data[i], g: decoded.data[i + 1], b: decoded.data[i + 2], count: 1 });
      }

      const sorted = Array.from(colorMap.entries()).sort((a, b) => b[1].count - a[1].count);
      let palettePow2 = 2;
      while (palettePow2 < Math.min(256, sorted.length)) palettePow2 *= 2;
      if (palettePow2 > 256) palettePow2 = 256;

      const palette: number[] = [];
      const colorToIndex = new Map<number, number>();
      for (let i = 0; i < palettePow2; i++) {
        if (i < sorted.length) {
          const c = sorted[i][1];
          palette.push((c.r << 16) | (c.g << 8) | c.b);
          colorToIndex.set(sorted[i][0], i);
        } else {
          palette.push(0x000000);
        }
      }

      const indices = new Uint8Array(WIDTH * HEIGHT);
      for (let i = 0; i < decoded.data.length; i += 4) {
        const r = decoded.data[i] & 0xf8;
        const g = decoded.data[i + 1] & 0xfc;
        const b = decoded.data[i + 2] & 0xf8;
        const key = (r << 8) | (g << 4) | b;
        indices[i / 4] = colorToIndex.get(key) || 0;
      }

      gif.addFrame(0, 0, WIDTH, HEIGHT, indices, { palette, delay: 80 });
    }

    const gifData = gifBuf.slice(0, gif.end());

    // Valid GIF
    expect(gifData.slice(0, 6).toString()).toBe("GIF89a");
    expect(gifData.length).toBeGreaterThan(100);
  });
});

describe("gifGenerator - export procedures exist", () => {
  it("exportGif procedure exists on the thread router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("thread.exportGif");
  });

  it("exportHtml procedure exists on the thread router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("thread.exportHtml");
  });
});
