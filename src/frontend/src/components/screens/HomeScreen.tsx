import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { Design } from "../../backend.d";
import {
  useAllDesigns,
  useBridalDesigns,
  useTrendingDesigns,
} from "../../hooks/useQueries";
import { getRecentlyViewed } from "../../lib/recentlyViewed";
import {
  SAMPLE_DESIGNS,
  getSampleBridal,
  getSampleNew,
  getSampleTrending,
} from "../../lib/sampleData";
import { DesignCard } from "../shared/DesignCard";

interface HomeScreenProps {
  onDesignClick: (design: Design) => void;
}

interface SectionProps {
  title: string;
  kannada: string;
  designs: Design[];
  isLoading: boolean;
  onDesignClick: (design: Design) => void;
  onSeeAll?: () => void;
}

function HorizontalSection({
  title,
  kannada,
  designs,
  isLoading,
  onDesignClick,
  onSeeAll,
}: SectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isLoading && designs.length === 0) return null;

  return (
    <section className="mb-5">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <h2 className="text-sm font-bold text-vew-navy">{title}</h2>
          <p className="text-[10px] text-vew-sky">{kannada}</p>
        </div>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="flex items-center gap-0.5 text-vew-sky text-xs font-medium"
          >
            See All
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto scrollbar-hide pl-4 pr-4"
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              <div key={i} className="flex-shrink-0 w-28">
                <div className="aspect-square w-28 rounded-xl bg-muted animate-pulse" />
                <div className="h-2 bg-muted rounded mt-1.5 w-3/4 animate-pulse" />
                <div className="h-1.5 bg-muted rounded mt-1 w-1/2 animate-pulse" />
              </div>
            ))
          : designs.slice(0, 15).map((design, idx) => (
              <div key={design.id.toString()} className="flex-shrink-0 w-28">
                <DesignCard
                  design={design}
                  onClick={onDesignClick}
                  index={idx + 1}
                />
              </div>
            ))}
      </div>
    </section>
  );
}

export function HomeScreen({ onDesignClick }: HomeScreenProps) {
  const trendingQuery = useTrendingDesigns();
  const bridalQuery = useBridalDesigns();
  const allDesignsQuery = useAllDesigns();

  // Use backend data or fall back to sample data
  const trendingDesigns =
    trendingQuery.data && trendingQuery.data.length > 0
      ? trendingQuery.data
      : getSampleTrending();

  const bridalDesigns =
    bridalQuery.data && bridalQuery.data.length > 0
      ? bridalQuery.data
      : getSampleBridal();

  const allDesigns =
    allDesignsQuery.data && allDesignsQuery.data.length > 0
      ? allDesignsQuery.data
      : SAMPLE_DESIGNS;

  const newDesigns = allDesigns
    .slice()
    .sort((a, b) => Number(b.createdAt - a.createdAt))
    .slice(0, 15);

  // Recently viewed
  const recentIds = getRecentlyViewed();
  const recentDesigns = recentIds
    .map((id) => allDesigns.find((d) => d.id.toString() === id))
    .filter((d): d is Design => !!d)
    .slice(0, 10);

  const isLoadingTrending = trendingQuery.isLoading && !trendingQuery.data;
  const isLoadingBridal = bridalQuery.isLoading && !bridalQuery.data;
  const isLoadingAll = allDesignsQuery.isLoading && !allDesignsQuery.data;

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      {/* Hero Banner */}
      <div className="relative mx-4 mt-4 mb-5 rounded-2xl overflow-hidden bg-gradient-to-br from-vew-sky to-vew-sky-dark p-5">
        <div className="relative z-10">
          <p className="text-white/80 text-xs font-medium mb-1">
            Welcome to / ಸ್ವಾಗತ
          </p>
          <h1 className="text-white text-xl font-bold leading-tight mb-1">
            Vishal Embroidery
          </h1>
          <p className="text-white/90 text-sm">ವಿಶಾಲ್ ಎಂಬ್ರಾಯ್ಡರಿ ವರ್ಕ್ಸ್</p>
          <p className="text-white/70 text-xs mt-2">
            Discover 500+ exclusive designs
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute right-10 top-2 w-12 h-12 rounded-full bg-white/10" />
      </div>

      {/* Sections */}
      <HorizontalSection
        title="Trending Designs"
        kannada="ಟ್ರೆಂಡಿಂಗ್ ಡಿಸೈನ್ಸ್"
        designs={trendingDesigns}
        isLoading={isLoadingTrending}
        onDesignClick={onDesignClick}
      />

      <HorizontalSection
        title="New Designs"
        kannada="ಹೊಸ ಡಿಸೈನ್ಸ್"
        designs={newDesigns}
        isLoading={isLoadingAll}
        onDesignClick={onDesignClick}
      />

      <HorizontalSection
        title="Bridal Designs"
        kannada="ಮದುವೆ ಡಿಸೈನ್ಸ್"
        designs={bridalDesigns}
        isLoading={isLoadingBridal}
        onDesignClick={onDesignClick}
      />

      {recentDesigns.length > 0 && (
        <HorizontalSection
          title="Recently Viewed"
          kannada="ಇತ್ತೀಚೆಗೆ ನೋಡಿದ"
          designs={recentDesigns}
          isLoading={false}
          onDesignClick={onDesignClick}
        />
      )}
    </div>
  );
}
