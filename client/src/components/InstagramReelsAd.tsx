import { useState } from "react";
import type { AdCreative } from "@shared/types";
import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Music } from "lucide-react";

interface InstagramReelsAdProps {
  adCreative: AdCreative;
  onCtaClick?: () => void;
  className?: string;
  scale?: number;
}

/**
 * Instagram Reels ad mockup — 9:16 vertical.
 *
 * Safe zones (per Meta guidelines — DIFFERENT from Stories):
 *   Top:    14 % (270 px of 1920) — "Reels" header + camera icon
 *   Bottom: 35 % (670 px of 1920) — likes, comments, share, audio, caption, CTA
 *   Sides:   6 % (65 px of 1080)  — edge padding
 *
 * The bottom safe zone is 35 % (vs Stories' 20 %) because Reels has more
 * interactive elements: likes, comments, share, audio bar, creator caption.
 *
 * Best practices applied:
 * - Hook in first 3 seconds (play button overlay signals video)
 * - Human-presence friendly layout
 * - CTA prominent but within safe zone
 * - Brand logo visible in safe zone
 * - Text overlays minimal and within centre safe zone
 * - Original audio track bar shown
 */
export default function InstagramReelsAd({ adCreative, onCtaClick, className = "", scale = 1 }: InstagramReelsAdProps) {
  const [imageError, setImageError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const brandInitial = (adCreative.brandName || "B").charAt(0).toUpperCase();
  const brandHandle = (adCreative.brandName || "brand").toLowerCase().replace(/\s+/g, "");

  return (
    <div
      className={`bg-black flex flex-col w-full relative overflow-hidden ${className}`}
      style={{ fontSize: `${scale * 14}px`, aspectRatio: "9/16" }}
    >
      {/* ── Full-screen background media ── */}
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
      </div>

      {/* ═══════════════════════════════════════════
          TOP SAFE ZONE — 14 % of height
          "Reels" header + camera icon
          ═══════════════════════════════════════════ */}
      <div className="relative z-10" style={{ minHeight: "14%" }}>
        <div className="px-4 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold" style={{ fontSize: `${scale * 16}px` }}>Reels</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CONTENT SAFE ZONE — centre 51 % of height
          (100% - 14% top - 35% bottom = 51%)
          Headline overlay sits here, padded 6 % sides.
          This is the only area where key creative
          elements (text, logos) should appear.
          ═══════════════════════════════════════════ */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center"
        style={{ paddingLeft: "6%", paddingRight: "6%" }}
      >
        {adCreative.headline && !adCreative.primaryText && (
          <div className="text-center">
            <h2
              className="text-white font-bold leading-tight drop-shadow-lg"
              style={{ fontSize: `${scale * 20}px` }}
            >
              {adCreative.headline}
            </h2>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          BOTTOM SAFE ZONE — 35 % of height
          This is the critical Reels difference:
          35% vs Stories' 20%.
          Contains: right-side engagement icons,
          brand info, caption, CTA, audio track.
          ═══════════════════════════════════════════ */}
      <div
        className="relative z-10 flex items-end gap-2"
        style={{ minHeight: "35%", paddingLeft: "6%", paddingRight: "6%", paddingBottom: "2%" }}
      >
        {/* Left side: brand info, caption, CTA, audio */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Brand info row */}
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              {adCreative.brandLogoUrl ? (
                <img
                  src={adCreative.brandLogoUrl}
                  alt={adCreative.brandName}
                  className="w-8 h-8 rounded-full object-cover border border-white/30"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border border-white/30"
                  style={{ fontSize: `${scale * 11}px` }}
                >
                  {brandInitial}
                </div>
              )}
            </div>
            <span className="text-white font-semibold truncate" style={{ fontSize: `${scale * 13}px` }}>
              {brandHandle}
            </span>
            <span className="text-white/50 text-[10px]">·</span>
            <span className="text-white/60" style={{ fontSize: `${scale * 11}px` }}>Sponsored</span>
            <button
              className="ml-1 px-2.5 py-0.5 border border-white/40 rounded text-white font-semibold"
              style={{ fontSize: `${scale * 11}px` }}
            >
              Follow
            </button>
          </div>

          {/* Caption / primary text */}
          {(adCreative.headline || adCreative.primaryText) && (
            <div className="pr-2">
              {adCreative.headline && (
                <p className="text-white font-semibold leading-snug drop-shadow" style={{ fontSize: `${scale * 13}px` }}>
                  {adCreative.headline}
                </p>
              )}
              {adCreative.primaryText && (
                <p className="text-white/90 leading-snug mt-0.5 drop-shadow line-clamp-2" style={{ fontSize: `${scale * 12}px` }}>
                  {adCreative.primaryText}
                </p>
              )}
            </div>
          )}

          {/* CTA button — full width, prominent */}
          <button
            onClick={onCtaClick}
            className="w-full py-2.5 rounded-lg bg-white hover:bg-gray-100 text-[#262626] font-semibold text-center transition-colors flex items-center justify-center gap-2 shadow-lg"
            style={{ fontSize: `${scale * 13}px` }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {adCreative.ctaText || "Send WhatsApp Message"}
          </button>

          {/* Audio track bar */}
          <div className="flex items-center gap-2">
            <Music className="w-3 h-3 text-white flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
              <span className="text-white/80 truncate" style={{ fontSize: `${scale * 11}px` }}>
                {brandHandle} · Original audio
              </span>
            </div>
            {/* Album art thumbnail */}
            <div className="w-6 h-6 rounded-md border border-white/20 overflow-hidden flex-shrink-0">
              {adCreative.brandLogoUrl ? (
                <img src={adCreative.brandLogoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Music className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side: engagement icons (stacked vertically) */}
        <div className="flex flex-col items-center gap-4 pb-1 flex-shrink-0">
          {/* Like */}
          <button onClick={() => setLiked(!liked)} className="flex flex-col items-center gap-0.5">
            <Heart className={`w-7 h-7 ${liked ? "fill-red-500 text-red-500" : "text-white"}`} />
            <span className="text-white" style={{ fontSize: `${scale * 10}px` }}>
              {liked ? "12.4K" : "12.3K"}
            </span>
          </button>

          {/* Comment */}
          <button className="flex flex-col items-center gap-0.5">
            <MessageCircle className="w-7 h-7 text-white" />
            <span className="text-white" style={{ fontSize: `${scale * 10}px` }}>284</span>
          </button>

          {/* Share */}
          <button className="flex flex-col items-center gap-0.5">
            <Send className="w-6 h-6 text-white" />
            <span className="text-white" style={{ fontSize: `${scale * 10}px` }}>Share</span>
          </button>

          {/* Save */}
          <button onClick={() => setSaved(!saved)} className="flex flex-col items-center gap-0.5">
            <Bookmark className={`w-7 h-7 ${saved ? "fill-white text-white" : "text-white"}`} />
          </button>

          {/* More */}
          <button>
            <MoreHorizontal className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Play button overlay (centre of screen — in content safe zone) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
        <div className="w-16 h-16 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
          <svg className="w-8 h-8 text-white/90 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Video progress bar at very bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="h-[2px] bg-white/20">
          <div className="h-full bg-white rounded-full w-[35%]" />
        </div>
      </div>
    </div>
  );
}
