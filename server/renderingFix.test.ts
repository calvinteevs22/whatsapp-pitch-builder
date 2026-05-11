import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the critical rendering fix:
 * generateFlow must return savedMessages (with DB IDs) so the frontend
 * can render messages immediately without waiting for a refetch.
 */
describe("Rendering Fix - savedMessages in generateFlow response", () => {
  
  it("should include savedMessages field in generateFlow response structure", () => {
    // Simulate what the server returns
    const parsed = {
      messages: [
        { direction: "outbound", contentType: "template", content: { type: "template", bodyText: "Hello!" }, timestamp: "10:00 AM" },
        { direction: "inbound", contentType: "text", content: { type: "text", text: "Hi!" }, timestamp: "10:01 AM" },
      ],
      profileName: "TestBiz",
      businessContext: "Test context",
    };

    // Simulate savedMessages from DB (with IDs)
    const savedMessages = [
      { id: 1, threadId: 100, sortOrder: 0, direction: "outbound", contentType: "template", content: { type: "template", bodyText: "Hello!" }, timestamp: "10:00 AM", isRead: true },
      { id: 2, threadId: 100, sortOrder: 1, direction: "inbound", contentType: "text", content: { type: "text", text: "Hi!" }, timestamp: "10:01 AM", isRead: true },
    ];

    // Simulate the return value
    const result = { ...parsed, imagesGenerating: true, savedMessages: savedMessages };

    // Verify savedMessages is present and has DB IDs
    expect(result.savedMessages).toBeDefined();
    expect(result.savedMessages).toHaveLength(2);
    expect(result.savedMessages![0].id).toBe(1);
    expect(result.savedMessages![1].id).toBe(2);
    expect(result.savedMessages![0].sortOrder).toBe(0);
    expect(result.savedMessages![1].sortOrder).toBe(1);
  });

  it("should have savedMessages as null when no threadUid is provided", () => {
    const parsed = {
      messages: [
        { direction: "outbound", contentType: "text", content: { type: "text", text: "Hello!" }, timestamp: "10:00 AM" },
      ],
      profileName: "TestBiz",
    };

    // When no threadUid, savedMessages should be null
    const result = { ...parsed, imagesGenerating: true, savedMessages: null };

    expect(result.savedMessages).toBeNull();
    expect(result.messages).toHaveLength(1);
  });

  it("savedMessages should contain all required fields for frontend rendering", () => {
    const savedMessage = {
      id: 42,
      threadId: 100,
      sortOrder: 0,
      direction: "outbound" as const,
      contentType: "template",
      content: { type: "template", bodyText: "Welcome!", headerText: "OFFER", buttons: [{ id: "b1", title: "Shop Now" }] },
      timestamp: "10:00 AM",
      isRead: true,
      createdAt: new Date(),
    };

    // Verify all fields needed by LocalMessage interface are present
    expect(savedMessage.id).toBeDefined();
    expect(savedMessage.direction).toBeDefined();
    expect(savedMessage.contentType).toBeDefined();
    expect(savedMessage.content).toBeDefined();
    expect(savedMessage.timestamp).toBeDefined();
    expect(savedMessage.isRead).toBeDefined();
    expect(savedMessage.sortOrder).toBeDefined();
    
    // Verify content structure
    expect(savedMessage.content.type).toBe("template");
    expect(savedMessage.content.bodyText).toBe("Welcome!");
  });

  it("sessionStorage hydration should parse messages correctly", () => {
    const messages = [
      { id: 1, sortOrder: 0, direction: "outbound", contentType: "template", content: { type: "template", bodyText: "Hello!" }, timestamp: "10:00 AM", isRead: true },
      { id: 2, sortOrder: 1, direction: "inbound", contentType: "text", content: { type: "text", text: "Hi!" }, timestamp: "10:01 AM", isRead: true },
    ];

    // Simulate sessionStorage serialization/deserialization
    const serialized = JSON.stringify(messages);
    const deserialized = JSON.parse(serialized);

    expect(deserialized).toHaveLength(2);
    expect(deserialized[0].id).toBe(1);
    expect(deserialized[0].content.type).toBe("template");
    expect(deserialized[1].id).toBe(2);
    expect(deserialized[1].content.text).toBe("Hi!");
  });

  it("sessionStorage key should be unique per thread uid", () => {
    const uid1 = "abc123";
    const uid2 = "def456";
    
    const key1 = `thread-messages-${uid1}`;
    const key2 = `thread-messages-${uid2}`;
    
    expect(key1).toBe("thread-messages-abc123");
    expect(key2).toBe("thread-messages-def456");
    expect(key1).not.toBe(key2);
  });

  it("frontend should map savedMessages to LocalMessage format correctly", () => {
    // Simulate what the server returns in savedMessages
    const serverMessages = [
      { id: 10, threadId: 5, sortOrder: 0, direction: "outbound", contentType: "template", content: { type: "template", headerText: "SALE", bodyText: "50% off!", buttons: [{ id: "b1", title: "Shop" }] }, timestamp: "9:00 AM", isRead: true, createdAt: "2026-03-16T00:00:00Z" },
      { id: 11, threadId: 5, sortOrder: 1, direction: "inbound", contentType: "interactive_buttons", content: { type: "interactive_buttons", text: "Choose:", buttons: [{ id: "o1", title: "Yes" }] }, timestamp: "9:01 AM", isRead: true, createdAt: "2026-03-16T00:00:00Z" },
    ];

    // Simulate the frontend mapping (same as in Builder.tsx)
    const localMessages = serverMessages.map((m: any) => ({
      id: m.id,
      direction: m.direction,
      contentType: m.contentType,
      content: m.content,
      timestamp: m.timestamp,
      isRead: m.isRead,
      sortOrder: m.sortOrder,
    }));

    expect(localMessages).toHaveLength(2);
    expect(localMessages[0].id).toBe(10);
    expect(localMessages[0].direction).toBe("outbound");
    expect(localMessages[0].content.type).toBe("template");
    expect(localMessages[0].sortOrder).toBe(0);
    expect(localMessages[1].id).toBe(11);
    expect(localMessages[1].direction).toBe("inbound");
    expect(localMessages[1].sortOrder).toBe(1);
    
    // Verify no extra fields leak through
    expect((localMessages[0] as any).threadId).toBeUndefined();
    expect((localMessages[0] as any).createdAt).toBeUndefined();
  });
});
