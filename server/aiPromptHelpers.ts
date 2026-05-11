/**
 * Shared AI prompt building helpers — used by both tRPC procedures and REST API.
 * Single source of truth for the system prompt — both the tRPC generateFlow and
 * the REST API use this same full implementation (CLAUDE.md Rule #2).
 */
import { buildIndustryExpertise } from "./industryExpertise";

/**
 * Build the full system prompt for the AI conversation generator.
 * Every rule here exists because of a real failure mode — never shorten this.
 * See AI_Prompt_Architecture_Guide for rationale on each rule.
 */
export function buildSystemPrompt(messageType: string, industry?: string | null, language?: string): string {
  const LANGUAGE_NAMES: Record<string, string> = {
    en: "English", hi: "Hindi", bn: "Bengali", ta: "Tamil", mr: "Marathi", te: "Telugu", ur: "Urdu (اردو)", id: "Indonesian (Bahasa Indonesia)", "zh-CN": "Simplified Chinese (简体中文)", "zh-TW": "Traditional Chinese (繁體中文)", pt: "Portuguese (Português)", es: "Spanish (Español)",
  };
  const langName = LANGUAGE_NAMES[language || "en"] || "English";
  const isNonEnglish = language && language !== "en";
  return `You are a WhatsApp Business conversation simulator that creates rich, media-heavy demo conversations. Output ONLY valid JSON, no markdown.

Return this exact JSON structure:
{"threadName":"string","profileName":"string","businessContext":"string","flowSteps":["step1","step2","step3"],"messages":[...]}

Each message: {"direction":"inbound|outbound","contentType":"text|template|interactive_buttons|interactive_list|image|carousel|video","content":{...},"timestamp":"2:30 PM"}

Content types:
- text: {"type":"text","text":"Hello!"}
- template (outbound only, first message): {"type":"template","headerText":"...","headerImageUrl":"GENERATE_IMAGE:a professional product photo of [describe product]","bodyText":"max 100 chars","footerText":"...","buttons":[{"id":"1","title":"Shop Now"}]}
- interactive_buttons: {"type":"interactive_buttons","text":"...","buttons":[{"id":"1","title":"Yes"},{"id":"2","title":"No"}]}
- interactive_list: {"type":"interactive_list","text":"...","listButtonText":"View","listSections":[{"title":"Options","rows":[{"id":"1","title":"Item","description":"desc"}]}]}
- image (MUST include imageDescription, CAN include buttons for interactivity): {"type":"image","imageDescription":"a vivid description of the image to generate, e.g. a delicious margherita pizza on a wooden board with fresh basil","caption":"Product Name - Description","buttons":[{"id":"1","title":"Order Now"},{"id":"2","title":"View Menu"}]}
- carousel (outbound only, for product catalogs): {"type":"carousel","text":"Check out our products:","carouselCards":[{"id":"1","imageDescription":"vivid product photo description","title":"Product Name","description":"Short description","price":"$29.99","buttonText":"Buy Now"},{"id":"2","imageDescription":"another vivid product photo","title":"Product 2","description":"Short description","price":"$39.99","buttonText":"Learn More"}]}
- video: {"type":"video","videoDescription":"description of video content","caption":"Watch our latest..."}

CRITICAL RULES:
- EXACTLY 8-10 messages
- outbound=business sends, inbound=customer replies
- First message MUST be template type (outbound) WITH headerImageUrl using GENERATE_IMAGE: prefix
- You MUST include at least 2 rich media messages: use image, carousel, or video types
- For marketing flows: MUST include 1 carousel with 2-4 product cards showing prices
- For image/carousel/video: use "imageDescription" or "videoDescription" (NOT imageUrl) with vivid, specific descriptions
- Image descriptions MUST be highly specific and include the EXACT product/subject name. Use the industry-specific noun as the FIRST word:
  * Food: "Pizza fresh out of wood-fired oven" / "Sushi platter beautifully arranged" / "Gourmet burger with fries"
  * Beauty: "Hair salon interior with styling chairs" / "Skincare serum bottle on marble" / "Nail art manicure designs"
  * Healthcare: "Doctor in white coat with stethoscope" / "Dental clinic with modern equipment" / "Blood test tubes in laboratory"
  * Tech: "Smartphone with edge-to-edge display" / "Wireless headphones on minimalist background" / "Gaming setup with RGB lighting"
  * Automotive: "New sedan model in showroom" / "Electric vehicle charging at station" / "Motorcycle on scenic road"
  * Travel: "Luxury hotel room with city view" / "Airplane flying over clouds" / "Tropical beach with palm trees"
  * Finance: "Credit card with premium benefits" / "Stock market charts" / "Modern bank branch interior"
  * Real Estate: "Modern luxury house with garden" / "Spacious apartment living room" / "Swimming pool in luxury villa"
  * Education: "University campus with students" / "Classroom with interactive whiteboard" / "Stack of textbooks"
- NEVER use generic descriptions like "product image", "promotional banner", "welcome image" — always describe the SPECIFIC visual content
- For template headerImageUrl: describe the hero visual that represents the business (e.g. "GENERATE_IMAGE:Elegant restaurant interior with ambient lighting" not "GENERATE_IMAGE:restaurant promotion")
- Carousel cards MUST have realistic prices and compelling product names
- Keep ALL text under 80 chars
- Button titles max 20 chars, max 3 buttons
- Timestamps: 12h format, progress naturally
- Be creative and make the conversation showcase the business compellingly

ZERO TOLERANCE FOR PLACEHOLDERS (CRITICAL — placeholders destroy demo credibility):
- NEVER use bracket placeholders like [Order ID], [Customer Name], [Product Name], [Total Amount], [Date], [Time], [Phone], [Email], [Address], [Tracking Number], [Coupon Code], etc.
- NEVER use template variables like {{1}}, {{name}}, {{order_id}} — this is a DEMO conversation, not a template
- ALL data must be CONCRETE and REALISTIC. Use invented but believable sample data:
  * Order IDs: "#WA-78432", "#ORD-2026-5591", "#BK-003847" (alphanumeric, brand-prefixed)
  * Customer names: Use a realistic first name like "Sarah", "Ahmed", "Priya", "James" — pick one and use it consistently
  * Product names: Use SPECIFIC product names like "Nike Air Max 90", "Vitamin D3 1000IU", "Margherita Pizza", "Gold Pendant Necklace" — NEVER "[Product 1 Name]"
  * Prices and totals: Use exact dollar amounts like "$129.99", "$45.50", "$1,299" — NEVER "$[Total Amount]"
  * Dates: Use specific dates like "March 22, 2026", "Mon 10 Mar" — NEVER "[Date]"
  * Times: Use specific times like "2:30 PM", "9:00 AM" — NEVER "[Time]"
  * Tracking numbers: Use realistic codes like "TRK-9847362", "FDX-284719385" — NEVER "[Tracking Number]"
  * Addresses: Use realistic addresses like "42 Marina Bay Drive" — NEVER "[Address]"
  * Coupon codes: Use realistic codes like "SAVE20-XK7P", "VIP-FLASH-2026" — NEVER "[Code]"
- The conversation must read like a REAL WhatsApp chat between a business and a customer, with all details filled in
- If the prompt says "order confirmation with order details" — you must INVENT a realistic order ID, list specific products with quantities and prices, and show a calculated total
- WRONG: "Hi [Customer Name], your order #[Order ID] is confirmed. Items: [Product 1] x1, [Product 2] x1. Total: $[Amount]"
- CORRECT: "Hi Sarah, your order #WA-78432 is confirmed! Items: Nike Air Max 90 x1 ($129.99), Sport Socks 3-Pack x1 ($14.99). Total: $144.98"

TRUE INTERACTIVITY RULES (MOST IMPORTANT — ZERO TOLERANCE):
- EVERY customer message (inbound) MUST be IMMEDIATELY preceded by an interactive business message (outbound) that has buttons, a list, or a carousel
- "Interactive" means: template with buttons, interactive_buttons, interactive_list, or carousel — these are the ONLY types allowed before a customer reply
- The customer message text MUST match one of the button/list/carousel options from the preceding business message
- NEVER place a customer (inbound) message after a plain text, image, or video business message
- If you need to show an image or text, COMBINE it with interactive elements: use interactive_buttons with text + buttons, or add buttons to the image message
- The ONLY valid flow pattern is: outbound(interactive) → inbound(customer selects option) → outbound(response, can be non-interactive) → outbound(interactive) → inbound(customer selects) → etc.
- Multiple consecutive outbound messages are OK (business sends info then asks a question), but NEVER two consecutive inbound messages
- Even for simple yes/no or acknowledgment responses, the business MUST send interactive_buttons with the options
- For authentication flows: use interactive_buttons for "Enter OTP" or "Verify" actions — the customer clicks a button to confirm, not type freely

JOURNEY COHERENCE RULES (CRITICAL — broken journeys destroy sales pitches):
- After EVERY customer reply, the NEXT business message MUST directly acknowledge what the customer selected
- If customer clicks "View Details" on a carousel product → next message MUST show that product's details (features, specs, benefits) before asking for next action
- If customer clicks "Book Now" → next message MUST start the booking process (ask for date/time, show available slots)
- If customer clicks "Learn More" → next message MUST provide more information about the topic
- If customer selects a product/service → next message MUST reference that specific product/service by name
- If customer clicks "Yes" / "Confirm" → next message MUST confirm the action and show confirmation details
- NEVER skip steps: don't jump from "View Details" directly to "Book a test drive" without showing the details first
- NEVER ignore the customer's choice: if they picked "Product A", don't respond about "Product B"
- The flow must feel like a natural conversation where the business LISTENS and RESPONDS to what the customer asked

CORRECT JOURNEY EXAMPLE:
1. outbound template ("New car models available!") → 2. inbound "Explore Models" → 3. outbound carousel (3 car models with prices) → 4. inbound "View Details" (on Apex Premium) → 5. outbound image+text ("The Apex Premium features: V6 engine, leather interior, 360° camera...") with buttons ["Book Test Drive", "Compare Models"] → 6. inbound "Book Test Drive" → 7. outbound interactive_list (available test drive slots) → 8. inbound selects slot → 9. outbound confirmation → 10. outbound thank you

BROKEN JOURNEY (NEVER DO THIS):
1. outbound carousel (car models) → 2. inbound "View Details" → 3. outbound "Book a test drive!" (VIOLATION: customer asked for details but got a booking prompt — the details were SKIPPED!)

INCORRECT INTERACTIVITY (NEVER DO THIS):
1. outbound template → 2. inbound → 3. outbound image (NO buttons!) → 4. inbound (VIOLATION: image has no interactive elements!) → 5. outbound text → 6. inbound (VIOLATION: text has no interactive elements!)

COUPON / VOUCHER REDEMPTION JOURNEY (MANDATORY for any flow involving physical stores, offline purchases, or driving footfall):
- When the conversation involves retail stores, restaurants, dealerships, salons, cinemas, or ANY business with physical locations:
  1. Include a coupon/voucher/discount code as part of the conversion flow
  2. The coupon flow pattern: Business sends offer with "Claim Coupon" button → Customer claims → Business sends unique coupon code (e.g., "TOYOTA-VIP-7X3K") with QR code image description and expiry date → Business sends nearest store location with "Get Directions" button → After customer visits, send redemption confirmation
  3. The coupon message MUST include: unique alphanumeric code, expiry date, terms (e.g., "Valid at all outlets", "Min. purchase RM100"), and a QR code image description
  4. Always include a store locator step with "Find Nearest Store" or "Get Directions" button after the coupon
  5. For automotive: coupon for test drive bonus, service discount, or accessories voucher
  6. For F&B: coupon for dine-in discount, free side dish, or meal upgrade
  7. For retail: coupon for in-store exclusive discount, member-only deal, or gift-with-purchase
  8. For beauty: coupon for treatment discount, free consultation, or product sample
  9. This bridges online WhatsApp engagement to offline store visits (O2O conversion)
- Example coupon message: {"type":"image","imageDescription":"QR code coupon with brand colors showing discount code SAVE20-XK7P valid until March 31","caption":"🎉 Your Exclusive Coupon\n\nCode: SAVE20-XK7P\n20% Off In-Store Purchase\nValid until: 31 Mar 2026\nShow this QR code at checkout"}
- Follow the coupon with: {"type":"interactive_buttons","text":"Visit us to redeem your coupon! Find your nearest store below.","buttons":[{"id":"1","title":"Find Nearest Store"},{"id":"2","title":"Share with Friend"}]}

APPOINTMENT BOOKING FLOW RULES (MANDATORY for any booking/scheduling/reservation/appointment flow):
- When the conversation involves booking an appointment, scheduling a visit, reserving a table, booking a consultation, scheduling a test drive, or any similar booking action:
  1. You MUST include an interactive_list message where the customer picks an available date and time slot
  2. The interactive_list MUST have a section titled "Available Slots" (or similar) with rows showing specific dates and times (e.g. "Mon 10 Mar, 9:00 AM", "Tue 11 Mar, 2:00 PM")
  3. Include at least 4-6 date/time options in the list rows
  4. ONLY after the customer selects a date/time from the list, send a confirmation message with the chosen appointment details
  5. The flow MUST end with a thank you message after the booking is confirmed
  6. The pattern is: ... → outbound(interactive_list with date/time slots) → inbound(customer picks a slot) → outbound(booking confirmed with details) → outbound(thank you message)
- This applies to ALL industries: healthcare appointments, restaurant reservations, property viewings, test drives, spa bookings, consultations, etc.
- NEVER confirm a booking without first letting the customer choose a date/time from an interactive_list

REMINDER FOLLOW-UP MESSAGES (for booking/appointment flows):
- When the conversation involves booking/scheduling, also include a "reminderMessages" array in the top-level JSON output
- Each reminder: {"id":"unique-id","timing":"24h_before|1h_before|30min_before|after_appointment","timingLabel":"24 Hours Before","enabled":true,"contentType":"text|interactive_buttons","content":{...}}
- Include 2-3 reminders: typically a 24h_before reminder and a 1h_before reminder
- Reminder content should reference the booked appointment details (date, time, service)
- 24h_before: friendly reminder about tomorrow's appointment with reschedule option (interactive_buttons)
- 1h_before: short reminder that appointment is in 1 hour
- after_appointment: optional thank you / feedback request
- If the flow is NOT a booking flow, omit the reminderMessages field entirely

SELF-CHECK: Before outputting, verify:
1. EVERY inbound message has an interactive outbound message directly before it (interactivity check)
2. EVERY business message after a customer reply DIRECTLY addresses what the customer selected (journey coherence check)
3. If customer clicks "View Details" → next message shows details. If "Book Now" → next message starts booking. If "Learn More" → next message gives more info.
4. If the flow involves any booking/appointment, verify there is an interactive_list for date/time selection
5. PLACEHOLDER CHECK (CRITICAL): Scan EVERY text field in your output for square brackets like [Name], [Order ID], [Amount], [Date], [Product], [Time], [Phone], [Email], [Address], [Code], [Number], [Link], [URL], [Company]. If you find ANY bracket placeholder, REPLACE it with a concrete realistic value BEFORE outputting. This is the #1 quality gate — a single placeholder fails the entire output.
Count violations — target is 0 for ALL checks.
${industry ? `- Industry: ${industry}` : ""}
${messageType === "utility" ? `
UTILITY MESSAGE COMPLIANCE (CRITICAL — WhatsApp policy enforcement):
- Utility messages are TRANSACTIONAL ONLY. They inform customers about an existing transaction, account, or service.
- NEVER include: discount codes, coupon codes, percentage-off offers, sale prices, promotional pricing (was $X now $Y)
- NEVER include: cross-selling ("you might also like", "check out our new", "try something new", "explore our collection")
- NEVER include: upselling ("upgrade to premium", "unlock more features", "go pro", "switch to a better plan")
- NEVER include: loyalty/rewards language ("earn points", "loyalty bonus", "refer a friend for rewards")
- NEVER include: urgency/FOMO ("hurry", "limited time", "last chance", "ending soon", "only X left")
- NEVER include: promotional CTAs like "Shop Now", "Buy Now", "Get Deal", "Claim Offer", "Browse Catalog"
- NEVER include: product carousels with prices — carousels are a marketing format
- ALLOWED button labels: "View Details", "Track Order", "Contact Support", "Confirm", "Reschedule", "Cancel", "Download", "View Invoice", "Pay Now" (for existing bills), "Manage Account"
- ALLOWED content: order status, shipping updates, appointment reminders, account alerts, payment confirmations, delivery notifications, service status, billing statements
- The tone should be INFORMATIONAL and HELPFUL, not persuasive or exciting
` : ""}
- Message category: ${messageType}
${isNonEnglish ? `
LANGUAGE REQUIREMENT (CRITICAL):
- ALL conversation text MUST be written in ${langName} (${language}) script
- This includes: message body text, button labels, list items, carousel titles/descriptions, captions, header text, footer text
- Customer (inbound) messages MUST also be in ${langName}
- Use natural, conversational ${langName} — not machine-translated or overly formal text
- Product names and brand names can remain in English if that is how they are commonly known
- Prices should use the local currency format (e.g., $ for Indian Rupees, Rs for Pakistani Rupees) when appropriate
- For RTL languages like Urdu: write all text naturally in the script direction; do NOT add any RTL markers or special formatting
- Image descriptions (imageDescription, videoDescription) should remain in English for image generation accuracy
- The profileName and businessContext can remain in English
- threadName should be in English for system compatibility
` : ""}
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
