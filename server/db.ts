import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, threads, messages, useCases, savedTemplates, apiKeys, feedback } from "../drizzle/schema";
import type { InsertApiKey } from "../drizzle/schema";
import type { InsertThread, InsertMessage, InsertUseCase, InsertSavedTemplate } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER QUERIES ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== THREAD QUERIES ====================

export async function createThread(data: InsertThread) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(threads).values(data);
  const result = await db.select().from(threads).where(eq(threads.uid, data.uid)).limit(1);
  return result[0];
}

export async function getThreadsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(threads).where(eq(threads.userId, userId)).orderBy(desc(threads.updatedAt));
}

export async function getThreadByUid(uid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(threads).where(eq(threads.uid, uid)).limit(1);
  return result[0];
}

export async function getThreadByShareToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(threads).where(and(eq(threads.shareToken, token), eq(threads.isPublic, true))).limit(1);
  return result[0];
}

export async function updateThread(uid: string, userId: number, data: Partial<InsertThread>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(threads).set(data).where(and(eq(threads.uid, uid), eq(threads.userId, userId)));
  return getThreadByUid(uid);
}

export async function deleteThread(uid: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const thread = await getThreadByUid(uid);
  if (!thread || thread.userId !== userId) return false;
  await db.delete(messages).where(eq(messages.threadId, thread.id));
  await db.delete(threads).where(eq(threads.uid, uid));
  return true;
}

export async function bulkDeleteThreads(uids: string[], userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let deleted = 0;
  for (const uid of uids) {
    const thread = await getThreadByUid(uid);
    if (!thread || thread.userId !== userId) continue;
    await db.delete(messages).where(eq(messages.threadId, thread.id));
    await db.delete(threads).where(eq(threads.uid, uid));
    deleted++;
  }
  return deleted;
}

export async function bulkUpdateThreads(uids: string[], userId: number, data: Partial<InsertThread>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let updated = 0;
  for (const uid of uids) {
    const thread = await getThreadByUid(uid);
    if (!thread || thread.userId !== userId) continue;
    await db.update(threads).set(data).where(eq(threads.uid, uid));
    updated++;
  }
  return updated;
}

export async function duplicateThread(uid: string, userId: number, newUid: string, newName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const original = await getThreadByUid(uid);
  if (!original) throw new Error("Thread not found");

  const newThread = await createThread({
    uid: newUid,
    userId,
    name: newName,
    businessName: original.businessName,
    businessUrl: original.businessUrl,
    businessContext: original.businessContext,
    industry: original.industry,
    messageType: original.messageType,
    profileName: original.profileName,
    profileImageUrl: original.profileImageUrl,
    isVerified: original.isVerified,
    phoneSettings: original.phoneSettings,
    isPublic: false,
    shareToken: null,
  });

  const originalMessages = await getMessagesByThread(original.id);
  for (const msg of originalMessages) {
    await createMessage({
      threadId: newThread.id,
      sortOrder: msg.sortOrder,
      direction: msg.direction,
      contentType: msg.contentType,
      content: msg.content,
      timestamp: msg.timestamp,
      isRead: msg.isRead,
    });
  }
  return newThread;
}

// ==================== MESSAGE QUERIES ====================

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(data);
  const insertId = result[0].insertId;
  const rows = await db.select().from(messages).where(eq(messages.id, insertId)).limit(1);
  return rows[0];
}

export async function getMessagesByThread(threadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.threadId, threadId)).orderBy(asc(messages.sortOrder));
}

export async function updateMessage(id: number, data: Partial<InsertMessage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(messages).set(data).where(eq(messages.id, id));
  const rows = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return rows[0];
}

export async function deleteMessage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(messages).where(eq(messages.id, id));
  return true;
}

export async function reorderMessages(threadId: number, messageIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (let i = 0; i < messageIds.length; i++) {
    await db.update(messages).set({ sortOrder: i }).where(and(eq(messages.id, messageIds[i]), eq(messages.threadId, threadId)));
  }
  return getMessagesByThread(threadId);
}

