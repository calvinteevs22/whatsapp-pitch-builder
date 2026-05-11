import puppeteer from "puppeteer-core";
import omggif from "omggif";
import { PNG } from "pngjs";

/**
 * Quantize RGBA pixel data to a 256-color indexed palette.
 * Uses a simple frequency-based approach: reduce color space,
 * pick the most common colors, and map each pixel to the nearest palette entry.
 */
function quantizeFrame(
  rgbaData: Buffer | Uint8Array,
  width: number,
  height: number
): { palette: number[]; indices: Uint8Array } {
  const colorMap = new Map<number, { r: number; g: number; b: number; count: number }>();

  for (let i = 0; i < rgbaData.length; i += 4) {
    // Reduce color space to ~32K colors (5-6-5 bits)
    const r = rgbaData[i] & 0xf8;
    const g = rgbaData[i + 1] & 0xfc;
    const b = rgbaData[i + 2] & 0xf8;
    const key = (r << 8) | (g << 4) | b;
    const existing = colorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, { r: rgbaData[i], g: rgbaData[i + 1], b: rgbaData[i + 2], count: 1 });
    }
  }

  // Sort by frequency, take top colors
  const sorted = Array.from(colorMap.entries()).sort((a, b) => b[1].count - a[1].count);

  // omggif requires palette size to be a power of 2
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

  // Map each pixel to the nearest palette index
  const indices = new Uint8Array(width * height);
  for (let i = 0; i < rgbaData.length; i += 4) {
    const r = rgbaData[i] & 0xf8;
    const g = rgbaData[i + 1] & 0xfc;
    const b = rgbaData[i + 2] & 0xf8;
    const key = (r << 8) | (g << 4) | b;
    const idx = colorToIndex.get(key);
    indices[i / 4] = idx !== undefined ? idx : 0;
  }

  return { palette, indices };
}

/**
 * Decode a PNG buffer into RGBA pixel data using pngjs (pure JS).
 */
function decodePng(pngBuffer: Buffer): { width: number; height: number; data: Buffer } {
  const decoded = PNG.sync.read(pngBuffer);
  return { width: decoded.width, height: decoded.height, data: decoded.data };
}

/**
 * Generate an animated GIF from an interactive HTML string.
 * Uses Puppeteer to capture frames as messages appear one by one,
 * then combines them using omggif (pure JS, no native dependencies).
 */
export async function htmlToAnimatedGif(
  html: string,
  messageCount: number
): Promise<Buffer> {
  const WIDTH = 375;
  const HEIGHT = 680;
  const SCALE = 1; // Keep scale at 1 for manageable GIF size

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: SCALE,
    });

    // Modify the HTML to show all messages rendered but hidden,
    // then progressively reveal them for each frame
    let staticHtml = html;

    staticHtml = staticHtml.replace(
      "</style>",
      `
      .msg-row { opacity: 0 !important; transform: none !important; transition: none !important; max-height: 0 !important; overflow: hidden !important; margin: 0 !important; }
      .msg-row.gif-visible { opacity: 1 !important; max-height: 9999px !important; margin-bottom: 2px !important; }
      .controls { display: none !important; }
      .footer { display: none !important; }
      .header { display: none !important; }
      body { padding: 0 !important; min-height: auto !important; background: transparent !important; }
      .typing-indicator { display: none !important; }
      .waiting-prompt { display: none !important; }
      </style>`
    );

    // Replace the initialization script to render all messages but keep them hidden
    staticHtml = staticHtml.replace(
      /\/\/ Initialize[\s\S]*?<\/script>/,
      `// Initialize - render all but keep hidden
renderAll();
</script>`
    );

    await page.setContent(staticHtml, { waitUntil: "networkidle0", timeout: 30000 });
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 800)));

    const phoneEl = await page.$(".phone");
    if (!phoneEl) throw new Error("Phone element not found");

    const pngFrames: Buffer[] = [];

    // Capture initial empty state
    const initialFrame = await phoneEl.screenshot({ type: "png" });
    pngFrames.push(Buffer.from(initialFrame));

    // Progressively reveal messages and capture each frame
    for (let i = 0; i < messageCount; i++) {
      await page.evaluate((index: number) => {
        const rows = document.querySelectorAll(".msg-row");
        if (rows[index]) {
          (rows[index] as HTMLElement).classList.add("gif-visible");
          const chatArea = document.querySelector(".chat-area");
          if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        }
      }, i);

      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 100)));

      const frame = await phoneEl.screenshot({ type: "png" });
      pngFrames.push(Buffer.from(frame));
    }

    // Hold the last frame longer (add it 4 more times)
    if (pngFrames.length > 0) {
      const lastFrame = pngFrames[pngFrames.length - 1];
      for (let i = 0; i < 4; i++) {
        pngFrames.push(lastFrame);
      }
    }

    // Now encode all PNG frames into an animated GIF using omggif + pngjs
    // First, decode the first frame to get dimensions
    const firstDecoded = decodePng(pngFrames[0]);
    const gifWidth = firstDecoded.width;
    const gifHeight = firstDecoded.height;

    // Allocate buffer for GIF (generous size)
    const gifBufSize = gifWidth * gifHeight * pngFrames.length * 2 + 1024;
    const gifBuf = Buffer.alloc(gifBufSize);
    const gif = new omggif.GifWriter(gifBuf, gifWidth, gifHeight, { loop: 0 });

    for (const framePng of pngFrames) {
      const decoded = decodePng(framePng);
      const { palette, indices } = quantizeFrame(decoded.data, decoded.width, decoded.height);
      gif.addFrame(0, 0, decoded.width, decoded.height, indices, {
        palette,
        delay: 80, // 800ms (delay is in centiseconds)
      });
    }

    const gifData = gifBuf.slice(0, gif.end());
    return gifData;
  } finally {
    await browser.close();
  }
}
