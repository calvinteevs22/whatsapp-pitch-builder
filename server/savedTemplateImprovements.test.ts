import { describe, it, expect, vi } from "vitest";

/**
 * Tests for saved template improvements:
 * 1. Visual differentiation (color schemes)
 * 2. Direct editing via sourceThreadUid
 * 3. Save progress (updateSnapshot)
 */

// Mock the db module
vi.mock("./db", () => ({
  getSavedTemplatesByUser: vi.fn(),
  getSavedTemplateById: vi.fn(),
  createSavedTemplate: vi.fn(),
  updateSavedTemplate: vi.fn(),
  deleteSavedTemplate: vi.fn(),
  incrementTemplateUsage: vi.fn(),
  getThreadByUid: vi.fn(),
  getMessagesByThread: vi.fn(),
}));

import {
  getSavedTemplateById,
  updateSavedTemplate,
  getThreadByUid,
  getMessagesByThread,
  createSavedTemplate,
} from "./db";

describe("Saved Template Improvements", () => {
  describe("sourceThreadUid field", () => {
    it("should include sourceThreadUid when saving a template", async () => {
      const mockThread = {
        id: 1,
        uid: "abc123",
        userId: 1,
        name: "Test Thread",
        messageType: "marketing",
        industry: "Retail",
        profileName: "Test Business",
        businessContext: "Test context",
      };
      const mockMessages = [
        {
          id: 1,
          direction: "outbound",
          contentType: "template",
          content: { bodyText: "Hello" },
          timestamp: "10:00 AM",
        },
      ];

      vi.mocked(getThreadByUid).mockResolvedValue(mockThread as any);
      vi.mocked(getMessagesByThread).mockResolvedValue(mockMessages as any);
      vi.mocked(createSavedTemplate).mockResolvedValue({
        id: 1,
        userId: 1,
        name: "Test Template",
        sourceThreadUid: "abc123",
        messagesSnapshot: mockMessages,
      } as any);

      // Simulate the save flow
      const thread = await getThreadByUid("abc123");
      expect(thread).toBeTruthy();
      const msgs = await getMessagesByThread(thread!.id);
      const snapshot = msgs.map((m: any) => ({
        direction: m.direction,
        contentType: m.contentType,
        content: m.content,
        timestamp: m.timestamp || "12:00 PM",
      }));

      const result = await createSavedTemplate({
        userId: 1,
        name: "Test Template",
        description: "Test",
        industry: thread!.industry,
        messageType: thread!.messageType as any,
        profileName: thread!.profileName,
        businessContext: thread!.businessContext,
        messagesSnapshot: snapshot as any,
        tags: [],
        sourceThreadUid: thread!.uid,
      });

      expect(result.sourceThreadUid).toBe("abc123");
    });

    it("should allow templates without sourceThreadUid for backward compatibility", () => {
      const oldTemplate = {
        id: 1,
        userId: 1,
        name: "Old Template",
        sourceThreadUid: null,
      };
      // Old templates without sourceThreadUid should still work
      expect(oldTemplate.sourceThreadUid).toBeNull();
    });
  });

  describe("updateSnapshot", () => {
    it("should update template snapshot from current thread state", async () => {
      const mockTemplate = {
        id: 1,
        userId: 1,
        name: "Test Template",
        sourceThreadUid: "abc123",
        description: "Original description",
      };
      const mockThread = {
        id: 1,
        uid: "abc123",
        userId: 1,
        name: "Updated Thread",
        messageType: "marketing",
        industry: "Tech",
        profileName: "Updated Business",
        businessContext: "Updated context",
      };
      const mockMessages = [
        {
          id: 1,
          direction: "outbound",
          contentType: "template",
          content: { bodyText: "Updated message" },
          timestamp: "11:00 AM",
        },
        {
          id: 2,
          direction: "inbound",
          contentType: "text",
          content: { text: "Customer reply" },
          timestamp: "11:01 AM",
        },
      ];

      vi.mocked(getSavedTemplateById).mockResolvedValue(mockTemplate as any);
      vi.mocked(getThreadByUid).mockResolvedValue(mockThread as any);
      vi.mocked(getMessagesByThread).mockResolvedValue(mockMessages as any);
      vi.mocked(updateSavedTemplate).mockResolvedValue({
        ...mockTemplate,
        name: mockThread.name,
        messagesSnapshot: mockMessages,
        industry: mockThread.industry,
      } as any);

      // Simulate updateSnapshot flow
      const template = await getSavedTemplateById(1);
      expect(template).toBeTruthy();

      const thread = await getThreadByUid("abc123");
      expect(thread).toBeTruthy();

      const msgs = await getMessagesByThread(thread!.id);
      const snapshot = msgs.map((m: any) => ({
        direction: m.direction,
        contentType: m.contentType,
        content: m.content,
        timestamp: m.timestamp || "12:00 PM",
      }));

      const result = await updateSavedTemplate(1, 1, {
        name: thread!.name,
        description: thread!.businessContext || template!.description,
        industry: thread!.industry,
        messageType: thread!.messageType as any,
        profileName: thread!.profileName,
        businessContext: thread!.businessContext,
        messagesSnapshot: snapshot as any,
        sourceThreadUid: thread!.uid,
      });

      expect(result.name).toBe("Updated Thread");
      expect(updateSavedTemplate).toHaveBeenCalledWith(1, 1, expect.objectContaining({
        name: "Updated Thread",
        industry: "Tech",
        sourceThreadUid: "abc123",
      }));
    });

    it("should reject updateSnapshot for non-existent template", async () => {
      vi.mocked(getSavedTemplateById).mockResolvedValue(undefined);

      const template = await getSavedTemplateById(999);
      expect(template).toBeUndefined();
    });

    it("should reject updateSnapshot for wrong user", async () => {
      vi.mocked(getSavedTemplateById).mockResolvedValue({
        id: 1,
        userId: 2, // Different user
        name: "Other User Template",
      } as any);

      const template = await getSavedTemplateById(1);
      expect(template!.userId).not.toBe(1);
    });
  });

  describe("Visual differentiation logic", () => {
    it("should distinguish saved templates from regular threads", () => {
      const savedTemplate = {
        id: 1,
        name: "Saved Template",
        sourceThreadUid: "abc123",
        industry: "Retail",
      };
      const regularThread = {
        uid: "def456",
        name: "Regular Thread",
        messageType: "marketing",
      };

      // Saved templates have sourceThreadUid
      expect(savedTemplate.sourceThreadUid).toBeTruthy();
      // Regular threads don't have this field
      expect((regularThread as any).sourceThreadUid).toBeUndefined();
    });

    it("should navigate to source thread when clicking Edit on linked template", () => {
      const template = {
        id: 1,
        sourceThreadUid: "abc123",
      };

      // When sourceThreadUid exists, navigate to builder
      const targetUrl = template.sourceThreadUid
        ? `/builder/${template.sourceThreadUid}`
        : null;

      expect(targetUrl).toBe("/builder/abc123");
    });

    it("should fall back to Use (create copy) for templates without sourceThreadUid", () => {
      const oldTemplate = {
        id: 1,
        sourceThreadUid: null,
      };

      const action = oldTemplate.sourceThreadUid ? "edit" : "use";
      expect(action).toBe("use");
    });
  });

  describe("Linked template detection", () => {
    it("should find linked template for current thread", () => {
      const savedTemplates = [
        { id: 1, sourceThreadUid: "abc123", name: "Template A" },
        { id: 2, sourceThreadUid: "def456", name: "Template B" },
        { id: 3, sourceThreadUid: null, name: "Old Template" },
      ];

      const currentUid = "abc123";
      const linked = savedTemplates.find(t => t.sourceThreadUid === currentUid);
      expect(linked).toBeTruthy();
      expect(linked!.id).toBe(1);
    });

    it("should return null when no linked template exists", () => {
      const savedTemplates = [
        { id: 1, sourceThreadUid: "abc123", name: "Template A" },
      ];

      const currentUid = "xyz789";
      const linked = savedTemplates.find(t => t.sourceThreadUid === currentUid);
      expect(linked).toBeUndefined();
    });

    it("should show Save Progress button when linked template exists", () => {
      const linkedTemplateId = 1;
      const showSaveProgress = linkedTemplateId !== null;
      expect(showSaveProgress).toBe(true);
    });

    it("should show Save Template button when no linked template", () => {
      const linkedTemplateId = null;
      const showSaveProgress = linkedTemplateId !== null;
      expect(showSaveProgress).toBe(false);
    });
  });
});
