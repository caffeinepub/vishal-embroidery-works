import { Toaster } from "@/components/ui/sonner";
import { Heart, Home, Scissors, Sparkles, Users } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { Design } from "./backend.d";

import { AdminScreen } from "./components/screens/AdminScreen";
import { BlouseScreen } from "./components/screens/BlouseScreen";
import { CustomersScreen } from "./components/screens/CustomersScreen";
import { EmbroideryScreen } from "./components/screens/EmbroideryScreen";
import { FavouriteScreen } from "./components/screens/FavouriteScreen";
import { HomeScreen } from "./components/screens/HomeScreen";
import { SplashScreen } from "./components/screens/SplashScreen";
import { DesignDetailModal } from "./components/shared/DesignDetailModal";

type Tab = "home" | "embroidery" | "blouse" | "favourite" | "customers";

const NAV_ITEMS: {
  id: Tab;
  label: string;
  kannada: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "home",
    label: "Home",
    kannada: "ಮುಖಪುಟ",
    icon: <Home className="w-5 h-5" />,
  },
  {
    id: "embroidery",
    label: "Embroidery",
    kannada: "ಕಸೂತಿ",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: "blouse",
    label: "Blouse",
    kannada: "ಬ್ಲೌಸ್",
    icon: <Scissors className="w-5 h-5" />,
  },
  {
    id: "favourite",
    label: "Favourite",
    kannada: "ಮೆಚ್ಚಿನ",
    icon: <Heart className="w-5 h-5" />,
  },
  {
    id: "customers",
    label: "Customers",
    kannada: "ಗ್ರಾಹಕರು",
    icon: <Users className="w-5 h-5" />,
  },
];

