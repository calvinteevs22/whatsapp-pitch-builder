import puppeteer from "puppeteer-core";

/**
 * Generate a PNG screenshot from an HTML string using headless Chromium.
 * All images should already be embedded as base64 data URLs in the HTML.
 */
export async function htmlToScreenshot(html: string): Promise<Buffer> {
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
    await page.setViewport({ width: 420, height: 900, deviceScaleFactor: 2 });
    
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
    
    // Wait for any images to render
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

    // Find the phone element and screenshot it
    const phoneEl = await page.$(".phone");
    if (!phoneEl) {
      throw new Error("Phone element not found in HTML");
    }

    const screenshot = await phoneEl.screenshot({
      type: "png",
      omitBackground: true,
    });

    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
}
