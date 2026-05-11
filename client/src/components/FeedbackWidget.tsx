import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { MessageCircle, X, Send, Check } from "lucide-react";

type Sentiment = "positive" | "neutral" | "negative";

const SENTIMENTS: { value: Sentiment; emoji: string; label: string }[] = [
  { value: "positive", emoji: "\u{1F60A}", label: "Love it" },
  { value: "neutral", emoji: "\u{1F44D}", label: "It's okay" },
  { value: "negative", emoji: "\u{1F615}", label: "Needs work" },
];

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
        setText("");
        setSentiment(null);
      }, 2000);
    },
  });

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    submitMutation.mutate({
      text: text.trim(),
      sentiment: sentiment ?? undefined,
      pageUrl: window.location.pathname,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div ref={widgetRef} className="fixed bottom-5 right-5" style={{ zIndex: 40 }}>
      {/* Expanded card */}
      {isOpen && (
        <div
          className="mb-3 w-[300px] rounded-xl border border-border bg-card text-card-foreground shadow-lg overflow-hidden"
          style={{ animation: "feedbackSlideUp 0.2s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-medium">Share Feedback</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {submitted ? (
            /* Thank you state */
            <div className="flex flex-col items-center justify-center py-8 px-4 gap-2">
              <div className="w-10 h-10 rounded-full bg-wa-green/15 flex items-center justify-center">
                <Check className="w-5 h-5 text-wa-green" />
              </div>
              <p className="text-sm font-medium">Thanks for your feedback!</p>
              <p className="text-xs text-muted-foreground">Your input helps us improve.</p>
            </div>
          ) : (
            /* Form state */
            <div className="p-4 space-y-3">
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's working? What could be better?"
                className="w-full h-[80px] resize-none rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-wa-green/50"
                maxLength={2000}
              />

              {/* Sentiment selector */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-1">How do you feel?</span>
                {SENTIMENTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSentiment(sentiment === s.value ? null : s.value)}
                    title={s.label}
                    className={`px-2 py-1 rounded-md text-base transition-all ${
                      sentiment === s.value
                        ? "bg-wa-green/15 ring-1 ring-wa-green/40 scale-110"
                        : "hover:bg-muted opacity-60 hover:opacity-100"
                    }`}
                  >
                    {s.emoji}
                  </button>
                ))}
              </div>

              {/* Submit row */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground">
                  Anonymous &middot; {String.fromCodePoint(8984)}+Enter to send
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || submitMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wa-green text-white text-xs font-medium hover:bg-wa-green/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submitMutation.isPending ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  Send
                </button>
              </div>

              {submitMutation.isError && (
                <p className="text-xs text-destructive">
                  Failed to send. Please try again.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Share Feedback"
        className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all duration-200 ml-auto ${
          isOpen
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-wa-green text-white hover:bg-wa-green/90 hover:scale-105"
        }`}
      >
        {isOpen ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
      </button>

      {/* Slide-up animation */}
      <style>{`
        @keyframes feedbackSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
