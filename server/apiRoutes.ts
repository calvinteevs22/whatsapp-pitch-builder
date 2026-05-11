/**
 * External REST API routes for bot integrations (Claude Code, MyClaw, etc.)
 * 
 * Authentication: Bearer token (API key) in Authorization header
 * Base path: /api/v1
 * 
 * Endpoints:
 *   GET  /api/v1/templates          — List all available templates
 *   POST /api/v1/threads/create     — One-shot: create thread + generate flow → return URL
 */
import { Express, Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { nanoid } from "nanoid";
import { getApiKeyByHash, updateApiKeyLastUsed, createThread, getMessagesByThread } from "./db";
import { TEMPLATE_CATALOG } from "../shared/templateCatalog";
import { INDUSTRIES } from "../shared/types";
import { invokeLLM } from "./_core/llm";
import { deepCrawlWebsite } from "./websiteCrawler";
import { resolveAllStockImages } from "./stockImages";

// Rate limiting: simple in-memory store
const rateLimitMap = new Map<number, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

interface AuthenticatedRequest extends Request {
  apiUser?: { id: number; openId: string; name: string | null; apiKeyId: number };
}

/**
 * API Key authentication middleware
 */
async function authenticateApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header. Use: Authorization: Bearer pk_xxx",
    });
    return;
  }

  const rawKey = authHeader.substring(7).trim();
  if (!rawKey.startsWith("pk_")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid API key format. Keys start with 'pk_'.",
    });
    return;
  }

  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const apiKey = await getApiKeyByHash(keyHash);

  if (!apiKey) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or revoked API key.",
    });
    return;
  }

  // Check expiry
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    res.status(401).json({
      error: "Unauthorized",
      message: "API key has expired.",
    });
    return;
  }

  // Rate limiting
  const now = Date.now();
  const rateEntry = rateLimitMap.get(apiKey.userId);
  if (rateEntry && now < rateEntry.resetAt) {
    if (rateEntry.count >= RATE_LIMIT) {
      res.status(429).json({
        error: "Rate limit exceeded",
        message: `Maximum ${RATE_LIMIT} requests per minute. Try again in ${Math.ceil((rateEntry.resetAt - now) / 1000)}s.`,
      });
      return;
    }
    rateEntry.count++;
  } else {
    rateLimitMap.set(apiKey.userId, { count: 1, resetAt: now + RATE_WINDOW });
  }

  // Update last used timestamp (fire and forget)
  updateApiKeyLastUsed(apiKey.id).catch(() => {});

  // Attach user info to request
  req.apiUser = {
    id: apiKey.userId,
    openId: "",
    name: null,
    apiKeyId: apiKey.id,
  };

  next();
}

/**
 * Register all external API routes
 */