// Long-press duration in ms before admin panel opens
const LONG_PRESS_MS = 5000;

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // Hidden admin panel — opened only via 5-second long press on VEW button
  const [showAdmin, setShowAdmin] = useState(false);

  // Long-press state for VEW button
  const [isPressingVEW, setIsPressingVEW] = useState(false);
  const [pressProgress, setPressProgress] = useState(0); // 0-100
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const pressStartRef = useRef<number>(0);

  const startLongPress = useCallback(() => {
    setIsPressingVEW(true);
    setPressProgress(0);
    pressStartRef.current = Date.now();

    // Animate progress
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - pressStartRef.current;
      const pct = Math.min((elapsed / LONG_PRESS_MS) * 100, 100);
      setPressProgress(pct);
    }, 50);

    // Fire after LONG_PRESS_MS
    pressTimerRef.current = setTimeout(() => {
      clearInterval(progressIntervalRef.current!);
      setIsPressingVEW(false);
      setPressProgress(0);
      setShowAdmin(true);
    }, LONG_PRESS_MS);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setIsPressingVEW(false);
    setPressProgress(0);
  }, []);

  const handleDesignClick = (design: Design) => {
    setSelectedDesign(design);
    setDetailOpen(true);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const screenTitle: Record<Tab, { en: string; kn: string }> = {
    home: { en: "VEW", kn: "ವಿಶಾಲ್ ಎಂಬ್ರಾಯ್ಡರಿ" },
    embroidery: { en: "Embroidery", kn: "ಕಸೂತಿ" },
    blouse: { en: "Blouse", kn: "ಬ್ಲೌಸ್" },
    favourite: { en: "Favourites", kn: "ಮೆಚ್ಚಿನವು" },
    customers: { en: "Customers", kn: "ಗ್ರಾಹಕರು" },
  };

  const showHeader = activeTab !== "home";

  // Admin panel overlay — renders full-screen on top of the main app
  if (showAdmin && !showSplash) {
    return (
      <>
        <div className="w-full max-w-[430px] mx-auto min-h-screen bg-background flex flex-col relative overflow-hidden">
          <AdminScreen onBack={() => setShowAdmin(false)} />
        </div>
        <Toaster
          position="top-center"
          toastOptions={{ classNames: { toast: "rounded-xl shadow-card" } }}
        />
      </>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <div className="w-full max-w-[430px] mx-auto min-h-screen bg-background flex flex-col relative overflow-hidden">
        {showHeader && (
          <header className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/60 bg-white/95 backdrop-blur-sm flex-shrink-0 sticky top-0 z-30">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-vew-sky flex items-center justify-center flex-shrink-0 relative">
              <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] font-extrabold z-0 select-none">
                VEW
              </span>
              <img
                src="/assets/generated/vew-logo.dim_200x200.png"
                alt="VEW"
                className="w-full h-full object-contain p-0.5 absolute inset-0 z-10"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div>
              <h1 className="text-sm font-bold text-vew-navy leading-tight">
                {screenTitle[activeTab].en}
              </h1>
              <p className="text-[10px] text-vew-sky leading-tight">
                {screenTitle[activeTab].kn}
              </p>
            </div>
          </header>
        )}

        {activeTab === "home" && !showSplash && (
          <header className="flex items-center justify-between px-4 pt-4 pb-3 bg-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-vew-sky flex items-center justify-center relative">
                <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-extrabold z-0 select-none">
                  VEW
                </span>
                <img
                  src="/assets/generated/vew-logo.dim_200x200.png"
                  alt="VEW"
                  className="w-full h-full object-contain p-0.5 absolute inset-0 z-10"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Welcome to
                </p>
                <h1 className="text-sm font-bold text-vew-navy leading-tight">
                  Vishal Embroidery Works
                </h1>
              </div>
            </div>

            {/* VEW button — hidden admin access point.
                Long press for 5 seconds to open admin login.
                Normal tap does nothing visible to users. */}
            <button
              type="button"
              data-ocid="home.admin_access.button"
              onMouseDown={startLongPress}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={startLongPress}
              onTouchEnd={cancelLongPress}
              onTouchCancel={cancelLongPress}
              onContextMenu={(e) => e.preventDefault()}
              className="relative bg-vew-sky-light text-vew-sky text-[10px] font-bold px-2 py-0.5 rounded-full overflow-hidden select-none"
              aria-label="VEW"
              style={{ WebkitUserSelect: "none" }}
            >
              {/* Progress ring fill while pressing */}
              {isPressingVEW && (
                <span
                  className="absolute inset-0 bg-vew-sky/30 rounded-full"
                  style={{
                    width: `${pressProgress}%`,
                    transition: "width 50ms linear",
                  }}
                />
              )}
              <span className="relative z-10">VEW</span>
            </button>
          </header>
        )}

        {!showSplash && (
          <main className="flex-1 flex flex-col overflow-hidden pb-[64px]">
            {activeTab === "home" && (
              <HomeScreen
                onDesignClick={handleDesignClick}
                onNavigate={handleTabChange}
              />
            )}
            {activeTab === "embroidery" && (
              <EmbroideryScreen onDesignClick={handleDesignClick} />
            )}
            {activeTab === "blouse" && (
              <BlouseScreen onDesignClick={handleDesignClick} />
            )}
            {activeTab === "favourite" && (
              <FavouriteScreen onDesignClick={handleDesignClick} />
            )}
            {activeTab === "customers" && <CustomersScreen />}
          </main>
        )}

        {!showSplash && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border/60 shadow-nav z-40 pb-safe">
            <div className="flex items-stretch">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-ocid={`${item.id}.tab`}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all duration-200 relative min-h-[60px] ${
                      isActive
                        ? "text-vew-sky"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isActive && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-vew-sky rounded-b-full" />
                    )}
                    <span
                      className={`transition-transform duration-200 ${isActive ? "scale-110" : "scale-100"}`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-[8px] font-medium leading-tight">
                      {item.label}
                    </span>
                    <span
                      className={`text-[7px] leading-tight ${isActive ? "text-vew-sky/70" : "text-muted-foreground/60"}`}
                    >
                      {item.kannada}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      <DesignDetailModal
        design={selectedDesign}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedDesign(null);
        }}
      />

      <Toaster
        position="top-center"
        toastOptions={{ classNames: { toast: "rounded-xl shadow-card" } }}
      />
    </>
  );
}
