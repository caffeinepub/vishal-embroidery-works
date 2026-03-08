import {
  GitCompare,
  Share2,
  ShoppingBag,
  SplitSquareVertical,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImageSlider } from "../components/ImageSlider";
import { SUBCATEGORY_LABELS } from "../lib/designCodes";
import type { Design } from "../lib/storage";
import { useAppStore } from "../store/appStore";

interface DesignDetailPageProps {
  design: Design;
}

export function DesignDetailPage({ design }: DesignDetailPageProps) {
  const { addToCart, cart, addToCompare, compareDesigns } = useAppStore();
  const isInCart = cart.some((c) => c.designId === design.id);
  const isInCompare = compareDesigns.some((d) => d.id === design.id);

  const handleAddToCart = () => {
    if (isInCart) {
      toast.info("Already in stitching orders");
      return;
    }
    addToCart({
      designId: design.id,
      designCode: design.designCode,
      designTitle: design.title,
      designImage: design.images[0] || "",
    });
    toast.success(`${design.designCode} added to stitching orders`);
  };

  const handleShare = async () => {
    const text = `✨ Design: ${design.designCode}\n${design.title}\n\nVishal Embroidery Works`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: design.title,
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
    addToCompare(design);
    toast.success(`${design.designCode} added to compare`);
  };

  const showCompareNow = compareDesigns.length === 2;

  return (
    <div className="min-h-full">
      {/* Image Slider */}
      <div className="w-full bg-black" style={{ height: "340px" }}>
        <ImageSlider
          images={design.images}
          alt={design.title}
          className="w-full h-full"
        />
      </div>

      {/* Design Info */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full tracking-wide">
                {design.designCode}
              </span>
              {design.isBridal && (
                <span className="inline-flex items-center bg-accent/20 text-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                  👑 Bridal
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground leading-snug">
              {design.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {SUBCATEGORY_LABELS[design.subcategory]}
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
          {isInCart ? "Added to Stitching Orders ✓" : "Add to Stitching Orders"}
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
                {design.designCode}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Category</span>
              <span className="text-xs font-semibold text-foreground capitalize">
                {design.category}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Images</span>
              <span className="text-xs font-semibold text-foreground">
                {design.images.filter(Boolean).length} photo
                {design.images.filter(Boolean).length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
