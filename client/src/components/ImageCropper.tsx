import { useState, useCallback, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Crop, ZoomIn, ZoomOut, RotateCw, Maximize2, Loader2 } from "lucide-react";

interface AspectPreset {
  label: string;
  value: number;
  description: string;
}

const ASPECT_PRESETS: AspectPreset[] = [
  { label: "16:9", value: 16 / 9, description: "Header Image" },
  { label: "1:1", value: 1, description: "Carousel Card" },
  { label: "4:3", value: 4 / 3, description: "Standard" },
  { label: "Free", value: 0, description: "Freeform" },
];

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedBlob: Blob) => void;
  defaultAspect?: number;
  title?: string;
}

/**
 * Convert a remote URL to a proxied URL that bypasses CORS.
 * The server-side /api/image-proxy endpoint fetches the image
 * and returns it with proper CORS headers.
 */
function getProxiedUrl(url: string): string {
  if (!url || url.startsWith("blob:") || url.startsWith("data:")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/**
 * Load an image element from a URL.
 * Uses the server-side proxy for remote URLs to avoid CORS issues.
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Failed to load image for cropping"))
    );
    // Use crossOrigin for proxied URLs to allow canvas operations
    image.crossOrigin = "anonymous";
    image.src = getProxiedUrl(url);
  });
}

/**
 * Crop the image on a canvas and return a Blob.
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = getRotatedBoundingBox(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d")!;

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      },
      "image/jpeg",
      0.92
    );
  });
}

function getRotatedBoundingBox(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export default function ImageCropper({
  open,
  onClose,
  imageUrl,
  onCropComplete,
  defaultAspect = 16 / 9,
  title = "Crop Image",
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(defaultAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);

  // Use proxied URL for the Cropper display to ensure it loads
  const proxiedImageUrl = getProxiedUrl(imageUrl);

  // Reset state when dialog opens with new image
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setAspect(defaultAspect);
      setCroppedAreaPixels(null);
      setCropError(null);
    }
    prevOpenRef.current = open;
  }, [open, defaultAspect]);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((z: number) => {
    setZoom(z);
  }, []);

  const handleCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      setCropError("Please adjust the crop area before applying.");
      return;
    }
    setIsSaving(true);
    setCropError(null);
    try {
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels, rotation);
      onCropComplete(croppedBlob);
      onClose();
    } catch (e) {
      console.error("[ImageCropper] Failed to crop image:", e);
      setCropError("Failed to crop image. Please try uploading a new image instead.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Crop className="w-4 h-4 text-emerald-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Cropper area */}
        <div className="relative w-full h-[350px] bg-black/90">
          <Cropper
            image={proxiedImageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect || undefined}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={handleCropComplete}
            cropShape="rect"
            showGrid={true}
            mediaProps={{ crossOrigin: "anonymous" }}
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: "2px solid #25D366",
                borderRadius: "4px",
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="px-4 py-3 space-y-3 border-t bg-muted/30">
          {/* Aspect ratio presets */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-medium w-12 shrink-0">Ratio</span>
            <div className="flex gap-1.5 flex-wrap">
              {ASPECT_PRESETS.map((preset) => (
                <Badge
                  key={preset.label}
                  variant={
                    (preset.value === 0 && aspect === 0) ||
                    (preset.value !== 0 && Math.abs(aspect - preset.value) < 0.01)
                      ? "default"
                      : "outline"
                  }
                  className={`cursor-pointer text-[10px] px-2 py-0.5 transition-colors ${
                    (preset.value === 0 && aspect === 0) ||
                    (preset.value !== 0 && Math.abs(aspect - preset.value) < 0.01)
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setAspect(preset.value)}
                >
                  {preset.label}
                  <span className="ml-1 opacity-70">{preset.description}</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-medium w-12 shrink-0">
              <ZoomOut className="w-3 h-3 inline" />
            </span>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={(v) => setZoom(v[0])}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground font-medium w-8">
              <ZoomIn className="w-3 h-3 inline" /> {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotation slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-medium w-12 shrink-0">
              <RotateCw className="w-3 h-3 inline" />
            </span>
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={(v) => setRotation(v[0])}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground font-medium w-8">
              {rotation}°
            </span>
          </div>

          {/* Error message */}
          {cropError && (
            <div className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
              {cropError}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleReset}
              >
                <Maximize2 className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Cropping...</>
                ) : (
                  <><Crop className="w-3 h-3 mr-1" />Apply Crop</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
