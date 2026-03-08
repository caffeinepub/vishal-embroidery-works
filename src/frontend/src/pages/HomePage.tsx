import { Search } from "lucide-react";
import { useRef, useState } from "react";
import { useDesigns } from "../hooks/useFirestore";
import type { Design } from "../lib/storage";
import type { ActiveTab } from "../store/appStore";

interface HomePageProps {
  onNavigate: (tab: ActiveTab) => void;
  onSelectDesign: (design: Design) => void;
}

const quickAccessCards = [
  {
    id: "embroidery" as ActiveTab,
    label: "Embroidery",
    kannada: "ಎಂಬ್ರಾಯ್ಡರಿ",
    emoji: "🧵",
    gradient: "from-rose-600 to-pink-700",
  },
  {
    id: "blouse" as ActiveTab,
    label: "Blouse",
    kannada: "ಬ್ಲೌಸ್",
    emoji: "👗",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "bridal" as ActiveTab,
    label: "Bridal",
    kannada: "ಬ್ರೈಡಲ್",
    emoji: "👑",
    gradient: "from-purple-600 to-pink-600",
  },
];

export function HomePage({ onNavigate, onSelectDesign }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { data: allDesigns, loading } = useDesigns();

  // Search results — filter from all non-hidden designs
  const searchResults =
    searchQuery.trim().length > 0
      ? allDesigns
          .filter((d) => !d.isHidden)
          .filter((d) => {
            const q = searchQuery.toLowerCase();
            return (
              d.title.toLowerCase().includes(q) ||
              d.designCode.toLowerCase().includes(q)
            );
          })
          .slice(0, 8)
      : [];

  // Latest embroidery designs
  const latestEmbroidery = allDesigns
    .filter((d) => d.subcategory === "embroidery" && !d.isHidden)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10);

  return (
    <div className="min-h-full">
      {/* Hero Banner */}
      <div className="vew-hero-gradient px-5 pt-6 pb-8 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none">
          <div className="w-full h-full rounded-full border-[40px] border-white/30" />
        </div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 opacity-10 pointer-events-none">
          <div className="w-full h-full rounded-full border-[20px] border-white/30" />
        </div>

        <div className="relative z-10">
          <p className="text-white/70 text-xs font-medium tracking-widest mb-1">
            Welcome to / ಸ್ವಾಗತ
          </p>
          <h1 className="text-white text-2xl font-bold leading-tight">
            Vishal Embroidery
          </h1>
          <p className="text-white/80 text-sm mt-0.5 font-medium">
            ವಿಶಾಲ್ ಎಂಬ್ರಾಯ್ಡರಿ ವರ್ಕ್ಸ್
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 -mt-4 relative z-20" ref={searchRef}>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
          />
          <input
            data-ocid="home.search_input"
            type="text"
            placeholder="Search designs by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
            className="w-full pl-9 pr-4 py-3 rounded-2xl border border-border bg-card shadow-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          {/* Search Dropdown */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div
              data-ocid="home.search.popover"
              className="absolute top-full mt-1 left-0 right-0 bg-card rounded-xl shadow-card-hover border border-border overflow-hidden z-30 max-h-72 overflow-y-auto"
            >
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 px-4">
                  No designs found
                </p>
              ) : (
                searchResults.map((design) => (
                  <button
                    type="button"
                    key={design.id}
                    data-ocid="home.search.item"
                    onMouseDown={() => {
                      onSelectDesign(design);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-b border-border/40 last:border-b-0"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {design.images[0] ? (
                        <img
                          src={design.images[0]}
                          alt={design.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">
                          🧵
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-primary">
                        {design.designCode}
                      </p>
                      <p className="text-sm text-foreground font-medium line-clamp-1">
                        {design.title}
                      </p>
                    </div>
                    {design.isBridal && <span className="text-sm">👑</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Access */}
      <div className="px-4 pt-5 pb-3">
        <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-3">
          Quick Access
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {quickAccessCards.map((cat) => (
            <button
              type="button"
              key={cat.id}
              data-ocid={`home.${cat.id}.card`}
              onClick={() => onNavigate(cat.id)}
              className="bg-card rounded-2xl shadow-card p-3 text-center active:scale-[0.97] transition-transform hover:shadow-card-hover flex flex-col items-center gap-2"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}
              >
                <span className="text-xl">{cat.emoji}</span>
              </div>
              <div>
                <p className="font-bold text-foreground text-xs leading-tight">
                  {cat.label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {cat.kannada}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Latest Embroidery Designs */}
      <div className="px-4 pt-2 pb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
            Latest Embroidery
          </p>
          <button
            type="button"
            data-ocid="home.see_all.button"
            onClick={() => onNavigate("embroidery")}
            className="text-xs font-semibold text-primary"
          >
            See All →
          </button>
        </div>

        {loading ? (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-28 h-36 rounded-xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : latestEmbroidery.length === 0 ? (
          <div
            data-ocid="home.embroidery_preview.empty_state"
            className="text-center py-6 bg-muted/30 rounded-xl"
          >
            <p className="text-sm text-muted-foreground">
              No embroidery designs yet
            </p>
          </div>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
            {latestEmbroidery.map((design) => (
              <button
                type="button"
                key={design.id}
                data-ocid="home.design_preview.card"
                onClick={() => onSelectDesign(design)}
                className="flex-shrink-0 w-28 text-left active:scale-[0.97] transition-transform"
              >
                <div className="relative w-28 rounded-xl overflow-hidden bg-muted">
                  {/* Wide ratio for embroidery */}
                  <div className="w-full" style={{ paddingBottom: "56.25%" }}>
                    <div className="absolute inset-0">
                      {design.images[0] ? (
                        <img
                          src={design.images[0]}
                          alt={design.title}
                          className="w-full h-full object-contain bg-muted"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl">🧵</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                        <span className="text-white text-[9px] font-bold">
                          {design.designCode}
                        </span>
                      </div>
                      {design.isBridal && (
                        <div className="absolute top-1 right-1">
                          <span className="text-xs">👑</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs font-medium text-foreground mt-1 line-clamp-1 px-0.5">
                  {design.title}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
