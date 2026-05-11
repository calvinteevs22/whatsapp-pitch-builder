import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { MessageContent, ReminderMessage } from "@shared/types";
import { Check, CheckCheck, ArrowLeft, Phone, Video, MoreVertical, ShieldCheck, List, RotateCcw, Play, ChevronLeft, ChevronRight, Bell, Clock } from "lucide-react";
import ImageCropper from "@/components/ImageCropper";
import { resolveMessagePath, hasBranching, detectBranchPoints } from "@/lib/branching";

interface MockupMessage {
  id: number;
  sortOrder: number;
  direction: "inbound" | "outbound";
  contentType: string;
  content: MessageContent;
  timestamp: string | null;
  isRead: boolean;
}

interface WhatsAppMockupProps {
  profileName: string;
  profileImageUrl?: string | null;
  isVerified?: boolean;
  messages: MockupMessage[];
  reminderMessages?: ReminderMessage[];
  interactive?: boolean;
  className?: string;
  /** When true, shows shimmer animation on image placeholders */
  imagesLoading?: boolean;
  /** Callback when user edits the display name inline */
  onProfileNameChange?: (name: string) => void;
  /** Callback when user uploads a new profile photo */
  onProfileImageChange?: (imageUrl: string) => void;
  /** Callback when user removes the profile photo (revert to initials) */
  onProfileImageRemove?: () => void;
  /** Callback when user edits a message inline on the mockup */
  onMessageEdit?: (messageId: number, updatedContent: MessageContent) => void;
  /** Callback when user wants to upload an image for a message */
  onMessageImageUpload?: (messageId: number, field: string, base64: string, fileName: string, mimeType: string) => void;
  /** When true, the header name and avatar are editable */
  editable?: boolean;
  /** Ref callback to expose internal state control for GIF capture */
  captureControlRef?: React.MutableRefObject<CaptureControl | null>;
}

/** Exposed control interface for programmatic GIF capture */
export interface CaptureControl {
  setVisibleCount: (count: number) => void;
  setIsTyping: (typing: boolean) => void;
  setWaitingForClick: (waiting: boolean) => void;
  setSimulationComplete: (complete: boolean) => void;
  scrollToBottom: () => void;
  clearTimer: () => void;
  getPhoneMockupElement: () => HTMLElement | null;
}

function hasInteractiveElements(msg: MockupMessage): boolean {
  // Buttons on template, interactive_buttons, etc.
  const hasButtons = msg.content.buttons && msg.content.buttons.length > 0;
  // List messages
  const hasList = msg.content.type === "interactive_list";
  // Carousel cards with CTA buttons
  const hasCarousel = msg.content.type === "carousel" && msg.content.carouselCards && msg.content.carouselCards.length > 0;
  return !!(hasButtons || hasList || hasCarousel);
}

/**
 * Check if the NEXT message in the sequence is an inbound (customer) message.
 * Used to determine if we should pause at the current outbound message
 * even if it doesn't have explicit interactive elements.
 */
function nextMessageIsInbound(messages: MockupMessage[], currentIdx: number): boolean {
  return currentIdx + 1 < messages.length && messages[currentIdx + 1].direction === "inbound";
}

