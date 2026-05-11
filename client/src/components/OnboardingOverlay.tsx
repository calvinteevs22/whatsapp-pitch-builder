import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Sparkles, ArrowRight, X } from "lucide-react";

const ONBOARDING_KEY = "wa-pitch-builder-onboarded";

interface OnboardingOverlayProps {
  onBrowseTemplates: () => void;
  onCreateTailored: () => void;
}

export default function OnboardingOverlay({ onBrowseTemplates, onCreateTailored }: OnboardingOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setShow(false);
  };

  const handleBrowse = () => {
    dismiss();
    onBrowseTemplates();
  };

  const handleCreate = () => {
    dismiss();
    onCreateTailored();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 px-8 pt-8 pb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25D366]/15 text-[#25D366] text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" /> Welcome to WhatsApp Pitch Builder
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            How would you like to start?
          </h2>
          <p className="text-sm text-gray-500">
            Pick the path that fits your workflow. You can always switch later.
          </p>
        </div>

        {/* Two paths */}
        <div className="px-8 py-6 space-y-3">
          {/* Path 1: Templates */}
          <button
            onClick={handleBrowse}
            className="w-full group flex items-start gap-4 p-4 rounded-xl border-2 border-[#25D366]/30 hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#25D366] flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 flex items-center gap-2">
                Browse Industry Templates
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#25D366]/15 text-[#25D366]">RECOMMENDED</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                230+ ready-made templates across 15 industries. Pick one and customize in seconds.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#25D366] mt-3 transition-colors flex-shrink-0" />
          </button>

          {/* Path 2: Tailored */}
          <button
            onClick={handleCreate}
            className="w-full group flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900">
                Create a Tailored Pitch
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Paste a client's website URL and AI builds a personalized demo with their products and branding.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 mt-3 transition-colors flex-shrink-0" />
          </button>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-500 transition-colors">
            Skip — I'll explore on my own
          </button>
        </div>
      </div>
    </div>
  );
}
