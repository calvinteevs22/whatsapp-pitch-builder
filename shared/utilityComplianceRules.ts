/**
 * Utility Template Compliance Validation
 *
 * WhatsApp utility messages must NOT contain promotional content.
 * This module detects promotional patterns in utility message flows
 * and provides actionable feedback for auto-fixing or flagging.
 *
 * Based on Meta's WhatsApp Business Platform template categorization:
 * - Utility: transactional updates (order confirmations, shipping, account alerts)
 * - Marketing: promotional content (offers, discounts, cross-sell, upsell)
 * - Authentication: OTP / verification only
 */

// ── Pattern Definitions ──────────────────────────────────────────────

export interface ComplianceViolation {
  /** Which field triggered the violation (e.g. "content.text", "button.title") */
  field: string;
  /** The matched text snippet (up to 80 chars) */
  matchedText: string;
  /** Human-readable rule that was violated */
  rule: string;
  /** Severity: "high" = almost certainly promotional, "medium" = review recommended */
  severity: "high" | "medium";
  /** Suggested fix */
  suggestion: string;
}

export interface ComplianceResult {
  /** Whether the message/flow passes all compliance checks */
  isCompliant: boolean;
  /** Total violations found */
  violationCount: number;
  /** Detailed list of violations */
  violations: ComplianceViolation[];
  /** Summary text for display */
  summary: string;
}

// ── HIGH severity patterns: almost certainly promotional ──

const DISCOUNT_PATTERNS = [
  /\b\d+%\s*off\b/i,
  /\bsave\s+\d+%/i,
  /\bdiscount\s+code\b/i,
  /\bcoupon\s+code\b/i,
  /\bpromo\s*code\b/i,
  /\bvoucher\s+code\b/i,
  /\buse\s+code\b/i,
  /\bredeem\s+(this\s+)?code\b/i,
  /\bflash\s+sale\b/i,
  /\blimited[\s-]time\s+offer\b/i,
  /\bspecial\s+offer\b/i,
  /\bexclusive\s+deal\b/i,
  /\bbuy\s+one\s+get\s+one\b/i,
  /\bBOGO\b/,
  /\bfree\s+shipping\b/i,
  /\bfree\s+delivery\b/i,
  /\bfree\s+gift\b/i,
  /\bfree\s+trial\b/i,
  /\b(was|from)\s+\$\d+.*now\s+\$\d+/i,
  /\$\d+[\s]*→[\s]*\$\d+/,
  /\bsale\s+price\b/i,
  /\bclearance\b/i,
];

const CROSS_SELL_PATTERNS = [
  /\byou\s+might\s+also\s+like\b/i,
  /\bcustomers\s+also\s+(bought|viewed|liked)\b/i,
  /\brecommended\s+for\s+you\b/i,
  /\bcheck\s+out\s+our\s+(new|latest|other)\b/i,
  /\btry\s+something\s+new\b/i,
  /\bexplore\s+(our|more)\b/i,
  /\bdiscover\s+(our|new|more)\b/i,
  /\bshop\s+now\b/i,
  /\bbrowse\s+(our|more|collection)\b/i,
  /\bnew\s+arrivals?\b/i,
  /\bbest[\s-]?sellers?\b/i,
  /\btrending\s+now\b/i,
];

const UPSELL_PATTERNS = [
  /\bupgrade\s+(to|your|now)\b/i,
  /\bpremium\s+plan\b/i,
  /\bunlock\s+(more|premium|pro|all)\b/i,
  /\bgo\s+premium\b/i,
  /\bgo\s+pro\b/i,
  /\bget\s+more\s+with\b/i,
  /\benhanced?\s+plan\b/i,
  /\bswitch\s+to\s+(premium|pro|plus)\b/i,
  /\bfor\s+just\s+\$\d+\s+more\b/i,
  /\badd\s+on\b.*\bonly\s+\$\d+/i,
];

