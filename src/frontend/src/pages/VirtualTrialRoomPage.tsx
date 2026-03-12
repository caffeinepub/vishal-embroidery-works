import { addDoc, collection } from "firebase/firestore";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  Search,
  Shirt,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useDesigns } from "../hooks/useFirestore";
import { SUBCATEGORY_LABELS } from "../lib/designCodes";
import { db } from "../lib/firebase";
import {
  ALL_BLOUSE_TYPES,
  BLOUSE_TYPE_LABELS,
  type BlouseType,
  type Design,
  type Subcategory,
} from "../lib/storage";

// ---------------------------------------------------------------------------
// Mannequin image map – explicit 1:1 mapping, no fallbacks
// ---------------------------------------------------------------------------
const MANNEQUIN_IMAGES: Record<ViewType, string> = {
  front: "/assets/generated/mannequin-front.dim_600x800.png",
  back: "/assets/generated/mannequin-back.dim_600x800.png",
  left: "/assets/generated/mannequin-left.dim_600x800.png",
  right: "/assets/generated/mannequin-right.dim_600x800.png",
};

// ---------------------------------------------------------------------------
// Blouse color zone – the rectangle that covers the blouse fabric area only.
// mix-blend-mode: multiply means only the white blouse area picks up the tint;
// skin and background remain unaffected.
// ---------------------------------------------------------------------------
const BLOUSE_COLOR_ZONE: Record<ViewType, React.CSSProperties> = {
  front: { top: "30%", bottom: "0", left: "8%", right: "8%" },
  back: { top: "24%", bottom: "0", left: "8%", right: "8%" },
  left: { top: "28%", bottom: "0", left: "0", right: "18%" },
  right: { top: "28%", bottom: "0", left: "18%", right: "0" },
};

// ---------------------------------------------------------------------------
// Embroidery anchor – where the embroidery PNG snaps on each view.
// Percentages ensure correct scaling on any screen size.
// ---------------------------------------------------------------------------
const EMBROIDERY_ANCHORS: Record<ViewType, React.CSSProperties> = {
  front: {
    top: "26%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "80%",
  },
  back: {
    top: "20%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "76%",
  },
  left: {
    top: "38%",
    left: "4%",
    width: "54%",
  },
  right: {
    top: "38%",
    right: "4%",
    left: "auto",
    width: "54%",
  },
};

const BLOUSE_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Cream", value: "#fffdd0" },
  { label: "Pink", value: "#f9a8d4" },
  { label: "Red", value: "#dc2626" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Yellow", value: "#fbbf24" },
  { label: "Black", value: "#1a1a1a" },
  { label: "Purple", value: "#9333ea" },
  { label: "Orange", value: "#f97316" },
];

// ---------------------------------------------------------------------------
// Returns the correct embroidery URL for the active view.
// NEVER falls back to images[0]. Gallery images must never be used here.
// ---------------------------------------------------------------------------
function getEmbroideryForView(
  design: Design | null,
  view: ViewType,
): string | null {
  if (!design) return null;
  if (view === "front") return design.frontEmbroidery || null;
  if (view === "back") return design.backEmbroidery || null;
  // left and right both use sleeveEmbroidery
  return design.sleeveEmbroidery || null;
}

// ---------------------------------------------------------------------------
// Derive the blouse label from a design (for display in header/controls)
// ---------------------------------------------------------------------------
function getBlouseLabelFromDesign(design: Design | null): string {
  if (!design) return "";
  if (design.category === "blouse") {
    const sub = design.subcategory as Subcategory;
    if (sub in BLOUSE_TYPE_LABELS)
      return BLOUSE_TYPE_LABELS[sub as NonNullable<BlouseType>];
    return SUBCATEGORY_LABELS[sub] ?? sub;
  }
  return "";
}

type ViewType = "front" | "back" | "left" | "right";
type FabricType = "silk" | "cotton" | "generic";

interface VirtualTrialRoomPageProps {
  onBack: () => void;
  initialDesign?: Design;
}

