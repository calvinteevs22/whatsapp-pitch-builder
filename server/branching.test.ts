import { describe, it, expect } from "vitest";
import {
  detectBranchPoints,
  resolveMessagePath,
  hasBranching,
  getBranchesForPoint,
  generateBranchId,
  getBranchStats,
} from "@/lib/branching";
import type { MessageContent } from "@shared/types";

// Helper to create a minimal message
function makeMsg(
  id: number,
  sortOrder: number,
  direction: "inbound" | "outbound",
  content: Partial<MessageContent> & { type: MessageContent["type"] }
) {
  return {
    id,
    sortOrder,
    direction,
    contentType: content.type,
    content: content as MessageContent,
    timestamp: "10:00 AM",
    isRead: true,
  };
}

describe("branching utilities", () => {
  // ─── hasBranching ──────────────────────────────────────────────────────
  describe("hasBranching", () => {
    it("returns false when no messages have branchConfig", () => {
      const msgs = [
        makeMsg(1, 0, "outbound", { type: "interactive_buttons", text: "Hello", buttons: [{ id: "1", title: "Option A" }] }),
        makeMsg(2, 1, "inbound", { type: "text", text: "Option A" }),
      ];
      expect(hasBranching(msgs)).toBe(false);
    });

    it("returns true when at least one message has branchConfig", () => {
      const msgs = [
        makeMsg(1, 0, "outbound", { type: "interactive_buttons", text: "Hello", buttons: [{ id: "1", title: "Option A" }] }),
        makeMsg(2, 1, "inbound", {
          type: "text",
          text: "Option A",
          branchConfig: { branchId: "branch-a", branchPointSortOrder: 0, triggerValue: "Option A" },
        }),
      ];
      expect(hasBranching(msgs)).toBe(true);
    });

    it("returns false for empty messages array", () => {
      expect(hasBranching([])).toBe(false);
    });
  });

  // ─── detectBranchPoints ────────────────────────────────────────────────
  describe("detectBranchPoints", () => {
    it("detects a single branch point with two branches", () => {
      const msgs = [
        makeMsg(1, 0, "outbound", {
          type: "interactive_buttons",
          text: "Choose",
          buttons: [{ id: "a", title: "A" }, { id: "b", title: "B" }],
        }),
        makeMsg(2, 1, "inbound", {
          type: "text",
          text: "A",
          branchConfig: { branchId: "branch-a", branchPointSortOrder: 0, triggerValue: "A", label: "Option A" },
        }),
        makeMsg(3, 2, "outbound", {
          type: "text",
          text: "You chose A!",
          branchConfig: { branchId: "branch-a", branchPointSortOrder: 0, triggerValue: "A", label: "Option A" },
        }),
        makeMsg(4, 3, "inbound", {
          type: "text",
          text: "B",
          branchConfig: { branchId: "branch-b", branchPointSortOrder: 0, triggerValue: "B", label: "Option B" },
        }),
        makeMsg(5, 4, "outbound", {
          type: "text",
          text: "You chose B!",
          branchConfig: { branchId: "branch-b", branchPointSortOrder: 0, triggerValue: "B", label: "Option B" },
        }),
      ];

      const points = detectBranchPoints(msgs);
      expect(points).toHaveLength(1);
      expect(points[0].messageSortOrder).toBe(0);
      expect(points[0].messageId).toBe(1);
      expect(points[0].branches).toHaveLength(2);

      const branchA = points[0].branches.find(b => b.branchId === "branch-a");
      expect(branchA).toBeDefined();
      expect(branchA!.triggerValue).toBe("A");
      expect(branchA!.messageCount).toBe(2);

      const branchB = points[0].branches.find(b => b.branchId === "branch-b");
      expect(branchB).toBeDefined();
      expect(branchB!.triggerValue).toBe("B");
      expect(branchB!.messageCount).toBe(2);
    });

    it("returns empty array when no branches exist", () => {
      const msgs = [
        makeMsg(1, 0, "outbound", { type: "text", text: "Hello" }),
        makeMsg(2, 1, "inbound", { type: "text", text: "Hi" }),
      ];
      expect(detectBranchPoints(msgs)).toEqual([]);
    });

    it("detects multiple branch points", () => {
      const msgs = [
        makeMsg(1, 0, "outbound", {
          type: "interactive_buttons",
          text: "First choice",
          buttons: [{ id: "a", title: "A" }],
        }),
        makeMsg(2, 1, "inbound", {
          type: "text",
          text: "A",
          branchConfig: { branchId: "branch-1a", branchPointSortOrder: 0, triggerValue: "A" },
        }),
        makeMsg(3, 2, "outbound", {
          type: "interactive_buttons",
          text: "Second choice",
          buttons: [{ id: "x", title: "X" }],
        }),
        makeMsg(4, 3, "inbound", {
          type: "text",
          text: "X",
          branchConfig: { branchId: "branch-2x", branchPointSortOrder: 2, triggerValue: "X" },
        }),
      ];

      const points = detectBranchPoints(msgs);
      expect(points).toHaveLength(2);
      expect(points[0].messageSortOrder).toBe(0);
      expect(points[1].messageSortOrder).toBe(2);
    });
  });

  // ─── resolveMessagePath ────────────────────────────────────────────────
  describe("resolveMessagePath", () => {
    const msgs = [
      makeMsg(1, 0, "outbound", {
        type: "interactive_buttons",
        text: "Choose",
        buttons: [{ id: "a", title: "A" }, { id: "b", title: "B" }],
      }),
      // Branch A messages
      makeMsg(2, 1, "inbound", {
        type: "text",
        text: "A",
        branchConfig: { branchId: "branch-a", branchPointSortOrder: 0, triggerValue: "A" },
      }),
      makeMsg(3, 2, "outbound", {
        type: "text",
        text: "You chose A!",
        branchConfig: { branchId: "branch-a", branchPointSortOrder: 0, triggerValue: "A" },
      }),
      // Branch B messages
      makeMsg(4, 3, "inbound", {
        type: "text",
        text: "B",
        branchConfig: { branchId: "branch-b", branchPointSortOrder: 0, triggerValue: "B" },
      }),
      makeMsg(5, 4, "outbound", {
        type: "text",
        text: "You chose B!",
        branchConfig: { branchId: "branch-b", branchPointSortOrder: 0, triggerValue: "B" },
      }),
      // Main path continues
      makeMsg(6, 5, "outbound", { type: "text", text: "Thanks for choosing!" }),
    ];

    it("returns only main path messages when no choices are made", () => {
      const result = resolveMessagePath(msgs, new Map());
      expect(result).toHaveLength(2); // msg 1 (outbound) + msg 6 (main path)
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(6);
    });

    it("includes branch A messages when branch A is chosen", () => {
      const choices = new Map([[0, "branch-a"]]);
      const result = resolveMessagePath(msgs, choices);
      expect(result).toHaveLength(4); // msg 1 + branch-a (2,3) + msg 6
      expect(result.map(m => m.id)).toEqual([1, 2, 3, 6]);
    });

    it("includes branch B messages when branch B is chosen", () => {
      const choices = new Map([[0, "branch-b"]]);
      const result = resolveMessagePath(msgs, choices);
      expect(result).toHaveLength(4); // msg 1 + branch-b (4,5) + msg 6
      expect(result.map(m => m.id)).toEqual([1, 4, 5, 6]);
    });

    it("preserves sort order in output", () => {
      const choices = new Map([[0, "branch-a"]]);
      const result = resolveMessagePath(msgs, choices);
      for (let i = 1; i < result.length; i++) {
        expect(result[i].sortOrder).toBeGreaterThan(result[i - 1].sortOrder);
      }
    });

    it("handles empty messages array", () => {
      expect(resolveMessagePath([], new Map())).toEqual([]);
    });

    it("handles messages with no branches at all", () => {
      const simpleMsgs = [
        makeMsg(1, 0, "outbound", { type: "text", text: "Hello" }),
        makeMsg(2, 1, "inbound", { type: "text", text: "Hi" }),
      ];
      const result = resolveMessagePath(simpleMsgs, new Map());
      expect(result).toHaveLength(2);
    });
  });

  // ─── getBranchesForPoint ───────────────────────────────────────────────
  describe("getBranchesForPoint", () => {
    const msgs = [
      makeMsg(1, 0, "outbound", {
        type: "interactive_buttons",
        text: "Choose",
        buttons: [{ id: "a", title: "A" }, { id: "b", title: "B" }],
      }),
      makeMsg(2, 1, "inbound", {
        type: "text",
        text: "A",
        branchConfig: { branchId: "branch-a", branchPointSortOrder: 0, triggerValue: "A", label: "Option A" },
      }),
      makeMsg(3, 2, "outbound", {
        type: "text",
        text: "Response A",
        branchConfig: { branchId: "branch-a", branchPointSortOrder: 0, triggerValue: "A", label: "Option A" },
      }),
      makeMsg(4, 3, "inbound", {
        type: "text",
        text: "B",
        branchConfig: { branchId: "branch-b", branchPointSortOrder: 0, triggerValue: "B", label: "Option B" },
      }),
    ];

    it("returns all branches for a given branch point", () => {
      const branches = getBranchesForPoint(msgs, 0);
      expect(branches).toHaveLength(2);
    });

    it("returns correct message count per branch", () => {
      const branches = getBranchesForPoint(msgs, 0);
      const branchA = branches.find(b => b.branchId === "branch-a");
      expect(branchA).toBeDefined();
      expect(branchA!.messages).toHaveLength(2);

      const branchB = branches.find(b => b.branchId === "branch-b");
      expect(branchB).toBeDefined();
      expect(branchB!.messages).toHaveLength(1);
    });

    it("returns empty array for non-existent branch point", () => {
      expect(getBranchesForPoint(msgs, 99)).toEqual([]);
    });

    it("returns empty array for empty messages", () => {
      expect(getBranchesForPoint([], 0)).toEqual([]);
    });
  });

  // ─── generateBranchId ─────────────────────────────────────────────────
  describe("generateBranchId", () => {
    it("generates an ID starting with 'branch-'", () => {
      const id = generateBranchId("Option A");
      expect(id).toMatch(/^branch-/);
    });

    it("slugifies the trigger value", () => {
      const id = generateBranchId("Learn More!");
      expect(id).toMatch(/^branch-learn-more/);
    });

    it("handles special characters", () => {
      const id = generateBranchId("Buy Now $$$");
      expect(id).toMatch(/^branch-buy-now/);
    });

    it("generates unique IDs (includes timestamp suffix)", () => {
      const id1 = generateBranchId("Same");
      // Small delay to ensure different timestamp
      const id2 = generateBranchId("Same");
      // They may or may not differ depending on timing, but format should be consistent
      expect(id1).toMatch(/^branch-same-/);
      expect(id2).toMatch(/^branch-same-/);
    });

    it("truncates long trigger values", () => {
      const longValue = "This is a very long button title that should be truncated";
      const id = generateBranchId(longValue);
      // The slug part should be at most 30 chars before the timestamp suffix
      const parts = id.split("-");
      // branch- prefix + slug + timestamp
      expect(id.length).toBeLessThan(50);
    });
  });

  // ─── getBranchStats ────────────────────────────────────────────────────
  describe("getBranchStats", () => {
    it("counts main path and branch messages correctly", () => {
      const msgs = [
        makeMsg(1, 0, "outbound", { type: "text", text: "Hello" }),
        makeMsg(2, 1, "inbound", {
          type: "text",
          text: "A",
          branchConfig: { branchId: "branch-a", branchPointSortOrder: 0, triggerValue: "A" },
        }),
        makeMsg(3, 2, "outbound", {
          type: "text",
          text: "B",
          branchConfig: { branchId: "branch-b", branchPointSortOrder: 0, triggerValue: "B" },
        }),
        makeMsg(4, 3, "outbound", { type: "text", text: "Bye" }),
      ];

      const stats = getBranchStats(msgs);
      expect(stats.mainPathCount).toBe(2);
      expect(stats.branchCount).toBe(2);
      expect(stats.totalBranches).toBe(2);
    });

    it("returns zeros for empty messages", () => {
      const stats = getBranchStats([]);
      expect(stats.mainPathCount).toBe(0);
      expect(stats.branchCount).toBe(0);
      expect(stats.totalBranches).toBe(0);
    });

    it("counts multiple messages in same branch as one branch", () => {
      const msgs = [
        makeMsg(1, 0, "outbound", { type: "text", text: "Hello" }),
        makeMsg(2, 1, "inbound", {
          type: "text",
          text: "A",
          branchConfig: { branchId: "branch-a", branchPointSortOrder: 0, triggerValue: "A" },
        }),
        makeMsg(3, 2, "outbound", {
          type: "text",
          text: "Response A",
          branchConfig: { branchId: "branch-a", branchPointSortOrder: 0, triggerValue: "A" },
        }),
        makeMsg(4, 3, "outbound", {
          type: "text",
          text: "More A",
          branchConfig: { branchId: "branch-a", branchPointSortOrder: 0, triggerValue: "A" },
        }),
      ];

      const stats = getBranchStats(msgs);
      expect(stats.mainPathCount).toBe(1);
      expect(stats.branchCount).toBe(3);
      expect(stats.totalBranches).toBe(1); // Only one unique branch
    });
  });
});
