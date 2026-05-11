import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";
import type { ReminderMessage, AdCreative } from "../shared/types";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  loginCount: int("loginCount").default(0).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Threads table - stores WhatsApp conversation flow projects
 */
export const threads = mysqlTable("threads", {
  id: int("id").autoincrement().primaryKey(),
  uid: varchar("uid", { length: 36 }).notNull().unique(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  businessName: varchar("businessName", { length: 255 }),
  businessUrl: varchar("businessUrl", { length: 1024 }),
  businessContext: text("businessContext"),
  industry: varchar("industry", { length: 100 }),
  messageType: mysqlEnum("messageType", ["marketing", "utility", "authentication"]).default("marketing").notNull(),
  profileName: varchar("profileName", { length: 100 }),
  profileImageUrl: varchar("profileImageUrl", { length: 1024 }),
  isVerified: boolean("isVerified").default(true).notNull(),
  phoneSettings: json("phoneSettings").$type<{
    time?: string;
    is24h?: boolean;
    os?: "android" | "ios";
  }>(),
  isPublic: boolean("isPublic").default(false).notNull(),
  shareToken: varchar("shareToken", { length: 64 }),
  reminderMessages: json("reminderMessages").$type<ReminderMessage[]>(),
  adCreative: json("adCreative").$type<AdCreative>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Thread = typeof threads.$inferSelect;
export type InsertThread = typeof threads.$inferInsert;

/**
 * Messages table - stores individual messages within a thread
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull(),
  sortOrder: int("sortOrder").notNull().default(0),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  contentType: mysqlEnum("contentType", [
    "text",
    "template",
    "interactive_buttons",
    "interactive_list",
    "image",
    "location",
    "document",
    "audio",
    "video",
    "carousel",
  ]).default("text").notNull(),
  content: json("content").$type<MessageContent>().notNull(),
  timestamp: varchar("timestamp", { length: 20 }).default("12:00 PM"),
  isRead: boolean("isRead").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Use cases table - stores sample use case templates
 */
export const useCases = mysqlTable("use_cases", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 100 }).notNull(),
  messageType: mysqlEnum("messageType", ["marketing", "utility", "authentication"]).default("marketing").notNull(),
  tags: json("tags").$type<string[]>(),
  flowSteps: json("flowSteps").$type<string[]>(),
  sampleMessages: json("sampleMessages").$type<MessageContent[]>(),
  isBuiltIn: boolean("isBuiltIn").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UseCase = typeof useCases.$inferSelect;
export type InsertUseCase = typeof useCases.$inferInsert;

/**
 * Saved templates table - stores user's personal reusable templates
 */
export const savedTemplates = mysqlTable("saved_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 100 }),
  messageType: mysqlEnum("messageType", ["marketing", "utility", "authentication"]).default("marketing").notNull(),
  profileName: varchar("profileName", { length: 100 }),
  businessContext: text("businessContext"),
  messagesSnapshot: json("messagesSnapshot").$type<Array<{
    direction: "inbound" | "outbound";
    contentType: string;
    content: MessageContent;
    timestamp: string;
  }>>(),
  tags: json("tags").$type<string[]>(),
  sourceThreadUid: varchar("sourceThreadUid", { length: 36 }),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedTemplate = typeof savedTemplates.$inferSelect;
export type InsertSavedTemplate = typeof savedTemplates.$inferInsert;

/**
 * API Keys table - stores hashed API keys for external bot integrations
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("keyHash", { length: 128 }).notNull().unique(),
  keyPrefix: varchar("keyPrefix", { length: 12 }).notNull(), // e.g. "pk_abc1" for display
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  isRevoked: boolean("isRevoked").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Anonymous feedback table - stores user feedback from the floating widget
 */
export const feedback = mysqlTable("feedback", {
  id: int("id").autoincrement().primaryKey(),
  text: text("text").notNull(),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  pageUrl: varchar("pageUrl", { length: 1024 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

/**
 * Message content type - universal structure for all message types
 */
export interface CarouselCard {
  id: string;
  imageUrl?: string;
  title: string;
  description?: string;
  price?: string;
  buttonText: string;
  buttonUrl?: string;
}

export interface MessageContent {
  type: "text" | "template" | "interactive_buttons" | "interactive_list" | "image" | "location" | "document" | "audio" | "video" | "carousel";
  branchConfig?: {
    branchId: string;
    branchPointSortOrder: number;
    triggerValue: string;
    label?: string;
  };
  text?: string;
  headerText?: string;
  headerImageUrl?: string;
  bodyText?: string;
  footerText?: string;
  imageUrl?: string;
  videoUrl?: string;
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
