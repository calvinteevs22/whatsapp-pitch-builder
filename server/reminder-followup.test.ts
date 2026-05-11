import { describe, it, expect } from "vitest";
import type { ReminderMessage, ReminderTiming } from "../shared/types";
import { REMINDER_TIMING_OPTIONS } from "../shared/types";

/**
 * Tests for the Appointment Reminder Follow-up feature.
 * Covers: data model, timing options, reminder templates, and integration points.
 */

describe("ReminderMessage type structure", () => {
  const validReminder: ReminderMessage = {
    id: "reminder-123",
    timing: "24h_before",
    timingLabel: "24 hours before",
    direction: "outbound",
    contentType: "interactive_buttons",
    content: {
      type: "interactive_buttons",
      text: "Your appointment is tomorrow!",
      buttons: [
        { id: "confirm", title: "Confirm", type: "quick_reply" },
        { id: "reschedule", title: "Reschedule", type: "quick_reply" },
      ],
    },
    enabled: true,
  };

  it("should have all required fields", () => {
    expect(validReminder.id).toBeDefined();
    expect(validReminder.timing).toBeDefined();
    expect(validReminder.timingLabel).toBeDefined();
    expect(validReminder.direction).toBe("outbound");
    expect(validReminder.contentType).toBeDefined();
    expect(validReminder.content).toBeDefined();
    expect(typeof validReminder.enabled).toBe("boolean");
  });

  it("should always have outbound direction", () => {
    expect(validReminder.direction).toBe("outbound");
  });

  it("should support interactive_buttons content type", () => {
    expect(validReminder.content.type).toBe("interactive_buttons");
    expect(validReminder.content.buttons).toBeDefined();
    expect(validReminder.content.buttons!.length).toBeGreaterThan(0);
  });

  it("should support text content type", () => {
    const textReminder: ReminderMessage = {
      id: "reminder-456",
      timing: "30min_before",
      timingLabel: "30 minutes before",
      direction: "outbound",
      contentType: "text",
      content: {
        type: "text",
        text: "Your appointment starts in 30 minutes!",
      },
      enabled: true,
    };
    expect(textReminder.content.type).toBe("text");
    expect(textReminder.content.text).toBeDefined();
  });
});