const LOYALTY_PATTERNS = [
  /\bearn\s+\d+\s*(points?|rewards?|coins?|stars?)\b/i,
  /\byou('ve|r)\s+(earned|accumulated)\s+\d+\s*points?\b/i,
  /\bloyalty\s+(program|reward|bonus|points?)\b/i,
  /\brewards?\s+(program|points?|balance)\b/i,
  /\bjoin\s+(our\s+)?loyalty\b/i,
  /\bmember(ship)?\s+reward\b/i,
  /\breferr?(al)?\s+(bonus|reward|code)\b/i,
  /\brefer\s+a\s+friend\b/i,
];

const FOMO_PATTERNS = [
  /\bhurry\b/i,
  /\bdon'?t\s+miss\s+(out|this)\b/i,
  /\blast\s+chance\b/i,
  /\bonly\s+\d+\s+left\b/i,
  /\bending\s+soon\b/i,
  /\bact\s+now\b/i,
  /\bwhile\s+(stocks?|supplies?)\s+last\b/i,
  /\blimited\s+stock\b/i,
  /\bselling\s+fast\b/i,
];

// ── MEDIUM severity patterns: contextual, may be false positives ──

const PROMOTIONAL_BUTTON_PATTERNS = [
  /\bshop\s+now\b/i,
  /\bbuy\s+now\b/i,
  /\bget\s+deal\b/i,
  /\bclaim\s+(offer|deal|discount|coupon|reward)\b/i,
  /\bredeem\s+(now|offer|deal)\b/i,
  /\bview\s+offers?\b/i,
  /\bsee\s+deals?\b/i,
  /\bview\s+collection\b/i,
  /\bbrowse\s+catalog\b/i,
  /\bget\s+started\s+free\b/i,
  /\bstart\s+free\s+trial\b/i,
  /\bupgrade\s+now\b/i,
  /\bupgrade\s+plan\b/i,
  /\bgo\s+premium\b/i,
];

// ── Allowlist: patterns that look promotional but are legitimate in utility context ──

const UTILITY_ALLOWLIST = [
  /\boffer\s+to\s+(reschedule|help|assist|cancel|modify|change)\b/i,
  /\boffer\s+(pickup|delivery|support|assistance)\b/i,
  /\bfree\s+(repair|replacement|return|refund|exchange|consultation)\b/i,
  /\bfree\s+of\s+charge\b/i,
  /\bpremium\s+(payment|amount|due|installment|balance)\b/i,
  /\bdeal(ership)\b/i,
  /\bhighlight\s+(key|important|your|the)\b/i,
  /\bcollection\s+(appointment|point|time|date|window|location)\b/i,
  /\brecommend(ed)?\s+(doctor|specialist|technician|provider|slot|time)\b/i,
  /\bcheck\s+out\b.*\b(hotel|room|bill|invoice|folio)\b/i,
  /\bbonus\s+data\b/i,
  /\bcredit\s+(to\s+your\s+account|applied|balance)\b/i,
];

// ── Core Validation Logic ──────────────────────────────────────────

function extractTextFields(message: any): Array<{ field: string; text: string }> {
  const fields: Array<{ field: string; text: string }> = [];
  if (!message) return fields;

  const content = message.content || message;

  // Direct text fields
  if (content.text && typeof content.text === "string") {
    fields.push({ field: "content.text", text: content.text });
  }
  if (content.bodyText && typeof content.bodyText === "string") {
    fields.push({ field: "content.bodyText", text: content.bodyText });
  }
  if (content.headerText && typeof content.headerText === "string") {
    fields.push({ field: "content.headerText", text: content.headerText });
  }
  if (content.footerText && typeof content.footerText === "string") {
    fields.push({ field: "content.footerText", text: content.footerText });
  }
  if (content.caption && typeof content.caption === "string") {
    fields.push({ field: "content.caption", text: content.caption });
  }

  // Buttons
  if (content.buttons && Array.isArray(content.buttons)) {
    content.buttons.forEach((btn: any, i: number) => {
      if (btn.title && typeof btn.title === "string") {
        fields.push({ field: `content.buttons[${i}].title`, text: btn.title });
      }
    });
  }

  // List sections
  if (content.listSections && Array.isArray(content.listSections)) {
    content.listSections.forEach((section: any, si: number) => {
      if (section.title) {
        fields.push({ field: `content.listSections[${si}].title`, text: section.title });
      }
      if (section.rows && Array.isArray(section.rows)) {
        section.rows.forEach((row: any, ri: number) => {
          if (row.title) {
            fields.push({ field: `content.listSections[${si}].rows[${ri}].title`, text: row.title });
          }
          if (row.description) {
            fields.push({ field: `content.listSections[${si}].rows[${ri}].description`, text: row.description });
          }
        });
      }
    });
  }

  // Carousel cards
  if (content.carouselCards && Array.isArray(content.carouselCards)) {
    content.carouselCards.forEach((card: any, ci: number) => {
      if (card.title) {
        fields.push({ field: `content.carouselCards[${ci}].title`, text: card.title });
      }
      if (card.description) {
        fields.push({ field: `content.carouselCards[${ci}].description`, text: card.description });
      }
      if (card.buttonText) {
        fields.push({ field: `content.carouselCards[${ci}].buttonText`, text: card.buttonText });
      }
    });
  }

  return fields;
}

function isAllowlisted(text: string): boolean {
  return UTILITY_ALLOWLIST.some((pattern) => pattern.test(text));
}

function checkPatterns(
  text: string,
  field: string,
  patterns: RegExp[],
  rule: string,
  severity: "high" | "medium",
  suggestion: string
): ComplianceViolation[] {
  if (isAllowlisted(text)) return [];

  const violations: ComplianceViolation[] = [];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Double-check: is this match itself allowlisted in context?
      const contextStart = Math.max(0, (match.index || 0) - 30);
      const contextEnd = Math.min(text.length, (match.index || 0) + match[0].length + 30);
      const context = text.substring(contextStart, contextEnd);
      if (isAllowlisted(context)) continue;

      violations.push({
        field,
        matchedText: match[0],
        rule,
        severity,
        suggestion,
      });
      break; // One violation per pattern category per field is enough
    }
  }
  return violations;
}

