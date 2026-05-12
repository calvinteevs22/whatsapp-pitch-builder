import { COOKIE_NAME } from "@shared/const";
import { getSeasonalMomentById } from "@shared/seasonalMoments";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  createThread, getThreadsByUser, getThreadByUid, updateThread, deleteThread,
  duplicateThread, getThreadByShareToken, bulkDeleteThreads, bulkUpdateThreads,
  createMessage, getMessagesByThread, updateMessage, deleteMessage, reorderMessages,
  bulkCreateMessages, clearThreadMessages,
  getAllUseCases, getUseCasesByIndustry, getUseCasesByType,
  getSavedTemplatesByUser, getSavedTemplateById, createSavedTemplate,
  updateSavedTemplate, deleteSavedTemplate, incrementTemplateUsage,
  createApiKey, getApiKeysByUser, revokeApiKey,
  insertFeedback,
  getPlatformStats,
  updateUserCountry,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { createHash, randomBytes } from "crypto";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";
import axios from "axios";
import { generateImage } from "./_core/imageGeneration";
import { resolveAllStockImages, getAlternatives } from "./stockImages";
import { buildIndustryExpertise } from "./industryExpertise";
import { buildSystemPrompt } from "./aiPromptHelpers";
import { deepCrawlWebsite, type BusinessProfile } from "./websiteCrawler";
import { getProxiedImageUrl, batchValidateImageUrls } from "./imageProxyRoute";
import { classifyAndExtractAssets, buildWorkflowPromptContext, type WorkflowExtractionResult } from "./workflowExtractor";
import { checkAndIncrementUsage, requiresPlan } from "./usage";

const branchConfigSchema = z.object({
  branchId: z.string(),
  branchPointSortOrder: z.number(),
  triggerValue: z.string(),
  label: z.string().optional(),
});

