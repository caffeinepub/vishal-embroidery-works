import { useRef, useState } from "react";

interface ImageSliderProps {
  images: string[];
  alt?: string;
  className?: string;
}

export function ImageSlider({
  images,
  alt = "Design image",
  className = "",
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [lastTap, setLastTap] = useState(0);
  const touchStartX = useRef(0);
  const lastDist = useRef(0);
  const isZooming = useRef(false);

  const validImages = images.filter(Boolean);
  if (validImages.length === 0) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-4xl">🧵</span>
      </div>
    );
  }

  const next = () => {
    if (currentIndex < validImages.length - 1) {
      setCurrentIndex((i) => i + 1);
      setScale(1);
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setScale(1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      isZooming.current = false;
    } else if (e.touches.length === 2) {
      isZooming.current = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isZooming.current = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastDist.current > 0) {
        const ratio = dist / lastDist.current;
        setScale((s) => Math.min(4, Math.max(1, s * ratio)));
      }
      lastDist.current = dist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isZooming.current) {
      lastDist.current = 0;
      isZooming.current = false;
      return;
    }
    if (scale > 1) return; // don't swipe when zoomed
    const diff =
      touchStartX.current -
      (e.changedTouches[0]?.clientX ?? touchStartX.current);
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      setScale((s) => (s === 1 ? 2.5 : 1));
    }
    setLastTap(now);
  };

  return (
    <div
      className={`relative overflow-hidden image-slider select-none bg-black ${className}`}
    >
      <div
        className="w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
        onKeyDown={() => {}}
        role="presentation"
      >
        <img
          src={validImages[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          className="w-full h-full object-contain zoom-img"
          style={{ transform: `scale(${scale})`, background: "black" }}
          draggable={false}
        />
      </div>

      {/* Dot indicators */}
      {validImages.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
          {validImages.map((imgSrc, i) => (
            <button
              type="button"
              key={imgSrc || `dot-${i}`}
              onClick={() => {
                setCurrentIndex(i);
                setScale(1);
              }}
              className={`rounded-full transition-all ${
                i === currentIndex
                  ? "w-5 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/60"
              }`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Swipe arrows (desktop fallback) */}
      {validImages.length > 1 && scale === 1 && (
        <>
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center text-lg z-10"
              aria-label="Previous image"
            >
              ‹
            </button>
          )}
          {currentIndex < validImages.length - 1 && (
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center text-lg z-10"
              aria-label="Next image"
            >
              ›
            </button>
          )}
        </>
      )}

      {/* Image count badge */}
      {validImages.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full z-10">
          {currentIndex + 1}/{validImages.length}
        </div>
      )}
    </div>
  );
}