export function registerApiRoutes(app: Express): void {
  // ==================== GET /api/v1/docs ====================
  // Public plain-text/markdown documentation endpoint for bots (Claude Code, etc.)
  app.get("/api/v1/docs", (req: Request, res: Response) => {
    const host = req.headers.host || req.hostname;
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const baseUrl = `${protocol}://${host}`;

    // Build template summary grouped by industry
    const templatesByIndustry: Record<string, typeof TEMPLATE_CATALOG> = {};
    for (const t of TEMPLATE_CATALOG) {
      if (!templatesByIndustry[t.industry]) templatesByIndustry[t.industry] = [];
      templatesByIndustry[t.industry].push(t);
    }

    let templateSection = "";
    for (const [industry, templates] of Object.entries(templatesByIndustry).sort(([a], [b]) => a.localeCompare(b))) {
      templateSection += `\n### ${industry}\n\n`;
      templateSection += `| Template ID | Title | Type | Description |\n`;
      templateSection += `|-------------|-------|------|-------------|\n`;
      for (const t of templates) {
        templateSection += `| \`${t.id}\` | ${t.title} | ${t.messageType} | ${t.description.substring(0, 100)}${t.description.length > 100 ? '...' : ''} |\n`;
      }
    }

    const markdown = `# WhatsApp Pitch Builder — Tool Documentation

## Overview

The WhatsApp Pitch Builder allows external tools (Claude Code, MyClaw, or any HTTP client) to:
- Browse 230+ pre-built WhatsApp conversation templates across 15 industries
- Create personalized WhatsApp demo threads with AI-generated conversation flows
- Optionally crawl a client's website to incorporate real business context

There are **two ways** to create threads:

1. **URL-based creation (Recommended)** — Generate a pre-filled URL that opens the app in the user's browser. The user reviews the details and clicks "Create & Generate". No API key needed.
2. **REST API** — Programmatic thread creation via HTTP POST with API key authentication. Best for automated/batch workflows.

## Base URL

\`\`\`
${baseUrl}/api/v1
\`\`\`

## Authentication Setup (One-Time)

1. Log in to the WhatsApp Pitch Builder app at ${baseUrl}
2. Click your profile name (top-right) → **API Keys**
3. Enter a name (e.g., "Claude Code") and click **Create**
4. Copy the generated key (starts with \`pk_\`) — it is shown only once
5. Configure your bot/tool with the key as an environment variable or config value

Use the key in the \`Authorization\` header:
\`\`\`
Authorization: Bearer pk_YOUR_API_KEY
\`\`\`

## Endpoints

### 1. List Templates

\`\`\`
GET ${baseUrl}/api/v1/templates
\`\`\`

**Authentication:** None required (public endpoint)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| industry | string | Filter by industry (e.g., "Retail", "E-Commerce") |
| messageType | string | Filter by type: "marketing", "utility", or "authentication" |
| search | string | Search by keyword in title, description, or tags |

**Example:**
\`\`\`bash
curl "${baseUrl}/api/v1/templates?industry=Retail&messageType=marketing"
\`\`\`

**Response:**
\`\`\`json
{
  "count": 15,
  "industries": ["Automotive", "Beauty & Wellness", ...],
  "messageTypes": ["marketing", "utility", "authentication"],
  "templates": [
    {
      "id": "retail-flash-sale",
      "title": "Flash Sale Announcement",
      "description": "...",
      "industry": "Retail",
      "messageType": "marketing",
      "tags": ["Flash Sale", "Discount"],
      "flowSteps": ["Hero Image", "Product Grid", "CTA Button"]
    }
  ]
}
\`\`\`

### 2. Create Thread (One-Shot)

\`\`\`
POST ${baseUrl}/api/v1/threads/create
\`\`\`

**Authentication:** Required (API key in Authorization header)

This endpoint creates a new WhatsApp demo thread with AI-generated conversation flow in a single call. It optionally crawls the client's website for real business context.

**Request Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Thread name (e.g., "Nike Spring Campaign") |
| businessName | string | No | Client business name |
| businessUrl | string | No | Client website URL (will be crawled for context) |
| industry | string | No | Industry vertical (see list below) |
| messageType | string | No | "marketing" (default), "utility", or "authentication" |
| templateId | string | Yes* | Template ID from the templates list |
| prompt | string | Yes* | Custom prompt for AI generation |

*Either \`templateId\` or \`prompt\` is required.

**Example using a template:**
\`\`\`bash
curl -X POST ${baseUrl}/api/v1/threads/create \\
  -H "Authorization: Bearer pk_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Nike Flash Sale Demo",
    "businessName": "Nike",
    "businessUrl": "https://nike.com",
    "industry": "Retail",
    "templateId": "retail-flash-sale"
  }'
\`\`\`

**Example using a custom prompt:**
\`\`\`bash
curl -X POST ${baseUrl}/api/v1/threads/create \\
  -H "Authorization: Bearer pk_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Appointment Booking Flow",
    "businessName": "HealthFirst Clinic",
    "industry": "Healthcare",
    "messageType": "utility",
    "prompt": "Create a WhatsApp flow for booking and confirming medical appointments with reminders"
  }'
\`\`\`

**Response (201 Created):**
\`\`\`json
{
  "success": true,
  "threadUid": "abc123xyz",
  "url": "${baseUrl}/builder/abc123xyz",
  "messageCount": 10,
  "profileName": "Nike",
  "industry": "Retail",
  "messageType": "marketing",
  "templateUsed": {
    "id": "retail-flash-sale",
    "title": "Flash Sale Announcement"
  }
}
\`\`\`

The \`url\` field is the direct link to view and edit the generated thread.

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Validation error — missing required fields or invalid templateId |
| 401 | Unauthorized — missing or invalid API key |
| 429 | Rate limit exceeded — max 30 requests per minute |
| 500 | AI generation failed — try again |

## Available Industries

${INDUSTRIES.map(i => `- ${i}`).join('\n')}

## Available Message Types

- **marketing** — Promotional messages to drive sales, engagement, and brand awareness
- **utility** — Transactional messages like order updates, appointment reminders, and notifications
- **authentication** — One-time passcodes and verification messages

## Template Catalog (${TEMPLATE_CATALOG.length} templates)
${templateSection}

## Rate Limits

- **Thread creation:** 30 requests per minute per API key
- **Template listing:** No rate limit (public endpoint)
- **Thread creation time:** 10-30 seconds (includes AI generation and optional website crawl)

## Method 1: URL-Based Creation (Recommended)

Generate a URL with query parameters. When the user opens it in their browser, they see a preview of the thread details and click one button to create it. The AI then auto-generates the conversation flow.

**No API key required.** The user's existing browser session handles authentication.

### URL Format

\`\`\`
${baseUrl}/create?template=TEMPLATE_ID&businessName=BUSINESS_NAME&businessUrl=WEBSITE_URL
\`\`\`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| template | string | Yes* | Template ID from the template catalog (see below) |
| prompt | string | Yes* | Custom prompt describing the conversation flow to generate |
| name | string | No | Thread name (auto-generated from template + business name if omitted) |
| businessName | string | No | Client business name (e.g., "Nike", "Starbucks") |
| businessUrl | string | No | Client website URL — AI will crawl it for real business context |
| industry | string | No | Industry vertical (auto-detected from template if omitted) |
| messageType | string | No | "marketing" (default), "utility", or "authentication" |
| imageUrl | string | No | URL of an image to use as the business profile picture |

*Either \`template\` or \`prompt\` is required.

### Examples

**Using a template (recommended):**
\`\`\`
${baseUrl}/create?template=retail-seasonal-sale&businessName=Nike&businessUrl=https://nike.com
\`\`\`

**Using a template with a specific name:**
\`\`\`
${baseUrl}/create?template=ecom-abandoned-cart&businessName=Shopee&businessUrl=https://shopee.com&name=Shopee%20Cart%20Recovery%20Demo
\`\`\`

**Using a custom prompt:**
\`\`\`
${baseUrl}/create?prompt=Create%20a%20WhatsApp%20flow%20for%20booking%20medical%20appointments%20with%20reminders&businessName=HealthFirst%20Clinic&industry=Healthcare&messageType=utility
\`\`\`

**With a business profile image:**
\`\`\`
${baseUrl}/create?template=food-loyalty-program&businessName=Starbucks&businessUrl=https://starbucks.com&imageUrl=https://logo.clearbit.com/starbucks.com
\`\`\`

> **Important:** Use \`GET ${baseUrl}/api/v1/templates\` to browse all valid template IDs. Template IDs follow the pattern \`{industry}-{use-case}\` (e.g., \`retail-seasonal-sale\`, \`healthcare-appointment-reminder\`, \`ecom-abandoned-cart\`).

### How It Works

1. Your bot generates the URL with the appropriate query parameters
2. The user clicks the URL (or you present it as a link)
3. The app opens showing a preview of the thread details (name, industry, template, etc.)
4. The user clicks **"Create & Generate Thread"**
5. The app creates the thread and auto-triggers AI generation
6. The user lands in the builder with the fully generated conversation flow, ready to edit and share

### Generating URLs in Code

**Python:**
\`\`\`python
from urllib.parse import urlencode

base_url = "${baseUrl}"
params = {
    "template": "retail-seasonal-sale",
    "businessName": "Nike",
    "businessUrl": "https://nike.com",
}
url = f"{base_url}/create?{urlencode(params)}"
print(f"Open this link to create the thread: {url}")
\`\`\`

**JavaScript/TypeScript:**
\`\`\`javascript
const baseUrl = "${baseUrl}";
const params = new URLSearchParams({
  template: "retail-seasonal-sale",
  businessName: "Nike",
  businessUrl: "https://nike.com",
});
const url = \`\${baseUrl}/create?\${params}\`;
console.log(\`Open this link to create the thread: \${url}\`);
\`\`\`

**Bash/curl (just generate the URL, no HTTP call needed):**
\`\`\`bash
echo "${baseUrl}/create?template=retail-seasonal-sale&businessName=Nike&businessUrl=https%3A%2F%2Fnike.com"
\`\`\`

## Method 2: REST API (Programmatic)

For automated or batch workflows, use the REST API with API key authentication.

### Authentication Setup (One-Time)

1. Log in to the WhatsApp Pitch Builder app at ${baseUrl}
2. Click your profile name (top-right) → **API Keys**
3. Enter a name (e.g., "Claude Code") and click **Create**
4. Copy the generated key (starts with \`pk_\`) — it is shown only once
5. Configure your bot/tool with the key

Use the key in the \`Authorization\` header:
\`\`\`
Authorization: Bearer pk_YOUR_API_KEY
\`\`\`

## Tips for AI Bot Integration

1. **Prefer URL-based creation** — It's simpler (no API key), the user stays in control, and they can review before generating
2. **Start with templates** — Use \`GET ${baseUrl}/api/v1/templates\` to find the best template for your client's industry and use case
3. **Include businessUrl** — When provided, the AI crawls the website and incorporates real product data, branding, and business context into the generated demo
4. **Use descriptive names** — The \`name\` field appears in the thread list, so make it descriptive (e.g., "Nike Spring Collection Launch" not "test")
5. **URL-encode special characters** — Spaces become \`%20\`, ampersands become \`%26\`, etc. Use your language's built-in URL encoding
6. **Share the result** — After the user creates the thread, they can share it via a public link, email, or WhatsApp directly from the builder
`;

    res.type("text/markdown").send(markdown);
  });

  // ==================== GET /api/v1/templates ====================
  // Public endpoint (no auth required) — lists all available templates
  app.get("/api/v1/templates", (req: Request, res: Response) => {
    const { industry, messageType, search } = req.query;

    let templates = TEMPLATE_CATALOG.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      industry: t.industry,
      messageType: t.messageType,
      tags: t.tags,
      flowSteps: t.flowSteps,
    }));

    // Filter by industry
    if (industry && typeof industry === "string") {
      const lowerIndustry = industry.toLowerCase();
      templates = templates.filter(t => t.industry.toLowerCase() === lowerIndustry);
    }

    // Filter by message type
    if (messageType && typeof messageType === "string") {
      templates = templates.filter(t => t.messageType === messageType);
    }

    // Search by keyword in title, description, or tags
    if (search && typeof search === "string") {
      const lowerSearch = search.toLowerCase();
      templates = templates.filter(t =>
        t.title.toLowerCase().includes(lowerSearch) ||
        t.description.toLowerCase().includes(lowerSearch) ||
        t.tags.some(tag => tag.toLowerCase().includes(lowerSearch))
      );
    }

    res.json({
      count: templates.length,
      industries: [...INDUSTRIES],
      messageTypes: ["marketing", "utility", "authentication"],
      templates,
    });
  });

  // ==================== POST /api/v1/threads/create ====================
  // Authenticated endpoint — creates a thread and generates the conversation flow
  app.post("/api/v1/threads/create", authenticateApiKey as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        name,
        businessName,
        businessUrl,
        industry,
        messageType = "marketing",
        templateId,
        prompt: customPrompt,
      } = req.body;

      // Validation
      if (!name || typeof name !== "string") {
        res.status(400).json({ error: "Validation error", message: "'name' is required (string)." });
        return;
      }

      if (messageType && !["marketing", "utility", "authentication"].includes(messageType)) {
        res.status(400).json({ error: "Validation error", message: "'messageType' must be one of: marketing, utility, authentication." });
        return;
      }

      // Determine the prompt to use
      let aiPrompt: string;
      let selectedTemplate: typeof TEMPLATE_CATALOG[0] | undefined;

      if (templateId) {
        selectedTemplate = TEMPLATE_CATALOG.find(t => t.id === templateId);
        if (!selectedTemplate) {
          res.status(400).json({
            error: "Validation error",
            message: `Template '${templateId}' not found. Use GET /api/v1/templates to see available templates.`,
          });
          return;
        }
        aiPrompt = selectedTemplate.prompt;
      } else if (customPrompt && typeof customPrompt === "string") {
        aiPrompt = customPrompt;
      } else {
        res.status(400).json({
          error: "Validation error",
          message: "Either 'templateId' or 'prompt' is required to generate a conversation flow.",
        });
        return;
      }

      const userId = req.apiUser!.id;
      const threadUid = nanoid(12);
      const effectiveIndustry = industry || selectedTemplate?.industry || undefined;
      const effectiveMessageType = messageType || selectedTemplate?.messageType || "marketing";

      // Step 1: Create the thread
      const thread = await createThread({
        uid: threadUid,
        userId,
        name,
        businessName: businessName || undefined,
        businessUrl: businessUrl || undefined,
        industry: effectiveIndustry,
        messageType: effectiveMessageType as "marketing" | "utility" | "authentication",
      });

      // Step 2: Optionally crawl the website for business context
      let businessProfile: any = undefined;
      if (businessUrl) {
        try {
          console.log(`[API] Crawling website: ${businessUrl}`);
          const profile = await deepCrawlWebsite(businessUrl);
          businessProfile = {
            businessName: profile.businessName || businessName || "",
            industry: profile.industry || effectiveIndustry || "",
            description: profile.description || "",
            tagline: profile.tagline,
            brandTone: profile.brandTone,
            logoUrl: profile.logoUrl,
            heroImageUrl: profile.heroImageUrl,
            products: profile.products?.slice(0, 8),
            services: profile.services?.slice(0, 6),
          };
        } catch (err: any) {
          console.warn(`[API] Website crawl failed: ${err.message?.substring(0, 100)}`);
          // Continue without crawl data — not a fatal error
        }
      }

      // Step 3: Build the LLM prompt and generate the conversation
      const { buildSystemPrompt, buildUserPromptForApi, buildBusinessProfileContext } = await import("./aiPromptHelpers");

      const systemPrompt = buildSystemPrompt(effectiveMessageType, effectiveIndustry || null);
      let userPrompt = buildUserPromptForApi({
        prompt: aiPrompt,
        businessName: businessName || businessProfile?.businessName,
        businessUrl,
        industry: effectiveIndustry,
        messageType: effectiveMessageType,
      });

      if (businessProfile) {
        userPrompt += buildBusinessProfileContext(businessProfile);
      }

      console.log(`[API] Generating conversation for thread ${threadUid}...`);
      const llmResponse = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const rawContentRaw = llmResponse.choices?.[0]?.message?.content || "";
      const rawContent = typeof rawContentRaw === "string" ? rawContentRaw : JSON.stringify(rawContentRaw);
      // Parse JSON from the response (handle markdown code blocks)
      let jsonStr = rawContent;
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1];
      jsonStr = jsonStr.trim();

      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        console.error(`[API] Failed to parse LLM response as JSON`);
        res.status(500).json({ error: "Generation failed", message: "AI failed to generate a valid conversation. Try again." });
        return;
      }

      // Step 4: Process messages and save to database
      const aiMessages: any[] = parsed.messages || parsed;
      const profileName = parsed.profileName || businessName || name;

      // Resolve stock images for all messages
      const messagesWithImages = resolveAllStockImages(aiMessages, effectiveIndustry || "General", effectiveIndustry || undefined);

      // Save messages to database
      const { bulkCreateMessages, updateThread: updateThreadDb } = await import("./db");
      await bulkCreateMessages(thread.id, messagesWithImages.map((m: any, i: number) => ({
        sortOrder: i,
        direction: m.direction || "outbound",
        contentType: m.contentType || m.content?.type || "text",
        content: m.content,
        timestamp: m.timestamp || "12:00 PM",
        isRead: true,
      })));

      // Update thread with profile name and business context
      await updateThreadDb(threadUid, userId, {
        profileName,
        businessContext: businessProfile?.description || customPrompt || aiPrompt,
        businessName: businessProfile?.businessName || businessName,
      });

      // Build the thread URL
      const host = req.headers.host || req.hostname;
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const baseUrl = `${protocol}://${host}`;
      const threadUrl = `${baseUrl}/builder/${threadUid}`;

      const savedMessages = await getMessagesByThread(thread.id);

      console.log(`[API] Thread created: ${threadUid} with ${savedMessages.length} messages`);

      res.status(201).json({
        success: true,
        threadUid,
        url: threadUrl,
        messageCount: savedMessages.length,
        profileName,
        industry: effectiveIndustry,
        messageType: effectiveMessageType,
        templateUsed: selectedTemplate ? { id: selectedTemplate.id, title: selectedTemplate.title } : null,
      });
    } catch (err: any) {
      console.error(`[API] Thread creation failed:`, err.message?.substring(0, 300));
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to create thread. Please try again.",
      });
    }
  });
}