const messageContentSchema = z.object({
  type: z.enum(["text", "template", "interactive_buttons", "interactive_list", "image", "location", "document", "audio", "video", "carousel"]),
  branchConfig: branchConfigSchema.optional(),
  text: z.string().optional(),
  headerText: z.string().optional(),
  headerImageUrl: z.string().optional(),
  bodyText: z.string().optional(),
  footerText: z.string().optional(),
  imageUrl: z.string().optional(),
  imageDescription: z.string().optional(),
  videoUrl: z.string().optional(),
  videoDescription: z.string().optional(),
  videoPosterUrl: z.string().optional(),
  buttons: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(["quick_reply", "url", "phone"]).optional(),
  })).optional(),
  listSections: z.array(z.object({
    title: z.string(),
    rows: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
    })),
  })).optional(),
  listButtonText: z.string().optional(),
  caption: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationName: z.string().optional(),
  documentUrl: z.string().optional(),
  documentName: z.string().optional(),
  carouselCards: z.array(z.object({
    id: z.string(),
    imageUrl: z.string().optional(),
    imageDescription: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    price: z.string().optional(),
    buttonText: z.string(),
    buttonUrl: z.string().optional(),
  })).optional(),
  formatting: z.object({
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
  }).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== THREAD ROUTES ====================
  thread: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getThreadsByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ uid: z.string() }))
      .query(async ({ ctx, input }) => {
        const thread = await getThreadByUid(input.uid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found" });
        }
        const msgs = await getMessagesByThread(thread.id);
        return { thread, messages: msgs };
      }),

    getShared: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const thread = await getThreadByShareToken(input.token);
        if (!thread) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Shared thread not found" });
        }
        const msgs = await getMessagesByThread(thread.id);
        return { thread, messages: msgs };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        businessName: z.string().optional(),
        businessUrl: z.string().optional(),
        industry: z.string().optional(),
        messageType: z.enum(["marketing", "utility", "authentication"]).default("marketing"),
        profileName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Free tier: max 10 threads
        if (ctx.user.plan === "free") {
          const existingThreads = await getThreadsByUser(ctx.user.id);
          if (existingThreads.length >= 10) {
            throw new TRPCError({ code: "FORBIDDEN", message: "requires_plan:pro" });
          }
        }
        const uid = nanoid(12);
        return createThread({
          uid,
          userId: ctx.user.id,
          name: input.name,
          businessName: input.businessName || null,
          businessUrl: input.businessUrl || null,
          industry: input.industry || null,
          messageType: input.messageType,
          profileName: input.profileName || input.businessName || "Business",
          isVerified: true,
          isPublic: false,
          shareToken: null,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        uid: z.string(),
        name: z.string().optional(),
        businessName: z.string().optional(),
        businessUrl: z.string().optional(),
        businessContext: z.string().optional(),
        industry: z.string().optional(),
        messageType: z.enum(["marketing", "utility", "authentication"]).optional(),
        profileName: z.string().optional(),
        profileImageUrl: z.string().nullable().optional(),
        isVerified: z.boolean().optional(),
        phoneSettings: z.object({
          time: z.string().optional(),
          is24h: z.boolean().optional(),
          os: z.enum(["android", "ios"]).optional(),
        }).optional(),
        reminderMessages: z.array(z.object({
          id: z.string(),
          timing: z.enum(["24h_before", "1h_before", "30min_before", "on_day", "after_appointment"]),
          timingLabel: z.string(),
          direction: z.literal("outbound").default("outbound"),
          contentType: z.string(),
          content: messageContentSchema,
          enabled: z.boolean(),
          sortPosition: z.number().optional(),
        })).optional(),
        adCreative: z.object({
          enabled: z.boolean(),
          placement: z.enum(["facebook_feed", "instagram_feed", "instagram_story", "instagram_reels"]),
          format: z.enum(["single_image", "carousel", "video"]),
          headline: z.string(),
          primaryText: z.string(),
          ctaText: z.string(),
          mediaUrl: z.string(),
          carouselCards: z.array(z.object({
            id: z.string(),
            imageUrl: z.string(),
            headline: z.string(),
            description: z.string().optional(),
          })).optional(),
          brandName: z.string(),
          brandLogoUrl: z.string().optional(),
        }).nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { uid, ...data } = input;
        return updateThread(uid, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ uid: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return deleteThread(input.uid, ctx.user.id);
      }),

    duplicate: protectedProcedure
      .input(z.object({ uid: z.string(), newName: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const newUid = nanoid(12);
        const original = await getThreadByUid(input.uid);
        const newName = input.newName || `${original?.name || "Thread"} (Copy)`;
        return duplicateThread(input.uid, ctx.user.id, newUid, newName);
      }),

    bulkDelete: protectedProcedure
      .input(z.object({ uids: z.array(z.string()).min(1) }))
      .mutation(async ({ ctx, input }) => {
        const deleted = await bulkDeleteThreads(input.uids, ctx.user.id);
        return { deleted };
      }),

    bulkUpdate: protectedProcedure
      .input(z.object({
        uids: z.array(z.string()).min(1),
        industry: z.string().optional(),
        messageType: z.enum(["marketing", "utility", "authentication"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { uids, ...data } = input;
        const updated = await bulkUpdateThreads(uids, ctx.user.id, data);
        return { updated };
      }),

    toggleShare: protectedProcedure
      .input(z.object({ uid: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const thread = await getThreadByUid(input.uid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const isPublic = !thread.isPublic;
        const shareToken = isPublic ? nanoid(16) : null;
        return updateThread(input.uid, ctx.user.id, { isPublic, shareToken });
      }),

    exportHtml: protectedProcedure
      .input(z.object({ uid: z.string(), embedImages: z.boolean().optional() }))
      .query(async ({ ctx, input }) => {
        await requiresPlan(ctx.user.id, "pro");
        const thread = await getThreadByUid(input.uid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const msgs = await getMessagesByThread(thread.id);
        const exportOptions = {
          profileName: thread.profileName || thread.businessName || "Business",
          profileImageUrl: thread.profileImageUrl,
          isVerified: thread.isVerified,
          messages: msgs.map(m => ({
            id: m.id,
            direction: m.direction as "inbound" | "outbound",
            contentType: m.contentType,
            content: m.content as any,
            timestamp: m.timestamp,
            isRead: m.isRead,
          })),
          threadName: thread.name,
          industry: thread.industry || undefined,
          messageType: thread.messageType,
        };
        if (input.embedImages) {
          const { generateInteractiveHtmlWithEmbeddedImages } = await import("./exportHtml");
          const html = await generateInteractiveHtmlWithEmbeddedImages(exportOptions);
          return { html };
        } else {
          const { generateInteractiveHtml } = await import("./exportHtml");
          const html = generateInteractiveHtml(exportOptions);
          return { html };
        }
      }),

    exportPng: protectedProcedure
      .input(z.object({ uid: z.string() }))
      .query(async ({ ctx, input }) => {
        const thread = await getThreadByUid(input.uid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const msgs = await getMessagesByThread(thread.id);
        const { generateStaticHtmlForScreenshot } = await import("./exportHtml");
        const html = await generateStaticHtmlForScreenshot({
          profileName: thread.profileName || thread.businessName || "Business",
          profileImageUrl: thread.profileImageUrl,
          isVerified: thread.isVerified,
          messages: msgs.map(m => ({
            id: m.id,
            direction: m.direction as "inbound" | "outbound",
            contentType: m.contentType,
            content: m.content as any,
            timestamp: m.timestamp,
            isRead: m.isRead,
          })),
          threadName: thread.name,
          industry: thread.industry || undefined,
          messageType: thread.messageType,
        });
        const { htmlToScreenshot } = await import("./screenshot");
        const pngBuffer = await htmlToScreenshot(html);
        const base64Png = pngBuffer.toString('base64');
        return { png: base64Png };
      }),

    exportGif: protectedProcedure
      .input(z.object({ uid: z.string() }))
      .query(async ({ ctx, input }) => {
        const thread = await getThreadByUid(input.uid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const msgs = await getMessagesByThread(thread.id);
        const { generateInteractiveHtmlWithEmbeddedImages } = await import("./exportHtml");
        const html = await generateInteractiveHtmlWithEmbeddedImages({
          profileName: thread.profileName || thread.businessName || "Business",
          profileImageUrl: thread.profileImageUrl,
          isVerified: thread.isVerified,
          messages: msgs.map(m => ({
            id: m.id,
            direction: m.direction as "inbound" | "outbound",
            contentType: m.contentType,
            content: m.content as any,
            timestamp: m.timestamp,
            isRead: m.isRead,
          })),
          threadName: thread.name,
          industry: thread.industry || undefined,
          messageType: thread.messageType,
        });
        const { htmlToAnimatedGif } = await import("./gifGenerator");
        const gifBuffer = await htmlToAnimatedGif(html, msgs.length);
        const base64Gif = gifBuffer.toString('base64');
        return { gif: base64Gif };
      }),
  }),

  // ==================== IMAGE PROXY ====================
  imageProxy: router({
    fetch: publicProcedure
      .input(z.object({ url: z.string() }))
      .query(async ({ input }) => {
        try {
          const resp = await axios.get(input.url, { responseType: 'arraybuffer', timeout: 10000 });
          const base64 = Buffer.from(resp.data).toString('base64');
          const contentType = resp.headers['content-type'] || 'image/png';
          return { dataUrl: `data:${contentType};base64,${base64}` };
        } catch {
          return { dataUrl: null };
        }
      }),
  }),

  // ==================== IMAGE MANAGEMENT ====================
  image: router({
    // Get alternative stock images for swapping
    getAlternatives: protectedProcedure
      .input(z.object({
        currentUrl: z.string(),
        description: z.string().optional(),
      }))
      .query(({ input }) => {
        const alternatives = getAlternatives(input.currentUrl, input.description);
        return { alternatives };
      }),

    // Upload a custom image to S3
    upload: protectedProcedure
      .input(z.object({
        base64: z.string(),
        filename: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.base64, 'base64');
        const suffix = nanoid(8);
        const ext = input.filename.split('.').pop() || 'png';
        const key = `user-images/${ctx.user.id}/${suffix}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ==================== MESSAGE ROUTES ====================
  message: router({
    create: protectedProcedure
      .input(z.object({
        threadUid: z.string(),
        direction: z.enum(["inbound", "outbound"]),
        contentType: z.enum(["text", "template", "interactive_buttons", "interactive_list", "image", "location", "document", "audio", "video", "carousel"]).default("text"),
        content: messageContentSchema,
        timestamp: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const thread = await getThreadByUid(input.threadUid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const existing = await getMessagesByThread(thread.id);
        const maxOrder = existing.length > 0 ? Math.max(...existing.map(m => m.sortOrder)) : -1;
        return createMessage({
          threadId: thread.id,
          sortOrder: maxOrder + 1,
          direction: input.direction,
          contentType: input.contentType,
          content: input.content,
          timestamp: input.timestamp || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          isRead: true,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: messageContentSchema.optional(),
        contentType: z.enum(["text", "template", "interactive_buttons", "interactive_list", "image", "location", "document", "audio", "video", "carousel"]).optional(),
        direction: z.enum(["inbound", "outbound"]).optional(),
        timestamp: z.string().optional(),
        isRead: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateMessage(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteMessage(input.id);
      }),

    duplicate: protectedProcedure
      .input(z.object({
        threadUid: z.string(),
        messageId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const thread = await getThreadByUid(input.threadUid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const existing = await getMessagesByThread(thread.id);
        const source = existing.find(m => m.id === input.messageId);
        if (!source) throw new TRPCError({ code: "NOT_FOUND" });
        // Create the duplicate at the end first
        const maxOrder = Math.max(...existing.map(m => m.sortOrder));
        const newMsg = await createMessage({
          threadId: thread.id,
          sortOrder: maxOrder + 1,
          direction: source.direction,
          contentType: source.contentType,
          content: source.content as any,
          timestamp: source.timestamp || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          isRead: true,
        });
        // Now reorder to place it right after the source
        const sourceIdx = existing.findIndex(m => m.id === input.messageId);
        const newOrder = existing.map(m => m.id);
        newOrder.splice(sourceIdx + 1, 0, newMsg.id);
        await reorderMessages(thread.id, newOrder);
        return newMsg;
      }),

    reorder: protectedProcedure
      .input(z.object({
        threadUid: z.string(),
        messageIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const thread = await getThreadByUid(input.threadUid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return reorderMessages(thread.id, input.messageIds);
      }),

    fixInteractivity: protectedProcedure
      .input(z.object({ threadUid: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const thread = await getThreadByUid(input.threadUid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const existing = await getMessagesByThread(thread.id);
        if (existing.length === 0) return { fixed: 0, messages: [] };

        // Convert DB messages to the format enforceInteractivity expects
        const msgs = existing.map(m => ({
          direction: m.direction,
          contentType: m.contentType,
          content: (typeof m.content === 'string' ? JSON.parse(m.content as string) : m.content) as Record<string, any>,
          timestamp: m.timestamp,
        }));

        const fixed = enforceInteractivity(msgs);

        // Clear existing messages and re-create with fixed versions
        await clearThreadMessages(thread.id);
        const created = await bulkCreateMessages(
          thread.id,
          fixed.map((m: any, i: number) => ({
            sortOrder: i,
            direction: m.direction,
            contentType: m.content?.type || m.contentType,
            content: m.content,
            timestamp: m.timestamp || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            isRead: true,
          }))
        );

        console.log(`[Fix Interactivity] Fixed ${existing.length} -> ${created.length} messages for thread ${input.threadUid}`);
        return { fixed: created.length, messages: created };
      }),


    /**
     * Add a branch to a thread. Creates branched messages that appear when
     * a specific button/option is clicked at a branch point.
     */
    addBranch: protectedProcedure
      .input(z.object({
        threadUid: z.string(),
        branchPointSortOrder: z.number(),
        triggerValue: z.string(),
        branchId: z.string(),
        label: z.string().optional(),
        messages: z.array(z.object({
          direction: z.enum(["inbound", "outbound"]),
          contentType: z.string(),
          content: messageContentSchema,
          timestamp: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const thread = await getThreadByUid(input.threadUid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const existing = await getMessagesByThread(thread.id);
        const maxSortOrder = existing.reduce((max, m) => Math.max(max, m.sortOrder), 0);

        // Create branch messages with branchConfig embedded in content
        const branchMessages = input.messages.map((m, i) => ({
          sortOrder: maxSortOrder + 1 + i,
          direction: m.direction as "inbound" | "outbound",
          contentType: m.contentType as "text" | "template" | "interactive_buttons" | "interactive_list" | "image" | "location" | "document" | "audio" | "video" | "carousel",
          content: {
            ...m.content,
            branchConfig: {
              branchId: input.branchId,
              branchPointSortOrder: input.branchPointSortOrder,
              triggerValue: input.triggerValue,
              label: input.label || input.triggerValue,
            },
          },
          timestamp: m.timestamp || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          isRead: true,
        }));

        const created = await bulkCreateMessages(thread.id, branchMessages);
        console.log(`[Branching] Added ${branchMessages.length} messages to branch '${input.branchId}' for thread ${input.threadUid}`);
        return { branchId: input.branchId, messages: created };
      }),

    /**
     * Remove a branch from a thread (delete all messages with a specific branchId).
     */
    removeBranch: protectedProcedure
      .input(z.object({
        threadUid: z.string(),
        branchId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const thread = await getThreadByUid(input.threadUid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const existing = await getMessagesByThread(thread.id);
        let removedCount = 0;
        for (const msg of existing) {
          const content = typeof msg.content === 'string' ? JSON.parse(msg.content as string) : msg.content;
          if (content?.branchConfig?.branchId === input.branchId) {
            await deleteMessage(msg.id);
            removedCount++;
          }
        }

        console.log(`[Branching] Removed ${removedCount} messages from branch '${input.branchId}' for thread ${input.threadUid}`);
        return { removed: removedCount };
      }),

    /**
     * Get branch points for a thread - returns all interactive messages
     * that have branches defined.
     */
    getBranchPoints: protectedProcedure
      .input(z.object({ threadUid: z.string() }))
      .query(async ({ ctx, input }) => {
        const thread = await getThreadByUid(input.threadUid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const msgs = await getMessagesByThread(thread.id);
        const branchPointMap = new Map<number, { branchId: string; triggerValue: string; label: string; count: number }[]>();

        for (const msg of msgs) {
          const content = typeof msg.content === 'string' ? JSON.parse(msg.content as string) : msg.content;
          const bc = content?.branchConfig;
          if (!bc) continue;

          if (!branchPointMap.has(bc.branchPointSortOrder)) {
            branchPointMap.set(bc.branchPointSortOrder, []);
          }
          const branches = branchPointMap.get(bc.branchPointSortOrder)!;
          const existing = branches.find(b => b.branchId === bc.branchId);
          if (existing) {
            existing.count++;
          } else {
            branches.push({
              branchId: bc.branchId,
              triggerValue: bc.triggerValue,
              label: bc.label || bc.triggerValue,
              count: 1,
            });
          }
        }

        const branchPoints = [];
        for (const [sortOrder, branches] of Array.from(branchPointMap)) {
          const msg = msgs.find(m => m.sortOrder === sortOrder);
          if (!msg) continue;
          branchPoints.push({
            messageSortOrder: sortOrder,
            messageId: msg.id,
            branches,
          });
        }

        return branchPoints;
      }),
  }),

  // ==================== FILE UPLOAD ====================
  upload: router({
    file: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
        optimize: z.boolean().optional(), // When true, resize images to WhatsApp-optimal dimensions
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        let buffer = Buffer.from(input.fileData, "base64");
        let mimeType = input.mimeType;
        let ext = input.fileName.split(".").pop() || "bin";

        // Optimize images: resize to WhatsApp-optimal dimensions and compress
        const isImage = mimeType.startsWith("image/") && !mimeType.includes("gif");
        if (isImage && input.optimize !== false) {
          try {
            const sharp = (await import("sharp")).default;
            const metadata = await sharp(buffer).metadata();
            const maxDim = 1024; // WhatsApp recommended max dimension
            const needsResize = (metadata.width && metadata.width > maxDim) || (metadata.height && metadata.height > maxDim);

            let pipeline = sharp(buffer);
            if (needsResize) {
              pipeline = pipeline.resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true });
            }
            // Convert to JPEG for better compression (unless PNG with transparency)
            const hasAlpha = metadata.hasAlpha;
            if (hasAlpha) {
              buffer = Buffer.from(await pipeline.png({ quality: 85, compressionLevel: 9 }).toBuffer());
              mimeType = "image/png";
              ext = "png";
            } else {
              buffer = Buffer.from(await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer());
              mimeType = "image/jpeg";
              ext = "jpg";
            }
            console.log(`[Upload] Optimized image: ${metadata.width}x${metadata.height} → ${needsResize ? maxDim + 'x' + maxDim + ' (resized)' : 'kept size'}, ${(buffer.length / 1024).toFixed(0)}KB`);
          } catch (err: any) {
            console.warn(`[Upload] Image optimization failed, uploading original:`, err.message?.substring(0, 100));
            // Fall through with original buffer
          }
        }

        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const fileKey = `uploads/${ctx.user.id}/${Date.now()}-${randomSuffix}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, mimeType);
        return { url, fileKey, optimized: isImage, width: 1024, height: 1024 };
      }),
  }),

  // ==================== AI GENERATION ====================
  ai: router({
    generateFlow: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1),
        businessName: z.string().optional(),
        businessUrl: z.string().optional(),
        industry: z.string().optional(),
        subVertical: z.string().optional(),
        messageType: z.enum(["marketing", "utility", "authentication"]).default("marketing"),
        seasonalMoment: z.string().optional(),
        threadUid: z.string().optional(),
        // NEW: Business profile from deep crawl — enables hyper-personalized generation
        businessProfile: z.object({
          businessName: z.string(),
          industry: z.string(),
          description: z.string(),
          tagline: z.string().optional(),
          brandTone: z.string().optional(),
          logoUrl: z.string().optional(),
          heroImageUrl: z.string().optional(),
          products: z.array(z.object({
            name: z.string(),
            description: z.string(),
            price: z.string(),
            imageUrl: z.string(),
            category: z.string(),
          })).optional(),
          services: z.array(z.object({
            name: z.string(),
            description: z.string(),
            price: z.string(),
            imageUrl: z.string(),
            category: z.string(),
          })).optional(),
        }).optional(),
        // Client-uploaded assets (photos/videos) to use in the generated conversation
        clientAssets: z.array(z.object({
          url: z.string(),
          name: z.string(),
          type: z.enum(["image", "video"]),
        })).optional(),
        // Language for the generated conversation (Indian language support)
        language: z.enum(["en", "hi", "bn", "ta", "mr", "te", "ur", "id", "zh-CN", "zh-TW", "pt", "es"]).default("en"),
      }))
      .mutation(async ({ ctx, input }) => {
        await checkAndIncrementUsage(ctx.user.id);

        // Build context from business profile if available, otherwise try URL crawl
        let websiteContext = "";
        let productCatalog: Array<{name: string; description: string; price: string; imageUrl: string; category: string}> = [];
        let heroImageUrl = "";

        if (input.businessProfile) {
          // Use the pre-crawled business profile for hyper-personalized generation
          const bp = input.businessProfile;
          productCatalog = [...(bp.products || []), ...(bp.services || [])];
          heroImageUrl = bp.heroImageUrl || "";
          websiteContext = buildBusinessProfileContext(bp);
          console.log(`[AI Gen] Using business profile: ${bp.businessName}, ${productCatalog.length} products/services`);
        } else {
          // Fallback: try to crawl URL from prompt or businessUrl field
          const urlMatch = input.prompt.match(/https?:\/\/[^\s,]+/i) || (input.businessUrl ? [input.businessUrl] : null);
          if (urlMatch) {
            const url = urlMatch[0];
            try {
              console.log(`[AI Gen] No business profile provided, attempting deep crawl of ${url}`);
              const profile = await deepCrawlWebsite(url);
              productCatalog = [...profile.products, ...profile.services];
              heroImageUrl = profile.heroImageUrl;
              websiteContext = buildBusinessProfileContext({
                businessName: profile.businessName,
                industry: profile.industry,
                description: profile.description,
                tagline: profile.tagline,
                brandTone: profile.brandTone,
                logoUrl: profile.logoUrl,
                heroImageUrl: profile.heroImageUrl,
                products: profile.products,
                services: profile.services,
              });
              console.log(`[AI Gen] Deep crawl extracted ${productCatalog.length} products/services`);
            } catch (e) {
              // Crawl failed (bot protection, timeout, etc.) — inject minimal brand context from URL
              console.log(`[AI Gen] Deep crawl failed for ${url}, injecting brand context from URL`);
              try {
                const hostname = new URL(url).hostname.replace(/^www\./, "");
                const brandName = hostname.split(".")[0];
                // Capitalise first letter
                const brandNameFormatted = brandName.charAt(0).toUpperCase() + brandName.slice(1);
                websiteContext = `\n\n=== BRAND CONTEXT (website could not be crawled) ===\nBrand name: ${brandNameFormatted}\nWebsite: ${url}\nINSTRUCTION: Generate a conversation specifically for the ${brandNameFormatted} brand. Use the brand name in messages, reference their actual product lines and brand identity. Do NOT generate a generic template — this must feel like it is from ${brandNameFormatted}.\n=== END BRAND CONTEXT ===`;
              } catch {
                // URL parsing failed, continue without context
              }
            }
          }
        }

        // Build client asset context for the AI prompt
        // STEP 1: Classify uploaded images as workflow diagrams vs product images
        let clientAssetContext = "";
        let workflowContext = "";
        const clientAssets = input.clientAssets || [];
        let effectiveClientAssets = clientAssets; // May be filtered if workflow images are detected
        let extractedWorkflow: WorkflowExtractionResult | null = null;

        if (clientAssets.length > 0) {
          // Classify images: separate workflow diagrams from product images
          console.log(`[AI Gen] Classifying ${clientAssets.length} uploaded asset(s)...`);
          const classification = await classifyAndExtractAssets(
            clientAssets.map(a => ({ url: a.url, name: a.name, type: a.type as "image" | "video" }))
          );

          // If a workflow was detected, build workflow context for the AI prompt
          if (classification.extractedWorkflow && classification.extractedWorkflow.isWorkflow) {
            extractedWorkflow = classification.extractedWorkflow;
            workflowContext = buildWorkflowPromptContext(extractedWorkflow);
            console.log(`[AI Gen] Workflow detected: "${extractedWorkflow.journeyTitle}" with ${extractedWorkflow.totalTouchpoints} touchpoints`);
            
            // Use only product assets (not workflow images) for injection
            effectiveClientAssets = classification.productAssets.map(a => ({
              url: a.url,
              name: a.name,
              type: a.type,
            }));
            console.log(`[AI Gen] Separated: ${classification.workflowAssets.length} workflow image(s), ${effectiveClientAssets.length} product asset(s)`);
          } else {
            // No workflow detected — all images are product assets
            effectiveClientAssets = clientAssets;
          }

          // STEP 2: For remaining product assets, do vision-based descriptions
          const imageAssets = effectiveClientAssets.filter(a => a.type === "image");
          const videoAssets = effectiveClientAssets.filter(a => a.type === "video");

          const assetDescriptions: Map<string, string> = new Map();
          if (imageAssets.length > 0) {
            try {
              console.log(`[AI Gen] Analyzing ${imageAssets.length} product image(s) with vision API...`);
              const visionPromises = imageAssets.map(async (asset) => {
                try {
                  const visionResult = await invokeLLM({
                    messages: [
                      {
                        role: "system" as const,
                        content: "You are an image analyst for WhatsApp business messaging. Describe the image in 1-2 concise sentences focusing on: what product/service is shown, the setting/context, and any text/branding visible. Be specific and factual. This description will help an AI create a WhatsApp conversation demo featuring this image."
                      },
                      {
                        role: "user" as const,
                        content: [
                          { type: "image_url" as const, image_url: { url: asset.url, detail: "low" as const } },
                          { type: "text" as const, text: `Describe this business image (filename: ${asset.name}). What product, service, or scene does it show?` }
                        ]
                      }
                    ],
                  });
                  const rawContent = visionResult.choices?.[0]?.message?.content;
                  const description = typeof rawContent === "string" ? rawContent : "";
                  if (description) {
                    assetDescriptions.set(asset.url, description);
                    console.log(`[Vision] "${asset.name}" → ${description.substring(0, 80)}...`);
                  }
                } catch (err: any) {
                  console.warn(`[Vision] Failed to analyze "${asset.name}":`, err.message?.substring(0, 80));
                }
              });
              await Promise.all(visionPromises);
              console.log(`[AI Gen] Vision analysis complete: ${assetDescriptions.size}/${imageAssets.length} images described`);
            } catch (err: any) {
              console.warn(`[AI Gen] Vision analysis batch failed:`, err.message?.substring(0, 100));
            }
          }

          // Build client asset context only for product images (not workflow images)
          if (imageAssets.length > 0 || videoAssets.length > 0) {
            clientAssetContext = `\n\n=== CLIENT-PROVIDED ASSETS (USE THESE INSTEAD OF STOCK IMAGES) ===`;
            if (imageAssets.length > 0) {
              clientAssetContext += `\nClient uploaded ${imageAssets.length} product image(s). Use these REAL client images in the conversation:`;
              imageAssets.forEach((a, i) => {
                const visionDesc = assetDescriptions.get(a.url);
                clientAssetContext += `\n  Image ${i + 1}: "${a.name}" → URL: ${a.url}`;
                if (visionDesc) {
                  clientAssetContext += `\n    AI Description: ${visionDesc}`;
                }
              });
              clientAssetContext += `\nIMPORTANT: For image messages and carousel cards, use these EXACT URLs as imageUrl values instead of generating imageDescription.`;
              clientAssetContext += `\nFor template headerImageUrl, use the first client image URL directly (not GENERATE_IMAGE: prefix).`;
              clientAssetContext += `\nUse the AI descriptions above to write contextually relevant captions and message text that reference what's actually shown in each image.`;
            }
            if (videoAssets.length > 0) {
              clientAssetContext += `\nClient uploaded ${videoAssets.length} video(s):`;
              videoAssets.forEach((a, i) => {
                clientAssetContext += `\n  Video ${i + 1}: "${a.name}" → URL: ${a.url}`;
              });
              clientAssetContext += `\nUse these video URLs in video messages with videoUrl field.`;
            }
            clientAssetContext += `\n=== END CLIENT ASSETS ===\n`;
          }
          console.log(`[AI Gen] Including ${effectiveClientAssets.length} product assets in prompt${workflowContext ? ' + workflow context' : ''}`);
        }

        const systemPrompt = buildSystemPrompt(input.messageType, input.industry, input.language);
        const userPrompt = buildUserPrompt(input, input.seasonalMoment) + websiteContext + workflowContext + clientAssetContext;

        let parsed: any;
        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
          attempts++;
          try {
            const response = await invokeLLM({
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              max_tokens: 4096,
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "whatsapp_conversation",
                  strict: false,
                  schema: {
                    type: "object",
                    properties: {
                      threadName: { type: "string" },
                      profileName: { type: "string" },
                      businessContext: { type: "string" },
                      flowSteps: { type: "array", items: { type: "string" } },
                      messages: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            direction: { type: "string", enum: ["inbound", "outbound"] },
                            contentType: { type: "string" },
                            content: { type: "object" },
                            timestamp: { type: "string" },
                          },
                          required: ["direction", "contentType", "content", "timestamp"],
                        },
                      },
                      reminderMessages: { type: "array", items: { type: "object" } },
                    },
                    required: ["threadName", "profileName", "messages"],
                  },
                },
              },
            });

            const rawContent = response.choices[0].message.content as string || "{}";
            console.log(`[AI Gen] Attempt ${attempts}: response length=${rawContent.length}, finish_reason=${response.choices[0].finish_reason}`);
            parsed = tryParseJSON(rawContent);
            if (parsed && parsed.messages && parsed.messages.length > 0) break;
            console.log(`[AI Gen] Attempt ${attempts}: parsed but no messages, retrying`);
            parsed = null;
          } catch (err: any) {
            console.error(`[AI Gen] Attempt ${attempts} failed:`, err.message?.substring(0, 300));
            if (attempts >= maxAttempts) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to generate conversation flow. Please try again.",
              });
            }
          }
        }

        if (!parsed || !parsed.messages) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to parse AI response. Please try again with a simpler prompt.",
          });
        }

        // POST-PROCESS: Enforce true interactivity — every inbound message must follow an interactive outbound message
        parsed.messages = enforceInteractivity(parsed.messages);

        // POST-PROCESS: Sanitize any remaining bracket placeholders
        parsed.messages = sanitizePlaceholders(parsed.messages);

        // POST-PROCESS: Inject client-uploaded assets into messages (highest priority)
        // Use effectiveClientAssets (product images only, workflow images excluded)
        if (effectiveClientAssets.length > 0) {
          console.log(`[AI Gen] Injecting ${effectiveClientAssets.length} product assets into messages...`);
          injectClientAssets(parsed.messages, effectiveClientAssets);
        }

        // POST-PROCESS: Inject real product images from crawled website data
        // This now deep-validates images with GET requests to catch hotlink-protected URLs
        if (productCatalog.length > 0) {
          console.log(`[AI Gen] Injecting real product images from ${productCatalog.length} catalog items...`);
          await injectRealProductImages(parsed.messages, productCatalog, heroImageUrl);
        }

        // Determine if we have a client website context (URL provided or business profile)
        const hasClientWebsite = !!(input.businessProfile || input.businessUrl || websiteContext);
        const brandName = input.businessProfile?.businessName || input.businessName || parsed.profileName || "";

        // SYNCHRONOUS IMAGE GENERATION: Generate AI images BEFORE saving to DB
        // This ensures the user NEVER sees irrelevant stock placeholder images.
        // When a client URL is provided, we skip stock images entirely.
        const hasImageDescriptions = parsed.messages.some((m: any) => {
          const c = m.content;
          if (!c) return false;
          if (c.imageDescription) return true;
          if (c.videoDescription) return true;
          if (c.headerImageUrl && typeof c.headerImageUrl === 'string' && c.headerImageUrl.startsWith('GENERATE_IMAGE:')) return true;
          if (c.carouselCards && Array.isArray(c.carouselCards)) {
            return c.carouselCards.some((card: any) => card.imageDescription);
          }
          return false;
        });

        // Check which messages still need images (not already filled by crawled/client images)
        const needsAiImages = parsed.messages.some((m: any) => {
          const c = m.content;
          if (!c) return false;
          // Has imageDescription but no imageUrl yet (or imageUrl is from stock)
          if (c.imageDescription && !c.imageUrl) return true;
          if (c.imageDescription && !c._realImage) return true;
          // Has GENERATE_IMAGE prefix still unresolved
          if (c.headerImageUrl && typeof c.headerImageUrl === 'string' && c.headerImageUrl.startsWith('GENERATE_IMAGE:')) return true;
          // Carousel cards without real images
          if (c.carouselCards && Array.isArray(c.carouselCards)) {
            return c.carouselCards.some((card: any) => card.imageDescription && !card.imageUrl && !card._realImage);
          }
          return false;
        });

        if (needsAiImages || hasImageDescriptions) {
          console.log(`[AI Gen] Generating AI images SYNCHRONOUSLY (no stock placeholders)...${brandName ? ` (brand: ${brandName})` : ''}`);
          try {
            // Generate AI images for all messages that need them
            // This replaces imageDescription → imageUrl, GENERATE_IMAGE: → real URL, etc.
            await generateImagesForMessages(
              parsed.messages.map((m: any, i: number) => ({
                id: i, // temporary index-based ID
                content: m.content,
              })),
              brandName || undefined
            );
            // Apply generated URLs back to parsed.messages
            console.log(`[AI Gen] Synchronous image generation complete`);
          } catch (err: any) {
            console.error(`[AI Gen] Synchronous image generation failed, falling back to stock:`, err.message?.substring(0, 200));
            // If AI generation fails, fall back to stock images as last resort
            if (!hasClientWebsite) {
              resolveAllStockImages(parsed.messages, brandName || undefined, input.industry || undefined);
            }
          }
        }

        // For any messages that STILL don't have images after AI generation,
        // use stock images as final fallback (but ONLY if no client website was provided)
        if (!hasClientWebsite) {
          // Only resolve stock for messages that still have no image URL
          const stillNeedsImages = parsed.messages.some((m: any) => {
            const c = m.content;
            if (!c) return false;
            if (c.imageDescription && !c.imageUrl) return true;
            if (c.headerImageUrl && typeof c.headerImageUrl === 'string' && c.headerImageUrl.startsWith('GENERATE_IMAGE:')) return true;
            if (c.carouselCards && Array.isArray(c.carouselCards)) {
              return c.carouselCards.some((card: any) => card.imageDescription && !card.imageUrl);
            }
            return false;
          });
          if (stillNeedsImages) {
            console.log(`[AI Gen] Some images still missing after AI gen, resolving stock fallback...`);
            resolveAllStockImages(parsed.messages, brandName || undefined, input.industry || undefined);
          }
        } else {
          console.log(`[AI Gen] Client website provided — skipping stock images entirely`);
        }

        // CTWA INTENT DETECTION: Check if user wants a Click-to-WhatsApp ad journey
        const ctwaKeywords = /\b(ctwa|click.to.whatsapp|whatsapp.ad|ad.campaign|ad.entry|entry.point|click.to.wa|cta.ad|facebook.ad|instagram.ad|meta.ad|paid.ad|sponsored|ad.creative|ad.journey|end.to.end|full.journey)\b/i;
        const wantsCTWA = ctwaKeywords.test(input.prompt);
        let generatedAdCreative: any = null;

        if (wantsCTWA) {
          console.log(`[AI Gen] CTWA intent detected in prompt, auto-generating ad creative...`);
          try {
            // Find the best image from the generated messages
            let adHeroImage = heroImageUrl || '';
            if (!adHeroImage) {
              for (const msg of parsed.messages) {
                const c = msg.content;
                if (!c) continue;
                if (c.headerImageUrl && typeof c.headerImageUrl === 'string' && !c.headerImageUrl.startsWith('GENERATE_IMAGE:')) {
                  adHeroImage = c.headerImageUrl;
                  break;
                }
                if (c.imageUrl && typeof c.imageUrl === 'string') {
                  adHeroImage = c.imageUrl;
                  break;
                }
                if (c.carouselCards && Array.isArray(c.carouselCards)) {
                  const cardWithImage = c.carouselCards.find((card: any) => card.imageUrl);
                  if (cardWithImage) {
                    adHeroImage = cardWithImage.imageUrl;
                    break;
                  }
                }
              }
            }

            // Determine best placement from prompt
            let adPlacement: 'facebook_feed' | 'instagram_feed' | 'instagram_story' | 'instagram_reels' = 'facebook_feed';
            if (/instagram.story|ig.story/i.test(input.prompt)) adPlacement = 'instagram_story';
            else if (/instagram.reel|ig.reel/i.test(input.prompt)) adPlacement = 'instagram_reels';
            else if (/instagram|ig.feed/i.test(input.prompt)) adPlacement = 'instagram_feed';

            const adBrandName = input.businessName || parsed.profileName || 'Business';

            // Build conversation summary for ad context
            const adConversationSummary = parsed.messages.slice(0, 5).map((m: any) => {
              const c = m.content;
              return `[${m.direction}] ${c?.bodyText || c?.text || c?.headerText || m.contentType}`;
            }).join('\n');

            // Build product list from catalog
            const adProductList = productCatalog.slice(0, 6).map((p: any) =>
              `- ${p.name}: ${p.description || ''} (${p.price || 'N/A'})`
            ).join('\n') || 'No products available';

            const placementGuide: Record<string, string> = {
              facebook_feed: 'Facebook Feed ad (1.91:1 landscape image, headline max 40 chars, primary text max 125 chars)',
              instagram_feed: 'Instagram Feed ad (1:1 square image, headline max 40 chars, primary text as caption)',
              instagram_story: 'Instagram Story ad (9:16 vertical, bold headline overlay, short text)',
              instagram_reels: 'Instagram Reels ad (9:16 vertical, attention-grabbing, short punchy text)',
            };

            const adPrompt = `Generate a Click-to-WhatsApp (CTWA) ad creative for ${adBrandName}.

Placement: ${placementGuide[adPlacement]}
Industry: ${input.industry || 'General'}
Message type: ${input.messageType}

Products/Services:
${adProductList}

Conversation flow preview:
${adConversationSummary}

Generate a compelling ad creative with:
1. headline (max 40 chars) - attention-grabbing, action-oriented
2. primaryText (max 125 chars) - value proposition, urgency
3. ctaText - call to action button text (e.g., "Shop on WhatsApp", "Chat with us", "Get Offer Now")

Return JSON with: { "headline": "...", "primaryText": "...", "ctaText": "..." }`;

            const adResponse = await invokeLLM({
              messages: [
                { role: "system", content: "You are an expert Meta Ads copywriter specializing in Click-to-WhatsApp ads. Generate compelling, concise ad copy. Return only valid JSON." },
                { role: "user", content: adPrompt },
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "ad_creative",
                  strict: true,
                  schema: {
                    type: "object",
                    properties: {
                      headline: { type: "string", description: "Ad headline, max 40 chars" },
                      primaryText: { type: "string", description: "Ad primary text, max 125 chars" },
                      ctaText: { type: "string", description: "CTA button text" },
                    },
                    required: ["headline", "primaryText", "ctaText"],
                    additionalProperties: false,
                  },
                },
              },
            });

            const adGenerated = JSON.parse((adResponse.choices[0].message.content as string) || '{}');

            // Build carousel cards from products if available
            const topProducts = productCatalog.slice(0, 4);
            const carouselCards = topProducts.length >= 2 ? topProducts.map((p: any, i: number) => ({
              id: `card-${Date.now()}-${i}`,
              imageUrl: p.imageUrl ? getProxiedImageUrl(p.imageUrl) : '',
              headline: (p.name || '').slice(0, 40),
              description: p.price || p.description?.slice(0, 50) || '',
            })) : undefined;

            // Get the first CTA button text from the conversation to use as the ad CTA
            const firstCTA = parsed.messages.find((m: any) => {
              const c = m.content;
              return c?.buttons?.length > 0;
            });
            const conversationCTA = firstCTA?.content?.buttons?.[0]?.title;

            generatedAdCreative = {
              enabled: true,
              placement: adPlacement,
              format: (carouselCards && carouselCards.length >= 2 ? 'carousel' : 'single_image') as any,
              headline: adGenerated.headline || `Shop ${adBrandName}`,
              primaryText: adGenerated.primaryText || `Discover amazing products from ${adBrandName}`,
              ctaText: conversationCTA || adGenerated.ctaText || 'Send WhatsApp Message',
              mediaUrl: adHeroImage ? (adHeroImage.startsWith('/api/image-proxy') ? adHeroImage : getProxiedImageUrl(adHeroImage)) : '',
              carouselCards,
              brandName: adBrandName,
              brandLogoUrl: undefined,
            };

            console.log(`[AI Gen] CTWA ad creative generated: headline="${generatedAdCreative.headline}", mediaUrl=${generatedAdCreative.mediaUrl ? 'YES' : 'NONE'}`);
          } catch (err: any) {
            console.error(`[AI Gen] CTWA ad creative generation failed:`, err.message?.substring(0, 200));
            // Don't fail the whole generation — just skip the ad creative
          }
        }

        // Now save messages WITH images already resolved
        if (input.threadUid) {
          const thread = await getThreadByUid(input.threadUid);
          if (thread && thread.userId === ctx.user.id) {
            await clearThreadMessages(thread.id);
            const threadUpdate: any = {
              businessName: input.businessName || parsed.profileName,
              businessContext: parsed.businessContext,
              profileName: parsed.profileName,
              industry: input.industry || null,
              messageType: input.messageType,
            };
            // Save AI-generated reminder messages if present
            if (parsed.reminderMessages && Array.isArray(parsed.reminderMessages) && parsed.reminderMessages.length > 0) {
              threadUpdate.reminderMessages = parsed.reminderMessages;
              console.log(`[AI Gen] Saving ${parsed.reminderMessages.length} reminder messages`);
            }
            // Save CTWA ad creative if generated
            if (generatedAdCreative) {
              threadUpdate.adCreative = generatedAdCreative;
              console.log(`[AI Gen] Saving CTWA ad creative to thread`);
            }
            await updateThread(input.threadUid, ctx.user.id, threadUpdate);

            const msgs = parsed.messages.map((m: any, i: number) => ({
              sortOrder: i,
              direction: m.direction as "inbound" | "outbound",
              contentType: m.contentType,
              content: m.content,
              timestamp: m.timestamp,
              isRead: true,
            }));
            const savedMessages = await bulkCreateMessages(thread.id, msgs);

            // Return saved messages (with DB IDs) so the frontend can render immediately
            parsed.savedMessages = savedMessages;
          }
        }

        // Images are already generated — no background polling needed
        return { ...parsed, imagesGenerating: false, savedMessages: parsed.savedMessages || null, adCreative: generatedAdCreative };
      }),

    crawlWebsite: protectedProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        await requiresPlan(ctx.user.id, "pro");
        try {
          console.log(`[CrawlWebsite] Deep crawling ${input.url}`);
          const profile = await deepCrawlWebsite(input.url);
          console.log(`[CrawlWebsite] Extracted ${profile.products.length} products, ${profile.services.length} services`);

          // Return the full business profile with products, services, images
          return {
            businessName: profile.businessName,
            industry: profile.industry,
            description: profile.description,
            tagline: profile.tagline,
            targetAudience: profile.targetAudience,
            brandTone: profile.brandTone,
            logoUrl: profile.logoUrl,
            heroImageUrl: profile.heroImageUrl,
            products: profile.products.map(p => ({
              name: p.name,
              description: p.description,
              price: p.price,
              imageUrl: p.imageUrl,
              category: p.category,
            })),
            services: profile.services.map(s => ({
              name: s.name,
              description: s.description,
              price: s.price,
              imageUrl: s.imageUrl,
              category: s.category,
            })),
            contactInfo: profile.contactInfo,
            socialProof: profile.socialProof,
            suggestedUseCases: profile.suggestedUseCases,
            // Legacy compat: flatten products to string array
            productsList: [
              ...profile.products.map(p => p.name),
              ...profile.services.map(s => s.name),
            ],
            // Auto-detected language from the website
            detectedLanguage: profile.detectedLanguage || "en",
          };
        } catch (error: any) {
          console.error(`[CrawlWebsite] Failed:`, error.message?.substring(0, 200));
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to analyze website. Please try again.",
          });
        }
      }),

    generateAdCreative: protectedProcedure
      .input(z.object({
        threadUid: z.string(),
        businessName: z.string(),
        businessUrl: z.string().optional(),
        industry: z.string().optional(),
        messageType: z.enum(["marketing", "utility", "authentication"]).default("marketing"),
        crawlData: z.any().optional(),
        placement: z.enum(["facebook_feed", "instagram_feed", "instagram_story", "instagram_reels"]).default("facebook_feed"),
      }))
      .mutation(async ({ ctx, input }) => {
        await requiresPlan(ctx.user.id, "pro");
        const thread = await getThreadByUid(input.threadUid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found" });
        }

        // Get the conversation messages to understand context
        const messages = await getMessagesByThread(thread.id);
        const conversationSummary = messages.slice(0, 5).map(m => {
          const c = m.content as any;
          return `[${m.direction}] ${c.bodyText || c.text || c.headerText || m.contentType}`;
        }).join('\n');

        // Build crawl context for the LLM
        const crawl = input.crawlData;
        const productList = crawl?.products?.slice(0, 6)?.map((p: any) =>
          `- ${p.name}: ${p.description || ''} (${p.price || 'N/A'}) [image: ${p.imageUrl || 'none'}]`
        ).join('\n') || 'No products available';

        // Extract the best available image for the ad:
        // Priority: 1) crawl heroImageUrl, 2) first crawl product image, 3) first message header image
        let heroImage = crawl?.heroImageUrl || '';
        let logoUrl = crawl?.logoUrl || '';

        // Try crawl product images
        if (!heroImage && crawl?.products?.length) {
          const firstWithImage = crawl.products.find((p: any) => p.imageUrl && p.imageUrl.startsWith('http'));
          if (firstWithImage) heroImage = firstWithImage.imageUrl;
        }

        // Fallback: extract images from existing conversation messages
        if (!heroImage) {
          for (const msg of messages) {
            const c = msg.content as any;
            // Check for header images in template messages
            if (c?.headerImageUrl) {
              heroImage = c.headerImageUrl;
              break;
            }
            // Check for image messages
            if (msg.contentType === 'image' && c?.imageUrl) {
              heroImage = c.imageUrl;
              break;
            }
            // Check carousel card images
            if (c?.cards?.length) {
              const cardWithImage = c.cards.find((card: any) => card.imageUrl);
              if (cardWithImage) {
                heroImage = cardWithImage.imageUrl;
                break;
              }
            }
          }
        }

        console.log(`[GenerateAdCreative] heroImage: ${heroImage ? heroImage.substring(0, 80) + '...' : 'NONE'}`);

        // Build carousel cards from products if available
        const products = crawl?.products || [];
        const topProducts = products.slice(0, 4);

        const placementGuide: Record<string, string> = {
          facebook_feed: 'Facebook Feed ad (1.91:1 landscape image, headline max 40 chars, primary text max 125 chars)',
          instagram_feed: 'Instagram Feed ad (1:1 square image, headline max 40 chars, primary text as caption)',
          instagram_story: 'Instagram Story ad (9:16 vertical, bold headline overlay, short text)',
          instagram_reels: 'Instagram Reels ad (9:16 vertical, attention-grabbing, short punchy text)',
        };

        const prompt = `Generate a Click-to-WhatsApp (CTWA) ad creative for ${input.businessName}.

Placement: ${placementGuide[input.placement] || input.placement}
Industry: ${input.industry || 'General'}
Message type: ${input.messageType}
Business URL: ${input.businessUrl || 'N/A'}

Products/Services:
${productList}

Conversation flow preview:
${conversationSummary}

Generate a compelling ad creative with:
1. headline (max 40 chars) - attention-grabbing, action-oriented
2. primaryText (max 125 chars) - value proposition, urgency
3. ctaText - call to action button text (e.g., "Shop on WhatsApp", "Chat with us", "Get Offer Now")

Return JSON with: { "headline": "...", "primaryText": "...", "ctaText": "..." }`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are an expert Meta Ads copywriter specializing in Click-to-WhatsApp ads. Generate compelling, concise ad copy. Return only valid JSON." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "ad_creative",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    headline: { type: "string", description: "Ad headline, max 40 chars" },
                    primaryText: { type: "string", description: "Ad primary text, max 125 chars" },
                    ctaText: { type: "string", description: "CTA button text" },
                  },
                  required: ["headline", "primaryText", "ctaText"],
                  additionalProperties: false,
                },
              },
            },
          });

          const generated = JSON.parse((response.choices[0].message.content as string) || '{}');

          // Build carousel cards from crawled products
          const carouselCards = topProducts.length >= 2 ? topProducts.map((p: any, i: number) => ({
            id: `card-${Date.now()}-${i}`,
            imageUrl: p.imageUrl ? getProxiedImageUrl(p.imageUrl) : '',
            headline: (p.name || '').slice(0, 40),
            description: p.price || p.description?.slice(0, 50) || '',
          })) : undefined;

          const adCreative = {
            enabled: true,
            placement: input.placement,
            format: (carouselCards && carouselCards.length >= 2 ? 'carousel' : 'single_image') as any,
            headline: generated.headline || `Shop ${input.businessName}`,
            primaryText: generated.primaryText || `Discover amazing products from ${input.businessName}`,
            ctaText: generated.ctaText || 'Send WhatsApp Message',
            mediaUrl: heroImage ? (heroImage.startsWith('/api/image-proxy') ? heroImage : getProxiedImageUrl(heroImage)) : '',
            carouselCards,
            brandName: input.businessName,
            brandLogoUrl: logoUrl ? (logoUrl.startsWith('/api/image-proxy') ? logoUrl : getProxiedImageUrl(logoUrl)) : undefined,
          };

          console.log(`[GenerateAdCreative] Final mediaUrl: ${adCreative.mediaUrl ? adCreative.mediaUrl.substring(0, 80) : 'NONE'}`);

          // Save to thread
          await updateThread(input.threadUid, ctx.user.id, { adCreative } as any);

          return adCreative;
        } catch (error: any) {
          console.error('[GenerateAdCreative] Failed:', error.message?.substring(0, 200));
          // Return a sensible default even on LLM failure
          const fallbackAd = {
            enabled: true,
            placement: input.placement,
            format: 'single_image' as const,
            headline: `Shop ${input.businessName} on WhatsApp`,
            primaryText: `Discover our latest products and get instant support. Chat with us now!`,
            ctaText: 'Send WhatsApp Message',
            mediaUrl: heroImage ? (heroImage.startsWith('/api/image-proxy') ? heroImage : getProxiedImageUrl(heroImage)) : '',
            brandName: input.businessName,
            brandLogoUrl: logoUrl ? (logoUrl.startsWith('/api/image-proxy') ? logoUrl : getProxiedImageUrl(logoUrl)) : undefined,
          };
          await updateThread(input.threadUid, ctx.user.id, { adCreative: fallbackAd } as any);
          return fallbackAd;
        }
      }),
  }),

  // ==================== USE CASES ====================
  useCase: router({
    list: publicProcedure
      .input(z.object({
        industry: z.string().optional(),
        messageType: z.enum(["marketing", "utility", "authentication"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        if (input?.industry) return getUseCasesByIndustry(input.industry);
        if (input?.messageType) return getUseCasesByType(input.messageType);
        return getAllUseCases();
      }),
  }),

  // ==================== SAVED TEMPLATES ====================
  savedTemplate: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getSavedTemplatesByUser(ctx.user.id);
      }),

    save: protectedProcedure
      .input(z.object({
        threadUid: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const thread = await getThreadByUid(input.threadUid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const msgs = await getMessagesByThread(thread.id);
        const snapshot = msgs.map(m => ({
          direction: m.direction,
          contentType: m.contentType,
          content: m.content as any,
          timestamp: m.timestamp || "12:00 PM",
        }));
        return createSavedTemplate({
          userId: ctx.user.id,
          name: input.name,
          description: input.description || thread.businessContext || "",
          industry: thread.industry,
          messageType: thread.messageType,
          profileName: thread.profileName,
          businessContext: thread.businessContext,
          messagesSnapshot: snapshot,
          tags: input.tags || [],
          sourceThreadUid: thread.uid,
        });
      }),

    updateSnapshot: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        threadUid: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const template = await getSavedTemplateById(input.templateId);
        if (!template || template.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const thread = await getThreadByUid(input.threadUid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const msgs = await getMessagesByThread(thread.id);
        const snapshot = msgs.map(m => ({
          direction: m.direction,
          contentType: m.contentType,
          content: m.content as any,
          timestamp: m.timestamp || "12:00 PM",
        }));
        return updateSavedTemplate(input.templateId, ctx.user.id, {
          name: thread.name,
          description: thread.businessContext || template.description,
          industry: thread.industry,
          messageType: thread.messageType,
          profileName: thread.profileName,
          businessContext: thread.businessContext,
          messagesSnapshot: snapshot,
          sourceThreadUid: thread.uid,
        });
      }),

    applyToThread: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        threadUid: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const template = await getSavedTemplateById(input.templateId);
        if (!template || template.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const thread = await getThreadByUid(input.threadUid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        // Clear existing messages and apply template
        await clearThreadMessages(thread.id);
        if (template.messagesSnapshot) {
          await bulkCreateMessages(thread.id, template.messagesSnapshot.map((m: any, i: number) => ({
            sortOrder: i,
            direction: m.direction,
            contentType: m.contentType,
            content: m.content,
            timestamp: m.timestamp,
            isRead: true,
          })));
        }
        // Update thread metadata
        await updateThread(input.threadUid, ctx.user.id, {
          profileName: template.profileName,
          businessContext: template.businessContext,
          industry: template.industry,
          messageType: template.messageType,
        });
        await incrementTemplateUsage(input.templateId);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteSavedTemplate(input.id, ctx.user.id);
      }),

    useTemplate: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const template = await getSavedTemplateById(input.templateId);
        if (!template || template.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        // Create a new thread from the template
        const thread = await createThread({
          uid: nanoid(12),
          userId: ctx.user.id,
          name: template.name,
          messageType: template.messageType || "marketing",
          industry: template.industry || undefined,
          profileName: template.profileName || undefined,
          businessContext: template.businessContext || undefined,
        });
        // Apply template messages
        if (template.messagesSnapshot) {
          await bulkCreateMessages(thread.id, (template.messagesSnapshot as any[]).map((m: any, i: number) => ({
            sortOrder: i,
            direction: m.direction,
            contentType: m.contentType,
            content: m.content,
            timestamp: m.timestamp,
            isRead: true,
          })));
        }
        await incrementTemplateUsage(input.templateId);
        // Link the template to this new thread so future edits go to this thread
        await updateSavedTemplate(input.templateId, ctx.user.id, {
          sourceThreadUid: thread.uid,
        });
        return thread;
      }),
  }),

  // ==================== EXPORT PPT ====================
  export: router({
    pptData: protectedProcedure
      .input(z.object({ threadUid: z.string() }))
      .query(async ({ ctx, input }) => {
        const thread = await getThreadByUid(input.threadUid);
        if (!thread || thread.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const msgs = await getMessagesByThread(thread.id);
        // Generate a PNG screenshot for the slide
        let screenshotBase64 = "";
        try {
          const { htmlToScreenshot } = await import("./screenshot");
          const { generateStaticHtmlForScreenshot } = await import("./exportHtml");
          const html = await generateStaticHtmlForScreenshot({
            threadName: thread.name,
            profileName: thread.profileName || "Business",
            isVerified: thread.isVerified,
            messages: msgs.map(m => ({
              id: m.id,
              direction: m.direction,
              contentType: m.contentType,
              content: m.content as any,
              timestamp: m.timestamp || "",
              isRead: m.isRead,
            })),
          });
          const screenshotBuffer = await htmlToScreenshot(html);
          screenshotBase64 = screenshotBuffer.toString("base64");
        } catch (e) {
          console.error("[Export] Screenshot generation failed:", e);
        }
        return {
          thread: {
            name: thread.name,
            businessName: thread.businessName,
            businessContext: thread.businessContext,
            industry: thread.industry,
            messageType: thread.messageType,
            profileName: thread.profileName,
          },
          messages: msgs.map(m => ({
            direction: m.direction,
            contentType: m.contentType,
            content: m.content,
            timestamp: m.timestamp,
          })),
          screenshotBase64,
        };
      }),
  }),

  // ==================== API KEY MANAGEMENT ====================
  apiKey: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getApiKeysByUser(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(100) }))
      .mutation(async ({ ctx, input }) => {
        // Generate a random API key: pk_ + 40 hex chars
        const rawKey = `pk_${randomBytes(20).toString("hex")}`;
        const keyHash = createHash("sha256").update(rawKey).digest("hex");
        const keyPrefix = rawKey.substring(0, 10);

        const record = await createApiKey({
          userId: ctx.user.id,
          name: input.name,
          keyHash,
          keyPrefix,
        });

        // Return the raw key ONCE — it won't be stored or shown again
        return {
          id: record.id,
          name: record.name,
          key: rawKey,
          keyPrefix,
          createdAt: record.createdAt,
        };
      }),

    revoke: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return revokeApiKey(input.id, ctx.user.id);
      }),
  }),

  // ==================== ANONYMOUS FEEDBACK ====================
  feedback: router({
    submit: publicProcedure
      .input(z.object({
        text: z.string().min(1).max(2000),
        sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
        pageUrl: z.string().max(1024).optional(),
      }))
      .mutation(async ({ input }) => {
        await insertFeedback({
          text: input.text,
          sentiment: input.sentiment ?? null,
          pageUrl: input.pageUrl ?? null,
        });
        // Notify owner of new feedback
        try {
          const sentimentEmoji = input.sentiment === "positive" ? "\u{1F60A}" : input.sentiment === "negative" ? "\u{1F615}" : "\u{1F44D}";
          await notifyOwner({
            title: `New Feedback ${sentimentEmoji}`,
            content: `${input.text}\n\nPage: ${input.pageUrl || "Unknown"}\nSentiment: ${input.sentiment || "Not specified"}`,
          });
        } catch (e) {
          // Non-critical — don't fail the submission if notification fails
          console.warn("[Feedback] Failed to notify owner:", e);
        }
        return { success: true };
      }),
  }),

  // ==================== FILE EXPORT (S3 upload for reliable downloads) ====================
  fileExport: router({
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        base64Data: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import('./storage');
        const { nanoid } = await import('nanoid');
        const fileKey = `exports/${ctx.user.openId}/${nanoid(10)}-${input.fileName}`;
        const buffer = Buffer.from(input.base64Data, 'base64');
        const { url } = await storagePut(fileKey, buffer, input.contentType);
        return { url };
      }),
  }),

  // ==================== PLATFORM STATS ====================
  platform: router({
    stats: publicProcedure.query(async () => {
      return getPlatformStats();
    }),
    updateCountry: protectedProcedure
      .input(z.object({ country: z.string().min(1).max(100) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserCountry(ctx.user.id, input.country);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// ==================== HELPER FUNCTIONS ====================

/**
 * Attempt to parse JSON, with recovery for truncated responses.
 * Tries: direct parse → fix truncated arrays/objects → extract JSON substring
 */
function tryParseJSON(raw: string): any | null {
  // Clean the raw string - remove markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  // 1. Direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log(`[AI Gen] Direct parse failed: ${(e as Error).message?.substring(0, 100)}`);
  }

  // 2. Try to fix truncated JSON by properly tracking string context
  let fixed = cleaned;
  // If truncated mid-string, close the string
  let inString = false;
  let escaped = false;
  for (let i = 0; i < fixed.length; i++) {
    if (escaped) { escaped = false; continue; }
    if (fixed[i] === '\\') { escaped = true; continue; }
    if (fixed[i] === '"') inString = !inString;
  }
  if (inString) fixed += '"';
  // Remove trailing comma
  fixed = fixed.replace(/,\s*$/, "");
  // Count brackets properly (outside strings)
  let braceCount = 0, bracketCount = 0;
  inString = false; escaped = false;
  for (let i = 0; i < fixed.length; i++) {
    if (escaped) { escaped = false; continue; }
    if (fixed[i] === '\\') { escaped = true; continue; }
    if (fixed[i] === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (fixed[i] === '{') braceCount++;
    else if (fixed[i] === '}') braceCount--;
    else if (fixed[i] === '[') bracketCount++;
    else if (fixed[i] === ']') bracketCount--;
  }
  for (let i = 0; i < bracketCount; i++) fixed += ']';
  for (let i = 0; i < braceCount; i++) fixed += '}';
  try {
    const result = JSON.parse(fixed);
    console.log(`[AI Gen] Fixed truncated JSON successfully`);
    return result;
  } catch (e) {
    console.log(`[AI Gen] Fixed parse failed: ${(e as Error).message?.substring(0, 100)}`);
  }

  // 3. Try extracting JSON from the first { to the last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch (_) {}
  }

  console.error("[AI Gen] Could not parse JSON, length:", cleaned.length, "first 200 chars:", cleaned.substring(0, 200));
  return null;
}

async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WAThreadBuilder/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      maxRedirects: 3,
    });

    const html = response.data as string;

    // Extract text content from HTML
    let text = html
      // Remove scripts and styles
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      // Remove HTML tags
      .replace(/<[^>]+>/g, " ")
      // Decode HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, " ")
      .trim();

    // Also extract meta tags for additional context
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);

    let metadata = "";
    if (titleMatch) metadata += `Title: ${titleMatch[1]}\n`;
    if (descMatch) metadata += `Description: ${descMatch[1]}\n`;
    if (ogTitleMatch) metadata += `OG Title: ${ogTitleMatch[1]}\n`;
    if (ogDescMatch) metadata += `OG Description: ${ogDescMatch[1]}\n`;

    // Extract image URLs for potential use
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*/gi;
    const images: string[] = [];
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null && images.length < 5) {
      let imgUrl = imgMatch[1];
      if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
      else if (imgUrl.startsWith("/")) {
        const urlObj = new URL(url);
        imgUrl = urlObj.origin + imgUrl;
      }
      if (imgUrl.startsWith("http") && !imgUrl.includes("data:") && !imgUrl.includes("svg")) {
        images.push(imgUrl);
      }
    }

    if (images.length > 0) {
      metadata += `Key Images: ${images.join(", ")}\n`;
    }

    return metadata + "\n" + text.substring(0, 4000);
  } catch (error) {
    return "";
  }
}


