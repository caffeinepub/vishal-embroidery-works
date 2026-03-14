import { useCallback, useState } from "react";
import { AdminPINScreen } from "./components/AdminPINScreen";
import { BottomNav } from "./components/BottomNav";
import { SplashScreen } from "./components/SplashScreen";
import { TopBar } from "./components/TopBar";
import { AdminPanel } from "./components/admin/AdminPanel";
import { Toaster } from "./components/ui/sonner";
import { useDesigns } from "./hooks/useFirestore";
import type { Design } from "./lib/storage";
import { BlousePage } from "./pages/BlousePage";
import { BridalPage } from "./pages/BridalPage";
import { DesignDetailPage } from "./pages/DesignDetailPage";
import { EmbroideryPage } from "./pages/EmbroideryPage";
import { HomePage } from "./pages/HomePage";
import { StitchingOrdersPage } from "./pages/StitchingOrdersPage";
import { type ActiveTab, useAppStore } from "./store/appStore";

type PageEntry =
  | { page: "home" }
  | { page: "embroidery" }
  | { page: "blouse" }
  | { page: "bridal" }
  | { page: "orders" }
  | {
      page: "design-detail";
      design: Design;
      designs: Design[];
      initialIndex: number;
    };

export default function App() {
  const { setActiveTab, isAdminOpen, isAdminAuthenticated } = useAppStore();
  const [pageStack, setPageStack] = useState<PageEntry[]>([{ page: "home" }]);
  const [showSplash, setShowSplash] = useState(true);
  const { data: _allDesigns } = useDesigns();

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

  const renderContent = () => {
    switch (currentPage.page) {
      case "home":
        return (
          <HomePage
            onNavigate={handleTabChange}
            onSelectDesign={handleSelectDesign}
          />
        );

      case "embroidery":
        return <EmbroideryPage onSelectDesign={handleSelectDesign} />;

      case "blouse":
        return <BlousePage onSelectDesign={handleSelectDesign} />;

      case "bridal":
        return <BridalPage onSelectDesign={handleSelectDesign} />;

      case "orders":
        return <StitchingOrdersPage />;

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
          />
        );
      }

      default:
        return (
          <HomePage
            onNavigate={handleTabChange}
            onSelectDesign={handleSelectDesign}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      <TopBar title={getPageTitle()} showBack={showBack} onBack={goBack} />

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

      <BottomNav onTabChange={handleTabChange} />

      {isAdminOpen && !isAdminAuthenticated && <AdminPINScreen />}
      {isAdminOpen && isAdminAuthenticated && <AdminPanel />}

      <Toaster position="top-center" richColors />
    </div>
  );
}
