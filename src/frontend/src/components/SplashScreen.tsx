import { useEffect, useState } from "react";

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400); // wait for fade-out
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      data-ocid="splash.panel"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.45 0.18 15) 0%, oklch(0.35 0.14 10) 50%, oklch(0.28 0.10 350) 100%)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.97)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
          animationName: "fadeInUp",
          animationDuration: "0.7s",
          animationFillMode: "both",
        }}
        className="flex flex-col items-center gap-6 px-8"
      >
        {/* VEW Logo circle */}
        <div
          className="flex items-center justify-center rounded-full border-4 border-white/40"
          style={{
            width: 120,
            height: 120,
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: 2,
              fontFamily: "serif",
            }}
          >
            VEW
          </span>
        </div>

        {/* Brand name */}
        <div className="text-center">
          <p
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 1,
              lineHeight: 1.3,
            }}
          >
            Vishal Embroidery Works
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 13,
              marginTop: 4,
              letterSpacing: 0.5,
            }}
          >
            ವಿಶಾಲ್ ಎಂಬ್ರಾಯ್ಡರಿ ವರ್ಕ್ಸ್
          </p>
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: 60,
            height: 2,
            background: "rgba(255,255,255,0.35)",
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}
