import { useState } from "react";
import type { AdCreative } from "@shared/types";
import { MoreHorizontal, X } from "lucide-react";

interface InstagramStoryAdProps {
  adCreative: AdCreative;
  onCtaClick?: () => void;
  className?: string;
  scale?: number;
}

/**
 * Instagram Story ad mockup — 9:16 vertical.
 *
 * Safe zones (per Meta guidelines):
 *   Top:    14 % (270 px of 1920) — status bar + profile row
 *   Bottom: 20 % (380 px of 1920) — CTA / swipe-up area
 *   Sides:   6 % (65 px of 1080)  — edge padding
 *
 * Key creative content (headline, primary text) is placed inside the
 * safe zone so it won't be obscured by platform UI overlays.
 */
export default function InstagramStoryAd({ adCreative, onCtaClick, className = "", scale = 1 }: InstagramStoryAdProps) {
  const [imageError, setImageError] = useState(false);
  const brandInitial = (adCreative.brandName || "B").charAt(0).toUpperCase();
  const brandHandle = (adCreative.brandName || "brand").toLowerCase().replace(/\s+/g, "");

  return (
    <div
      className={`bg-black flex flex-col w-full relative overflow-hidden ${className}`}
      style={{ fontSize: `${scale * 14}px`, aspectRatio: "9/16" }}
    >
      {/* ── Full-screen background image ── */}
      <div className="absolute inset-0">
        {adCreative.mediaUrl && !imageError ? (
          <img
            src={adCreative.mediaUrl}
            alt={adCreative.headline}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center text-gray-500">
            <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
      </div>

      {/* ═══════════════════════════════════════════
          TOP SAFE ZONE — 14 % of height
          Story progress bar + brand profile row
          ═══════════════════════════════════════════ */}
      <div className="relative z-10" style={{ minHeight: "14%" }}>
        {/* Story progress bar */}
        <div className="px-2 pt-2">
          <div className="h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full w-1/3" />
          </div>
        </div>

        {/* Brand info row */}
        <div className="px-3 py-2 flex items-center gap-2">
          <div className="flex-shrink-0">
            {adCreative.brandLogoUrl ? (
              <img
                src={adCreative.brandLogoUrl}
                alt={adCreative.brandName}
                className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border-2 border-white/30"
                style={{ fontSize: `${scale * 11}px` }}
              >
                {brandInitial}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-white font-semibold truncate" style={{ fontSize: `${scale * 13}px` }}>
              {brandHandle}
            </span>
            <span className="text-white/60 flex-shrink-0" style={{ fontSize: `${scale * 12}px` }}>
              Sponsored
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MoreHorizontal className="w-5 h-5 text-white" />
            <X className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CONTENT SAFE ZONE — centre 66 % of height
          Headline + primary text sit here, padded
          6 % from each side.
          ═══════════════════════════════════════════ */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center"
        style={{ paddingLeft: "6%", paddingRight: "6%" }}
      >
        {adCreative.headline && (
          <div className="text-center">
            <h2
              className="text-white font-bold leading-tight drop-shadow-lg"
              style={{ fontSize: `${scale * 22}px` }}
            >
              {adCreative.headline}
            </h2>
            {adCreative.primaryText && (
              <p className="text-white/90 mt-2 drop-shadow" style={{ fontSize: `${scale * 14}px` }}>
                {adCreative.primaryText}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          BOTTOM SAFE ZONE — 20 % of height
          CTA button sits here (swipe-up style)
          ═══════════════════════════════════════════ */}
      <div
        className="relative z-10 flex flex-col items-center justify-end"
        style={{ minHeight: "20%", paddingLeft: "6%", paddingRight: "6%", paddingBottom: "4%" }}
      >
        {/* "Sponsored" label */}
        <span className="text-white/50 mb-2" style={{ fontSize: `${scale * 10}px`, letterSpacing: "0.05em" }}>
          Sponsored
        </span>

        <button
          onClick={onCtaClick}
          className="w-full py-3 rounded-full bg-white hover:bg-gray-100 text-[#262626] font-semibold text-center transition-colors flex items-center justify-center gap-2 shadow-lg"
          style={{ fontSize: `${scale * 14}px` }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {adCreative.ctaText || "Send WhatsApp Message"}
        </button>
      </div>
    </div>
  );
}
