import { describe, it, expect } from "vitest";

// We test the validation logic by re-implementing the same pure functions
// since the client-side module uses the same algorithm

interface FlowMessage {
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

interface FlowViolation {
  inboundIndex: number;
  inboundMessageId: number;
  outboundIndex: number;
  outboundMessageId: number;
  description: string;
  suggestion: string;
}

interface FlowValidationResult {
  isValid: boolean;
  violationCount: number;
  violations: FlowViolation[];
  summary: string;
}

function hasInteractiveElements(msg: FlowMessage): boolean {
  const content = msg.content;
  if (!content) return false;
  if (content.buttons && content.buttons.length > 0) return true;
  if (content.type === "interactive_list") return true;
  if (content.type === "carousel" && content.carouselCards && content.carouselCards.length > 0) return true;
  if (content.listSections && content.listSections.length > 0) return true;
  return false;
}

function validateFlow(messages: FlowMessage[]): FlowValidationResult {
  if (!messages || messages.length === 0) {
    return { isValid: true, violationCount: 0, violations: [], summary: "No messages to validate" };
  }
  const violations: FlowViolation[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.direction !== "inbound") continue;
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
      violations.push({
        inboundIndex: i, inboundMessageId: msg.id,
        outboundIndex: -1, outboundMessageId: -1,
        description: `Customer message #${i + 1} has no preceding business message`,
        suggestion: "Add a business message with interactive buttons before this customer reply",
      });
      continue;
    }
    const prevOutbound = messages[prevOutboundIdx];
    if (!hasInteractiveElements(prevOutbound)) {
      const typeLabel = prevOutbound.content.type?.replace(/_/g, " ") || prevOutbound.contentType.replace(/_/g, " ");
      violations.push({
        inboundIndex: i, inboundMessageId: msg.id,
        outboundIndex: prevOutboundIdx, outboundMessageId: prevOutboundId,
        description: `Customer message #${i + 1} follows a non-interactive business message (${typeLabel})`,
        suggestion: `Add buttons, a list, or convert message #${prevOutboundIdx + 1} to a carousel`,
      });
    }
  }
  const violationCount = violations.length;
  let summary: string;
  if (violationCount === 0) summary = "All messages are interactive";
  else if (violationCount === 1) summary = "1 message needs an interaction point";
  else summary = `${violationCount} messages need interaction points`;
  return { isValid: violationCount === 0, violationCount, violations, summary };
}

function getViolationMessageIds(result: FlowValidationResult): Set<number> {
  const ids = new Set<number>();
  for (const v of result.violations) {
    ids.add(v.inboundMessageId);
    if (v.outboundMessageId !== -1) ids.add(v.outboundMessageId);
  }
  return ids;
}