export async function bulkCreateMessages(threadId: number, msgs: Omit<InsertMessage, "threadId">[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (const msg of msgs) {
    await db.insert(messages).values({ ...msg, threadId });
  }
  return getMessagesByThread(threadId);
}

export async function clearThreadMessages(threadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(messages).where(eq(messages.threadId, threadId));
  return true;
}

// ==================== USE CASE QUERIES ====================

export async function getAllUseCases() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(useCases).orderBy(desc(useCases.createdAt));
}

export async function getUseCasesByIndustry(industry: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(useCases).where(eq(useCases.industry, industry));
}

export async function getUseCasesByType(messageType: "marketing" | "utility" | "authentication") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(useCases).where(eq(useCases.messageType, messageType));
}

export async function createUseCase(data: InsertUseCase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(useCases).values(data);
  return true;
}

// ==================== SAVED TEMPLATE QUERIES ====================

export async function getSavedTemplatesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedTemplates).where(eq(savedTemplates.userId, userId)).orderBy(desc(savedTemplates.updatedAt));
}

export async function getSavedTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(savedTemplates).where(eq(savedTemplates.id, id)).limit(1);
  return result[0];
}

export async function createSavedTemplate(data: InsertSavedTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(savedTemplates).values(data);
  const insertId = result[0].insertId;
  const rows = await db.select().from(savedTemplates).where(eq(savedTemplates.id, insertId)).limit(1);
  return rows[0];
}

export async function deleteSavedTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(savedTemplates).where(and(eq(savedTemplates.id, id), eq(savedTemplates.userId, userId)));
  return true;
}

export async function updateSavedTemplate(id: number, userId: number, data: Partial<InsertSavedTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(savedTemplates).set(data).where(and(eq(savedTemplates.id, id), eq(savedTemplates.userId, userId)));
  const rows = await db.select().from(savedTemplates).where(eq(savedTemplates.id, id)).limit(1);
  return rows[0];
}

export async function incrementTemplateUsage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(savedTemplates).set({ usageCount: sql`${savedTemplates.usageCount} + 1` }).where(eq(savedTemplates.id, id));
}

// ==================== API KEY QUERIES ====================

export async function createApiKey(data: InsertApiKey) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(apiKeys).values(data);
  const insertId = result[0].insertId;
  const rows = await db.select().from(apiKeys).where(eq(apiKeys.id, insertId)).limit(1);
  return rows[0];
}

export async function getApiKeysByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: apiKeys.id,
    name: apiKeys.name,
    keyPrefix: apiKeys.keyPrefix,
    lastUsedAt: apiKeys.lastUsedAt,
    isRevoked: apiKeys.isRevoked,
    createdAt: apiKeys.createdAt,
  }).from(apiKeys).where(and(eq(apiKeys.userId, userId), eq(apiKeys.isRevoked, false))).orderBy(desc(apiKeys.createdAt));
}

export async function getApiKeyByHash(keyHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(apiKeys).where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isRevoked, false))).limit(1);
  return result[0];
}

export async function revokeApiKey(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys).set({ isRevoked: true }).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
  return true;
}

export async function updateApiKeyLastUsed(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
}

// ==================== FEEDBACK QUERIES ====================

export async function insertFeedback(data: { text: string; sentiment?: "positive" | "neutral" | "negative" | null; pageUrl?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(feedback).values(data);
  return true;
}

// ==================== PLATFORM STATS ====================

export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return { totalTemplates: 0, totalMetamates: 0, totalCountries: 0, countries: [] as string[] };

  // Only count threads that have at least 1 message (excludes abandoned/test threads)
  const [templateCount] = await db.select({ count: sql<number>`COUNT(DISTINCT ${threads.id})` })
    .from(threads)
    .innerJoin(messages, eq(threads.id, messages.threadId));

  // Count all registered users ("Used by" = visited and logged in)
  const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);

  // Count countries of all registered users
  const countryRows = await db.select({ country: users.country }).from(users)
    .where(sql`${users.country} IS NOT NULL AND ${users.country} != 'Unknown'`)
    .groupBy(users.country);

  return {
    totalTemplates: Number(templateCount?.count || 0),
    totalMetamates: Number(userCount?.count || 0),
    totalCountries: countryRows.length,
    countries: countryRows.map(r => r.country).filter(Boolean) as string[],
  };
}

export async function updateUserCountry(userId: number, country: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ country }).where(eq(users.id, userId));
}
