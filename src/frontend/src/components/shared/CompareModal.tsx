import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { X } from "lucide-react";
import type { Design } from "../../backend.d";

interface CompareModalProps {
  designs: [Design, Design] | null;
  open: boolean;
  onClose: () => void;
}

function DesignColumn({ design }: { design: Design }) {
  const firstImage = design.imageUrls?.[0] ?? "";

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Image */}
      <div className="aspect-square w-full bg-vew-sky-light/30 rounded-xl overflow-hidden mb-2">
        {firstImage ? (
          <img
            src={firstImage}
            alt={design.designCode}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              aria-label="No image"
              role="img"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-vew-sky opacity-30"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1 mb-2">
        {design.isTrending && (
          <Badge className="bg-vew-sky text-white border-0 text-[10px] px-1.5 py-0.5">
            🔥 Trending
          </Badge>
        )}
        {design.isBridal && (
          <Badge className="bg-pink-500 text-white border-0 text-[10px] px-1.5 py-0.5">
            👰 Bridal
          </Badge>
        )}
        {design.isNew && (
          <Badge className="bg-green-500 text-white border-0 text-[10px] px-1.5 py-0.5">
            New
          </Badge>
        )}
      </div>

      {/* Info rows */}
      <div className="space-y-2">
        <div className="bg-vew-sky-light/40 rounded-lg p-2">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
            Design Code
          </p>
          <p className="text-xs font-bold text-vew-navy break-all leading-tight">
            {design.designCode}
          </p>
        </div>

        <div className="bg-vew-sky-light/40 rounded-lg p-2">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
            Category / ವರ್ಗ
          </p>
          <p className="text-xs font-semibold text-foreground leading-tight">
            {design.category}
          </p>
        </div>

        <div className="bg-vew-sky-light/40 rounded-lg p-2">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
            Work Type / ಕೆಲಸ
          </p>
          <p className="text-xs font-semibold text-foreground leading-tight">
            {design.workType || "—"}
          </p>
        </div>

        <div className="bg-vew-sky-light/40 rounded-lg p-2">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
            Images
          </p>
          <p className="text-xs font-semibold text-foreground leading-tight">
            {design.imageUrls?.length ?? 0} photo
            {(design.imageUrls?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="bg-gradient-to-r from-vew-sky to-vew-sky-dark rounded-lg p-2">
          <p className="text-white/70 text-[9px] mb-0.5">Price / ಬೆಲೆ</p>
          <p className="text-white text-xs font-bold">Ask in Shop</p>
        </div>
      </div>
    </div>
  );
}

export function CompareModal({ designs, open, onClose }: CompareModalProps) {
  if (!designs) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[90vh] p-0 rounded-t-2xl overflow-hidden flex flex-col"
        data-ocid="compare.modal"
      >
        {/* Header */}
        <SheetHeader className="flex-row items-center justify-between px-4 py-3 border-b border-border/60 flex-shrink-0 space-y-0">
          <SheetTitle className="text-sm font-bold text-vew-navy">
            Compare Designs / ಡಿಸೈನ್ ಹೋಲಿಸಿ
          </SheetTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-ocid="compare.close_button"
            className="w-8 h-8 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </SheetHeader>

        {/* Side by side content */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex gap-3">
            <DesignColumn design={designs[0]} />

            {/* Divider */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-px flex-1 bg-border/60" />
              <div className="w-7 h-7 rounded-full bg-vew-sky/10 border border-vew-sky/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-vew-sky">VS</span>
              </div>
              <div className="w-px flex-1 bg-border/60" />
            </div>

            <DesignColumn design={designs[1]} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/60 flex-shrink-0">
          <Button
            onClick={onClose}
            data-ocid="compare.cancel_button"
            className="w-full h-11 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark"
          >
            Done / ಮುಗಿದಿದೆ
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