/**
 * Post-process AI messages: generate real images for all imageDescription fields.
 * Runs image generation in parallel for efficiency (up to 6 images at once).
 */
async function generateImagesForMessages(messages: any[], brandContext?: string): Promise<any[]> {
  const imageJobs: Array<{ msgIdx: number; cardIdx?: number; field: string; description: string }> = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const content = msg.content;

    // Template header image with GENERATE_IMAGE: prefix (not yet resolved to stock)
    // Skip if already has a real image from crawled data
    if (content.headerImageUrl && content.headerImageUrl.startsWith("GENERATE_IMAGE:") && !content._realImage) {
      const desc = content.headerImageUrl.replace("GENERATE_IMAGE:", "").trim();
      imageJobs.push({ msgIdx: i, field: "headerImageUrl", description: desc });
    }
    // Template header that was already resolved to a stock image but has _headerImageDescription
    // This means the header had GENERATE_IMAGE: prefix, got a stock image, and needs AI replacement
    // Skip if already has a real image from crawled data
    else if (content._headerImageDescription && !content._realImage && !content._clientAsset) {
      imageJobs.push({ msgIdx: i, field: "headerImageUrl", description: content._headerImageDescription });
    }

    // Image message with imageDescription — skip if already has a real image
    if (content.imageDescription && !content._realImage && !content._clientAsset) {
      // Skip if already has a valid imageUrl from crawled data
      if (content.imageUrl && typeof content.imageUrl === 'string' && content.imageUrl.startsWith('http')) {
        // Already has a real image, skip AI generation
      } else {
        imageJobs.push({ msgIdx: i, field: "imageUrl", description: content.imageDescription });
      }
    }

    // Video message with videoDescription (generate a poster/thumbnail)
    if (content.videoDescription) {
      imageJobs.push({ msgIdx: i, field: "videoPosterUrl", description: `video thumbnail: ${content.videoDescription}` });
    }

    // Carousel cards with imageDescription — skip cards that already have real/valid images
    if (content.carouselCards && Array.isArray(content.carouselCards)) {
      for (let j = 0; j < content.carouselCards.length; j++) {
        const card = content.carouselCards[j];
        // Skip if card already has a real image from crawled data or client assets
        if (card._realImage || card._clientAsset) continue;
        // Skip if card already has a valid imageUrl (not a placeholder)
        if (card.imageUrl && typeof card.imageUrl === 'string' && card.imageUrl.startsWith('http') && !card.imageUrl.startsWith('GENERATE_IMAGE:')) continue;
        if (card.imageDescription) {
          imageJobs.push({ msgIdx: i, cardIdx: j, field: "imageUrl", description: card.imageDescription });
        }
      }
    }
  }

  if (imageJobs.length === 0) {
    console.log(`[AI Gen] No images to generate`);
    return messages;
  }

  console.log(`[AI Gen] Generating ${imageJobs.length} images${brandContext ? ` (brand: ${brandContext})` : ''}...`);
  for (const job of imageJobs) { console.log(`[AI Gen]   Job: msg[${job.msgIdx}] field=${job.field}${job.cardIdx !== undefined ? ` card[${job.cardIdx}]` : ""} desc="${job.description.substring(0, 80)}"`); }

  // Generate images in parallel (batch of up to 6)
  const results = await Promise.allSettled(
    imageJobs.map(async (job) => {
      try {
        // Include brand context in the prompt for brand-appropriate images
        const brandPrefix = brandContext ? `${brandContext} brand, ` : '';
        const { url } = await generateImage({
          prompt: `${brandPrefix}Professional product photography, clean white/light background, high quality commercial photo: ${job.description}. IMPORTANT: This image must represent the ${brandContext || 'specified'} brand specifically, not any competitor brand.`,
        });
        return { ...job, url };
      } catch (err: any) {
        console.error(`[AI Gen] Image gen failed for "${job.description.substring(0, 50)}":`, err.message?.substring(0, 100));
        return { ...job, url: null };
      }
    })
  );

  // Apply generated URLs back to messages
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.url) {
      const { msgIdx, cardIdx, field, url } = result.value;
      if (cardIdx !== undefined) {
        messages[msgIdx].content.carouselCards[cardIdx][field] = url;
      } else {
        messages[msgIdx].content[field] = url;
      }
    }
  }

  return messages;
}

