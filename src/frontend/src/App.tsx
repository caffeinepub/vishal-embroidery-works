import { useCallback, useState } from "react";
import { AdminPINScreen } from "./components/AdminPINScreen";
import { BottomNav } from "./components/BottomNav";
import { CompareModal } from "./components/CompareModal";
import { TopBar } from "./components/TopBar";
import { AdminPanel } from "./components/admin/AdminPanel";
import { Toaster } from "./components/ui/sonner";
import type { Design, Subcategory } from "./lib/storage";
import { BlousePage } from "./pages/BlousePage";
import { BridalPage } from "./pages/BridalPage";
import { DesignDetailPage } from "./pages/DesignDetailPage";
import { EmbroideryPage } from "./pages/EmbroideryPage";
import { GalleryPage } from "./pages/GalleryPage";
import { HomePage } from "./pages/HomePage";
import { StitchingOrdersPage } from "./pages/StitchingOrdersPage";
import { type ActiveTab, useAppStore } from "./store/appStore";

const SUBCATEGORY_LABELS: Record<Subcategory, string> = {
  embroidery: "Embroidery",
  "ready-blouse-embroidery": "Ready Blouse Embroidery",
  "simple-blouse": "Simple Blouse",
  "boat-neck": "Boat Neck Blouse",
  "bridal-blouse": "Bridal Blouse",
  "designer-blouse": "Designer Blouse",
};

// Page stack navigation
type PageEntry =
  | { page: "home" }
  | { page: "embroidery" }
  | { page: "blouse" }
  | { page: "bridal" }
  | { page: "orders" }
  | { page: "gallery"; subcategory: Subcategory; title?: string }
  | { page: "bridal-gallery"; bridalFilter: "embroidery" | "blouse" }
  | { page: "design-detail"; design: Design };

export default function App() {
  const { setActiveTab, isAdminOpen, isAdminAuthenticated, compareDesigns } =
    useAppStore();
  const [pageStack, setPageStack] = useState<PageEntry[]>([{ page: "home" }]);

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
      case "gallery":
        return (
          (
            currentPage as {
              page: "gallery";
              subcategory: Subcategory;
              title?: string;
            }
          ).title || "Gallery"
        );
      case "bridal-gallery":
        return (
          currentPage as {
            page: "bridal-gallery";
            bridalFilter: "embroidery" | "blouse";
          }
        ).bridalFilter === "embroidery"
          ? "Bridal Embroidery"
          : "Bridal Blouse";
      case "design-detail":
        return (currentPage as { page: "design-detail"; design: Design }).design
          .designCode;
      default:
        return "Vishal Embroidery Works";
    }
  };

  const showBack = pageStack.length > 1;

  // Render current page content
  const renderContent = () => {
    switch (currentPage.page) {
      case "home":
        return <HomePage onNavigate={(tab) => handleTabChange(tab)} />;

      case "embroidery":
        return (
          <EmbroideryPage
            onOpenGallery={(sub) => {
              navigate({
                page: "gallery",
                subcategory: sub,
                title: SUBCATEGORY_LABELS[sub],
              });
            }}
          />
        );

      case "blouse":
        return (
          <BlousePage
            onOpenGallery={(sub) => {
              navigate({
                page: "gallery",
                subcategory: sub,
                title: SUBCATEGORY_LABELS[sub],
              });
            }}
          />
        );

      case "bridal":
        return (
          <BridalPage
            onOpenBridalGallery={(type) =>
              navigate({ page: "bridal-gallery", bridalFilter: type })
            }
          />
        );

      case "orders":
        return <StitchingOrdersPage />;

      case "gallery": {
        const p = currentPage as {
          page: "gallery";
          subcategory: Subcategory;
          title?: string;
        };
        return (
          <GalleryPage
            subcategory={p.subcategory}
            bridalFilter={null}
            onSelectDesign={(design) =>
              navigate({ page: "design-detail", design })
            }
          />
        );
      }

      case "bridal-gallery": {
        const p = currentPage as {
          page: "bridal-gallery";
          bridalFilter: "embroidery" | "blouse";
        };
        return (
          <GalleryPage
            subcategory=""
            bridalFilter={p.bridalFilter}
            onSelectDesign={(design) =>
              navigate({ page: "design-detail", design })
            }
          />
        );
      }

      case "design-detail": {
        const p = currentPage as { page: "design-detail"; design: Design };
        return <DesignDetailPage design={p.design} />;
      }

      default:
        return <HomePage onNavigate={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <TopBar title={getPageTitle()} showBack={showBack} onBack={goBack} />

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
