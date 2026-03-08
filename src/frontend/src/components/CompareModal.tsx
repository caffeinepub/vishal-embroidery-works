import { X } from "lucide-react";
import { SUBCATEGORY_LABELS } from "../lib/designCodes";
import { useAppStore } from "../store/appStore";

export function CompareModal() {
  const { compareDesigns, clearCompare, removeFromCompare } = useAppStore();

  if (compareDesigns.length < 2) return null;

  const [a, b] = compareDesigns;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col animate-fade-in">
      <div className="bg-card p-4 flex items-center justify-between border-b border-border">
        <h2 className="font-bold text-lg text-foreground">Compare Designs</h2>
        <button
          type="button"
          data-ocid="compare.close_button"
          onClick={clearCompare}
          className="p-2 rounded-full hover:bg-muted"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {[a, b].map((design, idx) => (
            <div
              key={design.id}
              className="bg-card rounded-xl overflow-hidden shadow-card"
            >
              <div className="relative">
                <div
                  className="w-full"
                  style={{ paddingBottom: "100%", position: "relative" }}
                >
                  <div className="absolute inset-0">
                    {design.images[0] ? (
                      <img
                        src={design.images[0]}
                        alt={design.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-3xl">🧵</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  data-ocid={`compare.remove_button.${idx + 1}`}
                  onClick={() => removeFromCompare(design.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="p-3">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {design.designCode}
                </span>
                <p className="text-sm font-semibold text-foreground mt-1.5 line-clamp-2">
                  {design.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {SUBCATEGORY_LABELS[design.subcategory]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 bg-card border-t border-border">
        <button
          type="button"
          data-ocid="compare.clear_button"
          onClick={clearCompare}
          className="w-full py-3 rounded-xl bg-muted text-foreground font-semibold text-sm"
        >
          Clear Comparison
        </button>
      </div>
    </div>
  );
}
