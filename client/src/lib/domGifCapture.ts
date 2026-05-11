/**
 * DOM-based GIF capture for the WhatsApp phone mockup.
 *
 * Uses `modern-screenshot` to capture the actual rendered phone mockup DOM element
 * at each simulation step, then assembles frames into an animated GIF.
 *
 * Key design: Uses MutationObserver to detect when React has actually committed
 * DOM changes before capturing each frame, ensuring accurate screenshots.
 */

import { domToCanvas } from "modern-screenshot";
// @ts-expect-error gif.js has no type declarations
import GIF from "gif.js";

export interface DomGifCaptureOptions {
  /** The phone mockup DOM element (the one with [data-phone-mockup]) */
  mockupElement: HTMLElement;
  /** Total number of messages */
  totalMessages: number;
  /** Message directions for determining when to show typing */
  messageDirections: ("inbound" | "outbound")[];
  /** Whether each message has rich content (carousel, image, list) */
  messageHasRichContent: boolean[];
  /** Callback to set visible message count (triggers re-render) */
  setVisibleCount: (count: number) => void;
  /** Callback to set typing indicator state */
  setIsTyping: (typing: boolean) => void;
  /** Callback to set waitingForClick state (suppress "Tap to continue" prompts) */
  setWaitingForClick: (waiting: boolean) => void;
  /** Callback to set simulationComplete state */
  setSimulationComplete: (complete: boolean) => void;
  /** Callback to scroll to bottom */
  scrollToBottom: () => void;
  /** Callback to stop any running simulation timers */
  clearTimer: () => void;
  /** Frame delay in ms between steps */
  frameDelay?: number;
  /** Progress callback */
  onProgress?: (step: string, current: number, total: number) => void;
  /** Pixel ratio for capture (default 1.5 for good quality with faster capture) */
  pixelRatio?: number;
  /** Overall timeout in ms (default 120000 = 120 seconds) */
  overallTimeout?: number;
}

/**
 * Wait for the next animation frame + a fixed delay.
 */
function waitMs(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for a DOM mutation inside the target element, or timeout.
 * This ensures React has actually committed its changes to the DOM.
 */
function waitForDomChange(element: HTMLElement, timeoutMs: number = 2000): Promise<boolean> {
  return new Promise(resolve => {
    let resolved = false;
    const observer = new MutationObserver(() => {
      if (!resolved) {
        resolved = true;
        observer.disconnect();
        // Give the browser one more frame to finish layout
        requestAnimationFrame(() => resolve(true));
      }
    });
    observer.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        observer.disconnect();
        resolve(false);
      }
    }, timeoutMs);
  });
}

/**
 * Force-scroll the chat area inside the mockup to the bottom without animation.
 */
function forceScrollToBottom(mockupElement: HTMLElement): void {
  const chatArea = mockupElement.querySelector('[data-chat-area]') as HTMLElement;
  if (chatArea) {
    chatArea.scrollTop = chatArea.scrollHeight;
  }
  // Also try overflow containers
  const scrollContainers = mockupElement.querySelectorAll('[class*="overflow"]');
  scrollContainers.forEach(el => {
    const htmlEl = el as HTMLElement;
    const style = window.getComputedStyle(htmlEl);
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
      htmlEl.scrollTop = htmlEl.scrollHeight;
    }
  });
}

/**
 * Simulate scroll-to-bottom using CSS transforms so domToCanvas captures the scrolled view.
 * modern-screenshot's domToCanvas clones the DOM but doesn't preserve scrollTop.
 * This workaround applies a negative translateY to the chat content and clips with overflow:hidden.
 * Returns a cleanup function to restore the original state.
 */
