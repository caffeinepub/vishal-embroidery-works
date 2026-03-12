import { Search } from "lucide-react";
import { useRef, useState } from "react";
import { DesignCard } from "../components/DesignCard";
import { useDesigns } from "../hooks/useFirestore";
import type { Design, Subcategory } from "../lib/storage";

interface EmbroideryPageProps {
  onSelectDesign: (design: Design, designs: Design[], index: number) => void;
}

const subcategories: {
  id: Subcategory;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  {
    id: "embroidery",
    label: "Embroidery",
    emoji: "🧵",
    desc: "Traditional & modern embroidery designs",
  },
  {
    id: "ready-blouse-embroidery",
    label: "Ready Blouse Embroidery",
    emoji: "✨",
    desc: "Pre-made embroidery for blouses",
  },
];

export function EmbroideryPage({ onSelectDesign }: EmbroideryPageProps) {
  const [activeSubcategory, setActiveSubcategory] =
    useState<Subcategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const searchRef = useRef<HTMLDivElement>(null);
  const { data: allDesigns, loading } = useDesigns();

  const handleCardTap = (subId: Subcategory) => {
    setActiveSubcategory((prev) => (prev === subId ? null : subId));
    setSearchQuery("");
  };

  // Search across all embroidery designs
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

  const galleryDesigns =
    !isSearching && activeSubcategory
      ? allDesigns.filter(
          (d) => d.subcategory === activeSubcategory && !d.isHidden,
        )
      : [];

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
      <div className="px-4 pb-3" ref={searchRef}>
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
                  onClick={() => onSelectDesign(design, searchResults, idx)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
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
                  data-ocid={`embroidery.${sub.id}.card`}
                  onClick={() => handleCardTap(sub.id)}
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
                    <span className="text-2xl">{sub.emoji}</span>
                  </div>
                  <h3
                    className={`font-bold text-sm leading-tight ${
                      isActive ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {sub.label}
                  </h3>
                  <p
                    className={`text-xs mt-1 line-clamp-2 ${
                      isActive
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {sub.desc}
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
                  data-ocid="embroidery.gallery.empty_state"
                  className="text-center py-12 bg-muted/30 rounded-xl"
                >
                  <span className="text-4xl mb-2 block">🧵</span>
                  <p className="text-sm text-muted-foreground">
                    No designs yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pb-4">
                  {galleryDesigns.map((design, idx) => (
                    <DesignCard
                      key={design.id}
                      design={design}
                      imageMode="wide-contain"
                      onClick={() =>
                        onSelectDesign(design, galleryDesigns, idx)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
