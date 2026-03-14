import { useState } from "react";
import { toast } from "sonner";
import { DesignCard } from "../components/DesignCard";
import { useDesigns } from "../hooks/useFirestore";
import {
  ALL_BLOUSE_TYPES,
  BLOUSE_TYPE_LABELS,
  type BlouseType,
  type Design,
} from "../lib/storage";
import { useAppStore } from "../store/appStore";

interface BlousePageProps {
  onSelectDesign: (design: Design, designs: Design[], index: number) => void;
}

export function BlousePage({ onSelectDesign }: BlousePageProps) {
  const [activeBlouseType, setActiveBlouseType] = useState<
    NonNullable<BlouseType>
  >(ALL_BLOUSE_TYPES[0]);
  const { data: allDesigns, loading } = useDesigns();
  const { addToCart } = useAppStore();

  const galleryDesigns = allDesigns.filter(
    (d) =>
      !d.isHidden &&
      d.category === "blouse" &&
      d.subcategory === activeBlouseType,
  );

  const handleAddToStitching = (design: Design) => {
    addToCart({
      designId: design.id,
      designCode: design.designCode,
      designTitle: design.title,
      designImage: design.images[0] || "",
    });
    toast.success(`${design.designCode} added to stitching orders`);
  };

  const handleShare = (design: Design) => {
    const text = `${design.designCode} — ${design.title}`;
    if (navigator.share) {
      navigator.share({ title: design.title, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        toast.success("Design code copied to clipboard");
      });
    }
  };

  return (
    <div className="min-h-full">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold text-foreground">Blouse Designs</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Browse blouse design categories
        </p>
      </div>

      {/* Horizontal Category Pill Slider */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
        {ALL_BLOUSE_TYPES.map((blouseType) => (
          <button
            key={blouseType}
            type="button"
            data-ocid={`blouse.${blouseType}.tab`}
            onClick={() => setActiveBlouseType(blouseType)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
              activeBlouseType === blouseType
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {BLOUSE_TYPE_LABELS[blouseType]}
          </button>
        ))}
      </div>

      {/* Design Grid */}
      <div className="px-4">
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
                style={{ paddingBottom: "60%" }}
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
                showActions
                onClick={() => onSelectDesign(design, galleryDesigns, idx)}
                onAddToStitching={() => handleAddToStitching(design)}
                onShare={() => handleShare(design)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