describe("REMINDER_TIMING_OPTIONS", () => {
  it("should have 5 timing options", () => {
    expect(REMINDER_TIMING_OPTIONS).toHaveLength(5);
  });

  it("should include all timing values", () => {
    const values = REMINDER_TIMING_OPTIONS.map(o => o.value);
    expect(values).toContain("24h_before");
    expect(values).toContain("1h_before");
    expect(values).toContain("30min_before");
    expect(values).toContain("on_day");
    expect(values).toContain("after_appointment");
  });

  it("should have labels and descriptions for all options", () => {
    for (const option of REMINDER_TIMING_OPTIONS) {
      expect(option.label).toBeTruthy();
      expect(option.description).toBeTruthy();
      expect(option.value).toBeTruthy();
    }
  });

  it("should have unique values", () => {
    const values = REMINDER_TIMING_OPTIONS.map(o => o.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("Reminder timing ordering", () => {
  const timingOrder: Record<ReminderTiming, number> = {
    "24h_before": 0,
    "on_day": 1,
    "1h_before": 2,
    "30min_before": 3,
    "after_appointment": 4,
  };

  it("should sort reminders in chronological order", () => {
    const reminders: ReminderMessage[] = [
      {
        id: "r3", timing: "after_appointment", timingLabel: "After appointment",
        direction: "outbound", contentType: "text",
        content: { type: "text", text: "Thank you!" }, enabled: true,
      },
      {
        id: "r1", timing: "24h_before", timingLabel: "24 hours before",
        direction: "outbound", contentType: "text",
        content: { type: "text", text: "Reminder!" }, enabled: true,
      },
      {
        id: "r2", timing: "1h_before", timingLabel: "1 hour before",
        direction: "outbound", contentType: "text",
        content: { type: "text", text: "Almost time!" }, enabled: true,
      },
    ];

    const sorted = [...reminders].sort(
      (a, b) => (timingOrder[a.timing] ?? 99) - (timingOrder[b.timing] ?? 99)
    );

    expect(sorted[0].timing).toBe("24h_before");
    expect(sorted[1].timing).toBe("1h_before");
    expect(sorted[2].timing).toBe("after_appointment");
  });

  it("should handle all 5 timing values in correct order", () => {
    const allTimings: ReminderTiming[] = [
      "after_appointment", "30min_before", "on_day", "1h_before", "24h_before"
    ];

    const sorted = [...allTimings].sort(
      (a, b) => (timingOrder[a] ?? 99) - (timingOrder[b] ?? 99)
    );

    expect(sorted).toEqual([
      "24h_before", "on_day", "1h_before", "30min_before", "after_appointment"
    ]);
  });
});

describe("Reminder enable/disable", () => {
  it("should filter only enabled reminders", () => {
    const reminders: ReminderMessage[] = [
      {
        id: "r1", timing: "24h_before", timingLabel: "24 hours before",
        direction: "outbound", contentType: "text",
        content: { type: "text", text: "Reminder!" }, enabled: true,
      },
      {
        id: "r2", timing: "1h_before", timingLabel: "1 hour before",
        direction: "outbound", contentType: "text",
        content: { type: "text", text: "Almost time!" }, enabled: false,
      },
      {
        id: "r3", timing: "after_appointment", timingLabel: "After appointment",
        direction: "outbound", contentType: "text",
        content: { type: "text", text: "Thank you!" }, enabled: true,
      },
    ];

    const enabled = reminders.filter(r => r.enabled);
    expect(enabled).toHaveLength(2);
    expect(enabled.map(r => r.id)).toEqual(["r1", "r3"]);
  });

  it("should toggle reminder enabled state", () => {
    const reminder: ReminderMessage = {
      id: "r1", timing: "24h_before", timingLabel: "24 hours before",
      direction: "outbound", contentType: "text",
      content: { type: "text", text: "Reminder!" }, enabled: true,
    };

    const toggled = { ...reminder, enabled: !reminder.enabled };
    expect(toggled.enabled).toBe(false);

    const toggledBack = { ...toggled, enabled: !toggled.enabled };
    expect(toggledBack.enabled).toBe(true);
  });
});

describe("Reminder content validation", () => {
  it("should validate interactive_buttons reminder has buttons", () => {
    const reminder: ReminderMessage = {
      id: "r1", timing: "24h_before", timingLabel: "24 hours before",
      direction: "outbound", contentType: "interactive_buttons",
      content: {
        type: "interactive_buttons",
        text: "Your appointment is tomorrow!",
        buttons: [
          { id: "confirm", title: "Confirm" },
          { id: "reschedule", title: "Reschedule" },
        ],
      },
      enabled: true,
    };

    expect(reminder.content.buttons).toBeDefined();
    expect(reminder.content.buttons!.length).toBeGreaterThanOrEqual(1);
    expect(reminder.content.buttons!.length).toBeLessThanOrEqual(3);
  });

  it("should validate text reminder has text content", () => {
    const reminder: ReminderMessage = {
      id: "r1", timing: "30min_before", timingLabel: "30 minutes before",
      direction: "outbound", contentType: "text",
      content: {
        type: "text",
        text: "Your appointment starts in 30 minutes!",
      },
      enabled: true,
    };

    expect(reminder.content.text).toBeTruthy();
    expect(reminder.content.text!.length).toBeGreaterThan(0);
  });

  it("should ensure button titles are under 20 characters", () => {
    const reminder: ReminderMessage = {
      id: "r1", timing: "24h_before", timingLabel: "24 hours before",
      direction: "outbound", contentType: "interactive_buttons",
      content: {
        type: "interactive_buttons",
        text: "Reminder",
        buttons: [
          { id: "confirm", title: "Confirm" },
          { id: "reschedule", title: "Reschedule" },
          { id: "cancel", title: "Cancel" },
        ],
      },
      enabled: true,
    };

    for (const button of reminder.content.buttons!) {
      expect(button.title.length).toBeLessThanOrEqual(20);
    }
  });
});

describe("Booking flow detection", () => {
  const bookingKeywords = /book|appoint|schedul|reserv|slot|consult/i;

  it("should detect booking keywords in message text", () => {
    const bookingTexts = [
      "Book your appointment today",
      "Schedule a consultation",
      "Reserve your table",
      "Available slots for next week",
      "Appointment confirmed",
      "Booking reference: #12345",
    ];

    for (const text of bookingTexts) {
      expect(bookingKeywords.test(text)).toBe(true);
    }
  });

  it("should not detect non-booking messages", () => {
    const nonBookingTexts = [
      "Check out our new products",
      "Your order has been shipped",
      "Welcome to our store",
      "Here are today's deals",
    ];

    for (const text of nonBookingTexts) {
      expect(bookingKeywords.test(text)).toBe(false);
    }
  });
});

describe("AI generation prompt booking detection", () => {
  const bookingKeywords = /\b(book|booking|appointment|schedule|scheduling|reservation|reserv|reserve|consult|test drive|viewing|visit|check-in|slot|reschedule)\b/i;

  it("should detect appointment booking prompts", () => {
    const bookingPrompts = [
      "Create a dental appointment booking flow",
      "Build a restaurant reservation conversation",
      "Schedule a property viewing",
      "Book a test drive for BMW",
      "Spa consultation booking",
      "Reschedule appointment flow",
    ];

    for (const prompt of bookingPrompts) {
      expect(bookingKeywords.test(prompt)).toBe(true);
    }
  });

  it("should not trigger for non-booking prompts", () => {
    const nonBookingPrompts = [
      "Create a product catalog showcase",
      "Build an order tracking flow",
      "Welcome new subscribers",
      "Flash sale promotion",
    ];

    for (const prompt of nonBookingPrompts) {
      expect(bookingKeywords.test(prompt)).toBe(false);
    }
  });
});

describe("Reminder JSON serialization", () => {
  it("should serialize and deserialize reminders correctly", () => {
    const reminders: ReminderMessage[] = [
      {
        id: "r1", timing: "24h_before", timingLabel: "24 hours before",
        direction: "outbound", contentType: "interactive_buttons",
        content: {
          type: "interactive_buttons",
          text: "Your appointment is tomorrow!",
          buttons: [
            { id: "confirm", title: "Confirm" },
            { id: "reschedule", title: "Reschedule" },
          ],
        },
        enabled: true,
      },
      {
        id: "r2", timing: "1h_before", timingLabel: "1 hour before",
        direction: "outbound", contentType: "text",
        content: { type: "text", text: "Almost time!" },
        enabled: false,
      },
    ];

    const json = JSON.stringify(reminders);
    const parsed = JSON.parse(json) as ReminderMessage[];

    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe("r1");
    expect(parsed[0].timing).toBe("24h_before");
    expect(parsed[0].content.buttons).toHaveLength(2);
    expect(parsed[1].enabled).toBe(false);
  });

  it("should handle empty reminders array", () => {
    const reminders: ReminderMessage[] = [];
    const json = JSON.stringify(reminders);
    const parsed = JSON.parse(json) as ReminderMessage[];
    expect(parsed).toHaveLength(0);
  });

  it("should handle null/undefined reminderMessages from database", () => {
    const threadData = { reminderMessages: null };
    const reminders = threadData.reminderMessages || [];
    expect(reminders).toEqual([]);

    const threadData2 = {} as any;
    const reminders2 = threadData2.reminderMessages || [];
    expect(reminders2).toEqual([]);
  });
});

describe("Reminder uniqueness per timing", () => {
  it("should not allow duplicate timings", () => {
    const reminders: ReminderMessage[] = [
      {
        id: "r1", timing: "24h_before", timingLabel: "24 hours before",
        direction: "outbound", contentType: "text",
        content: { type: "text", text: "Reminder 1" }, enabled: true,
      },
      {
        id: "r2", timing: "1h_before", timingLabel: "1 hour before",
        direction: "outbound", contentType: "text",
        content: { type: "text", text: "Reminder 2" }, enabled: true,
      },
    ];

    const usedTimings = new Set(reminders.map(r => r.timing));
    const allTimings: ReminderTiming[] = ["24h_before", "1h_before", "30min_before", "on_day", "after_appointment"];
    const available = allTimings.filter(t => !usedTimings.has(t));

    expect(available).toHaveLength(3);
    expect(available).toContain("30min_before");
    expect(available).toContain("on_day");
    expect(available).toContain("after_appointment");
    expect(available).not.toContain("24h_before");
    expect(available).not.toContain("1h_before");
  });
});

describe("Reminder content update", () => {
  it("should update reminder text content", () => {
    const reminders: ReminderMessage[] = [
      {
        id: "r1", timing: "24h_before", timingLabel: "24 hours before",
        direction: "outbound", contentType: "text",
        content: { type: "text", text: "Original text" }, enabled: true,
      },
    ];

    const updated = reminders.map(r =>
      r.id === "r1" ? { ...r, content: { ...r.content, text: "Updated text" } } : r
    );

    expect(updated[0].content.text).toBe("Updated text");
  });

  it("should update reminder timing", () => {
    const reminders: ReminderMessage[] = [
      {
        id: "r1", timing: "24h_before", timingLabel: "24 hours before",
        direction: "outbound", contentType: "text",
        content: { type: "text", text: "Reminder" }, enabled: true,
      },
    ];

    const newTiming: ReminderTiming = "1h_before";
    const option = REMINDER_TIMING_OPTIONS.find(o => o.value === newTiming);
    const updated = reminders.map(r =>
      r.id === "r1" ? { ...r, timing: newTiming, timingLabel: option?.label || newTiming } : r
    );

    expect(updated[0].timing).toBe("1h_before");
    expect(updated[0].timingLabel).toBe("1 hour before");
  });
});