export default function WhatsAppMockup({
  profileName,
  profileImageUrl,
  isVerified = true,
  messages,
  reminderMessages = [],
  interactive = true,
  className = "",
  imagesLoading = false,
  onProfileNameChange,
  onProfileImageChange,
  onProfileImageRemove,
  onMessageEdit,
  onMessageImageUpload,
  editable = false,
  captureControlRef,
}: WhatsAppMockupProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(profileName);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [highlightedIdx, setHighlightedIdx] = useState<number | null>(null);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [waitingForClick, setWaitingForClick] = useState(false);
  const [responseOverrides, setResponseOverrides] = useState<Record<number, string>>({});
  const [branchChoices, setBranchChoices] = useState<Map<number, string>>(new Map());
  const [showReminders, setShowReminders] = useState(false);
  const [visibleReminderCount, setVisibleReminderCount] = useState(0);
  const [reminderTyping, setReminderTyping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chainRef = useRef<boolean>(false); // flag to cancel ongoing chains
  const messagesKeyRef = useRef<string>("");
  const isEditingRef = useRef<boolean>(false);

  // Resolve the active message path based on branch choices
  const isBranching = hasBranching(messages);
  const resolvedMessages = isBranching
    ? resolveMessagePath(messages, branchChoices)
    : messages;
  const branchPoints = isBranching ? detectBranchPoints(messages) : [];

  const messagesKey = resolvedMessages.map(m => m.id).join(",");

  const clearTimer = useCallback(() => {
    chainRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (reminderTimerRef.current) {
      clearTimeout(reminderTimerRef.current);
      reminderTimerRef.current = null;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    // Suppress auto-scroll when user is actively editing inline
    if (isEditingRef.current) return;
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 80);
  }, []);

  // Expose internal state control for programmatic GIF capture
  useEffect(() => {
    if (captureControlRef) {
      captureControlRef.current = {
        setVisibleCount,
        setIsTyping,
        setWaitingForClick,
        setSimulationComplete,
        scrollToBottom,
        clearTimer,
        getPhoneMockupElement: () => {
          // Find the phone mockup element within this component
          const el = scrollRef.current?.closest('[data-phone-mockup]') as HTMLElement | null;
          return el;
        },
      };
    }
    return () => {
      if (captureControlRef) captureControlRef.current = null;
    };
  }, [captureControlRef, scrollToBottom, clearTimer]);

  /**
   * Core reveal function: reveals messages one at a time from `fromIdx` to end.
   * Shows typing indicator before each OUTBOUND message.
   * Pauses at any message that has interactive buttons (if there are more messages after it).
   * Uses a chain ID to allow cancellation.
   */
  const revealOneByOne = useCallback((fromIdx: number) => {
    const chainId = {};
    chainRef.current = true;

    let idx = fromIdx;

    const revealNext = () => {
      if (!chainRef.current) return;
      if (idx >= resolvedMessages.length) {
        setSimulationComplete(true);
        setWaitingForClick(false);
        setIsTyping(false);
        return;
      }

      const msg = resolvedMessages[idx];
      const isOutbound = msg.direction === "outbound";

      if (isOutbound && idx > fromIdx) {
        setIsTyping(true);
        scrollToBottom();
        timerRef.current = setTimeout(() => {
          if (!chainRef.current) return;
          setIsTyping(false);
          setVisibleCount(idx + 1);
          scrollToBottom();

          const shouldPause = idx < resolvedMessages.length - 1 && (
            hasInteractiveElements(msg) || nextMessageIsInbound(resolvedMessages, idx)
          );
          if (shouldPause) {
            setWaitingForClick(true);
            return;
          }

          idx++;
          timerRef.current = setTimeout(revealNext, 600);
        }, 800);
      } else {
        setVisibleCount(idx + 1);
        scrollToBottom();

        const shouldPause = msg.direction === "outbound" && idx < resolvedMessages.length - 1 && (
          hasInteractiveElements(msg) || nextMessageIsInbound(resolvedMessages, idx)
        );
        if (shouldPause) {
          setWaitingForClick(true);
          return;
        }

        idx++;
        timerRef.current = setTimeout(revealNext, isOutbound ? 400 : 600);
      }
    };

    timerRef.current = setTimeout(revealNext, 300);
  }, [resolvedMessages, scrollToBottom]);

  // Auto-start simulation when messages load or change
  useEffect(() => {
    if (resolvedMessages.length === 0) {
      setVisibleCount(0);
      setSimulationComplete(false);
      setWaitingForClick(false);
      setResponseOverrides({});
      return;
    }

    if (messagesKeyRef.current === messagesKey) return;
    messagesKeyRef.current = messagesKey;

    clearTimer();
    setSimulationComplete(false);
    setHighlightedIdx(null);
    setIsTyping(false);
    setVisibleCount(0);
    setWaitingForClick(false);
    setResponseOverrides({});

    revealOneByOne(0);

    return () => clearTimer();
  }, [resolvedMessages, messagesKey, clearTimer, revealOneByOne]);

  // Auto-scroll when visible count or typing changes
  useEffect(() => {
    scrollToBottom();
  }, [visibleCount, isTyping, scrollToBottom]);

  /**
   * Handle button click during simulation.
   * 1. Show the button text as customer reply (override the next inbound message)
   * 2. Show typing indicator
   * 3. Reveal customer reply
   * 4. Then continue revealing subsequent messages one by one
   */
  const handleButtonClick = useCallback((msgIdx: number, buttonId: string, buttonTitle: string) => {
    if (!interactive) return;

    // Visual feedback
    setPressedButton(`${msgIdx}-${buttonId}`);
    setTimeout(() => setPressedButton(null), 300);

    // Check if this button triggers a branch
    const clickedMsg = resolvedMessages[msgIdx];
    if (clickedMsg && isBranching) {
      const matchingBranch = branchPoints.find(bp => bp.messageSortOrder === clickedMsg.sortOrder);
      if (matchingBranch) {
        const targetBranch = matchingBranch.branches.find(b => b.triggerValue === buttonTitle || b.triggerValue === buttonId);
        if (targetBranch) {
          // Activate this branch - this will cause resolvedMessages to update
          setBranchChoices(prev => {
            const next = new Map(prev);
            next.set(matchingBranch.messageSortOrder, targetBranch.branchId);
            return next;
          });
          // Don't return - continue with normal flow, the resolvedMessages will update
          // and the effect will restart the simulation from the right point
        }
      }
    }

    if (simulationComplete) {
      for (let i = msgIdx + 1; i < resolvedMessages.length; i++) {
        if (resolvedMessages[i].direction === "inbound") {
          setHighlightedIdx(i);
          setTimeout(() => setHighlightedIdx(null), 2000);
          const el = document.getElementById(`wa-msg-${i}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      }
      return;
    }

    if (!waitingForClick) return;
    setWaitingForClick(false);
    clearTimer();

    // Find the next inbound (customer) message
    let customerIdx = -1;
    for (let i = msgIdx + 1; i < resolvedMessages.length; i++) {
      if (resolvedMessages[i].direction === "inbound") {
        customerIdx = i;
        break;
      }
    }

    if (customerIdx === -1) {
      const nextIdx = visibleCount;
      if (nextIdx >= resolvedMessages.length) {
        setSimulationComplete(true);
        return;
      }
      revealOneByOne(nextIdx);
      return;
    }

    if (buttonId !== "__continue__" && buttonTitle) {
      setResponseOverrides(prev => ({ ...prev, [customerIdx]: buttonTitle }));
    }

    setIsTyping(true);
    scrollToBottom();

    timerRef.current = setTimeout(() => {
      setIsTyping(false);
      setVisibleCount(customerIdx + 1);
      setHighlightedIdx(customerIdx);
      scrollToBottom();

      setTimeout(() => setHighlightedIdx(null), 1500);

      const nextStart = customerIdx + 1;
      if (nextStart >= resolvedMessages.length) {
        timerRef.current = setTimeout(() => {
          setSimulationComplete(true);
        }, 500);
        return;
      }

      timerRef.current = setTimeout(() => {
        revealOneByOne(nextStart);
      }, 700);
    }, 1000);
  }, [interactive, simulationComplete, waitingForClick, resolvedMessages, visibleCount, clearTimer, scrollToBottom, revealOneByOne, isBranching, branchPoints]);

  const handleListSelect = useCallback((msgIdx: number, rowId: string, rowTitle: string) => {
    handleButtonClick(msgIdx, rowId, rowTitle);
  }, [handleButtonClick]);

  const restartSimulation = useCallback(() => {
    clearTimer();
    messagesKeyRef.current = "";
    setSimulationComplete(false);
    setHighlightedIdx(null);
    setIsTyping(false);
    setVisibleCount(0);
    setWaitingForClick(false);
    setResponseOverrides({});
    setBranchChoices(new Map());
    setShowReminders(false);
    setVisibleReminderCount(0);
    setReminderTyping(false);

    setTimeout(() => {
      revealOneByOne(0);
    }, 100);
  }, [resolvedMessages, clearTimer, revealOneByOne]);

  const showAllMessages = useCallback(() => {
    clearTimer();
    setVisibleCount(resolvedMessages.length);
    setSimulationComplete(true);
    setIsTyping(false);
    setHighlightedIdx(null);
    setWaitingForClick(false);
    // Also show all reminders
    const enabledReminders = reminderMessages.filter(r => r.enabled);
    if (enabledReminders.length > 0) {
      setShowReminders(true);
      setVisibleReminderCount(enabledReminders.length);
    }
  }, [resolvedMessages.length, clearTimer, reminderMessages]);

  // Auto-reveal reminders after main simulation completes
  const enabledReminders = reminderMessages.filter(r => r.enabled);
  const sortedEnabledReminders = [...enabledReminders].sort((a, b) => {
    const order: Record<string, number> = { "24h_before": 0, "on_day": 1, "1h_before": 2, "30min_before": 3, "after_appointment": 4 };
    return (order[a.timing] ?? 99) - (order[b.timing] ?? 99);
  });

  useEffect(() => {
    if (!simulationComplete || sortedEnabledReminders.length === 0) return;
    if (showReminders) return; // already showing

    // Start showing reminders after a short delay
    const startTimer = setTimeout(() => {
      setShowReminders(true);
      scrollToBottom();

      let rIdx = 0;
      const revealNextReminder = () => {
        if (rIdx >= sortedEnabledReminders.length) {
          setReminderTyping(false);
          return;
        }
        setReminderTyping(true);
        scrollToBottom();
        reminderTimerRef.current = setTimeout(() => {
          setReminderTyping(false);
          rIdx++;
          setVisibleReminderCount(rIdx);
          scrollToBottom();
          if (rIdx < sortedEnabledReminders.length) {
            reminderTimerRef.current = setTimeout(revealNextReminder, 800);
          }
        }, 1000);
      };

      reminderTimerRef.current = setTimeout(revealNextReminder, 500);
    }, 1500);

    return () => clearTimeout(startTimer);
  }, [simulationComplete, sortedEnabledReminders.length, showReminders, scrollToBottom]);

  const visibleMessages = resolvedMessages.slice(0, visibleCount);

  // Build combined list: interleave positioned reminders among regular messages
  // Positioned reminders (those with a valid sortPosition) are ALWAYS shown inline
  // at their correct position, even during simulation. Unpositioned reminders only
  // appear as trailing items after simulation completes.
  const combinedItems = useMemo(() => {
    type CombinedItem =
      | { type: 'message'; data: MockupMessage; originalIdx: number }
      | { type: 'reminder'; data: ReminderMessage; rIdx: number };

    const items: CombinedItem[] = visibleMessages.map((msg, idx) => ({
      type: 'message' as const,
      data: msg,
      originalIdx: idx,
    }));

    // Always insert positioned enabled reminders inline at their sortPosition.
    // This ensures reminders appear at the user's drag-and-drop position during
    // simulation, Show All, and after simulation completes.
    const allEnabled = sortedEnabledReminders;
    const positioned = allEnabled
      .map((rem, rIdx) => ({ rem, rIdx }))
      .filter(({ rem }) => rem.sortPosition !== undefined && rem.sortPosition <= visibleMessages.length)
      .sort((a, b) => (a.rem.sortPosition ?? 0) - (b.rem.sortPosition ?? 0));
    
    positioned.forEach(({ rem, rIdx }) => {
      // sortPosition = number of regular messages before this reminder
      // e.g., sortPosition=5 means insert after the 5th regular message
      const targetRegularCount = rem.sortPosition!;
      let regularCount = 0;
      let insertAt = items.length; // default: end
      
      if (targetRegularCount === 0) {
        // Insert before all messages
        insertAt = 0;
      } else {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type === 'message') {
            regularCount++;
            if (regularCount === targetRegularCount) {
              // Insert right after this message
              insertAt = i + 1;
              break;
            }
          }
        }
      }
      items.splice(insertAt, 0, { type: 'reminder' as const, data: rem, rIdx });
    });

    return items;
  }, [visibleMessages, sortedEnabledReminders]);

  // Reminders that don't have a sortPosition (or sortPosition > message count) go at the end.
  // These only show after simulation completes (showReminders = true).
  // Positioned reminders are already shown inline via combinedItems, so exclude them here.
  const trailingReminders = useMemo(() => {
    if (!showReminders) return [];
    const visibleReminders = sortedEnabledReminders.slice(0, visibleReminderCount);
    return visibleReminders.filter(
      rem => rem.sortPosition === undefined || rem.sortPosition === null || rem.sortPosition > visibleMessages.length
    );
  }, [showReminders, sortedEnabledReminders, visibleReminderCount, visibleMessages.length]);

  return (
    <div className={`flex flex-col w-full max-w-[375px] mx-auto h-full ${className}`}>
      {/* Controls */}
      {interactive && resolvedMessages.length > 0 && visibleCount > 0 && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <button
            onClick={restartSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#075E54] text-white text-xs font-medium hover:bg-[#064E46] transition-colors shadow-sm"
          >
            <RotateCcw className="w-3 h-3" />
            Restart
          </button>
          {!simulationComplete && (
            <button
              onClick={showAllMessages}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors shadow-sm"
            >
              Show All
            </button>
          )}
        </div>
      )}

      {/* Phone frame */}
      <div data-phone-mockup className="rounded-[2.5rem] overflow-hidden shadow-2xl border-[10px] border-[#1a1a1a] bg-[#1a1a1a] relative flex flex-col flex-1 min-h-0" style={{ maxHeight: '667px' }}>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[22px] bg-[#1a1a1a] rounded-b-2xl z-20" />

        {/* Status bar */}
        <div className="bg-[#075E54] px-5 pt-2 pb-0.5 flex items-center justify-between text-white text-[11px] relative z-10 shrink-0">
          <span className="font-semibold">12:00</span>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M2 22h20V2z"/></svg>
            <svg width="22" height="12" viewBox="0 0 28 14" fill="none"><rect x="0.5" y="0.5" width="23" height="13" rx="2" stroke="white" strokeOpacity="0.35"/><rect x="2" y="2" width="18" height="10" rx="1" fill="white"/><path d="M25 5v4a2 2 0 0 0 0-4z" fill="white" fillOpacity="0.4"/></svg>
          </div>
        </div>

        {/* WhatsApp header */}
        <div className="bg-[#075E54] px-2 pb-2.5 flex items-center gap-2 shrink-0">
          <ArrowLeft className="w-5 h-5 text-white shrink-0" />
          {/* Hidden file input for profile photo upload */}
          {editable && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !onProfileImageChange) return;
                // Convert to base64 and let parent handle upload
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = (reader.result as string).split(',')[1];
                  onProfileImageChange(base64 + '::' + file.name + '::' + file.type);
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />
          )}
          <div className="relative shrink-0 group/avatar">
            <div
              className={`w-10 h-10 rounded-full bg-[#DFE5E7] flex items-center justify-center overflow-hidden ${editable ? 'cursor-pointer hover:ring-2 hover:ring-white/50 transition-all' : ''}`}
              onClick={() => editable && fileInputRef.current?.click()}
              title={editable ? 'Click to change profile photo' : undefined}
            >
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={profileName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#075E54] font-bold text-sm">
                  {profileName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              )}
              {editable && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-full">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              )}
            </div>
            {/* Delete photo button - shows when editable and photo exists */}
            {editable && profileImageUrl && onProfileImageRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onProfileImageRemove();
                }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity shadow-sm z-10"
                title="Remove photo (revert to initials)"
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              {editable && isEditingName ? (
                <input
                  type="text"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onBlur={() => {
                    setIsEditingName(false);
                    if (editNameValue.trim() && editNameValue !== profileName) {
                      onProfileNameChange?.(editNameValue.trim());
                    } else {
                      setEditNameValue(profileName);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingName(false);
                      if (editNameValue.trim() && editNameValue !== profileName) {
                        onProfileNameChange?.(editNameValue.trim());
                      }
                    }
                    if (e.key === 'Escape') {
                      setIsEditingName(false);
                      setEditNameValue(profileName);
                    }
                  }}
                  autoFocus
                  className="bg-white/20 text-white font-medium text-[14px] px-1.5 py-0.5 rounded border border-white/30 outline-none w-full max-w-[150px]"
                />
              ) : (
                <span
                  className={`text-white font-medium text-[14px] truncate ${editable ? 'cursor-pointer hover:bg-white/10 px-1 py-0.5 rounded -mx-1 transition-colors' : ''}`}
                  onClick={(e) => {
                    if (editable) {
                      e.stopPropagation();
                      setEditNameValue(profileName);
                      setIsEditingName(true);
                    }
                  }}
                  title={editable ? 'Click to edit display name' : undefined}
                >
                  {profileName}
                </span>
              )}
              {isVerified && !isEditingName && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <circle cx="12" cy="12" r="10" fill="#53BDEB"/>
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-[#8ABBB5] text-[11px]">
              {isTyping ? "typing..." : "online"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <Video className="w-5 h-5" />
            <Phone className="w-4 h-4" />
            <MoreVertical className="w-5 h-5" />
          </div>
        </div>

        {/* Chat area - flex-1 to fill remaining space, scrollable */}
        <div
          ref={scrollRef}
          data-chat-area
          className="wa-chat-bg overflow-y-auto flex-1 min-h-0"
        >
          <div className="px-2.5 py-2 space-y-0.5">
            {/* Encryption notice */}
            <div className="flex justify-center my-2">
              <div className="bg-[#FFF3C4]/90 rounded-lg px-3 py-1.5 flex items-center gap-1.5 max-w-[85%]">
                <ShieldCheck className="w-3 h-3 text-[#8B7430] shrink-0" />
                <span className="text-[10px] text-[#8B7430] text-center leading-tight">
                  Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
                </span>
              </div>
            </div>

            {/* TODAY separator */}
            <div className="flex justify-center my-2">
              <span className="bg-white/90 text-[#54656F] text-[11px] font-medium px-3 py-0.5 rounded-md shadow-sm">
                TODAY
              </span>
            </div>

            {/* Messages + inline positioned reminders */}
            {combinedItems.map((item: { type: 'message'; data: MockupMessage; originalIdx: number } | { type: 'reminder'; data: ReminderMessage; rIdx: number }, combinedIdx: number) => {
              if (item.type === 'reminder') {
                const reminder = item.data;
                const timingLabels: Record<string, string> = {
                  "24h_before": "24 HOURS BEFORE",
                  "on_day": "MORNING OF APPOINTMENT",
                  "1h_before": "1 HOUR BEFORE",
                  "30min_before": "30 MINUTES BEFORE",
                  "after_appointment": "AFTER APPOINTMENT",
                };
                return (
                  <div key={`rem-${reminder.id}`}>
                    <div className="flex justify-center my-2">
                      <div className="flex items-center gap-1.5 bg-[#E1F3FB]/90 rounded-md px-2.5 py-0.5 shadow-sm">
                        <Bell className="w-2.5 h-2.5 text-[#075E54]" />
                        <span className="text-[10px] text-[#075E54] font-medium">
                          {timingLabels[reminder.timing] || reminder.timingLabel}
                        </span>
                      </div>
                    </div>
                    <MessageBubble
                      message={{
                        id: -1000 - item.rIdx,
                        sortOrder: 9000 + item.rIdx,
                        direction: "outbound",
                        contentType: reminder.contentType,
                        content: reminder.content,
                        timestamp: reminder.timing === "24h_before" ? "9:00 AM" :
                                   reminder.timing === "on_day" ? "8:00 AM" :
                                   reminder.timing === "1h_before" ? "9:00 AM" :
                                   reminder.timing === "30min_before" ? "9:30 AM" :
                                   "4:00 PM",
                        isRead: true,
                      }}
                      msgIdx={item.rIdx + visibleMessages.length}
                      isFirst={true}
                      isHighlighted={false}
                      isNewlyRevealed={false}
                      pressedButton={null}
                      interactive={false}
                      onButtonClick={() => {}}
                      onListSelect={() => {}}
                    />
                  </div>
                );
              }
              const msg = item.data;
              const idx = item.originalIdx;
              return (
              <MessageBubble
                key={msg.id}
                message={msg}
                msgIdx={idx}
                isFirst={idx === 0 || visibleMessages[idx - 1]?.direction !== msg.direction}
                isHighlighted={highlightedIdx === idx}
                isNewlyRevealed={idx === visibleCount - 1 && !simulationComplete}
                pressedButton={pressedButton}
                interactive={interactive}
                onButtonClick={handleButtonClick}
                onListSelect={handleListSelect}
                textOverride={responseOverrides[idx]}
                imagesLoading={imagesLoading}
                editable={editable}
                onMessageEdit={onMessageEdit}
                onMessageImageUpload={onMessageImageUpload}
                onEditingStateChange={(editing) => { isEditingRef.current = editing; }}
              />
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start mb-1 mt-1">
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm wa-bubble-inbound">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Waiting prompt */}
            {waitingForClick && !isTyping && (() => {
              const lastVisibleMsg = visibleMessages[visibleMessages.length - 1];
              const hasExplicitInteraction = lastVisibleMsg && hasInteractiveElements(lastVisibleMsg);
              return (
                <div className="flex justify-center my-3">
                  {hasExplicitInteraction ? (
                    <span className="text-[10px] text-[#8696A0] bg-white/80 px-3 py-1 rounded-full shadow-sm animate-pulse">
                      Tap a button above to continue
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        // Advance simulation as if user tapped a generic "continue" action
                        const lastIdx = visibleCount - 1;
                        handleButtonClick(lastIdx, "__continue__", "");
                      }}
                      className="text-[10px] text-white bg-[#075E54] px-4 py-1.5 rounded-full shadow-sm animate-pulse hover:bg-[#064E46] transition-colors cursor-pointer"
                    >
                      Tap to continue
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Trailing Reminder Follow-up Messages (no sortPosition or position >= message count) */}
            {showReminders && trailingReminders.length > 0 && (
              <>
                {/* Time skip separator */}
                <div className="flex justify-center my-3">
                  <div className="flex items-center gap-2 bg-[#E1F3FB]/90 rounded-lg px-3 py-1.5 shadow-sm">
                    <Bell className="w-3 h-3 text-[#075E54]" />
                    <span className="text-[10px] text-[#075E54] font-medium">
                      Follow-up Reminders
                    </span>
                  </div>
                </div>

                {trailingReminders.map((reminder: ReminderMessage, rIdx: number) => {
                  const timingLabels: Record<string, string> = {
                    "24h_before": "24 HOURS BEFORE",
                    "on_day": "MORNING OF APPOINTMENT",
                    "1h_before": "1 HOUR BEFORE",
                    "30min_before": "30 MINUTES BEFORE",
                    "after_appointment": "AFTER APPOINTMENT",
                  };
                  return (
                    <div key={reminder.id}>
                      {/* Time label */}
                      <div className="flex justify-center my-2">
                        <div className="flex items-center gap-1.5 bg-white/90 rounded-md px-2.5 py-0.5 shadow-sm">
                          <Clock className="w-2.5 h-2.5 text-[#54656F]" />
                          <span className="text-[10px] text-[#54656F] font-medium">
                            {timingLabels[reminder.timing] || reminder.timingLabel}
                          </span>
                        </div>
                      </div>
                      {/* Reminder message bubble */}
                      <MessageBubble
                        message={{
                          id: -1000 - rIdx,
                          sortOrder: 9000 + rIdx,
                          direction: "outbound",
                          contentType: reminder.contentType,
                          content: reminder.content,
                          timestamp: reminder.timing === "24h_before" ? "9:00 AM" :
                                     reminder.timing === "on_day" ? "8:00 AM" :
                                     reminder.timing === "1h_before" ? "9:00 AM" :
                                     reminder.timing === "30min_before" ? "9:30 AM" :
                                     "4:00 PM",
                          isRead: true,
                        }}
                        msgIdx={visibleMessages.length + rIdx}
                        isFirst={true}
                        isHighlighted={false}
                        isNewlyRevealed={rIdx === visibleReminderCount - 1}
                        pressedButton={null}
                        interactive={false}
                        onButtonClick={() => {}}
                        onListSelect={() => {}}
                      />
                    </div>
                  );
                })}

                {/* Reminder typing indicator */}
                {reminderTyping && (
                  <div className="flex justify-start mb-1 mt-1">
                    <div className="bg-white rounded-lg px-3 py-2 shadow-sm wa-bubble-inbound">
                      <div className="flex gap-1 items-center">
                        <div className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Input bar */}
        <div className="bg-[#F0F0F0] px-2 py-1.5 flex items-center gap-1.5 shrink-0">
          <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B9BA3"><circle cx="12" cy="12" r="10" fill="none" stroke="#8B9BA3" strokeWidth="1.5"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#8B9BA3" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="10" r="1" fill="#8B9BA3"/><circle cx="15" cy="10" r="1" fill="#8B9BA3"/></svg>
            <span className="text-[#8B9BA3] text-[14px] flex-1">Type a message</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B9BA3"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" fill="none" stroke="#8B9BA3" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#075E54] flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z"/><path d="M17 12c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  msgIdx,
  isFirst,
  isHighlighted,
  isNewlyRevealed,
  pressedButton,
  interactive,
  onButtonClick,
  onListSelect,
  textOverride,
  imagesLoading = false,
  editable = false,
  onMessageEdit,
  onMessageImageUpload,
  onEditingStateChange,
}: {
  message: MockupMessage;
  msgIdx: number;
  isFirst: boolean;
  isHighlighted: boolean;
  isNewlyRevealed: boolean;
  pressedButton: string | null;
  interactive: boolean;
  onButtonClick: (msgIdx: number, buttonId: string, buttonTitle: string) => void;
  onListSelect: (msgIdx: number, rowId: string, rowTitle: string) => void;
  textOverride?: string;
  imagesLoading?: boolean;
  editable?: boolean;
  onMessageEdit?: (messageId: number, updatedContent: MessageContent) => void;
  onMessageImageUpload?: (messageId: number, field: string, base64: string, fileName: string, mimeType: string) => void;
  onEditingStateChange?: (editing: boolean) => void;
}) {
  const { direction, content, timestamp, isRead } = message;
  const isFromBusiness = direction === "outbound";
  const [showList, setShowList] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageUploadField, setImageUploadField] = useState<string>("");

  const displayText = textOverride || content.text || content.bodyText || "";

  const highlightClass = isHighlighted
    ? "ring-2 ring-[#25D366] ring-offset-1 scale-[1.02]"
    : "";
  const revealClass = isNewlyRevealed ? "animate-slideIn" : "";

  // Inline editing helpers
  const startEdit = (field: string, currentValue: string) => {
    if (!editable || !onMessageEdit) return;
    setEditingField(field);
    setEditValue(currentValue);
    onEditingStateChange?.(true);
  };

  const commitEdit = (field: string) => {
    if (!onMessageEdit || editValue === getFieldValue(field)) {
      setEditingField(null);
      setTimeout(() => onEditingStateChange?.(false), 500);
      return;
    }
    const updated = { ...content };
    if (field === "text") updated.text = editValue;
    else if (field === "bodyText") updated.bodyText = editValue;
    else if (field === "headerText") updated.headerText = editValue;
    else if (field === "footerText") updated.footerText = editValue;
    else if (field === "caption") updated.caption = editValue;
    else if (field === "listButtonText") updated.listButtonText = editValue;
    else if (field.startsWith("button-")) {
      const btnIdx = parseInt(field.split("-")[1]);
      if (updated.buttons && updated.buttons[btnIdx]) {
        updated.buttons = [...updated.buttons];
        updated.buttons[btnIdx] = { ...updated.buttons[btnIdx], title: editValue };
      }
    } else if (field.startsWith("listRow-")) {
      // format: listRow-sectionIdx-rowIdx
      const parts = field.split("-");
      const sIdx = parseInt(parts[1]);
      const rIdx = parseInt(parts[2]);
      if (updated.listSections?.[sIdx]?.rows?.[rIdx]) {
        updated.listSections = updated.listSections.map((s, si) =>
          si === sIdx ? { ...s, rows: s.rows.map((r, ri) => ri === rIdx ? { ...r, title: editValue } : r) } : s
        );
      }
    } else if (field.startsWith("card-")) {
      // format: card-cardIdx-fieldName
      const parts = field.split("-");
      const cardIdx = parseInt(parts[1]);
      const cardField = parts[2];
      if (updated.carouselCards?.[cardIdx]) {
        updated.carouselCards = updated.carouselCards.map((c, ci) =>
          ci === cardIdx ? { ...c, [cardField]: editValue } : c
        );
      }
    }
    onMessageEdit(message.id, updated);
    setEditingField(null);
    // Delay clearing the editing guard so that async refetch/re-render
    // doesn't trigger scrollToBottom before the DOM settles
    setTimeout(() => onEditingStateChange?.(false), 500);
  };

  const getFieldValue = (field: string): string => {
    if (field === "text") return content.text || "";
    if (field === "bodyText") return content.bodyText || "";
    if (field === "headerText") return content.headerText || "";
    if (field === "footerText") return content.footerText || "";
    if (field === "caption") return content.caption || "";
    if (field === "listButtonText") return content.listButtonText || "Select";
    if (field.startsWith("button-")) {
      const btnIdx = parseInt(field.split("-")[1]);
      return content.buttons?.[btnIdx]?.title || "";
    }
    return "";
  };

  const handleImageUpload = (field: string) => {
    if (!editable || !onMessageImageUpload) return;
    setImageUploadField(field);
    imageInputRef.current?.click();
  };

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageUrl, setCropperImageUrl] = useState<string | null>(null);
  const [cropperAspect, setCropperAspect] = useState(16 / 9);

  const getCropAspectForField = (field: string): number => {
    if (field === 'headerImageUrl') return 16 / 9;
    if (field.startsWith('card-')) return 1;
    if (field === 'imageUrl') return 4 / 3;
    return 16 / 9;
  };

  const onImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onMessageImageUpload) return;
    // Open cropper instead of uploading directly
    const objectUrl = URL.createObjectURL(file);
    setCropperImageUrl(objectUrl);
    setCropperAspect(getCropAspectForField(imageUploadField));
    setCropperOpen(true);
    e.target.value = '';
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    if (!onMessageImageUpload) return;
    if (cropperImageUrl && cropperImageUrl.startsWith('blob:')) URL.revokeObjectURL(cropperImageUrl);
    setCropperImageUrl(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      onMessageImageUpload(message.id, imageUploadField, base64, 'cropped-image.jpg', 'image/jpeg');
    };
    reader.readAsDataURL(croppedBlob);
  };

  const handleCropperClose = () => {
    if (cropperImageUrl && cropperImageUrl.startsWith('blob:')) URL.revokeObjectURL(cropperImageUrl);
    setCropperImageUrl(null);
    setCropperOpen(false);
  };

  // Editable text component
  const EditableText = ({ field, className: cls, children }: { field: string; className?: string; children: React.ReactNode }) => {
    if (!editable || !onMessageEdit) return <>{children}</>;
    if (editingField === field) {
      const isMultiline = ["text", "bodyText", "caption"].includes(field) || field.startsWith("card-");
      return isMultiline ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => commitEdit(field)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setEditingField(null); onEditingStateChange?.(false); }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(field); }
          }}
          autoFocus
          className={`bg-blue-50 border border-blue-300 rounded px-1 py-0.5 outline-none resize-none w-full ${cls || ''}`}
          rows={Math.min(Math.max(editValue.split('\n').length, 2), 6)}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => commitEdit(field)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setEditingField(null); onEditingStateChange?.(false); }
            if (e.key === 'Enter') { commitEdit(field); }
          }}
          autoFocus
          className={`bg-blue-50 border border-blue-300 rounded px-1 py-0.5 outline-none w-full ${cls || ''}`}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    return (
      <span
        className={`cursor-pointer hover:bg-blue-50/60 hover:outline hover:outline-1 hover:outline-blue-300/50 rounded transition-all ${cls || ''}`}
        onClick={(e) => { e.stopPropagation(); startEdit(field, getFieldValue(field)); }}
        title="Click to edit"
      >
        {children}
      </span>
    );
  };

  // Editable image overlay
  const EditableImage = ({ field, children, className: cls }: { field: string; children: React.ReactNode; className?: string }) => {
    if (!editable || !onMessageImageUpload) return <>{children}</>;
    return (
      <div className={`relative group/img ${cls || ''}`}>
        {children}
        <div
          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
          onClick={(e) => { e.stopPropagation(); handleImageUpload(field); }}
        >
          <div className="flex flex-col items-center gap-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span className="text-white text-[9px] font-medium">Change Image</span>
          </div>
        </div>
      </div>
    );
  };

  // Hidden file input for image uploads within messages
  const hiddenImageInput = (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onImageFileSelected}
      />
      {cropperImageUrl && (
        <ImageCropper
          open={cropperOpen}
          onClose={handleCropperClose}
          imageUrl={cropperImageUrl}
          onCropComplete={handleCropComplete}
          defaultAspect={cropperAspect}
          title={`Crop ${imageUploadField === 'headerImageUrl' ? 'Header' : imageUploadField.startsWith('card-') ? 'Card' : ''} Image`}
        />
      )}
    </>
  );

  // Template message
  if (content.type === "template") {
    return (
      <div id={`wa-msg-${msgIdx}`} className={`flex justify-start mb-1 ${isFirst ? "mt-1" : ""} ${revealClass}`}>
        {hiddenImageInput}
        <div className={`max-w-[85%] transition-all duration-300 ${highlightClass}`}>
          <div className={`relative bg-white rounded-lg overflow-hidden shadow-sm ${isFirst ? "wa-bubble-inbound" : ""}`}>
            {content.headerImageUrl && !content.headerImageUrl.startsWith("GENERATE_IMAGE:") ? (
              <EditableImage field="headerImageUrl">
                <div className="w-full aspect-[1.91/1] bg-gray-100 overflow-hidden relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 gap-1 transition-opacity duration-300" style={{ opacity: 1 }} data-placeholder="true">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="#9ca3af"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                    <p className="text-[10px] text-gray-400 text-center px-2">Loading image...</p>
                  </div>
                  <img src={content.headerImageUrl} alt="" className="w-full h-full object-cover relative z-10" 
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.naturalWidth <= 2 || img.naturalHeight <= 2) {
                        const placeholder = img.parentElement?.querySelector('[data-placeholder]') as HTMLElement;
                        if (placeholder) {
                          placeholder.style.opacity = '1';
                          placeholder.innerHTML = '<div class="flex flex-col items-center gap-1"><svg width="36" height="36" viewBox="0 0 24 24" fill="#9ca3af"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg><p class="text-[10px] text-gray-400 text-center px-2">Image loading...</p></div>';
                        }
                        img.style.opacity = '0';
                        return;
                      }
                      const placeholder = img.parentElement?.querySelector('[data-placeholder]') as HTMLElement;
                      if (placeholder) placeholder.style.opacity = '0';
                      img.style.opacity = '1';
                    }}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.opacity = '0';
                      const placeholder = img.parentElement?.querySelector('[data-placeholder]') as HTMLElement;
                      if (placeholder) {
                        placeholder.style.opacity = '1';
                        placeholder.innerHTML = '<div class="flex flex-col items-center gap-1"><svg width="36" height="36" viewBox="0 0 24 24" fill="#d1d5db"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg><p class="text-[10px] text-gray-400 text-center px-2">Image loading...</p></div>';
                      }
                    }} />
                </div>
              </EditableImage>
            ) : content.headerImageUrl?.startsWith("GENERATE_IMAGE:") ? (
              <div className={`w-full aspect-[1.91/1] bg-gradient-to-br from-emerald-50 to-emerald-100 flex flex-col items-center justify-center gap-2 p-3 ${imagesLoading ? 'animate-pulse' : ''}`}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="#059669"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                {imagesLoading ? (
                  <p className="text-[10px] text-emerald-600 text-center leading-tight">Generating image...</p>
                ) : (
                  <p className="text-[10px] text-emerald-700 text-center leading-tight line-clamp-2">{content.headerImageUrl.replace('GENERATE_IMAGE:', '').trim()}</p>
                )}
              </div>
            ) : null}
            <div className="px-2.5 py-1.5">
              {content.headerText && (
                <EditableText field="headerText" className="font-bold text-[13px] text-[#111B21] mb-0.5 block">
                  <p className="font-bold text-[13px] text-[#111B21] mb-0.5">{content.headerText}</p>
                </EditableText>
              )}
              {content.bodyText && (
                <EditableText field="bodyText" className="text-[12.5px] text-[#111B21] block">
                  <p className="text-[12.5px] text-[#111B21] whitespace-pre-wrap leading-[17px]">
                    {formatWhatsAppText(content.bodyText)}
                  </p>
                </EditableText>
              )}
              <div className="flex items-end justify-between mt-1">
                {content.footerText && (
                  <EditableText field="footerText">
                    <span className="text-[10px] text-[#8696A0]">{content.footerText}</span>
                  </EditableText>
                )}
                <span className="text-[10px] text-[#8696A0] ml-auto pl-2">{timestamp}</span>
              </div>
            </div>
            {content.buttons && content.buttons.length > 0 && (
              <div className="border-t border-[#E9EDEF]">
                {content.buttons.map((btn, i) => (
                  <div
                    key={btn.id}
                    className={`w-full py-1.5 text-center text-[13px] font-medium text-[#00A884] transition-all duration-200 ${
                      pressedButton === `${msgIdx}-${btn.id}`
                        ? "bg-[#00A884]/15 scale-95"
                        : interactive ? "hover:bg-[#F0F2F5] active:bg-[#00A884]/10 cursor-pointer" : ""
                    } ${
                      i < content.buttons!.length - 1 ? "border-b border-[#E9EDEF]" : ""
                    }`}
                    onClick={() => !editingField && onButtonClick(msgIdx, btn.id, btn.title)}
                  >
                    <EditableText field={`button-${i}`}>
                      {btn.title}
                    </EditableText>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Interactive buttons message
  if (content.type === "interactive_buttons") {
    return (
      <div id={`wa-msg-${msgIdx}`} className={`flex ${isFromBusiness ? "justify-start" : "justify-end"} mb-1 ${isFirst ? "mt-1" : ""} ${revealClass}`}>
        {hiddenImageInput}
        <div className={`max-w-[85%] transition-all duration-300 ${highlightClass}`}>
          <div className={`relative ${isFromBusiness ? "bg-white" : "bg-[#D9FDD3]"} rounded-lg overflow-hidden shadow-sm ${isFirst ? (isFromBusiness ? "wa-bubble-inbound" : "wa-bubble-outbound") : ""}`}>
            <div className="px-2.5 py-1.5">
              {content.text && (
                <EditableText field="text" className="text-[12.5px] text-[#111B21] block">
                  <p className="text-[12.5px] text-[#111B21] whitespace-pre-wrap leading-[17px]">
                    {formatWhatsAppText(content.text)}
                  </p>
                </EditableText>
              )}
              <div className="flex items-end justify-end mt-0.5">
                <span className="text-[10px] text-[#8696A0]">{timestamp}</span>
                {!isFromBusiness && <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB] ml-1" />}
              </div>
            </div>
            {content.buttons && content.buttons.length > 0 && (
              <div className="border-t border-[#E9EDEF]">
                {content.buttons.map((btn, i) => (
                  <div
                    key={btn.id}
                    className={`w-full py-1.5 text-center text-[13px] font-medium text-[#00A884] transition-all duration-200 ${
                      pressedButton === `${msgIdx}-${btn.id}`
                        ? "bg-[#00A884]/15 scale-95"
                        : interactive ? "hover:bg-[#F0F2F5] active:bg-[#00A884]/10 cursor-pointer" : ""
                    } ${
                      i < content.buttons!.length - 1 ? "border-b border-[#E9EDEF]" : ""
                    }`}
                    onClick={() => !editingField && onButtonClick(msgIdx, btn.id, btn.title)}
                  >
                    <EditableText field={`button-${i}`}>
                      {btn.title}
                    </EditableText>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Interactive list message
  if (content.type === "interactive_list") {
    return (
      <div id={`wa-msg-${msgIdx}`} className={`flex justify-start mb-1 ${isFirst ? "mt-1" : ""} ${revealClass}`}>
        {hiddenImageInput}
        <div className={`max-w-[85%] transition-all duration-300 ${highlightClass}`}>
          <div className={`relative bg-white rounded-lg overflow-hidden shadow-sm ${isFirst ? "wa-bubble-inbound" : ""}`}>
            <div className="px-2.5 py-1.5">
              {content.text && (
                <EditableText field="text" className="text-[12.5px] text-[#111B21] block">
                  <p className="text-[12.5px] text-[#111B21] whitespace-pre-wrap leading-[17px]">
                    {formatWhatsAppText(content.text)}
                  </p>
                </EditableText>
              )}
              <div className="flex items-end justify-end mt-0.5">
                <span className="text-[10px] text-[#8696A0]">{timestamp}</span>
              </div>
            </div>
            <div className="border-t border-[#E9EDEF]">
              <div
                onClick={() => !editingField && setShowList(!showList)}
                className={`w-full py-1.5 text-center text-[13px] font-medium text-[#00A884] transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  interactive ? "hover:bg-[#F0F2F5] active:bg-[#00A884]/10 cursor-pointer" : ""
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <EditableText field="listButtonText">
                  {content.listButtonText || "Select"}
                </EditableText>
              </div>
            </div>
          </div>

          {/* List dropdown */}
          {showList && content.listSections && (
            <div className="mt-1 bg-white rounded-lg shadow-lg border border-[#E9EDEF] overflow-hidden animate-slideIn">
              {content.listSections.map((section, sIdx) => (
                <div key={sIdx}>
                  <div className="px-3 py-1.5 bg-[#F0F2F5]">
                    <span className="text-[11px] font-semibold text-[#00A884] uppercase tracking-wide">
                      {section.title}
                    </span>
                  </div>
                  {section.rows.map((row, rIdx) => (
                    <div
                      key={row.id}
                      onClick={() => {
                        if (!editingField) {
                          setShowList(false);
                          onListSelect(msgIdx, row.id, row.title);
                        }
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#F0F2F5] active:bg-[#00A884]/10 transition-colors border-b border-[#E9EDEF] last:border-b-0 cursor-pointer"
                    >
                      <EditableText field={`listRow-${sIdx}-${rIdx}`}>
                        <p className="text-[12.5px] text-[#111B21] font-medium">{row.title}</p>
                      </EditableText>
                      {row.description && (
                        <p className="text-[10.5px] text-[#8696A0] mt-0.5">{row.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Image message
  if (content.type === "image") {
    return (
      <div id={`wa-msg-${msgIdx}`} className={`flex ${isFromBusiness ? "justify-start" : "justify-end"} mb-1 ${isFirst ? "mt-1" : ""} ${revealClass}`}>
        {hiddenImageInput}
        <div className={`relative max-w-[75%] rounded-lg overflow-hidden shadow-sm transition-all duration-300 ${
          isFromBusiness ? "bg-white" : "bg-[#D9FDD3]"
        } ${isFirst ? (isFromBusiness ? "wa-bubble-inbound" : "wa-bubble-outbound") : ""} ${highlightClass}`}>
          {content.imageUrl ? (
            <EditableImage field="imageUrl">
              <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 gap-1 transition-opacity duration-300" style={{ opacity: 1 }} data-placeholder="true">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="#9ca3af"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                  <p className="text-[10px] text-gray-400 text-center px-2">Loading image...</p>
                </div>
                <img src={content.imageUrl} alt={content.caption || ""} className="w-full h-full object-cover relative z-10"
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.naturalWidth <= 2 || img.naturalHeight <= 2) {
                      const placeholder = img.parentElement?.querySelector('[data-placeholder]') as HTMLElement;
                      if (placeholder) {
                        placeholder.style.opacity = '1';
                        placeholder.innerHTML = '<div class="flex flex-col items-center gap-1"><svg width="36" height="36" viewBox="0 0 24 24" fill="#9ca3af"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg><p class="text-[10px] text-gray-400 text-center px-2">Image loading...</p></div>';
                      }
                      img.style.opacity = '0';
                      return;
                    }
                    const placeholder = img.parentElement?.querySelector('[data-placeholder]') as HTMLElement;
                    if (placeholder) placeholder.style.opacity = '0';
                    img.style.opacity = '1';
                  }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.opacity = '0';
                    const placeholder = img.parentElement?.querySelector('[data-placeholder]') as HTMLElement;
                    if (placeholder) {
                      placeholder.style.opacity = '1';
                      placeholder.innerHTML = '<div class="flex flex-col items-center gap-1"><svg width="36" height="36" viewBox="0 0 24 24" fill="#d1d5db"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg><p class="text-[10px] text-gray-400 text-center px-2">Image loading...</p></div>';
                    }
                  }} />
              </div>
            </EditableImage>
          ) : (
            <div className={`w-full aspect-[4/3] bg-gradient-to-br from-emerald-50 to-emerald-100 flex flex-col items-center justify-center gap-2 p-3 ${imagesLoading ? 'animate-pulse' : ''}`}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="#059669"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              {imagesLoading ? (
                <p className="text-[10px] text-emerald-600 text-center leading-tight">Generating image...</p>
              ) : content.imageDescription ? (
                <p className="text-[10px] text-emerald-700 text-center leading-tight line-clamp-2">{content.imageDescription}</p>
              ) : null}
            </div>
          )}
          <div className="px-2.5 py-1">
            {content.caption && (
              <EditableText field="caption" className="text-[12.5px] text-[#111B21] block">
                <p className="text-[12.5px] text-[#111B21] whitespace-pre-wrap">{formatWhatsAppText(content.caption)}</p>
              </EditableText>
            )}
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="text-[10px] text-[#8696A0]">{timestamp}</span>
              {!isFromBusiness && <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />}
            </div>
          </div>
          {content.buttons && content.buttons.length > 0 && (
            <div className="border-t border-[#E9EDEF]">
              {content.buttons.map((btn, i) => (
                <div
                  key={btn.id}
                  className={`w-full py-1.5 text-center text-[13px] font-medium text-[#00A884] transition-all duration-200 ${
                    pressedButton === `${msgIdx}-${btn.id}`
                      ? "bg-[#00A884]/15 scale-95"
                      : interactive ? "hover:bg-[#F0F2F5] active:bg-[#00A884]/10 cursor-pointer" : ""
                  } ${
                    i < content.buttons!.length - 1 ? "border-b border-[#E9EDEF]" : ""
                  }`}
                  onClick={() => !editingField && onButtonClick(msgIdx, btn.id, btn.title)}
                >
                  <EditableText field={`button-${i}`}>
                    {btn.title}
                  </EditableText>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Video message
  if (content.type === "video") {
    return (
      <div id={`wa-msg-${msgIdx}`} className={`flex ${isFromBusiness ? "justify-start" : "justify-end"} mb-1 ${isFirst ? "mt-1" : ""} ${revealClass}`}>
        {hiddenImageInput}
        <div className={`relative max-w-[75%] rounded-lg overflow-hidden shadow-sm transition-all duration-300 ${
          isFromBusiness ? "bg-white" : "bg-[#D9FDD3]"
        } ${isFirst ? (isFromBusiness ? "wa-bubble-inbound" : "wa-bubble-outbound") : ""} ${highlightClass}`}>
          {content.videoUrl || content.videoPosterUrl ? (
            <EditableImage field="videoPosterUrl">
              <div className="w-full aspect-video bg-black overflow-hidden relative">
                {content.videoPosterUrl ? (
                  <img src={content.videoPosterUrl} alt="" className="w-full h-full object-cover" />
                ) : content.videoUrl ? (
                  <video src={content.videoUrl} className="w-full h-full object-contain" poster={content.videoPosterUrl} />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
              </div>
            </EditableImage>
          ) : (
            <div className={`w-full aspect-video bg-gradient-to-br from-gray-700 to-gray-900 flex flex-col items-center justify-center gap-2 p-3 ${imagesLoading ? 'animate-pulse' : ''}`}>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
              {imagesLoading ? (
                <p className="text-[10px] text-gray-300 text-center leading-tight">Generating thumbnail...</p>
              ) : content.videoDescription ? (
                <p className="text-[10px] text-gray-300 text-center leading-tight line-clamp-2">{content.videoDescription}</p>
              ) : null}
            </div>
          )}
          <div className="px-2.5 py-1">
            {content.caption && (
              <EditableText field="caption" className="text-[12.5px] text-[#111B21] block">
                <p className="text-[12.5px] text-[#111B21] whitespace-pre-wrap">{formatWhatsAppText(content.caption)}</p>
              </EditableText>
            )}
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="text-[10px] text-[#8696A0]">{timestamp}</span>
              {!isFromBusiness && <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Carousel message
  if (content.type === "carousel") {
    return (
      <div id={`wa-msg-${msgIdx}`} className={`flex justify-start mb-1 ${isFirst ? "mt-1" : ""} ${revealClass}`}>
        {hiddenImageInput}
        <div className={`max-w-[95%] transition-all duration-300 ${highlightClass}`}>
          {/* Intro text bubble */}
          {content.text && (
            <div className={`relative bg-white rounded-lg px-2.5 py-1.5 shadow-sm mb-1 ${isFirst ? "wa-bubble-inbound" : ""}`}>
              <EditableText field="text" className="text-[12.5px] text-[#111B21] block">
                <p className="text-[12.5px] text-[#111B21] whitespace-pre-wrap leading-[17px]">
                  {formatWhatsAppText(content.text)}
                </p>
              </EditableText>
              <div className="flex items-end justify-end mt-0.5">
                <span className="text-[10px] text-[#8696A0]">{timestamp}</span>
              </div>
            </div>
          )}
          {/* Carousel cards - horizontal scroll */}
          {content.carouselCards && content.carouselCards.length > 0 && (
            <CarouselScroller
              cards={content.carouselCards}
              interactive={interactive}
              msgIdx={msgIdx}
              onButtonClick={onButtonClick}
              imagesLoading={imagesLoading}
              editable={editable}
              messageId={message.id}
              onMessageEdit={onMessageEdit}
              onMessageImageUpload={onMessageImageUpload}
              fullContent={content}
            />
          )}
        </div>
      </div>
    );
  }

  // Default text message
  return (
    <div id={`wa-msg-${msgIdx}`} className={`flex ${isFromBusiness ? "justify-start" : "justify-end"} mb-0.5 ${isFirst ? "mt-1" : ""} ${revealClass}`}>
      {hiddenImageInput}
      <div
        className={`relative max-w-[80%] rounded-lg px-2.5 py-1 shadow-sm transition-all duration-300 ${
          isFromBusiness
            ? `bg-white ${isFirst ? "wa-bubble-inbound" : ""}`
            : `bg-[#D9FDD3] ${isFirst ? "wa-bubble-outbound" : ""}`
        } ${highlightClass}`}
      >
        <EditableText field="text" className="text-[12.5px] text-[#111B21] block">
          <p className="text-[12.5px] text-[#111B21] whitespace-pre-wrap leading-[17px]">
            {formatWhatsAppText(displayText)}
          </p>
        </EditableText>
        <div className="flex items-center justify-end gap-1 -mb-0.5">
          <span className="text-[10px] text-[#8696A0]">{timestamp}</span>
          {!isFromBusiness && isRead && <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />}
          {!isFromBusiness && !isRead && <Check className="w-3.5 h-3.5 text-[#8696A0]" />}
        </div>
      </div>
    </div>
  );
}

// ==================== Carousel Scroller ====================

function CarouselScroller({
  cards,
  interactive,
  msgIdx,
  onButtonClick,
  imagesLoading = false,
  editable = false,
  messageId,
  onMessageEdit,
  onMessageImageUpload,
  fullContent,
}: {
  cards: NonNullable<MessageContent["carouselCards"]>;
  interactive: boolean;
  msgIdx: number;
  onButtonClick: (msgIdx: number, buttonId: string, buttonTitle: string) => void;
  imagesLoading?: boolean;
  editable?: boolean;
  messageId?: number;
  onMessageEdit?: (messageId: number, updatedContent: MessageContent) => void;
  onMessageImageUpload?: (messageId: number, field: string, base64: string, fileName: string, mimeType: string) => void;
  fullContent?: MessageContent;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [editingCardField, setEditingCardField] = useState<string | null>(null);
  const [editCardValue, setEditCardValue] = useState("");
  const cardImageInputRef = useRef<HTMLInputElement>(null);
  const [cardImageUploadField, setCardImageUploadField] = useState("");

  const startCardEdit = (field: string, value: string) => {
    if (!editable || !onMessageEdit) return;
    setEditingCardField(field);
    setEditCardValue(value);
  };

  const commitCardEdit = (field: string) => {
    if (!onMessageEdit || !fullContent || messageId === undefined) {
      setEditingCardField(null);
      return;
    }
    // field format: card-cardIdx-fieldName
    const parts = field.split("-");
    const cardIdx = parseInt(parts[1]);
    const cardField = parts[2];
    const updated = { ...fullContent };
    if (updated.carouselCards?.[cardIdx]) {
      updated.carouselCards = updated.carouselCards.map((c, ci) =>
        ci === cardIdx ? { ...c, [cardField]: editCardValue } : c
      );
    }
    onMessageEdit(messageId, updated);
    setEditingCardField(null);
  };

  const CardEditableText = ({ field, className: cls, children }: { field: string; className?: string; children: React.ReactNode }) => {
    if (!editable || !onMessageEdit) return <>{children}</>;
    if (editingCardField === field) {
      return (
        <input
          type="text"
          value={editCardValue}
          onChange={(e) => setEditCardValue(e.target.value)}
          onBlur={() => commitCardEdit(field)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditingCardField(null);
            if (e.key === 'Enter') commitCardEdit(field);
          }}
          autoFocus
          className={`bg-blue-50 border border-blue-300 rounded px-1 py-0.5 outline-none w-full text-[11px] ${cls || ''}`}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    const parts = field.split("-");
    const cardIdx = parseInt(parts[1]);
    const cardField = parts[2];
    const currentVal = cards[cardIdx]?.[cardField as keyof typeof cards[0]] as string || "";
    return (
      <span
        className={`cursor-pointer hover:bg-blue-50/60 hover:outline hover:outline-1 hover:outline-blue-300/50 rounded transition-all ${cls || ''}`}
        onClick={(e) => { e.stopPropagation(); startCardEdit(field, currentVal); }}
        title="Click to edit"
      >
        {children}
      </span>
    );
  };

  const CardEditableImage = ({ field, children }: { field: string; children: React.ReactNode }) => {
    if (!editable || !onMessageImageUpload) return <>{children}</>;
    return (
      <div className="relative group/cimg">
        {children}
        <div
          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/cimg:opacity-100 transition-opacity cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setCardImageUploadField(field);
            cardImageInputRef.current?.click();
          }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span className="text-white text-[7px] font-medium">Change</span>
          </div>
        </div>
      </div>
    );
  };

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = 180;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const onCardImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onMessageImageUpload || messageId === undefined) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      // cardImageUploadField format: card-idx-imageUrl
      onMessageImageUpload(messageId, cardImageUploadField, base64, file.name, file.type);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="relative">
      {/* Hidden file input for card image uploads */}
      <input
        ref={cardImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onCardImageFileSelected}
      />
      {/* Scroll buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-[#111B21]" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center"
        >
          <ChevronRight className="w-3.5 h-3.5 text-[#111B21]" />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {cards.map((card, cardIdx) => (
          <div
            key={card.id}
            className="flex-shrink-0 w-[180px] bg-white rounded-lg overflow-hidden shadow-sm"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Card image */}
            {card.imageUrl ? (
              <CardEditableImage field={`card-${cardIdx}-imageUrl`}>
                <div className="w-full h-[100px] bg-gray-100 overflow-hidden relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 gap-0.5 transition-opacity duration-300" style={{ opacity: 1 }} data-placeholder="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#9ca3af"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                    <p className="text-[7px] text-gray-400 text-center px-1">Loading...</p>
                  </div>
                  <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover relative z-10"
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.naturalWidth <= 2 || img.naturalHeight <= 2) {
                        const placeholder = img.parentElement?.querySelector('[data-placeholder]') as HTMLElement;
                        if (placeholder) {
                          placeholder.style.opacity = '1';
                          placeholder.innerHTML = '<div class="flex flex-col items-center gap-0.5"><svg width="24" height="24" viewBox="0 0 24 24" fill="#9ca3af"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg><p class="text-[7px] text-gray-400 text-center px-1">Loading...</p></div>';
                        }
                        img.style.opacity = '0';
                        return;
                      }
                      const placeholder = img.parentElement?.querySelector('[data-placeholder]') as HTMLElement;
                      if (placeholder) placeholder.style.opacity = '0';
                      img.style.opacity = '1';
                    }}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.opacity = '0';
                      const placeholder = img.parentElement?.querySelector('[data-placeholder]') as HTMLElement;
                      if (placeholder) {
                        placeholder.style.opacity = '1';
                        placeholder.innerHTML = '<div class="flex flex-col items-center gap-0.5"><svg width="24" height="24" viewBox="0 0 24 24" fill="#d1d5db"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg><p class="text-[7px] text-gray-400 text-center px-1">Loading...</p></div>';
                      }
                    }} />
                </div>
              </CardEditableImage>
            ) : (
              <div className={`w-full h-[100px] bg-gradient-to-br from-emerald-50 to-emerald-100 flex flex-col items-center justify-center gap-1 p-2 ${imagesLoading ? 'animate-pulse' : ''}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#059669"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                {imagesLoading ? (
                  <p className="text-[7px] text-emerald-600 text-center leading-tight">Loading...</p>
                ) : (card as any).imageDescription ? (
                  <p className="text-[8px] text-emerald-700 text-center leading-tight line-clamp-2">{(card as any).imageDescription}</p>
                ) : null}
              </div>
            )}
            {/* Card content */}
            <div className="px-2 py-1.5">
              <CardEditableText field={`card-${cardIdx}-title`}>
                <p className="text-[12px] font-semibold text-[#111B21] truncate">{card.title}</p>
              </CardEditableText>
              {card.description && (
                <CardEditableText field={`card-${cardIdx}-description`}>
                  <p className="text-[10.5px] text-[#667781] line-clamp-2 leading-tight mt-0.5">{card.description}</p>
                </CardEditableText>
              )}
              {card.price && (
                <CardEditableText field={`card-${cardIdx}-price`}>
                  <p className="text-[12px] font-bold text-[#075E54] mt-1">{card.price}</p>
                </CardEditableText>
              )}
            </div>
            {/* CTA button */}
            <div className="border-t border-[#E9EDEF]">
              <div
                onClick={() => !editingCardField && interactive && onButtonClick(msgIdx, card.id, card.buttonText)}
                className={`w-full py-1.5 text-center text-[12px] font-medium text-[#00A884] ${
                  interactive ? "hover:bg-[#F0F2F5] active:bg-[#00A884]/10 cursor-pointer" : ""
                } transition-colors`}
              >
                <CardEditableText field={`card-${cardIdx}-buttonText`}>
                  {card.buttonText}
                </CardEditableText>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatWhatsAppText(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("~") && part.endsWith("~")) {
      return <del key={i}>{part.slice(1, -1)}</del>;
    }
    return part;
  });
}
