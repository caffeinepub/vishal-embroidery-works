import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitCompare, Search, X } from "lucide-react";
import { useState } from "react";
import type { Design } from "../../backend.d";
import { useDesignsByCategory } from "../../hooks/useQueries";
import { getSampleByCategory } from "../../lib/sampleData";
import { CompareModal } from "../shared/CompareModal";
import { DesignGrid } from "../shared/DesignGrid";

interface EmbroideryScreenProps {
  onDesignClick: (design: Design) => void;
}

export function EmbroideryScreen({ onDesignClick }: EmbroideryScreenProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<bigint[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const embroideryQuery = useDesignsByCategory("Embroidery");
  const allEmbroideryQuery = useDesignsByCategory("All Embroidery");
  const allEmbroideryWorksQuery = useDesignsByCategory("All Embroidery Works");
  const readyBlouseQuery = useDesignsByCategory("Ready Blouse Embroidery");

  // Merge all embroidery categories (Embroidery + All Embroidery + All Embroidery Works)
  const embroideryDesigns = [
    ...(embroideryQuery.data ?? []),
    ...(allEmbroideryQuery.data ?? []),
    ...(allEmbroideryWorksQuery.data ?? []),
  ];

  const sampleEmbroidery = [
    ...getSampleByCategory("Embroidery"),
    ...getSampleByCategory("All Embroidery"),
    ...getSampleByCategory("All Embroidery Works"),
  ];

  // Only show sample data when all three queries haven't returned any data yet
  // (i.e. still loading for the first time). Once the backend responds with
  // an empty array we respect that and show an empty state so newly uploaded
  // designs can appear immediately after a refetch.
  const allQueriesReturned =
    embroideryQuery.data !== undefined &&
    allEmbroideryQuery.data !== undefined &&
    allEmbroideryWorksQuery.data !== undefined;
  const allEmbroidery =
    !allQueriesReturned && embroideryDesigns.length === 0
      ? sampleEmbroidery
      : embroideryDesigns;

  // Same logic for ready blouse: don't fall back to sample data once the
  // backend has returned (even if it returned an empty array).
  const readyBlouseDesigns =
    readyBlouseQuery.data !== undefined
      ? readyBlouseQuery.data
      : getSampleByCategory("Ready Blouse Embroidery");

  const isLoadingAll =
    (embroideryQuery.isLoading ||
      allEmbroideryQuery.isLoading ||
      allEmbroideryWorksQuery.isLoading) &&
    embroideryDesigns.length === 0 &&
    !allQueriesReturned;
  const isLoadingReady =
    readyBlouseQuery.isLoading && readyBlouseQuery.data === undefined;

  // Filter by search
  const filteredEmbroidery = searchQuery.trim()
    ? allEmbroidery.filter((d) =>
        d.designCode.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : allEmbroidery;

  // Compare handlers
  const handleToggleCompare = (id: bigint) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        // Replace the first selected
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleExitCompare = () => {
    setCompareMode(false);
    setSelectedForCompare([]);
    setCompareOpen(false);
  };

  // Get the 2 selected design objects for comparison
  const compareDesigns: [Design, Design] | null =
    selectedForCompare.length === 2
      ? (() => {
          const d1 = allEmbroidery.find((d) => d.id === selectedForCompare[0]);
          const d2 = allEmbroidery.find((d) => d.id === selectedForCompare[1]);
          return d1 && d2 ? [d1, d2] : null;
        })()
      : null;

  return (
    <div className="flex-1 flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          setSearchQuery("");
        }}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-4 mt-3 mb-2 grid grid-cols-2 bg-vew-sky-light/50 rounded-xl p-1 h-auto">
          <TabsTrigger
            data-ocid="embroidery.all.tab"
            value="all"
            className="rounded-lg data-[state=active]:bg-vew-sky data-[state=active]:text-white data-[state=active]:shadow text-xs py-2.5 h-auto"
          >
            <div className="text-center">
              <div className="font-semibold">All Embroidery</div>
              <div className="text-[9px] opacity-70 mt-0.5">ಎಲ್ಲಾ ಕಸೂತಿ</div>
            </div>
          </TabsTrigger>
          <TabsTrigger
            data-ocid="embroidery.ready.tab"
            value="ready"
            className="rounded-lg data-[state=active]:bg-vew-sky data-[state=active]:text-white data-[state=active]:shadow text-xs py-2.5 h-auto"
          >
            <div className="text-center">
              <div className="font-semibold">Ready Blouse</div>
              <div className="text-[9px] opacity-70 mt-0.5">ರೆಡಿ ಬ್ಲೌಸ್</div>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 m-0 overflow-y-auto">
          {/* Search Bar + Compare toggle */}
          <div className="px-3 pt-2 pb-1 flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                data-ocid="embroidery.search_input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code... (e.g. VEW-025)"
                className="pl-9 pr-8 h-10 rounded-xl text-sm bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              data-ocid="embroidery.compare.toggle"
              variant={compareMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (compareMode) {
                  handleExitCompare();
                } else {
                  setCompareMode(true);
                  setSearchQuery("");
                }
              }}
              className={`h-10 px-3 rounded-xl flex-shrink-0 gap-1 ${
                compareMode
                  ? "bg-vew-sky text-white hover:bg-vew-sky-dark"
                  : "border-vew-sky/40 text-vew-sky hover:bg-vew-sky-light"
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span className="text-xs">
                {compareMode ? "Exit" : "Compare"}
              </span>
            </Button>
          </div>

          {/* Compare mode banner */}
          {compareMode && (
            <div className="mx-3 mb-2 px-3 py-2 bg-vew-sky/10 border border-vew-sky/20 rounded-xl flex items-center justify-between">
              <p className="text-xs text-vew-sky font-medium">
                {selectedForCompare.length === 0
                  ? "Tap 2 designs to compare"
                  : selectedForCompare.length === 1
                    ? "Select 1 more design"
                    : "2 designs selected"}
              </p>
              {selectedForCompare.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedForCompare([])}
                  className="text-[10px] text-muted-foreground hover:text-vew-sky"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Search result count */}
          {searchQuery.trim() && !compareMode && (
            <div className="px-4 pb-1">
              <p className="text-xs text-muted-foreground">
                {filteredEmbroidery.length === 0
                  ? "No designs found"
                  : `Showing ${filteredEmbroidery.length} design${filteredEmbroidery.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          )}

          <DesignGrid
            designs={compareMode ? allEmbroidery : filteredEmbroidery}
            isLoading={isLoadingAll}
            onDesignClick={compareMode ? undefined : onDesignClick}
            emptyMessage="No designs yet. Add designs from Admin Panel."
            emptyKannada="ಅಡ್ಮಿನ್ ಪ್ಯಾನಲ್‌ನಿಂದ ಡಿಸೈನ್ ಸೇರಿಸಿ"
            compareMode={compareMode}
            selectedForCompare={selectedForCompare}
            onToggleCompare={handleToggleCompare}
          />
        </TabsContent>

        <TabsContent value="ready" className="flex-1 m-0 overflow-y-auto">
          <DesignGrid
            designs={readyBlouseDesigns}
            isLoading={isLoadingReady}
            onDesignClick={onDesignClick}
            emptyMessage="No ready blouse embroidery designs"
            emptyKannada="ಯಾವುದೇ ರೆಡಿ ಬ್ಲೌಸ್ ಡಿಸೈನ್ ಕಂಡುಬಂದಿಲ್ಲ"
          />
        </TabsContent>
      </Tabs>

      {/* Floating Compare button */}
      {compareMode && selectedForCompare.length === 2 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-[430px]">
          <Button
            data-ocid="embroidery.compare.open_modal_button"
            onClick={() => setCompareOpen(true)}
            className="w-full h-12 rounded-2xl bg-vew-sky text-white hover:bg-vew-sky-dark shadow-xl shadow-vew-sky/30 font-bold gap-2"
          >
            <GitCompare className="w-5 h-5" />
            Compare 2 Designs / 2 ಡಿಸೈನ್ ಹೋಲಿಸಿ
          </Button>
        </div>
      )}

      {/* Compare Modal */}
      <CompareModal
        designs={compareDesigns}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
      />
    </div>
  );
}
