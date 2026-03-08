import { SUBCATEGORY_LABELS } from "../lib/designCodes";
import type { Design } from "../lib/storage";

interface DesignCardProps {
  design: Design;
  onClick: () => void;
  /**
   * "embroidery-contain" — full-image contain with black background, for Embroidery subcategory only.
   * "wide"              — 16:9 aspect ratio with object-contain (legacy, kept for safety).
   * undefined/false     — default square object-cover layout.
   */
  imageMode?: "embroidery-contain" | "wide" | false;
  /** @deprecated use imageMode="wide" */
  useWideRatio?: boolean;
}

export function DesignCard({
  design,
  onClick,
  imageMode,
  useWideRatio = false,
}: DesignCardProps) {
  const firstImage = design.images[0];

  // Resolve effective mode
  const effectiveMode = imageMode ?? (useWideRatio ? "wide" : false);
  const isEmbroideryContain = effectiveMode === "embroidery-contain";
  const isWide = effectiveMode === "wide";

  // Subcategory label for embroidery-contain bottom section
  const subcategoryLabel =
    SUBCATEGORY_LABELS[design.subcategory as keyof typeof SUBCATEGORY_LABELS] ??
    design.subcategory;

  if (isEmbroideryContain) {
    // --- Embroidery-contain layout ---
    // Top: full image, contain, black bg, auto-height
    // Bottom: design code + title + category
    return (
      <button
        type="button"
        data-ocid="design.card"
        onClick={onClick}
        className="group w-full text-left rounded-xl overflow-hidden bg-black shadow-card hover:shadow-card-hover transition-all active:scale-98 animate-fade-in"
      >
        {/* Image — contain, auto height, black bg */}
        <div className="w-full flex items-center justify-center bg-black">
          {firstImage ? (
            <img
              src={firstImage}
              alt={design.title}
              className="w-full h-auto object-contain"
              style={{ display: "block", objectPosition: "center" }}
              loading="lazy"
            />
          ) : (
            <div className="w-full flex items-center justify-center py-8 bg-black">
              <span className="text-3xl">🧵</span>
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
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {subcategoryLabel}
          </p>
        </div>

        {/* Multi-image indicator */}
        {design.images.length > 1 && (
          <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded-full">
            1/{design.images.length}
          </div>
        )}
        {/* 👑 Bridal crown icon */}
        {design.isBridal && (
          <div className="absolute top-1.5 left-1.5 w-6 h-6 flex items-center justify-center bg-yellow-400/90 rounded-full shadow-sm">
            <span className="text-[11px] leading-none">👑</span>
          </div>
        )}
      </button>
    );
  }

  // --- Standard layout (square or wide) ---
  const aspectPadding = isWide ? "56.25%" : "100%";

  return (
    <button
      type="button"
      data-ocid="design.card"
      onClick={onClick}
      className="group w-full text-left rounded-xl overflow-hidden bg-card shadow-card hover:shadow-card-hover transition-all active:scale-98 animate-fade-in"
    >
      {/* Thumbnail */}
      <div className="relative w-full" style={{ paddingBottom: aspectPadding }}>
        <div className="absolute inset-0">
          {firstImage ? (
            <img
              src={firstImage}
              alt={design.title}
              className={`w-full h-full ${isWide ? "object-contain bg-muted" : "object-cover"}`}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-3xl">🧵</span>
            </div>
          )}
          {/* Code overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
            <span className="text-white text-[10px] font-bold tracking-wide">
              {design.designCode}
            </span>
          </div>
          {/* Multi-image indicator */}
          {design.images.length > 1 && (
            <div className="absolute top-1.5 right-1.5 bg-black/50 text-white text-[9px] px-1 py-0.5 rounded-full">
              1/{design.images.length}
            </div>
          )}
          {/* 👑 Bridal crown icon */}
          {design.isBridal && (
            <div className="absolute top-1.5 left-1.5 w-6 h-6 flex items-center justify-center bg-yellow-400/90 rounded-full shadow-sm">
              <span className="text-[11px] leading-none">👑</span>
            </div>
          )}
        </div>
      </div>
      {/* Title */}
      <div className="px-2 py-1.5">
        <p className="text-xs font-medium text-foreground line-clamp-1">
          {design.title}
        </p>
      </div>
    </button>
  );
}
