import {
  ChevronLeft,
  ChevronRight,
  GitCompare,
  Share2,
  ShoppingBag,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImageSlider } from "../components/ImageSlider";
import { SUBCATEGORY_LABELS } from "../lib/designCodes";
import type { Design } from "../lib/storage";
import { useAppStore } from "../store/appStore";

interface DesignDetailPageProps {
  design: Design;
  designs: Design[];
  initialIndex: number;
}

export function DesignDetailPage({
  design,
  designs,
  initialIndex,
}: DesignDetailPageProps) {
  const { addToCart, cart, addToCompare, compareDesigns } = useAppStore();

  // Design-to-design navigation state
  const [currentIndex, setCurrentIndex] = useState(
    designs.length > 0 ? initialIndex : 0,
  );
  const currentDesign = designs.length > 0 ? designs[currentIndex] : design;

  const isInCart = cart.some((c) => c.designId === currentDesign.id);
  const isInCompare = compareDesigns.some((d) => d.id === currentDesign.id);

  // Page-level swipe detection (on info/buttons section below image)
  const pageSwipeTouchStartX = useRef(0);
  const pageSwipeTouchStartY = useRef(0);

  const handlePageTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      pageSwipeTouchStartX.current = e.touches[0].clientX;
      pageSwipeTouchStartY.current = e.touches[0].clientY;
    }
  };

  const handlePageTouchEnd = (e: React.TouchEvent) => {
    const deltaX =
      pageSwipeTouchStartX.current -
      (e.changedTouches[0]?.clientX ?? pageSwipeTouchStartX.current);
    const deltaY =
      pageSwipeTouchStartY.current -
      (e.changedTouches[0]?.clientY ?? pageSwipeTouchStartY.current);

    // Only process horizontal swipes that are clearly more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 60) {
      if (deltaX > 0) {
        // Swipe left → next design
        if (currentIndex < designs.length - 1) {
          setCurrentIndex((i) => i + 1);
        }
      } else {
        // Swipe right → prev design
        if (currentIndex > 0) {
          setCurrentIndex((i) => i - 1);
        }
      }
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const goToNext = () => {
    if (currentIndex < designs.length - 1) setCurrentIndex((i) => i + 1);
  };

  const handleAddToCart = () => {
    if (isInCart) {
      toast.info("Already in stitching orders");
      return;
    }
    addToCart({
      designId: currentDesign.id,
      designCode: currentDesign.designCode,
      designTitle: currentDesign.title,
      designImage: currentDesign.images[0] || "",
    });
    toast.success(`${currentDesign.designCode} added to stitching orders`);
  };

  const handleShare = async () => {
    const text = `✨ Design: ${currentDesign.designCode}\n${currentDesign.title}\n\nVishal Embroidery Works`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentDesign.title,
          text,
        });
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Design info copied to clipboard");
      } catch {
        toast.error("Could not share");
      }
    }
  };

  const handleCompare = () => {
    if (isInCompare) {
      toast.info("Already in comparison");
      return;
    }
    if (compareDesigns.length >= 2) {
      toast.error(
        "Only 2 designs can be compared at a time. Clear comparison first.",
      );
      return;
    }
    addToCompare(currentDesign);
    toast.success(`${currentDesign.designCode} added to compare`);
  };

  const showCompareNow = compareDesigns.length === 2;
  const hasPrev = designs.length > 1 && currentIndex > 0;
  const hasNext = designs.length > 1 && currentIndex < designs.length - 1;

  return (
    <div className="min-h-full">
      {/* Image Slider */}
      <div className="w-full bg-black relative" style={{ height: "340px" }}>
        <ImageSlider
          images={currentDesign.images}
          alt={currentDesign.title}
          className="w-full h-full"
        />

        {/* Design-to-design navigation arrows on image area */}
        {hasPrev && (
          <button
            type="button"
            data-ocid="design.prev_design.button"
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center z-20 backdrop-blur-sm border border-white/20 active:scale-95 transition-transform"
            aria-label="Previous design"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            data-ocid="design.next_design.button"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center z-20 backdrop-blur-sm border border-white/20 active:scale-95 transition-transform"
            aria-label="Next design"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Info + Actions — swipe listener here to avoid conflict with ImageSlider */}
      <div onTouchStart={handlePageTouchStart} onTouchEnd={handlePageTouchEnd}>
        {/* Design counter + navigation hint */}
        {designs.length > 1 && (
          <div
            data-ocid="design.design_counter.panel"
            className="flex items-center justify-between px-4 pt-3 pb-1"
          >
            <div className="flex items-center gap-2">
              {hasPrev && (
                <button
                  type="button"
                  data-ocid="design.prev_design.button"
                  onClick={goToPrev}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  aria-label="Previous design"
                >
                  <ChevronLeft size={14} />
                </button>
              )}
              <span className="text-xs font-semibold text-muted-foreground">
                {currentIndex + 1} / {designs.length} designs
              </span>
              {hasNext && (
                <button
                  type="button"
                  data-ocid="design.next_design.button"
                  onClick={goToNext}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  aria-label="Next design"
                >
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              {designs.length > 1 ? "← Swipe to browse →" : ""}
            </p>
          </div>
        )}

        {/* Design Info */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="inline-flex items-center bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full tracking-wide">
                  {currentDesign.designCode}
                </span>
                {currentDesign.isBridal && (
                  <span className="inline-flex items-center bg-accent/20 text-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                    👑 Bridal
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-foreground leading-snug">
                {currentDesign.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {SUBCATEGORY_LABELS[currentDesign.subcategory]}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 space-y-2.5">
          <button
            type="button"
            data-ocid="design.add_to_cart.button"
            onClick={handleAddToCart}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isInCart
                ? "bg-muted text-foreground border border-border"
                : "bg-primary text-primary-foreground shadow-card"
            }`}
          >
            <ShoppingBag size={18} />
            {isInCart
              ? "Added to Stitching Orders ✓"
              : "Add to Stitching Orders"}
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              data-ocid="design.share.button"
              onClick={handleShare}
              className="py-3 rounded-xl bg-card border border-border text-foreground font-semibold text-sm flex items-center justify-center gap-2 active:bg-muted"
            >
              <Share2 size={16} />
              Share
            </button>
            <button
              type="button"
              data-ocid="design.compare.button"
              onClick={handleCompare}
              className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] ${
                isInCompare
                  ? "bg-accent/20 text-foreground border border-accent/30"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              <GitCompare size={16} />
              {isInCompare ? "In Compare" : "Compare"}
            </button>
          </div>

          {showCompareNow && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">
                2 designs ready to compare
              </p>
              <button
                type="button"
                data-ocid="design.compare_now.button"
                className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg"
              >
                Compare Now
              </button>
            </div>
          )}
        </div>

        {/* Design meta */}
        <div className="px-4 pt-1 pb-6">
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              DESIGN DETAILS
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Code</span>
                <span className="text-xs font-bold text-foreground">
                  {currentDesign.designCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Category</span>
                <span className="text-xs font-semibold text-foreground capitalize">
                  {currentDesign.category}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Images</span>
                <span className="text-xs font-semibold text-foreground">
                  {currentDesign.images.filter(Boolean).length} photo
                  {currentDesign.images.filter(Boolean).length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
