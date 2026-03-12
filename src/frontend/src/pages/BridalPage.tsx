import { useState } from "react";
import { DesignCard } from "../components/DesignCard";
import { useDesigns } from "../hooks/useFirestore";
import type { Design } from "../lib/storage";

interface BridalPageProps {
  onSelectDesign: (design: Design, designs: Design[], index: number) => void;
}

type BridalFilter = "embroidery" | "blouse" | null;

export function BridalPage({ onSelectDesign }: BridalPageProps) {
  const [activeFilter, setActiveFilter] = useState<BridalFilter>(null);
  const { data: allDesigns, loading } = useDesigns();

  const bridalEmbCount = allDesigns.filter(
    (d) => d.isBridal && d.category === "embroidery" && !d.isHidden,
  ).length;
  const bridalBlouseCount = allDesigns.filter(
    (d) => d.isBridal && d.category === "blouse" && !d.isHidden,
  ).length;

  const galleryDesigns = activeFilter
    ? allDesigns.filter(
        (d) => d.isBridal && d.category === activeFilter && !d.isHidden,
      )
    : [];

  const handleFilterTap = (filter: "embroidery" | "blouse") => {
    setActiveFilter((prev) => (prev === filter ? null : filter));
  };

  return (
    <div className="min-h-full">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold text-foreground">Bridal Collection</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Exclusive bridal designs
        </p>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3">
        {/* Bridal Embroidery Card */}
        <button
          type="button"
          data-ocid="bridal.embroidery.card"
          onClick={() => handleFilterTap("embroidery")}
          className={`rounded-2xl shadow-card p-4 text-left active:scale-[0.97] transition-all hover:shadow-card-hover ${
            activeFilter === "embroidery"
              ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
              : "bg-card"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
              activeFilter === "embroidery" ? "bg-white/20" : "bg-primary/10"
            }`}
          >
            <span className="text-2xl">✨</span>
          </div>
          <h3
            className={`font-bold text-sm leading-tight ${
              activeFilter === "embroidery"
                ? "text-primary-foreground"
                : "text-foreground"
            }`}
          >
            Bridal Embroidery
          </h3>
          <p
            className={`text-xs mt-1 ${
              activeFilter === "embroidery"
                ? "text-primary-foreground/70"
                : "text-muted-foreground"
            }`}
          >
            Special bridal embroidery
          </p>
          <div className="mt-2 flex items-center gap-1">
            <span
              className={`text-xs font-bold ${
                activeFilter === "embroidery"
                  ? "text-primary-foreground"
                  : "text-primary"
              }`}
            >
              {bridalEmbCount}
            </span>
            <span
              className={`text-xs ${
                activeFilter === "embroidery"
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              }`}
            >
              designs
            </span>
          </div>
        </button>

        {/* Bridal Blouse Card */}
        <button
          type="button"
          data-ocid="bridal.blouse.card"
          onClick={() => handleFilterTap("blouse")}
          className={`rounded-2xl shadow-card p-4 text-left active:scale-[0.97] transition-all hover:shadow-card-hover ${
            activeFilter === "blouse"
              ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
              : "bg-card"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
              activeFilter === "blouse" ? "bg-white/20" : "bg-accent/20"
            }`}
          >
            <span className="text-2xl">👑</span>
          </div>
          <h3
            className={`font-bold text-sm leading-tight ${
              activeFilter === "blouse"
                ? "text-primary-foreground"
                : "text-foreground"
            }`}
          >
            Bridal Blouse
          </h3>
          <p
            className={`text-xs mt-1 ${
              activeFilter === "blouse"
                ? "text-primary-foreground/70"
                : "text-muted-foreground"
            }`}
          >
            Exclusive bridal blouses
          </p>
          <div className="mt-2 flex items-center gap-1">
            <span
              className={`text-xs font-bold ${
                activeFilter === "blouse"
                  ? "text-primary-foreground"
                  : "text-primary"
              }`}
            >
              {bridalBlouseCount}
            </span>
            <span
              className={`text-xs ${
                activeFilter === "blouse"
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              }`}
            >
              designs
            </span>
          </div>
        </button>
      </div>

      {activeFilter && (
        <div className="mt-4 px-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">
              Bridal {activeFilter === "embroidery" ? "Embroidery" : "Blouse"}
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
              data-ocid="bridal.gallery.empty_state"
              className="text-center py-12 bg-muted/30 rounded-xl"
            >
              <span className="text-4xl mb-2 block">👑</span>
              <p className="text-sm text-muted-foreground">
                No bridal designs yet
              </p>
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
