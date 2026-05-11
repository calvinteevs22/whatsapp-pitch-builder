/**
 * Conversation Branching Utilities
 * 
 * Resolves which messages to show based on user choices at branch points.
 * Messages without branchConfig are on the "main" path and always shown.
 * Messages with branchConfig only show when their branch is active.
 */

import type { MessageContent, BranchConfig, BranchPoint } from "@shared/types";

interface BranchableMessage {
  id: number;
  sortOrder: number;
  direction: "inbound" | "outbound";
  contentType: string;
  content: MessageContent;
  timestamp: string | null;
  isRead: boolean;
}

/**
 * Detect all branch points in a conversation.
 * A branch point is an interactive message that has at least one branch defined for it.
 */
export function detectBranchPoints(messages: BranchableMessage[]): BranchPoint[] {
  // Find all unique branch point sort orders
  const branchPointMap = new Map<number, Map<string, { branchId: string; triggerValue: string; label: string; count: number }>>();

  for (const msg of messages) {
    const bc = msg.content.branchConfig;
    if (!bc) continue;

    if (!branchPointMap.has(bc.branchPointSortOrder)) {
      branchPointMap.set(bc.branchPointSortOrder, new Map());
    }
    const branches = branchPointMap.get(bc.branchPointSortOrder)!;
    if (!branches.has(bc.branchId)) {
      branches.set(bc.branchId, {
        branchId: bc.branchId,
        triggerValue: bc.triggerValue,
        label: bc.label || bc.triggerValue,
        count: 0,
      });
    }
    branches.get(bc.branchId)!.count++;
  }

  const branchPoints: BranchPoint[] = [];
  for (const [sortOrder, branches] of Array.from(branchPointMap)) {
    // Find the message at this sort order
    const msg = messages.find(m => m.sortOrder === sortOrder);
    if (!msg) continue;

    const branchEntries: BranchPoint["branches"] = [];
    for (const entry of Array.from(branches.values())) {
      branchEntries.push({
        branchId: entry.branchId,
        triggerValue: entry.triggerValue,
        label: entry.label,
        messageCount: entry.count,
      });
    }

    branchPoints.push({
      messageSortOrder: sortOrder,
      messageId: msg.id,
      branches: branchEntries,
    });
  }

  return branchPoints.sort((a, b) => a.messageSortOrder - b.messageSortOrder);
}

/**
 * Given a set of user choices (which button was clicked at each branch point),
 * resolve the linear message sequence to display.
 * 
 * @param messages - All messages in the thread (including all branches)
 * @param choices - Map of branchPointSortOrder -> chosen branchId
 * @returns Ordered array of messages to display
 */
export function resolveMessagePath(
  messages: BranchableMessage[],
  choices: Map<number, string>
): BranchableMessage[] {
  const result: BranchableMessage[] = [];

  // Sort by sortOrder
  const sorted = [...messages].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const msg of sorted) {
    const bc = msg.content.branchConfig;

    if (!bc) {
      // Main path message - always include
      result.push(msg);
    } else {
      // Branch message - only include if this branch was chosen
      const chosenBranch = choices.get(bc.branchPointSortOrder);
      if (chosenBranch === bc.branchId) {
        result.push(msg);
      }
    }
  }

  return result;
}

/**
 * Check if a conversation has any branching defined.
 */
export function hasBranching(messages: BranchableMessage[]): boolean {
  return messages.some(m => m.content.branchConfig != null);
}

/**
 * Get all branch IDs for a specific branch point.
 */
export function getBranchesForPoint(
  messages: BranchableMessage[],
  branchPointSortOrder: number
): { branchId: string; triggerValue: string; label: string; messages: BranchableMessage[] }[] {
  const branchMap = new Map<string, { branchId: string; triggerValue: string; label: string; messages: BranchableMessage[] }>();

  for (const msg of messages) {
    const bc = msg.content.branchConfig;
    if (!bc || bc.branchPointSortOrder !== branchPointSortOrder) continue;

    if (!branchMap.has(bc.branchId)) {
      branchMap.set(bc.branchId, {
        branchId: bc.branchId,
        triggerValue: bc.triggerValue,
        label: bc.label || bc.triggerValue,
        messages: [],
      });
    }
    branchMap.get(bc.branchId)!.messages.push(msg);
  }

  return Array.from(branchMap.values());
}

/**
 * Generate a unique branch ID based on the trigger value.
 */
export function generateBranchId(triggerValue: string): string {
  const slug = triggerValue
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 30);
  return `branch-${slug}-${Date.now().toString(36).slice(-4)}`;
}

/**
 * Count total messages per branch path for display.
 */
export function getBranchStats(messages: BranchableMessage[]): {
  mainPathCount: number;
  branchCount: number;
  totalBranches: number;
} {
  const mainPathCount = messages.filter(m => !m.content.branchConfig).length;
  const branchMessages = messages.filter(m => m.content.branchConfig);
  const uniqueBranches = new Set(branchMessages.map(m => m.content.branchConfig!.branchId));

  return {
    mainPathCount,
    branchCount: branchMessages.length,
    totalBranches: uniqueBranches.size,
  };
}
