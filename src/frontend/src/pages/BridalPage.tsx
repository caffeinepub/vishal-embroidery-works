import { getDesigns } from "../lib/storage";

interface BridalPageProps {
  onOpenBridalGallery: (type: "embroidery" | "blouse") => void;
}

export function BridalPage({ onOpenBridalGallery }: BridalPageProps) {
  const allDesigns = getDesigns();
  const bridalEmbCount = allDesigns.filter(
    (d) => d.isBridal && d.category === "embroidery" && !d.isHidden,
  ).length;
  const bridalBlouseCount = allDesigns.filter(
    (d) => d.isBridal && d.category === "blouse" && !d.isHidden,
  ).length;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold text-foreground">Bridal Collection</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Special designs tagged as Bridal
        </p>
      </div>

      {/* Sections */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          data-ocid="bridal.embroidery.card"
          onClick={() => onOpenBridalGallery("embroidery")}
          className="bg-card rounded-2xl shadow-card p-4 text-left active:scale-[0.97] transition-transform hover:shadow-card-hover"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
            <span className="text-2xl">✨</span>
          </div>
          <h3 className="font-bold text-foreground text-sm leading-tight">
            Bridal Embroidery
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Special bridal embroidery
          </p>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs font-bold text-primary">
              {bridalEmbCount}
            </span>
            <span className="text-xs text-muted-foreground">designs</span>
          </div>
        </button>

        <button
          type="button"
          data-ocid="bridal.blouse.card"
          onClick={() => onOpenBridalGallery("blouse")}
          className="bg-card rounded-2xl shadow-card p-4 text-left active:scale-[0.97] transition-transform hover:shadow-card-hover"
        >
          <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-3">
            <span className="text-2xl">👑</span>
          </div>
          <h3 className="font-bold text-foreground text-sm leading-tight">
            Bridal Blouse
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Exclusive bridal blouses
          </p>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs font-bold text-primary">
              {bridalBlouseCount}
            </span>
            <span className="text-xs text-muted-foreground">designs</span>
          </div>
        </button>
      </div>

      {/* Info box */}
      <div className="mx-4 mt-4 bg-primary/5 border border-primary/20 rounded-xl p-3">
        <p className="text-xs text-foreground font-medium">
          💡 About Bridal Collection
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Designs tagged as "Bridal" during upload automatically appear here.
          Ask admin to tag any design as Bridal.
        </p>
      </div>
    </div>
  );
}