export function VirtualTrialRoomPage({
  onBack,
  initialDesign,
}: VirtualTrialRoomPageProps) {
  const [activeView, setActiveView] = useState<ViewType>("front");
  const [blouseColor, setBlouseColor] = useState("#ffffff");
  const [fabricType, setFabricType] = useState<FabricType>("generic");
  const [embColor1, setEmbColor1] = useState("#b91c1c");
  const [embColor2, setEmbColor2] = useState("#fbbf24");
  // selectedDesign is the single source of truth – only one design at a time
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(
    initialDesign ?? null,
  );
  const [fabricPhoto, setFabricPhoto] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [fabricModalOpen, setFabricModalOpen] = useState(false);

  const fabricFileRef = useRef<HTMLInputElement>(null);
  const cameraFileRef = useRef<HTMLInputElement>(null);

  const { data: allDesigns = [] } = useDesigns();

  // Design slider: all visible designs matching search – no blouse-type filter
  // (blouse type is derived from the design itself, not a separate selector)
  const visibleDesigns = allDesigns
    .filter((d) => !d.isHidden)
    .filter((d) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.designCode.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        (d.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
      );
    });

  // The embroidery URL to render – derived fresh every render, uses correct field
  const embroideryUrl = getEmbroideryForView(selectedDesign, activeView);

  // Blouse label for display (derived from design, not a selector)
  const blouseLabel = getBlouseLabelFromDesign(selectedDesign);

  const handleSelectDesign = (d: Design) => {
    // Selecting a new design replaces the previous one (prevents overlay stacking)
    setSelectedDesign(d);
  };

  const handleFabricUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFabricPhoto(e.target?.result as string);
      setFabricModalOpen(false);
      toast.success("Fabric applied to blouse");
    };
    reader.readAsDataURL(file);
  };

  const handleAddToStitching = async () => {
    if (!selectedDesign) {
      toast.error("Please select a design first");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "orders"), {
        type: "trial-room",
        designCode: selectedDesign.designCode,
        designTitle: selectedDesign.title,
        designId: selectedDesign.id,
        blouseColor,
        blouseStyle: getBlouseLabelFromDesign(selectedDesign) || null,
        fabricType,
        view: activeView,
        embroideryColor1: embColor1,
        embroideryColor2: embColor2,
        hasCustomFabric: !!fabricPhoto,
        status: "Pending",
        createdAt: new Date().toISOString(),
        customerName: "",
        notes: "Added from Trial Room",
      });
      toast.success("Added to stitching orders!");
      onBack();
    } catch {
      toast.error("Failed to save order. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const views: { key: ViewType; label: string }[] = [
    { key: "front", label: "Front" },
    { key: "back", label: "Back" },
    { key: "left", label: "Left" },
    { key: "right", label: "Right" },
  ];

  const fabricTypes: { key: FabricType; label: string }[] = [
    { key: "silk", label: "Silk" },
    { key: "cotton", label: "Cotton" },
    { key: "generic", label: "Generic" },
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-rose-50 via-white to-rose-50 z-50 flex flex-col">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-rose-100 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          data-ocid="trial.cancel.button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-foreground leading-none">
            Virtual Trial Room
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {selectedDesign
              ? `${selectedDesign.designCode}${blouseLabel ? ` — ${blouseLabel}` : ` — ${selectedDesign.title}`}`
              : "Select a design to preview"}
          </p>
        </div>
        <Shirt size={20} className="text-primary shrink-0" />
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-lg mx-auto px-3">
          {/* View switcher */}
          <div className="flex gap-2 mt-4">
            {views.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                data-ocid={`trial.${key}_view.button`}
                onClick={() => setActiveView(key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeView === key
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-white text-muted-foreground border border-border"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/*
            ── MANNEQUIN PREVIEW ──
            5-layer stack (bottom → top):
              Layer 1 – neutral background (bg-white)
              Layer 2 – mannequin image  (object-contain, centered)
              Layer 3 – blouse color overlay (multiply, blouse zone only)
              Layer 4 – fabric photo / texture (multiply, blouse zone only)
              Layer 5 – embroidery overlay (multiply, anchor-positioned)

            IMPORTANT: design.images[] is NEVER used here.
            Gallery images are NOT rendered inside the trial room canvas.
          */}
          <div
            className="relative mt-3 rounded-2xl overflow-hidden shadow-lg"
            style={{
              aspectRatio: "3/4",
              backgroundColor: "#f8f7f5", // Layer 1: neutral background
            }}
          >
            {/* ─ Layer 2: Mannequin image ─
              Explicit mapping: front→front, back→back, left→left, right→right.
              object-contain ensures no cropping and correct aspect ratio.
            */}
            <img
              key={`mannequin-${activeView}`}
              src={MANNEQUIN_IMAGES[activeView]}
              alt={`${activeView} view`}
              className="absolute inset-0 w-full h-full object-contain object-center"
              loading="eager"
            />

            {/* ─ Layer 3: Blouse color tint ─
              Constrained to blouse zone only.
              mix-blend-mode: multiply preserves fabric shading;
              skin and background are unaffected because they are not white.
            */}
            {blouseColor !== "#ffffff" && !fabricPhoto && (
              <div
                style={{
                  position: "absolute",
                  ...BLOUSE_COLOR_ZONE[activeView],
                  backgroundColor: blouseColor,
                  mixBlendMode: "multiply",
                  opacity: 0.72,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* ─ Layer 4a: Uploaded fabric texture ─
              Applied only inside blouse zone. Never covers mannequin skin.
            */}
            {fabricPhoto && (
              <div
                style={{
                  position: "absolute",
                  ...BLOUSE_COLOR_ZONE[activeView],
                  backgroundImage: `url(${fabricPhoto})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  mixBlendMode: "multiply",
                  opacity: 0.65,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* ─ Layer 4b: Fabric type sheen (silk / cotton) ─ */}
            {fabricType === "silk" && (
              <div
                style={{
                  position: "absolute",
                  ...BLOUSE_COLOR_ZONE[activeView],
                  background:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 9px)",
                  mixBlendMode: "overlay",
                  opacity: 0.55,
                  pointerEvents: "none",
                }}
              />
            )}
            {fabricType === "cotton" && (
              <div
                style={{
                  position: "absolute",
                  ...BLOUSE_COLOR_ZONE[activeView],
                  background:
                    "repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0px, rgba(0,0,0,0.035) 1px, transparent 1px, transparent 4px)," +
                    "repeating-linear-gradient(90deg, rgba(0,0,0,0.035) 0px, rgba(0,0,0,0.035) 1px, transparent 1px, transparent 4px)",
                  mixBlendMode: "multiply",
                  opacity: 0.5,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* ─ Layer 5: Embroidery overlay ─
              Uses React key = designId + view to ensure the previous overlay is
              unmounted before the new one mounts (prevents stacking).
              mix-blend-mode: multiply makes white PNG backgrounds transparent.
              No border, background, or shadow on this element.
            */}
            {embroideryUrl && (
              <img
                key={`emb-${selectedDesign?.id ?? "none"}-${activeView}`}
                src={embroideryUrl}
                alt="Embroidery"
                loading="lazy"
                style={{
                  position: "absolute",
                  ...EMBROIDERY_ANCHORS[activeView],
                  height: "auto",
                  maxWidth: EMBROIDERY_ANCHORS[activeView].width,
                  objectFit: "contain",
                  mixBlendMode: "multiply",
                  filter: `hue-rotate(${getHueRotate(embColor1)}deg) saturate(1.6) brightness(0.97)`,
                  pointerEvents: "none",
                  background: "none",
                  border: "none",
                  boxShadow: "none",
                }}
              />
            )}

            {/* Empty state overlay */}
            {!selectedDesign && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm">
                <div className="bg-white/90 rounded-2xl p-5 text-center mx-4">
                  <Shirt size={32} className="text-primary mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    Select a Design
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Browse designs below to preview on blouse
                  </p>
                </div>
              </div>
            )}

            {/* No embroidery for this view */}
            {selectedDesign && !embroideryUrl && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-black/50 text-white text-[11px] px-3 py-1 rounded-full backdrop-blur-sm">
                  No embroidery available for this view
                </div>
              </div>
            )}

            {/* View badge */}
            <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
              {activeView.toUpperCase()}
            </div>

            {/* Fabric photo remove button */}
            {fabricPhoto && (
              <button
                type="button"
                onClick={() => setFabricPhoto(null)}
                className="absolute top-3 left-3 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* ── Search bar ── */}
          <div className="relative mt-3">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              data-ocid="trial.design_search.search_input"
              type="text"
              placeholder="Search Design (EMB001, Peacock...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* ── Design slider ──
            Shows design thumbnails using design.images[0] as thumbnail only.
            These images are NOT loaded into the trial room canvas.
          */}
          <div
            data-ocid="trial.design_slider.list"
            className="flex gap-3 mt-3 overflow-x-auto pb-2"
            style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
          >
            {visibleDesigns.length === 0 ? (
              <div className="flex-shrink-0 w-full text-center py-4">
                <p className="text-sm text-muted-foreground">
                  No designs found
                </p>
              </div>
            ) : (
              visibleDesigns.slice(0, 40).map((d, idx) => (
                <button
                  key={d.id}
                  type="button"
                  data-ocid={`trial.design.item.${idx + 1}`}
                  onClick={() => handleSelectDesign(d)}
                  className={`flex-shrink-0 w-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedDesign?.id === d.id
                      ? "border-primary shadow-md shadow-primary/20 scale-105"
                      : "border-transparent bg-white shadow-sm"
                  }`}
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {d.images?.[0] ? (
                      <img
                        src={d.images[0]}
                        alt={d.designCode}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shirt size={20} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="px-1 py-1.5 bg-white">
                    <p className="text-[10px] font-bold text-foreground truncate text-center">
                      {d.designCode}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* ── Controls card ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 mt-3 space-y-4">
            {/* Fabric Type */}
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                Fabric Type
              </p>
              <div className="flex gap-2">
                {fabricTypes.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    data-ocid={`trial.${key}_fabric.button`}
                    onClick={() => setFabricType(key)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                      fabricType === key
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Blouse Color */}
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                Blouse Color
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                {BLOUSE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setFabricPhoto(null);
                      setBlouseColor(c.value);
                    }}
                    title={c.label}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      blouseColor === c.value && !fabricPhoto
                        ? "border-primary scale-110 shadow-md"
                        : "border-gray-200"
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
                {/* Custom color picker */}
                <div className="relative">
                  <input
                    type="color"
                    data-ocid="trial.blouse_color.input"
                    value={blouseColor}
                    onChange={(e) => {
                      setFabricPhoto(null);
                      setBlouseColor(e.target.value);
                    }}
                    className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200 opacity-0 absolute inset-0"
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-xs"
                    title="Custom color"
                  >
                    +
                  </div>
                </div>
              </div>
            </div>

            {/* Embroidery Colors */}
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                Embroidery Colors
              </p>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="emb-color1"
                    className="text-xs text-muted-foreground mb-1 block"
                  >
                    Emb Color 1
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full border border-border shrink-0"
                      style={{ backgroundColor: embColor1 }}
                    />
                    <input
                      type="color"
                      id="emb-color1"
                      data-ocid="trial.emb_color1.input"
                      value={embColor1}
                      onChange={(e) => setEmbColor1(e.target.value)}
                      className="flex-1 h-8 rounded-lg cursor-pointer border border-border"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="emb-color2"
                    className="text-xs text-muted-foreground mb-1 block"
                  >
                    Emb Color 2
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full border border-border shrink-0"
                      style={{ backgroundColor: embColor2 }}
                    />
                    <input
                      type="color"
                      id="emb-color2"
                      data-ocid="trial.emb_color2.input"
                      value={embColor2}
                      onChange={(e) => setEmbColor2(e.target.value)}
                      className="flex-1 h-8 rounded-lg cursor-pointer border border-border"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Upload Fabric ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 mt-3">
            <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
              Upload Your Fabric
            </p>
            {fabricPhoto ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-border">
                  <img
                    src={fabricPhoto}
                    alt="Fabric"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-700">
                    Custom fabric applied
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fabric texture shown on blouse
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFabricPhoto(null)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-ocid="trial.upload_fabric.button"
                onClick={() => setFabricModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-rose-200 rounded-xl text-sm text-rose-500 font-semibold hover:bg-rose-50 transition-colors"
              >
                <Upload size={16} />
                Upload My Blouse Fabric
              </button>
            )}
          </div>

          <div className="h-8" />
        </div>
      </div>

      {/* ── Fabric source modal ── */}
      {fabricModalOpen && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-end m-0 p-0 max-w-none max-h-none w-full h-full bg-transparent"
          onKeyDown={(e) => e.key === "Escape" && setFabricModalOpen(false)}
        >
          <button
            type="button"
            aria-label="Close fabric modal"
            className="absolute inset-0 bg-black/50 w-full"
            onClick={() => setFabricModalOpen(false)}
          />
          <div
            className="relative w-full bg-white rounded-t-2xl p-6 pb-8"
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-foreground">
                Upload Fabric
              </h3>
              <button
                type="button"
                onClick={() => setFabricModalOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => cameraFileRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-2 py-5 bg-rose-50 rounded-2xl border border-rose-100"
              >
                <Camera size={28} className="text-rose-500" />
                <span className="text-sm font-semibold text-foreground">
                  Camera
                </span>
                <span className="text-xs text-muted-foreground">
                  Take a photo
                </span>
              </button>
              <button
                type="button"
                onClick={() => fabricFileRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-2 py-5 bg-blue-50 rounded-2xl border border-blue-100"
              >
                <ImageIcon size={28} className="text-blue-500" />
                <span className="text-sm font-semibold text-foreground">
                  Gallery
                </span>
                <span className="text-xs text-muted-foreground">
                  Choose image
                </span>
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraFileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFabricUpload(f);
          e.target.value = "";
        }}
      />
      <input
        ref={fabricFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFabricUpload(f);
          e.target.value = "";
        }}
      />

      {/* ── Bottom action bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-rose-100 px-4 py-3 flex gap-3 z-20">
        <button
          type="button"
          data-ocid="trial.cancel_action.button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground bg-white"
        >
          Cancel
        </button>
        <button
          type="button"
          data-ocid="trial.add_to_stitching.button"
          onClick={handleAddToStitching}
          disabled={saving || !selectedDesign}
          className="flex-2 flex-grow-[2] py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <CheckCircle size={16} /> Add to Stitching Orders
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility: compute hue-rotate degrees from a hex colour string
// ---------------------------------------------------------------------------
function getHueRotate(hex: string): number {
  if (hex.length !== 7) return 0;
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / (max - min) + 2) / 6;
  else h = ((r - g) / (max - min) + 4) / 6;
  return Math.round(h * 360);
}
