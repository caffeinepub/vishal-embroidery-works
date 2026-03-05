import { ChevronUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Design } from "../../backend.d";
import { DesignCard, DesignCardSkeleton } from "./DesignCard";

const PAGE_SIZE = 50;

interface DesignGridProps {
  designs: Design[];
  isLoading: boolean;
  onDesignClick?: (design: Design) => void;
  emptyMessage?: string;
  emptyKannada?: string;
  compareMode?: boolean;
  selectedForCompare?: bigint[];
  onToggleCompare?: (id: bigint) => void;
}

export function DesignGrid({
  designs,
  isLoading,
  onDesignClick,
  emptyMessage = "No designs found",
  emptyKannada = "ಯಾವುದೇ ಡಿಸೈನ್ ಕಂಡುಬಂದಿಲ್ಲ",
  compareMode = false,
  selectedForCompare = [],
  onToggleCompare,
}: DesignGridProps) {
  const [page, setPage] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const visibleDesigns = designs.slice(0, page * PAGE_SIZE);
  const hasMore = visibleDesigns.length < designs.length;

  // Reset page when designs change
  // biome-ignore lint/correctness/useExhaustiveDependencies: designs.length is the intentional trigger
  useEffect(() => {
    setPage(1);
  }, [designs.length]);

  // Scroll detection for back-to-top
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore) {
        setPage((p) => p + 1);
      }
    },
    [hasMore],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "100px",
    });
    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [handleObserver]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div
        data-ocid="design.loading_state"
        className="grid grid-cols-3 gap-2 p-3"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no identity
          <DesignCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!isLoading && designs.length === 0) {
    return (
      <div
        data-ocid="design.empty_state"
        className="flex flex-col items-center justify-center py-16 px-6"
      >
        <div className="w-16 h-16 rounded-full bg-vew-sky-light flex items-center justify-center mb-4">
          <svg
            aria-label="No designs"
            role="img"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-vew-sky"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-foreground text-center">
          {emptyMessage}
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          {emptyKannada}
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="grid grid-cols-3 gap-2 p-3">
        {visibleDesigns.map((design, idx) => (
          <DesignCard
            key={design.id.toString()}
            design={design}
            onClick={compareMode ? undefined : onDesignClick}
            index={idx + 1}
            compareMode={compareMode}
            selected={selectedForCompare.includes(design.id)}
            onToggleCompare={onToggleCompare}
          />
        ))}
      </div>

      {/* Load More Sentinel */}
      {hasMore && (
        <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-vew-sky animate-bounce [animation-delay:0ms]" />
            <div className="w-1.5 h-1.5 rounded-full bg-vew-sky animate-bounce [animation-delay:150ms]" />
            <div className="w-1.5 h-1.5 rounded-full bg-vew-sky animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          data-ocid="back_to_top.button"
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-50 w-10 h-10 rounded-full bg-vew-sky text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 animate-scale-in"
          aria-label="Back to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
