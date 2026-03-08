import { Search } from "lucide-react";
import { useState } from "react";
import { DesignCard } from "../components/DesignCard";
import { useDesigns } from "../hooks/useFirestore";
import { SUBCATEGORY_LABELS } from "../lib/designCodes";
import type { Design } from "../lib/storage";

interface GalleryPageProps {
  subcategory: string;
  bridalFilter?: "embroidery" | "blouse" | null;
  onSelectDesign: (design: Design) => void;
}

export function GalleryPage({
  subcategory,
  bridalFilter,
  onSelectDesign,
}: GalleryPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: designs, loading } = useDesigns();

  // Filter designs
  let filtered = designs.filter((d) => !d.isHidden);

  if (bridalFilter) {
    filtered = filtered.filter(
      (d) => d.isBridal && d.category === bridalFilter,
    );
  } else {
    filtered = filtered.filter((d) => d.subcategory === subcategory);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.designCode.toLowerCase().includes(q),
    );
  }

  const title = bridalFilter
    ? `Bridal ${bridalFilter === "embroidery" ? "Embroidery" : "Blouse"}`
    : SUBCATEGORY_LABELS[subcategory as keyof typeof SUBCATEGORY_LABELS] ||
      subcategory;

  const isEmbroiderySubcategory = subcategory === "embroidery";

  return (
    <div className="min-h-full">
      {/* Sub-header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">
              {filtered.length} designs
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            data-ocid="gallery.search_input"
            type="text"
            placeholder="Search by title or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="px-4 grid grid-cols-2 gap-2 pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-muted animate-pulse"
              style={{
                paddingBottom: isEmbroiderySubcategory ? "56.25%" : "100%",
              }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 px-8"
          data-ocid="gallery.empty_state"
        >
          <span className="text-5xl mb-3">🧵</span>
          <p className="text-base font-semibold text-foreground">
            No designs found
          </p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {searchQuery
              ? "Try a different search term"
              : "No designs added yet"}
          </p>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-2 gap-2 pb-4">
          {filtered.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              useWideRatio={isEmbroiderySubcategory}
              onClick={() => onSelectDesign(design)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
