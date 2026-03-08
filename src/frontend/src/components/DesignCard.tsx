import type { Design } from "../lib/storage";

interface DesignCardProps {
  design: Design;
  onClick: () => void;
  /** Use wide (16:9) aspect ratio with object-contain — for embroidery subcategory */
  useWideRatio?: boolean;
}

export function DesignCard({
  design,
  onClick,
  useWideRatio = false,
}: DesignCardProps) {
  const firstImage = design.images[0];
  const aspectPadding = useWideRatio ? "56.25%" : "100%";

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
              className={`w-full h-full ${useWideRatio ? "object-contain bg-muted" : "object-cover"}`}
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