function applyScrollTransformForCapture(mockupElement: HTMLElement): () => void {
  const chatArea = mockupElement.querySelector('[data-chat-area]') as HTMLElement;
  if (!chatArea) return () => {};

  const scrollAmount = chatArea.scrollHeight - chatArea.clientHeight;
  if (scrollAmount <= 0) return () => {};

  // Save original styles
  const origOverflow = chatArea.style.overflow;
  const origPosition = chatArea.style.position;

  // Find the inner content wrapper (first child of chat area)
  // We need to transform the content, not the container
  const children = Array.from(chatArea.children) as HTMLElement[];
  const origTransforms: string[] = children.map(c => c.style.transform);
  const origTransitions: string[] = children.map(c => c.style.transition);

  // Apply: hide overflow on container, translate children up by scrollAmount
  chatArea.style.overflow = 'hidden';
  chatArea.scrollTop = 0; // Reset scroll since we're using transform
  children.forEach(child => {
    child.style.transition = 'none';
    child.style.transform = `translateY(-${scrollAmount}px)`;
  });

  // Return cleanup function
  return () => {
    chatArea.style.overflow = origOverflow;
    chatArea.style.position = origPosition;
    children.forEach((child, idx) => {
      child.style.transform = origTransforms[idx];
      child.style.transition = origTransitions[idx];
    });
    // Restore scroll position
    chatArea.scrollTop = scrollAmount;
  };
}

/**
 * Wait for all images within an element to finish loading.
 */
async function waitForImages(element: HTMLElement, timeout: number = 2000): Promise<void> {
  const images = element.querySelectorAll("img");
  const promises = Array.from(images).map(img => {
    if (img.complete && img.naturalHeight > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, timeout);
      img.onload = () => { clearTimeout(timer); resolve(); };
      img.onerror = () => { clearTimeout(timer); resolve(); };
    });
  });
  await Promise.all(promises);
}

/** Target output dimensions for the GIF (phone screen size) */
const TARGET_WIDTH = 375;
const TARGET_HEIGHT = 667;

/**
 * Capture a single frame from the phone mockup DOM element using modern-screenshot.
 * Always returns a canvas at exactly TARGET_WIDTH x TARGET_HEIGHT pixels.
 */
