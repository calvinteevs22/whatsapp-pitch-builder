import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import WhatsAppMockup from "@/components/WhatsAppMockup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/translations";
import {
  Sparkles, Plus, Trash2, GripVertical, ArrowLeft, Settings2,
  MessageSquare, Image, ListOrdered, LayoutTemplate, Globe, Loader2,
  ChevronDown, ChevronUp, Edit3, Share2, Eye, Download, Link2, Copy,
  RotateCcw, Upload, Film, Layers, X, FileDown, FileImage, FileText,
  Mail, MessageCircle, ExternalLink, Monitor, ArrowUp, ArrowDown,
  RefreshCw, ArrowLeftRight, Type, CopyPlus, PlusCircle, Undo2, Redo2, MoreHorizontal,
  Presentation, Zap, ShoppingCart, Bell, UserCheck, Lock, Package, Star, Clock,
  Save, BarChart3, FileSpreadsheet, TrendingUp, Users, MousePointerClick, CheckCircle2,
  Shuffle, ImagePlus, ImageIcon, Play, Pencil, PencilOff, Crop as CropIcon, Check
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { CarouselCard, ReminderMessage } from "@shared/types";
import { INDUSTRIES, MESSAGE_TYPES, REMINDER_TIMING_OPTIONS } from "@shared/types";
import type { ReminderTiming } from "@shared/types";
import { getIndustryPrompts } from "@shared/industryPrompts";
import type { MessageContent } from "@shared/types";
import ReminderEditor from "@/components/ReminderEditor";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { generateGifFromMockup, gifBlobToBase64, renderStaticScreenshotCanvas } from "@/lib/gifExport";
import { generateDomGif, gifBlobToBase64 as domGifBlobToBase64, captureStaticScreenshot } from "@/lib/domGifCapture";
import type { CaptureControl } from "@/components/WhatsAppMockup";
import ImageCropper from "@/components/ImageCropper";
import { validateFlow, getViolationMessageIds, type FlowValidationResult } from "@/lib/flowValidation";
import { validateUtilityCompliance, type ComplianceResult } from "@shared/utilityComplianceRules";
import { detectBranchPoints, resolveMessagePath, hasBranching, generateBranchId, getBranchesForPoint, getBranchStats } from "@/lib/branching";
import type { BranchConfig, BranchPoint, AdCreative } from "@shared/types";
import { GitBranch, GitFork } from "lucide-react";
import AdEntryPointEditor from "@/components/AdEntryPointEditor";
import JourneyModePreview from "@/components/JourneyModePreview";

interface LocalMessage {
  id: number;
  direction: "inbound" | "outbound";
  contentType: string;
  content: MessageContent;
  timestamp: string | null;
  isRead: boolean;
  sortOrder: number;
  /** If true, this entry represents a reminder message embedded in the list */
  isReminder?: boolean;
  /** Original reminder data (only set when isReminder is true) */
  reminderData?: ReminderMessage;
}

// Analytics helper - estimates based on WhatsApp Business industry benchmarks
function getConversationAnalytics(messages: LocalMessage[]) {
  const total = messages.length;
  const outbound = messages.filter(m => m.direction === 'outbound');
  const inbound = messages.filter(m => m.direction === 'inbound');
  const hasTemplate = outbound.some(m => m.contentType === 'template');
  const hasButtons = outbound.some(m => ['interactive_buttons', 'interactive_list'].includes(m.contentType));
  const hasCarousel = outbound.some(m => m.contentType === 'carousel');
  const hasImage = outbound.some(m => ['image', 'carousel'].includes(m.contentType));
  const hasVideo = outbound.some(m => m.contentType === 'video');
  const interactionPoints = outbound.filter(m => ['interactive_buttons', 'interactive_list', 'carousel', 'template'].includes(m.contentType)).length;
  
  // Base rates from WhatsApp Business benchmarks
  let openRate = 85 + Math.min(total * 0.5, 10);
  let clickRate = 15 + (hasButtons ? 12 : 0) + (hasCarousel ? 8 : 0) + (hasTemplate ? 5 : 0);
  let responseRate = 20 + (inbound.length / Math.max(total, 1)) * 40 + (hasButtons ? 10 : 0);
  let conversionRate = 8 + (interactionPoints * 4) + (hasImage ? 3 : 0) + (hasVideo ? 5 : 0);
  
  // Cap rates
  openRate = Math.min(openRate, 98);
  clickRate = Math.min(clickRate, 65);
  responseRate = Math.min(responseRate, 75);
  conversionRate = Math.min(conversionRate, 45);
  
  // Type breakdown
  const typeCounts: Record<string, number> = {};
  messages.forEach(m => {
    const label = (m.contentType || 'text').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    typeCounts[label] = (typeCounts[label] || 0) + 1;
  });
  
  const engagementByType: Record<string, string> = {
    'Text': 'Standard',
    'Template': 'High (CTA-driven)',
    'Interactive Buttons': 'Very High (1-tap response)',
    'Interactive List': 'High (structured selection)',
    'Image': 'High (visual engagement)',
    'Video': 'Very High (rich media)',
    'Carousel': 'Very High (product browsing)',
  };
  
  const typeBreakdown = Object.entries(typeCounts).map(([type, count]) => ({
    type,
    count,
    engagement: engagementByType[type] || 'Standard',
  }));
  
  return {
    openRate: `${Math.round(openRate)}%`,
    clickRate: `${Math.round(clickRate)}%`,
    responseRate: `${Math.round(responseRate)}%`,
    conversionRate: `${Math.round(conversionRate)}%`,
    totalMessages: total,
    businessMessages: outbound.length,
    customerMessages: inbound.length,
    interactionPoints,
    typeBreakdown,
  };
}

export default function Builder() {
  const { user } = useAuth();
  const [, params] = useRoute("/builder/:uid");
  const [, navigate] = useLocation();
  const uid = params?.uid;

  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [threadName, setThreadName] = useState("");
  const [profileName, setProfileName] = useState("Business");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessUrl, setBusinessUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [messageType, setMessageType] = useState<"marketing" | "utility" | "authentication">("marketing");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState<{
    step: number;
    totalSteps: number;
    label: string;
    startTime: number;
  } | null>(null);
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [pendingAutoCrawl, setPendingAutoCrawl] = useState(false);
  const [pendingAutoGenerate, setPendingAutoGenerate] = useState(false);
  const [crawlResult, setCrawlResult] = useState<any>(null);
  const [imagesGenerating, setImagesGenerating] = useState(() => {
    // Check URL parameter from Samples page navigation
    const params = new URLSearchParams(window.location.search);
    return params.get('imagesGenerating') === '1';
  });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [branchChoices, setBranchChoices] = useState<Map<number, string>>(new Map());
  const [addingBranchFor, setAddingBranchFor] = useState<{ sortOrder: number; triggerValue: string; label: string } | null>(null);
  const [branchMessages, setBranchMessages] = useState<LocalMessage[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [linkedTemplateId, setLinkedTemplateId] = useState<number | null>(null);
  const [exportProgress, setExportProgress] = useState('');
  const [exportProgressPercent, setExportProgressPercent] = useState(0);
  const gifCacheRef = useRef<{ key: string; blob: Blob } | null>(null);

  // Export progress overlay state
  const [exportOverlay, setExportOverlay] = useState<{
    active: boolean;
    type: 'gif' | 'pptx' | 'html';
    step: number;
    title: string;
    startTime: number;
    elapsed: number;
  }>({ active: false, type: 'gif', step: 0, title: '', startTime: 0, elapsed: 0 });
  const exportTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const GIF_EXPORT_STEPS = [
    { label: 'Preparing frames', description: 'Loading images and setting up the canvas...', pct: 10 },
    { label: 'Rendering conversation', description: 'Drawing each message frame by frame...', pct: 50 },
    { label: 'Encoding GIF', description: 'Compressing frames into an animated GIF...', pct: 80 },
    { label: 'Uploading', description: 'Saving your GIF for download...', pct: 95 },
    { label: 'Done!', description: 'Your animated GIF is ready!', pct: 100 },
  ];

  const PPTX_EXPORT_STEPS = [
    { label: 'Generating preview', description: 'Creating animated conversation preview...', pct: 10 },
    { label: 'Rendering frames', description: 'Drawing each message frame by frame...', pct: 40 },
    { label: 'Building slide deck', description: 'Assembling title, flow, and analytics slides...', pct: 70 },
    { label: 'Encoding presentation', description: 'Packaging your PowerPoint file...', pct: 85 },
    { label: 'Uploading', description: 'Saving your deck for download...', pct: 95 },
    { label: 'Done!', description: 'Your pitch deck is ready!', pct: 100 },
  ];

  const startExportOverlay = useCallback((type: 'gif' | 'pptx' | 'html', title: string) => {
    const now = Date.now();
    setExportOverlay({ active: true, type, step: 0, title, startTime: now, elapsed: 0 });
    if (exportTimerRef.current) clearInterval(exportTimerRef.current);
    exportTimerRef.current = setInterval(() => {
      setExportOverlay(prev => ({ ...prev, elapsed: Math.floor((Date.now() - prev.startTime) / 1000) }));
    }, 1000);
  }, []);

  const advanceExportStep = useCallback((step: number) => {
    setExportOverlay(prev => ({ ...prev, step }));
  }, []);

  const stopExportOverlay = useCallback(() => {
    if (exportTimerRef.current) { clearInterval(exportTimerRef.current); exportTimerRef.current = null; }
    // Brief delay to show "Done!" before closing
    setTimeout(() => {
      setExportOverlay(prev => ({ ...prev, active: false }));
    }, 800);
  }, []);

  useEffect(() => {
    return () => { if (exportTimerRef.current) clearInterval(exportTimerRef.current); };
  }, []);

  const [mockupEditMode, setMockupEditMode] = useState(false);
  const [adCreative, setAdCreative] = useState<AdCreative | null>(null);
  const [journeyMode, setJourneyMode] = useState(false);
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [clientAssets, setClientAssets] = useState<Array<{ url: string; name: string; type: string; thumbnail?: string }>>([]);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const captureControlRef = useRef<CaptureControl | null>(null);
  const [reminderMessages, setReminderMessages] = useState<ReminderMessage[]>([]);
  const [conversationLanguage, setConversationLanguage] = useState<SupportedLanguage>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('lang') as SupportedLanguage) || 'en';
  });
  const [languageManuallySet, setLanguageManuallySet] = useState(() => {
    // If language was explicitly set via URL param (not default 'en'), treat as manually set
    const params = new URLSearchParams(window.location.search);
    return !!params.get('lang') && params.get('lang') !== 'en';
  });

  // Detect if conversation has booking/appointment flow
  const hasBookingFlow = useMemo(() => {
    const bookingKeywords = /book|appoint|schedul|reserv|slot|consult/i;
    return localMessages.some(m => {
      const text = m.content.text || m.content.bodyText || '';
      const hasListWithDates = m.content.type === 'interactive_list' && (
        m.content.listSections?.some(s => 
          s.rows.some(r => bookingKeywords.test(r.title) || /\d{1,2}[:/]\d{2}|AM|PM|morning|afternoon|evening/i.test(r.title))
        ) || false
      );
      return bookingKeywords.test(text) || hasListWithDates;
    });
  }, [localMessages]);

  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<LocalMessage[][]>([]);
  const [redoStack, setRedoStack] = useState<LocalMessage[][]>([]);
  const [showInsertMenu, setShowInsertMenu] = useState<number | null>(null);

  // Flow validation - runs in real-time as messages change
  const flowValidation = useMemo<FlowValidationResult>(() => {
    return validateFlow(localMessages.map(m => ({
      id: m.id,
      direction: m.direction,
      contentType: m.contentType,
      content: m.content as any,
    })));
  }, [localMessages]);

  const violationMessageIds = useMemo(() => getViolationMessageIds(flowValidation), [flowValidation]);

  // Utility compliance validation - runs in real-time for utility threads
  const utilityCompliance = useMemo<ComplianceResult>(() => {
    return validateUtilityCompliance(
      localMessages.map(m => ({
        direction: m.direction,
        contentType: m.contentType,
        content: m.content as any,
      })),
      messageType
    );
  }, [localMessages, messageType]);

  // Load thread data
  const { data: threadData, refetch } = trpc.thread.get.useQuery(
    { uid: uid! },
    { enabled: !!uid }
  );

  // CRITICAL FIX: Hydrate messages from sessionStorage immediately on mount.
  // When navigating from Samples/Templates page, messages are stored in sessionStorage
  // so they can render instantly without waiting for the React Query refetch.
  const sessionHydrated = useRef(false);
  useEffect(() => {
    if (!uid || sessionHydrated.current) return;
    try {
      const cached = sessionStorage.getItem(`thread-messages-${uid}`);
      if (cached) {
        const msgs = JSON.parse(cached);
        if (Array.isArray(msgs) && msgs.length > 0) {
          setLocalMessages(msgs.map((m: any) => ({
            id: m.id,
            direction: m.direction,
            contentType: m.contentType,
            content: m.content as MessageContent,
            timestamp: m.timestamp,
            isRead: m.isRead,
            sortOrder: m.sortOrder,
          })));
          sessionHydrated.current = true;
          // Clean up sessionStorage
          sessionStorage.removeItem(`thread-messages-${uid}`);
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, [uid]);

  // Pre-fill from URL query params (used by /create quick-create flow)
  const prefillApplied = useRef(false);
  const autoGenerateAfterCrawl = useRef(false);
  // Track the last synced message fingerprint to avoid unnecessary resets
  const lastSyncedFingerprintRef = useRef<string>("");
  useEffect(() => {
    if (threadData) {
      setThreadName(threadData.thread.name);
      setProfileName(threadData.thread.profileName || "Business");
      setProfileImageUrl(threadData.thread.profileImageUrl || null);
      setBusinessName(threadData.thread.businessName || "");
      setBusinessUrl(threadData.thread.businessUrl || "");
      setIndustry(threadData.thread.industry || "");
      setMessageType(threadData.thread.messageType);

      // Hydrate ad creative from thread data
      const threadAdCreative = (threadData.thread as any).adCreative;
      if (threadAdCreative && !adCreative) {
        setAdCreative(threadAdCreative);
        if (threadAdCreative.enabled) setJourneyMode(true);
      }

      // Build a fingerprint of the server messages to detect actual changes.
      // This prevents the WhatsApp mockup from resetting on every polling refetch
      // when only the object references change but the data is identical.
      const newFingerprint = threadData.messages.map(m => {
        const c = m.content as any;
        // Include image URLs in fingerprint so we detect when background generation completes
        const imageUrls = [
          c?.headerImageUrl || '',
          c?.imageUrl || '',
          c?.videoPosterUrl || '',
          ...(c?.carouselCards?.map((card: any) => card.imageUrl || '') || []),
        ].join('|');
        return `${m.id}:${m.sortOrder}:${imageUrls}:${c?.bodyText || ''}:${c?.text || ''}:${c?.headerText || ''}`;
      }).join(';;');

      if (newFingerprint !== lastSyncedFingerprintRef.current) {
        lastSyncedFingerprintRef.current = newFingerprint;
        const regularMsgs: LocalMessage[] = threadData.messages.map(m => ({
          id: m.id,
          direction: m.direction,
          contentType: m.contentType,
          content: m.content as MessageContent,
          timestamp: m.timestamp,
          isRead: m.isRead,
          sortOrder: m.sortOrder,
        }));
        const reminders: ReminderMessage[] = (threadData.thread as any).reminderMessages || [];
        setReminderMessages(reminders);
        // Merge reminders into the message list at their sortPosition
        const reminderLocalMsgs: LocalMessage[] = reminders
          .filter(r => r.enabled)
          .map((r, idx) => ({
            id: -(1000 + idx), // negative IDs for reminders
            direction: "outbound" as const,
            contentType: r.contentType,
            content: r.content,
            timestamp: r.timing === "24h_before" ? "9:00 AM" :
                       r.timing === "on_day" ? "8:00 AM" :
                       r.timing === "1h_before" ? "9:00 AM" :
                       r.timing === "30min_before" ? "9:30 AM" : "4:00 PM",
            isRead: true,
            sortOrder: r.sortPosition ?? (regularMsgs.length + idx),
            isReminder: true,
            reminderData: r,
          }));
        // Build combined list: insert reminders at their sortPosition
        const combined = [...regularMsgs];
        for (const rm of reminderLocalMsgs) {
          const insertIdx = Math.min(rm.sortOrder, combined.length);
          combined.splice(insertIdx, 0, rm);
        }
        setLocalMessages(combined);
      } else {
        // Still update reminders even if fingerprint hasn't changed
        setReminderMessages((threadData.thread as any).reminderMessages || []);
      }

      // Apply URL pre-fill params (only once)
      if (!prefillApplied.current) {
        const urlParams = new URLSearchParams(window.location.search);
        const prefillPrompt = urlParams.get('prompt');
        const prefillBusinessName = urlParams.get('businessName');
        const prefillBusinessUrl = urlParams.get('businessUrl');
        const prefillImageUrl = urlParams.get('imageUrl');
        const autoGenerate = urlParams.get('autoGenerate') === 'true';

        if (prefillPrompt) setAiPrompt(prefillPrompt);
        if (prefillBusinessName) setBusinessName(prefillBusinessName);
        if (prefillBusinessUrl) setBusinessUrl(prefillBusinessUrl);
        if (prefillImageUrl) setProfileImageUrl(prefillImageUrl);

        // Clean up URL params
        if (prefillPrompt || prefillBusinessName || prefillBusinessUrl || prefillImageUrl || autoGenerate) {
          window.history.replaceState({}, '', window.location.pathname);
          prefillApplied.current = true;

          // Auto-trigger: if businessUrl provided, crawl first then generate
          if (autoGenerate && threadData.messages.length === 0) {
            if (prefillBusinessUrl) {
              // Auto-crawl the website, then auto-generate after crawl completes
              autoGenerateAfterCrawl.current = true;
              setPendingAutoCrawl(true);
            } else if (prefillPrompt) {
              // No URL, just auto-generate with the prompt
              setPendingAutoGenerate(true);
            }
          }
        }
      }
    }
  }, [threadData]);
  // Auto-crawl when pendingAutoCrawl is set (from landing page URL flow)
  useEffect(() => {
    if (pendingAutoCrawl && businessUrl.trim() && !isCrawling) {
      setPendingAutoCrawl(false);
      // Show settings panel so user can see the crawl progress
      setShowSettings(true);
      // Small delay to let React render the settings panel
      setTimeout(() => handleCrawl(), 100);
    }
  }, [pendingAutoCrawl, businessUrl]);

  // Auto-generate when pendingAutoGenerate is set (from landing page URL flow without URL)
  // Also depends on conversationLanguage so it waits for auto-detected language to be set before generating
  useEffect(() => {
    if (pendingAutoGenerate && aiPrompt.trim() && !isGenerating) {
      setPendingAutoGenerate(false);
      handleGenerate();
    }
  }, [pendingAutoGenerate, aiPrompt, conversationLanguage]);

  // Start polling when imagesGenerating was set from URL parameter (navigating from Samples)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('imagesGenerating') !== '1') return;
    // Clean up URL parameter
    window.history.replaceState({}, '', window.location.pathname);
    // Start polling for AI image updates
    toast.info("Generating high-quality images...", { duration: 5000 });
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      refetch();
      if (pollCount >= 12) {
        clearInterval(pollInterval);
        setImagesGenerating(false);
      }
    }, 5000);
    const timeout = setTimeout(() => {
      refetch();
      setImagesGenerating(false);
      clearInterval(pollInterval);
    }, 60000);
    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [refetch]);

  // Auto-detect if images are still being generated when Builder loads.
  // This handles the case when navigating from Samples/Templates page
  // where image generation was started but Builder doesn't know about it
  useEffect(() => {
    if (!threadData || imagesGenerating) return;
    const msgs = threadData.messages;
    const hasPendingImages = msgs.some((m: any) => {
      const c = m.content;
      if (!c) return false;
      // Image message with description but no URL
      if (c.imageDescription && !c.imageUrl) return true;
      // Template header with GENERATE_IMAGE prefix
      if (c.headerImageUrl && typeof c.headerImageUrl === 'string' && c.headerImageUrl.startsWith('GENERATE_IMAGE:')) return true;
      // Video with description but no poster
      if (c.videoDescription && !c.videoPosterUrl) return true;
      // Carousel cards with description but no URL
      if (c.carouselCards && Array.isArray(c.carouselCards)) {
        return c.carouselCards.some((card: any) => card.imageDescription && !card.imageUrl);
      }
      return false;
    });
    if (hasPendingImages) {
      console.log('[Builder] Detected pending images, starting auto-poll');
      setImagesGenerating(true);
      let pollCount = 0;
      const pollInterval = setInterval(() => {
        pollCount++;
        refetch();
        if (pollCount >= 12) {
          clearInterval(pollInterval);
          setImagesGenerating(false);
        }
      }, 5000);
      // Final cleanup after 60s
      const timeout = setTimeout(() => {
        refetch();
        setImagesGenerating(false);
        clearInterval(pollInterval);
      }, 60000);
      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeout);
      };
    }
  }, [threadData, imagesGenerating, refetch]);

  const updateThread = trpc.thread.update.useMutation({
    onSuccess: () => { refetch(); toast.success("Thread updated"); },
  });
  const uploadMutation = trpc.upload.file.useMutation();
  const fileExportMutation = trpc.fileExport.upload.useMutation();

  const createMessage = trpc.message.create.useMutation({
    onSuccess: () => refetch(),
  });

  const updateMessage = trpc.message.update.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMessage = trpc.message.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const toggleShare = trpc.thread.toggleShare.useMutation({
    onSuccess: (result) => {
      refetch();
      if (result?.isPublic) {
        const shareUrl = `${window.location.origin}/shared/${result.shareToken}`;
        navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied to clipboard!");
      } else {
        toast.success("Sharing disabled");
      }
    },
  });

  const createThread = trpc.thread.create.useMutation();
  const generateFlow = trpc.ai.generateFlow.useMutation();
  const crawlWebsite = trpc.ai.crawlWebsite.useMutation();
  const generateAdCreative = trpc.ai.generateAdCreative.useMutation();
  const reorderMessages = trpc.message.reorder.useMutation({
    onSuccess: () => refetch(),
  });

  const fixInteractivity = trpc.message.fixInteractivity.useMutation();
  const duplicateMessage = trpc.message.duplicate.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Message duplicated");
    },
  });

  // DnD sensors for drag-and-drop reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !uid) return;
    pushUndo();
    const oldIndex = localMessages.findIndex(m => m.id === active.id);
    const newIndex = localMessages.findIndex(m => m.id === over.id);
    const newMessages = arrayMove(localMessages, oldIndex, newIndex);
    setLocalMessages(newMessages);
    // Separate regular messages from reminders for saving
    const regularOnly = newMessages.filter(m => !m.isReminder);
    reorderMessages.mutate({
      threadUid: uid,
      messageIds: regularOnly.map(m => m.id),
    });
    // Update reminder sortPositions: count of regular messages before this reminder
    const updatedReminders = reminderMessages.map(r => {
      const combinedIdx = newMessages.findIndex(m => m.isReminder && m.reminderData?.id === r.id);
      if (combinedIdx < 0) return { ...r, sortPosition: undefined };
      const regularMsgsBefore = newMessages.slice(0, combinedIdx).filter(m => !m.isReminder).length;
      return { ...r, sortPosition: regularMsgsBefore };
    });
    setReminderMessages(updatedReminders);
    updateThread.mutate({ uid, reminderMessages: updatedReminders });
  };

  // Preview as client handler
  const handlePreviewAsClient = async () => {
    // Open window synchronously to avoid popup blocker
    const previewWindow = window.open('about:blank', '_blank');
    try {
      if (!threadData?.thread.isPublic) {
        // Enable sharing first
        await toggleShare.mutateAsync({ uid: uid! });
      }
      // Wait for refetch to get the share token
      const result = await refetch();
      const shareToken = result.data?.thread.shareToken;
      if (shareToken && previewWindow) {
        previewWindow.location.href = `${window.location.origin}/shared/${shareToken}?mode=presentation`;
      } else if (previewWindow) {
        previewWindow.close();
        toast.error("Failed to generate preview link");
      } else {
        toast.error("Popup blocked. Please allow popups for this site.");
      }
    } catch (err) {
      previewWindow?.close();
      toast.error("Failed to generate preview link");
    }
  };

  // Push current state to undo stack before any mutation
  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), localMessages]);
    setRedoStack([]);
  }, [localMessages]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, localMessages]);
    setUndoStack(u => u.slice(0, -1));
    setLocalMessages(prev);
    // Reorder on server to match
    if (uid) {
      reorderMessages.mutate({
        threadUid: uid,
        messageIds: prev.map(m => m.id),
      });
    }
  }, [undoStack, localMessages, uid]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, localMessages]);
    setRedoStack(r => r.slice(0, -1));
    setLocalMessages(next);
    if (uid) {
      reorderMessages.mutate({
        threadUid: uid,
        messageIds: next.map(m => m.id),
      });
    }
  }, [redoStack, localMessages, uid]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  const handleDuplicateMessage = (msgId: number) => {
    if (!uid) return;
    pushUndo();
    duplicateMessage.mutate({ threadUid: uid, messageId: msgId });
  };

  const handleInsertAfter = (afterIndex: number, direction: "inbound" | "outbound", type: string = "text") => {
    if (!uid) return;
    pushUndo();
    const defaultContent: MessageContent = { type: type as any };
    if (type === "text") {
      defaultContent.text = direction === "outbound" ? "Hello! How can I help you today?" : "Hi, I'm interested!";
    } else if (type === "template") {
      defaultContent.headerText = "YOUR OFFER TITLE";
      defaultContent.bodyText = "Check out our latest offer!";
      defaultContent.footerText = "Business Name";
      defaultContent.buttons = [{ id: "cta1", title: "Learn More" }];
    } else if (type === "interactive_buttons") {
      defaultContent.text = "Please choose an option:";
      defaultContent.buttons = [{ id: "opt1", title: "Option 1" }, { id: "opt2", title: "Option 2" }];
    } else if (type === "image") {
      defaultContent.imageUrl = "";
      defaultContent.caption = "";
    } else if (type === "video") {
      defaultContent.videoUrl = "";
      defaultContent.caption = "";
    } else if (type === "carousel") {
      defaultContent.text = "Check out our products:";
      defaultContent.carouselCards = [
        { id: "card1", title: "Product 1", description: "", price: "$29.99", buttonText: "Buy Now", imageUrl: "" },
      ];
    }
    // Create message at end, then reorder to insert after the target
    createMessage.mutate(
      {
        threadUid: uid,
        direction,
        contentType: type as any,
        content: defaultContent,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      },
      {
        onSuccess: (newMsg: any) => {
          // After creation, reorder to place it after the target index
          const currentIds = localMessages.map(m => m.id);
          currentIds.splice(afterIndex + 1, 0, newMsg.id);
          reorderMessages.mutate({ threadUid: uid!, messageIds: currentIds });
          setShowInsertMenu(null);
          toast.success("Message inserted");
        },
      }
    );
  };

  const handleMoveMessage = (index: number, direction: "up" | "down") => {
    if (!uid) return;
    pushUndo();
    const newMessages = [...localMessages];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newMessages.length) return;
    [newMessages[index], newMessages[targetIndex]] = [newMessages[targetIndex], newMessages[index]];
    setLocalMessages(newMessages);
    reorderMessages.mutate({
      threadUid: uid,
      messageIds: newMessages.map(m => m.id),
    });
  };

  const handleChangeDirection = (msgId: number, newDirection: "inbound" | "outbound") => {
    pushUndo();
    updateMessage.mutate({
      id: msgId,
      direction: newDirection,
    });
    // Optimistically update local state
    setLocalMessages(prev => prev.map(m => m.id === msgId ? { ...m, direction: newDirection } : m));
  };

  const handleChangeType = (msgId: number, newType: MessageContent["type"], currentContent: MessageContent) => {
    pushUndo();
    // Smart content migration: preserve text content when switching types
    const text = currentContent.text || currentContent.bodyText || currentContent.headerText || "";
    let newContent: MessageContent = { type: newType };
    
    switch (newType) {
      case "text":
        newContent.text = text || "Hello!";
        break;
      case "template":
        newContent.headerText = currentContent.headerText || "";
        newContent.headerImageUrl = currentContent.headerImageUrl || currentContent.imageUrl || "";
        newContent.bodyText = text || "Check out our latest offer!";
        newContent.footerText = currentContent.footerText || "";
        newContent.buttons = currentContent.buttons || [{ id: "cta1", title: "Learn More" }];
        break;
      case "interactive_buttons":
        newContent.text = text || "Please choose an option:";
        newContent.buttons = currentContent.buttons || [
          { id: "opt1", title: "Option 1" },
          { id: "opt2", title: "Option 2" },
        ];
        break;
      case "interactive_list":
        newContent.text = text || "Browse our options:";
        newContent.listButtonText = currentContent.listButtonText || "View Options";
        newContent.listSections = currentContent.listSections || [{
          title: "Section 1",
          rows: [{ id: "r1", title: "Item 1", description: "" }],
        }];
        break;
      case "image":
        newContent.imageUrl = currentContent.imageUrl || currentContent.headerImageUrl || "";
        newContent.caption = text || "";
        break;
      case "video":
        newContent.videoUrl = currentContent.videoUrl || "";
        newContent.caption = text || "";
        break;
      case "carousel":
        newContent.text = text || "Check out our products:";
        newContent.carouselCards = currentContent.carouselCards || [
          { id: "card1", title: "Product 1", description: "", price: "$29.99", buttonText: "Buy Now", imageUrl: "" },
        ];
        break;
    }
    
    updateMessage.mutate({
      id: msgId,
      content: newContent,
      contentType: newType,
    });
    // Optimistically update local state
    setLocalMessages(prev => prev.map(m => m.id === msgId ? { ...m, contentType: newType, content: newContent } : m));
    setEditingMessage(msgId); // Keep editing open to show new fields
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a description of the conversation flow you want to create");
      return;
    }
    setIsGenerating(true);
    const startTime = Date.now();
    const hasWebsite = !!crawlResult?.products?.length || !!crawlResult?.services?.length;
    const hasAssets = clientAssets.length > 0;
    const hasImageAssets = clientAssets.filter(a => a.type === "image").length > 0;
    const totalSteps = (hasWebsite ? 4 : 3) + (hasAssets ? 1 : 0) + (hasImageAssets ? 1 : 0);
    
    try {
      // Step 1: Preparing
      setGenerationProgress({ step: 1, totalSteps, label: "Preparing business context...", startTime });
      
      // Build business profile from crawl result if available
      const businessProfile = hasWebsite
        ? {
            businessName: crawlResult.businessName || businessName || "",
            industry: crawlResult.industry || industry || "",
            description: crawlResult.description || "",
            tagline: crawlResult.tagline,
            brandTone: crawlResult.brandTone,
            logoUrl: crawlResult.logoUrl,
            heroImageUrl: crawlResult.heroImageUrl,
            products: crawlResult.products,
            services: crawlResult.services,
          }
        : undefined;

      // Step 2: Generating conversation
      await new Promise(r => setTimeout(r, 300)); // Brief pause so user sees step 1
      // Step for vision analysis (happens server-side during generation)
      if (hasImageAssets) {
        setGenerationProgress({ step: 2, totalSteps, label: `Classifying & analyzing ${clientAssets.filter(a => a.type === "image").length} image${clientAssets.filter(a => a.type === "image").length > 1 ? 's' : ''} (detecting workflows vs products)...`, startTime });
        await new Promise(r => setTimeout(r, 800));
      }
      setGenerationProgress({ step: hasImageAssets ? 3 : 2, totalSteps, label: hasAssets ? "AI is crafting your conversation with your assets..." : "AI is crafting your conversation & generating images...", startTime });

      // If no thread exists yet (new builder), create one first
      let effectiveUid = uid;
      let isNewThread = false;
      if (!effectiveUid || effectiveUid === 'new') {
        effectiveUid = undefined as any;
        const threadTitle = businessName || aiPrompt.substring(0, 60).trim() || "New Thread";
        const newThread = await createThread.mutateAsync({
          name: threadTitle,
          industry: industry || undefined,
          messageType,
          businessUrl: businessUrl || undefined,
        });
        effectiveUid = newThread.uid;
        isNewThread = true;
        // DON'T navigate yet - wait until generateFlow completes so the page doesn't re-mount
      }

      const result = await generateFlow.mutateAsync({
        prompt: aiPrompt,
        businessName: businessName || undefined,
        businessUrl: businessUrl || undefined,
        industry: industry || undefined,
        messageType,
        threadUid: effectiveUid,
        businessProfile,
        clientAssets: clientAssets.length > 0
          ? clientAssets.map(a => ({ url: a.url, name: a.name, type: a.type as "image" | "video" }))
          : undefined,
        language: conversationLanguage,
      });

      // Step 3: Processing results (images are already generated server-side)
      let currentStep = 3;
      setGenerationProgress({ step: totalSteps, totalSteps, label: "Finalizing conversation...", startTime });

      if (result.profileName) {
        setProfileName(result.profileName);
      }

      // Pick up AI-generated reminder messages
      if (result.reminderMessages && Array.isArray(result.reminderMessages) && result.reminderMessages.length > 0) {
        setReminderMessages(result.reminderMessages);
        toast.info(`Added ${result.reminderMessages.length} follow-up reminders`, { duration: 3000 });
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const assetNote = hasAssets ? ` (with ${clientAssets.length} client asset${clientAssets.length > 1 ? 's' : ''})` : '';
      toast.success(`Generated ${result.messages?.length || 0} messages${assetNote} with images in ${elapsed}s!`);
      
      // Immediately set localMessages from saved DB messages
      // Images are already resolved server-side, so no background polling needed.
      if (result.savedMessages && Array.isArray(result.savedMessages) && result.savedMessages.length > 0) {
        setLocalMessages(result.savedMessages.map((m: any) => ({
          id: m.id,
          direction: m.direction,
          contentType: m.contentType,
          content: m.content as MessageContent,
          timestamp: m.timestamp,
          isRead: m.isRead,
          sortOrder: m.sortOrder,
        })));
      }
      
      // Handle CTWA ad creative if returned from AI generation
      if (result.adCreative) {
        setAdCreative(result.adCreative);
        setJourneyMode(true);
        toast.success('CTWA ad creative auto-generated! Journey Mode enabled.', { duration: 4000 });
      }

      // Navigate to the new thread AFTER generation is complete (so messages are saved)
      if (isNewThread && effectiveUid) {
        navigate(`/builder/${effectiveUid}`, { replace: true });
      } else {
        // For existing threads, refetch to ensure React Query cache is up to date
        refetch();
      }
      setAiPrompt("");

      // Images are already generated synchronously on the server.
      // No background polling needed — the response already contains final image URLs.
      setImagesGenerating(false);
    } catch (error) {
      toast.error("Failed to generate conversation flow. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  const handleCrawl = async () => {
    if (!businessUrl.trim()) {
      toast.error("Please enter a website URL");
      return;
    }
    setIsCrawling(true);
    setCrawlProgress("Connecting to website...");
    try {
      // Simulate progress steps while the backend crawls
      const progressTimer = setInterval(() => {
        setCrawlProgress(prev => {
          if (prev === "Connecting to website...") return "Crawling pages...";
          if (prev === "Crawling pages...") return "Extracting products & services...";
          if (prev === "Extracting products & services...") return "Analyzing with AI...";
          return prev;
        });
      }, 3000);
      const result = await crawlWebsite.mutateAsync({ url: businessUrl });
      clearInterval(progressTimer);
      setCrawlProgress("Done!");
      setCrawlResult(result);
      setBusinessName(result.businessName);
      setIndustry(result.industry);
      if (result.businessName) setProfileName(result.businessName);

      // Auto-detect language from the crawled website
      if (result.detectedLanguage && result.detectedLanguage !== 'en' && !languageManuallySet) {
        const supportedCodes = SUPPORTED_LANGUAGES.map(l => l.code);
        if (supportedCodes.includes(result.detectedLanguage as SupportedLanguage)) {
          setConversationLanguage(result.detectedLanguage as SupportedLanguage);
          const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === result.detectedLanguage);
          if (langInfo) {
            toast.info(`Language auto-detected: ${langInfo.flag} ${langInfo.label}`, {
              description: "Conversation will be generated in this language. You can change it below.",
              duration: 5000,
            });
          }
        }
      }

      // Update thread with crawled data
      if (uid) {
        await updateThread.mutateAsync({
          uid,
          businessName: result.businessName,
          businessContext: result.description,
          industry: result.industry,
          profileName: result.businessName,
        });
      }

      const productCount = (result.products?.length || 0) + (result.services?.length || 0);
      toast.success(
        productCount > 0
          ? `Extracted ${productCount} products/services from ${result.businessName}`
          : `Analyzed: ${result.businessName} (${result.industry})`
      );

      // Auto-populate AI prompt with first suggestion
      if (result.suggestedUseCases?.length > 0) {
        const suggestion = result.suggestedUseCases[0];
        setAiPrompt(`Create a ${suggestion.messageType} message flow for ${result.businessName}: ${suggestion.description}`);
        setMessageType(suggestion.messageType as any);
      }

      // Auto-generate if this was triggered from the landing page URL flow
      if (autoGenerateAfterCrawl.current) {
        autoGenerateAfterCrawl.current = false;
        // Use state-driven approach instead of DOM clicking
        setPendingAutoGenerate(true);
      }
    } catch (error) {
      autoGenerateAfterCrawl.current = false;
      toast.error("Failed to analyze website. Please try again.");
    } finally {
      setIsCrawling(false);
      setCrawlProgress("");
    }
  };

  const handleAddMessage = (direction: "inbound" | "outbound", type: string = "text") => {
    if (!uid) return;
    const defaultContent: MessageContent = { type: type as any };
    if (type === "text") {
      defaultContent.text = direction === "outbound" ? "Hello! How can I help you today?" : "Hi, I'm interested!";
    } else if (type === "template") {
      defaultContent.headerText = "YOUR OFFER TITLE";
      defaultContent.bodyText = "Check out our latest offer! We have something special for you.";
      defaultContent.footerText = "Business Name";
      defaultContent.buttons = [
        { id: "cta1", title: "Learn More" },
        { id: "cta2", title: "Not Now" },
      ];
    } else if (type === "interactive_buttons") {
      defaultContent.text = "Please choose an option:";
      defaultContent.buttons = [
        { id: "opt1", title: "Option 1" },
        { id: "opt2", title: "Option 2" },
        { id: "opt3", title: "Option 3" },
      ];
    } else if (type === "interactive_list") {
      defaultContent.text = "Browse our options:";
      defaultContent.listButtonText = "View Options";
      defaultContent.listSections = [
        {
          title: "Section 1",
          rows: [
            { id: "r1", title: "Item 1", description: "Description" },
            { id: "r2", title: "Item 2", description: "Description" },
          ],
        },
      ];
    } else if (type === "video") {
      defaultContent.videoUrl = "";
      defaultContent.caption = "";
    } else if (type === "carousel") {
      defaultContent.text = "Check out our products:";
      defaultContent.carouselCards = [
        { id: "card1", title: "Product 1", description: "Description", price: "$29.99", buttonText: "Buy Now", imageUrl: "" },
        { id: "card2", title: "Product 2", description: "Description", price: "$49.99", buttonText: "Learn More", imageUrl: "" },
      ];
    }

    createMessage.mutate({
      threadUid: uid,
      direction,
      contentType: type as any,
      content: defaultContent,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    });
  };

  const handleDeleteMessage = (id: number) => {
    pushUndo();
    deleteMessage.mutate({ id });
    toast.success("Message deleted");
  };

  const handleSaveSettings = () => {
    if (!uid) return;
    updateThread.mutate({
      uid,
      name: threadName,
      profileName,
      businessName: businessName || undefined,
      businessUrl: businessUrl || undefined,
      industry: industry || undefined,
      messageType,
    });
    setShowSettings(false);
  };

  const handleShare = () => {
    if (!uid) return;
    if (threadData?.thread.isPublic && threadData.thread.shareToken) {
      const shareUrl = `${window.location.origin}/shared/${threadData.thread.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } else {
      toggleShare.mutate({ uid });
    }
  };

  const handleCopyShareLink = () => {
    if (threadData?.thread.shareToken) {
      const shareUrl = `${window.location.origin}/shared/${threadData.thread.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied!");
    }
  };

  const getShareUrl = () => {
    if (threadData?.thread.isPublic && threadData.thread.shareToken) {
      return `${window.location.origin}/shared/${threadData.thread.shareToken}`;
    }
    return null;
  };

  const trpcUtils = trpc.useUtils();

  const handleExportInteractiveHtml = async () => {
    if (!uid) return;
    setIsExporting(true);
    try {
      // Use embedImages=true so the HTML file works offline with all images embedded
      const result = await trpcUtils.thread.exportHtml.fetch({ uid, embedImages: true });
      const blob = new Blob([result.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${threadName.replace(/[^a-zA-Z0-9]/g, '_')}_interactive.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast.success("Interactive HTML downloaded!");
    } catch (e) {
      toast.error("Failed to export");
    } finally {
      setIsExporting(false);
    }
  };


  const handleShareViaEmail = () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) {
      toast.error("Enable sharing first by clicking the Share button");
      return;
    }
    const subject = encodeURIComponent(`WhatsApp Demo: ${threadName}`);
    const body = encodeURIComponent(`Hi,\n\nCheck out this WhatsApp conversation demo I created:\n\n${threadName}\n${shareUrl}\n\nYou can interact with the conversation flow by clicking the buttons in the demo.\n\nBest regards`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleShareViaWorkchat = () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) {
      toast.error("Enable sharing first by clicking the Share button");
      return;
    }
    const text = encodeURIComponent(`Check out this WhatsApp conversation demo: ${threadName} - ${shareUrl}`);
    window.open(`https://work.facebook.com/chat/t/?text=${text}`, '_blank');
  };

  // Save as Template handler
  const saveTemplate = trpc.savedTemplate.save.useMutation();
  const updateTemplateSnapshot = trpc.savedTemplate.updateSnapshot.useMutation();
  const { data: savedTemplatesList } = trpc.savedTemplate.list.useQuery(undefined, { enabled: !!uid });

  // Detect if this thread is linked to a saved template
  useEffect(() => {
    if (savedTemplatesList && uid) {
      const linked = savedTemplatesList.find((t: any) => t.sourceThreadUid === uid);
      setLinkedTemplateId(linked ? linked.id : null);
    }
  }, [savedTemplatesList, uid]);

  const handleSaveProgress = async () => {
    if (!uid || !linkedTemplateId) return;
    try {
      await updateTemplateSnapshot.mutateAsync({
        templateId: linkedTemplateId,
        threadUid: uid,
      });
      toast.success("Template progress saved!");
    } catch (error) {
      toast.error("Failed to save progress");
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!uid || !templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    setIsSavingTemplate(true);
    try {
      await saveTemplate.mutateAsync({
        threadUid: uid,
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
      });
      toast.success("Template saved! Find it in your Templates library.");
      setShowSaveTemplateDialog(false);
      setTemplateName("");
      setTemplateDescription("");
    } catch (error) {
      toast.error("Failed to save template");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Build a cache key from message content so we can skip re-capture if nothing changed
  const buildGifCacheKey = (): string => {
    const mainPathMessages = localMessages.filter(m => !m.content.branchConfig);
    const parts = mainPathMessages.map(m => {
      const c = m.content;
      return `${m.direction}|${c.text || ''}|${c.bodyText || ''}|${c.headerText || ''}|${c.headerImageUrl || ''}|${c.imageUrl || ''}|${(c.carouselCards || []).length}|${(c.buttons || []).length}|${(c.listSections || []).length}`;
    });
    parts.push(profileName || '', businessName || '');
    return parts.join('::');
  };

  // Client-side GIF capture using DOM screenshot of the actual phone mockup
  const captureGifFromMockupFn = async (): Promise<Blob | null> => {
    try {
      // Check cache first
      const cacheKey = buildGifCacheKey();
      if (gifCacheRef.current && gifCacheRef.current.key === cacheKey) {
        setExportProgress('Using cached GIF...');
        setExportProgressPercent(100);
        await new Promise(r => setTimeout(r, 300));
        setExportProgress('');
        setExportProgressPercent(0);
        return gifCacheRef.current.blob;
      }

      // Use Canvas 2D renderer directly - it's deterministic and doesn't depend on DOM cloning
      setExportProgress('Preparing animated GIF...');
      // Advance overlay: step 0 = Preparing frames (GIF) or step 0/1 = Generating preview / Rendering frames (PPTX)
      const mainPathMessages = localMessages.filter(m => !m.content.branchConfig);
      const simpleMessages = mainPathMessages.map(m => ({
        direction: m.direction,
        content: m.content,
        timestamp: m.timestamp,
      }));
      // Preload images via proxy
      const imageUrls: string[] = [];
      for (const msg of mainPathMessages) {
        const c = msg.content;
        if (c.headerImageUrl) imageUrls.push(c.headerImageUrl);
        if (c.imageUrl) imageUrls.push(c.imageUrl);
        if (c.carouselCards) {
          for (const card of c.carouselCards) {
            if (card.imageUrl) imageUrls.push(card.imageUrl);
          }
        }
      }
      const preloadedImages = new Map<string, string>();
      const uniqueUrls = Array.from(new Set(imageUrls));
      if (uniqueUrls.length > 0) {
        setExportProgress('Loading images...');
        // Still in "Preparing frames" step
        await Promise.allSettled(
          uniqueUrls.map(async (url) => {
            try {
              // Extract the actual URL from proxied URLs like /api/image-proxy?url=...
              let fetchUrl = url;
              if (url.startsWith('/api/image-proxy?url=')) {
                try {
                  const proxyParams = new URLSearchParams(url.split('?')[1]);
                  fetchUrl = proxyParams.get('url') || url;
                } catch { /* use original url */ }
              }
              const result = await trpcUtils.imageProxy.fetch.fetch({ url: fetchUrl });
              // Store with the ORIGINAL url as key (matches what's in message content)
              if (result.dataUrl) preloadedImages.set(url, result.dataUrl);
            } catch { /* skip */ }
          })
        );
      }
      const initials = (profileName || 'B').substring(0, 2).toUpperCase();
      // Advance to rendering step (step 1 for both GIF and PPTX)
      advanceExportStep(1);
      const gifBlob = await generateGifFromMockup({
        messages: simpleMessages,
        businessName: profileName || businessName || 'Business',
        profileInitials: initials,
        preloadedImages,
        frameDelay: 800,
        onProgress: (current: number, total: number) => {
          setExportProgress(`Rendering frame ${current} of ${total}...`);
          setExportProgressPercent(total > 0 ? Math.round((current / total) * 100) : 0);
        },
      });
      setExportProgress('');
      setExportProgressPercent(0);

      // Cache the result
      gifCacheRef.current = { key: cacheKey, blob: gifBlob };

      return gifBlob;
    } catch (err) {
      console.error('GIF capture failed:', err);
      setExportProgress('');
      setExportProgressPercent(0);
      return null;
    }
  };

  // Download GIF handler
  const handleExportGif = async () => {
    if (!uid) return;
    setIsExporting(true);
    startExportOverlay('gif', 'Animated GIF');
    try {
      // Step 0: Preparing frames (already set by startExportOverlay)
      const gifBlob = await captureGifFromMockupFn();
      if (!gifBlob) {
        stopExportOverlay();
        toast.error('Failed to generate GIF. Please try again.');
        return;
      }
      // Step 2: Encoding GIF (frames are done)
      advanceExportStep(2);
      const gifFileName = `${threadName.replace(/[^a-zA-Z0-9]/g, '_')}_conversation.gif`;
      const arrayBuffer = await gifBlob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        const chunk = uint8.slice(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binary);
      // Step 3: Uploading
      advanceExportStep(3);
      console.log('[GIF] Uploading to S3, base64 length:', base64.length);
      const result = await fileExportMutation.mutateAsync({
        fileName: gifFileName,
        base64Data: base64,
        contentType: 'image/gif',
      });
      console.log('[GIF] S3 URL:', result.url);
      // Step 4: Done!
      advanceExportStep(4);
      // Fetch from S3 and trigger a proper file download
      try {
        const response = await fetch(result.url);
        const downloadBlob = await response.blob();
        const blobUrl = URL.createObjectURL(downloadBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = gifFileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      } catch {
        window.open(result.url, '_blank');
      }
      stopExportOverlay();
      toast.success('Animated GIF downloaded!');
    } catch (e) {
      console.error('GIF export error:', e);
      stopExportOverlay();
      toast.error('Failed to export GIF');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper: race a promise against a timeout
  const withTimeout = <T extends unknown>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      promise.then((v: T) => { clearTimeout(timer); resolve(v); }).catch((e: unknown) => { clearTimeout(timer); reject(e); });
    });
  };

  // Helper: yield to main thread to prevent UI freeze
  const yieldToMain = () => new Promise<void>(r => setTimeout(r, 0));

  // PPT Export handler
  const generatePptxDeck = async () => {
    if (!uid) return;
    setIsExporting(true);
    startExportOverlay('pptx', 'PowerPoint Pitch Deck');
    try {
      // Step 0: Generating preview (already set by startExportOverlay)
      let gifBase64 = '';
      try {
        console.log('[PPT] Generating animated GIF for slide 2...');
        setExportProgress('Generating animated conversation preview...');
        const gifBlob = await captureGifFromMockupFn();
        if (gifBlob && gifBlob.size > 0) {
          // Convert blob to base64
          const arrayBuffer = await gifBlob.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < uint8.length; i += chunkSize) {
            const chunk = uint8.slice(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, Array.from(chunk));
          }
          gifBase64 = btoa(binary);
          console.log('[PPT] GIF base64 length:', gifBase64.length, 'blob size:', gifBlob.size);
        } else {
          console.warn('[PPT] GIF generation returned empty blob');
        }
      } catch (err) {
        console.error('[PPT] GIF generation failed:', err);
      }
      setExportProgress('');
      setExportProgressPercent(0);

      // Step 2: Building slide deck
      advanceExportStep(2);
      await yieldToMain(); // Let UI breathe before heavy PPTX generation
      
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      pptx.title = threadName;
      pptx.subject = `WhatsApp Conversation Flow - ${threadName}`;
      
      // Slide 1: Title slide
      const slide1 = pptx.addSlide();
      slide1.background = { color: '075E54' };
      slide1.addText('WhatsApp Business\nConversation Flow', {
        x: 0.5, y: 0.8, w: 9, h: 1.5,
        fontSize: 32, fontFace: 'Arial',
        color: 'FFFFFF', bold: true,
        align: 'left', lineSpacingMultiple: 1.2,
      });
      slide1.addText(threadName, {
        x: 0.5, y: 2.5, w: 9, h: 0.8,
        fontSize: 24, fontFace: 'Arial',
        color: '25D366', bold: true,
      });
      const metaLines = [];
      if (industry) metaLines.push(`Industry: ${industry}`);
      metaLines.push(`Type: ${MESSAGE_TYPES[messageType].label}`);
      metaLines.push(`Messages: ${localMessages.length}`);
      if (businessName) metaLines.push(`Business: ${businessName}`);
      slide1.addText(metaLines.join('  |  '), {
        x: 0.5, y: 3.5, w: 9, h: 0.5,
        fontSize: 14, fontFace: 'Arial',
        color: 'AAAAAA',
      });
      
      // Slide 1.5: CTWA Ad Creative (if enabled)
      if (adCreative?.enabled) {
        const adSlide = pptx.addSlide();
        adSlide.background = { color: 'FFFFFF' };
        adSlide.addText('Click-to-WhatsApp Ad Entry Point', {
          x: 0.3, y: 0.2, w: 9.4, h: 0.5,
          fontSize: 20, fontFace: 'Arial',
          color: '075E54', bold: true,
        });
        const placementLabel = adCreative.placement === 'facebook_feed' ? 'Facebook Feed' :
          adCreative.placement === 'instagram_feed' ? 'Instagram Feed' :
          adCreative.placement === 'instagram_story' ? 'Instagram Story' : 'Instagram Reels';
        adSlide.addText(`Platform: ${placementLabel}  |  Format: ${adCreative.format === 'carousel' ? 'Carousel' : 'Single Image'}`, {
          x: 0.3, y: 0.7, w: 9.4, h: 0.3,
          fontSize: 11, fontFace: 'Arial',
          color: '888888',
        });
        // Ad creative details card
        adSlide.addShape(pptx.ShapeType.roundRect, {
          x: 0.5, y: 1.2, w: 9, h: 4.5,
          fill: { color: 'F8F9FA' },
          line: { color: 'E0E0E0', width: 1 },
          rectRadius: 0.1,
        });
        // Brand name row
        adSlide.addText(adCreative.brandName || businessName || 'Business', {
          x: 0.8, y: 1.4, w: 8.4, h: 0.4,
          fontSize: 12, fontFace: 'Arial',
          color: '333333', bold: true,
        });
        adSlide.addText('Sponsored', {
          x: 0.8, y: 1.75, w: 8.4, h: 0.25,
          fontSize: 9, fontFace: 'Arial',
          color: '999999',
        });
        // Primary text
        adSlide.addText(adCreative.primaryText || '', {
          x: 0.8, y: 2.1, w: 8.4, h: 0.6,
          fontSize: 13, fontFace: 'Arial',
          color: '333333',
        });
        // Media placeholder
        if (adCreative.mediaUrl) {
          try {
            // Try to fetch and embed the image
            const imgUrl = adCreative.mediaUrl.startsWith('/api/image-proxy')
              ? new URL(adCreative.mediaUrl, window.location.origin).searchParams.get('url') || adCreative.mediaUrl
              : adCreative.mediaUrl;
            adSlide.addImage({
              path: imgUrl,
              x: 0.8, y: 2.8, w: 8.4, h: 2.2,
              sizing: { type: 'contain', w: 8.4, h: 2.2 },
            });
          } catch {
            adSlide.addShape(pptx.ShapeType.rect, {
              x: 0.8, y: 2.8, w: 8.4, h: 2.2,
              fill: { color: 'E8E8E8' },
            });
            adSlide.addText('[Ad Image]', {
              x: 0.8, y: 3.5, w: 8.4, h: 0.5,
              fontSize: 14, fontFace: 'Arial',
              color: '999999', align: 'center',
            });
          }
        } else {
          adSlide.addShape(pptx.ShapeType.rect, {
            x: 0.8, y: 2.8, w: 8.4, h: 2.2,
            fill: { color: 'E8E8E8' },
          });
          adSlide.addText('[Ad Image]', {
            x: 0.8, y: 3.5, w: 8.4, h: 0.5,
            fontSize: 14, fontFace: 'Arial',
            color: '999999', align: 'center',
          });
        }
        // Headline
        adSlide.addText(adCreative.headline || '', {
          x: 0.8, y: 5.2, w: 6.5, h: 0.4,
          fontSize: 14, fontFace: 'Arial',
          color: '333333', bold: true,
        });
        // CTA button
        adSlide.addShape(pptx.ShapeType.roundRect, {
          x: 7.5, y: 5.15, w: 2, h: 0.45,
          fill: { color: '25D366' },
          rectRadius: 0.05,
        });
        adSlide.addText(adCreative.ctaText || 'Send WhatsApp Message', {
          x: 7.5, y: 5.15, w: 2, h: 0.45,
          fontSize: 10, fontFace: 'Arial',
          color: 'FFFFFF', bold: true, align: 'center',
        });
        // Journey arrow
        adSlide.addText('\u2193 User taps CTA \u2192 Opens WhatsApp conversation', {
          x: 0.3, y: 5.9, w: 9.4, h: 0.4,
          fontSize: 12, fontFace: 'Arial',
          color: '25D366', bold: true, align: 'center',
        });
      }

      // Slide 2: Conversation preview (animated GIF)
      const slide2 = pptx.addSlide();
      slide2.background = { color: 'F0F2F5' };
      slide2.addText('Conversation Preview', {
        x: 0.3, y: 0.2, w: 7, h: 0.5,
        fontSize: 18, fontFace: 'Arial',
        color: '333333', bold: true,
      });
      if (gifBase64) {
        slide2.addText('Animated conversation flow (play slideshow to see animation)', {
          x: 0.3, y: 0.55, w: 9.4, h: 0.3,
          fontSize: 10, fontFace: 'Arial',
          color: '888888', italic: true,
        });
        // Phone mockup aspect ratio: roughly 9:16 (375x667)
        const imgW = 3.2;
        const imgH = 5.7;
        const imgX = (10 - imgW) / 2;
        const imgY = 1.0;

        slide2.addShape('roundRect', {
          x: imgX - 0.08,
          y: imgY - 0.08,
          w: imgW + 0.16,
          h: imgH + 0.16,
          rectRadius: 0.15,
          fill: { color: '1A1A1A' },
          shadow: { type: 'outer', blur: 8, offset: 3, color: '000000', opacity: 0.25 },
        });

        slide2.addImage({
          data: `image/gif;base64,${gifBase64}`,
          x: imgX,
          y: imgY,
          w: imgW,
          h: imgH,
          sizing: { type: 'contain', w: imgW, h: imgH },
        });
      } else {
        slide2.addText('Preview not available.\nOpen the Interactive HTML export to see the full conversation flow.', {
          x: 1, y: 2.5, w: 8, h: 2,
          fontSize: 16, fontFace: 'Arial',
          color: '999999', align: 'center',
        });
      }
      
      // Slide 3: Conversation flow breakdown
      const slide3 = pptx.addSlide();
      slide3.background = { color: 'FFFFFF' };
      slide3.addText('Conversation Flow', {
        x: 0.3, y: 0.2, w: 9.4, h: 0.5,
        fontSize: 20, fontFace: 'Arial',
        color: '075E54', bold: true,
      });
      const flowRows: any[][] = [
        [
          { text: '#', options: { bold: true, color: 'FFFFFF', fill: '075E54', fontSize: 10 } },
          { text: 'Sender', options: { bold: true, color: 'FFFFFF', fill: '075E54', fontSize: 10 } },
          { text: 'Type', options: { bold: true, color: 'FFFFFF', fill: '075E54', fontSize: 10 } },
          { text: 'Content', options: { bold: true, color: 'FFFFFF', fill: '075E54', fontSize: 10 } },
        ],
      ];
      localMessages.forEach((msg, i) => {
        const content = msg.content;
        const preview = content.text || content.bodyText || content.headerText || 
          (content.type === 'carousel' ? `Carousel (${content.carouselCards?.length || 0} cards)` : '') ||
          (content.type === 'image' ? 'Image message' : '') ||
          (content.type === 'video' ? 'Video message' : '') || 'Message';
        flowRows.push([
          { text: String(i + 1), options: { fontSize: 9 } },
          { text: msg.direction === 'outbound' ? 'Business' : 'Customer', options: { fontSize: 9, color: msg.direction === 'outbound' ? '075E54' : '3B82F6' } },
          { text: (msg.contentType || 'text').replace(/_/g, ' '), options: { fontSize: 9 } },
          { text: preview.slice(0, 80) + (preview.length > 80 ? '...' : ''), options: { fontSize: 9 } },
        ]);
      });
      slide3.addTable(flowRows, {
        x: 0.3, y: 0.9, w: 9.4,
        colW: [0.4, 1.2, 1.5, 6.3],
        border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
        rowH: 0.35,
        autoPage: true,
        autoPageRepeatHeader: true,
      });
      
      // Slide 4: Analytics / Estimated metrics
      const slide4 = pptx.addSlide();
      slide4.background = { color: 'FFFFFF' };
      slide4.addText('Estimated Performance Metrics', {
        x: 0.3, y: 0.2, w: 9.4, h: 0.5,
        fontSize: 20, fontFace: 'Arial',
        color: '075E54', bold: true,
      });
      const analytics = getConversationAnalytics(localMessages);
      const metricCards = [
        { label: 'Est. Open Rate', value: analytics.openRate, color: '25D366' },
        { label: 'Est. Click-Through', value: analytics.clickRate, color: '3B82F6' },
        { label: 'Est. Response Rate', value: analytics.responseRate, color: 'F59E0B' },
        { label: 'Est. Conversion', value: analytics.conversionRate, color: '8B5CF6' },
      ];
      metricCards.forEach((metric, i) => {
        const x = 0.3 + (i * 2.4);
        slide4.addShape(pptx.ShapeType.roundRect, {
          x, y: 1.0, w: 2.2, h: 1.5,
          fill: { color: metric.color, transparency: 90 },
          line: { color: metric.color, width: 1 },
          rectRadius: 0.1,
        });
        slide4.addText(metric.value, {
          x, y: 1.1, w: 2.2, h: 0.8,
          fontSize: 28, fontFace: 'Arial',
          color: metric.color, bold: true, align: 'center',
        });
        slide4.addText(metric.label, {
          x, y: 1.8, w: 2.2, h: 0.5,
          fontSize: 11, fontFace: 'Arial',
          color: '666666', align: 'center',
        });
      });
      slide4.addText('Message Type Breakdown', {
        x: 0.3, y: 3.0, w: 9.4, h: 0.4,
        fontSize: 14, fontFace: 'Arial',
        color: '333333', bold: true,
      });
      const typeBreakdown = analytics.typeBreakdown;
      const breakdownRows: any[][] = [
        [
          { text: 'Message Type', options: { bold: true, color: 'FFFFFF', fill: '075E54', fontSize: 10 } },
          { text: 'Count', options: { bold: true, color: 'FFFFFF', fill: '075E54', fontSize: 10 } },
          { text: 'Avg. Engagement', options: { bold: true, color: 'FFFFFF', fill: '075E54', fontSize: 10 } },
        ],
      ];
      typeBreakdown.forEach((tb: { type: string; count: number; engagement: string }) => {
        breakdownRows.push([
          { text: tb.type, options: { fontSize: 10 } },
          { text: String(tb.count), options: { fontSize: 10 } },
          { text: tb.engagement, options: { fontSize: 10 } },
        ]);
      });
      slide4.addTable(breakdownRows, {
        x: 0.3, y: 3.5, w: 9.4,
        colW: [4, 2, 3.4],
        border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
        rowH: 0.35,
      });
      slide4.addText('* Metrics are estimates based on industry benchmarks for WhatsApp Business messaging', {
        x: 0.3, y: 6.8, w: 9.4, h: 0.3,
        fontSize: 8, fontFace: 'Arial', italic: true,
        color: '999999',
      });

      // Step 3: Encoding presentation
      advanceExportStep(3);
      await yieldToMain(); // Let UI breathe before heavy PPTX write
      
      const fileName = `${threadName.replace(/[^a-zA-Z0-9]/g, '_')}_pitch_deck.pptx`;
      
      console.log('[PPT] Generating base64...');
      const base64 = await pptx.write({ outputType: 'base64' }) as string;
      console.log('[PPT] base64 length:', base64?.length);
      
      // Step 4: Uploading
      advanceExportStep(4);
      await yieldToMain();
      
      console.log('[PPT] Uploading to S3...');
      const result = await fileExportMutation.mutateAsync({
        fileName,
        base64Data: base64,
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });
      console.log('[PPT] S3 URL:', result.url);
      
      // Step 5: Done!
      advanceExportStep(5);
      // Fetch from S3 and trigger a proper file download
      try {
        const response = await fetch(result.url);
        const downloadBlob = await response.blob();
        const blobUrl = URL.createObjectURL(downloadBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      } catch {
        window.open(result.url, '_blank');
      }
      stopExportOverlay();
      toast.success("PowerPoint pitch deck downloaded!");
    } catch (e: any) {
      console.error('PowerPoint export error:', e);
      stopExportOverlay();
      toast.error('Failed to generate PowerPoint. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPpt = () => generatePptxDeck();

  const handleShareViaWhatsApp = () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) {
      toast.error("Enable sharing first by clicking the Share button");
      return;
    }
    const text = encodeURIComponent(`Check out this WhatsApp conversation demo I built:\n\n*${threadName}*\n${shareUrl}\n\nTap the link to see the interactive demo!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const mockupMessages = useMemo(() =>
    localMessages.filter(m => !m.isReminder).map(m => ({
      id: m.id,
      sortOrder: m.sortOrder,
      direction: m.direction as "inbound" | "outbound",
      contentType: m.contentType,
      content: m.content,
      timestamp: m.timestamp,
      isRead: m.isRead,
    })),
    [localMessages]
  );

  // Build reminderMessages with sortPosition = count of regular messages before this reminder
  const positionedReminders = useMemo(() => {
    return reminderMessages.map(r => {
      const combinedIdx = localMessages.findIndex(m => m.isReminder && m.reminderData?.id === r.id);
      if (combinedIdx < 0) return { ...r, sortPosition: undefined };
      // Count how many regular (non-reminder) messages come before this reminder in the combined list
      const regularMsgsBefore = localMessages.slice(0, combinedIdx).filter(m => !m.isReminder).length;
      return { ...r, sortPosition: regularMsgsBefore };
    });
  }, [localMessages, reminderMessages]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="border-b bg-white sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/threads")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-none">{threadName || "Untitled Thread"}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] h-4"
                  style={{
                    backgroundColor: `${MESSAGE_TYPES[messageType].color}15`,
                    color: MESSAGE_TYPES[messageType].color,
                  }}>
                  {MESSAGE_TYPES[messageType].label}
                </Badge>
                {industry && <Badge variant="outline" className="text-[10px] h-4">{industry}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant={showAnalytics ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="text-xs"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
            {linkedTemplateId ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveProgress}
                  disabled={updateTemplateSnapshot.isPending}
                  className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  {updateTemplateSnapshot.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                  <span className="hidden sm:inline">Save Progress</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTemplateName(threadName);
                    setTemplateDescription(`${MESSAGE_TYPES[messageType].label} flow${industry ? ` for ${industry}` : ''}`);
                    setShowSaveTemplateDialog(true);
                  }}
                  className="text-xs text-muted-foreground"
                >
                  <Plus className="w-3 h-3 mr-0.5" />
                  <span className="hidden sm:inline">Save As New</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTemplateName(threadName);
                  setTemplateDescription(`${MESSAGE_TYPES[messageType].label} flow${industry ? ` for ${industry}` : ''}`);
                  setShowSaveTemplateDialog(true);
                }}
                className="text-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Save Template</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewAsClient}
              className="text-xs"
              disabled={toggleShare.isPending}
            >
              {toggleShare.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Presentation className="w-3.5 h-3.5 mr-1" />}
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              className="text-xs"
            >
              <Share2 className="w-3.5 h-3.5 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className="text-xs">
              <Settings2 className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-4 flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left panel - Builder */}
          <div className="space-y-4 order-2 lg:order-1 overflow-y-auto">
            {/* Settings panel */}
            {showSettings && (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Thread Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Thread Name</label>
                      <Input value={threadName} onChange={e => setThreadName(e.target.value)} placeholder="Thread name" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Profile Name</label>
                      <Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Business profile name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Message Type</label>
                      <Select value={messageType} onValueChange={(v) => setMessageType(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marketing">Marketing Messages</SelectItem>
                          <SelectItem value="utility">Utility Messages</SelectItem>
                          <SelectItem value="authentication">Authentication Messages</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Industry</label>
                      <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map(ind => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Business Website</label>
                    <div className="flex gap-2">
                      <Input value={businessUrl} onChange={e => setBusinessUrl(e.target.value)} placeholder="https://example.com" className="flex-1" />
                      <Button size="sm" variant="outline" data-crawl-btn onClick={handleCrawl} disabled={isCrawling || !businessUrl.trim()}>
                        {isCrawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        <span className="ml-1 hidden sm:inline">{isCrawling ? "Analyzing..." : "Analyze"}</span>
                      </Button>
                    </div>
                    {isCrawling && crawlProgress && (
                      <div className="mt-2 space-y-1.5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          <span>{crawlProgress}</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full animate-pulse" style={{ width: 
                            crawlProgress === "Connecting to website..." ? "20%" :
                            crawlProgress === "Crawling pages..." ? "45%" :
                            crawlProgress === "Extracting products & services..." ? "70%" :
                            crawlProgress === "Analyzing with AI..." ? "90%" : "100%"
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <Button onClick={handleSaveSettings} size="sm" className="w-full">Save Settings</Button>
                </CardContent>
              </Card>
            )}

            {/* Crawl result - extracted products & suggestions */}
            {crawlResult && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-primary flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {crawlResult.businessName}
                    </h4>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setCrawlResult(null)}>
                      Dismiss
                    </Button>
                  </div>

                  {/* Business summary */}
                  <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">{crawlResult.description}</p>

                  {/* Extracted products with images */}
                  {(crawlResult.products?.length > 0 || crawlResult.services?.length > 0) && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Package className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-semibold text-primary">
                          {crawlResult.products?.length || 0} Products, {crawlResult.services?.length || 0} Services Extracted
                        </span>
                      </div>
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {[...(crawlResult.products || []), ...(crawlResult.services || [])].slice(0, 6).map((item: any, i: number) => (
                          <div key={i} className="shrink-0 w-[72px] rounded-md border border-primary/10 overflow-hidden bg-background">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-12 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="w-full h-12 bg-muted flex items-center justify-center">
                                <Package className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="p-1">
                              <p className="text-[8px] font-medium truncate">{item.name}</p>
                              {item.price && <p className="text-[8px] text-primary font-semibold">{item.price}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 italic">
                        Real product images will be used in generated mockups
                      </p>
                    </div>
                  )}

                  {/* Suggested use cases */}
                  {crawlResult.suggestedUseCases?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground">Suggested Flows:</span>
                      {crawlResult.suggestedUseCases.slice(0, 3).map((uc: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => {
                            setAiPrompt(`Create a ${uc.messageType} message flow for ${crawlResult.businessName}: ${uc.description}`);
                            setMessageType(uc.messageType);
                            setActiveTab("ai");
                          }}
                          className="w-full text-left p-2 rounded-md border border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[9px] h-3.5 shrink-0"
                              style={{
                                backgroundColor: `${MESSAGE_TYPES[uc.messageType as keyof typeof MESSAGE_TYPES]?.color || "#25D366"}15`,
                                color: MESSAGE_TYPES[uc.messageType as keyof typeof MESSAGE_TYPES]?.color || "#25D366",
                              }}>
                              {uc.messageType}
                            </Badge>
                            <span className="text-xs font-medium truncate">{uc.title}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{uc.description}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Generation / Manual Builder tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="ai" className="flex-1">
                  <Sparkles className="w-4 h-4 mr-1" /> AI Generate
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex-1">
                  <Edit3 className="w-4 h-4 mr-1" /> Manual Edit
                </TabsTrigger>
                <TabsTrigger value="branches" className="flex-1">
                  <GitBranch className="w-4 h-4 mr-1" /> Branches
                </TabsTrigger>
                <TabsTrigger value="reminders" className="flex-1">
                  <Bell className="w-4 h-4 mr-1" /> Reminders
                  {reminderMessages.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1">{reminderMessages.filter(r => r.enabled).length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="ctwa" className="flex-1">
                  <Monitor className="w-4 h-4 mr-1" /> CTWA Ad
                  {adCreative?.enabled && (
                    <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1 bg-green-500/20 text-green-700">ON</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ai" className="mt-3">
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Describe the conversation flow you want to create
                      </label>
                      <Textarea
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder={`e.g., "Build a WhatsApp Marketing Messages flow for a food delivery app that promotes a weekend discount, shows menu items, and lets users place an order directly in the chat"\n\nYou can also paste a website URL and the AI will analyze the business automatically.`}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {getIndustryPrompts(messageType, industry).map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => setAiPrompt(prompt)}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                        >
                          {prompt.length > 55 ? prompt.slice(0, 55) + "..." : prompt}
                        </button>
                      ))}
                      {/* CTWA-specific prompt suggestions */}
                      {[
                        { label: "CTWA: Facebook carousel ad → WhatsApp seasonal sale campaign", prompt: "Create a click-to-WhatsApp ad campaign starting with a Facebook carousel ad that drives users to a WhatsApp conversation about seasonal promotions with product recommendations" },
                        { label: "CTWA: Instagram Story ad → WhatsApp product discovery", prompt: "Create a click-to-WhatsApp journey starting from an Instagram Story ad that leads to a WhatsApp conversation showcasing new product arrivals with interactive browsing" },
                        { label: "CTWA: Facebook ad → WhatsApp lead capture & consultation", prompt: "Create a click-to-WhatsApp ad campaign with a Facebook ad entry point that drives users into a WhatsApp conversation for personalized consultation and lead qualification" },
                      ].map((ctwa, i) => (
                        <button
                          key={`ctwa-${i}`}
                          onClick={() => setAiPrompt(ctwa.prompt)}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-blue-400/30 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4" /></svg>
                          {ctwa.label.length > 55 ? ctwa.label.slice(0, 55) + "..." : ctwa.label}
                        </button>
                      ))}
                    </div>

                    {/* Client Asset Upload Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          Client Assets (optional)
                        </label>
                        {clientAssets.length > 0 && (
                          <button
                            onClick={() => setClientAssets([])}
                            className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      <input
                        ref={assetInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          setIsUploadingAsset(true);
                          try {
                            const uploaded: typeof clientAssets = [];
                            for (const file of files) {
                              if (file.size > 10 * 1024 * 1024) {
                                toast.error(`${file.name} is too large (max 10MB)`);
                                continue;
                              }
                              const base64 = await new Promise<string>((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                                reader.onerror = reject;
                                reader.readAsDataURL(file);
                              });
                              const result = await uploadMutation.mutateAsync({
                                fileName: file.name,
                                fileData: base64,
                                mimeType: file.type,
                              });
                              uploaded.push({
                                url: result.url,
                                name: file.name,
                                type: file.type.startsWith('video/') ? 'video' : 'image',
                                thumbnail: file.type.startsWith('image/') ? result.url : undefined,
                              });
                            }
                            setClientAssets(prev => [...prev, ...uploaded]);
                            if (uploaded.length > 0) {
                              toast.success(`${uploaded.length} asset${uploaded.length > 1 ? 's' : ''} uploaded`);
                            }
                          } catch {
                            toast.error('Failed to upload assets');
                          } finally {
                            setIsUploadingAsset(false);
                            e.target.value = '';
                          }
                        }}
                      />
                      {clientAssets.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {clientAssets.map((asset, i) => (
                            <div key={i} className="relative group/asset">
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted">
                                {asset.type === 'image' ? (
                                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                                    <Play className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-[8px] text-muted-foreground mt-0.5">Video</span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => setClientAssets(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px] opacity-0 group-hover/asset:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                              <p className="text-[8px] text-muted-foreground text-center mt-0.5 truncate w-16">{asset.name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => assetInputRef.current?.click()}
                        disabled={isUploadingAsset}
                        className="w-full py-2 border-2 border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                      >
                        {isUploadingAsset ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                        ) : (
                          <><Upload className="w-3.5 h-3.5" /> Upload photos, workflow diagrams, or product images</>
                        )}
                      </button>
                      {clientAssets.length > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          Upload product images to use in the conversation, or upload a workflow/journey diagram and the AI will build the flow based on it.
                        </p>
                      )}
                    </div>

                    {/* Conversation Language */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Conversation Language
                      </label>
                      <select
                        value={conversationLanguage}
                        onChange={(e) => {
                          setConversationLanguage(e.target.value as SupportedLanguage);
                          setLanguageManuallySet(true);
                        }}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="en">🇺🇸 English</option>
                        <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
                        <option value="bn">🇮🇳 বাংলা (Bengali)</option>
                        <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
                        <option value="mr">🇮🇳 मराठी (Marathi)</option>
                        <option value="te">🇮🇳 తెలుగు (Telugu)</option>
                        <option value="ur">🇵🇰 اردو (Urdu)</option>
                        <option value="id">🇮🇩 Bahasa Indonesia (Indonesian)</option>
                        <option value="zh-CN">🇨🇳 简体中文 (Simplified Chinese)</option>
                        <option value="zh-TW">🇹🇼 繁體中文 (Traditional Chinese)</option>
                        <option value="pt">🇧🇷 Português (Portuguese)</option>
                        <option value="es">🇪🇸 Español (Spanish)</option>
                      </select>
                    </div>

                    <Button
                      data-generate-btn
                      onClick={handleGenerate}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="w-full"
                      size="lg"
                    >
                       {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Conversation Flow
                        </>
                      )}
                    </Button>
                    {/* Generation Progress Bar */}
                    {isGenerating && generationProgress && (
                      <div className="mt-3 space-y-2 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground font-medium">{generationProgress.label}</span>
                          <span className="text-muted-foreground tabular-nums">
                            Step {generationProgress.step}/{generationProgress.totalSteps}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${(generationProgress.step / generationProgress.totalSteps) * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: generationProgress.totalSteps }, (_, i) => {
                            const stepNum = i + 1;
                            const isComplete = stepNum < generationProgress.step;
                            const isCurrent = stepNum === generationProgress.step;
                            const labels = generationProgress.totalSteps === 4
                              ? ["Prepare", "Generate", "Match", "Images"]
                              : ["Prepare", "Generate", "Images"];
                            return (
                              <div key={i} className="flex items-center gap-1">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold transition-colors duration-300 ${
                                  isComplete ? "bg-primary text-primary-foreground" :
                                  isCurrent ? "bg-primary/20 text-primary border border-primary" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {isComplete ? <CheckCircle2 className="w-3 h-3" /> : stepNum}
                                </div>
                                <span className={`text-[9px] ${
                                  isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                                }`}>{labels[i]}</span>
                                {i < generationProgress.totalSteps - 1 && (
                                  <div className={`w-3 h-px ${
                                    isComplete ? "bg-primary" : "bg-muted-foreground/30"
                                  }`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <GenerationTimer startTime={generationProgress.startTime} />
                      </div>
                    )}
                    {!isGenerating && localMessages.length > 0 && (
                      <p className="text-[10px] text-muted-foreground text-center">
                        Generating a new flow will replace existing messages
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="manual" className="mt-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">Messages ({localMessages.length})</h3>
                        <TooltipProvider delayDuration={300}>
                          <div className="flex items-center gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  disabled={undoStack.length === 0}
                                  onClick={handleUndo}
                                >
                                  <Undo2 className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom"><p className="text-xs">Undo (Ctrl+Z)</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  disabled={redoStack.length === 0}
                                  onClick={handleRedo}
                                >
                                  <Redo2 className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom"><p className="text-xs">Redo (Ctrl+Y)</p></TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="w-3 h-3 mr-1" /> Add Message
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Message</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Business (Outbound)</h4>
                              <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start text-sm h-9" onClick={() => handleAddMessage("outbound", "text")}>
                                  <MessageSquare className="w-4 h-4 mr-2" /> Text Message
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-sm h-9" onClick={() => handleAddMessage("outbound", "template")}>
                                  <LayoutTemplate className="w-4 h-4 mr-2" /> Template Message
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-sm h-9" onClick={() => handleAddMessage("outbound", "interactive_buttons")}>
                                  <ListOrdered className="w-4 h-4 mr-2" /> Button Message
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-sm h-9" onClick={() => handleAddMessage("outbound", "interactive_list")}>
                                  <ListOrdered className="w-4 h-4 mr-2" /> List Message
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-sm h-9" onClick={() => handleAddMessage("outbound", "image")}>
                                  <Image className="w-4 h-4 mr-2" /> Image Message
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-sm h-9" onClick={() => handleAddMessage("outbound", "video")}>
                                  <Film className="w-4 h-4 mr-2" /> Video Message
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-sm h-9" onClick={() => handleAddMessage("outbound", "carousel")}>
                                  <Layers className="w-4 h-4 mr-2" /> Carousel Cards
                                </Button>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Customer (Inbound)</h4>
                              <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start text-sm h-9" onClick={() => handleAddMessage("inbound", "text")}>
                                  <MessageSquare className="w-4 h-4 mr-2" /> Text Reply
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-sm h-9" onClick={() => handleAddMessage("inbound", "image")}>
                                  <Image className="w-4 h-4 mr-2" /> Image Reply
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-sm h-9" onClick={() => handleAddMessage("inbound", "video")}>
                                  <Film className="w-4 h-4 mr-2" /> Video Reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Message Snippets */}
                    <MessageSnippets
                      onInsertSnippet={(messages) => {
                        if (!uid) return;
                        pushUndo();
                        // Insert all messages from the snippet sequentially
                        const insertSequentially = async () => {
                          for (const msg of messages) {
                            await createMessage.mutateAsync({
                              threadUid: uid!,
                              direction: msg.direction,
                              contentType: msg.contentType as any,
                              content: msg.content,
                              timestamp: msg.timestamp || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                            });
                          }
                          refetch();
                          toast.success(`Inserted ${messages.length} messages from snippet`);
                        };
                        insertSequentially();
                      }}
                    />

                    <div data-testid="message-scroll-area" className="overflow-y-scroll" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={localMessages.map(m => m.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {localMessages.map((msg, index) => {
                              // Render reminder items with a dedicated inline editor
                              if (msg.isReminder && msg.reminderData) {
                                return (
                                  <SortableReminderEditor
                                    key={msg.id}
                                    localMessage={msg}
                                    reminder={msg.reminderData}
                                    index={index}
                                    onUpdate={(updated) => {
                                      const newReminders = reminderMessages.map(r =>
                                        r.id === updated.id ? updated : r
                                      );
                                      setReminderMessages(newReminders);
                                      // Also update the localMessages entry
                                      setLocalMessages(prev => prev.map(m =>
                                        m.isReminder && m.reminderData?.id === updated.id
                                          ? { ...m, content: updated.content, reminderData: updated }
                                          : m
                                      ));
                                      if (uid) updateThread.mutate({ uid, reminderMessages: newReminders });
                                    }}
                                    onDelete={() => {
                                      const newReminders = reminderMessages.filter(r => r.id !== msg.reminderData!.id);
                                      setReminderMessages(newReminders);
                                      setLocalMessages(prev => prev.filter(m => m.id !== msg.id));
                                      if (uid) updateThread.mutate({ uid, reminderMessages: newReminders });
                                      toast.success('Reminder removed');
                                    }}
                                    onToggleEnabled={() => {
                                      const newReminders = reminderMessages.map(r =>
                                        r.id === msg.reminderData!.id ? { ...r, enabled: !r.enabled } : r
                                      );
                                      setReminderMessages(newReminders);
                                      // If disabling, remove from combined list; if enabling, it will appear on next sync
                                      if (msg.reminderData!.enabled) {
                                        setLocalMessages(prev => prev.filter(m => m.id !== msg.id));
                                      }
                                      if (uid) updateThread.mutate({ uid, reminderMessages: newReminders });
                                    }}
                                  />
                                );
                              }
                              return (
                              <SortableMessageEditor
                                key={msg.id}
                                message={msg}
                                index={index}
                                totalMessages={localMessages.length}
                                isEditing={editingMessage === msg.id}
                                onEdit={() => setEditingMessage(editingMessage === msg.id ? null : msg.id)}
                                onSave={(content) => {
                                  pushUndo();
                                  updateMessage.mutate({
                                    id: msg.id,
                                    content,
                                    contentType: content.type as any,
                                  });
                                  setEditingMessage(null);
                                }}
                                onDelete={() => handleDeleteMessage(msg.id)}
                                onMove={(dir) => handleMoveMessage(index, dir)}
                                onChangeDirection={(dir) => handleChangeDirection(msg.id, dir)}
                                onChangeType={(type) => handleChangeType(msg.id, type, msg.content)}
                                onDuplicate={() => handleDuplicateMessage(msg.id)}
                                onInsertAfter={(dir, type) => handleInsertAfter(index, dir, type)}
                                showInsertMenu={showInsertMenu === index}
                                onToggleInsertMenu={() => setShowInsertMenu(showInsertMenu === index ? null : index)}
                                hasViolation={violationMessageIds.has(msg.id)}
                                violationInfo={(() => {
                                  const v = flowValidation.violations.find(v => v.inboundMessageId === msg.id || v.outboundMessageId === msg.id);
                                  return v ? { description: v.description, suggestion: v.suggestion, outboundMessageId: v.outboundMessageId } : undefined;
                                })()}
                                branchInfo={msg.content.branchConfig ? { branchId: msg.content.branchConfig.branchId, label: msg.content.branchConfig.label || msg.content.branchConfig.triggerValue } : null}
                                hasBranchesFrom={getBranchesForPoint(localMessages, msg.sortOrder).length}
                                onAutoFix={() => {
                                  const violation = flowValidation.violations.find(v => v.inboundMessageId === msg.id || v.outboundMessageId === msg.id);
                                  if (!violation) return;
                                  pushUndo();
                                  const outboundId = violation.outboundMessageId;
                                  const inboundMsg = localMessages.find(m => m.id === violation.inboundMessageId);
                                  const customerText = inboundMsg?.content?.text || "Continue";
                                  if (outboundId === -1) {
                                    // No preceding outbound - insert one before this message
                                    const newContent: MessageContent = {
                                      type: "interactive_buttons",
                                      text: "Please choose an option:",
                                      buttons: [
                                        { id: `btn_${Date.now()}`, title: customerText.substring(0, 20) },
                                        { id: `btn_${Date.now() + 1}`, title: "More Info" },
                                      ],
                                    };
                                    const insertIdx = localMessages.findIndex(m => m.id === violation.inboundMessageId);
                                    if (insertIdx >= 0 && uid) {
                                      createMessage.mutate(
                                        {
                                          threadUid: uid,
                                          direction: "outbound",
                                          contentType: "interactive_buttons",
                                          content: newContent,
                                          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                                        },
                                        {
                                          onSuccess: (newMsg: any) => {
                                            const currentIds = localMessages.map(m => m.id);
                                            currentIds.splice(insertIdx, 0, newMsg.id);
                                            reorderMessages.mutate({ threadUid: uid!, messageIds: currentIds });
                                            toast.success("Auto-fix: Added interactive buttons before customer reply");
                                          },
                                        }
                                      );
                                    }
                                  } else {
                                    // Convert existing outbound to interactive_buttons
                                    const outboundMsg = localMessages.find(m => m.id === outboundId);
                                    if (!outboundMsg) return;
                                    const existingText = outboundMsg.content?.text || outboundMsg.content?.bodyText || outboundMsg.content?.caption || "Please choose an option:";
                                    const newContent: MessageContent = {
                                      type: "interactive_buttons",
                                      text: existingText,
                                      buttons: [
                                        { id: `btn_${Date.now()}`, title: customerText.substring(0, 20) },
                                        { id: `btn_${Date.now() + 1}`, title: "Learn More" },
                                      ],
                                    };
                                    // Deduplicate button titles
                                    const seen = new Set<string>();
                                    newContent.buttons = newContent.buttons!.filter(b => {
                                      if (seen.has(b.title)) return false;
                                      seen.add(b.title);
                                      return true;
                                    });
                                    updateMessage.mutate({
                                      id: outboundId,
                                      content: newContent,
                                      contentType: "interactive_buttons",
                                    });
                                    setLocalMessages(prev => prev.map(m => m.id === outboundId ? { ...m, contentType: "interactive_buttons", content: newContent } : m));
                                    toast.success("Auto-fix: Converted to interactive buttons");
                                  }
                                }}
                              />
                            );
                            })}
                            {localMessages.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No messages yet</p>
                                <p className="text-xs mt-1">Use AI Generate or add messages manually</p>
                              </div>
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                    {/* Reminders are now integrated into the sortable message list above */}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="branches" className="mt-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        <GitFork className="w-4 h-4" /> Conversation Branches
                      </h3>
                      {hasBranching(localMessages) && (
                        <Badge variant="secondary" className="text-xs">
                          {getBranchStats(localMessages).totalBranches} branch{getBranchStats(localMessages).totalBranches !== 1 ? 'es' : ''}
                        </Badge>
                      )}
                    </div>

                    {localMessages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Generate or add messages first</p>
                        <p className="text-xs mt-1">Then create branches for interactive messages</p>
                      </div>
                    ) : (() => {
                      const branchPoints = detectBranchPoints(localMessages);
                      const interactiveOutbound = localMessages.filter(m => {
                        if (m.direction !== 'outbound') return false;
                        if (m.content.branchConfig) return false;
                        const c = m.content;
                        return (c.buttons && c.buttons.length > 0) || c.type === 'interactive_list' || c.type === 'carousel';
                      });

                      return (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground">
                            Add branches to interactive messages. When a user clicks different buttons, they'll see different follow-up conversations.
                          </p>

                          {interactiveOutbound.map(msg => {
                            const existingBranches = getBranchesForPoint(localMessages, msg.sortOrder);
                            const availableButtons: { id: string; title: string }[] = [];
                            if (msg.content.buttons) {
                              msg.content.buttons.forEach(b => availableButtons.push({ id: b.id, title: b.title }));
                            }
                            if (msg.content.listSections) {
                              msg.content.listSections.forEach(s => s.rows.forEach(r => availableButtons.push({ id: r.id, title: r.title })));
                            }
                            if (msg.content.carouselCards) {
                              msg.content.carouselCards.forEach(c => availableButtons.push({ id: c.id, title: c.buttonText }));
                            }

                            // Filter out buttons that already have branches
                            const usedTriggers = new Set(existingBranches.map(b => b.triggerValue));
                            const availableForBranching = availableButtons.filter(b => !usedTriggers.has(b.title));

                            return (
                              <div key={msg.id} className="border rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    #{msg.sortOrder + 1} {(msg.content.type || 'text').replace(/_/g, ' ')}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground truncate flex-1">
                                    {msg.content.bodyText || msg.content.text || msg.content.headerText || 'Interactive message'}
                                  </span>
                                </div>

                                {/* Existing branches */}
                                {existingBranches.length > 0 && (
                                  <div className="space-y-1.5 mb-2">
                                    {existingBranches.map(branch => (
                                      <div key={branch.branchId} className="flex items-center gap-2 pl-4 border-l-2 border-primary/30">
                                        <GitBranch className="w-3 h-3 text-primary" />
                                        <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                          {branch.label}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                          {branch.messages.length} message{branch.messages.length !== 1 ? 's' : ''}
                                        </span>
                                        <button
                                          onClick={() => {
                                            if (confirm(`Remove branch "${branch.label}"?`)) {
                                              const toDelete = localMessages.filter(m => m.content.branchConfig?.branchId === branch.branchId);
                                              const updated = localMessages.filter(m => m.content.branchConfig?.branchId !== branch.branchId);
                                              setLocalMessages(updated);
                                              toDelete.forEach(m => deleteMessage.mutate({ id: m.id }));
                                              toast.success(`Branch "${branch.label}" removed`);
                                            }
                                          }}
                                          className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Add branch button */}
                                {availableForBranching.length > 0 && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="outline" className="h-7 text-xs">
                                        <Plus className="w-3 h-3 mr-1" /> Add Branch
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                      <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">When user clicks:</div>
                                      {availableForBranching.map(btn => (
                                        <DropdownMenuItem
                                          key={btn.id}
                                          onClick={() => {
                                            setAddingBranchFor({
                                              sortOrder: msg.sortOrder,
                                              triggerValue: btn.title,
                                              label: btn.title,
                                            });
                                            setBranchMessages([
                                              {
                                                id: Date.now(),
                                                direction: 'inbound',
                                                contentType: 'text',
                                                content: { type: 'text', text: btn.title },
                                                timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                                                isRead: true,
                                                sortOrder: 0,
                                              },
                                              {
                                                id: Date.now() + 1,
                                                direction: 'outbound',
                                                contentType: 'text',
                                                content: { type: 'text', text: '' },
                                                timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                                                isRead: true,
                                                sortOrder: 1,
                                              },
                                            ]);
                                          }}
                                        >
                                          <MousePointerClick className="w-3.5 h-3.5 mr-2" /> {btn.title}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}

                                {availableForBranching.length === 0 && existingBranches.length > 0 && (
                                  <p className="text-[10px] text-muted-foreground italic">All options have branches defined</p>
                                )}
                              </div>
                            );
                          })}

                          {interactiveOutbound.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                              <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-40" />
                              <p className="text-sm">No interactive messages found</p>
                              <p className="text-xs mt-1">Add messages with buttons, lists, or carousels to create branches</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reminders" className="mt-3">
                <ReminderEditor
                  reminders={reminderMessages}
                  onChange={(newReminders) => {
                    setReminderMessages(newReminders);
                    // Auto-save reminders to the thread
                    if (uid) {
                      updateThread.mutate({ uid, reminderMessages: newReminders });
                    }
                  }}
                  businessName={businessName || profileName}
                  hasBookingFlow={hasBookingFlow}
                />
              </TabsContent>

              <TabsContent value="ctwa" className="mt-3">
                <AdEntryPointEditor
                  adCreative={adCreative}
                  onChange={(newAd) => {
                    setAdCreative(newAd);
                    // Auto-enable journey mode when ad is enabled
                    if (newAd?.enabled && !journeyMode) setJourneyMode(true);
                    if (newAd && !newAd.enabled && journeyMode) setJourneyMode(false);
                    // Persist to server
                    if (uid) {
                      updateThread.mutate({ uid, adCreative: newAd });
                    }
                  }}
                  businessName={businessName || profileName}
                  businessUrl={businessUrl}
                  profileImageUrl={profileImageUrl}
                  crawledImages={(() => {
                    // Collect images from crawl result products
                    const crawlImages = (crawlResult?.products || []).filter((p: any) => p.imageUrl).map((p: any) => ({
                      url: p.imageUrl.startsWith('/api/image-proxy') ? p.imageUrl : `/api/image-proxy?url=${encodeURIComponent(p.imageUrl)}`,
                      name: p.name,
                    }));
                    // Also add hero image if available
                    if (crawlResult?.heroImageUrl) {
                      crawlImages.unshift({
                        url: crawlResult.heroImageUrl.startsWith('/api/image-proxy') ? crawlResult.heroImageUrl : `/api/image-proxy?url=${encodeURIComponent(crawlResult.heroImageUrl)}`,
                        name: 'Hero Image',
                      });
                    }
                    // Fallback: extract images from conversation messages
                    if (crawlImages.length === 0 && localMessages.length > 0) {
                      for (const msg of localMessages) {
                        const c = msg.content as any;
                        if (c?.headerImageUrl) {
                          crawlImages.push({ url: c.headerImageUrl, name: 'Message Header' });
                        }
                        if (msg.contentType === 'image' && c?.imageUrl) {
                          crawlImages.push({ url: c.imageUrl, name: 'Image Message' });
                        }
                        if (c?.cards?.length) {
                          c.cards.forEach((card: any) => {
                            if (card.imageUrl) {
                              crawlImages.push({ url: card.imageUrl, name: card.title || 'Carousel Card' });
                            }
                          });
                        }
                      }
                    }
                    // Deduplicate by URL
                    const seen = new Set<string>();
                    return crawlImages.filter((img: any) => {
                      if (seen.has(img.url)) return false;
                      seen.add(img.url);
                      return true;
                    });
                  })()}
                  onGenerateAd={async () => {
                    if (!uid) return;
                    setIsGeneratingAd(true);
                    try {
                      const result = await generateAdCreative.mutateAsync({
                        threadUid: uid,
                        businessName: businessName || profileName,
                        businessUrl: businessUrl || '',
                        industry: industry || '',
                        messageType,
                        crawlData: crawlResult || undefined,
                        placement: adCreative?.placement || 'facebook_feed',
                      });
                      setAdCreative(result as AdCreative);
                      if ((result as AdCreative).enabled) setJourneyMode(true);
                      toast.success('Ad creative generated!');
                    } catch (e: any) {
                      toast.error('Failed to generate ad: ' + (e.message || 'Unknown error'));
                    } finally {
                      setIsGeneratingAd(false);
                    }
                  }}
                  isGenerating={isGeneratingAd}
                  onUploadImage={async (base64, fileName, mimeType) => {
                    const result = await uploadMutation.mutateAsync({ fileName, fileData: base64, mimeType });
                    return result.url;
                  }}
                />
              </TabsContent>

              {/* Branch Message Editor Dialog */}
              <Dialog open={!!addingBranchFor} onOpenChange={(open) => { if (!open) setAddingBranchFor(null); }}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <GitBranch className="w-5 h-5" />
                      Add Branch: "{addingBranchFor?.label}"
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Define the messages that appear when the user clicks "{addingBranchFor?.triggerValue}". The first message is the customer's reply (auto-filled), followed by business responses.
                    </p>

                    {branchMessages.map((bMsg, idx) => (
                      <div key={bMsg.id} className={`border rounded-lg p-3 ${bMsg.direction === 'inbound' ? 'border-blue-200 bg-blue-50/30' : 'border-green-200 bg-green-50/30'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px]">
                            {bMsg.direction === 'inbound' ? 'Customer' : 'Business'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">Message {idx + 1}</span>
                          {idx > 0 && (
                            <button
                              onClick={() => setBranchMessages(prev => prev.filter((_, i) => i !== idx))}
                              className="ml-auto text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <Textarea
                          value={bMsg.content.text || bMsg.content.bodyText || ''}
                          onChange={e => {
                            setBranchMessages(prev => prev.map((m, i) => {
                              if (i !== idx) return m;
                              return {
                                ...m,
                                content: {
                                  ...m.content,
                                  text: e.target.value,
                                  bodyText: m.content.type === 'template' ? e.target.value : m.content.bodyText,
                                },
                              };
                            }));
                          }}
                          placeholder={bMsg.direction === 'inbound' ? 'Customer reply...' : 'Business response...'}
                          rows={2}
                          className="resize-none text-sm"
                        />
                        {bMsg.direction === 'outbound' && (
                          <div className="mt-2">
                            <label className="text-[10px] text-muted-foreground block mb-1">Add buttons (optional, one per line)</label>
                            <Input
                              placeholder="Button 1, Button 2, Button 3"
                              className="text-xs h-7"
                              onChange={e => {
                                const titles = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                setBranchMessages(prev => prev.map((m, i) => {
                                  if (i !== idx) return m;
                                  return {
                                    ...m,
                                    contentType: titles.length > 0 ? 'interactive_buttons' : 'text',
                                    content: {
                                      ...m.content,
                                      type: titles.length > 0 ? 'interactive_buttons' : 'text',
                                      buttons: titles.length > 0 ? titles.map((t, j) => ({ id: `btn-${j}`, title: t, type: 'quick_reply' as const })) : undefined,
                                    },
                                  };
                                }));
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          setBranchMessages(prev => [...prev, {
                            id: Date.now(),
                            direction: prev.length % 2 === 0 ? 'inbound' : 'outbound',
                            contentType: 'text',
                            content: { type: 'text', text: '' },
                            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                            isRead: true,
                            sortOrder: prev.length,
                          }]);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Message
                      </Button>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setAddingBranchFor(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={branchMessages.some(m => !(m.content.text || m.content.bodyText))}
                        onClick={() => {
                          if (!addingBranchFor) return;
                          const branchId = generateBranchId(addingBranchFor.triggerValue);
                          const maxSortOrder = localMessages.reduce((max, m) => Math.max(max, m.sortOrder), 0);

                          const newBranchMsgs: LocalMessage[] = branchMessages.map((m, i) => ({
                            ...m,
                            id: Date.now() + i + 100,
                            sortOrder: maxSortOrder + 1 + i,
                            content: {
                              ...m.content,
                              branchConfig: {
                                branchId,
                                branchPointSortOrder: addingBranchFor.sortOrder,
                                triggerValue: addingBranchFor.triggerValue,
                                label: addingBranchFor.label,
                              },
                            },
                          }));

                          // Create each branch message on the server
                          for (const bMsg of newBranchMsgs) {
                            createMessage.mutate({
                              threadUid: uid!,
                              direction: bMsg.direction,
                              contentType: bMsg.contentType as any,
                              content: bMsg.content,
                            });
                          }
                          setAddingBranchFor(null);
                          setBranchMessages([]);
                          toast.success(`Branch "${addingBranchFor.label}" added with ${branchMessages.length} messages`);
                        }}
                      >
                        <GitBranch className="w-3.5 h-3.5 mr-1" /> Save Branch
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </Tabs>
          </div>

          {/* Right panel - Phone Preview */}
          <div className="order-1 lg:order-2 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Live Preview
              </h3>
              <div className="flex items-center gap-2">
                {imagesGenerating && (
                  <Badge variant="secondary" className="text-[10px] animate-pulse">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Loading images...
                  </Badge>
                )}
                {localMessages.length > 0 && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={flowValidation.isValid ? "outline" : "destructive"}
                          className={`text-[10px] cursor-help transition-colors ${
                            flowValidation.isValid
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/20"
                          }`}
                        >
                          {flowValidation.isValid ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" />{flowValidation.summary}</>
                          ) : (
                            <><span className="w-3 h-3 mr-1 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[8px] font-bold">{flowValidation.violationCount}</span>{flowValidation.summary}</>
                          )}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        {flowValidation.isValid ? (
                          <p className="text-xs">Every customer message follows an interactive business message (buttons, list, or carousel). The flow will simulate correctly.</p>
                        ) : (
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">Interactivity issues found:</p>
                            {flowValidation.violations.slice(0, 3).map((v, i) => (
                              <p key={i} className="text-muted-foreground">• {v.description}</p>
                            ))}
                            {flowValidation.violations.length > 3 && (
                              <p className="text-muted-foreground">...and {flowValidation.violations.length - 3} more</p>
                            )}
                            <p className="text-amber-600 font-medium mt-1">Switch to Manual Edit to fix flagged messages.</p>
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {!flowValidation.isValid && localMessages.length > 0 && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] px-2 bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/20"
                          onClick={async () => {
                            if (!uid) return;
                            try {
                              toast.info("Fixing interactivity issues...");
                              await fixInteractivity.mutateAsync({ threadUid: uid });
                              refetch();
                              toast.success("All messages are now interactive!");
                            } catch (e: any) {
                              toast.error("Failed to fix: " + (e.message || "Unknown error"));
                            }
                          }}
                          disabled={fixInteractivity.isPending}
                        >
                          {fixInteractivity.isPending ? (
                            <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Fixing...</>
                          ) : (
                            <><Zap className="w-3 h-3 mr-1" />Fix All</>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Automatically fix all interactivity violations by adding buttons to non-interactive business messages</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {messageType === "utility" && localMessages.length > 0 && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={utilityCompliance.isCompliant ? "outline" : "destructive"}
                          className={`text-[10px] cursor-help transition-colors ${
                            utilityCompliance.isCompliant
                              ? "bg-blue-500/10 text-blue-700 border-blue-500/30 hover:bg-blue-500/20"
                              : "bg-red-500/10 text-red-700 border-red-500/30 hover:bg-red-500/20"
                          }`}
                        >
                          {utilityCompliance.isCompliant ? (
                            <><Lock className="w-3 h-3 mr-1" />Policy Compliant</>
                          ) : (
                            <><span className="w-3 h-3 mr-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-bold">{utilityCompliance.violationCount}</span>{utilityCompliance.summary}</>
                          )}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        {utilityCompliance.isCompliant ? (
                          <p className="text-xs">This utility flow contains no promotional content (no discounts, cross-selling, upselling, or FOMO language). It complies with WhatsApp's utility message policy.</p>
                        ) : (
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">WhatsApp utility policy violations:</p>
                            {utilityCompliance.violations.slice(0, 3).map((v, i) => (
                              <p key={i} className="text-muted-foreground">• <span className="font-medium">{v.severity === 'high' ? '⚠️' : '🟡'}</span> {v.rule}: "{v.matchedText}"</p>
                            ))}
                            {utilityCompliance.violations.length > 3 && (
                              <p className="text-muted-foreground">...and {utilityCompliance.violations.length - 3} more</p>
                            )}
                            <p className="text-red-600 font-medium mt-1">Utility messages must not contain promotional content per WhatsApp policy.</p>
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Badge variant="outline" className="text-[10px]">
                  {localMessages.length} messages
                </Badge>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={mockupEditMode ? "default" : "outline"}
                        size="sm"
                        className={`h-6 text-[10px] px-2 gap-1 transition-all ${
                          mockupEditMode
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setMockupEditMode(!mockupEditMode)}
                      >
                        {mockupEditMode ? (
                          <><Pencil className="w-3 h-3" />Edit Mode</>
                        ) : (
                          <><PencilOff className="w-3 h-3" />Edit Mode</>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">{mockupEditMode ? "Click to disable editing and switch to demo mode" : "Click to enable inline editing on the mockup"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {adCreative?.enabled && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={journeyMode ? "default" : "outline"}
                          size="sm"
                          className={`h-6 text-[10px] px-2 gap-1 transition-all ${
                            journeyMode
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => setJourneyMode(!journeyMode)}
                        >
                          <Monitor className="w-3 h-3" />
                          {journeyMode ? "Journey" : "Journey"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{journeyMode ? "Switch to WhatsApp-only preview" : "Show full CTWA journey: Ad → CTA → WhatsApp"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            {mockupEditMode && (
              <div className="mb-1.5 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md bg-emerald-50 border border-emerald-200 shrink-0">
                <Pencil className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] text-emerald-700 font-medium">Edit Mode — Click any text or image to edit directly</span>
              </div>
            )}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {journeyMode && adCreative?.enabled ? (
                <JourneyModePreview
                  adCreative={adCreative}
                  whatsappMockup={
                    <WhatsAppMockup
                      profileName={profileName}
                      profileImageUrl={profileImageUrl}
                      isVerified={true}
                      messages={mockupMessages}
                      reminderMessages={positionedReminders}
                      className="max-h-full"
                      imagesLoading={imagesGenerating}
                      editable={false}
                      captureControlRef={captureControlRef}
                    />
                  }
                />
              ) : (
              <WhatsAppMockup
                profileName={profileName}
                profileImageUrl={profileImageUrl}
                isVerified={true}
                messages={mockupMessages}
                reminderMessages={positionedReminders}
                className="max-h-full"
                imagesLoading={imagesGenerating}
                editable={mockupEditMode}
                captureControlRef={captureControlRef}
                onProfileNameChange={(name) => {
                  setProfileName(name);
                  if (uid) {
                    updateThread.mutate({ uid, profileName: name });
                  }
                }}
                onProfileImageChange={async (payload) => {
                  // payload format: base64::filename::mimeType
                  const [base64, filename, mimeType] = payload.split('::');
                  try {
                    const result = await uploadMutation.mutateAsync({
                      fileName: filename,
                      fileData: base64,
                      mimeType: mimeType,
                    });
                    setProfileImageUrl(result.url);
                    if (uid) {
                      updateThread.mutate({ uid, profileImageUrl: result.url });
                    }
                    toast.success('Profile photo updated');
                  } catch {
                    toast.error('Failed to upload profile photo');
                  }
                }}
                onProfileImageRemove={() => {
                  setProfileImageUrl(null);
                  if (uid) {
                    updateThread.mutate({ uid, profileImageUrl: null });
                  }
                  toast.success('Profile photo removed');
                }}
                onMessageEdit={(messageId, updatedContent) => {
                  pushUndo();
                  // Optimistically update local state
                  setLocalMessages(prev => prev.map(m =>
                    m.id === messageId ? { ...m, content: updatedContent, contentType: updatedContent.type } : m
                  ));
                  // Persist to server
                  updateMessage.mutate({
                    id: messageId,
                    content: updatedContent,
                    contentType: updatedContent.type,
                  });
                }}
                onMessageImageUpload={async (messageId, field, base64, fileName, mimeType) => {
                  try {
                    const result = await uploadMutation.mutateAsync({
                      fileName,
                      fileData: base64,
                      mimeType,
                    });
                    // Find the message and update the correct field
                    const msg = localMessages.find(m => m.id === messageId);
                    if (!msg) return;
                    pushUndo();
                    const updated = { ...msg.content };
                    // Handle carousel card image fields: card-idx-imageUrl
                    if (field.startsWith('card-')) {
                      const parts = field.split('-');
                      const cardIdx = parseInt(parts[1]);
                      const cardField = parts[2];
                      if (updated.carouselCards?.[cardIdx]) {
                        updated.carouselCards = updated.carouselCards.map((c, ci) =>
                          ci === cardIdx ? { ...c, [cardField]: result.url } : c
                        );
                      }
                    } else {
                      // Direct field: headerImageUrl, imageUrl, videoPosterUrl
                      (updated as any)[field] = result.url;
                    }
                    setLocalMessages(prev => prev.map(m =>
                      m.id === messageId ? { ...m, content: updated, contentType: updated.type } : m
                    ));
                    updateMessage.mutate({
                      id: messageId,
                      content: updated,
                      contentType: updated.type,
                    });
                    toast.success('Image updated');
                  } catch {
                    toast.error('Failed to upload image');
                  }
                }}
              />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export & Share Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Export & Share
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="download" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="download" className="text-sm">
                <FileDown className="w-4 h-4 mr-1.5" /> Download
              </TabsTrigger>
              <TabsTrigger value="share" className="text-sm">
                <Share2 className="w-4 h-4 mr-1.5" /> Share
              </TabsTrigger>
            </TabsList>

            <TabsContent value="download" className="space-y-3 mt-4">
              {/* Interactive HTML */}
              <button
                onClick={handleExportInteractiveHtml}
                disabled={isExporting}
                className="w-full flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Interactive HTML</span>
                    <Badge className="bg-green-500/10 text-green-600 text-[10px] border-0">Recommended</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Self-contained HTML file with full conversation simulation. Open in any browser during presentations — buttons, typing indicators, and carousels all work.
                  </p>
                </div>
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin mt-1" /> : <Download className="w-4 h-4 text-muted-foreground mt-1 group-hover:text-primary" />}
              </button>

              {/* Animated GIF */}
              <button
                onClick={handleExportGif}
                disabled={isExporting}
                className="w-full flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Animated GIF</span>
                    <Badge className="bg-purple-500/10 text-purple-600 text-[10px] border-0">Animated</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Animated GIF showing messages appearing one by one. Perfect for embedding in emails, Slack, or documents.
                  </p>
                  {isExporting && exportProgress && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-primary font-medium">{exportProgress}</p>
                        {exportProgressPercent > 0 && (
                          <span className="text-xs text-muted-foreground font-mono">{exportProgressPercent}%</span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${Math.max(exportProgressPercent, 5)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin mt-1" /> : <Download className="w-4 h-4 text-muted-foreground mt-1 group-hover:text-primary" />}
              </button>

              {/* PowerPoint */}
              <button
                onClick={handleExportPpt}
                disabled={isExporting}
                className="w-full flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">PowerPoint (.pptx)</span>
                    <Badge className="bg-orange-500/10 text-orange-600 text-[10px] border-0">Animated</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    4-slide pitch deck with animated conversation GIF, flow breakdown, and performance metrics. Open directly in PowerPoint.
                  </p>
                  {isExporting && exportProgress && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-primary font-medium">{exportProgress}</p>
                        {exportProgressPercent > 0 && (
                          <span className="text-xs text-muted-foreground font-mono">{exportProgressPercent}%</span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${Math.max(exportProgressPercent, 5)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin mt-1" /> : <Download className="w-4 h-4 text-muted-foreground mt-1 group-hover:text-primary" />}
              </button>



              {/* Share Link + Download */}
              <button
                onClick={() => {
                  if (!threadData?.thread.isPublic) {
                    handleShare();
                  }
                  const shareUrl = getShareUrl();
                  if (shareUrl) {
                    window.open(shareUrl, '_blank');
                  }
                }}
                className="w-full flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <ExternalLink className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-sm">Interactive Web Link</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Open the live interactive demo in a new tab. Share the link directly — recipients can interact with the full conversation flow.
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground mt-1 group-hover:text-primary" />
              </button>
            </TabsContent>

            <TabsContent value="share" className="space-y-3 mt-4">
              {/* Enable sharing notice */}
              {!threadData?.thread.isPublic && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-700">
                    Sharing is currently disabled. Click the button below to enable sharing and generate a share link.
                  </p>
                  <Button
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => { handleShare(); }}
                    disabled={toggleShare.isPending}
                  >
                    {toggleShare.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Share2 className="w-3 h-3 mr-1" />}
                    Enable Sharing
                  </Button>
                </div>
              )}

              {/* Copy Link */}
              <button
                onClick={() => {
                  const shareUrl = getShareUrl();
                  if (shareUrl) {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied to clipboard!");
                  } else {
                    toast.error("Enable sharing first");
                  }
                }}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center shrink-0">
                  <Copy className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-sm">Copy Link</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Copy the interactive demo link to your clipboard</p>
                </div>
              </button>

              {/* Email */}
              <button
                onClick={handleShareViaEmail}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-sm">Email</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Send via email with pre-filled subject and demo link</p>
                </div>
              </button>

              {/* Workchat */}
              <button
                onClick={handleShareViaWorkchat}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-sm">Workchat</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Share directly to Workplace Workchat</p>
                </div>
              </button>

              {/* WhatsApp */}
              <button
                onClick={handleShareViaWhatsApp}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="font-medium text-sm">WhatsApp</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Share the demo link via WhatsApp message</p>
                </div>
              </button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Save as Template Dialog */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Save as Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Save this conversation flow as a reusable template. You can use it as a starting point for future pitches.
            </p>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Template Name</label>
              <Input
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="e.g., Auto Trade-In Offer Flow"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
              <Textarea
                value={templateDescription}
                onChange={e => setTemplateDescription(e.target.value)}
                placeholder="Brief description of this template's use case..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{localMessages.length} messages</span> will be saved
                {industry && <> &middot; <span className="font-medium text-foreground">{industry}</span></>}
                {messageType && <> &middot; <span className="font-medium text-foreground">{MESSAGE_TYPES[messageType].label}</span></>}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveAsTemplate} disabled={isSavingTemplate || !templateName.trim()}>
                {isSavingTemplate ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Overlay */}
      {showAnalytics && localMessages.length > 0 && (() => {
        const analytics = getConversationAnalytics(localMessages);
        return (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg animate-in slide-in-from-bottom-5">
            <div className="container py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Estimated Performance Metrics
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground italic">Based on WhatsApp Business industry benchmarks</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAnalytics(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-lg font-bold text-green-600">{analytics.openRate}</div>
                  <div className="text-[10px] text-muted-foreground">Open Rate</div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-lg font-bold text-blue-600">{analytics.clickRate}</div>
                  <div className="text-[10px] text-muted-foreground">Click-Through</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-lg font-bold text-amber-600">{analytics.responseRate}</div>
                  <div className="text-[10px] text-muted-foreground">Response Rate</div>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="text-lg font-bold text-purple-600">{analytics.conversionRate}</div>
                  <div className="text-[10px] text-muted-foreground">Conversion</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="text-lg font-bold text-gray-700">{analytics.totalMessages}</div>
                  <div className="text-[10px] text-muted-foreground">Total Messages</div>
                </div>
                <div className="p-3 rounded-lg bg-teal-50 border border-teal-200">
                  <div className="text-lg font-bold text-teal-600">{analytics.businessMessages}</div>
                  <div className="text-[10px] text-muted-foreground">Business Msgs</div>
                </div>
                <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
                  <div className="text-lg font-bold text-sky-600">{analytics.customerMessages}</div>
                  <div className="text-[10px] text-muted-foreground">Customer Msgs</div>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <div className="text-lg font-bold text-rose-600">{analytics.interactionPoints}</div>
                  <div className="text-[10px] text-muted-foreground">Interaction Pts</div>
                </div>
              </div>
              {analytics.typeBreakdown.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {analytics.typeBreakdown.map((tb, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs">
                      <span className="font-medium">{tb.type}</span>
                      <span className="text-muted-foreground">&times;{tb.count}</span>
                      <span className="text-muted-foreground">&middot;</span>
                      <span className="text-muted-foreground">{tb.engagement}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Export Progress Overlay */}
      {exportOverlay.active && (() => {
        const steps = exportOverlay.type === 'pptx' ? PPTX_EXPORT_STEPS : GIF_EXPORT_STEPS;
        const currentStep = steps[exportOverlay.step] || steps[0];
        return (
          <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center">
            <div className="w-full max-w-md mx-4">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366]/10 mb-4">
                  {exportOverlay.type === 'pptx' ? (
                    <Presentation className="w-7 h-7 text-[#25D366] animate-pulse" />
                  ) : (
                    <Film className="w-7 h-7 text-[#25D366] animate-pulse" />
                  )}
                </div>
                <h2 className="text-lg font-semibold mb-1">
                  {exportOverlay.type === 'pptx' ? 'Building your pitch deck' : 'Creating your animated GIF'}
                </h2>
                <p className="text-sm text-muted-foreground">{exportOverlay.title}</p>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <Progress
                  value={currentStep.pct}
                  className="h-2.5 bg-muted"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {currentStep.pct}%
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {exportOverlay.elapsed}s
                  </span>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {steps.map((step, i) => {
                  const isActive = i === exportOverlay.step;
                  const isComplete = i < exportOverlay.step;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-[#25D366]/10 border border-[#25D366]/20"
                          : isComplete
                          ? "bg-muted/50 border border-transparent"
                          : "border border-transparent opacity-40"
                      }`}
                    >
                      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? "bg-[#25D366] text-white"
                          : isComplete
                          ? "bg-[#25D366]/20 text-[#25D366]"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {isComplete ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : isActive ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span className="text-xs font-medium">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          isActive ? "text-foreground" : isComplete ? "text-muted-foreground" : "text-muted-foreground/60"
                        }`}>{step.label}</p>
                        {(isActive || isComplete) && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{step.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tip */}
              <p className="text-center text-[11px] text-muted-foreground/60 mt-6">
                {exportOverlay.type === 'pptx'
                  ? 'This typically takes 20-40 seconds including animated preview generation'
                  : 'This typically takes 10-30 seconds depending on conversation length'
                }
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ==================== File Upload Hook ====================

function useFileUpload() {
  const uploadMutation = trpc.upload.file.useMutation();
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 10MB.");
        return null;
      }

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // strip data:...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await uploadMutation.mutateAsync({
        fileName: file.name,
        fileData: base64,
        mimeType: file.type,
      });

      toast.success("File uploaded successfully");
      return result.url;
    } catch (error) {
      toast.error("Failed to upload file");
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [uploadMutation]);

  return { uploadFile, isUploading };
}

// ==================== File Upload Button Component ====================

function FileUploadButton({
  accept,
  onUpload,
  label,
  currentUrl,
  cropAspect,
  cropTitle,
}: {
  accept: string;
  onUpload: (url: string) => void;
  label: string;
  currentUrl?: string;
  cropAspect?: number;
  cropTitle?: string;
}) {
  const { uploadFile, isUploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const isImageAccept = accept.includes("image");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isImageAccept && file.type.startsWith("image/")) {
      // Show cropper before uploading
      const objectUrl = URL.createObjectURL(file);
      setRawImageUrl(objectUrl);
      setCropperOpen(true);
    } else {
      // Non-image files: upload directly
      const url = await uploadFile(file);
      if (url) onUpload(url);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Clean up the object URL
    if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
    setRawImageUrl(null);

    // Upload the cropped image
    const croppedFile = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
    const url = await uploadFile(croppedFile);
    if (url) onUpload(url);
  };

  const handleCropperClose = () => {
    if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
    setRawImageUrl(null);
    setCropperOpen(false);
  };

  // Also allow cropping existing images
  const handleCropExisting = () => {
    if (currentUrl) {
      setRawImageUrl(currentUrl);
      setCropperOpen(true);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...</>
          ) : (
            <><Upload className="w-3 h-3 mr-1" /> {label}</>
          )}
        </Button>
        {isImageAccept && currentUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs px-2"
            onClick={handleCropExisting}
            title="Crop & resize image"
          >
            <CropIcon className="w-3 h-3" />
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {currentUrl && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1">
          <span className="truncate flex-1">{currentUrl.split('/').pop()}</span>
          <button onClick={() => onUpload("")} className="text-destructive hover:text-destructive/80">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {rawImageUrl && (
        <ImageCropper
          open={cropperOpen}
          onClose={handleCropperClose}
          imageUrl={rawImageUrl}
          onCropComplete={handleCropComplete}
          defaultAspect={cropAspect ?? 16 / 9}
          title={cropTitle ?? "Crop Image"}
        />
      )}
    </div>
  );
}

// ==================== Image Swap Button Component ====================

function ImageSwapButton({
  currentUrl,
  description,
  onSwap,
}: {
  currentUrl: string;
  description?: string;
  onSwap: (newUrl: string) => void;
}) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const { data } = trpc.image.getAlternatives.useQuery(
    { currentUrl, description },
    { enabled: showAlternatives && !!currentUrl }
  );

  const alternatives = data?.alternatives || [];

  if (!currentUrl) return null;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-xs w-full"
        onClick={() => setShowAlternatives(!showAlternatives)}
      >
        <Shuffle className="w-3 h-3 mr-1" /> Swap Image
      </Button>
      {showAlternatives && alternatives.length > 0 && (
        <div className="mt-1 border rounded-lg bg-background p-2 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-muted-foreground">Choose an alternative:</span>
            <button onClick={() => setShowAlternatives(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {alternatives.map((url, i) => (
              <button
                key={i}
                onClick={() => {
                  onSwap(url);
                  setShowAlternatives(false);
                  toast.success("Image swapped");
                }}
                className="relative rounded overflow-hidden border hover:border-primary hover:ring-2 ring-primary/20 transition-all group"
              >
                <img
                  src={url}
                  alt={`Alternative ${i + 1}`}
                  className="w-full h-14 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">Use</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {showAlternatives && alternatives.length === 0 && (
        <div className="mt-1 border rounded-lg bg-background p-2 shadow-md">
          <p className="text-[10px] text-muted-foreground text-center py-2">No alternatives available. Try uploading a custom image instead.</p>
        </div>
      )}
    </div>
  );
}

// ==================== Message Editor Types ====================

interface MessageEditorProps {
  message: LocalMessage;
  index: number;
  totalMessages: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (content: MessageContent) => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
  onChangeDirection: (direction: "inbound" | "outbound") => void;
  onChangeType: (type: MessageContent["type"]) => void;
  onDuplicate: () => void;
  onInsertAfter: (direction: "inbound" | "outbound", type: string) => void;
  showInsertMenu: boolean;
  onToggleInsertMenu: () => void;
  dragHandleProps?: Record<string, any>;
  hasViolation?: boolean;
  violationInfo?: { description: string; suggestion: string; outboundMessageId?: number };
  onAutoFix?: () => void;
  branchInfo?: { branchId: string; label: string } | null;
  hasBranchesFrom?: number; // number of branches from this message
}

// ==================== Sortable Wrapper ====================

// ==================== Sortable Reminder Editor ====================

interface SortableReminderEditorProps {
  localMessage: LocalMessage;
  reminder: ReminderMessage;
  index: number;
  onUpdate: (updated: ReminderMessage) => void;
  onDelete: () => void;
  onToggleEnabled: () => void;
}

function SortableReminderEditor({ localMessage, reminder, index, onUpdate, onDelete, onToggleEnabled }: SortableReminderEditorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: localMessage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const timingOption = REMINDER_TIMING_OPTIONS.find(o => o.value === reminder.timing);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={`border rounded-lg transition-colors border-amber-300 bg-amber-50/40`}>
        {/* Compact header row */}
        <div className="flex items-center gap-1.5 p-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          {/* Drag handle */}
          <div
            className="flex items-center cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-amber-100 transition-colors touch-none"
            onClick={e => e.stopPropagation()}
            {...listeners}
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4 text-amber-500/60" />
          </div>

          <span className="text-[11px] font-mono text-muted-foreground/60 w-4 text-center">{index + 1}</span>

          {/* Reminder badge */}
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-700 border-amber-500/30 flex items-center gap-1">
            <Bell className="w-2.5 h-2.5" /> Reminder
          </span>

          {/* Timing label */}
          <span className="text-[10px] text-amber-600 truncate flex-1">{reminder.timingLabel || timingOption?.label || reminder.timing}</span>

          {/* Type badge */}
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 ${
              reminder.content.buttons && reminder.content.buttons.length > 0
                ? 'bg-primary/5 text-primary border-primary/20'
                : 'bg-muted'
            }`}
          >
            {reminder.content.buttons && reminder.content.buttons.length > 0 ? 'Interactive' : 'Text'}
          </Badge>

          {/* Enable/disable toggle */}
          <Switch
            checked={reminder.enabled}
            onCheckedChange={(e) => {
              e && e; // prevent propagation
              onToggleEnabled();
            }}
            onClick={e => e.stopPropagation()}
            className="scale-75"
          />

          {/* Expand/collapse chevron */}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>

        {/* Preview text when collapsed */}
        {!isExpanded && (
          <div className="px-2 pb-2 pl-[52px]">
            <p className="text-xs text-muted-foreground truncate">{reminder.content.text || 'Empty reminder'}</p>
          </div>
        )}

        {/* Expanded editor */}
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-amber-200/50 space-y-2 pt-2">
            <Textarea
              value={reminder.content.text || ''}
              onChange={e => {
                onUpdate({ ...reminder, content: { ...reminder.content, text: e.target.value } });
              }}
              rows={3}
              className="text-xs resize-none"
              placeholder="Type your reminder message..."
            />

            {/* Quick Reply Buttons */}
            {reminder.content.buttons && reminder.content.buttons.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-muted-foreground">Quick Reply Buttons</label>
                <div className="space-y-1">
                  {reminder.content.buttons.map((btn, btnIdx) => (
                    <div key={btn.id} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={btn.title}
                        onChange={e => {
                          const newButtons = [...(reminder.content.buttons || [])];
                          newButtons[btnIdx] = { ...newButtons[btnIdx], title: e.target.value };
                          onUpdate({ ...reminder, content: { ...reminder.content, buttons: newButtons } });
                        }}
                        className="flex-1 text-[11px] px-2 py-1 border rounded bg-background"
                      />
                      <button
                        onClick={() => {
                          const newButtons = (reminder.content.buttons || []).filter((_, i) => i !== btnIdx);
                          onUpdate({ ...reminder, content: { ...reminder.content, buttons: newButtons } });
                        }}
                        className="text-muted-foreground hover:text-destructive p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newButtons = [...(reminder.content.buttons || []), { id: `btn_${Date.now()}`, title: 'New Button', type: 'quick_reply' as const }];
                      onUpdate({ ...reminder, content: { ...reminder.content, buttons: newButtons } });
                    }}
                    className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add button
                  </button>
                </div>
              </div>
            )}

            {/* Timing selector and delete */}
            <div className="flex items-center gap-2">
              <Select
                value={reminder.timing}
                onValueChange={(v) => {
                  const option = REMINDER_TIMING_OPTIONS.find(o => o.value === v);
                  onUpdate({ ...reminder, timing: v as ReminderTiming, timingLabel: option?.label || v });
                }}
              >
                <SelectTrigger className="h-7 text-[10px] flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_TIMING_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive p-1"
                title="Delete reminder"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Sortable Message Wrapper ====================

function SortableMessageEditor(props: MessageEditorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.message.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <MessageEditor {...props} dragHandleProps={listeners} />
    </div>
  );
}

// ==================== Message Editor Component ====================

function MessageEditor({
  message,
  index,
  totalMessages,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onMove,
  onChangeDirection,
  onChangeType,
  onDuplicate,
  onInsertAfter,
  showInsertMenu,
  onToggleInsertMenu,
  dragHandleProps,
  hasViolation,
  violationInfo,
  onAutoFix,
  branchInfo,
  hasBranchesFrom,
}: MessageEditorProps) {
  const [editContent, setEditContent] = useState<MessageContent>(message.content);

  useEffect(() => {
    setEditContent(message.content);
  }, [message.content]);

  const directionLabel = message.direction === "outbound" ? "Business" : "Customer";
  const typeLabel = (message.content.type || 'text').replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const getPreviewText = () => {
    if (message.content.type === "carousel") {
      const count = message.content.carouselCards?.length || 0;
      return `Carousel with ${count} card${count !== 1 ? "s" : ""}`;
    }
    if (message.content.type === "video") {
      return message.content.videoUrl ? "Video attached" : "No video set";
    }
    return message.content.text || message.content.bodyText || message.content.headerText || "Empty message";
  };

  const updateCarouselCard = (cardIdx: number, updates: Partial<CarouselCard>) => {
    const cards = [...(editContent.carouselCards || [])];
    cards[cardIdx] = { ...cards[cardIdx], ...updates };
    setEditContent({ ...editContent, carouselCards: cards });
  };

  const removeCarouselCard = (cardIdx: number) => {
    const cards = (editContent.carouselCards || []).filter((_, i) => i !== cardIdx);
    setEditContent({ ...editContent, carouselCards: cards });
  };

  const addCarouselCard = () => {
    const cards = [...(editContent.carouselCards || [])];
    cards.push({
      id: `card_${Date.now()}`,
      title: "New Product",
      description: "Product description",
      price: "$0.00",
      buttonText: "Buy Now",
      imageUrl: "",
    });
    setEditContent({ ...editContent, carouselCards: cards });
  };

  const MESSAGE_TYPE_OPTIONS: { value: MessageContent["type"]; label: string; icon: React.ReactNode; outboundOnly?: boolean }[] = [
    { value: "text", label: "Text", icon: <Type className="w-3 h-3" /> },
    { value: "template", label: "Template", icon: <LayoutTemplate className="w-3 h-3" />, outboundOnly: true },
    { value: "interactive_buttons", label: "Buttons", icon: <ListOrdered className="w-3 h-3" />, outboundOnly: true },
    { value: "interactive_list", label: "List", icon: <ListOrdered className="w-3 h-3" />, outboundOnly: true },
    { value: "image", label: "Image", icon: <Image className="w-3 h-3" /> },
    { value: "video", label: "Video", icon: <Film className="w-3 h-3" /> },
    { value: "carousel", label: "Carousel", icon: <Layers className="w-3 h-3" />, outboundOnly: true },
  ];

  const availableTypes = message.direction === "inbound"
    ? MESSAGE_TYPE_OPTIONS.filter(t => !t.outboundOnly)
    : MESSAGE_TYPE_OPTIONS;

  return (
    <div className={`border rounded-lg transition-colors ${branchInfo ? 'border-l-[3px] border-l-violet-400' : ''} ${hasViolation ? "border-amber-400 bg-amber-50/50" : isEditing ? "border-primary bg-primary/5" : "hover:border-muted-foreground/20"}`}>
      {/* Compact header row */}
      <div className="flex items-center gap-1.5 p-2 cursor-pointer" onClick={onEdit}>
        {/* Drag handle */}
        <div
          className="flex items-center cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted transition-colors touch-none"
          onClick={e => e.stopPropagation()}
          {...dragHandleProps}
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground/50" />
        </div>

        <span className="text-[11px] font-mono text-muted-foreground/60 w-4 text-center">{index + 1}</span>

        {/* Direction toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newDir = message.direction === "outbound" ? "inbound" : "outbound";
            onChangeDirection(newDir);
          }}
          className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all hover:scale-105 ${
            message.direction === "outbound"
              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/25"
              : "bg-blue-500/15 text-blue-700 border-blue-500/30 hover:bg-blue-500/25"
          }`}
          title={`Click to switch to ${message.direction === "outbound" ? "Customer" : "Business"}`}
        >
          {message.direction === "outbound" ? "Business" : "Customer"}
          <ArrowLeftRight className="w-2.5 h-2.5 inline ml-1 opacity-60" />
        </button>

        {/* Type badge */}
        <span className="text-[10px] text-muted-foreground truncate flex-1">{typeLabel}</span>

        {/* Branch indicators */}
        {branchInfo && (
          <span className="shrink-0 flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-700 border border-violet-500/20">
            <GitBranch className="w-2.5 h-2.5" />
            {branchInfo.label}
          </span>
        )}
        {!!hasBranchesFrom && hasBranchesFrom > 0 && (
          <span className="shrink-0 flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 border border-indigo-500/20">
            <GitFork className="w-2.5 h-2.5" />
            {hasBranchesFrom} branch{hasBranchesFrom !== 1 ? 'es' : ''}
          </span>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
            {isEditing ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onMove("up")} disabled={index === 0}>
                <ArrowUp className="w-3.5 h-3.5 mr-2" /> Move Up
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMove("down")} disabled={index === totalMessages - 1}>
                <ArrowDown className="w-3.5 h-3.5 mr-2" /> Move Down
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDuplicate}>
                <CopyPlus className="w-3.5 h-3.5 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleInsertMenu}>
                <PlusCircle className="w-3.5 h-3.5 mr-2" /> Insert After
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Preview text (collapsed) */}
      {!isEditing && (
        <div className="px-2 pb-2 -mt-1">
          <p className="text-xs text-muted-foreground truncate pl-[44px]">
            {getPreviewText()}
          </p>
          {hasViolation && violationInfo && (
            <div className="ml-[44px] mt-1 flex items-start gap-1.5 text-[10px] text-amber-700 bg-amber-100/60 border border-amber-200 rounded px-2 py-1">
              <span className="shrink-0 mt-0.5">⚠</span>
              <div className="flex-1">
                <p className="font-medium">{violationInfo.description}</p>
                <p className="text-amber-600 mt-0.5">{violationInfo.suggestion}</p>
              </div>
              {onAutoFix && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAutoFix(); }}
                  className="shrink-0 ml-2 px-2 py-0.5 rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors text-[10px] font-medium flex items-center gap-1"
                >
                  <Zap className="w-2.5 h-2.5" /> Auto-fix
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Type switcher bar (when editing) */}
      {isEditing && (
        <div className="px-2 pb-1">
          <div className="flex items-center gap-1 pl-[44px]">
            <span className="text-[10px] text-muted-foreground mr-1">Type:</span>
            <div className="flex flex-wrap gap-1">
              {availableTypes.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (opt.value !== editContent.type) {
                      onChangeType(opt.value);
                    }
                  }}
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                    editContent.type === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50 hover:bg-accent/50 text-muted-foreground"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit form */}
      {isEditing && (
        <div className="px-2 pb-2 space-y-2 pl-[44px]">
          {(editContent.type === "text") && (
            <Textarea
              value={editContent.text || ""}
              onChange={e => setEditContent({ ...editContent, text: e.target.value })}
              placeholder="Message text (use *bold*, _italic_)"
              rows={3}
              className="text-sm"
            />
          )}

          {editContent.type === "template" && (
            <>
              <Input
                value={editContent.headerText || ""}
                onChange={e => setEditContent({ ...editContent, headerText: e.target.value })}
                placeholder="Header text"
                className="text-sm"
              />
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">Header Image</label>
                <Input
                  value={editContent.headerImageUrl || ""}
                  onChange={e => setEditContent({ ...editContent, headerImageUrl: e.target.value })}
                  placeholder="Image URL (paste or upload)"
                  className="text-sm"
                />
                <FileUploadButton
                  accept="image/*"
                  label="Upload Header Image"
                  currentUrl={editContent.headerImageUrl}
                  onUpload={(url) => setEditContent({ ...editContent, headerImageUrl: url })}
                  cropAspect={16 / 9}
                  cropTitle="Crop Header Image (16:9)"
                />
                {editContent.headerImageUrl && (
                  <ImageSwapButton
                    currentUrl={editContent.headerImageUrl}
                    description={editContent.headerText || editContent.bodyText}
                    onSwap={(url) => setEditContent({ ...editContent, headerImageUrl: url })}
                  />
                )}
              </div>
              <Textarea
                value={editContent.bodyText || ""}
                onChange={e => setEditContent({ ...editContent, bodyText: e.target.value })}
                placeholder="Body text"
                rows={3}
                className="text-sm"
              />
              <Input
                value={editContent.footerText || ""}
                onChange={e => setEditContent({ ...editContent, footerText: e.target.value })}
                placeholder="Footer text"
                className="text-sm"
              />
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">Buttons</label>
                {(editContent.buttons || []).map((btn, i) => (
                  <div key={i} className="flex gap-1">
                    <Input
                      value={btn.title}
                      onChange={e => {
                        const newButtons = [...(editContent.buttons || [])];
                        newButtons[i] = { ...btn, title: e.target.value };
                        setEditContent({ ...editContent, buttons: newButtons });
                      }}
                      placeholder="Button title"
                      className="text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => {
                        const newButtons = (editContent.buttons || []).filter((_, j) => j !== i);
                        setEditContent({ ...editContent, buttons: newButtons });
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {(editContent.buttons || []).length < 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      const newButtons = [...(editContent.buttons || []), { id: `btn_${Date.now()}`, title: "New Button" }];
                      setEditContent({ ...editContent, buttons: newButtons });
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Button
                  </Button>
                )}
              </div>
            </>
          )}

          {editContent.type === "interactive_buttons" && (
            <>
              <Textarea
                value={editContent.text || ""}
                onChange={e => setEditContent({ ...editContent, text: e.target.value })}
                placeholder="Message text"
                rows={2}
                className="text-sm"
              />
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">Reply Buttons (max 3)</label>
                {(editContent.buttons || []).map((btn, i) => (
                  <div key={i} className="flex gap-1">
                    <Input
                      value={btn.title}
                      onChange={e => {
                        const newButtons = [...(editContent.buttons || [])];
                        newButtons[i] = { ...btn, title: e.target.value };
                        setEditContent({ ...editContent, buttons: newButtons });
                      }}
                      placeholder="Button title (max 20 chars)"
                      maxLength={20}
                      className="text-sm"
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                      onClick={() => {
                        const newButtons = (editContent.buttons || []).filter((_, j) => j !== i);
                        setEditContent({ ...editContent, buttons: newButtons });
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {(editContent.buttons || []).length < 3 && (
                  <Button variant="outline" size="sm" className="w-full text-xs"
                    onClick={() => {
                      const newButtons = [...(editContent.buttons || []), { id: `btn_${Date.now()}`, title: "Option" }];
                      setEditContent({ ...editContent, buttons: newButtons });
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Button
                  </Button>
                )}
              </div>
            </>
          )}

          {editContent.type === "interactive_list" && (
            <>
              <Textarea
                value={editContent.text || ""}
                onChange={e => setEditContent({ ...editContent, text: e.target.value })}
                placeholder="Message text"
                rows={2}
                className="text-sm"
              />
              <Input
                value={editContent.listButtonText || ""}
                onChange={e => setEditContent({ ...editContent, listButtonText: e.target.value })}
                placeholder="List button text"
                className="text-sm"
              />
              {/* List section editor */}
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground">List Sections</label>
                {(editContent.listSections || []).map((section, sIdx) => (
                  <div key={sIdx} className="border rounded p-2 space-y-1.5">
                    <div className="flex gap-1">
                      <Input
                        value={section.title}
                        onChange={e => {
                          const sections = [...(editContent.listSections || [])];
                          sections[sIdx] = { ...section, title: e.target.value };
                          setEditContent({ ...editContent, listSections: sections });
                        }}
                        placeholder="Section title"
                        className="text-xs h-7"
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                        onClick={() => {
                          const sections = (editContent.listSections || []).filter((_, i) => i !== sIdx);
                          setEditContent({ ...editContent, listSections: sections });
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {section.rows.map((row, rIdx) => (
                      <div key={rIdx} className="flex gap-1 pl-2">
                        <Input
                          value={row.title}
                          onChange={e => {
                            const sections = [...(editContent.listSections || [])];
                            const rows = [...sections[sIdx].rows];
                            rows[rIdx] = { ...row, title: e.target.value };
                            sections[sIdx] = { ...sections[sIdx], rows };
                            setEditContent({ ...editContent, listSections: sections });
                          }}
                          placeholder="Item title"
                          className="text-xs h-7"
                        />
                        <Input
                          value={row.description || ""}
                          onChange={e => {
                            const sections = [...(editContent.listSections || [])];
                            const rows = [...sections[sIdx].rows];
                            rows[rIdx] = { ...row, description: e.target.value };
                            sections[sIdx] = { ...sections[sIdx], rows };
                            setEditContent({ ...editContent, listSections: sections });
                          }}
                          placeholder="Description"
                          className="text-xs h-7"
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                          onClick={() => {
                            const sections = [...(editContent.listSections || [])];
                            const rows = sections[sIdx].rows.filter((_, i) => i !== rIdx);
                            sections[sIdx] = { ...sections[sIdx], rows };
                            setEditContent({ ...editContent, listSections: sections });
                          }}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full text-[10px] h-6 ml-2"
                      onClick={() => {
                        const sections = [...(editContent.listSections || [])];
                        const rows = [...sections[sIdx].rows, { id: `r_${Date.now()}`, title: "New Item", description: "" }];
                        sections[sIdx] = { ...sections[sIdx], rows };
                        setEditContent({ ...editContent, listSections: sections });
                      }}
                    >
                      <Plus className="w-2.5 h-2.5 mr-0.5" /> Add Item
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full text-xs"
                  onClick={() => {
                    const sections = [...(editContent.listSections || []), {
                      title: "New Section",
                      rows: [{ id: `r_${Date.now()}`, title: "Item 1", description: "" }],
                    }];
                    setEditContent({ ...editContent, listSections: sections });
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Section
                </Button>
              </div>
            </>
          )}

          {editContent.type === "image" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">Image</label>
                <Input
                  value={editContent.imageUrl || ""}
                  onChange={e => setEditContent({ ...editContent, imageUrl: e.target.value })}
                  placeholder="Image URL (paste or upload)"
                  className="text-sm"
                />
                <FileUploadButton
                  accept="image/*"
                  label="Upload Image"
                  currentUrl={editContent.imageUrl}
                  onUpload={(url) => setEditContent({ ...editContent, imageUrl: url })}
                  cropAspect={4 / 3}
                  cropTitle="Crop Image"
                />
                {editContent.imageUrl && (
                  <ImageSwapButton
                    currentUrl={editContent.imageUrl}
                    description={editContent.imageDescription || editContent.caption}
                    onSwap={(url) => setEditContent({ ...editContent, imageUrl: url })}
                  />
                )}
              </div>
              {editContent.imageUrl && (
                <div className="rounded overflow-hidden border">
                  <img src={editContent.imageUrl} alt="Preview" className="w-full h-24 object-cover" />
                </div>
              )}
              <Input
                value={editContent.caption || ""}
                onChange={e => setEditContent({ ...editContent, caption: e.target.value })}
                placeholder="Caption (optional)"
                className="text-sm"
              />
            </>
          )}

          {editContent.type === "video" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">Video</label>
                <Input
                  value={editContent.videoUrl || ""}
                  onChange={e => setEditContent({ ...editContent, videoUrl: e.target.value })}
                  placeholder="Video URL (paste or upload)"
                  className="text-sm"
                />
                <FileUploadButton
                  accept="video/*"
                  label="Upload Video"
                  currentUrl={editContent.videoUrl}
                  onUpload={(url) => setEditContent({ ...editContent, videoUrl: url })}
                />
              </div>
              {editContent.videoUrl && (
                <div className="rounded overflow-hidden border bg-black">
                  <video src={editContent.videoUrl} className="w-full h-24 object-contain" controls />
                </div>
              )}
              <Input
                value={editContent.caption || ""}
                onChange={e => setEditContent({ ...editContent, caption: e.target.value })}
                placeholder="Caption (optional)"
                className="text-sm"
              />
            </>
          )}

          {editContent.type === "carousel" && (
            <>
              <Textarea
                value={editContent.text || ""}
                onChange={e => setEditContent({ ...editContent, text: e.target.value })}
                placeholder="Intro text above carousel"
                rows={2}
                className="text-sm"
              />
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground">Carousel Cards ({(editContent.carouselCards || []).length})</label>
                {(editContent.carouselCards || []).map((card, cIdx) => (
                  <div key={card.id} className="border rounded-lg p-2 space-y-1.5 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground">Card {cIdx + 1}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeCarouselCard(cIdx)}>
                        <Trash2 className="w-2.5 h-2.5" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Input
                        value={card.imageUrl || ""}
                        onChange={e => updateCarouselCard(cIdx, { imageUrl: e.target.value })}
                        placeholder="Card image URL"
                        className="text-xs h-7"
                      />
                      <FileUploadButton
                        accept="image/*"
                        label="Upload Card Image"
                        currentUrl={card.imageUrl}
                        onUpload={(url) => updateCarouselCard(cIdx, { imageUrl: url })}
                        cropAspect={1}
                        cropTitle="Crop Card Image (1:1)"
                      />
                      {card.imageUrl && (
                        <>
                          <ImageSwapButton
                            currentUrl={card.imageUrl}
                            description={card.imageDescription || card.title}
                            onSwap={(url) => updateCarouselCard(cIdx, { imageUrl: url })}
                          />
                          <div className="rounded overflow-hidden border">
                            <img src={card.imageUrl} alt="" className="w-full h-16 object-cover" />
                          </div>
                        </>
                      )}
                    </div>
                    <Input
                      value={card.title}
                      onChange={e => updateCarouselCard(cIdx, { title: e.target.value })}
                      placeholder="Product title"
                      className="text-xs h-7"
                    />
                    <Input
                      value={card.description || ""}
                      onChange={e => updateCarouselCard(cIdx, { description: e.target.value })}
                      placeholder="Description"
                      className="text-xs h-7"
                    />
                    <div className="grid grid-cols-2 gap-1">
                      <Input
                        value={card.price || ""}
                        onChange={e => updateCarouselCard(cIdx, { price: e.target.value })}
                        placeholder="Price (e.g. $29.99)"
                        className="text-xs h-7"
                      />
                      <Input
                        value={card.buttonText}
                        onChange={e => updateCarouselCard(cIdx, { buttonText: e.target.value })}
                        placeholder="Button text"
                        className="text-xs h-7"
                      />
                    </div>
                  </div>
                ))}
                {(editContent.carouselCards || []).length < 10 && (
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={addCarouselCard}>
                    <Plus className="w-3 h-3 mr-1" /> Add Card
                  </Button>
                )}
              </div>
            </>
          )}

          <Button size="sm" onClick={() => onSave(editContent)} className="w-full">
            Save Changes
          </Button>
        </div>
      )}

      {/* Insert After menu */}
      {showInsertMenu && (
        <div className="mx-2 mb-2 mt-1 p-2 rounded-lg border border-dashed border-primary/40 bg-primary/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-primary">Insert message after #{index + 1}</span>
            <button onClick={onToggleInsertMenu} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button onClick={() => onInsertAfter("outbound", "text")} className="text-[10px] px-2 py-1 rounded border border-border hover:border-emerald-500/50 hover:bg-emerald-500/10 text-left flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-emerald-600" /> Biz Text
            </button>
            <button onClick={() => onInsertAfter("inbound", "text")} className="text-[10px] px-2 py-1 rounded border border-border hover:border-blue-500/50 hover:bg-blue-500/10 text-left flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-blue-600" /> Cust Text
            </button>
            <button onClick={() => onInsertAfter("outbound", "template")} className="text-[10px] px-2 py-1 rounded border border-border hover:border-emerald-500/50 hover:bg-emerald-500/10 text-left flex items-center gap-1">
              <LayoutTemplate className="w-3 h-3 text-emerald-600" /> Template
            </button>
            <button onClick={() => onInsertAfter("outbound", "interactive_buttons")} className="text-[10px] px-2 py-1 rounded border border-border hover:border-emerald-500/50 hover:bg-emerald-500/10 text-left flex items-center gap-1">
              <ListOrdered className="w-3 h-3 text-emerald-600" /> Buttons
            </button>
            <button onClick={() => onInsertAfter("outbound", "image")} className="text-[10px] px-2 py-1 rounded border border-border hover:border-emerald-500/50 hover:bg-emerald-500/10 text-left flex items-center gap-1">
              <Image className="w-3 h-3 text-emerald-600" /> Biz Image
            </button>
            <button onClick={() => onInsertAfter("inbound", "image")} className="text-[10px] px-2 py-1 rounded border border-border hover:border-blue-500/50 hover:bg-blue-500/10 text-left flex items-center gap-1">
              <Image className="w-3 h-3 text-blue-600" /> Cust Image
            </button>
            <button onClick={() => onInsertAfter("outbound", "carousel")} className="text-[10px] px-2 py-1 rounded border border-border hover:border-emerald-500/50 hover:bg-emerald-500/10 text-left flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-600" /> Carousel
            </button>
            <button onClick={() => onInsertAfter("outbound", "video")} className="text-[10px] px-2 py-1 rounded border border-border hover:border-emerald-500/50 hover:bg-emerald-500/10 text-left flex items-center gap-1">
              <Film className="w-3 h-3 text-emerald-600" /> Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Message Snippets ====================

interface SnippetMessage {
  direction: "inbound" | "outbound";
  contentType: string;
  content: MessageContent;
  timestamp?: string;
}

interface Snippet {
  name: string;
  icon: React.ReactNode;
  description: string;
  messages: SnippetMessage[];
}

const MESSAGE_SNIPPETS: Snippet[] = [
  {
    name: "CTA with Buttons",
    icon: <Zap className="w-3.5 h-3.5" />,
    description: "Promotional message with action buttons",
    messages: [
      {
        direction: "outbound",
        contentType: "interactive_buttons",
        content: {
          type: "interactive_buttons",
          text: "We have an exclusive offer just for you! Tap below to learn more.",
          buttons: [{ id: "1", title: "Learn More" }, { id: "2", title: "Not Interested" }],
        },
        timestamp: "10:00 AM",
      },
      {
        direction: "inbound",
        contentType: "text",
        content: { type: "text", text: "Tell me more about this offer!" },
        timestamp: "10:02 AM",
      },
    ],
  },
  {
    name: "Product Showcase",
    icon: <ShoppingCart className="w-3.5 h-3.5" />,
    description: "Image with product details and CTA",
    messages: [
      {
        direction: "outbound",
        contentType: "template",
        content: {
          type: "template",
          headerText: "New Arrival!",
          bodyText: "Check out our latest product. Limited stock available — order now and get free shipping!",
          footerText: "While supplies last",
          buttons: [{ id: "1", title: "Shop Now" }, { id: "2", title: "View Details" }],
        },
        timestamp: "11:00 AM",
      },
      {
        direction: "inbound",
        contentType: "text",
        content: { type: "text", text: "How much does it cost?" },
        timestamp: "11:03 AM",
      },
      {
        direction: "outbound",
        contentType: "text",
        content: { type: "text", text: "It's only $29.99! Would you like to place an order?" },
        timestamp: "11:04 AM",
      },
    ],
  },
  {
    name: "Appointment Booking",
    icon: <Bell className="w-3.5 h-3.5" />,
    description: "Schedule confirmation with options",
    messages: [
      {
        direction: "outbound",
        contentType: "interactive_buttons",
        content: {
          type: "interactive_buttons",
          text: "Your appointment is confirmed for tomorrow at 2:00 PM. Would you like to reschedule?",
          buttons: [{ id: "1", title: "Confirm" }, { id: "2", title: "Reschedule" }, { id: "3", title: "Cancel" }],
        },
        timestamp: "3:00 PM",
      },
      {
        direction: "inbound",
        contentType: "text",
        content: { type: "text", text: "Confirmed, see you tomorrow!" },
        timestamp: "3:05 PM",
      },
    ],
  },
  {
    name: "Verification Flow",
    icon: <Lock className="w-3.5 h-3.5" />,
    description: "OTP verification with confirmation",
    messages: [
      {
        direction: "outbound",
        contentType: "template",
        content: {
          type: "template",
          bodyText: "Your verification code is *482916*. This code expires in 10 minutes. Do not share this code with anyone.",
          footerText: "This is an automated message",
          buttons: [{ id: "1", title: "Copy Code" }],
        },
        timestamp: "4:00 PM",
      },
      {
        direction: "inbound",
        contentType: "text",
        content: { type: "text", text: "482916" },
        timestamp: "4:01 PM",
      },
      {
        direction: "outbound",
        contentType: "text",
        content: { type: "text", text: "\u2705 Your identity has been verified successfully. You can now proceed." },
        timestamp: "4:01 PM",
      },
    ],
  },
  {
    name: "Customer Feedback",
    icon: <Star className="w-3.5 h-3.5" />,
    description: "Rating request with follow-up",
    messages: [
      {
        direction: "outbound",
        contentType: "interactive_buttons",
        content: {
          type: "interactive_buttons",
          text: "How was your experience with us today? Your feedback helps us improve!",
          buttons: [{ id: "1", title: "\u2B50 Excellent" }, { id: "2", title: "\uD83D\uDC4D Good" }, { id: "3", title: "\uD83D\uDC4E Poor" }],
        },
        timestamp: "5:00 PM",
      },
      {
        direction: "inbound",
        contentType: "text",
        content: { type: "text", text: "Excellent! Great service." },
        timestamp: "5:02 PM",
      },
      {
        direction: "outbound",
        contentType: "text",
        content: { type: "text", text: "Thank you for your kind feedback! We're glad you had a great experience. \uD83D\uDE4F" },
        timestamp: "5:02 PM",
      },
    ],
  },
  {
    name: "Order Status",
    icon: <Package className="w-3.5 h-3.5" />,
    description: "Delivery update with tracking",
    messages: [
      {
        direction: "outbound",
        contentType: "template",
        content: {
          type: "template",
          headerText: "\uD83D\uDCE6 Order Update",
          bodyText: "Great news! Your order #12345 has been shipped and is on its way. Estimated delivery: March 10, 2026.",
          footerText: "Track your package anytime",
          buttons: [{ id: "1", title: "Track Package" }, { id: "2", title: "Contact Support" }],
        },
        timestamp: "9:00 AM",
      },
      {
        direction: "inbound",
        contentType: "text",
        content: { type: "text", text: "Thanks! Can I change the delivery address?" },
        timestamp: "9:15 AM",
      },
    ],
  },
  {
    name: "Welcome & Onboarding",
    icon: <UserCheck className="w-3.5 h-3.5" />,
    description: "New user greeting with quick actions",
    messages: [
      {
        direction: "outbound",
        contentType: "template",
        content: {
          type: "template",
          headerText: "Welcome! \uD83D\uDC4B",
          bodyText: "Hi there! Welcome to our service. We're excited to have you on board. Here's how to get started:",
          footerText: "Reply HELP anytime for assistance",
          buttons: [{ id: "1", title: "Get Started" }, { id: "2", title: "Browse Catalog" }, { id: "3", title: "Talk to Agent" }],
        },
        timestamp: "8:00 AM",
      },
      {
        direction: "inbound",
        contentType: "text",
        content: { type: "text", text: "Hi! I'd like to get started." },
        timestamp: "8:05 AM",
      },
      {
        direction: "outbound",
        contentType: "interactive_list",
        content: {
          type: "interactive_list",
          text: "Here are some things you can do:",
          listButtonText: "View Options",
          listSections: [
            {
              title: "Quick Actions",
              rows: [
                { id: "1", title: "Set up your profile", description: "Add your name and preferences" },
                { id: "2", title: "Browse products", description: "See what's available" },
                { id: "3", title: "Get support", description: "Chat with our team" },
              ],
            },
          ],
        },
        timestamp: "8:06 AM",
      },
    ],
  },
];

function MessageSnippets({ onInsertSnippet }: { onInsertSnippet: (messages: SnippetMessage[]) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-1"
      >
        <Zap className="w-3 h-3" />
        <span className="font-medium">Quick Snippets</span>
        <span className="text-[10px] text-muted-foreground/60">— pre-built conversation blocks</span>
        <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {MESSAGE_SNIPPETS.map((snippet) => (
            <button
              key={snippet.name}
              onClick={() => {
                onInsertSnippet(snippet.messages);
                setIsExpanded(false);
              }}
              className="flex items-start gap-2 p-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-colors group"
            >
              <div className="mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
                {snippet.icon}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium truncate">{snippet.name}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{snippet.description}</div>
                <div className="text-[9px] text-muted-foreground/60 mt-0.5">{snippet.messages.length} messages</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== Generation Timer ====================

function GenerationTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
      <span className="flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Elapsed: {timeStr}
      </span>
      <span className="text-muted-foreground/60">
        {elapsed < 5 ? "Starting up..." :
         elapsed < 15 ? "Usually takes 10-20s" :
         elapsed < 30 ? "Almost there..." :
         "Taking a bit longer than usual..."}
      </span>
    </div>
  );
}

// ==================== Quick Prompts ====================

// Quick prompts are now provided by shared/industryPrompts.ts