/**
 * Validate a single message for utility compliance.
 * Only checks outbound (business) messages — inbound customer messages are not subject to compliance.
 */
export function validateMessageCompliance(message: any): ComplianceViolation[] {
  // Only validate outbound messages
  if (message.direction === "inbound") return [];

  const violations: ComplianceViolation[] = [];
  const fields = extractTextFields(message);

  for (const { field, text } of fields) {
    // HIGH severity checks
    violations.push(
      ...checkPatterns(text, field, DISCOUNT_PATTERNS, "Discount/coupon language is not allowed in utility messages", "high", "Remove discount references. Utility messages should only contain transactional information.")
    );
    violations.push(
      ...checkPatterns(text, field, CROSS_SELL_PATTERNS, "Cross-selling is not allowed in utility messages", "high", "Remove product recommendations. Utility messages should focus on the transaction at hand.")
    );
    violations.push(
      ...checkPatterns(text, field, UPSELL_PATTERNS, "Upselling/upgrade language is not allowed in utility messages", "high", "Remove upgrade prompts. Use neutral language like 'Manage Plan' instead of 'Upgrade Now'.")
    );
    violations.push(
      ...checkPatterns(text, field, LOYALTY_PATTERNS, "Loyalty/rewards language is not allowed in utility messages", "high", "Remove loyalty program references. Utility messages should not incentivize future purchases.")
    );
    violations.push(
      ...checkPatterns(text, field, FOMO_PATTERNS, "Urgency/FOMO language is not allowed in utility messages", "high", "Remove urgency language. Utility messages should be informational, not pressuring.")
    );

    // MEDIUM severity: button-level checks (only for button fields)
    if (field.includes("button") || field.includes("buttonText")) {
      violations.push(
        ...checkPatterns(text, field, PROMOTIONAL_BUTTON_PATTERNS, "Promotional CTA button is not appropriate for utility messages", "medium", "Replace with transactional CTAs like 'View Details', 'Track Order', 'Contact Support'.")
      );
    }
  }

  // Check for carousel presence — carousels in utility messages are suspicious
  const content = message.content || message;
  if (content.type === "carousel" || (content.carouselCards && content.carouselCards.length > 0)) {
    // Carousels with prices are almost certainly promotional
    const hasPrice = content.carouselCards?.some((card: any) => card.price);
    if (hasPrice) {
      violations.push({
        field: "content.carouselCards",
        matchedText: "carousel with prices",
        rule: "Product catalog carousels with prices are not allowed in utility messages",
        severity: "high",
        suggestion: "Remove the product carousel. Utility messages should not showcase products for sale.",
      });
    }
  }

  return violations;
}

