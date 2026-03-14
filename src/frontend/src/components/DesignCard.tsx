import { Share2, ShoppingBag } from "lucide-react";
import { SUBCATEGORY_LABELS } from "../lib/designCodes";
import { getOptimizedImageUrl } from "../lib/imageUtils";
import type { Design } from "../lib/storage";

interface DesignCardProps {
  design: Design;
  onClick: () => void;
  /**
   * "wide-contain"      — fixed 2.3:1 aspect ratio (1536×657) with object-contain, black bg.
   * "embroidery-contain" — full-image contain with black background, auto height (legacy).
   * "wide"              — 16:9 aspect ratio with object-contain (legacy).
   * undefined/false     — default square object-cover layout.
   */
  imageMode?: "wide-contain" | "embroidery-contain" | "wide" | false;
  /** @deprecated use imageMode="wide" */
  useWideRatio?: boolean;
  /** When true, shows Add to Stitching and Share action buttons below card info */
  showActions?: boolean;
  onAddToStitching?: () => void;
  onShare?: () => void;
}

export function DesignCard({
  design,
  onClick,
  imageMode,
  useWideRatio = false,
  showActions = false,
  onAddToStitching,
  onShare,
}: DesignCardProps) {
  const firstImage = design.images[0];
  // Prefer generatedImages.frontImage for display when available
  const displayImage = design.generatedImages?.frontImage || firstImage;

  const effectiveMode = imageMode ?? (useWideRatio ? "wide" : false);
  const isWideContain = effectiveMode === "wide-contain";
  const isEmbroideryContain = effectiveMode === "embroidery-contain";
  const isWide = effectiveMode === "wide";

  const subcategoryLabel =
    SUBCATEGORY_LABELS[design.subcategory as keyof typeof SUBCATEGORY_LABELS] ??
    design.subcategory;

  const ActionButtons = showActions ? (
    <div className="flex gap-1.5 mt-2 px-2 pb-2">
      <button
        type="button"
        data-ocid="design.stitching.primary_button"
        onClick={(e) => {
          e.stopPropagation();
          onAddToStitching?.();
        }}
        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold active:scale-95 transition-transform"
      >
        <ShoppingBag size={10} />
        Add to Stitching
      </button>
      <button
        type="button"
        data-ocid="design.share.secondary_button"
        onClick={(e) => {
          e.stopPropagation();
          onShare?.();
        }}
        className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-muted text-muted-foreground text-[10px] font-semibold active:scale-95 transition-transform"
      >
        <Share2 size={10} />
        Share
      </button>
    </div>
  ) : null;

  if (isWideContain) {
    return (
      <button
        type="button"
        data-ocid="design.card"
        onClick={onClick}
        className="group relative w-full text-left rounded-xl overflow-hidden bg-card shadow-card hover:shadow-card-hover transition-all active:scale-98 animate-fade-in"
      >
        <div className="relative w-full" style={{ paddingBottom: "42.77%" }}>
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            {displayImage ? (
              <img
                src={getOptimizedImageUrl(displayImage, 800)}
                alt={design.title}
                className="w-full h-full object-contain"
                style={{ objectPosition: "center" }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <span className="text-3xl">🧵</span>
              </div>
            )}
          </div>
          {design.images.length > 1 && (
            <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded-full z-10">
              1/{design.images.length}
            </div>
          )}
          {design.isBridal && (
            <div className="absolute top-1.5 left-1.5 w-6 h-6 flex items-center justify-center bg-yellow-400/90 rounded-full shadow-sm z-10">
              <span className="text-[11px] leading-none">👑</span>
            </div>
          )}
          {design.generatedImages?.frontImage && (
            <div className="absolute bottom-1.5 left-1.5 bg-primary/80 text-primary-foreground text-[8px] px-1.5 py-0.5 rounded-full z-10 font-semibold">
              AI Preview
            </div>
          )}
        </div>
        <div className="bg-card px-2 py-2">
          <p className="text-[10px] font-bold text-primary tracking-wide">
            {design.designCode}
          </p>
          <p className="text-xs font-medium text-foreground line-clamp-1 mt-0.5">
            {design.title}
          </p>
          {design.price != null ? (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              ₹{design.price}
            </p>
          ) : null}
        </div>
        {ActionButtons}
      </button>
    );
  }

  if (isEmbroideryContain) {
    return (
      <button
        type="button"
        data-ocid="design.card"
        onClick={onClick}
        className="group relative w-full text-left rounded-xl overflow-hidden bg-card shadow-card hover:shadow-card-hover transition-all active:scale-98 animate-fade-in"
      >
        <div className="relative w-full bg-black">
          {displayImage ? (
            <img
              src={getOptimizedImageUrl(displayImage, 800)}
              alt={design.title}
              className="w-full h-auto object-contain"
              style={{ objectPosition: "center" }}
              loading="lazy"
            />
          ) : (
            <div className="h-24 flex items-center justify-center">
              <span className="text-3xl">🧵</span>
            </div>
          )}
          {design.images.length > 1 && (
            <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded-full z-10">
              1/{design.images.length}
            </div>
          )}
          {design.isBridal && (
            <div className="absolute top-1.5 left-1.5 w-6 h-6 flex items-center justify-center bg-yellow-400/90 rounded-full shadow-sm z-10">
              <span className="text-[11px] leading-none">👑</span>
            </div>
          )}
        </div>
        <div className="bg-card px-2 py-2">
          <p className="text-[10px] font-bold text-primary tracking-wide">
            {design.designCode}
          </p>
          <p className="text-xs font-medium text-foreground line-clamp-1 mt-0.5">
            {design.title}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {subcategoryLabel}
          </p>
        </div>
        {ActionButtons}
      </button>
    );
  }

  if (isWide) {
    return (
      <button
        type="button"
        data-ocid="design.card"
        onClick={onClick}
        className="group relative w-full text-left rounded-xl overflow-hidden bg-card shadow-card hover:shadow-card-hover transition-all active:scale-98 animate-fade-in"
      >
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            {displayImage ? (
              <img
                src={getOptimizedImageUrl(displayImage, 800)}
                alt={design.title}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-3xl">🧵</span>
              </div>
            )}
          </div>
          {design.images.length > 1 && (
            <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded-full z-10">
              1/{design.images.length}
            </div>
          )}
          {design.isBridal && (
            <div className="absolute top-1.5 left-1.5 w-6 h-6 flex items-center justify-center bg-yellow-400/90 rounded-full shadow-sm z-10">
              <span className="text-[11px] leading-none">👑</span>
            </div>
          )}
        </div>
        <div className="bg-card px-2 py-2">
          <p className="text-[10px] font-bold text-primary tracking-wide">
            {design.designCode}
          </p>
          <p className="text-xs font-medium text-foreground line-clamp-1 mt-0.5">
            {design.title}
          </p>
        </div>
        {ActionButtons}
      </button>
    );
  }

  // Default: square layout
  return (
    <button
      type="button"
      data-ocid="design.card"
      onClick={onClick}
      className="group relative w-full text-left rounded-xl overflow-hidden bg-card shadow-card hover:shadow-card-hover transition-all active:scale-98 animate-fade-in"
    >
      <div className="relative aspect-square bg-muted">
        {displayImage ? (
          <img
            src={getOptimizedImageUrl(displayImage, 400)}
            alt={design.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl">🧵</span>
          </div>
        )}
        {design.images.length > 1 && (
          <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded-full">
            1/{design.images.length}
          </div>
        )}
        {design.isBridal && (
          <div className="absolute top-1.5 left-1.5 w-6 h-6 flex items-center justify-center bg-yellow-400/90 rounded-full shadow-sm">
            <span className="text-[11px] leading-none">👑</span>
          </div>
        )}
      </div>
      <div className="bg-card px-2 py-2">
        <p className="text-[10px] font-bold text-primary tracking-wide">
          {design.designCode}
        </p>
        <p className="text-xs font-medium text-foreground line-clamp-1 mt-0.5">
          {design.title}
        </p>
        {design.price != null ? (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            ₹{design.price}
          </p>
        ) : null}
      </div>
      {ActionButtons}
    </button>
  );
}
