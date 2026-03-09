import { Search, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useDesigns } from "../hooks/useFirestore";
import type { CartItem, Design } from "../lib/storage";
import { useAppStore } from "../store/appStore";

interface VirtualTrialRoomPageProps {
  onBack: () => void;
}

const FRONT_NECK_TYPES = [
  { id: "u-neck", label: "U Neck" },
  { id: "boat-neck", label: "Boat Neck" },
  { id: "v-neck", label: "V Neck" },
  { id: "round-neck", label: "Round Neck" },
  { id: "square-neck", label: "Square Neck" },
];

const BACK_NECK_TYPES = [
  { id: "deep-u", label: "Deep U" },
  { id: "keyhole", label: "Keyhole" },
  { id: "dori-style", label: "Dori Style" },
  { id: "v-back", label: "V Back" },
  { id: "round-back", label: "Round Back" },
];

// Returns the SVG path for the neck cutout opening inside the blouse neckline area
// The blouse top edge is around y=125, neckline center x=150
function getNeckPath(neckId: string): string {
  switch (neckId) {
    // FRONT
    case "u-neck":
      return "M 110,125 Q 110,175 150,178 Q 190,175 190,125 Z";
    case "boat-neck":
      return "M 95,125 Q 150,140 205,125 Z";
    case "v-neck":
      return "M 115,125 L 150,170 L 185,125 Z";
    case "round-neck":
      return "M 115,125 A 35,35 0 0,0 185,125 Q 185,158 150,160 Q 115,158 115,125 Z";
    case "square-neck":
      return "M 110,125 L 110,165 L 190,165 L 190,125 Z";
    // BACK
    case "deep-u":
      return "M 108,125 Q 108,190 150,193 Q 192,190 192,125 Z";
    case "keyhole":
      return "M 140,125 L 140,155 A 10,10 0 1,0 160,155 L 160,125 Z";
    case "dori-style":
      return "M 145,125 L 145,180 L 155,180 L 155,125 Z";
    case "v-back":
      return "M 115,125 L 150,185 L 185,125 Z";
    case "round-back":
      return "M 120,125 A 30,30 0 0,1 180,125 Q 180,155 150,157 Q 120,155 120,125 Z";
    default:
      return "M 115,125 A 35,35 0 0,0 185,125 Q 185,158 150,160 Q 115,158 115,125 Z";
  }
}

// Bounding box of neckline for embroidery overlay positioning
function getNeckBounds(neckId: string): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  switch (neckId) {
    case "u-neck":
      return { x: 108, y: 122, w: 84, h: 58 };
    case "boat-neck":
      return { x: 93, y: 120, w: 114, h: 22 };
    case "v-neck":
      return { x: 113, y: 122, w: 74, h: 50 };
    case "round-neck":
      return { x: 113, y: 122, w: 74, h: 40 };
    case "square-neck":
      return { x: 108, y: 122, w: 84, h: 45 };
    case "deep-u":
      return { x: 106, y: 122, w: 88, h: 73 };
    case "keyhole":
      return { x: 136, y: 122, w: 28, h: 56 };
    case "dori-style":
      return { x: 142, y: 122, w: 16, h: 60 };
    case "v-back":
      return { x: 113, y: 122, w: 74, h: 65 };
    case "round-back":
      return { x: 118, y: 122, w: 64, h: 37 };
    default:
      return { x: 113, y: 122, w: 74, h: 40 };
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null;
}

