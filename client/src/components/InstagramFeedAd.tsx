import { useState } from "react";
import type { AdCreative } from "@shared/types";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";

interface InstagramFeedAdProps {
  adCreative: AdCreative;
  onCtaClick?: () => void;
  className?: string;
  scale?: number;
}

/** WhatsApp icon SVG */
const WhatsAppIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/**
 * Pixel-accurate Instagram Feed ad mockup for CTWA ads.
 * CTA uses a full-width green WhatsApp-branded bar between image and action icons,
 * matching real-world CTWA ad examples from Meta.
 */
export default function InstagramFeedAd({ adCreative, onCtaClick, className = "", scale = 1 }: InstagramFeedAdProps) {
  const [imageError, setImageError] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const brandInitial = (adCreative.brandName || "B").charAt(0).toUpperCase();
  const cards = adCreative.carouselCards || [];
  const isCarousel = adCreative.format === "carousel" && cards.length > 0;
  const brandHandle = (adCreative.brandName || "brand").toLowerCase().replace(/\s+/g, '');

  return (
    <div
      className={`bg-white flex flex-col w-full ${className}`}
      style={{ fontSize: `${scale * 14}px`, lineHeight: `${scale * 1.4}em` }}
    >
      {/* Instagram chrome - top bar */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <svg viewBox="0 0 120 35" className="h-7" fill="currentColor">
            <text x="0" y="28" fontFamily="system-ui, -apple-system, sans-serif" fontSize="26" fontWeight="400" fontStyle="italic" letterSpacing="-1">Instagram</text>
          </svg>
        </div>
        <div className="flex items-center gap-4">
          <Heart className="w-6 h-6" />
          <Send className="w-6 h-6" />
        </div>
      </div>

      {/* Post */}
      <div className="bg-white">
        {/* Post header */}
        <div className="px-3 py-2 flex items-center gap-2.5">
          <div className="flex-shrink-0">
            {/* Instagram gradient ring around avatar */}
            <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#dc2743]">
              <div className="w-full h-full rounded-full bg-white p-[1.5px]">
                {adCreative.brandLogoUrl ? (
                  <img
                    src={adCreative.brandLogoUrl}
                    alt={adCreative.brandName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold" style={{ fontSize: `${scale * 12}px` }}>
                    {brandInitial}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#262626] truncate" style={{ fontSize: `${scale * 13}px` }}>
                {brandHandle}
              </span>
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill="#3897f0">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.65 6.35l-4 4a.5.5 0 01-.7 0l-2-2a.5.5 0 01.7-.7L7.3 9.3l3.65-3.65a.5.5 0 01.7.7z" />
              </svg>
            </div>
            <span className="text-gray-500" style={{ fontSize: `${scale * 11}px` }}>Sponsored</span>
          </div>
          <button className="p-1 text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Media section */}
        {isCarousel ? (
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
              >
                {cards.map((card) => (
                  <div key={card.id} className="w-full flex-shrink-0">
                    <div className="aspect-square bg-gray-100 relative">
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.headline}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Carousel arrows */}
            {carouselIndex > 0 && (
              <button
                onClick={() => setCarouselIndex(i => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center"
              >
                <svg className="w-3.5 h-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {carouselIndex < cards.length - 1 && (
              <button
                onClick={() => setCarouselIndex(i => Math.min(cards.length - 1, i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center"
              >
                <svg className="w-3.5 h-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {/* Carousel indicator dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {cards.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === carouselIndex ? 'bg-[#3897f0]' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Single image — 1:1 */
          <div className="aspect-square bg-gray-100 relative">
            {adCreative.mediaUrl && !imageError ? (
              <img
                src={adCreative.mediaUrl}
                alt={adCreative.headline}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* CTWA CTA bar — green WhatsApp-branded, full-width between image and action icons */}
        <button
          onClick={onCtaClick}
          className="w-full px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-center transition-colors flex items-center justify-center gap-2"
          style={{ fontSize: `${scale * 14}px` }}
        >
          <WhatsAppIcon size={scale * 18} color="white" />
          <span>{adCreative.ctaText || "Chat on WhatsApp"}</span>
        </button>

        {/* Engagement icons */}
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 text-[#262626] cursor-pointer" />
            <MessageCircle className="w-6 h-6 text-[#262626] cursor-pointer" />
            <Send className="w-6 h-6 text-[#262626] cursor-pointer" />
          </div>
          <Bookmark className="w-6 h-6 text-[#262626] cursor-pointer" />
        </div>

        {/* Likes count */}
        <div className="px-3 pb-1">
          <span className="font-semibold text-[#262626]" style={{ fontSize: `${scale * 13}px` }}>
            1,234 likes
          </span>
        </div>

        {/* Caption */}
        <div className="px-3 pb-2">
          <span className="font-semibold text-[#262626]" style={{ fontSize: `${scale * 13}px` }}>
            {brandHandle}
          </span>
          {" "}
          <span className="text-[#262626]" style={{ fontSize: `${scale * 13}px` }}>
            {adCreative.primaryText || ""}
          </span>
        </div>

        {/* Headline as first comment style */}
        {adCreative.headline && isCarousel && (
          <div className="px-3 pb-2">
            <span className="text-gray-500" style={{ fontSize: `${scale * 12}px` }}>
              {adCreative.headline}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
