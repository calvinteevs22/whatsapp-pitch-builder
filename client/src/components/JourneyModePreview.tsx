import { useState, useEffect, useCallback, useRef } from "react";
import type { AdCreative } from "@shared/types";
import AdMockup from "./AdMockup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, SkipForward, Pause, ChevronRight, Monitor, MessageCircle } from "lucide-react";

type JourneyPhase = "ad" | "transition" | "whatsapp";

interface JourneyModePreviewProps {
  adCreative: AdCreative;
  /** The WhatsApp mockup element to render in the whatsapp phase */
  whatsappMockup: React.ReactNode;
  className?: string;
  /** Auto-play on mount */
  autoPlay?: boolean;
  /** Callback when phase changes */
  onPhaseChange?: (phase: JourneyPhase) => void;
}

/**
 * Journey Mode Preview — shows the full CTWA customer journey:
 * 1. Ad mockup (Facebook/Instagram)
 * 2. Transition animation (CTA click → WhatsApp opening)
 * 3. WhatsApp conversation
 */
export default function JourneyModePreview({
  adCreative,
  whatsappMockup,
  className = "",
  autoPlay = false,
  onPhaseChange,
}: JourneyModePreviewProps) {
  const [phase, setPhase] = useState<JourneyPhase>("ad");
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const transitionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const changePhase = useCallback((newPhase: JourneyPhase) => {
    setPhase(newPhase);
    onPhaseChange?.(newPhase);
  }, [onPhaseChange]);

  // Handle CTA click on ad → start transition
  const handleCtaClick = useCallback(() => {
    changePhase("transition");
    setTransitionProgress(0);

    // Animate transition over 2 seconds
    let progress = 0;
    if (transitionTimerRef.current) clearInterval(transitionTimerRef.current);
    transitionTimerRef.current = setInterval(() => {
      progress += 2;
      setTransitionProgress(progress);
      if (progress >= 100) {
        if (transitionTimerRef.current) clearInterval(transitionTimerRef.current);
        changePhase("whatsapp");
      }
    }, 40); // 50 steps over 2s
  }, [changePhase]);

  // Auto-play: after showing ad for 3s, auto-click CTA
  useEffect(() => {
    if (!isPlaying || phase !== "ad") return;
    const timer = setTimeout(() => {
      handleCtaClick();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isPlaying, phase, handleCtaClick]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearInterval(transitionTimerRef.current);
    };
  }, []);

  const restart = () => {
    if (transitionTimerRef.current) clearInterval(transitionTimerRef.current);
    setTransitionProgress(0);
    changePhase("ad");
    setIsPlaying(false);
  };

  const skipToWhatsApp = () => {
    if (transitionTimerRef.current) clearInterval(transitionTimerRef.current);
    setTransitionProgress(100);
    changePhase("whatsapp");
  };

  const phaseLabels: Record<JourneyPhase, string> = {
    ad: "Ad View",
    transition: "Opening WhatsApp...",
    whatsapp: "WhatsApp Conversation",
  };

  const placementLabel = adCreative.placement === "facebook_feed" ? "Facebook" :
    adCreative.placement === "instagram_feed" ? "Instagram Feed" :
    adCreative.placement === "instagram_story" ? "Instagram Story" : "Instagram Reels";

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Journey progress bar */}
      <div className="flex items-center gap-1.5 mb-2 px-1 shrink-0">
        <button
          onClick={() => { changePhase("ad"); setIsPlaying(false); }}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
            phase === "ad"
              ? "bg-blue-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Monitor className="w-3 h-3" />
          {placementLabel}
        </button>
        <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
        <button
          onClick={phase === "ad" ? handleCtaClick : undefined}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
            phase === "transition"
              ? "bg-green-500 text-white animate-pulse"
              : phase === "whatsapp"
              ? "bg-green-500/20 text-green-700"
              : "bg-muted text-muted-foreground"
          }`}
        >
          CTA Click
        </button>
        <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
        <button
          onClick={skipToWhatsApp}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
            phase === "whatsapp"
              ? "bg-[#25D366] text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <MessageCircle className="w-3 h-3" />
          WhatsApp
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 mb-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={() => {
            if (phase === "ad") {
              setIsPlaying(true);
            } else {
              restart();
              setTimeout(() => setIsPlaying(true), 100);
            }
          }}
        >
          <Play className="w-3 h-3 mr-1" /> Play Journey
        </Button>
        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={restart}>
          <RotateCcw className="w-3 h-3 mr-1" /> Restart
        </Button>
        {phase !== "whatsapp" && (
          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={skipToWhatsApp}>
            <SkipForward className="w-3 h-3 mr-1" /> Skip to Chat
          </Button>
        )}
      </div>

      {/* Content area — uses min-height so it works even without a height-constrained parent */}
      <div className="flex-1 relative overflow-hidden rounded-lg" style={{ minHeight: 600 }}>
        {/* Ad phase */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
            phase === "ad"
              ? "opacity-100 scale-100"
              : phase === "transition"
              ? "opacity-0 scale-95"
              : "opacity-0 scale-90 pointer-events-none"
          }`}
        >
          <AdMockup
            adCreative={adCreative}
            onCtaClick={handleCtaClick}
            showPhoneFrame={true}
          />
        </div>

        {/* Transition phase */}
        {phase === "transition" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5">
            <div className="text-center space-y-3">
              {/* WhatsApp opening animation */}
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#25D366] flex items-center justify-center animate-bounce shadow-lg">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Opening WhatsApp...</p>
              {/* Progress bar */}
              <div className="w-48 h-1.5 bg-muted rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-[#25D366] rounded-full transition-all duration-100"
                  style={{ width: `${transitionProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp phase */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            phase === "whatsapp"
              ? "opacity-100 scale-100"
              : "opacity-0 scale-110 pointer-events-none"
          }`}
        >
          {whatsappMockup}
        </div>
      </div>
    </div>
  );
}
