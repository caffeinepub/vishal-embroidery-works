import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useState } from "react";
import type { Design } from "../../backend.d";
import { useDesignsByCategory } from "../../hooks/useQueries";
import { SAMPLE_DESIGNS, getSampleByCategory } from "../../lib/sampleData";
import { DesignGrid } from "../shared/DesignGrid";

interface BlouseScreenProps {
  onDesignClick: (design: Design) => void;
}

const CATEGORIES = [
  {
    id: "Simple Blouse",
    label: "Simple",
    kannada: "ಸಿಂಪಲ್",
    emoji: "👔",
  },
  {
    id: "Princess Cut Blouse",
    label: "Princess Cut",
    kannada: "ಪ್ರಿನ್ಸೆಸ್ ಕಟ್",
    emoji: "👑",
  },
  {
    id: "Boat Neck Blouse",
    label: "Boat Neck",
    kannada: "ಬೋಟ್ ನೆಕ್",
    emoji: "⛵",
  },
  {
    id: "Collar Blouse",
    label: "Collar",
    kannada: "ಕಾಲರ್",
    emoji: "🎀",
  },
  {
    id: "Fashion Blouse",
    label: "Fashion",
    kannada: "ಫ್ಯಾಶನ್",
    emoji: "✨",
  },
];

function BlouseContent({
  category,
  onDesignClick,
}: {
  category: string;
  onDesignClick: (d: Design) => void;
}) {
  const query = useDesignsByCategory(category);

  const sampleData =
    getSampleByCategory(category).length > 0
      ? getSampleByCategory(category)
      : SAMPLE_DESIGNS.filter((d) =>
          d.category
            .toLowerCase()
            .includes(category.split(" ")[0].toLowerCase()),
        );

  const designs = query.data && query.data.length > 0 ? query.data : sampleData;
  const isLoading = query.isLoading && designs.length === 0;

  return (
    <DesignGrid
      designs={designs}
      isLoading={isLoading}
      onDesignClick={onDesignClick}
      emptyMessage={`No ${category} designs found`}
      emptyKannada="ಯಾವುದೇ ಡಿಸೈನ್ ಕಂಡುಬಂದಿಲ್ಲ"
    />
  );
}

export function BlouseScreen({ onDesignClick }: BlouseScreenProps) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);

  return (
    <div className="flex-1 flex flex-col">
      {/* Category Tabs - Horizontal scroll */}
      <div className="pt-3 pb-1 flex-shrink-0">
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-4 pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                data-ocid={`blouse.${cat.label.toLowerCase().replace(/\s/g, "-")}.tab`}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 min-w-[70px] ${
                  activeCategory === cat.id
                    ? "bg-vew-sky text-white shadow-card"
                    : "bg-vew-sky-light/50 text-vew-navy hover:bg-vew-sky-light"
                }`}
              >
                <span className="text-base leading-none mb-1">{cat.emoji}</span>
                <span className="text-[10px] font-semibold leading-tight text-center">
                  {cat.label}
                </span>
                <span
                  className={`text-[8px] leading-tight text-center mt-0.5 ${
                    activeCategory === cat.id ? "text-white/80" : "text-vew-sky"
                  }`}
                >
                  {cat.kannada}
                </span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </div>

      {/* Category Content */}
      <div className="flex-1 overflow-y-auto">
        <BlouseContent
          key={activeCategory}
          category={activeCategory}
          onDesignClick={onDesignClick}
        />
      </div>
    </div>
  );
}
