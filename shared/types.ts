/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

export interface CarouselCard {
  id: string;
  imageUrl?: string;
  imageDescription?: string;
  title: string;
  description?: string;
  price?: string;
  buttonText: string;
  buttonUrl?: string;
}

/**
 * Branch configuration for conversation branching.
 * Messages with branchConfig belong to a specific branch path.
 * Messages without branchConfig are on the "main" (default) path.
 */
export interface BranchConfig {
  /** Unique branch identifier (e.g., "branch-explore", "branch-pricing") */
  branchId: string;
  /** The sortOrder of the interactive message that triggers this branch */
  branchPointSortOrder: number;
  /** The button ID or option value that activates this branch */
  triggerValue: string;
  /** Human-readable label for this branch (e.g., "Explore Products") */
  label?: string;
}

export interface MessageContent {
  type: "text" | "template" | "interactive_buttons" | "interactive_list" | "image" | "location" | "document" | "audio" | "video" | "carousel";
  /** Branch configuration - if set, this message belongs to a branch path */
  branchConfig?: BranchConfig;
  text?: string;
  headerText?: string;
  headerImageUrl?: string;
  bodyText?: string;
  footerText?: string;
  imageUrl?: string;
  imageDescription?: string;
  videoUrl?: string;
  videoDescription?: string;
  videoPosterUrl?: string;
  buttons?: { id: string; title: string; type?: "quick_reply" | "url" | "phone" }[];
  listSections?: {
    title: string;
    rows: { id: string; title: string; description?: string }[];
  }[];
  listButtonText?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  documentUrl?: string;
  documentName?: string;
  carouselCards?: CarouselCard[];
  formatting?: {
    bold?: boolean;
    italic?: boolean;
  };
}

export interface ThreadMessage {
  id: number;
  threadId: number;
  sortOrder: number;
  direction: "inbound" | "outbound";
  contentType: string;
  content: MessageContent;
  timestamp: string | null;
  isRead: boolean;
}

/**
 * Represents a branch point in the conversation - an interactive message
 * where different button/option clicks lead to different paths.
 */
export interface BranchPoint {
  /** The sortOrder of the interactive message */
  messageSortOrder: number;
  /** The message ID */
  messageId: number;
  /** Available branches from this point */
  branches: {
    branchId: string;
    triggerValue: string;
    label: string;
    messageCount: number;
  }[];
}

/**
 * Reminder timing options for follow-up messages
 */
export type ReminderTiming = "24h_before" | "1h_before" | "30min_before" | "on_day" | "after_appointment";

export interface ReminderMessage {
  id: string;
  timing: ReminderTiming;
  /** Human-readable timing label e.g. "24 hours before" */
  timingLabel: string;
  direction: "outbound";
  contentType: string;
  content: MessageContent;
  /** Whether this reminder is enabled */
  enabled: boolean;
  /** Position index in the combined message list (undefined = append at end) */
  sortPosition?: number;
}

export const REMINDER_TIMING_OPTIONS: { value: ReminderTiming; label: string; description: string }[] = [
  { value: "24h_before", label: "24 hours before", description: "Send a reminder the day before the appointment" },
  { value: "1h_before", label: "1 hour before", description: "Send a reminder 1 hour before the appointment" },
  { value: "30min_before", label: "30 minutes before", description: "Send a last-minute reminder" },
  { value: "on_day", label: "Morning of appointment", description: "Send a reminder on the morning of the appointment" },
  { value: "after_appointment", label: "After appointment", description: "Send a follow-up after the appointment" },
];

export interface ThreadData {
  id: number;
  uid: string;
  userId: number;
  name: string;
  businessName: string | null;
  businessUrl: string | null;
  businessContext: string | null;
  industry: string | null;
  messageType: "marketing" | "utility" | "authentication";
  profileName: string | null;
  profileImageUrl: string | null;
  isVerified: boolean;
  phoneSettings: {
    time?: string;
    is24h?: boolean;
    os?: "android" | "ios";
  } | null;
  isPublic: boolean;
  shareToken: string | null;
  reminderMessages?: ReminderMessage[];
  adCreative?: AdCreative | null;
  createdAt: Date;
  updatedAt: Date;
}

export const INDUSTRIES = [
  "Automotive",
  "Beauty & Wellness",
  "E-Commerce",
  "Education",
  "Entertainment",
  "Finance & Banking",
  "Food & Beverage",
  "Government",
  "Healthcare",
  "Insurance",
  "Logistics",
  "Real Estate",
  "Retail",
  "Technology",
  "Telecommunications",
  "Travel & Hospitality",
] as const;

export const MESSAGE_TYPES = {
  marketing: {
    label: "Marketing Messages",
    description: "Promotional messages to drive sales, engagement, and brand awareness. Requires user opt-in.",
    color: "#25D366",
  },
  utility: {
    label: "Utility Messages",
    description: "Transactional messages like order updates, appointment reminders, and account notifications.",
    color: "#34B7F1",
  },
  authentication: {
    label: "Authentication Messages",
    description: "One-time passcodes and verification messages for secure account access.",
    color: "#FF6B35",
  },
} as const;

export type Industry = (typeof INDUSTRIES)[number];
export type MessageType = keyof typeof MESSAGE_TYPES;

/**
 * CTWA (Click-to-WhatsApp Ads) Ad Creative types
 */
export type AdPlacement = "facebook_feed" | "instagram_feed" | "instagram_story" | "instagram_reels";
export type AdFormat = "single_image" | "carousel" | "video";

export const AD_PLACEMENTS: { value: AdPlacement; label: string; description: string; aspectRatio: string }[] = [
  { value: "facebook_feed", label: "Facebook Feed", description: "Full-width card in News Feed", aspectRatio: "1.91:1 or 1:1" },
  { value: "instagram_feed", label: "Instagram Feed", description: "Square/portrait post in Feed", aspectRatio: "1:1" },
  { value: "instagram_story", label: "Instagram Story", description: "Full-screen vertical story", aspectRatio: "9:16" },
  { value: "instagram_reels", label: "Instagram Reels", description: "Vertical short-form video", aspectRatio: "9:16" },
];

export const AD_FORMATS: { value: AdFormat; label: string }[] = [
  { value: "single_image", label: "Single Image" },
  { value: "carousel", label: "Carousel" },
  { value: "video", label: "Video" },
];

export interface AdCarouselCard {
  id: string;
  imageUrl: string;
  headline: string;
  description?: string;
}

export interface AdCreative {
  enabled: boolean;
  placement: AdPlacement;
  format: AdFormat;
  headline: string;
  primaryText: string;
  ctaText: string;
  mediaUrl: string;
  carouselCards?: AdCarouselCard[];
  brandName: string;
  brandLogoUrl?: string;
}
