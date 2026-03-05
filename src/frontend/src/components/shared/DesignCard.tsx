import type { Design } from "../../backend.d";

interface DesignCardProps {
  design: Design;
  onClick?: (design: Design) => void;
  index?: number;
  selected?: boolean;
  compareMode?: boolean;
  onToggleCompare?: (id: bigint) => void;
}

export function DesignCard({
  design,
  onClick,
  index = 1,
  selected = false,
  compareMode = false,
  onToggleCompare,
}: DesignCardProps) {
  const firstImage = design.imageUrls?.[0] ?? "";
  const hasMultiple = (design.imageUrls?.length ?? 0) > 1;
  const imageCount = design.imageUrls?.length ?? 0;

  const handleClick = () => {
    if (compareMode && onToggleCompare) {
      onToggleCompare(design.id);
    } else if (onClick) {
      onClick(design);
    }
  };

  return (
    <button
      type="button"
      data-ocid={`design.card.${index}`}
      className={`group relative flex flex-col w-full overflow-hidden rounded-xl bg-white border transition-all duration-200 active:scale-[0.97] text-left ${
        selected
          ? "border-vew-sky shadow-[0_0_0_2px_var(--vew-sky)] border-2"
          : "border-border/60 shadow-card hover:shadow-card-hover"
      }`}
      onClick={handleClick}
      aria-label={`Design ${design.designCode}`}
      aria-pressed={compareMode ? selected : undefined}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-vew-sky-light/50">
        {firstImage ? (
          <img
            src={firstImage}
            alt={design.designCode}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            width={120}
            height={120}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              aria-label="No design image"
              role="img"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-vew-sky opacity-40"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        )}

        {/* Badges */}
        {design.isTrending && (
          <span className="absolute top-1 left-1 bg-vew-sky text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-tight">
            🔥
          </span>
        )}
        {design.isBridal && (
          <span className="absolute top-1 right-1 bg-pink-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-tight">
            👰
          </span>
        )}

        {/* Multi-image indicator */}
        {hasMultiple && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {Array.from({ length: Math.min(imageCount, 4) }, (_, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: dot indicators are purely positional decorations
                key={i}
                className={`w-1 h-1 rounded-full ${i === 0 ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}

        {/* Compare mode checkmark overlay */}
        {compareMode && selected && (
          <div className="absolute inset-0 bg-vew-sky/20 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-vew-sky flex items-center justify-center shadow-md">
              <svg
                aria-label="Selected for compare"
                role="img"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-1.5 py-1.5 flex-1">
        <p className="text-[10px] font-bold text-vew-navy line-clamp-1 leading-tight">
          {design.designCode}
        </p>
        <p className="text-[9px] text-muted-foreground line-clamp-1 mt-0.5 leading-tight">
          {design.category}
        </p>
      </div>
    </button>
  );
}

// Skeleton loader for design card
export function DesignCardSkeleton() {
  return (
    <div className="flex flex-col w-full overflow-hidden rounded-xl bg-white border border-border/60 shadow-card">
      <div className="aspect-square w-full bg-gradient-to-r from-muted via-accent to-muted animate-shimmer bg-[length:200%_100%]" />
      <div className="px-1.5 py-1.5">
        <div className="h-2.5 bg-muted rounded animate-pulse mb-1 w-3/4" />
        <div className="h-2 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}
