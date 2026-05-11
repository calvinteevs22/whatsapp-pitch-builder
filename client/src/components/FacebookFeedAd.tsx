import { useState } from "react";
import type { AdCreative } from "@shared/types";
import { ThumbsUp, Share2, MoreHorizontal, Globe } from "lucide-react";

interface FacebookFeedAdProps {
  adCreative: AdCreative;
  onCtaClick?: () => void;
  className?: string;
  /** Scale factor for rendering inside phone frame */
  scale?: number;
}

/**
 * Pixel-accurate Facebook Feed ad mockup for CTWA ads.
 * CTA uses the green WhatsApp-branded "Send Message" button
 * matching real-world CTWA ad examples from Meta.
 */
export default function FacebookFeedAd({ adCreative, onCtaClick, className = "", scale = 1 }: FacebookFeedAdProps) {
  const [imageError, setImageError] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const brandInitial = (adCreative.brandName || "B").charAt(0).toUpperCase();

  // Carousel navigation
  const cards = adCreative.carouselCards || [];
  const isCarousel = adCreative.format === "carousel" && cards.length > 0;

  /** WhatsApp icon SVG used in CTA buttons */
  const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );

  return (
    <div
      className={`bg-white flex flex-col w-full ${className}`}
      style={{ fontSize: `${scale * 14}px`, lineHeight: `${scale * 1.4}em` }}
    >
      {/* Facebook chrome - top bar */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
          <span className="font-semibold text-[#1c1e21]" style={{ fontSize: `${scale * 16}px` }}>facebook</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600 fill-current">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600 fill-current">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Post card */}
      <div className="bg-white">
        {/* Post header - brand info */}
        <div className="px-3 pt-3 pb-2 flex items-start gap-2">
          <div className="flex-shrink-0">
            {adCreative.brandLogoUrl ? (
              <img
                src={adCreative.brandLogoUrl}
                alt={adCreative.brandName}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold" style={{ fontSize: `${scale * 16}px` }}>
                {brandInitial}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#1c1e21] truncate" style={{ fontSize: `${scale * 14}px` }}>
                {adCreative.brandName || "Brand"}
              </span>
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill="#1877F2">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.65 6.35l-4 4a.5.5 0 01-.7 0l-2-2a.5.5 0 01.7-.7L7.3 9.3l3.65-3.65a.5.5 0 01.7.7z" />
              </svg>
            </div>
            <div className="flex items-center gap-1 text-gray-500" style={{ fontSize: `${scale * 12}px` }}>
              <span>Sponsored</span>
              <span>·</span>
              <Globe className="w-3 h-3" />
            </div>
          </div>
          <button className="p-1 text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Primary text */}
        {adCreative.primaryText && (
          <div className="px-3 pb-2 text-[#1c1e21]" style={{ fontSize: `${scale * 14}px` }}>
            {adCreative.primaryText}
          </div>
        )}

        {/* Media section */}
        {isCarousel ? (
          <div className="relative">
            <div className="flex overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out w-full"
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
                    {/* Carousel card footer with green WhatsApp CTA */}
                    <div className="bg-gray-50 px-3 py-2 flex items-center justify-between border-t border-gray-200">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#1c1e21] truncate" style={{ fontSize: `${scale * 14}px` }}>{card.headline}</p>
                        {card.description && (
                          <p className="text-gray-500 truncate" style={{ fontSize: `${scale * 12}px` }}>{card.description}</p>
                        )}
                      </div>
                      <button
                        onClick={onCtaClick}
                        className="ml-2 flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] rounded text-white font-semibold transition-colors"
                        style={{ fontSize: `${scale * 12}px` }}
                      >
                        <WhatsAppIcon size={scale * 14} />
                        <span>Send Message</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Carousel navigation arrows */}
            {carouselIndex > 0 && (
              <button
                onClick={() => setCarouselIndex(i => Math.max(0, i - 1))}
                className="absolute left-2 top-1/3 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {carouselIndex < cards.length - 1 && (
              <button
                onClick={() => setCarouselIndex(i => Math.min(cards.length - 1, i + 1))}
                className="absolute right-2 top-1/3 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {/* Carousel dots */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1">
              {cards.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === carouselIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Single image — 1:1 per Meta Feed best practices */
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

        {/* Link preview card with green WhatsApp CTA (for single image) */}
        {!isCarousel && (
          <div className="bg-[#f0f2f5] px-3 py-2.5 flex items-center justify-between border-t border-gray-200">
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 uppercase tracking-wide" style={{ fontSize: `${scale * 11}px` }}>
                {adCreative.brandName || "brand"}.com
              </p>
              <p className="font-semibold text-[#1c1e21] truncate" style={{ fontSize: `${scale * 14}px` }}>
                {adCreative.headline || "Headline"}
              </p>
            </div>
            <button
              onClick={onCtaClick}
              className="ml-3 flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] rounded font-semibold text-white transition-colors"
              style={{ fontSize: `${scale * 13}px` }}
            >
              <WhatsAppIcon size={scale * 14} />
              <span>{adCreative.ctaText || "Send Message"}</span>
            </button>
          </div>
        )}

        {/* Engagement bar */}
        <div className="px-3 py-1.5 border-t border-gray-200">
          <div className="flex items-center justify-between text-gray-500" style={{ fontSize: `${scale * 13}px` }}>
            <button className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-gray-100 rounded transition-colors">
              <ThumbsUp className="w-4 h-4" />
              <span>Like</span>
            </button>
            <button className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-gray-100 rounded transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Comment</span>
            </button>
            <button className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-gray-100 rounded transition-colors">
              <WhatsAppIcon size={scale * 16} />
              <span>Send</span>
            </button>
            <button className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-gray-100 rounded transition-colors">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
