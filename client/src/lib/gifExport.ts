/**
 * Client-side animated GIF generation for WhatsApp conversation.
 *
 * Strategy: Draw the WhatsApp conversation directly on a Canvas 2D context.
 * This avoids all CORS/security issues with html2canvas and html-to-image.
 * 
 * Animation flow:
 * 1. Empty chat → messages appear one by one
 * 2. When a carousel message appears → extra frames scroll through cards inline
 *    (simulating a thumb swipe through the horizontal carousel strip)
 * 3. When a list message appears → extra frame shows the dropdown expanded
 * 4. After user "selects" from list → next message appears
 *
 * Uses gif.js for reliable GIF encoding with Web Workers.
 */

// @ts-expect-error gif.js has no type declarations
import GIF from "gif.js";
import type { MessageContent, CarouselCard } from "../../../shared/types";

// ─── Constants (3x resolution for presentation-quality output) ─────────────
const SCALE = 3;
const W = 375 * SCALE;
const H = 667 * SCALE;
const S = SCALE; // shorthand

const WA_BG = "#ECE5DD";
const WA_HEADER_BG = "#075E54";
const WA_HEADER_TEXT = "#FFFFFF";
const WA_OUTBOUND_BG = "#DCF8C6";
const WA_INBOUND_BG = "#FFFFFF";
const WA_TEXT_COLOR = "#111B21";
const WA_TIME_COLOR = "#667781";
const WA_BUTTON_COLOR = "#00A884";
const WA_SYSTEM_BG = "#FCF4CB";
const WA_SYSTEM_TEXT = "#54656F";
const BUBBLE_RADIUS = 8 * S;
const PADDING = 10 * S;
const MSG_MAX_W = 260 * S;
const FONT = `${14 * S}px sans-serif`;
const FONT_BOLD = `bold ${14 * S}px sans-serif`;
const FONT_SMALL = `${11 * S}px sans-serif`;
const FONT_HEADER = `bold ${16 * S}px sans-serif`;
const FONT_HEADER_SMALL = `${12 * S}px sans-serif`;
const HEADER_H = 60 * S;
const INPUT_BAR_H = 50 * S;
const CHAT_TOP = HEADER_H;
const CHAT_BOTTOM = H - INPUT_BAR_H;

// Carousel inline card constants (matching the real WhatsApp UI proportions)
const CAROUSEL_CARD_W = 170 * S;  // Each card width in the strip
const CAROUSEL_CARD_IMG_H = 95 * S; // Image portion height
const CAROUSEL_CARD_CONTENT_H = 75 * S; // Text + button portion
const CAROUSEL_CARD_TOTAL_H = CAROUSEL_CARD_IMG_H + CAROUSEL_CARD_CONTENT_H;
const CAROUSEL_GAP = 6 * S; // Gap between cards

// List overlay constants
const LIST_OVERLAY_BG = "rgba(0,0,0,0.5)";

export interface SimpleMessage {
  direction: "inbound" | "outbound";
  content: MessageContent;
  timestamp: string | null;
}

interface GifExportOptions {
  messages: SimpleMessage[];
  businessName: string;
  profileInitials: string;
  /** Pre-loaded image map: original URL -> data URL (base64) */
  preloadedImages?: Map<string, string>;
  frameDelay?: number;
  onProgress?: (current: number, total: number) => void;
}

// ─── Frame descriptor for the animation sequence ──────────────────────────
interface FrameDescriptor {
  /** How many messages to show (0 = empty chat) */
  visibleCount: number;
  /** If set, scroll the carousel at this message to show this card index centered */
  carouselScroll?: { msgIndex: number; cardIndex: number };
  /** If set, show a list dropdown overlay */
  listOverlay?: { msgIndex: number };
  /** If set, show typing indicator after the visible messages */
  typingIndicator?: boolean;
  /** Frame delay override (ms) */
  delay?: number;
}

// ─── Image cache ───────────────────────────────────────────────────────────
const imageCache = new Map<string, HTMLImageElement>();

async function loadImageFromDataUrl(dataUrl: string, originalUrl: string): Promise<HTMLImageElement | null> {
  if (imageCache.has(originalUrl)) return imageCache.get(originalUrl)!;
  try {
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image load failed"));
      setTimeout(() => reject(new Error("Image load timeout")), 5000);
    });
    imageCache.set(originalUrl, img);
    return img;
  } catch {
    return null;
  }
}

async function preloadImages(messages: SimpleMessage[], preloadedImages?: Map<string, string>): Promise<void> {
  if (!preloadedImages || preloadedImages.size === 0) return;
  const urls: string[] = [];
  for (const msg of messages) {
    const c = msg.content;
    if (c.headerImageUrl) urls.push(c.headerImageUrl);
    if (c.imageUrl) urls.push(c.imageUrl);
    if (c.carouselCards) {
      for (const card of c.carouselCards) {
        if (card.imageUrl) urls.push(card.imageUrl);
      }
    }
  }
  await Promise.allSettled(
    urls
      .filter(url => preloadedImages.has(url))
      .map(url => loadImageFromDataUrl(preloadedImages.get(url)!, url))
  );
}

// ─── Text wrapping helper ───────────────────────────────────────────────────
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [""];
}

