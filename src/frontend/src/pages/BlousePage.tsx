import { useState } from "react";
import { DesignCard } from "../components/DesignCard";
import { useDesigns } from "../hooks/useFirestore";
import type { Design, Subcategory } from "../lib/storage";

interface BlousePageProps {
  onSelectDesign: (design: Design, designs: Design[], index: number) => void;
}

const subcategories: {
  id: Subcategory;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  {
    id: "simple-blouse",
    label: "Simple Blouse",
    emoji: "👗",
    desc: "Clean, elegant simple blouse designs",
  },
  {
    id: "boat-neck",
    label: "Boat Neck Blouse",
    emoji: "🌊",
    desc: "Classic boat neck style blouses",
  },
  {
    id: "bridal-blouse",
    label: "Bridal Blouse",
    emoji: "💍",
    desc: "Exclusive bridal blouse collection",
  },
  {
    id: "designer-blouse",
    label: "Designer Blouse",
    emoji: "⭐",
    desc: "Premium designer blouse patterns",
  },
];

export function BlousePage({ onSelectDesign }: BlousePageProps) {
  const [activeSubcategory, setActiveSubcategory] =
    useState<Subcategory | null>(null);
  const { data: allDesigns, loading } = useDesigns();

  const handleCardTap = (subId: Subcategory) => {
    setActiveSubcategory((prev) => (prev === subId ? null : subId));
  };

  const galleryDesigns = activeSubcategory
    ? allDesigns.filter(
        (d) => d.subcategory === activeSubcategory && !d.isHidden,
      )
    : [];

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold text-foreground">Blouse Designs</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tap a category to explore designs
        </p>
      </div>

      {/* Subcategory Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {subcategories.map((sub) => {
          const count = allDesigns.filter(
            (d) => d.subcategory === sub.id && !d.isHidden,
          ).length;
          const isActive = activeSubcategory === sub.id;

          return (
            <button
              type="button"
              key={sub.id}
              data-ocid={`blouse.${sub.id}.card`}
              onClick={() => handleCardTap(sub.id)}
              className={`rounded-2xl shadow-card p-4 text-left active:scale-[0.97] transition-all hover:shadow-card-hover ${
                isActive
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                  : "bg-card"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                  isActive ? "bg-white/20" : "bg-accent/20"
                }`}
              >
                <span className="text-2xl">{sub.emoji}</span>
              </div>
              <h3
                className={`font-bold text-sm leading-tight ${isActive ? "text-primary-foreground" : "text-foreground"}`}
              >
                {sub.label}
              </h3>
              <p
                className={`text-xs mt-1 line-clamp-2 ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}
              >
                {sub.desc}
              </p>
              <div className="mt-2 flex items-center gap-1">
                <span
                  className={`text-xs font-bold ${isActive ? "text-primary-foreground" : "text-primary"}`}
                >
                  {count}
                </span>
                <span
                  className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  designs
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Inline Gallery */}
      {activeSubcategory && (
        <div className="mt-4 px-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">
              {subcategories.find((s) => s.id === activeSubcategory)?.label}
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
                  style={{ paddingBottom: "100%" }}
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