/**
 * Post-process AI messages to enforce true interactivity.
 * If a customer (inbound) message follows a non-interactive business message,
 * convert the preceding business message to include interactive buttons.
 */
function enforceInteractivity(messages: any[]): any[] {
  if (!messages || messages.length === 0) return messages;

  // Helper: check if a message has interactive elements
  function isInteractive(m: any): boolean {
    const c = m.content;
    if (!c) return false;
    // Template with buttons counts as interactive
    if ((c.type === "template" || m.contentType === "template") && c.buttons && c.buttons.length > 0) return true;
    // Interactive buttons
    if (c.buttons && c.buttons.length > 0) return true;
    // Interactive list
    if (c.type === "interactive_list" && c.listSections && c.listSections.length > 0) return true;
    // Carousel with cards
    if (c.type === "carousel" && c.carouselCards && c.carouselCards.length > 0) return true;
    return false;
  }

  // Pass 1: Remove any leading inbound messages (customer can't speak first)
  while (messages.length > 0 && messages[0].direction === "inbound") {
    console.log(`[AI Gen] Enforcing interactivity: removing leading inbound message`);
    messages.shift();
  }

  // Pass 2: Remove consecutive inbound messages (keep only the first)
  for (let i = messages.length - 1; i > 0; i--) {
    if (messages[i].direction === "inbound" && messages[i - 1].direction === "inbound") {
      console.log(`[AI Gen] Enforcing interactivity: removing consecutive inbound at index ${i}`);
      messages.splice(i, 1);
    }
  }

  // Pass 3: For each inbound message, ensure the immediately preceding outbound is interactive
  for (let i = 1; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.direction !== "inbound") continue;

    // Find the immediately preceding outbound message
    let prevOutboundIdx = -1;
    for (let j = i - 1; j >= 0; j--) {
      if (messages[j].direction === "outbound") {
        prevOutboundIdx = j;
        break;
      }
    }

    if (prevOutboundIdx === -1) continue;

    const prevMsg = messages[prevOutboundIdx];
    
    if (isInteractive(prevMsg)) continue; // Already interactive — good!

    // The preceding outbound message is NOT interactive — add buttons to it
    console.log(`[AI Gen] Enforcing interactivity: adding buttons to message ${prevOutboundIdx} (type=${prevMsg.contentType}) before inbound message ${i}`);

    const content = prevMsg.content;
    
    // Extract the customer's reply text to create a matching button
    const customerText = msg.content?.text || msg.content?.bodyText || "Continue";
    const buttonTitle = customerText.length > 20 ? customerText.substring(0, 17) + "..." : customerText;

    // Ensure buttons array exists
    if (!content.buttons) {
      content.buttons = [];
    }

    // Only add buttons if they don't already exist with these titles
    const existingTitles = new Set(content.buttons.map((b: any) => b.title));
    if (!existingTitles.has(buttonTitle)) {
      content.buttons.push({ id: String(content.buttons.length + 1), title: buttonTitle });
      existingTitles.add(buttonTitle);
    }
    if (!existingTitles.has("Learn More") && content.buttons.length < 3) {
      content.buttons.push({ id: String(content.buttons.length + 1), title: "Learn More" });
    }

    // Ensure max 3 buttons
    if (content.buttons.length > 3) {
      content.buttons = content.buttons.slice(0, 3);
    }

    // Update contentType to interactive_buttons for plain text messages
    // For image/video messages, keep the original type — buttons are now rendered natively on image/video messages
    if (prevMsg.contentType === "text") {
      prevMsg.contentType = "interactive_buttons";
      content.type = "interactive_buttons";
    }
    // For image/video, just ensure the buttons are on the content (already added above)
    // No need to convert type — the frontend renders buttons on image messages natively
  }

  return messages;
}

