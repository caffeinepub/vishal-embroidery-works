import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DesignCard } from "../components/DesignCard";
import { useDesigns } from "../hooks/useFirestore";
import type { Design, Subcategory } from "../lib/storage";
import { useAppStore } from "../store/appStore";

interface EmbroideryPageProps {
  onSelectDesign: (design: Design, designs: Design[], index: number) => void;
}

const subcategories: { id: Subcategory; label: string }[] = [
  { id: "embroidery", label: "Embroidery" },
  { id: "ready-blouse-embroidery", label: "Ready Blouse Embroidery" },
];

export function EmbroideryPage({ onSelectDesign }: EmbroideryPageProps) {
  const [activeSubcategory, setActiveSubcategory] = useState<Subcategory>(
    subcategories[0].id,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const { data: allDesigns, loading } = useDesigns();
  const { addToCart } = useAppStore();

  const isSearching = searchQuery.trim().length > 0;

  const searchResults = isSearching
    ? allDesigns
        .filter(
          (d) =>
            !d.isHidden &&
            (d.subcategory === "embroidery" ||
              d.subcategory === "ready-blouse-embroidery"),
        )
        .filter((d) => {
          const q = searchQuery.toLowerCase();
          return (
            d.title.toLowerCase().includes(q) ||
            d.designCode.toLowerCase().includes(q)
          );
        })
    : [];

  const galleryDesigns = !isSearching
    ? allDesigns.filter(
        (d) => d.subcategory === activeSubcategory && !d.isHidden,
      )
    : [];

  const handleAddToStitching = (design: Design) => {
    addToCart({
      designId: design.id,
      designCode: design.designCode,
      designTitle: design.title,
      designImage: design.generatedImages?.frontImage || design.images[0] || "",
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
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold text-foreground">Embroidery</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Browse embroidery designs
        </p>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
          />
          <input
            data-ocid="embroidery.search_input"
            type="text"
            placeholder="Search by code or name (EMB001, Floral...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Category Pill Slider */}
      {!isSearching && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {subcategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              data-ocid={`embroidery.${sub.id}.tab`}
              onClick={() => setActiveSubcategory(sub.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                activeSubcategory === sub.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {isSearching ? (
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">
              Search Results
            </p>
            <p className="text-xs text-muted-foreground">
              {searchResults.length} found
            </p>
          </div>
          {searchResults.length === 0 ? (
            <div
              data-ocid="embroidery.search.empty_state"
              className="text-center py-12 bg-muted/30 rounded-xl"
            >
              <span className="text-4xl mb-2 block">🔍</span>
              <p className="text-sm text-muted-foreground">
                No designs found for "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pb-4">
              {searchResults.map((design, idx) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  imageMode="wide-contain"
                  showActions
                  onClick={() => onSelectDesign(design, searchResults, idx)}
                  onAddToStitching={() => handleAddToStitching(design)}
                  onShare={() => handleShare(design)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="px-4">
          {/* Design count */}
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
                  style={{ paddingBottom: "60%" }}
                />
              ))}
            </div>
          ) : galleryDesigns.length === 0 ? (
            <div
              data-ocid="embroidery.gallery.empty_state"
              className="text-center py-12 bg-muted/30 rounded-xl"
            >
              <span className="text-4xl mb-2 block">🧵</span>
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
      )}
    </div>
  );
}
