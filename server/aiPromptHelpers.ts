/**
 * Shared AI prompt building helpers — used by both tRPC procedures and REST API.
 * Extracted from routers.ts for reuse.
 */
import { buildIndustryExpertise } from "./industryExpertise";

/**
 * Build the system prompt for the AI conversation generator.
 * This is a simplified version for the API — the full version lives in routers.ts.
 */
export function buildSystemPrompt(industry: string | null, messageType: string): string {
  return `You are a WhatsApp Business conversation designer. Generate realistic, engaging WhatsApp conversations in valid JSON format.

OUTPUT FORMAT (strict JSON, no markdown):
{
  "profileName": "Business Name",
  "messages": [
    {
      "direction": "outbound" | "inbound",
      "contentType": "template" | "text" | "interactive_buttons" | "interactive_list" | "image" | "video" | "carousel",
      "content": { ... },
      "timestamp": "HH:MM AM/PM"
    }
  ]
}

RULES:
- Start with a template message (outbound) with headerImageUrl using "GENERATE_IMAGE:" prefix
- Include 8-12 messages total
- Mix message types: template, text, interactive_buttons, interactive_list, image, carousel
- Every inbound message MUST be preceded by an interactive outbound message
- After every customer button click, the NEXT business message MUST directly address what the customer selected
- Use "imageDescription" fields with vivid, specific visual descriptions for AI image generation
- All text under 80 characters per message
- Include at least 1 image message AND 1 carousel with product cards (with prices)
- Carousel cards need: id, title, description, price, buttonText, imageDescription
${industry ? `- Industry: ${industry}` : ""}
- Message category: ${messageType}
${industry ? buildIndustryExpertise(industry) : ""}`;
}

/**
 * Build the user prompt for the API endpoint.
 */
export function buildUserPromptForApi(input: {
  prompt: string;
  businessName?: string;
  businessUrl?: string;
  industry?: string;
  messageType: string;
}): string {
  let prompt = `Create a WhatsApp ${input.messageType} conversation: ${input.prompt}`;
  if (input.businessName) prompt += `\nBusiness: ${input.businessName}`;
  if (input.industry) prompt += `\nIndustry: ${input.industry}`;
  prompt += `\n\nOutput ONLY the JSON object. 8-10 messages. All text under 80 chars. Start with template.`;
  prompt += `\nINCLUDE rich media: at least 1 image message AND 1 carousel with product cards (with prices).`;
  prompt += `\nUse "imageDescription" fields with vivid, specific visual descriptions for AI image generation.`;
  prompt += `\nFor template headerImageUrl, use "GENERATE_IMAGE:" prefix followed by a specific visual description.`;
  prompt += `\nCRITICAL: Every customer (inbound) message MUST be immediately preceded by an interactive business message.`;
  prompt += `\nJOURNEY COHERENCE: After every customer button click, the NEXT business message MUST directly address what the customer selected.`;
  return prompt;
}

/**
 * Build a rich context string from a business profile for the AI prompt.
 */
export function buildBusinessProfileContext(profile: {
  businessName: string;
  industry: string;
  description: string;
  tagline?: string;
  brandTone?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  products?: Array<{ name: string; description: string; price: string; imageUrl: string; category: string }>;
  services?: Array<{ name: string; description: string; price: string; imageUrl: string; category: string }>;
}): string {
  let context = `\n\n=== REAL BUSINESS DATA (USE THIS — DO NOT INVENT PRODUCTS) ===`;
  context += `\nBusiness: ${profile.businessName}`;
  context += `\nIndustry: ${profile.industry}`;
  context += `\nDescription: ${profile.description}`;
  if (profile.tagline) context += `\nTagline: "${profile.tagline}"`;
  if (profile.brandTone) context += `\nBrand Tone: ${profile.brandTone}`;

  const products = profile.products || [];
  const services = profile.services || [];

  if (products.length > 0) {
    context += `\n\n--- REAL PRODUCTS (use these exact names, prices, and descriptions) ---`;
    for (const p of products.slice(0, 8)) {
      context += `\n• ${p.name} — ${p.price} — ${p.description}`;
    }
  }

  if (services.length > 0) {
    context += `\n\n--- REAL SERVICES (use these exact names, prices, and descriptions) ---`;
    for (const s of services.slice(0, 6)) {
      context += `\n• ${s.name} — ${s.price} — ${s.description}`;
    }
  }

  context += `\n\nCRITICAL: Use the EXACT product/service names and prices listed above.`;
  context += `\n=== END REAL BUSINESS DATA ===\n`;

  return context;
}
