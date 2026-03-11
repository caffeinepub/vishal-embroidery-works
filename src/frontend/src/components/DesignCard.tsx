import { SUBCATEGORY_LABELS } from "../lib/designCodes";
import { getOptimizedImageUrl } from "../lib/imageUtils";
import type { Design } from "../lib/storage";

interface DesignCardProps {
  design: Design;
  onClick: () => void;
  /**
   * "wide-contain"      — fixed 2.3:1 aspect ratio (1536×657) with object-contain, black bg. Used for all Embroidery and Blouse subcategories.
   * "embroidery-contain" — full-image contain with black background, auto height (legacy).
   * "wide"              — 16:9 aspect ratio with object-contain (legacy, kept for safety).
   * undefined/false     — default square object-cover layout.
   */
  imageMode?: "wide-contain" | "embroidery-contain" | "wide" | false;
  /** @deprecated use imageMode="wide" */
  useWideRatio?: boolean;
  onViewDesign?: () => void;
  onAddToTrialRoom?: () => void;
}

export function DesignCard({
  design,
  onClick,
  imageMode,
  useWideRatio = false,
  onViewDesign,
  onAddToTrialRoom,
}: DesignCardProps) {
  const firstImage = design.images[0];

  // Resolve effective mode
  const effectiveMode = imageMode ?? (useWideRatio ? "wide" : false);
  const isWideContain = effectiveMode === "wide-contain";
  const isEmbroideryContain = effectiveMode === "embroidery-contain";
  const isWide = effectiveMode === "wide";

  // Subcategory label for embroidery-contain bottom section
  const subcategoryLabel =
    SUBCATEGORY_LABELS[design.subcategory as keyof typeof SUBCATEGORY_LABELS] ??
    design.subcategory;

  // Action buttons row (shared across all variants)
  const actionButtons =
    onViewDesign || onAddToTrialRoom ? (
      <div className="px-2 pb-2 flex gap-1.5">
        {onViewDesign && (
          <button
            type="button"
            data-ocid="design.view_design.button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDesign();
            }}
            className="flex-1 text-[11px] font-semibold py-1 px-2 rounded-lg border border-primary text-primary bg-transparent hover:bg-primary/10 transition-colors"
          >
            View Design
          </button>
        )}
        {onAddToTrialRoom && (
          <button
            type="button"
            data-ocid="design.add_trial_room.button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToTrialRoom();
            }}
            className="flex-1 text-[11px] font-semibold py-1 px-2 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors"
          >
            Add to Stitching Order
          </button>
        )}
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
        {/* Fixed 2.3:1 aspect ratio image box (657/1536 = 42.77%) */}
        <div className="relative w-full" style={{ paddingBottom: "42.77%" }}>
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            {firstImage ? (
              <img
                src={getOptimizedImageUrl(firstImage, 800)}
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
          {/* Multi-image indicator */}
          {design.images.length > 1 && (
            <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded-full z-10">
              1/{design.images.length}
            </div>
          )}
          {/* 👑 Bridal crown icon */}
          {design.isBridal && (
            <div className="absolute top-1.5 left-1.5 w-6 h-6 flex items-center justify-center bg-yellow-400/90 rounded-full shadow-sm z-10">
              <span className="text-[11px] leading-none">👑</span>
            </div>
          )}
        </div>

        {/* Bottom info section */}
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

        {actionButtons}
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
        {/* Full wide image — no fixed aspect ratio, height auto */}
        <div className="relative w-full bg-black">
          {firstImage ? (
            <img
              src={getOptimizedImageUrl(firstImage, 800)}
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

        {/* Info section below image */}
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

        {actionButtons}
      </button>
    );
  }

  if (isWide) {
    // 16:9 wide layout (legacy)
    return (
      <button
        type="button"
        data-ocid="design.card"
        onClick={onClick}
        className="group relative w-full text-left rounded-xl overflow-hidden bg-card shadow-card hover:shadow-card-hover transition-all active:scale-98 animate-fade-in"
      >
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            {firstImage ? (
              <img
                src={getOptimizedImageUrl(firstImage, 800)}
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
        {actionButtons}
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
        {firstImage ? (
          <img
            src={getOptimizedImageUrl(firstImage, 400)}
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
      {actionButtons}
    </button>
  );
}