async function captureFrame(
  element: HTMLElement,
  pixelRatio: number,
  resourceTimeout: number = 2000,
): Promise<HTMLCanvasElement> {
  const rawCanvas = await domToCanvas(element, {
    scale: pixelRatio,
    features: {
      removeControlCharacter: false,
    },
    timeout: resourceTimeout,
    drawImageInterval: 0,
  });

  // Downscale to fixed target size so the GIF is always phone-sized
  const outCanvas = document.createElement("canvas");
  outCanvas.width = TARGET_WIDTH;
  outCanvas.height = TARGET_HEIGHT;
  const ctx = outCanvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(rawCanvas, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  return outCanvas;
}

/**
 * Build the frame sequence for the animation.
 * For long conversations, batch messages to keep total frame count manageable.
 */
interface FrameSpec {
  visibleCount: number;
  showTyping: boolean;
  delay: number;
  hasRichContent: boolean;
}

function buildFrameSpecs(
  totalMessages: number,
  directions: ("inbound" | "outbound")[],
  hasRichContent: boolean[],
  frameDelay: number,
): FrameSpec[] {
  const frames: FrameSpec[] = [];

  // For <= 8 messages: show one at a time
  // For > 8 messages: batch to keep total frames around 12-15
  const maxContentFrames = 12;
  const batchSize = totalMessages <= 8 ? 1 : Math.ceil(totalMessages / maxContentFrames);

  // Frame 0: empty chat — brief hold
  frames.push({ visibleCount: 0, showTyping: false, delay: Math.round(frameDelay * 0.6), hasRichContent: false });

  let i = 0;
  let frameIndex = 0;
  while (i < totalMessages) {
    const batchEnd = Math.min(i + batchSize, totalMessages);
    const isOutbound = directions[batchEnd - 1] === "outbound";

    // Show typing indicator occasionally for outbound messages
    if (isOutbound && frameIndex > 0 && frameIndex % 3 === 0) {
      frames.push({
        visibleCount: i,
        showTyping: true,
        delay: Math.round(frameDelay * 0.3),
        hasRichContent: false,
      });
    }

    // Check if this batch has rich content
    let hasRich = false;
    for (let j = i; j < batchEnd; j++) {
      if (hasRichContent[j]) { hasRich = true; break; }
    }

    frames.push({
      visibleCount: batchEnd,
      showTyping: false,
      delay: hasRich ? Math.round(frameDelay * 1.0) : Math.round(frameDelay * 0.8),
      hasRichContent: hasRich,
    });

    i = batchEnd;
    frameIndex++;
  }

  // Last frame holds longer
  if (frames.length > 0) {
    frames[frames.length - 1].delay = Math.round(frameDelay * 2.5);
  }

  return frames;
}

/**
 * Apply state for a frame and wait for the DOM to actually update.
 * Returns once the DOM has settled and is ready for capture.
 */
async function applyFrameState(
  mockupElement: HTMLElement,
  spec: FrameSpec,
  setVisibleCount: (n: number) => void,
  setIsTyping: (t: boolean) => void,
  setWaitingForClick: (w: boolean) => void,
  scrollToBottom: () => void,
  isFirstFrame: boolean,
): Promise<void> {
  // Start watching for DOM changes BEFORE setting state
  const domChangePromise = waitForDomChange(mockupElement, 3000);

  // Set the mockup state for this frame
  setIsTyping(spec.showTyping);
  setVisibleCount(spec.visibleCount);
  setWaitingForClick(false);

  // Wait for DOM to actually change (React commit)
  const changed = await domChangePromise;

  if (changed) {
    // DOM changed — give browser time to finish layout and paint
    await waitMs(100);
  } else {
    // DOM didn't change within timeout — use fallback delay
    // This can happen if the state was already at the target value
    await waitMs(200);
  }

  // Wait for images on first content frame or rich content frames
  if (isFirstFrame || spec.hasRichContent) {
    await waitForImages(mockupElement, 2000);
    await waitMs(50);
  }

  // Force scroll to bottom (instant, no animation)
  forceScrollToBottom(mockupElement);
  await waitMs(50);
  // Scroll again after any lazy-loaded content shifts layout
  forceScrollToBottom(mockupElement);
  await waitMs(30);
}

/**
 * Generate an animated GIF by capturing the actual phone mockup DOM at each simulation step.
 */
export async function generateDomGif(options: DomGifCaptureOptions): Promise<Blob> {
  const {
    mockupElement,
    totalMessages,
    messageDirections,
    messageHasRichContent,
    setVisibleCount,
    setIsTyping,
    setWaitingForClick,
    setSimulationComplete,
    scrollToBottom,
    clearTimer,
    frameDelay = 800,
    onProgress,
    pixelRatio = 1.5,
    overallTimeout = 120000,
  } = options;

  // Stop any running simulation
  clearTimer();

  const frameSpecs = buildFrameSpecs(
    totalMessages,
    messageDirections,
    messageHasRichContent,
    frameDelay,
  );

  const totalFrames = frameSpecs.length;
  onProgress?.("Preparing capture...", 0, totalFrames);

  // Suppress interactive elements during capture
  setWaitingForClick(false);
  setSimulationComplete(false);

  // Pre-load all images by showing all messages first, then resetting
  setVisibleCount(totalMessages);
  scrollToBottom();
  await waitMs(500);
  await waitForImages(mockupElement, 4000);
  forceScrollToBottom(mockupElement);
  await waitMs(200);

  // Now reset to start
  setVisibleCount(0);
  setIsTyping(false);
  await waitMs(300);

  // Overall timeout to prevent hanging
  const startTime = Date.now();

  // Capture each frame
  const capturedFrames: { canvas: HTMLCanvasElement; delay: number }[] = [];

  for (let i = 0; i < frameSpecs.length; i++) {
    // Check overall timeout
    if (Date.now() - startTime > overallTimeout) {
      console.warn(`GIF capture timed out after ${overallTimeout}ms at frame ${i}/${totalFrames}`);
      break;
    }

    const spec = frameSpecs[i];

    // Apply state and wait for DOM to settle
    await applyFrameState(
      mockupElement,
      spec,
      setVisibleCount,
      setIsTyping,
      setWaitingForClick,
      scrollToBottom,
      i <= 1,
    );

    onProgress?.(`Capturing frame ${i + 1} of ${totalFrames}...`, i + 1, totalFrames);

    try {
      const resourceTimeout = i === 0 ? 3000 : 1500;
      // Apply CSS transform to simulate scroll position for domToCanvas
      const restoreScroll = applyScrollTransformForCapture(mockupElement);
      await waitMs(30); // Let browser apply the transform
      const canvas = await captureFrame(mockupElement, pixelRatio, resourceTimeout);
      restoreScroll(); // Restore original scroll behavior
      capturedFrames.push({ canvas, delay: spec.delay });
    } catch (err) {
      console.warn(`Frame ${i + 1} capture failed, skipping:`, err);
    }
  }

  // If we timed out or missed frames, add a final frame showing all messages
  const lastCapturedCount = frameSpecs[capturedFrames.length - 1]?.visibleCount ?? 0;
  if (lastCapturedCount < totalMessages && capturedFrames.length > 0) {
    try {
      setIsTyping(false);
      setVisibleCount(totalMessages);
      setWaitingForClick(false);
      setSimulationComplete(true);
      await waitMs(400);
      forceScrollToBottom(mockupElement);
      await waitMs(100);
      forceScrollToBottom(mockupElement);
      await waitMs(50);
      const restoreFinal = applyScrollTransformForCapture(mockupElement);
      await waitMs(30);
      const finalCanvas = await captureFrame(mockupElement, pixelRatio, 3000);
      restoreFinal();
      capturedFrames.push({ canvas: finalCanvas, delay: Math.round(frameDelay * 2.5) });
    } catch { /* skip */ }
  }

  if (capturedFrames.length === 0) {
    throw new Error("No frames were captured successfully");
  }

  onProgress?.("Encoding GIF...", totalFrames, totalFrames);

  // Get dimensions from the first captured frame
  const firstCanvas = capturedFrames[0].canvas;
  const gifWidth = firstCanvas.width;
  const gifHeight = firstCanvas.height;

  // Assemble into GIF using gif.js
  const gif = new GIF({
    workers: 2,
    quality: 12,
    width: gifWidth,
    height: gifHeight,
    workerScript: "/gif.worker.js",
    repeat: 0,
    dither: false,
  });

  for (const frame of capturedFrames) {
    if (frame.canvas.width === gifWidth && frame.canvas.height === gifHeight) {
      gif.addFrame(frame.canvas, {
        delay: frame.delay,
        copy: true,
      });
    } else {
      const resizeCanvas = document.createElement("canvas");
      resizeCanvas.width = gifWidth;
      resizeCanvas.height = gifHeight;
      const rctx = resizeCanvas.getContext("2d")!;
      rctx.drawImage(frame.canvas, 0, 0, gifWidth, gifHeight);
      gif.addFrame(resizeCanvas, {
        delay: frame.delay,
        copy: true,
      });
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    const encodeTimeout = setTimeout(() => {
      reject(new Error("GIF encoding timed out after 30 seconds"));
    }, 30000);

    gif.on("finished", (blob: Blob) => {
      clearTimeout(encodeTimeout);
      resolve(blob);
    });
    gif.on("error", (err: Error) => {
      clearTimeout(encodeTimeout);
      reject(err);
    });
    gif.render();
  });
}

/**
 * Capture a single static screenshot of the phone mockup showing all messages.
 * Returns a PNG data URL suitable for embedding in PowerPoint.
 */
export async function captureStaticScreenshot(
  mockupElement: HTMLElement,
  setVisibleCount: (count: number) => void,
  setIsTyping: (typing: boolean) => void,
  setWaitingForClick: (waiting: boolean) => void,
  setSimulationComplete: (complete: boolean) => void,
  scrollToBottom: () => void,
  clearTimer: () => void,
  totalMessages: number,
  pixelRatio: number = 2,
): Promise<string> {
  // Stop any running simulation
  clearTimer();

  // Show all messages
  setIsTyping(false);
  setWaitingForClick(false);
  setSimulationComplete(true);
  setVisibleCount(totalMessages);
  scrollToBottom();

  // Wait for render and images
  await waitMs(500);
  forceScrollToBottom(mockupElement);
  await waitForImages(mockupElement, 4000);
  await waitMs(200);
  forceScrollToBottom(mockupElement);
  await waitMs(100);

  // Apply CSS transform to simulate scroll position for domToCanvas
  const restoreScroll = applyScrollTransformForCapture(mockupElement);
  await waitMs(30);

  // Capture at high resolution
  const rawCanvas = await domToCanvas(mockupElement, {
    scale: pixelRatio,
    features: {
      removeControlCharacter: false,
    },
    timeout: 5000,
    drawImageInterval: 0,
  });

  restoreScroll();

  // Return as data URL (PNG)
  return rawCanvas.toDataURL("image/png", 0.95);
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