/**
 * Validate an entire conversation flow for utility compliance.
 * Only applicable when messageType is "utility".
 */
export function validateUtilityCompliance(
  messages: any[],
  messageType?: string
): ComplianceResult {
  // Only validate utility messages
  if (messageType && messageType !== "utility") {
    return {
      isCompliant: true,
      violationCount: 0,
      violations: [],
      summary: `Compliance check skipped — ${messageType} messages are not subject to utility restrictions`,
    };
  }

  if (!messages || messages.length === 0) {
    return {
      isCompliant: true,
      violationCount: 0,
      violations: [],
      summary: "No messages to validate",
    };
  }

  const allViolations: ComplianceViolation[] = [];

  for (const msg of messages) {
    allViolations.push(...validateMessageCompliance(msg));
  }

  const highCount = allViolations.filter((v) => v.severity === "high").length;
  const mediumCount = allViolations.filter((v) => v.severity === "medium").length;

  let summary: string;
  if (allViolations.length === 0) {
    summary = "Compliant — no promotional content detected";
  } else if (highCount > 0) {
    summary = `${highCount} promotional violation${highCount > 1 ? "s" : ""} detected${mediumCount > 0 ? ` + ${mediumCount} to review` : ""}`;
  } else {
    summary = `${mediumCount} item${mediumCount > 1 ? "s" : ""} to review`;
  }

  return {
    isCompliant: allViolations.length === 0,
    violationCount: allViolations.length,
    violations: allViolations,
    summary,
  };
}

/**
 * Auto-sanitize utility messages by stripping or replacing promotional content.
 * Returns a new array of messages with violations fixed where possible.
 */
export function sanitizeUtilityMessages(messages: any[]): {
  messages: any[];
  fixCount: number;
  fixes: string[];
} {
  const fixes: string[] = [];
  let fixCount = 0;

  const sanitized = messages.map((msg) => {
    if (msg.direction === "inbound") return msg;

    const clone = JSON.parse(JSON.stringify(msg));
    const content = clone.content || clone;

    // Remove carousel with prices (replace with simple text)
    if (content.type === "carousel" && content.carouselCards?.some((c: any) => c.price)) {
      content.type = "text";
      content.text = content.text || "Here are your options:";
      delete content.carouselCards;
      fixes.push("Removed promotional product carousel");
      fixCount++;
    }

    // Replace promotional button labels
    if (content.buttons && Array.isArray(content.buttons)) {
      const BUTTON_REPLACEMENTS: Record<string, string> = {
        "shop now": "View Details",
        "buy now": "View Details",
        "get deal": "View Details",
        "claim offer": "View Details",
        "claim discount": "View Details",
        "claim coupon": "View Details",
        "claim reward": "View Details",
        "redeem now": "View Details",
        "redeem offer": "View Details",
        "view offers": "View Options",
        "see deals": "View Options",
        "view collection": "View Options",
        "browse catalog": "View Options",
        "upgrade now": "Manage Plan",
        "upgrade plan": "Manage Plan",
        "go premium": "Manage Plan",
        "start free trial": "Learn More",
        "get started free": "Learn More",
      };

      content.buttons.forEach((btn: any) => {
        const lower = (btn.title || "").toLowerCase().trim();
        if (BUTTON_REPLACEMENTS[lower]) {
          fixes.push(`Replaced button "${btn.title}" → "${BUTTON_REPLACEMENTS[lower]}"`);
          btn.title = BUTTON_REPLACEMENTS[lower];
          fixCount++;
        }
      });
    }

    return clone;
  });

  return { messages: sanitized, fixCount, fixes };
}
