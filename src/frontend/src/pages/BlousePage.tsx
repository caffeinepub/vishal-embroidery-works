import { getDesigns } from "../lib/storage";
import type { Subcategory } from "../lib/storage";

interface BlousePageProps {
  onOpenGallery: (subcategory: Subcategory) => void;
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

export function BlousePage({ onOpenGallery }: BlousePageProps) {
  const allDesigns = getDesigns();

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold text-foreground">Blouse Designs</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose a category to explore
        </p>
      </div>

      {/* Subcategory Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {subcategories.map((sub) => {
          const count = allDesigns.filter(
            (d) => d.subcategory === sub.id && !d.isHidden,
          ).length;
          return (
            <button
              type="button"
              key={sub.id}
              data-ocid={`blouse.${sub.id}.card`}
              onClick={() => onOpenGallery(sub.id)}
              className="bg-card rounded-2xl shadow-card p-4 text-left active:scale-[0.97] transition-transform hover:shadow-card-hover"
            >
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-3">
                <span className="text-2xl">{sub.emoji}</span>
              </div>
              <h3 className="font-bold text-foreground text-sm leading-tight">
                {sub.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {sub.desc}
              </p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs font-bold text-primary">{count}</span>
                <span className="text-xs text-muted-foreground">designs</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
