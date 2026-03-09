import { useRef, useState } from "react";

interface ImageSliderProps {
  images: string[];
  alt?: string;
  className?: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export function ImageSlider({
  images,
  alt = "Design image",
  className = "",
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  // Track whether we are actively gesturing (no CSS transition while moving)
  const [isGesturing, setIsGesturing] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const translateXAtDragStart = useRef(0);
  const translateYAtDragStart = useRef(0);
  const lastDist = useRef(0);
  const lastScaleRef = useRef(1);
  const isZooming = useRef(false);
  const lastTapTime = useRef(0);
  const didDrag = useRef(false);

  const validImages = images.filter(Boolean);
  if (validImages.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ background: "#111" }}
      >
        <span className="text-4xl">🧵</span>
      </div>
    );
  }

  const resetZoom = (smooth = true) => {
    setIsGesturing(!smooth);
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    lastScaleRef.current = 1;
  };

  const goNext = () => {
    if (currentIndex < validImages.length - 1) {
      setCurrentIndex((i) => i + 1);
      resetZoom(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      resetZoom(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    didDrag.current = false;

    if (e.touches.length === 2) {
      // Pinch start
      isZooming.current = true;
      setIsGesturing(true);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1) {
      isZooming.current = false;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      dragStartX.current = e.touches[0].clientX;
      dragStartY.current = e.touches[0].clientY;
      translateXAtDragStart.current = translateX;
      translateYAtDragStart.current = translateY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      isZooming.current = true;
      setIsGesturing(true);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastDist.current > 0) {
        const ratio = dist / lastDist.current;
        setScale((s) => {
          const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * ratio));
          lastScaleRef.current = next;
          // If scale returned to 1, reset position
          if (next <= 1) {
            setTranslateX(0);
            setTranslateY(0);
          }
          return next;
        });
      }
      lastDist.current = dist;
    } else if (e.touches.length === 1 && lastScaleRef.current > 1) {
      // Drag while zoomed
      didDrag.current = true;
      setIsGesturing(true);
      const dx = e.touches[0].clientX - dragStartX.current;
      const dy = e.touches[0].clientY - dragStartY.current;
      setTranslateX(translateXAtDragStart.current + dx);
      setTranslateY(translateYAtDragStart.current + dy);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsGesturing(false);

    if (isZooming.current) {
      lastDist.current = 0;
      isZooming.current = false;
      // Snap back to 1 if scale is very close
      setScale((s) => {
        if (s <= 1.05) {
          setTranslateX(0);
          setTranslateY(0);
          lastScaleRef.current = 1;
          return 1;
        }
        return s;
      });
      return;
    }

    // Skip swipe detection if we dragged while zoomed
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }

    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
    const diffX = touchStartX.current - endX;
    const diffY = touchStartY.current - endY;

    // Double-tap detection
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    const isSmallMove = Math.abs(diffX) < 10 && Math.abs(diffY) < 10;

    if (isSmallMove && timeSinceLastTap < 300) {
      // Double tap — toggle zoom
      lastTapTime.current = 0;
      if (lastScaleRef.current > 1) {
        resetZoom(true);
      } else {
        const newScale = 2.5;
        lastScaleRef.current = newScale;
        setScale(newScale);
        setIsGesturing(false);
      }
      return;
    }

    if (isSmallMove) {
      lastTapTime.current = now;
      return;
    }

    // Swipe to change image — only at 1x zoom
    if (lastScaleRef.current <= 1) {
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) goNext();
        else goPrev();
      }
    }
  };

  const transition = isGesturing ? "none" : "transform 0.15s ease-out";

  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
      style={{ background: "#111", touchAction: "none" }}
    >
      {/* Image container */}
      <div
        className="w-full h-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="presentation"
        style={{ touchAction: "none" }}
      >
        <img
          src={validImages[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          className="w-full h-full"
          style={{
            objectFit: "contain",
            objectPosition: "center",
            display: "block",
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            transformOrigin: "center",
            transition,
            willChange: "transform",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          draggable={false}
        />
      </div>

      {/* Dot indicators */}
      {validImages.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
          {validImages.map((imgSrc, i) => (
            <div
              key={imgSrc}
              className={`rounded-full transition-all ${
                i === currentIndex
                  ? "w-5 h-2 bg-white shadow-sm"
                  : "w-2 h-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

      {/* Arrow buttons — desktop / tap, only at 1x zoom */}
      {validImages.length > 1 && scale === 1 && (
        <>
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center text-lg z-10 border border-white/20"
              aria-label="Previous image"
            >
              ‹
            </button>
          )}
          {currentIndex < validImages.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center text-lg z-10 border border-white/20"
              aria-label="Next image"
            >
              ›
            </button>
          )}
        </>
      )}

      {/* Image count badge */}
      {validImages.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full z-10 font-medium">
          {currentIndex + 1}/{validImages.length}
        </div>
      )}
    </div>
  );
}
