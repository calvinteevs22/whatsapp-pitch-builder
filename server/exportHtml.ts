import axios from "axios";

/**
 * Generate a self-contained interactive HTML file for a WhatsApp conversation demo.
 * The file includes all CSS, JS, and conversation data inline — no external dependencies.
 * It can be opened in any browser for a full interactive presentation experience.
 */

interface ExportMessage {
  id: number;
  direction: "inbound" | "outbound";
  contentType: string;
  content: any;
  timestamp: string | null;
  isRead: boolean;
}

interface ExportOptions {
  profileName: string;
  profileImageUrl?: string | null;
  isVerified?: boolean;
  messages: ExportMessage[];
  threadName: string;
  industry?: string;
  messageType?: string;
}

/**
 * Convert an image URL to a base64 data URL.
 * Returns null if the fetch fails.
 */
async function imageUrlToBase64(url: string): Promise<string | null> {
  if (!url || url.startsWith('data:') || url.startsWith('GENERATE_IMAGE:')) return url;
  try {
    const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    const base64 = Buffer.from(resp.data).toString('base64');
    const contentType = resp.headers['content-type'] || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Collect all image URLs from messages and profile, fetch them, and return a map of URL -> base64 data URL.
 */
async function embedAllImages(options: ExportOptions): Promise<Map<string, string>> {
  const urlSet = new Set<string>();
  
  // Profile image
  if (options.profileImageUrl) urlSet.add(options.profileImageUrl);
  
  // Message images
  for (const msg of options.messages) {
    const c = msg.content;
    if (c.headerImageUrl && !c.headerImageUrl.startsWith('GENERATE_IMAGE:')) urlSet.add(c.headerImageUrl);
    if (c.imageUrl && !c.imageUrl.startsWith('GENERATE_IMAGE:')) urlSet.add(c.imageUrl);
    if (c.carouselCards) {
      for (const card of c.carouselCards) {
        if (card.imageUrl && !card.imageUrl.startsWith('GENERATE_IMAGE:')) urlSet.add(card.imageUrl);
      }
    }
  }
  
  const urlMap = new Map<string, string>();
  const fetches = Array.from(urlSet).map(async (url) => {
    const dataUrl = await imageUrlToBase64(url);
    if (dataUrl) urlMap.set(url, dataUrl);
  });
  await Promise.all(fetches);
  return urlMap;
}

/**
 * Generate the interactive HTML with all images embedded as base64 data URLs.
 * This makes the file fully self-contained and works offline.
 */
export async function generateInteractiveHtmlWithEmbeddedImages(options: ExportOptions): Promise<string> {
  const imageMap = await embedAllImages(options);
  
  // Replace all image URLs in the options with base64 versions
  const embeddedOptions: ExportOptions = {
    ...options,
    profileImageUrl: options.profileImageUrl ? (imageMap.get(options.profileImageUrl) || options.profileImageUrl) : options.profileImageUrl,
    messages: options.messages.map(msg => ({
      ...msg,
      content: {
        ...msg.content,
        headerImageUrl: msg.content.headerImageUrl ? (imageMap.get(msg.content.headerImageUrl) || msg.content.headerImageUrl) : msg.content.headerImageUrl,
        imageUrl: msg.content.imageUrl ? (imageMap.get(msg.content.imageUrl) || msg.content.imageUrl) : msg.content.imageUrl,
        carouselCards: msg.content.carouselCards?.map((card: any) => ({
          ...card,
          imageUrl: card.imageUrl ? (imageMap.get(card.imageUrl) || card.imageUrl) : card.imageUrl,
        })),
      },
    })),
  };
  
  return generateInteractiveHtml(embeddedOptions);
}

/**
 * Generate a static (non-animated) HTML for PNG screenshot capture.
 * All messages are visible, no controls/footer, images embedded as base64.
 */
export async function generateStaticHtmlForScreenshot(options: ExportOptions): Promise<string> {
  let html = await generateInteractiveHtmlWithEmbeddedImages(options);
  
  // Replace the initialization script to show all messages immediately
  html = html.replace(
    /\/\/ Initialize[\s\S]*?<\/script>/,
    `// Initialize - show all immediately
renderAll();
showAll();
</script>`
  );
  // Make all messages visible by default (override the opacity:0 animation)
  html = html.replace(
    '.msg-row {',
    '.msg-row { opacity: 1 !important; transform: none !important;'
  );
  // Hide controls and footer for clean screenshot
  html = html.replace(
    '</style>',
    '.controls { display: none !important; } .footer { display: none !important; } .header { display: none !important; } body { padding: 0 !important; min-height: auto !important; background: transparent !important; } .typing-indicator { display: none !important; } .waiting-prompt { display: none !important; }</style>'
  );
  
  return html;
}

export function generateInteractiveHtml(options: ExportOptions): string {
  const {
    profileName,
    profileImageUrl,
    isVerified = true,
    messages,
    threadName,
    industry,
    messageType,
  } = options;

  const messagesJson = JSON.stringify(messages);
  const initials = profileName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${threadName} - WhatsApp Chat Demo</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #075E5408 0%, #f5f5f5 50%, #25D36608 100%);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .header {
    text-align: center;
    margin-bottom: 16px;
  }
  .header h1 {
    font-size: 18px;
    color: #111B21;
    font-weight: 600;
  }
  .header .badges {
    display: flex;
    gap: 6px;
    justify-content: center;
    margin-top: 6px;
  }
  .header .badge {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 9999px;
    font-weight: 500;
  }
  .badge-marketing { background: #25D36615; color: #25D366; }
  .badge-utility { background: #007BFF15; color: #007BFF; }
  .badge-authentication { background: #FF950015; color: #FF9500; }
  .badge-industry { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }
  .controls {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-bottom: 8px;
  }
  .controls button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 9999px;
    border: none;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-restart { background: #075E54; color: white; }
  .btn-restart:hover { background: #064E46; }
  .btn-showall { background: #6b7280; color: white; }
  .btn-showall:hover { background: #4b5563; }
  .phone {
    width: 375px;
    border-radius: 40px;
    overflow: hidden;
    background: #1a1a1a;
    border: 8px solid #1a1a1a;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.1);
    position: relative;
    display: flex;
    flex-direction: column;
    height: 680px;
  }
  .notch {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 22px;
    background: #1a1a1a;
    border-radius: 0 0 16px 16px;
    z-index: 20;
  }
  .status-bar {
    background: #075E54;
    padding: 8px 20px 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .wa-header {
    background: #075E54;
    padding: 4px 8px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .wa-header .back-arrow { color: white; width: 20px; height: 20px; }
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #DFE5E7;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .avatar span { color: #075E54; font-weight: bold; font-size: 14px; }
  .profile-info { flex: 1; min-width: 0; }
  .profile-name {
    color: white;
    font-weight: 500;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .profile-status { color: #8ABBB5; font-size: 11px; }
  .header-icons { display: flex; gap: 12px; color: white; }
  .chat-area {
    flex: 1;
    overflow-y: auto;
    background-color: #ECE5DD;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    padding: 8px 10px;
  }
  .encryption-notice {
    display: flex;
    justify-content: center;
    margin: 8px 0;
  }
  .encryption-notice .inner {
    background: rgba(255,243,196,0.9);
    border-radius: 8px;
    padding: 6px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    max-width: 85%;
  }
  .encryption-notice .inner span {
    font-size: 10px;
    color: #8B7430;
    text-align: center;
    line-height: 1.3;
  }
  .today-sep {
    display: flex;
    justify-content: center;
    margin: 8px 0;
  }
  .today-sep span {
    background: rgba(255,255,255,0.9);
    color: #54656F;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 12px;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
  }
  .msg-row {
    display: flex;
    margin-bottom: 2px;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.3s, transform 0.3s;
  }
  .msg-row.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .msg-row.highlighted {
    animation: highlight 1.5s ease;
  }
  @keyframes highlight {
    0%, 100% { transform: scale(1); }
    20% { transform: scale(1.02); box-shadow: 0 0 0 2px #25D366; border-radius: 8px; }
  }
  .msg-row.from-business { justify-content: flex-start; }
  .msg-row.from-customer { justify-content: flex-end; }
  .bubble {
    max-width: 85%;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 1px rgba(0,0,0,0.08);
    position: relative;
  }
  .bubble-business { background: white; }
  .bubble-customer { background: #D9FDD3; }
  .bubble-content { padding: 4px 8px 2px; }
  .bubble-text {
    font-size: 12.5px;
    color: #111B21;
    white-space: pre-wrap;
    line-height: 17px;
    word-wrap: break-word;
  }
  .bubble-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 3px;
    padding: 0 4px 3px;
  }
  .bubble-time { font-size: 10px; color: #8696A0; }
  .check-marks { color: #53BDEB; font-size: 12px; }
  /* Template */
  .template-header-img {
    width: 100%;
    aspect-ratio: 1.91/1;
    background: #e5e7eb;
    overflow: hidden;
  }
  .template-header-img img { width: 100%; height: 100%; object-fit: cover; }
  .template-header-text { font-weight: bold; font-size: 13px; color: #111B21; margin-bottom: 2px; }
  .template-body { font-size: 12.5px; color: #111B21; white-space: pre-wrap; line-height: 17px; }
  .template-footer { font-size: 10px; color: #8696A0; }
  .template-buttons { border-top: 1px solid #E9EDEF; }
  .template-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    padding: 8px;
    background: none;
    border: none;
    border-bottom: 1px solid #E9EDEF;
    color: #00A5F4;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }
  .template-btn:hover { background: #f0f9ff; }
  .template-btn:active { background: #e0f2fe; }
  .template-btn:last-child { border-bottom: none; }
  /* Interactive buttons */
  .interactive-buttons { border-top: 1px solid #E9EDEF; }
  .interactive-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 8px;
    background: none;
    border: none;
    border-bottom: 1px solid #E9EDEF;
    color: #00A5F4;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }
  .interactive-btn:hover { background: #f0f9ff; }
  .interactive-btn:active { background: #e0f2fe; }
  .interactive-btn:last-child { border-bottom: none; }
  /* List button */
  .list-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 8px;
    background: none;
    border: none;
    border-top: 1px solid #E9EDEF;
    color: #00A5F4;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }
  .list-btn:hover { background: #f0f9ff; }
  .list-dropdown {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
    z-index: 10;
    max-height: 200px;
    overflow-y: auto;
    display: none;
  }
  .list-dropdown.open { display: block; }
  .list-section-title {
    font-size: 11px;
    font-weight: 600;
    color: #075E54;
    padding: 8px 12px 4px;
    text-transform: uppercase;
  }
  .list-row {
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
    transition: background 0.15s;
  }
  .list-row:hover { background: #f0fdf4; }
  .list-row-title { font-size: 13px; color: #111B21; font-weight: 500; }
  .list-row-desc { font-size: 11px; color: #8696A0; }
  /* Image */
  .msg-image {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
    display: block;
  }
  .image-placeholder {
    width: 100%;
    height: 160px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    padding: 12px;
  }
  .msg-caption { font-size: 12.5px; color: #111B21; padding: 4px 8px; }
  /* Video */
  .video-placeholder {
    width: 100%;
    height: 160px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    gap: 8px;
  }
  .play-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  /* Carousel */
  .carousel-intro { padding: 4px 8px; font-size: 12.5px; color: #111B21; }
  .carousel-scroller {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding: 4px 8px 8px;
    scroll-snap-type: x mandatory;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .carousel-scroller::-webkit-scrollbar { display: none; }
  .carousel-card {
    min-width: 180px;
    max-width: 180px;
    border-radius: 8px;
    overflow: hidden;
    background: #f8f9fa;
    border: 1px solid #e9edef;
    scroll-snap-align: start;
    flex-shrink: 0;
  }
  .carousel-card-img {
    width: 100%;
    height: 100px;
    object-fit: cover;
    display: block;
  }
  .carousel-card-placeholder {
    width: 100%;
    height: 100px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 11px;
    font-weight: 500;
    text-align: center;
    padding: 8px;
  }
  .carousel-card-body { padding: 6px 8px; }
  .carousel-card-title { font-size: 12px; font-weight: 600; color: #111B21; }
  .carousel-card-desc { font-size: 10px; color: #8696A0; margin-top: 2px; }
  .carousel-card-price { font-size: 13px; font-weight: 700; color: #075E54; margin-top: 4px; }
  .carousel-card-btn {
    display: block;
    width: calc(100% - 12px);
    margin: 4px 6px 6px;
    padding: 6px;
    background: none;
    border: 1px solid #00A5F4;
    border-radius: 6px;
    color: #00A5F4;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
    transition: background 0.15s;
  }
  .carousel-card-btn:hover { background: #f0f9ff; }
  /* Typing indicator */
  .typing-indicator {
    display: none;
    justify-content: flex-start;
    margin: 4px 0;
  }
  .typing-indicator.visible { display: flex; }
  .typing-bubble {
    background: white;
    border-radius: 8px;
    padding: 8px 12px;
    box-shadow: 0 1px 1px rgba(0,0,0,0.08);
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .typing-dot {
    width: 8px;
    height: 8px;
    background: #8696A0;
    border-radius: 50%;
    animation: typingBounce 1.4s infinite ease-in-out;
  }
  .typing-dot:nth-child(1) { animation-delay: 0s; }
  .typing-dot:nth-child(2) { animation-delay: 0.15s; }
  .typing-dot:nth-child(3) { animation-delay: 0.3s; }
  @keyframes typingBounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
  }
  /* Waiting prompt */
  .waiting-prompt {
    display: none;
    justify-content: center;
    margin: 12px 0;
  }
  .waiting-prompt.visible { display: flex; }
  .waiting-prompt span {
    font-size: 10px;
    color: #8696A0;
    background: rgba(255,255,255,0.8);
    padding: 4px 12px;
    border-radius: 9999px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  /* Input bar */
  .input-bar {
    background: #F0F0F0;
    padding: 6px 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .input-field {
    flex: 1;
    background: white;
    border-radius: 9999px;
    padding: 6px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .input-field span { color: #8B9BA3; font-size: 14px; flex: 1; }
  .mic-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #075E54;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .footer {
    text-align: center;
    margin-top: 16px;
    font-size: 11px;
    color: #8696A0;
  }
  .footer a { color: #075E54; text-decoration: none; }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
</head>
<body>

<div class="header">
  <h1>${escapeHtml(threadName)}</h1>
  <div class="badges">
    ${messageType ? `<span class="badge badge-${messageType}">${messageType === 'marketing' ? 'Marketing Messages' : messageType === 'utility' ? 'Utility Messages' : 'Authentication Messages'}</span>` : ''}
    ${industry ? `<span class="badge badge-industry">${escapeHtml(industry)}</span>` : ''}
  </div>
</div>

<div class="controls">
  <button class="btn-restart" onclick="restart()">&#x21BA; Restart</button>
  <button class="btn-showall" id="showAllBtn" onclick="showAll()">Show All</button>
</div>

<div class="phone">
  <div class="notch"></div>
  <div class="status-bar">
    <span>12:00</span>
    <div style="display:flex;gap:6px;align-items:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M2 22h20V2z"/></svg>
      <svg width="22" height="12" viewBox="0 0 28 14" fill="none"><rect x=".5" y=".5" width="23" height="13" rx="2" stroke="white" stroke-opacity=".35"/><rect x="2" y="2" width="18" height="10" rx="1" fill="white"/><path d="M25 5v4a2 2 0 000-4z" fill="white" fill-opacity=".4"/></svg>
    </div>
  </div>
  <div class="wa-header">
    <svg class="back-arrow" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    <div class="avatar">
      ${profileImageUrl ? `<img src="${escapeHtml(profileImageUrl)}" alt="${escapeHtml(profileName)}">` : `<span>${initials}</span>`}
    </div>
    <div class="profile-info">
      <div class="profile-name">
        <span>${escapeHtml(profileName)}</span>
        ${isVerified ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#53BDEB"/><path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
      </div>
      <div class="profile-status" id="profileStatus">online</div>
    </div>
    <div class="header-icons">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
    </div>
  </div>
  <div class="chat-area" id="chatArea">
    <div class="encryption-notice">
      <div class="inner">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#8B7430"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
        <span>Messages and calls are end-to-end encrypted.</span>
      </div>
    </div>
    <div class="today-sep"><span>TODAY</span></div>
    <div id="messagesContainer"></div>
    <div class="typing-indicator" id="typingIndicator">
      <div class="typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
    <div class="waiting-prompt" id="waitingPrompt">
      <span>Tap a button above to continue</span>
    </div>
  </div>
  <div class="input-bar">
    <div class="input-field">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B9BA3"><circle cx="12" cy="12" r="10" fill="none" stroke="#8B9BA3" stroke-width="1.5"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#8B9BA3" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="10" r="1" fill="#8B9BA3"/><circle cx="15" cy="10" r="1" fill="#8B9BA3"/></svg>
      <span>Type a message</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B9BA3" stroke-width="1.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
    </div>
    <div class="mic-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z"/><path d="M17 12c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
    </div>
  </div>
</div>

<div class="footer">
  Created with <a href="#">WhatsApp Pitch Builder</a>
</div>

<script>
const MESSAGES = ${messagesJson};
let visibleCount = 0;
let simulationComplete = false;
let waitingForClick = false;
let isTyping = false;
let currentTimer = null;
let responseOverrides = {};

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatText(text) {
  if (!text) return '';
  let t = escapeHtml(text);
  t = t.replace(/\\*([^*]+)\\*/g, '<strong>$1</strong>');
  t = t.replace(/_([^_]+)_/g, '<em>$1</em>');
  t = t.replace(/~([^~]+)~/g, '<del>$1</del>');
  return t;
}

function hasInteractiveButtons(msg) {
  return (msg.content.buttons && msg.content.buttons.length > 0) || msg.content.type === 'interactive_list';
}

function scrollToBottom() {
  setTimeout(() => {
    const area = document.getElementById('chatArea');
    if (area) area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
  }, 80);
}

function showTyping(show) {
  isTyping = show;
  document.getElementById('typingIndicator').className = 'typing-indicator' + (show ? ' visible' : '');
  document.getElementById('profileStatus').textContent = show ? 'typing...' : 'online';
}

function showWaiting(show) {
  waitingForClick = show;
  document.getElementById('waitingPrompt').className = 'waiting-prompt' + (show ? ' visible' : '');
}

function renderMessage(msg, idx) {
  const isOutbound = msg.direction === 'outbound';
  const c = msg.content;
  const displayText = responseOverrides[idx] || c.text || c.bodyText || '';
  const ts = msg.timestamp || '';
  const readChecks = msg.isRead
    ? '<svg width="16" height="11" viewBox="0 0 16 11" fill="#53BDEB"><path d="M11.07.66L4.88 6.85 2.72 4.69 1.31 6.1l3.57 3.57L12.48 2.07z"/><path d="M14.07.66L7.88 6.85 6.47 5.44 5.06 6.85l2.82 2.82L15.48 2.07z"/></svg>'
    : '<svg width="16" height="11" viewBox="0 0 16 11" fill="#8696A0"><path d="M11.07.66L4.88 6.85 2.72 4.69 1.31 6.1l3.57 3.57L12.48 2.07z"/></svg>';

  let html = '<div class="msg-row ' + (isOutbound ? 'from-business' : 'from-customer') + '" id="msg-' + idx + '">';
  html += '<div class="bubble ' + (isOutbound ? 'bubble-business' : 'bubble-customer') + '">';

  if (c.type === 'template') {
    if (c.headerImageUrl && !c.headerImageUrl.startsWith('GENERATE_IMAGE:')) {
      html += '<div class="template-header-img"><img src="' + escapeHtml(c.headerImageUrl) + '" onerror="this.parentElement.style.display=\\'none\\'"></div>';
    }
    html += '<div class="bubble-content">';
    if (c.headerText) html += '<p class="template-header-text">' + escapeHtml(c.headerText) + '</p>';
    if (c.bodyText) html += '<p class="template-body">' + formatText(c.bodyText) + '</p>';
    html += '<div class="bubble-meta">';
    if (c.footerText) html += '<span class="template-footer">' + escapeHtml(c.footerText) + '</span>';
    html += '<span class="bubble-time" style="margin-left:auto;padding-left:8px;">' + ts + '</span></div></div>';
    if (c.buttons && c.buttons.length > 0) {
      html += '<div class="template-buttons">';
      c.buttons.forEach(function(btn) {
        html += '<button class="template-btn" onclick="handleBtnClick(' + idx + ',\\'' + escapeHtml(btn.id) + '\\',\\'' + escapeHtml(btn.title) + '\\')">' + escapeHtml(btn.title) + '</button>';
      });
      html += '</div>';
    }
  } else if (c.type === 'interactive_buttons') {
    html += '<div class="bubble-content"><p class="bubble-text">' + formatText(displayText) + '</p>';
    html += '<div class="bubble-meta"><span class="bubble-time">' + ts + '</span></div></div>';
    if (c.buttons && c.buttons.length > 0) {
      html += '<div class="interactive-buttons">';
      c.buttons.forEach(function(btn) {
        html += '<button class="interactive-btn" onclick="handleBtnClick(' + idx + ',\\'' + escapeHtml(btn.id) + '\\',\\'' + escapeHtml(btn.title) + '\\')">' + escapeHtml(btn.title) + '</button>';
      });
      html += '</div>';
    }
  } else if (c.type === 'interactive_list') {
    html += '<div class="bubble-content"><p class="bubble-text">' + formatText(displayText) + '</p>';
    html += '<div class="bubble-meta"><span class="bubble-time">' + ts + '</span></div></div>';
    html += '<button class="list-btn" onclick="toggleList(' + idx + ')">&#9776; ' + escapeHtml(c.listButtonText || 'View Options') + '</button>';
    html += '<div class="list-dropdown" id="list-' + idx + '">';
    if (c.listSections) {
      c.listSections.forEach(function(sec) {
        html += '<div class="list-section-title">' + escapeHtml(sec.title) + '</div>';
        sec.rows.forEach(function(row) {
          html += '<div class="list-row" onclick="handleListSelect(' + idx + ',\\'' + escapeHtml(row.id) + '\\',\\'' + escapeHtml(row.title) + '\\')"><div class="list-row-title">' + escapeHtml(row.title) + '</div>';
          if (row.description) html += '<div class="list-row-desc">' + escapeHtml(row.description) + '</div>';
          html += '</div>';
        });
      });
    }
    html += '</div>';
  } else if (c.type === 'image') {
    if (c.imageUrl && !c.imageUrl.startsWith('GENERATE_IMAGE:')) {
      html += '<img class="msg-image" src="' + escapeHtml(c.imageUrl) + '" onerror="this.style.display=\\'none\\'">';
    } else {
      html += '<div class="image-placeholder">' + escapeHtml(c.imageDescription || c.caption || 'Image') + '</div>';
    }
    if (c.caption) html += '<div class="msg-caption">' + formatText(c.caption) + '</div>';
    html += '<div class="bubble-meta"><span class="bubble-time">' + ts + '</span>';
    if (!isOutbound) html += readChecks;
    html += '</div>';
  } else if (c.type === 'video') {
    html += '<div class="video-placeholder"><div class="play-circle"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg></div><span style="font-size:11px;color:rgba(255,255,255,0.7);">' + escapeHtml(c.videoDescription || c.caption || 'Video') + '</span></div>';
    if (c.caption) html += '<div class="msg-caption">' + formatText(c.caption) + '</div>';
    html += '<div class="bubble-meta"><span class="bubble-time">' + ts + '</span></div>';
  } else if (c.type === 'carousel') {
    if (c.text) html += '<div class="carousel-intro">' + formatText(c.text) + '</div>';
    html += '<div class="bubble-meta" style="padding:0 8px 2px;"><span class="bubble-time">' + ts + '</span></div>';
    html += '<div class="carousel-scroller">';
    if (c.carouselCards) {
      c.carouselCards.forEach(function(card) {
        html += '<div class="carousel-card">';
        if (card.imageUrl && !card.imageUrl.startsWith('GENERATE_IMAGE:')) {
          html += '<img class="carousel-card-img" src="' + escapeHtml(card.imageUrl) + '" onerror="this.outerHTML=\\'<div class=carousel-card-placeholder>' + escapeHtml(card.imageDescription || card.title) + '</div>\\'">';
        } else {
          html += '<div class="carousel-card-placeholder">' + escapeHtml(card.imageDescription || card.title) + '</div>';
        }
        html += '<div class="carousel-card-body">';
        html += '<div class="carousel-card-title">' + escapeHtml(card.title) + '</div>';
        if (card.description) html += '<div class="carousel-card-desc">' + escapeHtml(card.description) + '</div>';
        if (card.price) html += '<div class="carousel-card-price">' + escapeHtml(card.price) + '</div>';
        html += '</div>';
        html += '<button class="carousel-card-btn">' + escapeHtml(card.buttonText) + '</button>';
        html += '</div>';
      });
    }
    html += '</div>';
  } else {
    // Default text message
    html += '<div class="bubble-content"><p class="bubble-text">' + formatText(displayText) + '</p>';
    html += '<div class="bubble-meta"><span class="bubble-time">' + ts + '</span>';
    if (!isOutbound) html += readChecks;
    html += '</div></div>';
  }

  html += '</div></div>';
  return html;
}

function renderAll() {
  const container = document.getElementById('messagesContainer');
  container.innerHTML = '';
  for (let i = 0; i < MESSAGES.length; i++) {
    container.innerHTML += renderMessage(MESSAGES[i], i);
  }
  // Make visible ones visible
  for (let i = 0; i < visibleCount; i++) {
    const el = document.getElementById('msg-' + i);
    if (el) el.classList.add('visible');
  }
}

function revealMessage(idx) {
  const el = document.getElementById('msg-' + idx);
  if (el) {
    el.classList.add('visible');
  }
}

function revealOneByOne(fromIdx) {
  let idx = fromIdx;
  function revealNext() {
    if (idx >= MESSAGES.length) {
      simulationComplete = true;
      showWaiting(false);
      showTyping(false);
      document.getElementById('showAllBtn').style.display = 'none';
      return;
    }
    const msg = MESSAGES[idx];
    const isOutbound = msg.direction === 'outbound';
    if (isOutbound && idx > fromIdx) {
      showTyping(true);
      scrollToBottom();
      currentTimer = setTimeout(function() {
        showTyping(false);
        visibleCount = idx + 1;
        revealMessage(idx);
        scrollToBottom();
        if (hasInteractiveButtons(msg) && idx < MESSAGES.length - 1) {
          showWaiting(true);
          return;
        }
        idx++;
        currentTimer = setTimeout(revealNext, 600);
      }, 800);
    } else {
      visibleCount = idx + 1;
      revealMessage(idx);
      scrollToBottom();
      if (hasInteractiveButtons(msg) && idx < MESSAGES.length - 1) {
        showWaiting(true);
        return;
      }
      idx++;
      currentTimer = setTimeout(revealNext, isOutbound ? 400 : 600);
    }
  }
  currentTimer = setTimeout(revealNext, 300);
}

function handleBtnClick(msgIdx, btnId, btnTitle) {
  if (simulationComplete) {
    for (let i = msgIdx + 1; i < MESSAGES.length; i++) {
      if (MESSAGES[i].direction === 'inbound') {
        const el = document.getElementById('msg-' + i);
        if (el) { el.classList.add('highlighted'); el.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(function(){el.classList.remove('highlighted');},1500); }
        break;
      }
    }
    return;
  }
  if (!waitingForClick) return;
  showWaiting(false);
  if (currentTimer) { clearTimeout(currentTimer); currentTimer = null; }
  let customerIdx = -1;
  for (let i = msgIdx + 1; i < MESSAGES.length; i++) {
    if (MESSAGES[i].direction === 'inbound') { customerIdx = i; break; }
  }
  if (customerIdx === -1) {
    revealOneByOne(visibleCount);
    return;
  }
  responseOverrides[customerIdx] = btnTitle;
  // Re-render the customer message with override
  const container = document.getElementById('messagesContainer');
  const oldEl = document.getElementById('msg-' + customerIdx);
  if (oldEl) {
    const temp = document.createElement('div');
    temp.innerHTML = renderMessage(MESSAGES[customerIdx], customerIdx);
    oldEl.replaceWith(temp.firstElementChild);
  }
  showTyping(true);
  scrollToBottom();
  currentTimer = setTimeout(function() {
    showTyping(false);
    visibleCount = customerIdx + 1;
    revealMessage(customerIdx);
    scrollToBottom();
    var nextStart = customerIdx + 1;
    if (nextStart >= MESSAGES.length) {
      currentTimer = setTimeout(function() { simulationComplete = true; document.getElementById('showAllBtn').style.display = 'none'; }, 500);
      return;
    }
    currentTimer = setTimeout(function() { revealOneByOne(nextStart); }, 700);
  }, 1000);
}

function handleListSelect(msgIdx, rowId, rowTitle) {
  var listEl = document.getElementById('list-' + msgIdx);
  if (listEl) listEl.classList.remove('open');
  handleBtnClick(msgIdx, rowId, rowTitle);
}

function toggleList(idx) {
  var el = document.getElementById('list-' + idx);
  if (el) el.classList.toggle('open');
}

function restart() {
  if (currentTimer) { clearTimeout(currentTimer); currentTimer = null; }
  visibleCount = 0;
  simulationComplete = false;
  waitingForClick = false;
  responseOverrides = {};
  showTyping(false);
  showWaiting(false);
  document.getElementById('showAllBtn').style.display = '';
  renderAll();
  setTimeout(function() { revealOneByOne(0); }, 100);
}

function showAll() {
  if (currentTimer) { clearTimeout(currentTimer); currentTimer = null; }
  visibleCount = MESSAGES.length;
  simulationComplete = true;
  showTyping(false);
  showWaiting(false);
  document.getElementById('showAllBtn').style.display = 'none';
  for (let i = 0; i < MESSAGES.length; i++) {
    revealMessage(i);
  }
  scrollToBottom();
}

// Initialize
renderAll();
setTimeout(function() { revealOneByOne(0); }, 500);
</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
