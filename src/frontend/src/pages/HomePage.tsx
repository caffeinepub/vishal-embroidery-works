import type { ActiveTab } from "../store/appStore";

interface HomePageProps {
  onNavigate: (tab: ActiveTab) => void;
}

const categories = [
  {
    id: "embroidery" as ActiveTab,
    label: "Embroidery",
    emoji: "🧵",
    subtitle: "2 subcategories",
    gradient: "from-rose-600 to-pink-700",
    desc: "Hand crafted embroidery & ready blouse",
  },
  {
    id: "blouse" as ActiveTab,
    label: "Blouse",
    emoji: "👗",
    subtitle: "4 subcategories",
    gradient: "from-amber-500 to-orange-600",
    desc: "Simple, boat neck, bridal & designer",
  },
  {
    id: "bridal" as ActiveTab,
    label: "Bridal",
    emoji: "👑",
    subtitle: "Special collection",
    gradient: "from-purple-600 to-pink-600",
    desc: "Bridal embroidery & blouse designs",
  },
];

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-full">
      {/* Hero Banner */}
      <div className="vew-hero-gradient px-5 pt-6 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10">
          <div className="w-full h-full rounded-full border-[40px] border-white/30" />
        </div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 opacity-10">
          <div className="w-full h-full rounded-full border-[20px] border-white/30" />
        </div>
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-1">
            Welcome to
          </p>
          <h1 className="text-white text-2xl font-bold leading-tight">
            Vishal Embroidery Works
          </h1>
          <p className="text-white/80 text-sm mt-1 font-medium">
            Premium Embroidery & Blouse Designs
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
              Est. Quality
            </span>
            <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
              Custom Stitching
            </span>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="px-4 py-5">
        <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-3">
          Browse Collections
        </p>
        <div className="space-y-3">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              data-ocid={`home.${cat.id}.card`}
              onClick={() => onNavigate(cat.id)}
              className="w-full bg-card rounded-2xl shadow-card p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform hover:shadow-card-hover"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center flex-shrink-0`}
              >
                <span className="text-2xl">{cat.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-base">
                  {cat.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cat.desc}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">
                  {cat.subtitle}
                </span>
                <span className="text-primary mt-1">›</span>
              </div>
            </button>
          ))}
        </div>
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