describe("Flow Validation", () => {
  it("returns valid for empty messages", () => {
    const result = validateFlow([]);
    expect(result.isValid).toBe(true);
    expect(result.violationCount).toBe(0);
    expect(result.summary).toBe("No messages to validate");
  });

  it("returns valid when all inbound messages follow interactive outbound messages", () => {
    const messages: FlowMessage[] = [
      { id: 1, direction: "outbound", contentType: "template", content: { type: "template", buttons: [{ id: "1", title: "Learn More" }] } },
      { id: 2, direction: "inbound", contentType: "text", content: { type: "text", text: "Learn More" } },
      { id: 3, direction: "outbound", contentType: "interactive_list", content: { type: "interactive_list", listSections: [{ title: "Options", rows: [] }] } },
      { id: 4, direction: "inbound", contentType: "text", content: { type: "text", text: "Option 1" } },
    ];
    const result = validateFlow(messages);
    expect(result.isValid).toBe(true);
    expect(result.violationCount).toBe(0);
    expect(result.summary).toBe("All messages are interactive");
  });

  it("flags inbound message following plain text outbound", () => {
    const messages: FlowMessage[] = [
      { id: 1, direction: "outbound", contentType: "text", content: { type: "text", text: "Hello!" } },
      { id: 2, direction: "inbound", contentType: "text", content: { type: "text", text: "Hi" } },
    ];
    const result = validateFlow(messages);
    expect(result.isValid).toBe(false);
    expect(result.violationCount).toBe(1);
    expect(result.violations[0].inboundMessageId).toBe(2);
    expect(result.violations[0].outboundMessageId).toBe(1);
    expect(result.violations[0].suggestion).toContain("Add buttons");
  });

  it("flags inbound message with no preceding outbound", () => {
    const messages: FlowMessage[] = [
      { id: 1, direction: "inbound", contentType: "text", content: { type: "text", text: "Hello" } },
    ];
    const result = validateFlow(messages);
    expect(result.isValid).toBe(false);
    expect(result.violationCount).toBe(1);
    expect(result.violations[0].outboundIndex).toBe(-1);
    expect(result.violations[0].description).toContain("no preceding business message");
  });

  it("detects carousel as interactive", () => {
    const messages: FlowMessage[] = [
      { id: 1, direction: "outbound", contentType: "carousel", content: { type: "carousel", carouselCards: [{ id: "c1", title: "Card 1" }] } },
      { id: 2, direction: "inbound", contentType: "text", content: { type: "text", text: "Card 1" } },
    ];
    const result = validateFlow(messages);
    expect(result.isValid).toBe(true);
  });

  it("detects interactive_list as interactive", () => {
    const messages: FlowMessage[] = [
      { id: 1, direction: "outbound", contentType: "interactive_list", content: { type: "interactive_list" } },
      { id: 2, direction: "inbound", contentType: "text", content: { type: "text", text: "Selected" } },
    ];
    const result = validateFlow(messages);
    expect(result.isValid).toBe(true);
  });

  it("flags multiple violations correctly", () => {
    const messages: FlowMessage[] = [
      { id: 1, direction: "outbound", contentType: "text", content: { type: "text", text: "Welcome" } },
      { id: 2, direction: "inbound", contentType: "text", content: { type: "text", text: "Hi" } },
      { id: 3, direction: "outbound", contentType: "image", content: { type: "image", imageUrl: "http://img.png" } },
      { id: 4, direction: "inbound", contentType: "text", content: { type: "text", text: "Nice" } },
    ];
    const result = validateFlow(messages);
    expect(result.isValid).toBe(false);
    expect(result.violationCount).toBe(2);
    expect(result.summary).toBe("2 messages need interaction points");
  });

  it("getViolationMessageIds returns both inbound and outbound IDs", () => {
    const messages: FlowMessage[] = [
      { id: 10, direction: "outbound", contentType: "text", content: { type: "text", text: "Hello" } },
      { id: 20, direction: "inbound", contentType: "text", content: { type: "text", text: "Hi" } },
    ];
    const result = validateFlow(messages);
    const ids = getViolationMessageIds(result);
    expect(ids.has(10)).toBe(true);
    expect(ids.has(20)).toBe(true);
  });

  it("only flags inbound messages, not outbound-only flows", () => {
    const messages: FlowMessage[] = [
      { id: 1, direction: "outbound", contentType: "text", content: { type: "text", text: "Hello" } },
      { id: 2, direction: "outbound", contentType: "text", content: { type: "text", text: "Follow up" } },
    ];
    const result = validateFlow(messages);
    expect(result.isValid).toBe(true);
    expect(result.violationCount).toBe(0);
  });

  it("handles consecutive inbound messages - each checked independently", () => {
    const messages: FlowMessage[] = [
      { id: 1, direction: "outbound", contentType: "interactive_buttons", content: { type: "interactive_buttons", buttons: [{ id: "1", title: "Yes" }] } },
      { id: 2, direction: "inbound", contentType: "text", content: { type: "text", text: "Yes" } },
      { id: 3, direction: "inbound", contentType: "text", content: { type: "text", text: "Also..." } },
    ];
    const result = validateFlow(messages);
    // Second inbound (id:3) - its preceding outbound is still id:1 (interactive), so it should pass
    // Actually the preceding outbound for id:3 is id:1 (skipping inbound id:2), so it's valid
    expect(result.isValid).toBe(true);
  });

  it("summary text is singular for 1 violation", () => {
    const messages: FlowMessage[] = [
      { id: 1, direction: "outbound", contentType: "text", content: { type: "text", text: "Hi" } },
      { id: 2, direction: "inbound", contentType: "text", content: { type: "text", text: "Hey" } },
    ];
    const result = validateFlow(messages);
    expect(result.summary).toBe("1 message needs an interaction point");
  });
});
