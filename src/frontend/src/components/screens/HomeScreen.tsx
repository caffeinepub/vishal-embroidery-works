import {
  ChevronRight,
  Heart,
  Phone,
  Scissors,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { type ElementType, useRef } from "react";
import type { Design } from "../../backend.d";
import {
  useAllDesigns,
  useBridalDesigns,
  useTrendingDesigns,
} from "../../hooks/useQueries";
import { getRecentlyViewed } from "../../lib/recentlyViewed";
import { getSampleBridal, getSampleTrending } from "../../lib/sampleData";
import { DesignCard } from "../shared/DesignCard";

type AppTab =
  | "home"
  | "embroidery"
  | "blouse"
  | "favourite"
  | "customers"
  | "contact"
  | "admin";

interface HomeScreenProps {
  onDesignClick: (design: Design) => void;
  onNavigate: (tab: AppTab) => void;
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
            See All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
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

const QUICK_SECTIONS: Array<{
  id: AppTab;
  label: string;
  kannada: string;
  icon: ElementType;
  color: string;
  iconColor: string;
}> = [
  {
    id: "embroidery",
    label: "Embroidery",
    kannada: "ಕಸೂತಿ",
    icon: Sparkles,
    color: "bg-vew-sky-light",
    iconColor: "text-vew-sky",
  },
  {
    id: "blouse",
    label: "Blouse",
    kannada: "ಬ್ಲೌಸ್",
    icon: Scissors,
    color: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    id: "customers",
    label: "Customers",
    kannada: "ಗ್ರಾಹಕರು",
    icon: Users,
    color: "bg-purple-50",
    iconColor: "text-purple-500",
  },
  {
    id: "admin",
    label: "Admin Panel",
    kannada: "ಅಡ್ಮಿನ್",
    icon: Shield,
    color: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: "contact",
    label: "Contact",
    kannada: "ಸಂಪರ್ಕ",
    icon: Phone,
    color: "bg-green-50",
    iconColor: "text-green-500",
  },
  {
    id: "favourite",
    label: "Favourites",
    kannada: "ಮೆಚ್ಚಿನ",
    icon: Heart,
    color: "bg-pink-50",
    iconColor: "text-pink-500",
  },
];

export function HomeScreen({ onDesignClick, onNavigate }: HomeScreenProps) {
  const trendingQuery = useTrendingDesigns();
  const bridalQuery = useBridalDesigns();
  const allDesignsQuery = useAllDesigns();

  const trendingDesigns =
    trendingQuery.data && trendingQuery.data.length > 0
      ? trendingQuery.data
      : getSampleTrending();

  const bridalDesigns =
    bridalQuery.data && bridalQuery.data.length > 0
      ? bridalQuery.data
      : getSampleBridal();

  const newDesigns = (allDesignsQuery.data ?? [])
    .slice()
    .sort((a, b) => Number(b.createdAt - a.createdAt))
    .slice(0, 15);

  const allDesigns = allDesignsQuery.data ?? [];

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
      <div className="relative mx-4 mt-4 mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-vew-sky to-vew-sky-dark p-5">
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
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute right-10 top-2 w-12 h-12 rounded-full bg-white/10" />
      </div>

      {/* Quick Access Section Cards */}
      <div className="px-4 mb-5">
        <h2 className="text-sm font-bold text-vew-navy mb-2">
          Quick Access / ತ್ವರಿತ ಪ್ರವೇಶ
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {QUICK_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                data-ocid={`home.${section.id}.card`}
                onClick={() => onNavigate(section.id)}
                className={`${section.color} rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 min-h-[76px] border border-white/80 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200`}
              >
                <div
                  className={`w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center ${section.iconColor}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-vew-navy text-center leading-tight">
                  {section.label}
                </p>
                <p className="text-[8px] text-muted-foreground text-center leading-tight">
                  {section.kannada}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Design Sections */}
      <HorizontalSection
        title="Trending Designs"
        kannada="ಟ್ರೆಂಡಿಂಗ್ ಡಿಸೈನ್ಸ್"
        designs={trendingDesigns}
        isLoading={isLoadingTrending}
        onDesignClick={onDesignClick}
        onSeeAll={() => onNavigate("embroidery")}
      />

      <HorizontalSection
        title="New Designs"
        kannada="ಹೊಸ ಡಿಸೈನ್ಸ್"
        designs={newDesigns}
        isLoading={isLoadingAll}
        onDesignClick={onDesignClick}
        onSeeAll={() => onNavigate("embroidery")}
      />

      <HorizontalSection
        title="Bridal Designs"
        kannada="ಮದುವೆ ಡಿಸೈನ್ಸ್"
        designs={bridalDesigns}
        isLoading={isLoadingBridal}
        onDesignClick={onDesignClick}
        onSeeAll={() => onNavigate("embroidery")}
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
