import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Bell, Plus, Trash2, Clock, Edit3, Check, X, ChevronDown, ChevronUp,
  CalendarClock, MessageSquare, Star, Sparkles, AlertCircle
} from "lucide-react";
import type { ReminderMessage, ReminderTiming, MessageContent } from "@shared/types";
import { REMINDER_TIMING_OPTIONS } from "@shared/types";

interface ReminderEditorProps {
  reminders: ReminderMessage[];
  onChange: (reminders: ReminderMessage[]) => void;
  businessName?: string;
  /** Whether the conversation has booking-related messages */
  hasBookingFlow: boolean;
}

/** Pre-built reminder templates for quick insertion */
const REMINDER_TEMPLATES: {
  timing: ReminderTiming;
  label: string;
  icon: string;
  content: MessageContent;
}[] = [
  {
    timing: "24h_before",
    label: "24h Appointment Reminder",
    icon: "📅",
    content: {
      type: "interactive_buttons",
      text: "Hi! 👋 Just a friendly reminder that your appointment is *tomorrow*.\n\n📅 Date: Tomorrow\n⏰ Time: [Scheduled Time]\n📍 Location: [Business Location]\n\nPlease arrive 10 minutes early. See you there!",
      buttons: [
        { id: "confirm", title: "✅ Confirm", type: "quick_reply" },
        { id: "reschedule", title: "📅 Reschedule", type: "quick_reply" },
        { id: "cancel", title: "❌ Cancel", type: "quick_reply" },
      ],
    },
  },
  {
    timing: "1h_before",
    label: "1h Before Reminder",
    icon: "⏰",
    content: {
      type: "interactive_buttons",
      text: "Your appointment is in *1 hour*! ⏰\n\nWe're looking forward to seeing you. If you need directions or have any questions, just let us know.",
      buttons: [
        { id: "on-my-way", title: "🚗 On my way!", type: "quick_reply" },
        { id: "directions", title: "📍 Get Directions", type: "url" },
      ],
    },
  },
  {
    timing: "on_day",
    label: "Morning of Appointment",
    icon: "🌅",
    content: {
      type: "interactive_buttons",
      text: "Good morning! ☀️ This is a reminder about your appointment today.\n\n📅 Today\n⏰ Time: [Scheduled Time]\n\nRemember to bring any required documents. Have a great day!",
      buttons: [
        { id: "confirm", title: "✅ I'll be there", type: "quick_reply" },
        { id: "running-late", title: "🕐 Running late", type: "quick_reply" },
      ],
    },
  },
  {
    timing: "30min_before",
    label: "30min Last-Minute Reminder",
    icon: "⚡",
    content: {
      type: "text",
      text: "Quick reminder — your appointment starts in *30 minutes*! 🏃\n\nWe're ready for you. See you soon!",
    },
  },
  {
    timing: "after_appointment",
    label: "Post-Appointment Follow-up",
    icon: "⭐",
    content: {
      type: "interactive_buttons",
      text: "Thank you for visiting us today! 🙏\n\nWe hope you had a great experience. Your feedback helps us serve you better.\n\nWould you like to rate your experience?",
      buttons: [
        { id: "rate", title: "⭐ Rate Experience", type: "quick_reply" },
        { id: "book-again", title: "📅 Book Again", type: "quick_reply" },
        { id: "no-thanks", title: "No thanks", type: "quick_reply" },
      ],
    },
  },
];

