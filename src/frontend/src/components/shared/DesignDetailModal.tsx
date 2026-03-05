import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Heart,
  Loader2,
  MessageCircle,
  Scissors,
  Share2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Design } from "../../backend.d";
import { useCreateMeasurement } from "../../hooks/useQueries";
import { getFavourites, toggleFavourite } from "../../lib/favourites";
import { addRecentlyViewed } from "../../lib/recentlyViewed";

interface DesignDetailModalProps {
  design: Design | null;
  open: boolean;
  onClose: () => void;
}

// ─── Image Swiper with Pinch/Zoom ────────────────────────────────────────────

interface ImageSwiperProps {
  images: string[];
  designCode: string;
}

function ImageSwiper({ images, designCode }: ImageSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  // Touch state refs (avoid re-renders during gesture)
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastTapTime = useRef(0);
  const lastTapX = useRef(0);
  const lastTapY = useRef(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartTransX = useRef(0);
  const dragStartTransY = useRef(0);

  // Pinch state
  const initialPinchDistance = useRef(0);
  const initialPinchScale = useRef(1);
  const isPinching = useRef(false);
  const scaleRef = useRef(1);
  const translateXRef = useRef(0);
  const translateYRef = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => {
    scaleRef.current = scale;
    translateXRef.current = translateX;
    translateYRef.current = translateY;
  }, [scale, translateX, translateY]);

  // Reset zoom when image changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: currentIndex is the intentional trigger for zoom reset
  useEffect(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    scaleRef.current = 1;
    translateXRef.current = 0;
    translateYRef.current = 0;
  }, [currentIndex]);

  const clampTranslate = (tx: number, ty: number, s: number) => {
    if (!containerRef.current) return { tx, ty };
    const w = containerRef.current.offsetWidth;
    const h = containerRef.current.offsetHeight;
    const maxX = (w * (s - 1)) / 2;
    const maxY = (h * (s - 1)) / 2;
    return {
      tx: Math.max(-maxX, Math.min(maxX, tx)),
      ty: Math.max(-maxY, Math.min(maxY, ty)),
    };
  };

  const getPinchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      isPinching.current = true;
      initialPinchDistance.current = getPinchDistance(e.touches);
      initialPinchScale.current = scaleRef.current;
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();
      const timeDiff = now - lastTapTime.current;

      // Double tap detection
      if (
        timeDiff < 300 &&
        Math.abs(touch.clientX - lastTapX.current) < 30 &&
        Math.abs(touch.clientY - lastTapY.current) < 30
      ) {
        // Double tap: toggle zoom
        if (scaleRef.current > 1) {
          setScale(1);
          setTranslateX(0);
          setTranslateY(0);
        } else {
          // Zoom to 2x at tap point
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const tapX = touch.clientX - rect.left - rect.width / 2;
            const tapY = touch.clientY - rect.top - rect.height / 2;
            const newTx = -tapX;
            const newTy = -tapY;
            const clamped = clampTranslate(newTx, newTy, 2);
            setScale(2);
            setTranslateX(clamped.tx);
            setTranslateY(clamped.ty);
          }
        }
        lastTapTime.current = 0; // reset
        return;
      }

      lastTapTime.current = now;
      lastTapX.current = touch.clientX;
      lastTapY.current = touch.clientY;

      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;

      if (scaleRef.current > 1) {
        // Start drag when zoomed
        isDragging.current = true;
        dragStartX.current = touch.clientX;
        dragStartY.current = touch.clientY;
        dragStartTransX.current = translateXRef.current;
        dragStartTransY.current = translateYRef.current;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching.current) {
      e.preventDefault();
      const dist = getPinchDistance(e.touches);
      const ratio = dist / initialPinchDistance.current;
      const newScale = Math.max(
        1,
        Math.min(4, initialPinchScale.current * ratio),
      );
      const clamped = clampTranslate(
        translateXRef.current,
        translateYRef.current,
        newScale,
      );
      setScale(newScale);
      setTranslateX(clamped.tx);
      setTranslateY(clamped.ty);
      return;
    }

    if (e.touches.length === 1 && isDragging.current && scaleRef.current > 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartX.current;
      const dy = touch.clientY - dragStartY.current;
      const newTx = dragStartTransX.current + dx;
      const newTy = dragStartTransY.current + dy;
      const clamped = clampTranslate(newTx, newTy, scaleRef.current);
      setTranslateX(clamped.tx);
      setTranslateY(clamped.ty);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPinching.current) {
      isPinching.current = false;
      // Snap to 1x if scale is very close
      if (scaleRef.current < 1.05) {
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
      }
      return;
    }

    if (isDragging.current) {
      isDragging.current = false;
      return;
    }

    // Swipe to navigate (only when not zoomed)
    if (scaleRef.current <= 1 && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX.current;
      const dy = Math.abs(touch.clientY - touchStartY.current);

      if (Math.abs(dx) > 50 && dy < 60) {
        if (dx < 0 && currentIndex < images.length - 1) {
          setCurrentIndex((i) => i + 1);
        } else if (dx > 0 && currentIndex > 0) {
          setCurrentIndex((i) => i - 1);
        }
      }
    }
  };

  const currentImage = images[currentIndex] ?? "";

  return (
    <div className="relative w-full aspect-square bg-vew-sky-light/30 select-none overflow-hidden">
      {/* Image container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: scale > 1 ? "none" : "pan-y" }}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt={`${designCode} - ${currentIndex + 1} of ${images.length}`}
            className="w-full h-full object-cover"
            style={{
              transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
              transformOrigin: "center center",
              transition:
                isPinching.current || isDragging.current
                  ? "none"
                  : "transform 0.2s ease",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <svg
                aria-label="No design image"
                role="img"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-vew-sky opacity-30 mx-auto mb-2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <p className="text-sm text-muted-foreground">No Image</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation arrows (only when not zoomed and multiple images) */}
      {images.length > 1 && scale <= 1 && (
        <>
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              aria-label="Previous image"
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              aria-label="Next image"
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Zoom hint */}
      {scale > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
          Double tap to reset
        </div>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: dot indicators are positional
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === currentIndex ? "bg-white w-3" : "bg-white/50"
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Design Detail Modal ──────────────────────────────────────────────────────

export function DesignDetailModal({
  design,
  open,
  onClose,
}: DesignDetailModalProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [bookName, setBookName] = useState("");
  const [bookPhone, setBookPhone] = useState("");
  const [bookBust, setBookBust] = useState("");
  const [bookWaist, setBookWaist] = useState("");
  const [bookShoulder, setBookShoulder] = useState("");
  const [bookSleeve, setBookSleeve] = useState("");
  const [bookNeck, setBookNeck] = useState("");
  const [bookBlouseLength, setBookBlouseLength] = useState("");

  const createMeasurement = useCreateMeasurement();

  useEffect(() => {
    if (design && open) {
      setIsFav(getFavourites().includes(design.id.toString()));
      addRecentlyViewed(design.id.toString());
    }
  }, [design, open]);

  if (!design) return null;

  const images = design.imageUrls ?? [];

  const handleToggleFav = () => {
    if (!design) return;
    const newState = toggleFavourite(design.id.toString());
    setIsFav(newState);
    toast.success(
      newState
        ? "Added to Favourites / ಮೆಚ್ಚಿನವುಗಳಿಗೆ ಸೇರಿಸಲಾಗಿದೆ"
        : "Removed from Favourites / ಮೆಚ್ಚಿನವುಗಳಿಂದ ತೆಗೆದಿದ್ದೇವೆ",
    );
  };

  const handleWhatsApp = () => {
    const text = `Design: ${design.designCode}, Category: ${design.category}, Work Type: ${design.workType}`;
    const url = `https://wa.me/917353315706?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleShare = async () => {
    const shareData = {
      title: `Design: ${design.designCode}`,
      text: `Check out this design from Vishal Embroidery Works! Design Code: ${design.designCode}, Category: ${design.category}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      const text = `Design: ${design.designCode}, Category: ${design.category}`;
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard / ಕ್ಲಿಪ್‌ಬೋರ್ಡ್‌ಗೆ ನಕಲಿಸಲಾಗಿದೆ");
      } catch {
        toast.error("Could not share");
      }
    }
  };

  const handleBookStitching = async () => {
    if (!bookName.trim() || !bookPhone.trim()) {
      toast.error("Please enter name and phone number");
      return;
    }
    try {
      await createMeasurement.mutateAsync({
        name: bookName,
        phone: bookPhone,
        bust: bookBust,
        waist: bookWaist,
        shoulder: bookShoulder,
        sleeveLength: bookSleeve,
        neck: bookNeck,
        blouseLength: bookBlouseLength,
      });
      toast.success("Booking confirmed! / ಬುಕಿಂಗ್ ದೃಢಪಡಿಸಲಾಗಿದೆ!");
      setBookingOpen(false);
      setBookName("");
      setBookPhone("");
      setBookBust("");
      setBookWaist("");
      setBookShoulder("");
      setBookSleeve("");
      setBookNeck("");
      setBookBlouseLength("");
    } catch {
      toast.error("Booking failed. Please try again.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[95vh] p-0 rounded-t-2xl overflow-hidden flex flex-col"
        data-ocid="design.detail.modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back / ಹಿಂದೆ</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Image Swiper with pinch/zoom */}
          <div className="relative">
            <ImageSwiper images={images} designCode={design.designCode} />
            {/* Tags overlay */}
            <div className="absolute top-3 left-3 flex gap-2 pointer-events-none">
              {design.isTrending && (
                <Badge className="bg-vew-sky text-white border-0 text-xs">
                  🔥 Trending
                </Badge>
              )}
              {design.isBridal && (
                <Badge className="bg-pink-500 text-white border-0 text-xs">
                  👰 Bridal
                </Badge>
              )}
            </div>
          </div>

          {/* Design Info */}
          <div className="px-4 py-4">
            {/* Design Code */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-bold text-vew-navy">
                  {design.designCode}
                </h2>
                <SheetTitle className="sr-only">{design.designCode}</SheetTitle>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-vew-sky-light/50 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Category / ವರ್ಗ
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {design.category}
                </p>
              </div>
              <div className="bg-vew-sky-light/50 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Work Type / ಕೆಲಸದ ವಿಧ
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {design.workType || "—"}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-vew-sky to-vew-sky-dark rounded-xl p-4 mb-5">
              <p className="text-white/80 text-xs mb-1">Price / ಬೆಲೆ</p>
              <p className="text-white text-lg font-bold">
                Ask in Shop / ಅಂಗಡಿಯಲ್ಲಿ ಕೇಳಿ
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button
                data-ocid="design.detail.book_button"
                onClick={() => setBookingOpen(true)}
                className="bg-vew-sky text-white hover:bg-vew-sky-dark h-12 rounded-xl font-semibold text-sm flex flex-col gap-0.5"
              >
                <Scissors className="w-4 h-4" />
                <span className="text-[10px] leading-tight">
                  Book Stitching
                </span>
                <span className="text-[9px] opacity-80 leading-tight">
                  ಹೊಲಿಗೆ ಬುಕ್ ಮಾಡಿ
                </span>
              </Button>

              <Button
                data-ocid="design.detail.whatsapp_button"
                onClick={handleWhatsApp}
                className="bg-green-500 text-white hover:bg-green-600 h-12 rounded-xl font-semibold text-sm flex flex-col gap-0.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-[10px] leading-tight">WhatsApp</span>
                <span className="text-[9px] opacity-80 leading-tight">
                  ವಾಟ್ಸ್ಆಪ್
                </span>
              </Button>

              <Button
                data-ocid="design.detail.share_button"
                onClick={handleShare}
                variant="outline"
                className="border-vew-sky text-vew-sky hover:bg-vew-sky-light h-12 rounded-xl font-semibold text-sm flex flex-col gap-0.5"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-[10px] leading-tight">Share Design</span>
                <span className="text-[9px] opacity-80 leading-tight">
                  ಡಿಸೈನ್ ಶೇರ್
                </span>
              </Button>

              <Button
                data-ocid="design.detail.favourite_button"
                onClick={handleToggleFav}
                variant="outline"
                className={`h-12 rounded-xl font-semibold text-sm flex flex-col gap-0.5 transition-all ${
                  isFav
                    ? "border-pink-500 text-pink-500 bg-pink-50 hover:bg-pink-100"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isFav ? "fill-pink-500 text-pink-500" : ""}`}
                />
                <span className="text-[10px] leading-tight">
                  {isFav ? "Unfavourite" : "Favourite"}
                </span>
                <span className="text-[9px] opacity-80 leading-tight">
                  {isFav ? "ತೆಗೆದುಹಾಕಿ" : "ಮೆಚ್ಚಿನವು"}
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Booking Sheet (nested) */}
        {bookingOpen && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col rounded-t-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 flex-shrink-0">
              <h3 className="font-bold text-vew-navy">
                Book Stitching / ಹೊಲಿಗೆ ಬುಕ್ ಮಾಡಿ
              </h3>
              <button
                type="button"
                onClick={() => setBookingOpen(false)}
                data-ocid="design.detail.cancel_button"
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              <p className="text-xs text-muted-foreground mb-2">
                Design: <strong>{design.designCode}</strong>
              </p>

              <div>
                <Label className="text-xs mb-1 block">Name / ಹೆಸರು *</Label>
                <Input
                  data-ocid="booking.name.input"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  placeholder="Customer name"
                  className="h-10 text-sm rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs mb-1 block">Phone / ಫೋನ್ *</Label>
                <Input
                  data-ocid="booking.phone.input"
                  value={bookPhone}
                  onChange={(e) => setBookPhone(e.target.value)}
                  placeholder="Phone number"
                  type="tel"
                  className="h-10 text-sm rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Bust / ಎದೆ</Label>
                  <Input
                    value={bookBust}
                    onChange={(e) => setBookBust(e.target.value)}
                    placeholder="e.g. 36"
                    className="h-10 text-sm rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Waist / ಸೊಂಟ</Label>
                  <Input
                    value={bookWaist}
                    onChange={(e) => setBookWaist(e.target.value)}
                    placeholder="e.g. 28"
                    className="h-10 text-sm rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Shoulder / ಭುಜ</Label>
                  <Input
                    value={bookShoulder}
                    onChange={(e) => setBookShoulder(e.target.value)}
                    placeholder="e.g. 13"
                    className="h-10 text-sm rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Sleeve / ತೋಳಿನ ಉದ್ದ</Label>
                  <Input
                    value={bookSleeve}
                    onChange={(e) => setBookSleeve(e.target.value)}
                    placeholder="e.g. 22"
                    className="h-10 text-sm rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Neck / ಕುತ್ತಿಗೆ</Label>
                  <Input
                    value={bookNeck}
                    onChange={(e) => setBookNeck(e.target.value)}
                    placeholder="e.g. 14"
                    className="h-10 text-sm rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">
                    Blouse Length / ಬ್ಲೌಸ್ ಉದ್ದ
                  </Label>
                  <Input
                    value={bookBlouseLength}
                    onChange={(e) => setBookBlouseLength(e.target.value)}
                    placeholder="e.g. 15"
                    className="h-10 text-sm rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="px-4 py-4 border-t border-border/60 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setBookingOpen(false)}
                data-ocid="booking.cancel_button"
                className="flex-1 h-12 rounded-xl"
              >
                Cancel / ರದ್ದು
              </Button>
              <Button
                data-ocid="booking.submit_button"
                onClick={handleBookStitching}
                disabled={createMeasurement.isPending}
                className="flex-1 h-12 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark"
              >
                {createMeasurement.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin w-4 h-4" />
                    Booking...
                  </span>
                ) : (
                  "Confirm / ದೃಢಪಡಿಸಿ"
                )}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