export function VirtualTrialRoomPage({ onBack }: VirtualTrialRoomPageProps) {
  const { addToCart } = useAppStore();
  const { data: allDesigns } = useDesigns();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

  // View/config state
  const [view, setView] = useState<"front" | "back">("front");
  const [neckType, setNeckType] = useState("round-neck");
  const [blouseColor, setBlouseColor] = useState("#e8c4a0");
  const [embColor1, setEmbColor1] = useState("#d4af37");
  const [embColor2, setEmbColor2] = useState("#ffffff");
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [detectedColor, setDetectedColor] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const neckTypes = view === "front" ? FRONT_NECK_TYPES : BACK_NECK_TYPES;

  // Search results
  const searchResults =
    searchQuery.trim().length > 0
      ? allDesigns
          .filter((d) => !d.isHidden)
          .filter((d) => {
            const q = searchQuery.toLowerCase();
            return (
              d.title.toLowerCase().includes(q) ||
              d.designCode.toLowerCase().includes(q) ||
              (d.tags || []).some((t) => t.toLowerCase().includes(q))
            );
          })
          .slice(0, 8)
      : [];

  const handleSelectDesign = (design: Design) => {
    setSelectedDesign(design);
    setSearchQuery("");
    setSearchFocused(false);
  };

  const handleViewChange = (newView: "front" | "back") => {
    setView(newView);
    // Reset to first neck type of new view
    const types = newView === "front" ? FRONT_NECK_TYPES : BACK_NECK_TYPES;
    setNeckType(types[0].id);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadedPhoto(dataUrl);

      // Detect dominant color from center region
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        // Sample center 20x20 region
        const cx = Math.floor(img.width / 2);
        const cy = Math.floor(img.height / 2);
        const sampleSize = Math.min(20, Math.floor(img.width / 4));
        const imageData = ctx.getImageData(
          cx - sampleSize / 2,
          cy - sampleSize / 2,
          sampleSize,
          sampleSize,
        );
        let r = 0;
        let g = 0;
        let b = 0;
        const pixelCount = imageData.data.length / 4;
        for (let i = 0; i < imageData.data.length; i += 4) {
          r += imageData.data[i];
          g += imageData.data[i + 1];
          b += imageData.data[i + 2];
        }
        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);
        const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        setDetectedColor(hex);
        setBlouseColor(hex);
        toast.success(`Detected blouse color: ${hex.toUpperCase()}`);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleAddToStitching = () => {
    if (!selectedDesign) return;
    const item: CartItem = {
      designId: selectedDesign.id,
      designCode: selectedDesign.designCode,
      designTitle: selectedDesign.title,
      designImage: selectedDesign.images[0] || "",
      view,
      neckType,
      blouseColor,
      embColor1,
      embColor2,
      uploadedBlousePhoto: uploadedPhoto || undefined,
    };
    addToCart(item);
    toast.success("Added to Stitching Orders");
    onBack();
  };

  const neckPath = getNeckPath(neckType);
  const neckBounds = getNeckBounds(neckType);
  const embColor1Rgb = hexToRgb(embColor1);

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Scrollable content */}
      <div className="flex-1 overflow-auto pb-24">
        {/* Search Bar */}
        <div className="px-4 pt-4 pb-3 relative">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
            />
            <input
              data-ocid="trial_room.search_input"
              type="text"
              placeholder="Search Embroidery Design"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              className="w-full pl-9 pr-4 py-3 rounded-2xl border border-border bg-card shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Search dropdown */}
          {searchFocused && searchQuery.trim().length > 0 && (
            <div
              data-ocid="trial_room.search.popover"
              className="absolute top-full mt-0 left-4 right-4 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-30 max-h-60 overflow-y-auto"
            >
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No designs found
                </p>
              ) : (
                searchResults.map((design) => (
                  <button
                    type="button"
                    key={design.id}
                    data-ocid="trial_room.search.item"
                    onMouseDown={() => handleSelectDesign(design)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-b border-border/40 last:border-b-0"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {design.images[0] ? (
                        <img
                          src={design.images[0]}
                          alt={design.title}
                          className="w-full h-full object-contain bg-black"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-base">
                          🧵
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-primary">
                        {design.designCode}
                      </p>
                      <p className="text-sm text-foreground font-medium line-clamp-1">
                        {design.title}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected design chip */}
          {selectedDesign && (
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                <span>✓</span>
                {selectedDesign.designCode} — {selectedDesign.title}
                <button
                  type="button"
                  data-ocid="trial_room.design.close_button"
                  onClick={() => setSelectedDesign(null)}
                  className="ml-1 hover:text-primary/70"
                >
                  <X size={12} />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Front / Back Toggle */}
        <div className="px-4 pb-3">
          <div className="flex rounded-xl overflow-hidden border border-border bg-muted/40 p-1 gap-1">
            <button
              type="button"
              data-ocid="trial_room.front_view.toggle"
              onClick={() => handleViewChange("front")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === "front"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Front View
            </button>
            <button
              type="button"
              data-ocid="trial_room.back_view.toggle"
              onClick={() => handleViewChange("back")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === "back"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Back View
            </button>
          </div>
        </div>

        {/* SVG Mannequin Preview */}
        <div className="px-4 pb-4">
          <div
            data-ocid="trial_room.canvas_target"
            className="w-full max-w-xs mx-auto bg-gradient-to-b from-slate-100 to-slate-200 rounded-3xl overflow-hidden shadow-lg border border-border"
          >
            <svg
              viewBox="0 0 300 340"
              aria-label="Virtual trial room mannequin preview"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
            >
              <defs>
                <title>Mannequin blouse preview with embroidery</title>
                {/* Neck cutout clip for blouse */}
                <clipPath id="neckClip">
                  <path d={neckPath} />
                </clipPath>
                {/* Embroidery overlay clip = same neck path */}
                <clipPath id="embClip">
                  <path d={neckPath} />
                </clipPath>
              </defs>

              {/* Background gradient */}
              <defs>
                <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
              </defs>
              <rect width="300" height="340" fill="url(#bgGrad)" />

              {/* Head stub */}
              <ellipse cx="150" cy="32" rx="26" ry="30" fill="#f5d5bb" />
              {/* Hair */}
              <ellipse cx="150" cy="18" rx="28" ry="22" fill="#3d2314" />
              <ellipse cx="124" cy="34" rx="10" ry="18" fill="#3d2314" />
              <ellipse cx="176" cy="34" rx="10" ry="18" fill="#3d2314" />

              {/* Neck */}
              <rect
                x="134"
                y="58"
                width="32"
                height="68"
                rx="8"
                fill="#f0c8a0"
              />

              {/* Left shoulder */}
              <path
                d="M 80,125 Q 50,118 30,145 L 30,310 Q 80,310 80,270 Z"
                fill={blouseColor}
              />
              {/* Right shoulder */}
              <path
                d="M 220,125 Q 250,118 270,145 L 270,310 Q 220,310 220,270 Z"
                fill={blouseColor}
              />

              {/* Blouse body (full, beneath cutout) */}
              <path
                d="M 80,125 Q 90,120 150,118 Q 210,120 220,125 L 240,310 L 60,310 Z"
                fill={blouseColor}
              />

              {/* Skin showing through neckline */}
              <path d={neckPath} fill="#f0c8a0" opacity="0.7" />

              {/* Blouse body overlay with neck hole cut out */}
              <path
                d="M 80,125 Q 90,120 150,118 Q 210,120 220,125 L 240,310 L 60,310 Z"
                fill={blouseColor}
                style={{ mask: undefined }}
              />
              {/* Punch out the neck hole with a white blended rect — use even-odd fill rule */}
              <path
                fillRule="evenodd"
                d={`M 60,310 L 80,125 Q 90,120 150,118 Q 210,120 220,125 L 240,310 Z ${neckPath}`}
                fill={blouseColor}
              />

              {/* Blouse fabric shading/folds */}
              <path
                d="M 150,125 L 145,310"
                stroke="rgba(0,0,0,0.05)"
                strokeWidth="2"
              />
              <path
                d="M 110,130 L 100,310"
                stroke="rgba(0,0,0,0.04)"
                strokeWidth="1.5"
              />
              <path
                d="M 190,130 L 200,310"
                stroke="rgba(0,0,0,0.04)"
                strokeWidth="1.5"
              />

              {/* Sleeve hints */}
              <path
                d="M 80,130 Q 55,138 40,160 Q 30,180 32,210"
                stroke={blouseColor}
                strokeWidth="22"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 220,130 Q 245,138 260,160 Q 270,180 268,210"
                stroke={blouseColor}
                strokeWidth="22"
                strokeLinecap="round"
                fill="none"
              />
              {/* Sleeve border */}
              <path
                d="M 80,130 Q 55,138 40,160 Q 30,180 32,210"
                stroke="rgba(0,0,0,0.08)"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M 220,130 Q 245,138 260,160 Q 270,180 268,210"
                stroke="rgba(0,0,0,0.08)"
                strokeWidth="1"
                fill="none"
              />

              {/* Embroidery design overlay */}
              {selectedDesign?.images[0] && (
                <>
                  {/* Clip design image to neckline area */}
                  <image
                    href={selectedDesign.images[0]}
                    x={neckBounds.x}
                    y={neckBounds.y}
                    width={neckBounds.w}
                    height={neckBounds.h}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="url(#embClip)"
                    opacity="0.85"
                  />
                  {/* Color tint overlay using embColor1 */}
                  {embColor1Rgb && (
                    <rect
                      x={neckBounds.x}
                      y={neckBounds.y}
                      width={neckBounds.w}
                      height={neckBounds.h}
                      fill={`rgb(${embColor1Rgb.r},${embColor1Rgb.g},${embColor1Rgb.b})`}
                      opacity="0.18"
                      clipPath="url(#embClip)"
                      style={{ mixBlendMode: "multiply" }}
                    />
                  )}
                  {/* Second color accent dots */}
                  <circle
                    cx={neckBounds.x + neckBounds.w / 2}
                    cy={neckBounds.y + 4}
                    r="3"
                    fill={embColor2}
                    opacity="0.7"
                    clipPath="url(#embClip)"
                  />
                  <circle
                    cx={neckBounds.x + neckBounds.w / 4}
                    cy={neckBounds.y + 6}
                    r="2"
                    fill={embColor2}
                    opacity="0.5"
                    clipPath="url(#embClip)"
                  />
                  <circle
                    cx={neckBounds.x + (neckBounds.w * 3) / 4}
                    cy={neckBounds.y + 6}
                    r="2"
                    fill={embColor2}
                    opacity="0.5"
                    clipPath="url(#embClip)"
                  />
                </>
              )}

              {/* No design placeholder text */}
              {!selectedDesign && (
                <text
                  x="150"
                  y="230"
                  textAnchor="middle"
                  fontSize="11"
                  fill="rgba(0,0,0,0.3)"
                  fontFamily="sans-serif"
                >
                  Search & select a design
                </text>
              )}

              {/* View label */}
              <text
                x="150"
                y="328"
                textAnchor="middle"
                fontSize="10"
                fill="rgba(0,0,0,0.35)"
                fontFamily="sans-serif"
              >
                {view === "front" ? "Front View" : "Back View"}
              </text>
            </svg>
          </div>
        </div>

        {/* Neck Type Selector */}
        <div className="px-4 pb-4">
          <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2">
            Neck Style
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {neckTypes.map((neck) => (
              <button
                type="button"
                key={neck.id}
                data-ocid="trial_room.neck_type.toggle"
                onClick={() => setNeckType(neck.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                  neckType === neck.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:border-primary/40"
                }`}
              >
                {neck.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color Controls */}
        <div className="px-4 pb-4 space-y-4">
          {/* Blouse Color */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-3">
              Blouse Color
            </p>
            <div className="flex items-center gap-3">
              <label
                htmlFor="blouseColor"
                className="relative cursor-pointer"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: blouseColor,
                  border: "3px solid rgba(0,0,0,0.12)",
                  display: "block",
                  overflow: "hidden",
                }}
              >
                <input
                  id="blouseColor"
                  data-ocid="trial_room.blouse_color.input"
                  type="color"
                  value={blouseColor}
                  onChange={(e) => setBlouseColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {blouseColor.toUpperCase()}
                </p>
                {detectedColor && (
                  <p className="text-xs text-muted-foreground">
                    Auto-detected from photo
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Embroidery Colors */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-3">
              Embroidery Colors
            </p>
            <div className="grid grid-cols-2 gap-4">
              {/* Color 1 */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Color 1 (Primary)
                </p>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="embColor1"
                    className="relative cursor-pointer"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: embColor1,
                      border: "3px solid rgba(0,0,0,0.12)",
                      display: "block",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <input
                      id="embColor1"
                      data-ocid="trial_room.emb_color1.input"
                      type="color"
                      value={embColor1}
                      onChange={(e) => setEmbColor1(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </label>
                  <span className="text-xs font-mono text-foreground">
                    {embColor1.toUpperCase()}
                  </span>
                </div>
              </div>
              {/* Color 2 */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Color 2 (Accent)
                </p>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="embColor2"
                    className="relative cursor-pointer"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: embColor2,
                      border: "3px solid rgba(0,0,0,0.12)",
                      display: "block",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <input
                      id="embColor2"
                      data-ocid="trial_room.emb_color2.input"
                      type="color"
                      value={embColor2}
                      onChange={(e) => setEmbColor2(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </label>
                  <span className="text-xs font-mono text-foreground">
                    {embColor2.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Blouse Photo */}
        <div className="px-4 pb-6">
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-3">
              Upload Blouse Photo
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              We&apos;ll automatically detect your blouse color.
            </p>

            <button
              type="button"
              data-ocid="trial_room.upload_button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors w-full justify-center"
            >
              <Upload size={16} />
              Upload My Blouse Photo
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {uploadedPhoto && (
              <div className="mt-3 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-border flex-shrink-0">
                  <img
                    src={uploadedPhoto}
                    alt="Uploaded blouse"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">
                    Photo uploaded
                  </p>
                  {detectedColor && (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ background: detectedColor }}
                      />
                      <span className="text-xs text-muted-foreground">
                        Detected: {detectedColor.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  data-ocid="trial_room.photo.close_button"
                  onClick={() => {
                    setUploadedPhoto(null);
                    setDetectedColor(null);
                  }}
                  className="ml-auto p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for color detection */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Sticky Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3 pb-safe flex gap-3 z-20">
        <button
          type="button"
          data-ocid="trial_room.cancel.button"
          onClick={onBack}
          className="flex-1 py-3.5 rounded-2xl border border-border bg-muted text-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          Cancel
        </button>
        <button
          type="button"
          data-ocid="trial_room.add_to_stitching.primary_button"
          disabled={!selectedDesign}
          onClick={handleAddToStitching}
          className={`flex-[2] py-3.5 rounded-2xl font-bold text-sm transition-all ${
            selectedDesign
              ? "bg-primary text-primary-foreground shadow-sm active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          🧵 Add to Stitching
        </button>
      </div>
    </div>
  );
}