function generateReminderId(): string {
  return `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ReminderEditor({ reminders, onChange, businessName, hasBookingFlow }: ReminderEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedReminders = useMemo(() => {
    const order: Record<ReminderTiming, number> = {
      "24h_before": 0,
      "on_day": 1,
      "1h_before": 2,
      "30min_before": 3,
      "after_appointment": 4,
    };
    return [...reminders].sort((a, b) => (order[a.timing] ?? 99) - (order[b.timing] ?? 99));
  }, [reminders]);

  const usedTimings = useMemo(() => new Set(reminders.map(r => r.timing)), [reminders]);

  const availableTemplates = useMemo(
    () => REMINDER_TEMPLATES.filter(t => !usedTimings.has(t.timing)),
    [usedTimings]
  );

  const addReminder = useCallback((template: typeof REMINDER_TEMPLATES[0]) => {
    const newReminder: ReminderMessage = {
      id: generateReminderId(),
      timing: template.timing,
      timingLabel: REMINDER_TIMING_OPTIONS.find(o => o.value === template.timing)?.label || template.label,
      direction: "outbound",
      contentType: template.content.type,
      content: {
        ...template.content,
        text: template.content.text?.replace("[Business Location]", businessName || "[Business Location]"),
      },
      enabled: true,
    };
    onChange([...reminders, newReminder]);
    setExpandedId(newReminder.id);
    toast.success(`Added "${template.label}" reminder`);
  }, [reminders, onChange, businessName]);

  const removeReminder = useCallback((id: string) => {
    onChange(reminders.filter(r => r.id !== id));
    toast.success("Reminder removed");
  }, [reminders, onChange]);

  const toggleReminder = useCallback((id: string) => {
    onChange(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, [reminders, onChange]);

  const updateReminderContent = useCallback((id: string, text: string) => {
    onChange(reminders.map(r => r.id === id ? {
      ...r,
      content: { ...r.content, text },
    } : r));
  }, [reminders, onChange]);

  const updateReminderTiming = useCallback((id: string, timing: ReminderTiming) => {
    const option = REMINDER_TIMING_OPTIONS.find(o => o.value === timing);
    onChange(reminders.map(r => r.id === id ? {
      ...r,
      timing,
      timingLabel: option?.label || timing,
    } : r));
  }, [reminders, onChange]);

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Bell className="w-4 h-4" /> Follow-up Reminders
          </h3>
          {reminders.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {reminders.filter(r => r.enabled).length} active
            </Badge>
          )}
        </div>

        {!hasBookingFlow && reminders.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No booking flow detected</p>
            <p className="text-xs mt-1">Add appointment booking messages first, then set up follow-up reminders</p>
            <p className="text-xs mt-2 text-muted-foreground/60">
              Tip: You can still add reminders manually using the button below
            </p>
          </div>
        )}

        {hasBookingFlow && reminders.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No reminders set up yet</p>
            <p className="text-xs mt-1">Add follow-up reminders to reduce no-shows and improve customer experience</p>
          </div>
        )}

        {/* Existing reminders */}
        {sortedReminders.length > 0 && (
          <div className="space-y-2 mb-3">
            {sortedReminders.map(reminder => {
              const isExpanded = expandedId === reminder.id;
              const isEditing = editingId === reminder.id;
              const timingOption = REMINDER_TIMING_OPTIONS.find(o => o.value === reminder.timing);

              return (
                <div
                  key={reminder.id}
                  className={`border rounded-lg transition-colors ${
                    reminder.enabled ? "border-border" : "border-border/50 opacity-60"
                  }`}
                >
                  {/* Header row */}
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : reminder.id)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-xs font-medium truncate">{reminder.timingLabel}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          reminder.content.buttons && reminder.content.buttons.length > 0
                            ? "bg-primary/5 text-primary border-primary/20"
                            : "bg-muted"
                        }`}
                      >
                        {reminder.content.buttons && reminder.content.buttons.length > 0 ? "Interactive" : "Text"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Switch
                        checked={reminder.enabled}
                        onCheckedChange={() => toggleReminder(reminder.id)}
                        className="scale-75"
                        onClick={e => e.stopPropagation()}
                      />
                      <button
                        onClick={e => { e.stopPropagation(); removeReminder(reminder.id); }}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t space-y-2.5">
                      {/* Timing selector */}
                      <div className="pt-2.5">
                        <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Timing</label>
                        <Select
                          value={reminder.timing}
                          onValueChange={(v) => updateReminderTiming(reminder.id, v as ReminderTiming)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REMINDER_TIMING_OPTIONS.map(opt => (
                              <SelectItem
                                key={opt.value}
                                value={opt.value}
                                disabled={usedTimings.has(opt.value) && opt.value !== reminder.timing}
                              >
                                <div>
                                  <div className="text-xs">{opt.label}</div>
                                  <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Message content */}
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Message Content</label>
                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={reminder.content.text || ""}
                              onChange={e => updateReminderContent(reminder.id, e.target.value)}
                              rows={4}
                              className="text-xs"
                              placeholder="Type your reminder message..."
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setEditingId(null)}
                              >
                                <Check className="w-3 h-3 mr-1" /> Done
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2.5 cursor-pointer hover:bg-muted/50 transition-colors whitespace-pre-wrap leading-relaxed"
                            onClick={() => setEditingId(reminder.id)}
                          >
                            {reminder.content.text || "Click to edit message..."}
                            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-primary">
                              <Edit3 className="w-3 h-3" /> Click to edit
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Buttons preview */}
                      {reminder.content.buttons && reminder.content.buttons.length > 0 && (
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Quick Reply Buttons</label>
                          <div className="flex flex-wrap gap-1">
                            {reminder.content.buttons.map(btn => (
                              <Badge key={btn.id} variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                                {btn.title}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add reminder button */}
        {availableTemplates.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-medium">Add a reminder:</p>
            <div className="grid grid-cols-1 gap-1.5">
              {availableTemplates.map(template => {
                const option = REMINDER_TIMING_OPTIONS.find(o => o.value === template.timing);
                return (
                  <button
                    key={template.timing}
                    onClick={() => addReminder(template)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-colors text-left group"
                  >
                    <span className="text-sm">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium group-hover:text-primary transition-colors">{template.label}</div>
                      <div className="text-[10px] text-muted-foreground">{option?.description}</div>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {reminders.length > 0 && availableTemplates.length === 0 && (
          <p className="text-[10px] text-muted-foreground text-center py-2 italic">
            All reminder slots are configured
          </p>
        )}

        {/* Info note */}
        {reminders.length > 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-blue-50 border border-blue-200/50">
            <p className="text-[10px] text-blue-700 leading-relaxed">
              <strong>Preview tip:</strong> Reminders appear as a separate follow-up sequence after the main conversation in the phone mockup preview.
              They demonstrate the full appointment lifecycle to your clients.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
