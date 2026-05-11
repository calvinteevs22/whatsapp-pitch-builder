/**
 * Flow Validation Utility
 * 
 * Scans conversation messages in real-time and flags interactivity violations.
 * A violation occurs when a customer (inbound) message is not preceded by an
 * interactive business (outbound) message (one with buttons, list, or carousel).
 */

export interface FlowMessage {
  id: number;
  direction: "inbound" | "outbound";
  contentType: string;
  content: {
    type?: string;
    buttons?: Array<{ id: string; title: string }>;
    carouselCards?: Array<any>;
    listSections?: Array<any>;
    [key: string]: any;
  };
}

export interface FlowViolation {
  /** Index of the inbound message that lacks a preceding interactive message */
  inboundIndex: number;
  /** ID of the inbound message */
  inboundMessageId: number;
  /** Index of the preceding outbound message (-1 if none) */
  outboundIndex: number;
  /** ID of the preceding outbound message (-1 if none) */
  outboundMessageId: number;
  /** Human-readable description of the issue */
  description: string;
  /** Suggested fix */
  suggestion: string;
}

export interface FlowValidationResult {
  /** Whether the flow passes all interactivity checks */
  isValid: boolean;
  /** Total number of violations found */
  violationCount: number;
  /** Detailed list of violations */
  violations: FlowViolation[];
  /** Summary text for display */
  summary: string;
}

/**
 * Check if an outbound message has interactive elements
 */
function hasInteractiveElements(msg: FlowMessage): boolean {
  const content = msg.content;
  if (!content) return false;

  // Check for buttons
  if (content.buttons && content.buttons.length > 0) return true;

  // Check for interactive list
  if (content.type === "interactive_list") return true;

  // Check for carousel with cards
  if (content.type === "carousel" && content.carouselCards && content.carouselCards.length > 0) return true;

  // Check for list sections (another way lists can be structured)
  if (content.listSections && content.listSections.length > 0) return true;

  return false;
}

/**
 * Validate the conversation flow for interactivity rules.
 * 
 * Rule: Every customer (inbound) message must be immediately preceded
 * by an interactive business (outbound) message with buttons, list, or carousel.
 */
export function validateFlow(messages: FlowMessage[]): FlowValidationResult {
  if (!messages || messages.length === 0) {
    return {
      isValid: true,
      violationCount: 0,
      violations: [],
      summary: "No messages to validate",
    };
  }

  const violations: FlowViolation[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.direction !== "inbound") continue;

    // Find the preceding outbound message
    let prevOutboundIdx = -1;
    let prevOutboundId = -1;
    for (let j = i - 1; j >= 0; j--) {
      if (messages[j].direction === "outbound") {
        prevOutboundIdx = j;
        prevOutboundId = messages[j].id;
        break;
      }
    }

    if (prevOutboundIdx === -1) {
      // No preceding outbound message at all
      violations.push({
        inboundIndex: i,
        inboundMessageId: msg.id,
        outboundIndex: -1,
        outboundMessageId: -1,
        description: `Customer message #${i + 1} has no preceding business message`,
        suggestion: "Add a business message with interactive buttons before this customer reply",
      });
      continue;
    }

    const prevOutbound = messages[prevOutboundIdx];
    if (!hasInteractiveElements(prevOutbound)) {
      const typeLabel = prevOutbound.content.type?.replace(/_/g, " ") || prevOutbound.contentType.replace(/_/g, " ");
      violations.push({
        inboundIndex: i,
        inboundMessageId: msg.id,
        outboundIndex: prevOutboundIdx,
        outboundMessageId: prevOutboundId,
        description: `Customer message #${i + 1} follows a non-interactive business message (${typeLabel})`,
        suggestion: `Add buttons, a list, or convert message #${prevOutboundIdx + 1} to a carousel`,
      });
    }
  }

  const violationCount = violations.length;
  let summary: string;

  if (violationCount === 0) {
    summary = "All messages are interactive";
  } else if (violationCount === 1) {
    summary = "1 message needs an interaction point";
  } else {
    summary = `${violationCount} messages need interaction points`;
  }

  return {
    isValid: violationCount === 0,
    violationCount,
    violations,
    summary,
  };
}

/**
 * Get the set of message IDs that have violations (both the inbound and its preceding outbound)
 */
export function getViolationMessageIds(result: FlowValidationResult): Set<number> {
  const ids = new Set<number>();
  for (const v of result.violations) {
    ids.add(v.inboundMessageId);
    if (v.outboundMessageId !== -1) {
      ids.add(v.outboundMessageId);
    }
  }
  return ids;
}