// ─── Draw rounded rect ─────────────────────────────────────────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Draw the static WhatsApp chrome ───────────────────────────────────────
function drawChrome(ctx: CanvasRenderingContext2D, businessName: string, initials: string) {
  // Background
  ctx.fillStyle = WA_BG;
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = WA_HEADER_BG;
  ctx.fillRect(0, 0, W, HEADER_H);

  // Back arrow
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = `${20 * S}px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("\u2190", 12 * S, 37 * S);

  // Avatar circle
  ctx.fillStyle = "#128C7E";
  ctx.beginPath();
  ctx.arc(55 * S, 30 * S, 18 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = `bold ${13 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(initials, 55 * S, 35 * S);
  ctx.textAlign = "left";

  // Business name
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = FONT_HEADER;
  const maxNameWidth = W - 80 * S - 80 * S;
  let displayName = businessName;
  while (ctx.measureText(displayName).width > maxNameWidth && displayName.length > 3) {
    displayName = displayName.substring(0, displayName.length - 1);
  }
  if (displayName !== businessName) displayName += "...";
  ctx.fillText(displayName, 80 * S, 30 * S);

  // Online status
  ctx.fillStyle = "#A0D9B4";
  ctx.font = FONT_HEADER_SMALL;
  ctx.fillText("online", 80 * S, 46 * S);

  // Verified badge
  ctx.font = FONT_HEADER;
  const actualNameW = ctx.measureText(displayName).width;
  ctx.fillStyle = "#25D366";
  ctx.beginPath();
  ctx.arc(80 * S + actualNameW + 10 * S, 25 * S, 7 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${9 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("\u2713", 80 * S + actualNameW + 10 * S, 28 * S);
  ctx.textAlign = "left";

  // Header icons
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = `${16 * S}px sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("\u22EE", W - 12 * S, 35 * S);
  ctx.textAlign = "left";

  // Input bar
  ctx.fillStyle = "#F0F0F0";
  ctx.fillRect(0, H - INPUT_BAR_H, W, INPUT_BAR_H);
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, 10 * S, H - INPUT_BAR_H + 8 * S, W - 65 * S, 34 * S, 20 * S);
  ctx.fill();
  ctx.fillStyle = "#999999";
  ctx.font = `${13 * S}px sans-serif`;
  ctx.fillText("Type a message", 45 * S, H - INPUT_BAR_H + 30 * S);

  // Mic button
  ctx.fillStyle = "#128C7E";
  ctx.beginPath();
  ctx.arc(W - 27 * S, H - INPUT_BAR_H + 25 * S, 20 * S, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Draw a single carousel card at a given position ─────────────────────
function drawCarouselCard(
  ctx: CanvasRenderingContext2D,
  card: CarouselCard,
  x: number,
  y: number,
  cardW: number,
) {
  const imgH = CAROUSEL_CARD_IMG_H;
  const totalH = CAROUSEL_CARD_TOTAL_H;

  // Card background
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, x, y, cardW, totalH, 8 * S);
  ctx.fill();

  // Card shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.08)";
  ctx.shadowBlur = 3 * S;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, x, y, cardW, totalH, 8 * S);
  ctx.fill();
  ctx.restore();

  // Card image
  const cardImg = card.imageUrl ? imageCache.get(card.imageUrl) : null;
  if (cardImg) {
    ctx.save();
    // Clip to top portion with rounded corners
    ctx.beginPath();
    ctx.moveTo(x + 8 * S, y);
    ctx.lineTo(x + cardW - 8 * S, y);
    ctx.quadraticCurveTo(x + cardW, y, x + cardW, y + 8 * S);
    ctx.lineTo(x + cardW, y + imgH);
    ctx.lineTo(x, y + imgH);
    ctx.lineTo(x, y + 8 * S);
    ctx.quadraticCurveTo(x, y, x + 8 * S, y);
    ctx.closePath();
    ctx.clip();
    const cScale = Math.max(cardW / cardImg.width, imgH / cardImg.height);
    ctx.drawImage(
      cardImg,
      x + (cardW - cardImg.width * cScale) / 2,
      y + (imgH - cardImg.height * cScale) / 2,
      cardImg.width * cScale,
      cardImg.height * cScale
    );
    ctx.restore();
  } else {
    // Placeholder
    ctx.fillStyle = "#E8E8E8";
    ctx.beginPath();
    ctx.moveTo(x + 8 * S, y);
    ctx.lineTo(x + cardW - 8 * S, y);
    ctx.quadraticCurveTo(x + cardW, y, x + cardW, y + 8 * S);
    ctx.lineTo(x + cardW, y + imgH);
    ctx.lineTo(x, y + imgH);
    ctx.lineTo(x, y + 8 * S);
    ctx.quadraticCurveTo(x, y, x + 8 * S, y);
    ctx.closePath();
    ctx.fill();
    if ((card as any).imageDescription) {
      ctx.fillStyle = "#888888";
      ctx.font = `${10 * S}px sans-serif`;
      ctx.textAlign = "center";
      const descLines = wrapText(ctx, (card as any).imageDescription, cardW - 16 * S);
      descLines.slice(0, 2).forEach((line, i) => {
        ctx.fillText(line, x + cardW / 2, y + imgH / 2 - 6 * S + i * 13 * S);
      });
      ctx.textAlign = "left";
    }
  }

  // Card title
  let textY = y + imgH + 8 * S;
  ctx.fillStyle = WA_TEXT_COLOR;
  ctx.font = `bold ${12 * S}px sans-serif`;
  const titleLines = wrapText(ctx, card.title, cardW - 16 * S);
  titleLines.slice(0, 1).forEach((line) => {
    ctx.fillText(line, x + 8 * S, textY + 12 * S);
    textY += 15 * S;
  });

  // Card description (truncated)
  if (card.description) {
    ctx.fillStyle = WA_TIME_COLOR;
    ctx.font = `${10 * S}px sans-serif`;
    const descLines = wrapText(ctx, card.description, cardW - 16 * S);
    descLines.slice(0, 1).forEach((line) => {
      ctx.fillText(line, x + 8 * S, textY + 10 * S);
      textY += 13 * S;
    });
  }

  // Card price
  if (card.price) {
    ctx.fillStyle = "#075E54";
    ctx.font = `bold ${12 * S}px sans-serif`;
    ctx.fillText(card.price, x + 8 * S, textY + 12 * S);
    textY += 16 * S;
  }

  // CTA button at bottom
  const btnY = y + totalH - 28 * S;
  // Separator line
  ctx.strokeStyle = "#E9EDEF";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, btnY);
  ctx.lineTo(x + cardW, btnY);
  ctx.stroke();
  // Button text
  ctx.fillStyle = WA_BUTTON_COLOR;
  ctx.font = `bold ${11 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(card.buttonText, x + cardW / 2, btnY + 18 * S);
  ctx.textAlign = "left";
}

// ─── Measure a single message bubble height ─────────────────────────────────
function measureMessage(ctx: CanvasRenderingContext2D, msg: SimpleMessage): number {
  const c = msg.content;
  let height = 0;
  const textMaxW = MSG_MAX_W - PADDING * 2;

  // Header image
  if (c.headerImageUrl || c.imageUrl || c.imageDescription) {
    height += 120 * S;
  }

  // Header text
  if (c.headerText) {
    ctx.font = FONT_BOLD;
    const lines = wrapText(ctx, c.headerText, textMaxW);
    height += lines.length * 18 * S + 4 * S;
  }

  // Body text
  const bodyText = c.bodyText || c.text || "";
  if (bodyText) {
    ctx.font = FONT;
    const lines = wrapText(ctx, bodyText, textMaxW);
    height += lines.length * 18 * S;
  }

  // Footer text
  if (c.footerText) {
    ctx.font = FONT_SMALL;
    const lines = wrapText(ctx, c.footerText, textMaxW);
    height += lines.length * 14 * S + 4 * S;
  }

  // Timestamp line
  height += 16 * S;

  // Buttons
  if (c.buttons && c.buttons.length > 0) {
    height += c.buttons.length * 32 * S + 4 * S;
  }

  // Carousel cards - show the full inline carousel strip
  if (c.carouselCards && c.carouselCards.length > 0) {
    height += CAROUSEL_CARD_TOTAL_H + 12 * S; // card height + padding
  }

  // List button
  if (c.listButtonText) {
    height += 36 * S;
  }

  return height + PADDING * 2;
}

// ─── Draw a single message bubble ───────────────────────────────────────────
function drawMessage(
  ctx: CanvasRenderingContext2D,
  msg: SimpleMessage,
  y: number,
  /** Which carousel card index to scroll to (0 = first card visible). -1 or undefined = default position */
  carouselScrollToCard?: number,
): number {
  const c = msg.content;
  // In the app data model: outbound = from business, inbound = from customer
  // In WhatsApp visual style: business messages are WHITE and LEFT-aligned,
  // customer messages are GREEN and RIGHT-aligned
  const isFromBusiness = msg.direction === "outbound";
  const isFromCustomer = msg.direction === "inbound";
  const bubbleBg = isFromBusiness ? WA_INBOUND_BG : WA_OUTBOUND_BG; // business=white, customer=green
  const textMaxW = MSG_MAX_W - PADDING * 2;

  const totalH = measureMessage(ctx, msg);
  const bubbleX = isFromCustomer ? W - MSG_MAX_W - 15 * S : 15 * S; // customer=right, business=left

  // Draw bubble background with shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.08)";
  ctx.shadowBlur = 3 * S;
  ctx.shadowOffsetY = 1 * S;
  ctx.fillStyle = bubbleBg;
  roundRect(ctx, bubbleX, y, MSG_MAX_W, totalH, BUBBLE_RADIUS);
  ctx.fill();
  ctx.restore();

  let currentY = y + PADDING;
  const textX = bubbleX + PADDING;

  // Header image
  if (c.headerImageUrl || c.imageUrl || c.imageDescription) {
    const imgUrl = c.headerImageUrl || c.imageUrl || "";
    const cachedImg = imgUrl ? imageCache.get(imgUrl) : null;
    if (cachedImg) {
      ctx.save();
      roundRect(ctx, bubbleX + 4 * S, currentY, MSG_MAX_W - 8 * S, 110 * S, BUBBLE_RADIUS);
      ctx.clip();
      const imgW = MSG_MAX_W - 8 * S;
      const imgH = 110 * S;
      const scale = Math.max(imgW / cachedImg.width, imgH / cachedImg.height);
      const drawW = cachedImg.width * scale;
      const drawH = cachedImg.height * scale;
      ctx.drawImage(cachedImg, bubbleX + 4 * S + (imgW - drawW) / 2, currentY + (imgH - drawH) / 2, drawW, drawH);
      ctx.restore();
    } else {
      // Placeholder
      ctx.fillStyle = "#E8E0D8";
      roundRect(ctx, bubbleX + 4 * S, currentY, MSG_MAX_W - 8 * S, 110 * S, BUBBLE_RADIUS);
      ctx.fill();
      const imgDesc = c.imageDescription || c.caption || "Image";
      ctx.fillStyle = "#888888";
      ctx.font = `${11 * S}px sans-serif`;
      ctx.textAlign = "center";
      const descLines = wrapText(ctx, imgDesc, MSG_MAX_W - 20 * S);
      const descStartY = currentY + 55 * S - (descLines.length * 13 * S) / 2;
      descLines.forEach((line, i) => {
        ctx.fillText(line, bubbleX + MSG_MAX_W / 2, descStartY + i * 13 * S);
      });
      ctx.textAlign = "left";
    }
    currentY += 120 * S;
  }

  // Header text
  if (c.headerText) {
    ctx.fillStyle = WA_TEXT_COLOR;
    ctx.font = FONT_BOLD;
    const lines = wrapText(ctx, c.headerText, textMaxW);
    lines.forEach((line) => {
      ctx.fillText(line, textX, currentY + 14 * S);
      currentY += 18 * S;
    });
    currentY += 4 * S;
  }

  // Body text
  const bodyText = c.bodyText || c.text || "";
  if (bodyText) {
    ctx.fillStyle = WA_TEXT_COLOR;
    ctx.font = FONT;
    const lines = wrapText(ctx, bodyText, textMaxW);
    lines.forEach((line) => {
      ctx.fillText(line, textX, currentY + 14 * S);
      currentY += 18 * S;
    });
  }

  // Footer text
  if (c.footerText) {
    currentY += 4 * S;
    ctx.fillStyle = WA_TIME_COLOR;
    ctx.font = FONT_SMALL;
    const lines = wrapText(ctx, c.footerText, textMaxW);
    lines.forEach((line) => {
      ctx.fillText(line, textX, currentY + 11 * S);
      currentY += 14 * S;
    });
  }

  // Timestamp
  const timeStr = msg.timestamp || "";
  ctx.fillStyle = WA_TIME_COLOR;
  ctx.font = FONT_SMALL;
  const timeWidth = ctx.measureText(timeStr).width;
  ctx.fillText(timeStr, bubbleX + MSG_MAX_W - PADDING - timeWidth - (isFromCustomer ? 16 * S : 0), currentY + 12 * S);

  // Read receipts for customer messages (right-aligned, like WhatsApp shows for sent messages)
  if (isFromCustomer) {
    ctx.fillStyle = "#53BDEB";
    ctx.font = `${10 * S}px sans-serif`;
    ctx.fillText("\u2713\u2713", bubbleX + MSG_MAX_W - PADDING - 14 * S, currentY + 12 * S);
  }
  currentY += 16 * S;

  // Buttons
  if (c.buttons && c.buttons.length > 0) {
    currentY += 2 * S;
    c.buttons.forEach((btn) => {
      ctx.strokeStyle = "#E0E0E0";
      ctx.lineWidth = 0.5 * S;
      ctx.beginPath();
      ctx.moveTo(bubbleX + 4 * S, currentY);
      ctx.lineTo(bubbleX + MSG_MAX_W - 4 * S, currentY);
      ctx.stroke();
      ctx.fillStyle = WA_BUTTON_COLOR;
      ctx.font = `bold ${13 * S}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(btn.title, bubbleX + MSG_MAX_W / 2, currentY + 20 * S);
      ctx.textAlign = "left";
      currentY += 32 * S;
    });
  }

  // Carousel cards - inline horizontal scroll strip
  if (c.carouselCards && c.carouselCards.length > 0) {
    currentY += 6 * S;
    const cards = c.carouselCards;
    const viewportW = MSG_MAX_W - 8 * S; // visible area width
    const stripX = bubbleX + 4 * S; // left edge of the carousel viewport
    const totalStripW = cards.length * CAROUSEL_CARD_W + (cards.length - 1) * CAROUSEL_GAP;

    // Calculate scroll offset based on which card to show
    let scrollOffset = 0;
    if (carouselScrollToCard !== undefined && carouselScrollToCard > 0) {
      // Scroll so the target card is at the left edge of the viewport
      scrollOffset = carouselScrollToCard * (CAROUSEL_CARD_W + CAROUSEL_GAP);
      // Clamp so we don't scroll past the end
      const maxScroll = Math.max(0, totalStripW - viewportW);
      scrollOffset = Math.min(scrollOffset, maxScroll);
    }

    // Clip to the carousel viewport area
    ctx.save();
    ctx.beginPath();
    ctx.rect(stripX, currentY, viewportW, CAROUSEL_CARD_TOTAL_H);
    ctx.clip();

    // Draw each card at its scrolled position
    for (let ci = 0; ci < cards.length; ci++) {
      const cardX = stripX + ci * (CAROUSEL_CARD_W + CAROUSEL_GAP) - scrollOffset;
      // Only draw if visible
      if (cardX + CAROUSEL_CARD_W > stripX - 10 * S && cardX < stripX + viewportW + 10 * S) {
        drawCarouselCard(ctx, cards[ci], cardX, currentY, CAROUSEL_CARD_W);
      }
    }

    ctx.restore();

    // Draw scroll indicator dots below the carousel
    const dotY = currentY + CAROUSEL_CARD_TOTAL_H + 4 * S;
    const dotSpacing = 8 * S;
    const dotsW = cards.length * dotSpacing;
    const dotStartX = bubbleX + (MSG_MAX_W - dotsW) / 2;
    const activeCard = carouselScrollToCard ?? 0;
    for (let i = 0; i < cards.length; i++) {
      ctx.fillStyle = i === activeCard ? WA_BUTTON_COLOR : "#CCCCCC";
      ctx.beginPath();
      ctx.arc(dotStartX + i * dotSpacing + 2 * S, dotY, (i === activeCard ? 3 : 2) * S, 0, Math.PI * 2);
      ctx.fill();
    }

    currentY += CAROUSEL_CARD_TOTAL_H + 12 * S;
  }

  // List button
  if (c.listButtonText) {
    currentY += 2 * S;
    ctx.strokeStyle = "#E0E0E0";
    ctx.lineWidth = 0.5 * S;
    ctx.beginPath();
    ctx.moveTo(bubbleX + 4 * S, currentY);
    ctx.lineTo(bubbleX + MSG_MAX_W - 4 * S, currentY);
    ctx.stroke();
    ctx.fillStyle = WA_BUTTON_COLOR;
    ctx.font = `bold ${13 * S}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`\u2630 ${c.listButtonText}`, bubbleX + MSG_MAX_W / 2, currentY + 22 * S);
    ctx.textAlign = "left";
    currentY += 36 * S;
  }

  return totalH;
}

// ─── Draw encryption notice ─────────────────────────────────────────────────
function drawEncryptionNotice(ctx: CanvasRenderingContext2D, y: number): number {
  const noticeH = 40 * S;
  const noticeW = W - 60 * S;
  const noticeX = 30 * S;
  ctx.fillStyle = WA_SYSTEM_BG;
  roundRect(ctx, noticeX, y, noticeW, noticeH, 6 * S);
  ctx.fill();
  ctx.fillStyle = WA_SYSTEM_TEXT;
  ctx.font = `${11 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Messages and calls are end-to-end", W / 2, y + 16 * S);
  ctx.fillText("encrypted.", W / 2, y + 30 * S);
  ctx.textAlign = "left";
  return noticeH;
}

// ─── Draw "TODAY" badge ─────────────────────────────────────────────────────
function drawTodayBadge(ctx: CanvasRenderingContext2D, y: number): number {
  const badgeW = 60 * S;
  const badgeH = 22 * S;
  const badgeX = (W - badgeW) / 2;
  ctx.fillStyle = "#E1F2FB";
  roundRect(ctx, badgeX, y, badgeW, badgeH, 6 * S);
  ctx.fill();
  ctx.fillStyle = "#54656F";
  ctx.font = `bold ${11 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("TODAY", W / 2, y + 15 * S);
  ctx.textAlign = "left";
  return badgeH;
}

// ─── Render the base chat frame ──────────────────────────────────────────
function renderBaseFrame(
  ctx: CanvasRenderingContext2D,
  messages: SimpleMessage[],
  visibleCount: number,
  businessName: string,
  profileInitials: string,
  /** Optional: which carousel card to scroll to for a specific message */
  carouselScroll?: { msgIndex: number; cardIndex: number },
) {
  // Draw background first
  ctx.fillStyle = WA_BG;
  ctx.fillRect(0, 0, W, H);

  // Input bar (drawn early so messages don't overlap it)
  ctx.fillStyle = "#F0F0F0";
  ctx.fillRect(0, H - INPUT_BAR_H, W, INPUT_BAR_H);
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, 10 * S, H - INPUT_BAR_H + 8 * S, W - 65 * S, 34 * S, 20 * S);
  ctx.fill();
  ctx.fillStyle = "#999999";
  ctx.font = `${13 * S}px sans-serif`;
  ctx.fillText("Type a message", 45 * S, H - INPUT_BAR_H + 30 * S);
  ctx.fillStyle = "#128C7E";
  ctx.beginPath();
  ctx.arc(W - 27 * S, H - INPUT_BAR_H + 25 * S, 20 * S, 0, Math.PI * 2);
  ctx.fill();

  // Calculate content layout: notice + badge + messages are all scrollable content
  const noticeH = 40 * S;
  const todayH = 22 * S;
  const topContentH = 10 * S + noticeH + 8 * S + todayH + 10 * S;

  const visibleMessages = messages.slice(0, visibleCount);

  // Calculate total height for scrolling (notice + badge + messages)
  let totalMsgHeight = 0;
  const msgHeights: number[] = [];
  for (const msg of visibleMessages) {
    const h = measureMessage(ctx, msg);
    msgHeights.push(h);
    totalMsgHeight += h + 8 * S;
  }

  const totalContentH = topContentH + totalMsgHeight;
  const availableH = CHAT_BOTTOM - CHAT_TOP;
  let scrollOffset = 0;
  if (totalContentH > availableH) {
    scrollOffset = totalContentH - availableH;
  }

  // Clip to chat area (between header and input bar)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, CHAT_TOP, W, CHAT_BOTTOM - CHAT_TOP);
  ctx.clip();

  // Draw scrollable content: notice, badge, then messages
  let cursorY = CHAT_TOP + 10 * S - scrollOffset;

  // Encryption notice (scrolls with content)
  if (cursorY + noticeH > CHAT_TOP) {
    drawEncryptionNotice(ctx, cursorY);
  }
  cursorY += noticeH + 8 * S;

  // TODAY badge (scrolls with content)
  if (cursorY + todayH > CHAT_TOP) {
    drawTodayBadge(ctx, cursorY);
  }
  cursorY += todayH + 10 * S;

  // Messages
  for (let i = 0; i < visibleMessages.length; i++) {
    if (cursorY + msgHeights[i] > CHAT_TOP - 20 * S && cursorY < CHAT_BOTTOM + 20 * S) {
      const cardIdx = (carouselScroll && carouselScroll.msgIndex === i)
        ? carouselScroll.cardIndex
        : undefined;
      drawMessage(ctx, visibleMessages[i], cursorY, cardIdx);
    }
    cursorY += msgHeights[i] + 8 * S;
  }

  ctx.restore();

  // Draw header LAST (painter's algorithm) so it always covers any content that scrolls behind it
  ctx.fillStyle = WA_HEADER_BG;
  ctx.fillRect(0, 0, W, HEADER_H);

  // Back arrow
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = `${20 * S}px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("\u2190", 12 * S, 37 * S);

  // Avatar circle
  ctx.fillStyle = "#128C7E";
  ctx.beginPath();
  ctx.arc(55 * S, 30 * S, 18 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = `bold ${13 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(profileInitials, 55 * S, 35 * S);
  ctx.textAlign = "left";

  // Business name
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = FONT_HEADER;
  const maxNameWidth = W - 80 * S - 80 * S;
  let displayName = businessName;
  while (ctx.measureText(displayName).width > maxNameWidth && displayName.length > 3) {
    displayName = displayName.substring(0, displayName.length - 1);
  }
  if (displayName !== businessName) displayName += "...";
  ctx.fillText(displayName, 80 * S, 30 * S);

  // Online status
  ctx.fillStyle = "#A0D9B4";
  ctx.font = FONT_HEADER_SMALL;
  ctx.fillText("online", 80 * S, 46 * S);

  // Verified badge
  ctx.font = FONT_HEADER;
  const actualNameW = ctx.measureText(displayName).width;
  ctx.fillStyle = "#25D366";
  ctx.beginPath();
  ctx.arc(80 * S + actualNameW + 10 * S, 25 * S, 7 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${9 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("\u2713", 80 * S + actualNameW + 10 * S, 28 * S);
  ctx.textAlign = "left";

  // Header icons
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = `${16 * S}px sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("\u22EE", W - 12 * S, 35 * S);
  ctx.textAlign = "left";
}

// ─── Draw list dropdown overlay ─────────────────────────────────────────────
function drawListOverlay(
  ctx: CanvasRenderingContext2D,
  msg: SimpleMessage
) {
  const c = msg.content;
  if (!c.listSections || c.listSections.length === 0) return;

  // Semi-transparent overlay
  ctx.fillStyle = LIST_OVERLAY_BG;
  ctx.fillRect(0, CHAT_TOP, W, CHAT_BOTTOM - CHAT_TOP);

  // Calculate total height
  let totalRows = 0;
  for (const section of c.listSections) {
    totalRows += section.rows.length;
  }
  const sectionCount = c.listSections.length;
  const rowH = 50 * S;
  const sectionHeaderH = 30 * S;
  const panelH = Math.min(
    sectionCount * sectionHeaderH + totalRows * rowH + 60 * S,
    (CHAT_BOTTOM - CHAT_TOP) * 0.85
  );
  const panelW = W - 40 * S;
  const panelX = 20 * S;
  const panelY = CHAT_TOP + (CHAT_BOTTOM - CHAT_TOP - panelH) / 2;

  // Panel background
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, panelX, panelY, panelW, panelH, 12 * S);
  ctx.fill();

  // Panel shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 8 * S;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, panelX, panelY, panelW, panelH, 12 * S);
  ctx.fill();
  ctx.restore();

  // Title bar
  ctx.fillStyle = WA_HEADER_BG;
  roundRect(ctx, panelX, panelY, panelW, 44 * S, 12 * S);
  ctx.fill();
  // Fix bottom corners of title bar
  ctx.fillRect(panelX, panelY + 30 * S, panelW, 14 * S);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${14 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(c.listButtonText || "Select an option", panelX + panelW / 2, panelY + 28 * S);
  ctx.textAlign = "left";

  // Close X
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `${18 * S}px sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("\u2715", panelX + panelW - 12 * S, panelY + 30 * S);
  ctx.textAlign = "left";

  // List items
  let itemY = panelY + 50 * S;
  ctx.save();
  ctx.beginPath();
  ctx.rect(panelX, panelY + 44 * S, panelW, panelH - 44 * S);
  ctx.clip();

  for (const section of c.listSections) {
    // Section header
    if (section.title) {
      ctx.fillStyle = "#F5F5F5";
      ctx.fillRect(panelX + 1, itemY, panelW - 2, sectionHeaderH);
      ctx.fillStyle = WA_BUTTON_COLOR;
      ctx.font = `bold ${12 * S}px sans-serif`;
      ctx.fillText(section.title, panelX + 16 * S, itemY + 20 * S);
      itemY += sectionHeaderH;
    }

    // Rows
    for (const row of section.rows) {
      // Separator
      ctx.strokeStyle = "#F0F0F0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(panelX + 16 * S, itemY);
      ctx.lineTo(panelX + panelW - 16 * S, itemY);
      ctx.stroke();

      // Row title
      ctx.fillStyle = WA_TEXT_COLOR;
      ctx.font = `${14 * S}px sans-serif`;
      ctx.fillText(row.title, panelX + 16 * S, itemY + 22 * S);

      // Row description
      if (row.description) {
        ctx.fillStyle = WA_TIME_COLOR;
        ctx.font = `${11 * S}px sans-serif`;
        ctx.fillText(row.description, panelX + 16 * S, itemY + 38 * S);
      }

      // Radio circle
      ctx.strokeStyle = "#CCCCCC";
      ctx.lineWidth = 1.5 * S;
      ctx.beginPath();
      ctx.arc(panelX + panelW - 28 * S, itemY + 25 * S, 8 * S, 0, Math.PI * 2);
      ctx.stroke();

      itemY += rowH;
    }
  }

  ctx.restore();
}

/// ─── Draw typing indicator (three animated dots) ──────────────────────────
function drawTypingIndicator(
  ctx: CanvasRenderingContext2D,
  messages: SimpleMessage[],
  visibleCount: number,
  businessName: string,
  profileInitials: string,
) {
  // First render the base frame with current visible messages
  renderBaseFrame(ctx, messages, visibleCount, businessName, profileInitials);

  // Calculate where the typing indicator should appear using the same layout as renderBaseFrame
  const noticeH = 40 * S;
  const todayH = 22 * S;
  const topContentH = 10 * S + noticeH + 8 * S + todayH + 10 * S;

  const visibleMessages = messages.slice(0, visibleCount);
  let totalMsgHeight = 0;
  for (const msg of visibleMessages) {
    const h = measureMessage(ctx, msg);
    totalMsgHeight += h + 8 * S;
  }

  const typingBubbleH = 36 * S;
  const totalContentH = topContentH + totalMsgHeight + typingBubbleH;
  const availableH = CHAT_BOTTOM - CHAT_TOP;
  let scrollOffset = 0;
  if (totalContentH > availableH) {
    scrollOffset = totalContentH - availableH;
  }

  const typingY = CHAT_TOP + topContentH + totalMsgHeight - scrollOffset;

  // Draw typing bubble (business typing = left-aligned, white bubble)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, CHAT_TOP, W, CHAT_BOTTOM - CHAT_TOP);
  ctx.clip();

  const bubbleX = 15 * S;
  const bubbleW = 70 * S;
  ctx.fillStyle = WA_INBOUND_BG;
  ctx.shadowColor = "rgba(0,0,0,0.08)";
  ctx.shadowBlur = 3 * S;
  ctx.shadowOffsetY = 1 * S;
  roundRect(ctx, bubbleX, typingY, bubbleW, typingBubbleH, BUBBLE_RADIUS);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Draw three dots
  const dotRadius = 4 * S;
  const dotSpacing = 14 * S;
  const dotStartX = bubbleX + bubbleW / 2 - dotSpacing;
  const dotY = typingY + typingBubbleH / 2;
  const dotColors = ["#90949C", "#B0B3B8", "#90949C"];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = dotColors[i];
    ctx.beginPath();
    ctx.arc(dotStartX + i * dotSpacing, dotY, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Redraw header on top (same as renderBaseFrame does)
  ctx.fillStyle = WA_HEADER_BG;
  ctx.fillRect(0, 0, W, HEADER_H);
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = `${20 * S}px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("\u2190", 12 * S, 37 * S);
  ctx.fillStyle = "#128C7E";
  ctx.beginPath();
  ctx.arc(55 * S, 30 * S, 18 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = `bold ${13 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(profileInitials, 55 * S, 35 * S);
  ctx.textAlign = "left";
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = FONT_HEADER;
  const maxNameWidth = W - 80 * S - 80 * S;
  let displayName = businessName;
  while (ctx.measureText(displayName).width > maxNameWidth && displayName.length > 3) {
    displayName = displayName.substring(0, displayName.length - 1);
  }
  if (displayName !== businessName) displayName += "...";
  ctx.fillText(displayName, 80 * S, 30 * S);
  ctx.fillStyle = "#A0D9B4";
  ctx.font = FONT_HEADER_SMALL;
  ctx.fillText("online", 80 * S, 46 * S);
  ctx.font = FONT_HEADER;
  const actualNameW = ctx.measureText(displayName).width;
  ctx.fillStyle = "#25D366";
  ctx.beginPath();
  ctx.arc(80 * S + actualNameW + 10 * S, 25 * S, 7 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${9 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("\u2713", 80 * S + actualNameW + 10 * S, 28 * S);
  ctx.textAlign = "left";
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = `${16 * S}px sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("\u22EE", W - 12 * S, 35 * S);
  ctx.textAlign = "left";
}

// ─── Build the animation frame sequence ─────────────────────────────────
function buildFrameSequence(messages: SimpleMessage[], frameDelay: number): FrameDescriptor[] {
  const frames: FrameDescriptor[] = [];

  // Frame 0: empty chat — hold longer for context
  frames.push({ visibleCount: 0, delay: Math.round(frameDelay * 1.5) });

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const c = msg.content;

    // Add typing indicator before business (outbound) messages
    // This simulates the natural "business is typing..." experience
    if (msg.direction === "outbound") {
      frames.push({
        visibleCount: i,
        typingIndicator: true,
        delay: Math.round(frameDelay * 0.8), // brief typing pause
      });
    }

    // Show this message appearing — hold long enough to read
    const hasRichContent = c.carouselCards || c.headerImageUrl || c.imageUrl || c.listSections;
    const readDelay = hasRichContent ? Math.round(frameDelay * 1.5) : frameDelay;
    frames.push({ visibleCount: i + 1, delay: readDelay });

    // If this message has carousel cards, add frames to scroll through them
    if (c.carouselCards && c.carouselCards.length > 1) {
      // Hold on first card, then swipe through each subsequent card
      frames.push({
        visibleCount: i + 1,
        delay: Math.round(frameDelay * 0.5), // brief pause before swiping
      });
      for (let ci = 1; ci < c.carouselCards.length; ci++) {
        frames.push({
          visibleCount: i + 1,
          carouselScroll: { msgIndex: i, cardIndex: ci },
          delay: frameDelay, // full delay per card for readability
        });
      }
      // Scroll back to first card
      frames.push({
        visibleCount: i + 1,
        carouselScroll: { msgIndex: i, cardIndex: 0 },
        delay: Math.round(frameDelay * 0.6),
      });
    }

    // If this message has a list, show the dropdown
    if (c.listSections && c.listSections.length > 0 && c.listButtonText) {
      frames.push({
        visibleCount: i + 1,
        listOverlay: { msgIndex: i },
        delay: Math.round(frameDelay * 2.5), // hold longer to read options
      });
      // Frame after closing list (back to normal view)
      frames.push({ visibleCount: i + 1, delay: Math.round(frameDelay * 0.6) });
    }
  }

  // Last frame stays much longer so viewer can absorb the full conversation
  if (frames.length > 0) {
    frames[frames.length - 1].delay = Math.round(frameDelay * 5);
  }

  return frames;
}

// ─── Main: Generate animated GIF ───────────────────────────────────────────
export async function generateGifFromMockup(
  options: GifExportOptions
): Promise<Blob> {
  const {
    messages,
    businessName,
    profileInitials,
    frameDelay = 1200,
    onProgress,
  } = options;

  // Preload all images first
  await preloadImages(messages, options.preloadedImages);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  // Build the animation sequence
  const frameSequence = buildFrameSequence(messages, frameDelay);
  const totalFrames = frameSequence.length;

  // Use gif.js for reliable GIF encoding
  // quality: 1 = best (most accurate color quantization)
  const gif = new GIF({
    workers: 2,
    quality: 1,
    width: W,
    height: H,
    workerScript: "/gif.worker.js",
    transparent: null, // No transparency - fully opaque frames
    background: "#ECE5DD",
    repeat: 0, // loop forever
    dither: false, // disable dithering for cleaner UI rendering
  });

  for (let fi = 0; fi < frameSequence.length; fi++) {
    const frame = frameSequence[fi];

    if (frame.typingIndicator) {
      // Render typing indicator ("business is typing..." dots)
      drawTypingIndicator(ctx, messages, frame.visibleCount, businessName, profileInitials);
    } else {
      // Render base chat with optional carousel scroll position
      renderBaseFrame(
        ctx,
        messages,
        frame.visibleCount,
        businessName,
        profileInitials,
        frame.carouselScroll,
      );

      // Render list overlay if any
      if (frame.listOverlay) {
        const msg = messages[frame.listOverlay.msgIndex];
        drawListOverlay(ctx, msg);
      }
    }

    // Add the current canvas state as a frame
    gif.addFrame(ctx, {
      delay: frame.delay || frameDelay,
      copy: true,
    });

    onProgress?.(fi + 1, totalFrames);
  }

  // Render the GIF and return as Blob
  return new Promise<Blob>((resolve, reject) => {
    gif.on("finished", (blob: Blob) => {
      resolve(blob);
    });
    gif.on("error", (err: Error) => {
      reject(err);
    });
    gif.render();
  });
}

/**
 * Render a static screenshot of the full conversation using Canvas 2D.
 * Unlike the DOM-based captureStaticScreenshot, this is fully deterministic
 * and doesn't depend on scroll position or DOM cloning.
 * Returns a PNG data URL.
 */
export async function renderStaticScreenshotCanvas(options: {
  messages: SimpleMessage[];
  businessName: string;
  profileInitials: string;
  preloadedImages?: Map<string, string>;
}): Promise<string> {
  const { messages, businessName, profileInitials, preloadedImages } = options;

  // Preload images into the cache
  await preloadImages(messages, preloadedImages);

  // First, measure total content height using a temporary canvas
  const measureCanvas = document.createElement("canvas");
  measureCanvas.width = W;
  measureCanvas.height = H;
  const measureCtx = measureCanvas.getContext("2d")!;

  let totalContentHeight = 0;
  const msgHeights: number[] = [];
  for (const msg of messages) {
    const h = measureMessage(measureCtx, msg);
    msgHeights.push(h);
    totalContentHeight += h + 8 * S;
  }

  // Add space for encryption notice + today badge
  const noticeH = 40 * S;
  const todayH = 22 * S;
  const topPadding = 10 * S + noticeH + 8 * S + todayH + 10 * S;
  const bottomPadding = 10 * S;

  // Calculate total canvas height: header + content + input bar
  const contentAreaHeight = topPadding + totalContentHeight + bottomPadding;
  const totalH = HEADER_H + contentAreaHeight + INPUT_BAR_H;

  // Create the full-height canvas
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = totalH;
  const ctx = canvas.getContext("2d")!;

  // Draw background
  ctx.fillStyle = WA_BG;
  ctx.fillRect(0, 0, W, totalH);

  // Draw header at the top
  ctx.fillStyle = WA_HEADER_BG;
  ctx.fillRect(0, 0, W, HEADER_H);

  // Back arrow
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = `${20 * S}px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("\u2190", 12 * S, 37 * S);

  // Avatar circle
  ctx.fillStyle = "#128C7E";
  ctx.beginPath();
  ctx.arc(55 * S, 30 * S, 18 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = `bold ${13 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(profileInitials, 55 * S, 35 * S);
  ctx.textAlign = "left";

  // Business name
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = FONT_HEADER;
  const maxNameWidth = W - 80 * S - 80 * S;
  let displayName = businessName;
  while (ctx.measureText(displayName).width > maxNameWidth && displayName.length > 3) {
    displayName = displayName.substring(0, displayName.length - 1);
  }
  if (displayName !== businessName) displayName += "...";
  ctx.fillText(displayName, 80 * S, 30 * S);

  // Online status
  ctx.fillStyle = "#A0D9B4";
  ctx.font = FONT_HEADER_SMALL;
  ctx.fillText("online", 80 * S, 46 * S);

  // Verified badge
  ctx.font = FONT_HEADER;
  const actualNameW = ctx.measureText(displayName).width;
  ctx.fillStyle = "#25D366";
  ctx.beginPath();
  ctx.arc(80 * S + actualNameW + 10 * S, 25 * S, 7 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${9 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("\u2713", 80 * S + actualNameW + 10 * S, 28 * S);
  ctx.textAlign = "left";

  // Header icons
  ctx.fillStyle = WA_HEADER_TEXT;
  ctx.font = `${16 * S}px sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("\u22EE", W - 12 * S, 35 * S);
  ctx.textAlign = "left";

  // Draw encryption notice
  let cursorY = HEADER_H + 10 * S;
  const noticeW = W - 60 * S;
  const noticeX = 30 * S;
  ctx.fillStyle = WA_SYSTEM_BG;
  roundRect(ctx, noticeX, cursorY, noticeW, noticeH, 6 * S);
  ctx.fill();
  ctx.fillStyle = WA_SYSTEM_TEXT;
  ctx.font = `${11 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Messages and calls are end-to-end", W / 2, cursorY + 16 * S);
  ctx.fillText("encrypted.", W / 2, cursorY + 30 * S);
  ctx.textAlign = "left";
  cursorY += noticeH + 8 * S;

  // Draw TODAY badge
  const badgeW = 60 * S;
  const badgeH = 22 * S;
  const badgeX = (W - badgeW) / 2;
  ctx.fillStyle = "#E1F2FB";
  roundRect(ctx, badgeX, cursorY, badgeW, badgeH, 6 * S);
  ctx.fill();
  ctx.fillStyle = "#54656F";
  ctx.font = `bold ${11 * S}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("TODAY", W / 2, cursorY + 15 * S);
  ctx.textAlign = "left";
  cursorY += todayH + 10 * S;

  // Draw all messages (no clipping, no scrolling)
  for (let i = 0; i < messages.length; i++) {
    drawMessage(ctx, messages[i], cursorY);
    cursorY += msgHeights[i] + 8 * S;
  }

  // Draw input bar at the bottom
  const inputBarY = totalH - INPUT_BAR_H;
  ctx.fillStyle = "#F0F0F0";
  ctx.fillRect(0, inputBarY, W, INPUT_BAR_H);
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, 10 * S, inputBarY + 8 * S, W - 65 * S, 34 * S, 20 * S);
  ctx.fill();
  ctx.fillStyle = "#999999";
  ctx.font = `${13 * S}px sans-serif`;
  ctx.fillText("Type a message", 45 * S, inputBarY + 30 * S);
  ctx.fillStyle = "#128C7E";
  ctx.beginPath();
  ctx.arc(W - 27 * S, inputBarY + 25 * S, 20 * S, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL("image/png", 0.95);
}

/**
 * Convert a GIF blob to a base64 data URL string.
 */
export async function gifBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
