import type { AdCreative } from "@shared/types";
import FacebookFeedAd from "./FacebookFeedAd";
import InstagramFeedAd from "./InstagramFeedAd";
import InstagramStoryAd from "./InstagramStoryAd";
import InstagramReelsAd from "./InstagramReelsAd";

interface AdMockupProps {
  adCreative: AdCreative;
  onCtaClick?: () => void;
  className?: string;
  /** Render inside a phone frame */
  showPhoneFrame?: boolean;
}

/**
 * Unified ad mockup wrapper.
 *
 * Aspect ratios enforced per Meta guidelines:
 *   Feed (FB + IG):   1:1 square image area (scrollable post)
 *   Story:            9:16 full-screen vertical
 *   Reels:            9:16 full-screen vertical
 *
 * The phone frame adapts its width/height to the placement so the
 * mockup looks natural inside the preview panel.
 */
export default function AdMockup({ adCreative, onCtaClick, className = "", showPhoneFrame = true }: AdMockupProps) {
  const isVerticalFullscreen =
    adCreative.placement === "instagram_story" || adCreative.placement === "instagram_reels";

  const renderAd = () => {
    switch (adCreative.placement) {
      case "facebook_feed":
        return <FacebookFeedAd adCreative={adCreative} onCtaClick={onCtaClick} />;
      case "instagram_feed":
        return <InstagramFeedAd adCreative={adCreative} onCtaClick={onCtaClick} />;
      case "instagram_story":
        return <InstagramStoryAd adCreative={adCreative} onCtaClick={onCtaClick} />;
      case "instagram_reels":
        return <InstagramReelsAd adCreative={adCreative} onCtaClick={onCtaClick} />;
      default:
        return <FacebookFeedAd adCreative={adCreative} onCtaClick={onCtaClick} />;
    }
  };

  if (!showPhoneFrame) {
    return <div className={className}>{renderAd()}</div>;
  }

  /*
   * Phone frame dimensions:
   *   9:16 placements (Story / Reels): 280 × 497 px  (9:16 ratio)
   *   Feed placements (FB / IG):       320 × 620 px  (scrollable post)
   */
  const frameWidth = isVerticalFullscreen ? 280 : 320;
  const frameMaxHeight = isVerticalFullscreen ? 520 : 620;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Phone frame */}
      <div
        className="relative bg-black rounded-[2.5rem] shadow-2xl overflow-hidden border-[3px] border-gray-800"
        style={{ width: `${frameWidth}px`, maxHeight: `${frameMaxHeight}px` }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[25px] bg-black rounded-b-2xl z-20" />

        {/* Screen content */}
        <div
          className="mt-[25px] overflow-y-auto overflow-x-hidden"
          style={{ maxHeight: `${frameMaxHeight - 30}px` }}
        >
          {renderAd()}
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-gray-600 rounded-full" />
      </div>
    </div>
  );
}
