import { useState } from "react";
import { DesignCard } from "../components/DesignCard";
import { useDesigns } from "../hooks/useFirestore";
import {
  ALL_BLOUSE_TYPES,
  BLOUSE_TYPE_LABELS,
  type BlouseType,
  type Design,
} from "../lib/storage";

interface BlousePageProps {
  onSelectDesign: (design: Design, designs: Design[], index: number) => void;
}

const BLOUSE_TYPE_META: Record<
  NonNullable<BlouseType>,
  { emoji: string; desc: string }
> = {
  "boat-neck": { emoji: "🌊", desc: "Classic boat neck style blouses" },
  "princess-cut": { emoji: "👸", desc: "Elegant princess cut blouses" },
  "high-neck": { emoji: "⬆️", desc: "Sophisticated high neck blouses" },
  "collar-neck": { emoji: "👔", desc: "Stylish collar neck blouses" },
  "padded-blouse": { emoji: "✨", desc: "Comfortable padded blouses" },
};

export function BlousePage({ onSelectDesign }: BlousePageProps) {
  const [activeBlouseType, setActiveBlouseType] =
    useState<NonNullable<BlouseType> | null>(null);
  const { data: allDesigns, loading } = useDesigns();

  const handleCardTap = (bt: NonNullable<BlouseType>) => {
    setActiveBlouseType((prev) => (prev === bt ? null : bt));
  };

  // Filter by category=blouse and subcategory matching the blouseType
  // Also supports legacy designs that used blouseType field
  const galleryDesigns = activeBlouseType
    ? allDesigns.filter(
        (d) =>
          !d.isHidden &&
          d.category === "blouse" &&
          (d.subcategory === activeBlouseType ||
            d.blouseType === activeBlouseType),
      )
    : [];

  return (
    <div className="min-h-full">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold text-foreground">Blouse Designs</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tap a category to explore designs
        </p>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3">
        {ALL_BLOUSE_TYPES.map((blouseType) => {
          const meta = BLOUSE_TYPE_META[blouseType];
          const count = allDesigns.filter(
            (d) =>
              !d.isHidden &&
              d.category === "blouse" &&
              (d.subcategory === blouseType || d.blouseType === blouseType),
          ).length;
          const isActive = activeBlouseType === blouseType;

          return (
            <button
              type="button"
              key={blouseType}
              data-ocid={`blouse.${blouseType}.card`}
              onClick={() => handleCardTap(blouseType)}
              className={`rounded-2xl shadow-card p-4 text-left active:scale-[0.97] transition-all hover:shadow-card-hover ${
                isActive
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                  : "bg-card"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                  isActive ? "bg-white/20" : "bg-primary/10"
                }`}
              >
                <span className="text-2xl">{meta.emoji}</span>
              </div>
              <h3
                className={`font-bold text-sm leading-tight ${
                  isActive ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {BLOUSE_TYPE_LABELS[blouseType]} Blouse
              </h3>
              <p
                className={`text-xs mt-1 line-clamp-2 ${
                  isActive
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {meta.desc}
              </p>
              <div className="mt-2 flex items-center gap-1">
                <span
                  className={`text-xs font-bold ${
                    isActive ? "text-primary-foreground" : "text-primary"
                  }`}
                >
                  {count}
                </span>
                <span
                  className={`text-xs ${
                    isActive
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  designs
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {activeBlouseType && (
        <div className="mt-4 px-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">
              {BLOUSE_TYPE_LABELS[activeBlouseType]} Blouse
            </p>
            <p className="text-xs text-muted-foreground">
              {galleryDesigns.length} designs
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-xl bg-muted animate-pulse"
                  style={{ paddingBottom: "42.77%" }}
                />
              ))}
            </div>
          ) : galleryDesigns.length === 0 ? (
            <div
              data-ocid="blouse.gallery.empty_state"
              className="text-center py-12 bg-muted/30 rounded-xl"
            >
              <span className="text-4xl mb-2 block">👗</span>
              <p className="text-sm text-muted-foreground">No designs yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pb-4">
              {galleryDesigns.map((design, idx) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  imageMode="wide-contain"
                  onClick={() => onSelectDesign(design, galleryDesigns, idx)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
