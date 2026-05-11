import { useState, useCallback } from "react";
import type { AdCreative, AdPlacement, AdFormat, AdCarouselCard } from "@shared/types";
import { AD_PLACEMENTS, AD_FORMATS } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sparkles, Plus, Trash2, Image as ImageIcon, Monitor, Smartphone,
  Loader2, Upload, ExternalLink, Eye
} from "lucide-react";

interface AdEntryPointEditorProps {
  adCreative: AdCreative | null;
  onChange: (adCreative: AdCreative | null) => void;
  businessName: string;
  businessUrl: string;
  profileImageUrl: string | null;
  onGenerateAd?: () => void;
  isGenerating?: boolean;
  /** Crawled website images available for selection */
  crawledImages?: Array<{ url: string; name?: string }>;
  onUploadImage?: (base64: string, fileName: string, mimeType: string) => Promise<string>;
}

const DEFAULT_AD_CREATIVE: AdCreative = {
  enabled: true,
  placement: "facebook_feed",
  format: "single_image",
  headline: "",
  primaryText: "",
  ctaText: "Send WhatsApp Message",
  mediaUrl: "",
  brandName: "",
  brandLogoUrl: undefined,
};

export default function AdEntryPointEditor({
  adCreative,
  onChange,
  businessName,
  businessUrl,
  profileImageUrl,
  onGenerateAd,
  isGenerating = false,
  crawledImages = [],
  onUploadImage,
}: AdEntryPointEditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [pickingImageFor, setPickingImageFor] = useState<"main" | number>("main");

  const isEnabled = adCreative?.enabled ?? false;

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      onChange({
        ...DEFAULT_AD_CREATIVE,
        brandName: businessName || "Brand",
        brandLogoUrl: profileImageUrl || undefined,
        ...adCreative,
        enabled: true,
      });
    } else {
      onChange(adCreative ? { ...adCreative, enabled: false } : null);
    }
  };

  const update = useCallback((partial: Partial<AdCreative>) => {
    if (!adCreative) return;
    onChange({ ...adCreative, ...partial });
  }, [adCreative, onChange]);

  const addCarouselCard = () => {
    if (!adCreative) return;
    const cards = adCreative.carouselCards || [];
    if (cards.length >= 10) {
      toast.error("Maximum 10 carousel cards");
      return;
    }
    onChange({
      ...adCreative,
      carouselCards: [...cards, {
        id: `card-${Date.now()}`,
        imageUrl: "",
        headline: "",
        description: "",
      }],
    });
  };

  const updateCarouselCard = (index: number, partial: Partial<AdCarouselCard>) => {
    if (!adCreative?.carouselCards) return;
    const updated = adCreative.carouselCards.map((c, i) =>
      i === index ? { ...c, ...partial } : c
    );
    onChange({ ...adCreative, carouselCards: updated });
  };

  const removeCarouselCard = (index: number) => {
    if (!adCreative?.carouselCards) return;
    onChange({
      ...adCreative,
      carouselCards: adCreative.carouselCards.filter((_, i) => i !== index),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "main" | number) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImage) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const url = await onUploadImage(base64, file.name, file.type);
        if (target === "main") {
          update({ mediaUrl: url });
        } else {
          updateCarouselCard(target, { imageUrl: url });
        }
        toast.success("Image uploaded");
      } catch {
        toast.error("Upload failed");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Enable toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <Monitor className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">CTWA Ad Entry Point</p>
            <p className="text-[11px] text-muted-foreground">Start the demo from a Click-to-WhatsApp ad</p>
          </div>
        </div>
        <Switch checked={isEnabled} onCheckedChange={handleToggle} />
      </div>

      {isEnabled && adCreative && (
        <>
          {/* AI Generate button */}
          {onGenerateAd && (
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-gradient-to-r from-blue-500/10 to-green-500/10 border-blue-500/30 hover:border-blue-500/50"
              onClick={onGenerateAd}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Ad Creative...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Auto-Generate Ad Creative</>
              )}
            </Button>
          )}

          {/* Placement selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ad Placement</label>
            <div className="grid grid-cols-2 gap-2">
              {AD_PLACEMENTS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => update({ placement: p.value })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    adCreative.placement === p.value
                      ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold ${
                      p.value === "facebook_feed" ? "bg-[#1877F2]" :
                      p.value === "instagram_feed" ? "bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888]" :
                      p.value === "instagram_story" ? "bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#E1306C]" :
                      "bg-gradient-to-br from-[#405DE6] to-[#E1306C]"
                    }`}>
                      {p.value === "facebook_feed" ? "FB" : "IG"}
                    </div>
                    <div>
                      <p className="text-xs font-medium leading-tight">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground">{p.aspectRatio}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ad Format</label>
            <Select
              value={adCreative.format}
              onValueChange={(v) => update({ format: v as AdFormat })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AD_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand info */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Brand Name</label>
              <Input
                value={adCreative.brandName}
                onChange={(e) => update({ brandName: e.target.value })}
                placeholder="Brand name"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CTA Button</label>
              <Input
                value={adCreative.ctaText}
                onChange={(e) => update({ ctaText: e.target.value })}
                placeholder="Send WhatsApp Message"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Headline <span className="text-muted-foreground/50">({adCreative.headline.length}/40)</span>
            </label>
            <Input
              value={adCreative.headline}
              onChange={(e) => update({ headline: e.target.value.slice(0, 80) })}
              placeholder="Your compelling headline"
              className="h-8 text-xs"
            />
          </div>

          {/* Primary text */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Primary Text <span className="text-muted-foreground/50">({adCreative.primaryText.length}/125)</span>
            </label>
            <Textarea
              value={adCreative.primaryText}
              onChange={(e) => update({ primaryText: e.target.value.slice(0, 250) })}
              placeholder="Ad body copy..."
              className="text-xs min-h-[60px] resize-none"
              rows={2}
            />
          </div>

          {/* Media section */}
          {adCreative.format === "carousel" ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Carousel Cards ({(adCreative.carouselCards || []).length}/10)
                </label>
                <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={addCarouselCard}>
                  <Plus className="w-3 h-3 mr-1" /> Add Card
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {(adCreative.carouselCards || []).map((card, idx) => (
                  <div key={card.id} className="p-2 rounded border bg-muted/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[9px]">Card {idx + 1}</Badge>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => removeCarouselCard(idx)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                    {/* Card image */}
                    <div className="flex gap-2">
                      {card.imageUrl ? (
                        <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 group">
                          <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => updateCarouselCard(idx, { imageUrl: "" })}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => { setPickingImageFor(idx); setShowImagePicker(true); }}
                            className="w-16 h-16 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-muted-foreground/50 transition-colors"
                          >
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <Input
                          value={card.headline}
                          onChange={(e) => updateCarouselCard(idx, { headline: e.target.value })}
                          placeholder="Card headline"
                          className="h-7 text-[11px]"
                        />
                        <Input
                          value={card.description || ""}
                          onChange={(e) => updateCarouselCard(idx, { description: e.target.value })}
                          placeholder="Description (optional)"
                          className="h-7 text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Single image / video */
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ad Media</label>
              {adCreative.mediaUrl ? (
                <div className="relative rounded-lg overflow-hidden border group">
                  <img src={adCreative.mediaUrl} alt="Ad media" className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => { setPickingImageFor("main"); setShowImagePicker(true); }}
                    >
                      Change
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => update({ mediaUrl: "" })}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setPickingImageFor("main"); setShowImagePicker(true); }}
                    className="flex-1 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-muted-foreground/50 transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {crawledImages.length > 0 ? "Pick from crawled images" : "Upload image"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Image picker dialog */}
          {showImagePicker && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowImagePicker(false)}>
              <div className="bg-background rounded-xl shadow-2xl max-w-lg w-full max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-3 border-b flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Select Image</h4>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowImagePicker(false)}>
                    ×
                  </Button>
                </div>
                <div className="p-3 overflow-y-auto max-h-[55vh]">
                  {crawledImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {crawledImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (pickingImageFor === "main") {
                              update({ mediaUrl: img.url });
                            } else {
                              updateCarouselCard(pickingImageFor as number, { imageUrl: img.url });
                            }
                            setShowImagePicker(false);
                          }}
                          className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors"
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No crawled images available.</p>
                      <p className="text-[10px] mt-1">Provide a website URL and crawl it first, or upload an image.</p>
                    </div>
                  )}

                  {/* Upload option */}
                  <div className="mt-3 pt-3 border-t">
                    <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload from device</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          handleFileUpload(e, pickingImageFor);
                          setShowImagePicker(false);
                        }}
                      />
                    </label>
                  </div>

                  {/* URL input */}
                  <div className="mt-2">
                    <div className="flex gap-1.5">
                      <Input
                        placeholder="Or paste image URL..."
                        className="h-8 text-xs flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const url = (e.target as HTMLInputElement).value.trim();
                            if (url) {
                              if (pickingImageFor === "main") {
                                update({ mediaUrl: url });
                              } else {
                                updateCarouselCard(pickingImageFor as number, { imageUrl: url });
                              }
                              setShowImagePicker(false);
                            }
                          }
                        }}
                      />
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowImagePicker(false)}>
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
