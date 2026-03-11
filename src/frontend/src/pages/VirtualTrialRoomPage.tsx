import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDoc, collection } from "firebase/firestore";
import { Camera, Image, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { BlouseMannequin } from "../components/BlouseMannequin";
import type { MannequinView } from "../components/BlouseMannequin";
import { useDesigns } from "../hooks/useFirestore";
import { db } from "../lib/firebase";
import type { Design } from "../lib/storage";

const BLOUSE_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Cream", value: "#fffdd0" },
  { label: "Pink", value: "#f9a8d4" },
  { label: "Red", value: "#dc2626" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Yellow", value: "#fbbf24" },
  { label: "Black", value: "#1a1a1a" },
];

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5"];

const EMBROIDERY_POSITIONS: Record<MannequinView, React.CSSProperties> = {
  front: {
    top: "15%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "70%",
  },
  back: {
    top: "15%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "70%",
  },
  left: { top: "35%", left: "10%", width: "50%" },
  right: { top: "35%", right: "10%", width: "50%" },
};

interface VirtualTrialRoomPageProps {
  onBack: () => void;
  initialDesign?: Design;
}

export function VirtualTrialRoomPage({
  onBack,
  initialDesign,
}: VirtualTrialRoomPageProps) {
  const [activeView, setActiveView] = useState<MannequinView>("front");
  const [blouseColor, setBlouseColor] = useState("#ffffff");
  const [embColor1, setEmbColor1] = useState("#b91c1c");
  const [embColor2, setEmbColor2] = useState("#fbbf24");
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(
    initialDesign ?? null,
  );
  const [fabricPhoto, setFabricPhoto] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [fabricModalOpen, setFabricModalOpen] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const { data: allDesigns, loading } = useDesigns();
  const designs = allDesigns
    .filter((d) => !d.isHidden)
    .filter((d) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.designCode?.toLowerCase().includes(q) ||
        d.title?.toLowerCase().includes(q) ||
        d.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFabricPhoto(ev.target?.result as string);
      setFabricModalOpen(false);
    };
    reader.readAsDataURL(file);
  }

  async function handleAddToStitching() {
    setSaving(true);
    try {
      await addDoc(collection(db, "orders"), {
        type: "trial-room",
        designCode: selectedDesign?.designCode ?? "",
        designId: selectedDesign?.id ?? "",
        blouseColor,
        view: activeView,
        embroideryColor1: embColor1,
        embroideryColor2: embColor2,
        hasFabricPhoto: !!fabricPhoto,
        status: "Pending",
        createdAt: new Date().toISOString(),
        customerName: "",
        notes: "Added from Trial Room",
      });
      toast.success("Added to Stitching Orders!");
      onBack();
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const views: { key: MannequinView; label: string }[] = [
    { key: "front", label: "Front" },
    { key: "back", label: "Back" },
    { key: "left", label: "Left" },
    { key: "right", label: "Right" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="font-bold text-lg text-slate-800">Virtual Trial Room</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">
        {/* View Switcher */}
        <div className="flex gap-2 justify-center">
          {views.map((v) => (
            <button
              type="button"
              key={v.key}
              data-ocid={`trial.${v.key}_view.button`}
              onClick={() => setActiveView(v.key)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all border ${
                activeView === v.key
                  ? "bg-red-600 text-white border-red-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-300 hover:border-red-300"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Mannequin Preview */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="relative" style={{ paddingBottom: "133.33%" }}>
            <BlouseMannequin
              blouseColor={blouseColor}
              neckShape="u-neck"
              sleeveLength="short"
              view={activeView}
              className="absolute inset-0 w-full h-full"
            />

            {fabricPhoto ? (
              <img
                src={fabricPhoto}
                alt="fabric"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ mixBlendMode: "multiply", opacity: 0.65 }}
              />
            ) : null}

            {selectedDesign?.images?.[0] && (
              <img
                src={selectedDesign.images[0]}
                alt="embroidery"
                className="absolute transition-all duration-300"
                style={{
                  ...EMBROIDERY_POSITIONS[activeView],
                  mixBlendMode: "multiply",
                  filter: `hue-rotate(${hueFromColor(embColor1)}deg) saturate(1.5)`,
                  objectFit: "contain",
                }}
              />
            )}

            {!selectedDesign && (
              <div className="absolute inset-0 flex items-end justify-center pb-4">
                <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                  Select a design to preview
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <Input
          data-ocid="trial.design_search.search_input"
          placeholder="Search Design (Example: EMB001)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-white"
        />

        {/* Design Slider */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Designs
          </p>
          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {SKELETON_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex-shrink-0 w-16 h-20 bg-slate-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : designs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No designs found
            </p>
          ) : (
            <div
              data-ocid="trial.design_slider.list"
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {designs.slice(0, 50).map((design, idx) => (
                <button
                  type="button"
                  key={design.id ?? design.designCode}
                  data-ocid={
                    idx < 10 ? `trial.design.item.${idx + 1}` : undefined
                  }
                  onClick={() => setSelectedDesign(design)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 p-1 rounded-xl border-2 transition-all ${
                    selectedDesign?.designCode === design.designCode
                      ? "border-red-500 bg-red-50"
                      : "border-transparent bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100">
                    {design.images?.[0] && (
                      <img
                        src={design.images[0]}
                        alt={design.designCode}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <span className="text-xs text-slate-600 font-medium">
                    {design.designCode}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Controls */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Blouse Color
            </p>
            <div className="flex flex-wrap gap-2">
              {BLOUSE_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => {
                    setBlouseColor(c.value);
                    setFabricPhoto(null);
                  }}
                  title={c.label}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    blouseColor === c.value && !fabricPhoto
                      ? "border-red-500 scale-110"
                      : "border-slate-300"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
              <input
                data-ocid="trial.blouse_color.input"
                type="color"
                value={blouseColor}
                onChange={(e) => {
                  setBlouseColor(e.target.value);
                  setFabricPhoto(null);
                }}
                className="w-8 h-8 rounded-full border-2 border-slate-300 cursor-pointer overflow-hidden"
                title="Custom color"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Emb Color 1
              </p>
              <input
                data-ocid="trial.emb_color1.input"
                type="color"
                value={embColor1}
                onChange={(e) => setEmbColor1(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Emb Color 2
              </p>
              <input
                data-ocid="trial.emb_color2.input"
                type="color"
                value={embColor2}
                onChange={(e) => setEmbColor2(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Upload Fabric */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          {fabricPhoto ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={fabricPhoto}
                  alt="fabric"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                />
                <p className="text-sm font-medium text-slate-700">
                  Fabric applied
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFabricPhoto(null)}
              >
                Remove
              </Button>
            </div>
          ) : (
            <Button
              data-ocid="trial.upload_fabric.button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => setFabricModalOpen(true)}
            >
              <Camera className="w-4 h-4" />
              Upload My Fabric
            </Button>
          )}
        </div>
      </div>

      {/* Fabric Source Modal */}
      {fabricModalOpen && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 m-0 w-full max-w-none border-none bg-transparent p-0"
          onKeyDown={(e) => {
            if (e.key === "Escape") setFabricModalOpen(false);
          }}
        >
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-3 mt-auto">
            <p className="font-semibold text-slate-800 text-center mb-4">
              Choose fabric source
            </p>
            <button
              type="button"
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="w-5 h-5 text-red-500" />
              <span className="font-medium text-slate-700">Camera</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              onClick={() => galleryRef.current?.click()}
            >
              <Image className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-slate-700">Gallery</span>
            </button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setFabricModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </dialog>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex gap-3 max-w-lg mx-auto">
        <Button
          data-ocid="trial.cancel.button"
          variant="outline"
          className="flex-1"
          onClick={onBack}
        >
          Cancel
        </Button>
        <Button
          data-ocid="trial.add_to_stitching.button"
          className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600"
          onClick={handleAddToStitching}
          disabled={saving}
        >
          {saving ? "Saving..." : "Add to Stitching"}
        </Button>
      </div>
    </div>
  );
}

function hueFromColor(hex: string): number {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round(h * 60);
}
