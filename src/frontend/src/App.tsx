import { Toaster } from "@/components/ui/sonner";
import {
  Heart,
  Home,
  Phone,
  Scissors,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { Design } from "./backend.d";

import { AdminScreen } from "./components/screens/AdminScreen";
import { BlouseScreen } from "./components/screens/BlouseScreen";
import { ContactScreen } from "./components/screens/ContactScreen";
import { CustomersScreen } from "./components/screens/CustomersScreen";
import { EmbroideryScreen } from "./components/screens/EmbroideryScreen";
import { FavouriteScreen } from "./components/screens/FavouriteScreen";
import { HomeScreen } from "./components/screens/HomeScreen";
import { SplashScreen } from "./components/screens/SplashScreen";
import { DesignDetailModal } from "./components/shared/DesignDetailModal";

type Tab =
  | "home"
  | "embroidery"
  | "blouse"
  | "favourite"
  | "customers"
  | "contact"
  | "admin";

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
  {
    id: "contact",
    label: "Contact",
    kannada: "ಸಂಪರ್ಕ",
    icon: <Phone className="w-5 h-5" />,
  },
  {
    id: "admin",
    label: "Admin",
    kannada: "ಅಡ್ಮಿನ್",
    icon: <Shield className="w-5 h-5" />,
  },
];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
    contact: { en: "Contact", kn: "ಸಂಪರ್ಕ" },
    admin: { en: "Admin Panel", kn: "ಅಡ್ಮಿನ್" },
  };

  const showHeader = activeTab !== "home" && activeTab !== "admin";

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
            <div className="flex items-center gap-1">
              <span className="bg-vew-sky-light text-vew-sky text-[10px] font-bold px-2 py-0.5 rounded-full">
                VEW
              </span>
            </div>
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
            {activeTab === "contact" && (
              <ContactScreen onAdminClick={() => setActiveTab("admin")} />
            )}
            {activeTab === "admin" && (
              <AdminScreen onBack={() => setActiveTab("home")} />
            )}
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
