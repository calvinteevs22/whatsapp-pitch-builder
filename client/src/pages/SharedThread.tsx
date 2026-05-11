import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { useSearch } from "wouter";
import WhatsAppMockup from "@/components/WhatsAppMockup";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, AlertCircle, Presentation, ArrowLeft, Maximize2, Minimize2, Monitor } from "lucide-react";
import { MESSAGE_TYPES } from "@shared/types";
import type { MessageContent, AdCreative } from "@shared/types";
import { useState, useEffect } from "react";
import JourneyModePreview from "@/components/JourneyModePreview";

export default function SharedThread() {
  const [, params] = useRoute("/shared/:token");
  const token = params?.token;
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const isPresentationMode = searchParams.get("mode") === "presentation";
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showJourney, setShowJourney] = useState(false);

  const { data, isLoading, error } = trpc.thread.getShared.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Initialize showJourney when data loads
  useEffect(() => {
    if (data) {
      const adCreative = (data.thread as any).adCreative as AdCreative | null;
      if (adCreative?.enabled) {
        setShowJourney(true);
      }
    }
  }, [data]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#075E54]/5 to-[#25D366]/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#075E54]/5 to-[#25D366]/5">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Thread Not Found</h2>
            <p className="text-sm text-muted-foreground">
              This shared thread may have been removed or the link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { thread, messages } = data;
  const mockupMessages = messages.map(m => ({
    id: m.id,
    sortOrder: m.sortOrder,
    direction: m.direction as "inbound" | "outbound",
    contentType: m.contentType,
    content: m.content as MessageContent,
    timestamp: m.timestamp,
    isRead: m.isRead,
  }));
  const threadReminders = (thread as any).reminderMessages || [];
  const threadAdCreative = (thread as any).adCreative as AdCreative | null;

  // Presentation mode: clean, centered layout optimized for screen sharing
  if (isPresentationMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col">
        {/* Minimal top bar */}
        <div className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="container flex items-center justify-between h-12">
            <div className="flex items-center gap-3">
              <Presentation className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-sm">{thread.name}</span>
              <Badge
                variant="secondary"
                className="text-[10px] h-4"
                style={{
                  backgroundColor: `${MESSAGE_TYPES[thread.messageType]?.color || "#25D366"}15`,
                  color: MESSAGE_TYPES[thread.messageType]?.color || "#25D366",
                }}
              >
                {MESSAGE_TYPES[thread.messageType]?.label || thread.messageType}
              </Badge>
              {thread.industry && (
                <Badge variant="outline" className="text-[10px] h-4">{thread.industry}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{messages.length} messages</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="w-3 h-3 mr-1" /> : <Maximize2 className="w-3 h-3 mr-1" />}
                {isFullscreen ? "Exit" : "Fullscreen"}
              </Button>
            </div>
          </div>
        </div>

        {/* Centered mockup */}
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="max-w-lg w-full px-4">
            {showJourney && threadAdCreative?.enabled ? (
              <JourneyModePreview
                adCreative={threadAdCreative}
                autoPlay={true}
                whatsappMockup={
                  <WhatsAppMockup
                    profileName={thread.profileName || thread.businessName || "Business"}
                    profileImageUrl={thread.profileImageUrl}
                    isVerified={thread.isVerified}
                    messages={mockupMessages}
                    reminderMessages={threadReminders}
                  />
                }
              />
            ) : (
              <WhatsAppMockup
                profileName={thread.profileName || thread.businessName || "Business"}
                profileImageUrl={thread.profileImageUrl}
                isVerified={thread.isVerified}
                messages={mockupMessages}
                reminderMessages={threadReminders}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-white/60 backdrop-blur-sm py-2">
          <div className="container text-center">
            <span className="text-[10px] text-muted-foreground">
              Built with WhatsApp Pitch Builder
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Standard shared view
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E54]/5 via-background to-[#25D366]/5">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663344446488/YocM5kPJZcUQjCCGhq86Jj/whatsapp-logo_55bb387d.png" alt="WhatsApp" className="w-8 h-8" />
            <div>
              <span className="font-bold text-sm">{thread.name}</span>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className="text-[9px] h-3.5"
                  style={{
                    backgroundColor: `${MESSAGE_TYPES[thread.messageType]?.color || "#25D366"}15`,
                    color: MESSAGE_TYPES[thread.messageType]?.color || "#25D366",
                  }}
                >
                  {MESSAGE_TYPES[thread.messageType]?.label || thread.messageType}
                </Badge>
                {thread.industry && (
                  <Badge variant="outline" className="text-[9px] h-3.5">{thread.industry}</Badge>
                )}
              </div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Shared via WhatsApp Pitch Builder</span>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {threadAdCreative?.enabled && (
          <div className="max-w-lg mx-auto mb-3 flex justify-center">
            <Button
              variant={showJourney ? "default" : "outline"}
              size="sm"
              className={`text-xs gap-1.5 ${
                showJourney ? "bg-blue-600 hover:bg-blue-700" : ""
              }`}
              onClick={() => setShowJourney(!showJourney)}
            >
              <Monitor className="w-3.5 h-3.5" />
              {showJourney ? "Viewing Full Journey" : "Show Ad → WhatsApp Journey"}
            </Button>
          </div>
        )}
        <div className="max-w-lg mx-auto">
          {showJourney && threadAdCreative?.enabled ? (
            <JourneyModePreview
              adCreative={threadAdCreative}
              whatsappMockup={
                <WhatsAppMockup
                  profileName={thread.profileName || thread.businessName || "Business"}
                  profileImageUrl={thread.profileImageUrl}
                  isVerified={thread.isVerified}
                  messages={mockupMessages}
                  reminderMessages={threadReminders}
                />
              }
            />
          ) : (
            <WhatsAppMockup
              profileName={thread.profileName || thread.businessName || "Business"}
              profileImageUrl={thread.profileImageUrl}
              isVerified={thread.isVerified}
              messages={mockupMessages}
              reminderMessages={threadReminders}
            />
          )}
        </div>
      </div>
    </div>
  );
}
