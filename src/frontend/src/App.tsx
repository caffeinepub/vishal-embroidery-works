import { useCallback, useState } from "react";
import { AdminPINScreen } from "./components/AdminPINScreen";
import { BottomNav } from "./components/BottomNav";
import { CompareModal } from "./components/CompareModal";
import { SplashScreen } from "./components/SplashScreen";
import { TopBar } from "./components/TopBar";
import { AdminPanel } from "./components/admin/AdminPanel";
import { Toaster } from "./components/ui/sonner";
import { useDesigns } from "./hooks/useFirestore";
import type { Design, TrialRoomItem } from "./lib/storage";
import { BlousePage } from "./pages/BlousePage";
import { BridalPage } from "./pages/BridalPage";
import { DesignDetailPage } from "./pages/DesignDetailPage";
import { EmbroideryPage } from "./pages/EmbroideryPage";
import { HomePage } from "./pages/HomePage";
import { StitchingOrdersPage } from "./pages/StitchingOrdersPage";
import { TrialRoomPage } from "./pages/TrialRoomPage";
import { VirtualTrialRoomPage } from "./pages/VirtualTrialRoomPage";
import { type ActiveTab, useAppStore } from "./store/appStore";

// Page stack navigation
type PageEntry =
  | { page: "home" }
  | { page: "embroidery" }
  | { page: "blouse" }
  | { page: "bridal" }
  | { page: "orders" }
  | { page: "trial-room" }
  | { page: "virtual-trial-room"; initialDesign?: Design }
  | {
      page: "design-detail";
      design: Design;
      designs: Design[];
      initialIndex: number;
    };

export default function App() {
  const { setActiveTab, isAdminOpen, isAdminAuthenticated, compareDesigns } =
    useAppStore();
  const [pageStack, setPageStack] = useState<PageEntry[]>([{ page: "home" }]);
  const [showSplash, setShowSplash] = useState(true);
  const { data: allDesigns } = useDesigns();

  const currentPage = pageStack[pageStack.length - 1];

  const navigate = useCallback((entry: PageEntry) => {
    setPageStack((prev) => [...prev, entry]);
  }, []);

  const goBack = useCallback(() => {
    setPageStack((prev) => {
      if (prev.length > 1) return prev.slice(0, -1);
      return prev;
    });
  }, []);

  const handleTabChange = useCallback(
    (tab: ActiveTab) => {
      setActiveTab(tab);
      setPageStack([{ page: tab } as PageEntry]);
    },
    [setActiveTab],
  );

  const handleSelectDesign = useCallback(
    (design: Design, designs: Design[], index: number) => {
      navigate({ page: "design-detail", design, designs, initialIndex: index });
    },
    [navigate],
  );

  const handleNavigateTrialRoom = useCallback(() => {
    navigate({ page: "trial-room" });
  }, [navigate]);

  const handleOpenVirtualTrial = useCallback(
    (initialDesign?: Design) => {
      navigate({ page: "virtual-trial-room", initialDesign });
    },
    [navigate],
  );

  const handleAddToVirtualTrialRoom = useCallback(
    (design: Design) => {
      navigate({ page: "virtual-trial-room", initialDesign: design });
    },
    [navigate],
  );

  const handlePreviewTrialItem = useCallback(
    (item: TrialRoomItem) => {
      const design = allDesigns.find((d) => d.id === item.id);
      if (design) {
        navigate({
          page: "design-detail",
          design,
          designs: allDesigns,
          initialIndex: allDesigns.indexOf(design),
        });
      }
    },
    [allDesigns, navigate],
  );

  // Page title for TopBar
  const getPageTitle = (): string => {
    switch (currentPage.page) {
      case "home":
        return "Vishal Embroidery Works";
      case "embroidery":
        return "Embroidery";
      case "blouse":
        return "Blouse Designs";
      case "bridal":
        return "Bridal Collection";
      case "orders":
        return "Stitching Orders";
      case "trial-room":
        return "Trial Room";
      case "virtual-trial-room":
        return "Virtual Trial Room";
      case "design-detail":
        return (
          currentPage as {
            page: "design-detail";
            design: Design;
            designs: Design[];
            initialIndex: number;
          }
        ).design.designCode;
      default:
        return "Vishal Embroidery Works";
    }
  };

  const showBack = pageStack.length > 1;

  // Render current page content
  const renderContent = () => {
    switch (currentPage.page) {
      case "home":
        return (
          <HomePage
            onNavigate={handleTabChange}
            onSelectDesign={handleSelectDesign}
            onOpenVirtualTrial={() => handleOpenVirtualTrial()}
          />
        );

      case "embroidery":
        return (
          <EmbroideryPage
            onSelectDesign={handleSelectDesign}
            onAddToTrialRoom={handleAddToVirtualTrialRoom}
          />
        );

      case "blouse":
        return (
          <BlousePage
            onSelectDesign={handleSelectDesign}
            onAddToTrialRoom={handleAddToVirtualTrialRoom}
          />
        );

      case "bridal":
        return (
          <BridalPage
            onSelectDesign={handleSelectDesign}
            onAddToTrialRoom={handleAddToVirtualTrialRoom}
          />
        );

      case "orders":
        return <StitchingOrdersPage />;

      case "trial-room":
        return <TrialRoomPage onPreviewDesign={handlePreviewTrialItem} />;

      case "virtual-trial-room": {
        const p = currentPage as {
          page: "virtual-trial-room";
          initialDesign?: Design;
        };
        return (
          <VirtualTrialRoomPage
            onBack={goBack}
            initialDesign={p.initialDesign}
          />
        );
      }

      case "design-detail": {
        const p = currentPage as {
          page: "design-detail";
          design: Design;
          designs: Design[];
          initialIndex: number;
        };
        return (
          <DesignDetailPage
            design={p.design}
            designs={p.designs}
            initialIndex={p.initialIndex}
            onAddToTrialRoom={handleAddToVirtualTrialRoom}
          />
        );
      }

      default:
        return (
          <HomePage
            onNavigate={handleTabChange}
            onSelectDesign={handleSelectDesign}
            onOpenVirtualTrial={() => handleOpenVirtualTrial()}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Splash Screen */}
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      {/* Top Bar */}
      <TopBar
        title={getPageTitle()}
        showBack={showBack}
        onBack={goBack}
        onNavigateTrialRoom={handleNavigateTrialRoom}
      />

      {/* Main Content */}
      <main
        className="overflow-auto"
        style={{
          paddingTop: "56px",
          paddingBottom: "60px",
          minHeight: "100vh",
        }}
      >
        {renderContent()}
      </main>

      {/* Bottom Nav */}
      <BottomNav onTabChange={handleTabChange} />

      {/* Admin PIN Screen */}
      {isAdminOpen && !isAdminAuthenticated && <AdminPINScreen />}

      {/* Admin Panel */}
      {isAdminOpen && isAdminAuthenticated && <AdminPanel />}

      {/* Compare Modal */}
      {compareDesigns.length === 2 && <CompareModal />}

      {/* Toast notifications */}
      <Toaster position="top-center" richColors />
    </div>
  );
}