/**
 * Post-process AI output to replace any remaining bracket placeholders with realistic sample data.
 * This is a safety net — the system prompt already instructs the LLM to avoid placeholders,
 * but this catches any that slip through.
 */
function sanitizePlaceholders(messages: any[]): any[] {
  // Map of common placeholder patterns to realistic replacements
  const PLACEHOLDER_MAP: Array<[RegExp, string]> = [
    [/\[Order\s*(?:ID|Number|#|No\.?)\]/gi, '#WA-78432'],
    [/\[Customer\s*Name\]/gi, 'Sarah'],
    [/\[(?:First\s*)?Name\]/gi, 'Sarah'],
    [/\[(?:Last\s*)?Name\]/gi, 'Johnson'],
    [/\[Full\s*Name\]/gi, 'Sarah Johnson'],
    [/\[Product\s*(?:Name|1|2|3)?\s*(?:Name)?\]/gi, 'Premium Wireless Earbuds'],
    [/\[Item\s*(?:Name)?\]/gi, 'Classic White Sneakers'],
    [/\[Brand\s*(?:Name)?\]/gi, 'StyleHub'],
    [/\[Company\s*(?:Name)?\]/gi, 'TechVista Inc.'],
    [/\[Business\s*(?:Name)?\]/gi, 'ShopEase'],
    [/\[Total\s*(?:Amount|Price)?\]/gi, '$149.98'],
    [/\[Amount\]/gi, '$149.98'],
    [/\[Price\]/gi, '$79.99'],
    [/\[Subtotal\]/gi, '$139.98'],
    [/\[Tax\]/gi, '$10.00'],
    [/\[Discount\s*(?:Amount)?\]/gi, '$15.00'],
    [/\[Date\]/gi, 'March 22, 2026'],
    [/\[Delivery\s*Date\]/gi, 'March 24, 2026'],
    [/\[Time\]/gi, '2:30 PM'],
    [/\[ETA\]/gi, '2:30 PM today'],
    [/\[Tracking\s*(?:Number|ID|#|No\.?)\]/gi, 'TRK-9847362'],
    [/\[Address\]/gi, '42 Marina Bay Drive'],
    [/\[Delivery\s*Address\]/gi, '42 Marina Bay Drive, Apt 7B'],
    [/\[Phone\s*(?:Number)?\]/gi, '+1 (555) 234-5678'],
    [/\[Email\s*(?:Address)?\]/gi, 'sarah@example.com'],
    [/\[Coupon\s*(?:Code)?\]/gi, 'SAVE20-XK7P'],
    [/\[Code\]/gi, 'VIP-2026-8K4P'],
    [/\[OTP\]/gi, '847291'],
    [/\[Verification\s*Code\]/gi, '847291'],
    [/\[Reference\s*(?:Number|ID|#)?\]/gi, 'REF-2026-88431'],
    [/\[Transaction\s*(?:ID|Number|#)?\]/gi, 'TXN-2026-88431'],
    [/\[Invoice\s*(?:Number|ID|#)?\]/gi, 'INV-2026-0318'],
    [/\[Receipt\s*(?:Number|ID|#)?\]/gi, 'RCP-88431'],
    [/\[Booking\s*(?:ID|Number|#|Reference)?\]/gi, 'BK-003847'],
    [/\[Reservation\s*(?:ID|Number|#)?\]/gi, 'RSV-2026-441'],
    [/\[Policy\s*(?:Number|ID)?\]/gi, 'POL-2024-88431'],
    [/\[Account\s*(?:Number|ID)?\]/gi, 'ACC-****4829'],
    [/\[Card\s*(?:Number)?\]/gi, '****4829'],
    [/\[Link\]/gi, 'https://track.example.com/WA-78432'],
    [/\[URL\]/gi, 'https://shop.example.com/deals'],
    [/\[Location\]/gi, 'Downtown Mall, Level 2'],
    [/\[Store\s*(?:Name|Location)?\]/gi, 'Flagship Store, Marina Bay'],
    [/\[Doctor\s*(?:Name)?\]/gi, 'Dr. Sarah Chen'],
    [/\[Clinic\s*(?:Name)?\]/gi, 'HealthFirst Clinic'],
    [/\[Hospital\s*(?:Name)?\]/gi, 'City General Hospital'],
    [/\[Agent\s*(?:Name)?\]/gi, 'Michael Torres'],
    [/\[Driver\s*(?:Name)?\]/gi, 'Raj'],
    [/\[Quantity\]/gi, '2'],
    [/\[Weight\]/gi, '2.4 kg'],
    [/\[Size\]/gi, 'Medium'],
    [/\[Color\]/gi, 'Midnight Blue'],
    [/\{\{1\}\}/g, 'Sarah'],
    [/\{\{2\}\}/g, '#WA-78432'],
    [/\{\{3\}\}/g, '$149.98'],
    [/\{\{name\}\}/gi, 'Sarah'],
    [/\{\{order_id\}\}/gi, '#WA-78432'],
    [/\{\{amount\}\}/gi, '$149.98'],
    [/\{\{date\}\}/gi, 'March 22, 2026'],
    [/\{\{time\}\}/gi, '2:30 PM'],
  ];

  // Generic catch-all for any remaining [Something] patterns
  const GENERIC_BRACKET_PATTERN = /\[([A-Z][a-zA-Z\s\/]*?)\]/g;

  function replacePlaceholders(text: string): string {
    if (!text || typeof text !== 'string') return text;
    let result = text;
    for (const [pattern, replacement] of PLACEHOLDER_MAP) {
      result = result.replace(pattern, replacement);
    }
    // Catch any remaining [Something] patterns not in our map
    result = result.replace(GENERIC_BRACKET_PATTERN, (match, inner) => {
      // Don't replace things that look like intentional formatting (e.g., [x1])
      if (/^\d/.test(inner) || inner.length > 40) return match;
      console.log(`[Placeholder Sanitizer] Caught unmapped placeholder: ${match}`);
      return inner; // Just remove the brackets, keep the text
    });
    return result;
  }

  function sanitizeContent(content: any): any {
    if (!content || typeof content !== 'object') return content;
    const c = { ...content };
    // Sanitize all text fields
    const textFields = ['text', 'headerText', 'bodyText', 'footerText', 'caption', 'listButtonText', 'locationName', 'documentName'];
    for (const field of textFields) {
      if (c[field] && typeof c[field] === 'string') {
        c[field] = replacePlaceholders(c[field]);
      }
    }
    // Sanitize buttons
    if (c.buttons && Array.isArray(c.buttons)) {
      c.buttons = c.buttons.map((b: any) => ({
        ...b,
        title: replacePlaceholders(b.title),
      }));
    }
    // Sanitize list sections
    if (c.listSections && Array.isArray(c.listSections)) {
      c.listSections = c.listSections.map((s: any) => ({
        ...s,
        title: replacePlaceholders(s.title),
        rows: (s.rows || []).map((r: any) => ({
          ...r,
          title: replacePlaceholders(r.title),
          description: replacePlaceholders(r.description),
        })),
      }));
    }
    // Sanitize carousel cards
    if (c.carouselCards && Array.isArray(c.carouselCards)) {
      c.carouselCards = c.carouselCards.map((card: any) => ({
        ...card,
        title: replacePlaceholders(card.title),
        description: replacePlaceholders(card.description),
        price: replacePlaceholders(card.price),
        buttonText: replacePlaceholders(card.buttonText),
      }));
    }
    return c;
  }

  let totalFixed = 0;
  for (const msg of messages) {
    const before = JSON.stringify(msg.content);
    msg.content = sanitizeContent(msg.content);
    const after = JSON.stringify(msg.content);
    if (before !== after) totalFixed++;
  }

  if (totalFixed > 0) {
    console.log(`[Placeholder Sanitizer] Fixed placeholders in ${totalFixed} messages`);
  }

  return messages;
}

function buildUserPrompt(input: { prompt: string; businessName?: string; businessUrl?: string; industry?: string | null; subVertical?: string; messageType: string }, seasonalMomentId?: string): string {
  let prompt = `Create a WhatsApp ${input.messageType} conversation: ${input.prompt}`;
  if (input.businessName) prompt += `\nBusiness: ${input.businessName}`;
  if (input.industry) prompt += `\nIndustry: ${input.industry}`;
  if (seasonalMomentId) {
    const moment = getSeasonalMomentById(seasonalMomentId);
    if (moment) {
      prompt += `\n\n=== SEASONAL CAMPAIGN CONTEXT ===`;
      prompt += `\nCampaign Moment: ${moment.name}`;
      prompt += `\nContext: ${moment.campaignContext}`;
      prompt += `\nSuggested angles: ${moment.promoAngles.join(", ")}`;
      prompt += `\nINSTRUCTION: Tailor the entire conversation to this seasonal moment. The opening template, product selection, pricing, urgency language, and call-to-action must all reflect the ${moment.name} campaign context above.`;
      prompt += `\n=================================`;
    }
  }
  if (input.subVertical) {
    const SUB_VERTICAL_CONTEXT: Record<string, Record<string, string>> = {
      "E-Commerce": {
        "Fashion & Apparel": "This is a FASHION & APPAREL e-commerce business (clothing, shoes, accessories). Use fashion-specific product names (dresses, sneakers, handbags), realistic USD fashion pricing (e.g., $49.99 for a t-shirt, $129 for a jacket, $89 for sneakers, $249 for a dress), fashion imagery (lookbooks, outfit flatlays, model shots), and fashion terminology (collection, lookbook, style, fit, fabric). The business name and products should clearly be a fashion brand.",
        "Grocery & Food Delivery": "This is a GROCERY & FOOD DELIVERY e-commerce business (fresh produce, pantry staples, meal kits). Use grocery-specific products (fruits, vegetables, dairy, snacks), realistic USD grocery pricing (e.g., $8.99 for a fruit basket, $65 for a weekly basket, $12.99 for a meal kit), food imagery (fresh produce, grocery bags, meal ingredients), and grocery terminology (fresh, organic, delivery slot, basket, refill). The business should clearly be an online grocery store.",
        "Electronics & Gadgets": "This is an ELECTRONICS & GADGETS e-commerce business (smartphones, laptops, accessories). Use electronics-specific products (phones, earbuds, laptops, smartwatches), realistic USD tech pricing (e.g., $999 for a flagship phone, $249 for wireless earbuds, $1,299 for a laptop, $399 for a smartwatch), tech imagery (product shots on clean backgrounds, unboxing, spec sheets), and tech terminology (specs, warranty, trade-in, upgrade, storage). The business should clearly be an electronics retailer.",
        "Beauty & Cosmetics": "This is a BEAUTY & COSMETICS e-commerce business (skincare, makeup, haircare). Use beauty-specific products (serums, foundations, lipsticks, moisturizers), realistic USD beauty pricing (e.g., $49 for a vitamin C serum, $38 for a moisturizer, $29 for a lipstick, $89 for a skincare set), beauty imagery (product bottles on marble, swatches, skin close-ups), and beauty terminology (routine, shade, skin type, ingredients, SPF). The business should clearly be a beauty/cosmetics brand.",
        "Home & Furniture": "This is a HOME & FURNITURE e-commerce business (furniture, decor, home essentials). Use home-specific products (sofas, dining tables, lamps, rugs, cushions), realistic USD furniture pricing (e.g., $899 for a sofa, $449 for a dining table, $149 for a rug, $79 for a lamp), home imagery (styled room shots, furniture in context, decor arrangements), and home terminology (room, assembly, delivery, dimensions, material). The business should clearly be a home/furniture store.",
        "Health & Pharmacy": "This is a HEALTH & PHARMACY e-commerce business (medicines, supplements, health devices). Use health-specific products (prescription medicines, vitamins, supplements, BP monitors), realistic USD pharmacy pricing (e.g., $24.99 for a prescription refill, $34.99 for a vitamin D supplement, $49.99 for a BP monitor), health imagery (medicine bottles, supplement packs, health devices), and health terminology (prescription, dosage, refill, wellness, adherence). The business should clearly be an online pharmacy.",
        "Jewelry & Luxury": "This is a JEWELRY & LUXURY e-commerce business (fine jewelry, watches, luxury accessories). Use jewelry-specific products (diamond rings, gold necklaces, pearl earrings, luxury watches), realistic USD luxury pricing (e.g., $1,850 for diamond stud earrings, $4,500 for an engagement ring, $2,200 for a gold necklace, $8,500 for a luxury watch), luxury imagery (jewelry on velvet, close-up gemstone shots, elegant gift boxes), and luxury terminology (carat, certification, engraving, bespoke, 18K gold). The business should clearly be a jewelry/luxury brand.",
        "Sports & Outdoors": "This is a SPORTS & OUTDOORS e-commerce business (fitness equipment, sportswear, outdoor gear). Use sports-specific products (dumbbells, running shoes, yoga mats, cycling gear), realistic USD sports pricing (e.g., $199 for an adjustable dumbbell set, $129 for running shoes, $49 for a yoga mat, $89 for resistance bands), sports imagery (gym equipment, active lifestyle shots, outdoor adventures), and sports terminology (fitness goal, training, gear, performance, endurance). The business should clearly be a sports/fitness retailer.",
      },
      "Real Estate": {
        "Residential Sales": "This is a RESIDENTIAL REAL ESTATE agency (single-family homes, condos, townhouses). Use residential property types (3-bed semi-detached, 4-bed colonial, 2-bed condo), realistic residential pricing (e.g., $485,000 for a 3-bed home, $329,000 for a condo, $625,000 for a townhouse), residential imagery (front yard with curb appeal, open-plan living room, modern kitchen, backyard patio), and residential terminology (mortgage pre-approval, down payment, HOA fees, school district, sq ft, lot size, move-in ready, open house). Include specific addresses (e.g., 42 Maple Ridge Drive, 118 Oakwood Lane). The business should clearly be a residential real estate brokerage.",
        "Commercial Real Estate": "This is a COMMERCIAL REAL ESTATE firm (office spaces, retail units, industrial warehouses). Use commercial property types (Class A office suite, ground-floor retail unit, logistics warehouse), realistic commercial pricing (e.g., $35/sq ft/year for office, $52/sq ft/year for retail, $18/sq ft/year for warehouse), commercial imagery (modern office lobby, open-plan workspace, loading dock, storefront), and commercial terminology (lease term, NNN lease, CAM charges, tenant improvement allowance, build-out, zoning, occupancy rate, anchor tenant). Include specific property IDs (e.g., CRE-2847, Unit 5B Tower One). The business should clearly be a commercial real estate advisory.",
        "Luxury & Premium": "This is a LUXURY REAL ESTATE agency (penthouses, waterfront estates, gated community villas). Use luxury property types (penthouse with panoramic views, beachfront villa, heritage mansion), realistic luxury pricing (e.g., $2.8M for a penthouse, $5.4M for a waterfront estate, $12M for a heritage mansion), luxury imagery (infinity pool overlooking city skyline, marble foyer with chandelier, private dock, wine cellar), and luxury terminology (private viewing, concierge service, bespoke finishes, smart home integration, wine cellar, private elevator, staff quarters). Include exclusive listing references (e.g., The Residences at Marina Bay #PH-42, Villa Serena Estate). The business should clearly be a premium luxury property consultancy.",
        "Rental & Leasing": "This is a RENTAL & LEASING property management company (apartments, studios, shared housing). Use rental property types (1-bed studio, 2-bed apartment, furnished executive suite), realistic rental pricing (e.g., $1,850/month for a 1-bed, $2,400/month for a 2-bed, $3,200/month for a furnished suite), rental imagery (bright apartment living room, modern kitchen, building amenities like gym and pool, neighborhood street view), and rental terminology (security deposit, lease term, pet policy, utilities included, maintenance request, move-in date, tenant screening, lease renewal). Include specific unit references (e.g., Unit 12B at The Meridian, Apt 4A Riverside Complex). The business should clearly be a property rental/leasing agency.",
        "New Development / Off-Plan": "This is a NEW DEVELOPMENT real estate firm (pre-construction sales, off-plan units, master-planned communities). Use development property types (off-plan 2-bed apartment, Phase 2 townhouse, master-planned villa), realistic development pricing (e.g., $380,000 for early-bird off-plan, $520,000 at current phase, 10% booking deposit), development imagery (architectural renders, construction progress photos, master plan aerial view, show unit interior), and development terminology (off-plan discount, payment plan, handover date, construction milestone, snagging, defect liability period, developer warranty, floor plan selection). Include specific project references (e.g., Skyline Residences Phase 3, Parkview Heights Block C). The business should clearly be a property developer or off-plan sales agency.",
      },
      "Healthcare": {
        "Dental Clinics": "This is a DENTAL CLINIC (general dentistry, cosmetic dentistry, orthodontics). Use dental-specific services (routine cleaning & checkup, teeth whitening, dental implants, Invisalign, root canal, veneers), realistic dental pricing (e.g., $150 for a cleaning, $500 for whitening, $3,500 per implant, $5,200 for Invisalign, $1,200 per veneer), dental imagery (bright modern dental office, patient in dental chair smiling, before/after smile transformation, dental X-ray on screen), and dental terminology (oral health assessment, plaque removal, crown fitting, bite alignment, gum health, fluoride treatment, dental plan). Include specific dentist names (e.g., Dr. Sarah Chen, Dr. Michael Torres) and appointment references (e.g., Booking #DC-4821). The business should clearly be a dental clinic or dental practice.",
        "Dermatology & Aesthetics": "This is a DERMATOLOGY & AESTHETICS clinic (skin consultations, cosmetic procedures, anti-aging treatments). Use dermatology-specific services (skin consultation, chemical peel, Botox, laser resurfacing, microneedling, PRP therapy, acne treatment plan), realistic dermatology pricing (e.g., $200 for consultation, $350 for chemical peel, $450 per Botox area, $800 for laser treatment, $600 for microneedling), dermatology imagery (clean clinical treatment room, close-up of glowing skin, dermatologist examining patient, before/after skin transformation), and dermatology terminology (skin type analysis, collagen stimulation, sun damage, hyperpigmentation, retinol, SPF protocol, treatment course, maintenance plan). Include specific doctor names (e.g., Dr. Priya Sharma, Dr. James Liu) and treatment plan references (e.g., Plan #DERM-2847). The business should clearly be a dermatology or medical aesthetics clinic.",
        "Pediatrics & Family Medicine": "This is a PEDIATRICS & FAMILY MEDICINE practice (well-child visits, vaccinations, sick visits, family health). Use pediatric-specific services (well-child checkup, vaccination schedule, sick visit, developmental screening, allergy testing, growth monitoring), realistic pediatric pricing (e.g., $250 for well-child visit, $150 per vaccination, $175 for sick visit, $300 for allergy panel), pediatric imagery (colorful child-friendly waiting room, pediatrician with stethoscope examining child, vaccination administration, growth chart), and pediatric terminology (immunization schedule, growth percentile, developmental milestone, fever management, ear infection, well-baby visit, booster shot, pediatric care plan). Include specific doctor names (e.g., Dr. Emily Park, Dr. Raj Patel) and patient references (e.g., Visit #PED-3291 for Sophia, age 4). The business should clearly be a pediatric or family medicine practice.",
        "Orthopedics & Sports Medicine": "This is an ORTHOPEDICS & SPORTS MEDICINE clinic (joint pain, sports injuries, physical therapy, surgical consultations). Use orthopedic-specific services (orthopedic consultation, MRI imaging, knee arthroscopy, ACL reconstruction, physical therapy session, cortisone injection), realistic orthopedic pricing (e.g., $300 for consultation, $1,200 for MRI, $15,000 for knee arthroscopy, $150 per PT session, $350 for cortisone injection), orthopedic imagery (sports medicine clinic interior, athlete on treatment table, MRI scan display, physical therapy exercise), and orthopedic terminology (range of motion, ligament tear, joint replacement, rehabilitation protocol, weight-bearing status, post-op recovery, sports clearance). Include specific doctor names (e.g., Dr. David Kim, Dr. Ana Rodriguez) and case references (e.g., Case #ORTHO-5847). The business should clearly be an orthopedic or sports medicine clinic.",
        "Mental Health & Wellness": "This is a MENTAL HEALTH & WELLNESS practice (therapy, psychiatric consultations, wellness programs). Use mental health-specific services (individual therapy session, psychiatric evaluation, couples counseling, group therapy, mindfulness workshop, cognitive behavioral therapy), realistic mental health pricing (e.g., $175 per therapy session, $300 for psychiatric evaluation, $200 for couples session, $75 for group therapy, $120 for wellness workshop), mental health imagery (calming therapy office with soft lighting, comfortable counseling room, meditation space, wellness workshop setting), and mental health terminology (therapeutic approach, treatment plan, coping strategies, mindfulness, emotional regulation, session frequency, intake assessment, confidential consultation). Include specific therapist names (e.g., Dr. Rachel Green, Licensed Counselor Mark Stevens) and session references (e.g., Session #MH-1924). The business should clearly be a mental health practice or wellness center.",
        "Ophthalmology & Optometry": "This is an OPHTHALMOLOGY & OPTOMETRY clinic (eye exams, LASIK, cataract surgery, contact lens fitting). Use eye care-specific services (comprehensive eye exam, LASIK consultation, cataract evaluation, contact lens fitting, glaucoma screening, retinal imaging), realistic eye care pricing (e.g., $200 for eye exam, $4,500 for LASIK per eye, $3,500 for cataract surgery, $150 for contact fitting, $250 for retinal imaging), eye care imagery (modern eye clinic with diagnostic equipment, patient at slit lamp, LASIK procedure room, eye chart examination), and eye care terminology (visual acuity, refractive error, intraocular pressure, corneal topography, lens prescription, post-operative care, follow-up visit). Include specific doctor names (e.g., Dr. Lisa Wang, Dr. Robert Hayes) and appointment references (e.g., Appt #EYE-7362). The business should clearly be an eye care clinic or ophthalmology practice.",
        "OB/GYN & Women's Health": "This is an OB/GYN & WOMEN'S HEALTH clinic (prenatal care, fertility consultations, annual wellness, gynecological procedures). Use women's health-specific services (prenatal checkup, ultrasound scan, fertility consultation, annual wellness exam, pap smear, birth plan consultation), realistic women's health pricing (e.g., $250 for prenatal visit, $350 for ultrasound, $500 for fertility consultation, $200 for annual wellness, $150 for pap smear), women's health imagery (warm welcoming clinic reception, ultrasound examination room, prenatal consultation, newborn nursery), and women's health terminology (trimester milestone, fetal development, ovulation tracking, prenatal vitamins, gestational age, birth plan, postpartum care, lactation support). Include specific doctor names (e.g., Dr. Maria Santos, Dr. Jennifer Wu) and patient references (e.g., Prenatal Visit #OB-4183, Week 24). The business should clearly be an OB/GYN or women's health practice.",
        "Cardiology": "This is a CARDIOLOGY practice (heart health screenings, cardiac diagnostics, interventional procedures). Use cardiology-specific services (cardiac consultation, stress test, echocardiogram, Holter monitoring, cardiac catheterization, lipid panel review), realistic cardiology pricing (e.g., $350 for consultation, $500 for stress test, $800 for echocardiogram, $400 for Holter monitor, $250 for lipid panel review), cardiology imagery (cardiology clinic with ECG machine, patient on treadmill stress test, echocardiogram display, heart health education materials), and cardiology terminology (ejection fraction, blood pressure management, cholesterol levels, arrhythmia, stent placement, cardiac rehabilitation, medication adherence, lifestyle modification). Include specific doctor names (e.g., Dr. James Hartfield, Dr. Aisha Noor) and case references (e.g., Cardiac Case #CARD-6291). The business should clearly be a cardiology practice or heart center.",
      },
    };
    const industryContexts = input.industry ? SUB_VERTICAL_CONTEXT[input.industry] : undefined;
    const context = industryContexts ? industryContexts[input.subVertical] : undefined;
    if (context) prompt += `\n\nSUB-VERTICAL CONTEXT (CRITICAL — follow this closely):\n${context}`;
  }
  prompt += `\n\nOutput ONLY the JSON object. 8-10 messages. All text under 80 chars. Start with template.`;
  prompt += `\nINCLUDE rich media: at least 1 image message AND 1 carousel with product cards (with prices).`;
  prompt += `\nUse "imageDescription" fields with vivid, specific visual descriptions for AI image generation. Start each description with the SPECIFIC subject noun (e.g. "Pizza fresh out of oven" not "delicious food").`;
  prompt += `\nFor template headerImageUrl, use "GENERATE_IMAGE:" prefix followed by a specific visual description of the business (e.g. "GENERATE_IMAGE:Elegant restaurant interior with ambient lighting").`;
  prompt += `\nCRITICAL: Every customer (inbound) message MUST be immediately preceded by an interactive business message (interactive_buttons, interactive_list, or carousel). No customer text should appear after plain text/image/video business messages.`;
  prompt += `\nJOURNEY COHERENCE: After every customer button click, the NEXT business message MUST directly address what the customer selected. If they click "View Details" → show details. If they click "Book Now" → start booking. NEVER skip steps or ignore the customer's choice.`;
  prompt += `\nABSOLUTE RULE — NO PLACEHOLDERS: Every piece of data in your output must be a concrete, realistic value. NEVER output [Order ID], [Customer Name], [Product Name], [Amount], [Date], [Time], [Tracking Number], [Address], [Code], {{1}}, {{name}}, or ANY bracket/curly-brace placeholder. Instead, invent believable sample data (e.g., order #WA-78432, Sarah, Nike Air Max 90, $129.99, March 22 2026, 2:30 PM, TRK-9847362, 42 Marina Bay Drive, SAVE20-XK7P). This is a DEMO — all data must look real.`;

  // Detect if the prompt involves any booking/appointment/scheduling
  const bookingKeywords = /\b(book|booking|appointment|schedule|scheduling|reservation|reserv|reserve|consult|test drive|viewing|visit|check-in|slot|reschedule)\b/i;
  if (bookingKeywords.test(input.prompt)) {
    prompt += `\nAPPOINTMENT BOOKING REQUIRED: This flow involves booking/scheduling. You MUST include an interactive_list message with at least 4-6 available date and time slots. The customer MUST select a date/time from the list before the booking is confirmed. End with a thank you message after confirmation.`;
    prompt += `\nALSO include a "reminderMessages" array with 2-3 follow-up reminders (24h_before with reschedule buttons, 1h_before text reminder). Reference the specific appointment details from the booking.`;
  }

  return prompt;
}

/**
 * Build a rich context string from a business profile for the AI prompt.
 * This gives the LLM detailed knowledge about the business's actual products,
 * services, prices, and brand identity so it generates hyper-personalized conversations.
 */
function buildBusinessProfileContext(profile: {
  businessName: string;
  industry: string;
  description: string;
  tagline?: string;
  brandTone?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  products?: Array<{ name: string; description: string; price: string; imageUrl: string; category: string }>;
  services?: Array<{ name: string; description: string; price: string; imageUrl: string; category: string }>;
}): string {
  let context = `\n\n=== REAL BUSINESS DATA (USE THIS — DO NOT INVENT PRODUCTS) ===`;
  context += `\nBusiness: ${profile.businessName}`;
  context += `\nIndustry: ${profile.industry}`;
  context += `\nDescription: ${profile.description}`;
  if (profile.tagline) context += `\nTagline: "${profile.tagline}"`;
  if (profile.brandTone) context += `\nBrand Tone: ${profile.brandTone}`;

  const products = profile.products || [];
  const services = profile.services || [];

  if (products.length > 0) {
    context += `\n\n--- REAL PRODUCTS (use these exact names, prices, and descriptions in the conversation) ---`;
    for (const p of products.slice(0, 8)) {
      context += `\n• ${p.name} — ${p.price} — ${p.description}${p.imageUrl ? ` [HAS REAL IMAGE]` : ""}`;
    }
  }

  if (services.length > 0) {
    context += `\n\n--- REAL SERVICES (use these exact names, prices, and descriptions in the conversation) ---`;
    for (const s of services.slice(0, 6)) {
      context += `\n• ${s.name} — ${s.price} — ${s.description}${s.imageUrl ? ` [HAS REAL IMAGE]` : ""}`;
    }
  }

  context += `\n\nCRITICAL INSTRUCTIONS FOR PERSONALIZATION:`;
  context += `\n1. Use the EXACT product/service names listed above in carousel cards, messages, and buttons`;
  context += `\n2. Use the EXACT prices listed above — do not invent or round prices`;
  context += `\n3. For carousel cards, use the products listed above (up to 4 cards) with their EXACT real names as card titles and their real prices. The card title MUST match the product name exactly (e.g., if the product is "OUTGLOW", the card title must be "OUTGLOW", not "OUTGLOW - 15 Days Supply" or any variation)`;
  context += `\n4. For template header image, describe the business's actual hero visual`;
  context += `\n5. Make the conversation feel like it's from THIS specific business, not a generic template`;
  context += `\n6. Reference the business name "${profile.businessName}" naturally in messages`;
  context += `\n7. Match the brand tone: ${profile.brandTone || "professional"}`;
  context += `\n=== END REAL BUSINESS DATA ===\n`;

  return context;
}

/**
 * Post-process AI-generated messages to inject real product images from the crawled website.
 * This replaces GENERATE_IMAGE: placeholders and imageDescription fields with actual product image URLs.
 *
 * KEY IMPROVEMENT: Deep-validates all crawled image URLs with actual GET requests (not just HEAD)
 * before injecting them. If an image can't be fetched (hotlink protection, etc.), it is NOT injected,
 * allowing the stock image → AI image fallback chain to work correctly.
 *
 * Matching strategy:
 * 1. For carousel cards: match card title/description to product names using fuzzy matching
 * 2. For template headers: use the hero image from the website
 * 3. For standalone images: match image description context to the closest product
 */
async function injectRealProductImages(
  messages: any[],
  catalog: Array<{ name: string; description: string; price: string; imageUrl: string; category: string }>,
  heroImageUrl: string
): Promise<void> {
  // Only use catalog items that have valid, non-empty image URLs
  const catalogWithImages = catalog.filter(p => p.imageUrl && p.imageUrl.startsWith("http") && p.imageUrl.length > 10);
  // Also keep catalog items without images for name/price matching (but won't inject their images)
  const catalogForMatching = catalog.filter(p => p.name);
  
  // Validate hero image URL (must be a real URL, not empty or placeholder)
  const rawHeroUrl = heroImageUrl && heroImageUrl.startsWith("http") && heroImageUrl.length > 10 ? heroImageUrl : "";
  
  if (catalogWithImages.length === 0 && !rawHeroUrl) {
    console.log(`[ImageInject] No valid images in catalog and no hero image — stock images will be used as fallback`);
    // Still inject real product names and prices from catalog even without images
    injectRealProductData(messages, catalogForMatching);
    return;
  }

  // ── Deep-validate all candidate image URLs with actual GET requests ──
  // This catches hotlink-protected images that pass HEAD checks but fail GET requests
  const urlsToValidate = [
    ...catalogWithImages.map(p => p.imageUrl),
    ...(rawHeroUrl ? [rawHeroUrl] : []),
  ];
  const uniqueUrls = Array.from(new Set(urlsToValidate));
  
  console.log(`[ImageInject] Deep-validating ${uniqueUrls.length} image URLs with GET requests...`);
  const validUrls = await batchValidateImageUrls(uniqueUrls);
  console.log(`[ImageInject] Deep validation: ${validUrls.size}/${uniqueUrls.length} URLs actually fetchable`);

  // Filter catalog to only include items with truly fetchable images
  const deepValidatedCatalog = catalogWithImages.filter(p => validUrls.has(p.imageUrl));
  const validHeroUrl = rawHeroUrl && validUrls.has(rawHeroUrl) ? rawHeroUrl : "";

  if (deepValidatedCatalog.length === 0 && !validHeroUrl) {
    console.log(`[ImageInject] All crawled images failed deep validation (likely hotlink-protected) — falling back to stock/AI images`);
    // Still inject real product names and prices from catalog even without images
    injectRealProductData(messages, catalogForMatching);
    return;
  }

  console.log(`[ImageInject] ${deepValidatedCatalog.length} catalog images + ${validHeroUrl ? 1 : 0} hero image passed deep validation`);

  const usedImages = new Set<string>();

  // ── Separate real product images from promotional banners ──
  const promoPatterns = /\b(select|buy \d|\d+ for|% off|free shipping|limited time|sale|offer|deal|promo)\b/i;
  const realProductImages = deepValidatedCatalog.filter(p => !promoPatterns.test(p.name));
  const promoImages = deepValidatedCatalog.filter(p => promoPatterns.test(p.name));
  
  console.log(`[ImageInject] ${realProductImages.length} real product images, ${promoImages.length} promotional banner images detected`);

  // Prefer real product images; only use promo images if no real ones exist
  const preferredCatalog = realProductImages.length > 0 ? realProductImages : deepValidatedCatalog;

  for (const msg of messages) {
    const content = msg.content;
    if (!content) continue;

    // 1. Template header image — use real product image if confident match, else let AI generate
    if (content.headerImageUrl && typeof content.headerImageUrl === "string" && content.headerImageUrl.startsWith("GENERATE_IMAGE:")) {
      // Try to find a real product image (not a promotional banner)
      const firstRealProduct = preferredCatalog.find(p => p.imageUrl);
      if (firstRealProduct) {
        content.headerImageUrl = getProxiedImageUrl(firstRealProduct.imageUrl);
        content._realImage = true;
        delete content._headerImageDescription;
        console.log(`[ImageInject] Template header → product "${firstRealProduct.name}" image (proxied, deep-validated)`);
      }
      // When no real product images exist, always let AI generate a relevant product image
      // Hero/banner images are typically generic store photos, not product-specific
      // AI generation produces much more relevant results for template headers
      if (!content._realImage) {
        console.log(`[ImageInject] Template header → no real product images found, letting AI generate relevant image`);
      }
      // Otherwise leave GENERATE_IMAGE: so AI generates a relevant image
    }

    // 2. Carousel cards — HIGH CONFIDENCE matching only
    if (content.carouselCards && Array.isArray(content.carouselCards)) {
      // First pass: match each card by name with HIGH confidence (score >= 10)
      for (const card of content.carouselCards) {
        const match = findBestProductMatch(
          card.title || card.description || "",
          preferredCatalog,
          usedImages,
          { requireHighConfidence: true }
        );
        if (match && match.imageUrl) {
          card.imageUrl = getProxiedImageUrl(match.imageUrl);
          card._realImage = true;
          delete card.imageDescription;
          usedImages.add(match.imageUrl);
          console.log(`[ImageInject] Carousel "${card.title}" → "${match.name}" image (score=${match.score}, proxied)`);
        }
        // Always try to inject real price even if image wasn't found
        const priceMatch = findBestProductMatch(card.title || card.description || "", catalogForMatching, new Set());
        if (priceMatch && priceMatch.price && priceMatch.price !== "Contact for pricing") {
          card.price = priceMatch.price;
        }
      }

      // Second pass: for unmatched cards, try unused real product images (allow lower confidence)
      for (const card of content.carouselCards) {
        if (card._realImage || card._clientAsset) continue;
        if (card.imageUrl && typeof card.imageUrl === 'string' && card.imageUrl.startsWith('http') && !card.imageUrl.startsWith('GENERATE_IMAGE:')) continue;

        // Try category-aware fallback: find unused product whose CATEGORY matches the card's category context
        // This is STRICT: we only match if the product's category aligns with what the card is about
        const cardContext = `${card.title || ''} ${card.description || ''}`.toLowerCase();
        const NOISE_WORDS = new Set(['the','and','for','off','new','now','our','top','all','get','buy','big','hot','best','more','your','this','that','with','from','sale','deal','save','shop','free','upto','limited','time','only','exclusive','special','offer','discount','collection','category','explore','discover']);
        const cardWords = cardContext.split(/\s+/).filter(w => w.length > 2 && !NOISE_WORDS.has(w) && !/^\d+/.test(w));
        const cardSynonyms = expandQueryWithSynonyms(cardWords);
        
        // Determine the card's target category (e.g., "footwear", "apparel", "accessories")
        const cardCategoryKeys = Object.keys(CATEGORY_SYNONYMS).filter(cat => 
          cardWords.some(w => w.includes(cat) || cat.includes(w)) ||
          CATEGORY_SYNONYMS[cat]?.some(syn => cardWords.some(w => w.includes(syn) || syn.includes(w)))
        );
        
        const categoryMatch = preferredCatalog.find(p => {
          if (!p.imageUrl || usedImages.has(p.imageUrl)) return false;
          const promoPatterns = /\b(select|buy \d|\d+ for|% off|free shipping|limited time|sale|offer|deal|promo)\b/i;
          if (promoPatterns.test(p.name)) return false;
          
          const productCatLower = p.category.toLowerCase();
          const productNameLower = p.name.toLowerCase();
          const productText = `${productNameLower} ${productCatLower} ${p.description}`.toLowerCase();
          
          // If we identified the card's target category, the product MUST belong to it
          if (cardCategoryKeys.length > 0) {
            const productBelongsToCardCategory = cardCategoryKeys.some(cardCat => {
              // Product category directly matches
              if (productCatLower.includes(cardCat) || cardCat.includes(productCatLower)) return true;
              // Product category matches a synonym of the card's category
              const synonyms = CATEGORY_SYNONYMS[cardCat] || [];
              if (synonyms.some(syn => productCatLower.includes(syn) || syn.includes(productCatLower))) return true;
              // Product name contains a synonym of the card's category
              if (synonyms.some(syn => productNameLower.includes(syn))) return true;
              return false;
            });
            if (!productBelongsToCardCategory) return false; // REJECT: product is in a different category
          }
          
          // Also verify the product doesn't clearly belong to a CONFLICTING category
          // e.g., if card is about "apparel" but product category is "shoes/footwear", reject it
          if (cardCategoryKeys.length > 0) {
            const conflictingCategories = Object.keys(CATEGORY_SYNONYMS).filter(cat => !cardCategoryKeys.includes(cat));
            for (const conflictCat of conflictingCategories) {
              if (productCatLower.includes(conflictCat)) return false;
              const conflictSynonyms = CATEGORY_SYNONYMS[conflictCat] || [];
              if (conflictSynonyms.some(syn => productCatLower === syn)) return false;
            }
          }
          
          // Final check: product text must match card context via synonyms or meaningful words
          return cardSynonyms.some(syn => productText.includes(syn)) || cardWords.some(w => productText.includes(w));
        });
        if (categoryMatch) {
          card.imageUrl = getProxiedImageUrl(categoryMatch.imageUrl);
          card._realImage = true;
          delete card.imageDescription;
          usedImages.add(categoryMatch.imageUrl);
          console.log(`[ImageInject] Carousel "${card.title}" → category-matched "${categoryMatch.name}" (cat: ${categoryMatch.category}) image (proxied)`);
        } else if (preferredCatalog.length > 0) {
          // Reuse a real product image (duplicate product image > AI hallucination for known products)
          const reusableMatch = findBestProductMatch(
            card.title || card.description || "",
            preferredCatalog,
            new Set(),
            { requireHighConfidence: true }
          );
          if (reusableMatch && reusableMatch.imageUrl) {
            card.imageUrl = getProxiedImageUrl(reusableMatch.imageUrl);
            card._realImage = true;
            delete card.imageDescription;
            console.log(`[ImageInject] Carousel "${card.title}" → reused "${reusableMatch.name}" image (score=${reusableMatch.score}, proxied)`);
          }
          // If no confident reuse match, leave imageDescription for AI to generate
          // AI generation is BETTER than using a random/promotional image
        }
      }
    }

    // 3. Standalone image messages — only inject if confident match exists
    if (content.imageDescription && !content._realImage && !content._clientAsset) {
      const match = findBestProductMatch(
        content.imageDescription,
        preferredCatalog,
        new Set(),
        { requireHighConfidence: true }
      );
      if (match && match.imageUrl) {
        content.imageUrl = getProxiedImageUrl(match.imageUrl);
        content._realImage = true;
        const origDesc = content.imageDescription;
        delete content.imageDescription;
        console.log(`[ImageInject] Image "${(origDesc || '').substring(0, 40)}" → "${match.name}" image (score=${match.score}, proxied)`);
      }
      // If no confident match, leave imageDescription for AI to generate a relevant image
      // This is MUCH better than injecting a random product image or promotional banner
    }
  }
}

/**
 * Inject real product names and prices from catalog even when images aren't available.
 * This ensures the conversation uses real business data even with stock images.
 */
function injectRealProductData(
  messages: any[],
  catalog: Array<{ name: string; description: string; price: string; imageUrl: string; category: string }>
): void {
  if (catalog.length === 0) return;
  
  for (const msg of messages) {
    const content = msg.content;
    if (!content) continue;
    
    if (content.carouselCards && Array.isArray(content.carouselCards)) {
      for (const card of content.carouselCards) {
        const match = findBestProductMatch(card.title || card.description || "", catalog, new Set());
        if (match && match.price && match.price !== "Contact for pricing") {
          card.price = match.price;
        }
      }
    }
  }
}

/**
 * Inject client-uploaded assets into AI-generated messages.
 * Client assets have the HIGHEST priority — they replace stock images, GENERATE_IMAGE placeholders,
 * and imageDescription fields with the actual client-provided URLs.
 *
 * Strategy:
 * 1. First image → template header (if present)
 * 2. Remaining images → carousel cards (round-robin)
 * 3. Any leftover images → standalone image messages
 * 4. Videos → video messages
 */
function injectClientAssets(
  messages: any[],
  assets: Array<{ url: string; name: string; type: string }>
): void {
  const imageAssets = assets.filter(a => a.type === "image");
  const videoAssets = assets.filter(a => a.type === "video");
  let imageIdx = 0;
  let videoIdx = 0;

  // Pass 1: Template headers — use first client image
  for (const msg of messages) {
    const c = msg.content;
    if (!c) continue;
    if (c.headerImageUrl && imageIdx < imageAssets.length) {
      c.headerImageUrl = imageAssets[imageIdx].url;
      c._clientAsset = true;
      imageIdx++;
      console.log(`[ClientAsset] Template header → ${imageAssets[imageIdx - 1].name}`);
    }
  }

  // Pass 2: Carousel cards — distribute images across cards
  for (const msg of messages) {
    const c = msg.content;
    if (!c || !c.carouselCards || !Array.isArray(c.carouselCards)) continue;
    for (const card of c.carouselCards) {
      if (imageIdx < imageAssets.length) {
        card.imageUrl = imageAssets[imageIdx].url;
        card._clientAsset = true;
        // Clear imageDescription since we have a real image
        delete card.imageDescription;
        imageIdx++;
        console.log(`[ClientAsset] Carousel card "${card.title}" → ${imageAssets[imageIdx - 1].name}`);
      }
    }
  }

  // Pass 3: Standalone image messages — use remaining images
  for (const msg of messages) {
    const c = msg.content;
    if (!c) continue;
    if ((c.type === "image" || c.imageDescription || c.imageUrl) && imageIdx < imageAssets.length) {
      if (!c._clientAsset) {
        c.imageUrl = imageAssets[imageIdx].url;
        c._clientAsset = true;
        // Clear imageDescription since we have a real image
        delete c.imageDescription;
        imageIdx++;
        console.log(`[ClientAsset] Image message → ${imageAssets[imageIdx - 1].name}`);
      }
    }
  }

  // Pass 4: Video messages — inject client videos
  for (const msg of messages) {
    const c = msg.content;
    if (!c) continue;
    if ((c.type === "video" || c.videoUrl || c.videoDescription) && videoIdx < videoAssets.length) {
      c.videoUrl = videoAssets[videoIdx].url;
      c._clientAsset = true;
      delete c.videoDescription;
      videoIdx++;
      console.log(`[ClientAsset] Video message → ${videoAssets[videoIdx - 1].name}`);
    }
  }

  console.log(`[ClientAsset] Injected ${imageIdx} images, ${videoIdx} videos from client assets`);
}

/**
 * Find the best matching product from the catalog for a given text query.
 * Uses word overlap scoring with bonus for exact substring matches.
 */
/**
 * Category synonym map — maps broad category terms to related keywords.
 * This allows matching a card titled "Accessories" to a product in category "bags" or "watches".
 */
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  footwear: ["shoes", "sneakers", "boots", "sandals", "slippers", "trainers", "runners", "cleats", "flats", "heels", "loafers", "flip-flops", "slides"],
  apparel: ["clothing", "clothes", "shirts", "pants", "jackets", "hoodies", "tops", "bottoms", "dresses", "skirts", "sweaters", "tees", "t-shirts", "jerseys", "shorts", "trousers", "outerwear", "activewear", "sportswear"],
  accessories: ["bags", "hats", "caps", "watches", "sunglasses", "belts", "wallets", "jewelry", "jewellery", "scarves", "gloves", "socks", "backpacks", "headbands", "wristbands"],
  electronics: ["phones", "laptops", "tablets", "headphones", "earbuds", "speakers", "cameras", "chargers", "cables", "gadgets", "devices"],
  beauty: ["skincare", "makeup", "cosmetics", "fragrance", "perfume", "serum", "moisturizer", "cleanser", "lipstick", "foundation"],
  food: ["meals", "snacks", "beverages", "drinks", "desserts", "groceries", "cuisine", "dishes", "menu"],
  furniture: ["sofa", "table", "chair", "desk", "bed", "shelf", "cabinet", "couch", "mattress"],
  sports: ["fitness", "gym", "workout", "training", "athletic", "exercise", "running", "yoga"],
  kids: ["children", "baby", "toddler", "infant", "youth", "junior"],
};

/**
 * Expand a query into additional matching terms using category synonyms.
 * e.g., "accessories" → ["bags", "hats", "watches", ...]
 */
function expandQueryWithSynonyms(queryWords: string[]): string[] {
  const expanded: string[] = [];
  for (const word of queryWords) {
    for (const [category, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
      // If the query word matches a category key, add all its synonyms
      if (category.includes(word) || word.includes(category)) {
        expanded.push(...synonyms);
      }
      // If the query word matches a synonym, add the category key and other synonyms
      if (synonyms.some(s => s.includes(word) || word.includes(s))) {
        expanded.push(category);
        expanded.push(...synonyms.filter(s => s !== word));
      }
    }
  }
  return Array.from(new Set(expanded));
}

function findBestProductMatch(
  query: string,
  catalog: Array<{ name: string; description: string; price: string; imageUrl: string; category: string }>,
  usedImages: Set<string>,
  options?: { requireHighConfidence?: boolean; allowFallback?: boolean }
): { name: string; imageUrl: string; price: string; score: number; category: string } | null {
  if (!query || catalog.length === 0) return null;

  const { requireHighConfidence = false, allowFallback = false } = options || {};
  const queryLower = query.toLowerCase();
  const NOISE_WORDS = new Set(['the','and','for','off','new','now','our','top','all','get','buy','big','hot','best','more','your','this','that','with','from','sale','deal','save','shop','free','upto','limited','time','only','exclusive','special','offer','discount','collection','category','explore','discover']);
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2 && !NOISE_WORDS.has(w) && !/^\d+/.test(w));
  const expandedWords = expandQueryWithSynonyms(queryWords);
  
  // Determine the query's target category for negative matching
  const queryCategoryKeys = Object.keys(CATEGORY_SYNONYMS).filter(cat => 
    queryWords.some(w => w.includes(cat) || cat.includes(w)) ||
    CATEGORY_SYNONYMS[cat]?.some(syn => queryWords.some(w => w.includes(syn) || syn.includes(w)))
  );

  let bestMatch: { name: string; imageUrl: string; price: string; score: number; category: string } | null = null;
  let bestScore = 0;

  for (const product of catalog) {
    // Skip already-used images to avoid duplicates (prefer variety)
    if (usedImages.has(product.imageUrl)) continue;

    const nameLower = product.name.toLowerCase();
    const descLower = product.description.toLowerCase();
    const catLower = product.category.toLowerCase();
    const combinedProductText = `${nameLower} ${descLower} ${catLower}`;
    let score = 0;

    // ── 1. Exact name substring match (strongest signal) ──
    if (queryLower.includes(nameLower) || nameLower.includes(queryLower)) {
      score += 50;
    }

    // ── 2. Word overlap with product name ──
    const nameWords = nameLower.split(/\s+/).filter(w => w.length > 2);
    for (const word of queryWords) {
      if (nameWords.some(nw => nw.includes(word) || word.includes(nw))) {
        score += 10;
      }
    }

    // ── 3. Word overlap with description ──
    for (const word of queryWords) {
      if (descLower.includes(word)) {
        score += 3;
      }
    }

    // ── 4. STRONG category matching ──
    // Direct category match (query word appears in product category or vice versa)
    const catWords = catLower.split(/\s+/).filter(w => w.length > 2);
    for (const word of queryWords) {
      if (catLower.includes(word) || word.includes(catLower)) {
        score += 25; // Boosted from 5 → 25: category match is a strong contextual signal
      }
      if (catWords.some(cw => cw.includes(word) || word.includes(cw))) {
        score += 15;
      }
    }

    // ── 5. Synonym-expanded matching ──
    // If query says "accessories" and product is in category "bags" or name contains "watch"
    for (const synonym of expandedWords) {
      if (combinedProductText.includes(synonym)) {
        score += 12; // Synonym match is strong contextual evidence
      }
    }

    // ── 6. Penalize promotional/banner-like product names ──
    const promoPatterns = /\b(select|buy \d|\d+ for|% off|free shipping|limited time|sale|offer|deal|promo)\b/i;
    if (promoPatterns.test(product.name)) {
      score = Math.floor(score * 0.3);
    }

    // ── 7. NEGATIVE category penalty ──
    // If the query is clearly about one category (e.g., "apparel") but the product is in a different
    // known category (e.g., "shoes"), heavily penalize to prevent cross-category mismatches
    if (queryCategoryKeys.length > 0 && score < 50) { // Don't penalize exact name matches
      const productBelongsToQueryCategory = queryCategoryKeys.some(qCat => {
        if (catLower.includes(qCat) || qCat.includes(catLower)) return true;
        const synonyms = CATEGORY_SYNONYMS[qCat] || [];
        return synonyms.some(syn => catLower.includes(syn) || syn.includes(catLower) || nameLower.includes(syn));
      });
      if (!productBelongsToQueryCategory) {
        // Check if product clearly belongs to a DIFFERENT known category
        const productInOtherCategory = Object.entries(CATEGORY_SYNONYMS).some(([cat, synonyms]) => {
          if (queryCategoryKeys.includes(cat)) return false; // Skip the query's own category
          return catLower.includes(cat) || cat.includes(catLower) || synonyms.some(s => catLower === s);
        });
        if (productInOtherCategory) {
          score = Math.max(0, score - 30); // Heavy penalty for cross-category mismatch
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = { name: product.name, imageUrl: product.imageUrl, price: product.price, score, category: product.category };
    }
  }

  // Minimum score thresholds
  const minScore = requireHighConfidence ? 10 : 5;
  if (bestScore < minScore) {
    if (allowFallback) {
      // Category-aware fallback: try to find unused product in a matching category first
      const categoryFallback = catalog.find(p => {
        if (usedImages.has(p.imageUrl)) return false;
        if (!p.imageUrl) return false;
        const promoPatterns = /\b(select|buy \d|\d+ for|% off|free shipping|limited time|sale|offer|deal|promo)\b/i;
        if (promoPatterns.test(p.name)) return false;
        // Check if product category or name matches any expanded synonym
        const pText = `${p.name} ${p.category} ${p.description}`.toLowerCase();
        return expandedWords.some(syn => pText.includes(syn)) || queryWords.some(w => pText.includes(w));
      });
      if (categoryFallback) {
        return { name: categoryFallback.name, imageUrl: categoryFallback.imageUrl, price: categoryFallback.price, score: 2, category: categoryFallback.category };
      }
      // Last resort: any unused non-promotional product
      const unused = catalog.find(p => {
        if (usedImages.has(p.imageUrl)) return false;
        if (!p.imageUrl) return false;
        const promoPatterns = /\b(select|buy \d|\d+ for|% off|free shipping|limited time|sale|offer|deal|promo)\b/i;
        return !promoPatterns.test(p.name);
      });
      return unused ? { name: unused.name, imageUrl: unused.imageUrl, price: unused.price, score: 1, category: unused.category } : null;
    }
    return null;
  }

  return bestMatch;
}
