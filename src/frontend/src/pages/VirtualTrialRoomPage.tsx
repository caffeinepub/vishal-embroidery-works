import {
  Camera,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BlouseMannequin } from "../components/BlouseMannequin";
import type { NeckShape, SleeveLength } from "../components/BlouseMannequin";
import { useDesigns } from "../hooks/useFirestore";
import { getOptimizedImageUrl } from "../lib/imageUtils";
import type { CartItem, Design } from "../lib/storage";
import { useAppStore } from "../store/appStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VirtualTrialRoomPageProps {
  onBack: () => void;
  initialDesign?: Design | null;
}

type ViewType = "front" | "back" | "left" | "right";
type MainTab = "embroidery" | "blouses";
type EmbZoneKey = "frontNeck" | "backNeck" | "leftSleeve" | "rightSleeve";

interface ZoneTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

interface DraggableEmbroideryZoneProps {
  part: "front" | "back" | "sleeve";
  imageUrl: string;
  defaultStyle: { top: string; left: string; width: string; height: string };
  isActive: boolean;
  onActivate: () => void;
  embColor1: string;
  embColor2: string;
  repeatY?: boolean;
  transform: ZoneTransform;
  onTransformChange: (t: ZoneTransform) => void;
  onReset: () => void;
  mirrorX?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_ZONE_TRANSFORMS: Record<EmbZoneKey, ZoneTransform> = {
  frontNeck: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
  backNeck: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
  leftSleeve: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
  rightSleeve: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
};

const NECK_ZONE_POSITIONS: Record<
  NeckShape,
  { top: string; left: string; width: string; height: string }
> = {
  "u-neck": { top: "12%", left: "22%", width: "56%", height: "20%" },
  "boat-neck": { top: "10%", left: "15%", width: "70%", height: "14%" },
  "deep-back": { top: "10%", left: "25%", width: "50%", height: "28%" },
  "princess-cut": { top: "10%", left: "20%", width: "60%", height: "16%" },
};

const ZONE_DEFAULT_STYLES: Record<
  EmbZoneKey,
  { top: string; left: string; width: string; height: string }
> = {
  frontNeck: NECK_ZONE_POSITIONS["u-neck"],
  backNeck: NECK_ZONE_POSITIONS["u-neck"],
  leftSleeve: { top: "38%", left: "3%", width: "20%", height: "32%" },
  rightSleeve: { top: "38%", left: "77%", width: "20%", height: "32%" },
};

const BLOUSE_COLORS = [
  { label: "White", hex: "#FFFFFF" },
  { label: "Cream", hex: "#FFF8E7" },
  { label: "Pink", hex: "#FFB6C1" },
  { label: "Blue", hex: "#ADD8E6" },
  { label: "Yellow", hex: "#FFFACD" },
  { label: "Red", hex: "#FFB3B3" },
  { label: "Green", hex: "#B5EAD7" },
];

const EMBROIDERY_SUBCATEGORIES = [
  { label: "Embroidery", key: "embroidery" },
  { label: "Ready Blouse Emb", key: "ready-blouse-embroidery" },
];

const BLOUSE_SUBCATEGORIES = [
  { label: "Simple", key: "simple" },
  { label: "Boat Neck", key: "boat-neck" },
  { label: "Bridal", key: "bridal" },
  { label: "Design", key: "design" },
];

const VIEW_BUTTONS: { key: ViewType; label: string }[] = [
  { key: "front", label: "Front" },
  { key: "back", label: "Back" },
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
];

const NECK_SHAPES: { key: NeckShape; label: string }[] = [
  { key: "u-neck", label: "U Neck" },
  { key: "boat-neck", label: "Boat Neck" },
  { key: "deep-back", label: "Deep Back" },
  { key: "princess-cut", label: "Princess Cut" },
];

const SLEEVE_LENGTHS: { key: SleeveLength; label: string }[] = [
  { key: "short", label: "Short" },
  { key: "elbow", label: "Elbow" },
  { key: "full", label: "Full" },
];

const AI_MODELS = [
  { id: 1, label: "Model 1", desc: "Light skin tone", skinColor: "#F9D5B5" },
  { id: 2, label: "Model 2", desc: "Medium skin tone", skinColor: "#D4945E" },
  { id: 3, label: "Model 3", desc: "Dark skin tone", skinColor: "#8B5E3C" },
  {
    id: 4,
    label: "Model 4",
    desc: "Different body shape",
    skinColor: "#C08A6A",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function colorToFilter(hex: string): string {
  const { h } = hexToHsl(hex);
  return `sepia(1) saturate(3) hue-rotate(${h - 10}deg) brightness(0.9)`;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

async function detectDominantColor(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 50;
      canvas.height = 50;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("#FFFFFF");
        URL.revokeObjectURL(url);
        return;
      }
      ctx.drawImage(img, 0, 0, 50, 50);
      const data = ctx.getImageData(0, 0, 50, 50).data;
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a > 128) {
          rSum += data[i];
          gSum += data[i + 1];
          bSum += data[i + 2];
          count++;
        }
      }
      URL.revokeObjectURL(url);
      if (count === 0) {
        resolve("#FFFFFF");
        return;
      }
      resolve(rgbToHex(rSum / count, gSum / count, bSum / count));
    };
    img.onerror = () => {
      resolve("#FFFFFF");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

// ─── DraggableEmbroideryZone ──────────────────────────────────────────────────

function DraggableEmbroideryZone({
  part,
  imageUrl,
  defaultStyle,
  isActive,
  onActivate,
  embColor1,
  onTransformChange,
  onReset,
  transform,
  repeatY = false,
  mirrorX = false,
}: DraggableEmbroideryZoneProps) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const isRotating = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const startTransform = useRef<ZoneTransform>({ ...transform });

  const partOffset =
    part === "front" ? "0%" : part === "back" ? "-100%" : "-200%";
  const currentFilter = colorToFilter(embColor1);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, mode: "drag" | "resize" | "rotate") => {
      e.stopPropagation();
      onActivate();
      if (mode === "drag") isDragging.current = true;
      else if (mode === "resize") isResizing.current = true;
      else isRotating.current = true;
      startPointer.current = { x: e.clientX, y: e.clientY };
      startTransform.current = { ...transform };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [onActivate, transform],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current && !isResizing.current && !isRotating.current)
        return;
      const dx = e.clientX - startPointer.current.x;
      const dy = e.clientY - startPointer.current.y;

      if (isDragging.current) {
        onTransformChange({
          ...startTransform.current,
          x: startTransform.current.x + dx,
          y: startTransform.current.y + dy,
        });
      } else if (isResizing.current) {
        onTransformChange({
          ...startTransform.current,
          scaleX: Math.max(0.3, startTransform.current.scaleX + dx / 80),
          scaleY: Math.max(0.3, startTransform.current.scaleY + dy / 80),
        });
      } else if (isRotating.current) {
        onTransformChange({
          ...startTransform.current,
          rotation: startTransform.current.rotation + dx * 0.5,
        });
      }
    },
    [onTransformChange],
  );

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    isResizing.current = false;
    isRotating.current = false;
  }, []);

  // Mirror X for right sleeve (scaleX(-1) to simulate copy→mirror)
  const mirrorTransform = mirrorX ? " scaleX(-1)" : "";
  const transformCss = `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})${mirrorTransform}`;

  return (
    <div
      ref={zoneRef}
      className="absolute"
      style={{
        top: defaultStyle.top,
        left: defaultStyle.left,
        width: defaultStyle.width,
        height: defaultStyle.height,
        transform: transformCss,
        transformOrigin: "center center",
        cursor: isActive ? "move" : "pointer",
        zIndex: isActive ? 30 : 20,
        outline: isActive ? "2px solid rgba(59,130,246,0.8)" : "none",
        borderRadius: "4px",
        touchAction: "none",
      }}
      onPointerDown={(e) => onPointerDown(e, "drag")}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          borderRadius: "4px",
        }}
      >
        {repeatY ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundImage: `url(${imageUrl})`,
              backgroundRepeat: "repeat-y",
              backgroundSize: "300% auto",
              backgroundPosition: `${part === "sleeve" ? "66.67%" : "0%"} top`,
              mixBlendMode: "multiply",
              filter: currentFilter,
              opacity: 0.88,
            }}
          />
        ) : (
          <img
            src={imageUrl}
            alt="embroidery zone"
            draggable={false}
            style={{
              width: "300%",
              height: "100%",
              objectFit: "cover",
              marginLeft: partOffset,
              display: "block",
              mixBlendMode: "multiply",
              filter: currentFilter,
              opacity: 0.88,
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        )}
      </div>

      {isActive && (
        <>
          <div
            className="absolute flex items-center justify-center"
            style={{
              top: "-14px",
              right: "-14px",
              width: "24px",
              height: "24px",
              background: "#3b82f6",
              borderRadius: "50%",
              cursor: "grab",
              zIndex: 40,
              touchAction: "none",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            }}
            onPointerDown={(e) => onPointerDown(e, "rotate")}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <RotateCcw size={11} color="white" />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "-10px",
              right: "-10px",
              width: "20px",
              height: "20px",
              background: "#3b82f6",
              borderRadius: "3px",
              cursor: "se-resize",
              zIndex: 40,
              touchAction: "none",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            }}
            onPointerDown={(e) => onPointerDown(e, "resize")}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            style={{
              position: "absolute",
              top: "-14px",
              left: "-14px",
              width: "24px",
              height: "24px",
              background: "#ef4444",
              borderRadius: "50%",
              cursor: "pointer",
              zIndex: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            }}
          >
            <X size={10} color="white" />
          </button>
        </>
      )}
    </div>
  );
}

// ─── AI Preview Modal ─────────────────────────────────────────────────────────

interface AIPreviewModalProps {
  onClose: () => void;
  selectedDesign: Design | null;
  blouseColor: string;
  neckShape: NeckShape;
  sleeveLength: SleeveLength;
  designImageUrl: string | null;
}

function AIPreviewModal({
  onClose,
  selectedDesign,
  blouseColor,
  neckShape,
  sleeveLength,
  designImageUrl,
}: AIPreviewModalProps) {
  const [selectedModel, setSelectedModel] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setPreviewReady(false);
    setTimeout(() => {
      setGenerating(false);
      setPreviewReady(true);
    }, 2500);
  };

  const handleSave = () => {
    toast.success("AI Preview saved to gallery");
  };

  const modelData = AI_MODELS.find((m) => m.id === selectedModel)!;
  const neckLabel =
    NECK_SHAPES.find((n) => n.key === neckShape)?.label ?? neckShape;
  const sleeveLabel =
    SLEEVE_LENGTHS.find((s) => s.key === sleeveLength)?.label ?? sleeveLength;

  return (
    <section
      data-ocid="trial_room.ai_modal.modal"
      className="fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur-md"
      aria-label="AI Realistic Preview"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h2 className="text-base font-bold">AI Realistic Preview</h2>
        </div>
        <button
          type="button"
          data-ocid="trial_room.ai_modal.close_button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Model selector */}
        {!previewReady && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Select Model
            </p>
            <div className="grid grid-cols-2 gap-3">
              {AI_MODELS.map((model, idx) => (
                <button
                  key={model.id}
                  type="button"
                  data-ocid={`trial_room.model_selector.item.${idx + 1}`}
                  onClick={() => setSelectedModel(model.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selectedModel === model.id
                      ? "border-primary bg-primary/8 shadow-sm"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  {/* Skin tone avatar circle */}
                  <div
                    className="flex-shrink-0 rounded-full border-2 border-white shadow"
                    style={{
                      width: model.id === 4 ? "44px" : "38px",
                      height: "38px",
                      background: `radial-gradient(circle at 38% 35%, ${model.skinColor}dd, ${model.skinColor}88)`,
                    }}
                  />
                  <div>
                    <p className="text-xs font-bold">{model.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {model.desc}
                    </p>
                  </div>
                  {selectedModel === model.id && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M1 4l2 2 4-4"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generating state */}
        {generating && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Sparkles
                size={20}
                className="absolute inset-0 m-auto text-primary"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">
                Generating realistic preview...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AI rendering embroidery details
              </p>
            </div>
            {/* Progress steps */}
            <div className="space-y-1.5 w-full max-w-[240px]">
              {[
                "Analyzing embroidery pattern",
                "Applying 3D thread texture",
                "Rendering fabric folds",
                "Adding realistic lighting",
              ].map((step, i) => (
                <div
                  key={step}
                  className="flex items-center gap-2 text-[10px] text-muted-foreground"
                >
                  <Loader2
                    size={10}
                    className="animate-spin"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview result */}
        {previewReady && !generating && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              AI Generated Preview
            </p>

            {/* Simulated AI preview canvas */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${blouseColor}22 0%, ${blouseColor}44 50%, ${blouseColor}22 100%)`,
                border: `2px solid ${blouseColor}88`,
                minHeight: "280px",
              }}
            >
              {/* Fabric fold SVG overlay */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
                opacity={0.06}
                aria-hidden="true"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                  <line
                    key={`fold-line-${i}`}
                    x1={`${i * 9}%`}
                    y1="0%"
                    x2={`${i * 9 + 4}%`}
                    y2="100%"
                    stroke="#000"
                    strokeWidth="8"
                  />
                ))}
              </svg>

              {/* Lighting gradient */}
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{
                  background:
                    "radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.35) 0%, transparent 65%)",
                }}
              />

              {/* Design image */}
              {designImageUrl ? (
                <img
                  src={designImageUrl}
                  alt="AI Preview"
                  className="w-full object-contain"
                  style={{
                    maxHeight: "220px",
                    filter:
                      "drop-shadow(0 8px 16px rgba(0,0,0,0.3)) saturate(1.1) contrast(1.05)",
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-40">
                  <span className="text-4xl">🧵</span>
                </div>
              )}

              {/* 3D Thread Texture label */}
              <div
                className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
              >
                3D Thread Texture Simulation
              </div>

              {/* Embroidery border effect */}
              <div
                className="absolute inset-2 rounded-xl pointer-events-none"
                style={{
                  boxShadow:
                    "inset 0 0 0 2px rgba(139,69,19,0.3), inset 0 0 0 4px rgba(255,215,0,0.15)",
                }}
              />

              {/* Info overlay at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 px-3 py-2"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    {selectedDesign && (
                      <p className="text-white text-[11px] font-bold">
                        {selectedDesign.designCode}
                      </p>
                    )}
                    <p className="text-white/80 text-[9px]">
                      {neckLabel} · {sleeveLabel} sleeve · {modelData.desc}
                    </p>
                  </div>
                  {/* Blouse color + model swatch */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 rounded-full border border-white/50"
                      style={{ background: blouseColor }}
                      title={`Blouse: ${blouseColor}`}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-white/50"
                      style={{ background: modelData.skinColor }}
                      title={modelData.desc}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Embroidery detail callouts */}
            <div className="grid grid-cols-3 gap-2">
              {["Raised 3D stitch", "Fabric folds", "Realistic lighting"].map(
                (label) => (
                  <div
                    key={label}
                    className="bg-muted/50 rounded-lg px-2 py-1.5 text-center"
                  >
                    <p className="text-[9px] text-muted-foreground">{label}</p>
                    <div className="flex justify-center mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="text-primary text-[8px]">
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border flex gap-3">
        {!previewReady ? (
          <button
            type="button"
            data-ocid="trial_room.generate_preview.primary_button"
            onClick={handleGenerate}
            disabled={generating}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={15} /> Generate Preview
              </>
            )}
          </button>
        ) : (
          <>
            <button
              type="button"
              data-ocid="trial_room.ai_preview_save.button"
              onClick={handleSave}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2 transition-colors"
            >
              Save Preview
            </button>
            <button
              type="button"
              onClick={() => setPreviewReady(false)}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VirtualTrialRoomPage({
  onBack,
  initialDesign,
}: VirtualTrialRoomPageProps) {
  const { addToCart } = useAppStore();
  const { data: allDesigns } = useDesigns();
  const mannequinContainerRef = useRef<HTMLDivElement>(null);

  const [activeView, setActiveView] = useState<ViewType>("front");
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("embroidery");
  const [activeSubcategory, setActiveSubcategory] = useState("embroidery");
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(
    initialDesign ?? null,
  );
  const [blouseColor, setBlouseColor] = useState("#FFFFFF");
  const [embColor1, setEmbColor1] = useState("#8B0000");
  const [embColor2, setEmbColor2] = useState("#FFD700");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeZone, setActiveZone] = useState<EmbZoneKey | null>(null);
  const [zoneTransforms, setZoneTransforms] = useState<
    Record<EmbZoneKey, ZoneTransform>
  >({ ...DEFAULT_ZONE_TRANSFORMS });
  const [neckShape, setNeckShape] = useState<NeckShape>("u-neck");
  const [sleeveLength, setSleeveLength] = useState<SleeveLength>("short");
  const [showAIModal, setShowAIModal] = useState(false);

  // Fabric photo state
  const [fabricPhotoUrl, setFabricPhotoUrl] = useState<string | null>(null);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Zone styles derived from neck shape
  const neckZoneStyle = NECK_ZONE_POSITIONS[neckShape];

  // Sync initialDesign
  useEffect(() => {
    if (initialDesign) {
      setSelectedDesign(initialDesign);
      if (initialDesign.category === "blouse") {
        setActiveMainTab("blouses");
        setActiveSubcategory(initialDesign.subcategory || "simple");
      } else {
        setActiveMainTab("embroidery");
        setActiveSubcategory(initialDesign.subcategory || "embroidery");
      }
    }
  }, [initialDesign]);

  // Reset neck zone positions when neckShape changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: setZoneTransforms is stable
  useEffect(() => {
    setZoneTransforms((prev) => ({
      ...prev,
      frontNeck: { ...DEFAULT_ZONE_TRANSFORMS.frontNeck },
      backNeck: { ...DEFAULT_ZONE_TRANSFORMS.backNeck },
    }));
  }, [neckShape]);

  // Click outside to deselect zone
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        mannequinContainerRef.current &&
        !mannequinContainerRef.current.contains(e.target as Node)
      ) {
        setActiveZone(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const currentSubcategories =
    activeMainTab === "embroidery"
      ? EMBROIDERY_SUBCATEGORIES
      : BLOUSE_SUBCATEGORIES;

  const filteredDesigns = allDesigns.filter(
    (d) => !d.isHidden && d.subcategory === activeSubcategory,
  );

  const searchResults =
    searchQuery.trim().length > 1
      ? allDesigns
          .filter((d) => !d.isHidden)
          .filter((d) => {
            const q = searchQuery.toLowerCase();
            return (
              d.designCode.toLowerCase().includes(q) ||
              d.title.toLowerCase().includes(q)
            );
          })
          .slice(0, 8)
      : [];

  const handleSelectDesign = (design: Design) => {
    setSelectedDesign(design);
    setSearchQuery("");
    setShowSearchResults(false);
    setZoneTransforms({ ...DEFAULT_ZONE_TRANSFORMS });
    setActiveZone(null);
  };

  const handleMainTabChange = (tab: MainTab) => {
    setActiveMainTab(tab);
    setActiveSubcategory(tab === "embroidery" ? "embroidery" : "simple");
  };

  const updateZoneTransform = (key: EmbZoneKey) => (t: ZoneTransform) => {
    setZoneTransforms((prev) => ({ ...prev, [key]: t }));
  };

  const resetZone = (key: EmbZoneKey) => () => {
    setZoneTransforms((prev) => ({
      ...prev,
      [key]: { ...DEFAULT_ZONE_TRANSFORMS[key] },
    }));
  };

  const handleFabricPhoto = async (file: File) => {
    setShowPhotoSheet(false);
    const url = URL.createObjectURL(file);
    if (fabricPhotoUrl) URL.revokeObjectURL(fabricPhotoUrl);
    setFabricPhotoUrl(url);
    const detected = await detectDominantColor(file);
    setBlouseColor(detected);
    toast.success("Fabric color detected!");
  };

  const removeFabricPhoto = () => {
    if (fabricPhotoUrl) URL.revokeObjectURL(fabricPhotoUrl);
    setFabricPhotoUrl(null);
    setBlouseColor("#FFFFFF");
  };

  const handleAddToStitching = () => {
    if (!selectedDesign) {
      toast.error("Please select a design first");
      return;
    }
    const item: CartItem = {
      designId: selectedDesign.id,
      designCode: selectedDesign.designCode,
      designTitle: selectedDesign.title,
      designImage: selectedDesign.images[0] || "",
      view: activeView as "front" | "back",
      blouseColor,
    };
    addToCart(item);
    toast.success("Added to Stitching Orders ✂️");
    onBack();
  };

  // Visible zones per view
  const visibleZones: EmbZoneKey[] = (() => {
    switch (activeView) {
      case "front":
        return ["frontNeck", "leftSleeve", "rightSleeve"];
      case "back":
        return ["backNeck", "leftSleeve", "rightSleeve"];
      case "left":
        return ["leftSleeve"];
      case "right":
        return ["rightSleeve"];
    }
  })();

  const zonePartMap: Record<EmbZoneKey, "front" | "back" | "sleeve"> = {
    frontNeck: "front",
    backNeck: "back",
    leftSleeve: "sleeve",
    rightSleeve: "sleeve",
  };

  // Zone default styles incorporating neck shape
  const getZoneStyle = (key: EmbZoneKey) => {
    if (key === "frontNeck" || key === "backNeck") return neckZoneStyle;
    return ZONE_DEFAULT_STYLES[key];
  };

  const designImageUrl = selectedDesign?.images[0]
    ? getOptimizedImageUrl(selectedDesign.images[0], 600)
    : null;

  return (
    <div
      className="flex flex-col h-full bg-background overflow-hidden"
      role="presentation"
      onClick={() => {
        setActiveZone(null);
        setShowPhotoSheet(false);
      }}
      onKeyDown={() => {
        setActiveZone(null);
        setShowPhotoSheet(false);
      }}
    >
      {/* AI Preview Modal */}
      {showAIModal && (
        <AIPreviewModal
          onClose={() => setShowAIModal(false)}
          selectedDesign={selectedDesign}
          blouseColor={blouseColor}
          neckShape={neckShape}
          sleeveLength={sleeveLength}
          designImageUrl={designImageUrl}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        {/* ── Search bar ─────────────────────────────── */}
        <div className="px-4 pt-3 pb-2 sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div className="relative" ref={searchRef}>
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              data-ocid="trial_room.search_input"
              type="text"
              placeholder="Search Design (Example: EMB001)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground/60 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-30 max-h-52 overflow-y-auto">
                {searchResults.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelectDesign(d)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                  >
                    {d.images[0] && (
                      <img
                        src={getOptimizedImageUrl(d.images[0], 80)}
                        alt={d.title}
                        className="w-10 h-7 object-contain rounded bg-black/5"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary">
                        {d.designCode}
                      </p>
                      <p className="text-[11px] text-foreground/70 truncate">
                        {d.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Main tabs ──────────────────────────────── */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
            {(["embroidery", "blouses"] as MainTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                data-ocid={`trial_room.${tab}.tab`}
                onClick={() => handleMainTabChange(tab)}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  activeMainTab === tab
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "embroidery" ? "Embroidery" : "Blouses"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Subcategory chips ──────────────────────── */}
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {currentSubcategories.map((sub) => (
              <button
                key={sub.key}
                type="button"
                data-ocid="trial_room.subcategory.tab"
                onClick={() => setActiveSubcategory(sub.key)}
                className={`flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                  activeSubcategory === sub.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── View switch buttons ────────────────────── */}
        <div className="px-4 pb-2">
          <div className="flex gap-2">
            {VIEW_BUTTONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                data-ocid={`trial_room.${key}_view.button`}
                onClick={() => {
                  setActiveView(key);
                  setActiveZone(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  activeView === key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Mannequin SVG preview ──────────────────── */}
        <div className="px-3 pb-3">
          <div
            ref={mannequinContainerRef}
            className="relative w-full rounded-2xl overflow-hidden"
            style={{
              minHeight: "320px",
              background:
                "linear-gradient(160deg, #f7f3ef 0%, #ede8e2 50%, #e0d9d0 100%)",
            }}
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {/* Fabric texture overlay */}
            {fabricPhotoUrl && (
              <div
                className="absolute inset-0 z-10 pointer-events-none rounded-2xl"
                style={{
                  backgroundImage: `url(${fabricPhotoUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: 0.35,
                  mixBlendMode: "overlay",
                }}
              />
            )}

            {/* SVG Mannequin */}
            <div
              className="relative z-0 w-full flex justify-center"
              style={{ minHeight: "320px" }}
            >
              <BlouseMannequin
                blouseColor={blouseColor}
                neckShape={neckShape}
                sleeveLength={sleeveLength}
                view={activeView}
                style={{ maxHeight: "420px", width: "100%" }}
              />
            </div>

            {/* Embroidery zone overlays */}
            {designImageUrl &&
              visibleZones.map((zoneKey) => (
                <DraggableEmbroideryZone
                  key={`${zoneKey}-${activeView}-${neckShape}`}
                  part={zonePartMap[zoneKey]}
                  imageUrl={designImageUrl}
                  defaultStyle={getZoneStyle(zoneKey)}
                  isActive={activeZone === zoneKey}
                  onActivate={() => setActiveZone(zoneKey)}
                  embColor1={embColor1}
                  embColor2={embColor2}
                  repeatY={
                    zoneKey === "leftSleeve" || zoneKey === "rightSleeve"
                  }
                  transform={zoneTransforms[zoneKey]}
                  onTransformChange={updateZoneTransform(zoneKey)}
                  onReset={resetZone(zoneKey)}
                  mirrorX={zoneKey === "rightSleeve"}
                />
              ))}

            {/* Selected design badge */}
            {selectedDesign && (
              <div className="absolute top-2 right-2 z-30 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {selectedDesign.designCode}
              </div>
            )}

            {/* Zone hint */}
            {selectedDesign && (
              <div className="absolute bottom-2 left-2 z-30 bg-black/50 text-white text-[9px] px-2 py-0.5 rounded-full">
                Tap zone to adjust
              </div>
            )}

            {/* No design hint */}
            {!selectedDesign && (
              <div className="absolute inset-0 flex items-end justify-center pb-6 z-10 pointer-events-none">
                <p className="text-xs text-gray-400 font-medium bg-white/60 px-3 py-1 rounded-full">
                  Tap a design below to preview
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Neck Shape selector ────────────────────── */}
        <div className="px-4 pb-3">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Neck Shape
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {NECK_SHAPES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                data-ocid="trial_room.neck_shape.tab"
                onClick={() => setNeckShape(key)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  neckShape === key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sleeve Length selector ─────────────────── */}
        <div className="px-4 pb-3">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Sleeve Length
          </p>
          <div className="flex gap-2">
            {SLEEVE_LENGTHS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                data-ocid="trial_room.sleeve_length.tab"
                onClick={() => setSleeveLength(key)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  sleeveLength === key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Zone toggles ──────────────────────────── */}
        <div className="px-4 pb-2">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Embroidery Zones
          </p>
          <div className="flex gap-2 flex-wrap">
            {[
              {
                key: "frontNeck" as EmbZoneKey,
                label: "Front Neck",
                ocid: "trial_room.zone_front.toggle",
                views: ["front"],
              },
              {
                key: "backNeck" as EmbZoneKey,
                label: "Back Neck",
                ocid: "trial_room.zone_back.toggle",
                views: ["back"],
              },
              {
                key: "leftSleeve" as EmbZoneKey,
                label: "L. Sleeve",
                ocid: "trial_room.zone_left_sleeve.toggle",
                views: ["front", "back", "left"],
              },
              {
                key: "rightSleeve" as EmbZoneKey,
                label: "R. Sleeve",
                ocid: "trial_room.zone_right_sleeve.toggle",
                views: ["front", "back", "right"],
              },
            ].map(({ key, label, ocid }) => (
              <button
                key={key}
                type="button"
                data-ocid={ocid}
                onClick={() => {
                  if (key === "frontNeck") setActiveView("front");
                  else if (key === "backNeck") setActiveView("back");
                  else if (key === "leftSleeve") setActiveView("left");
                  else if (key === "rightSleeve") setActiveView("right");
                  setActiveZone(key);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                  activeZone === key
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-background text-muted-foreground border-border hover:border-blue-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Blouse color picker ────────────────────── */}
        <div className="px-4 pb-3">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Blouse Color
          </p>
          <div className="flex gap-2.5 flex-wrap items-center">
            {BLOUSE_COLORS.map(({ label, hex }) => (
              <button
                key={hex}
                type="button"
                title={label}
                data-ocid="trial_room.blouse_color.button"
                onClick={() => setBlouseColor(hex)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  blouseColor === hex
                    ? "border-primary scale-110 shadow-md"
                    : "border-border hover:border-primary/50"
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
            <input
              type="color"
              value={blouseColor}
              onChange={(e) => setBlouseColor(e.target.value)}
              title="Custom color"
              className="w-7 h-7 rounded-full border-2 border-border cursor-pointer"
              style={{ padding: 0 }}
            />
          </div>
        </div>

        {/* ── Embroidery color pickers ───────────────── */}
        <div className="px-4 pb-3">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Embroidery Colors
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="emb-color1"
                className="text-xs text-muted-foreground"
              >
                Color 1
              </label>
              <input
                type="color"
                id="emb-color1"
                data-ocid="trial_room.emb_color1.input"
                value={embColor1}
                onChange={(e) => setEmbColor1(e.target.value)}
                className="w-8 h-8 rounded-full border-2 border-border cursor-pointer"
                style={{ padding: 0 }}
              />
              <span className="text-xs font-mono text-muted-foreground">
                {embColor1}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="emb-color2"
                className="text-xs text-muted-foreground"
              >
                Color 2
              </label>
              <input
                type="color"
                id="emb-color2"
                data-ocid="trial_room.emb_color2.input"
                value={embColor2}
                onChange={(e) => setEmbColor2(e.target.value)}
                className="w-8 h-8 rounded-full border-2 border-border cursor-pointer"
                style={{ padding: 0 }}
              />
              <span className="text-xs font-mono text-muted-foreground">
                {embColor2}
              </span>
            </div>
          </div>
        </div>

        {/* ── Add to Photo button ────────────────────── */}
        <div className="px-4 pb-3">
          <div className="relative">
            <button
              type="button"
              data-ocid="trial_room.add_to_photo.button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPhotoSheet((v) => !v);
              }}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground hover:border-primary/60 hover:text-foreground transition-all flex items-center justify-center gap-2"
            >
              <ImageIcon size={16} />
              Add to Photo
            </button>

            {showPhotoSheet && (
              <div
                className="absolute bottom-full mb-2 left-0 right-0 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                role="presentation"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <p className="text-xs font-bold text-muted-foreground px-4 py-2 border-b border-border">
                  Select Source
                </p>
                <button
                  type="button"
                  data-ocid="trial_room.camera.button"
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-sm font-medium"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera size={18} className="text-primary" />
                  Camera
                </button>
                <button
                  type="button"
                  data-ocid="trial_room.gallery.button"
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-sm font-medium border-t border-border"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <ImageIcon size={18} className="text-primary" />
                  Gallery
                </button>
              </div>
            )}
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            data-ocid="trial_room.fabric_photo.upload_button"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFabricPhoto(f);
              e.target.value = "";
            }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFabricPhoto(f);
              e.target.value = "";
            }}
          />

          {fabricPhotoUrl && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={fabricPhotoUrl}
                alt="Fabric"
                className="w-12 h-12 object-cover rounded-lg border border-border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">Fabric detected</p>
                <p className="text-[10px] text-muted-foreground">
                  Color applied to blouse
                </p>
              </div>
              <button
                type="button"
                onClick={removeFabricPhoto}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── Design horizontal slider ───────────────── */}
        <div className="pb-4">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 px-4 uppercase tracking-wider">
            {currentSubcategories.find((s) => s.key === activeSubcategory)
              ?.label || "Designs"}
          </p>
          {filteredDesigns.length === 0 ? (
            <div
              data-ocid="trial_room.designs.empty_state"
              className="mx-4 py-6 rounded-xl bg-muted/30 text-center"
            >
              <p className="text-sm text-muted-foreground">
                No designs in this category yet
              </p>
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-2">
              {filteredDesigns.map((design) => (
                <button
                  key={design.id}
                  type="button"
                  data-ocid="trial_room.design_slider.button"
                  onClick={() => handleSelectDesign(design)}
                  className={`flex-shrink-0 w-[80px] rounded-xl overflow-hidden border-2 transition-all ${
                    selectedDesign?.id === design.id
                      ? "border-primary shadow-md scale-105"
                      : "border-transparent bg-card shadow-sm hover:border-primary/40"
                  }`}
                >
                  <div
                    className="relative bg-black/5"
                    style={{ paddingBottom: "42.77%" }}
                  >
                    {design.images[0] ? (
                      <img
                        src={getOptimizedImageUrl(design.images[0], 160)}
                        alt={design.designCode}
                        className="absolute inset-0 w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg">🧵</span>
                      </div>
                    )}
                  </div>
                  <div className="py-1 px-1 bg-card">
                    <p className="text-[9px] font-bold text-primary truncate text-center">
                      {design.designCode}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Generate AI Preview button ─────────────── */}
        <div className="px-4 pb-4">
          <button
            type="button"
            data-ocid="trial_room.ai_preview.button"
            onClick={() => setShowAIModal(true)}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
              color: "#fff",
              boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
            }}
          >
            <Sparkles size={16} />✨ Generate AI Preview
          </button>
        </div>
      </div>

      {/* ── Bottom action bar ─────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-3 bg-background border-t border-border flex gap-3 safe-bottom">
        <button
          type="button"
          data-ocid="trial_room.cancel.button"
          onClick={onBack}
          className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          data-ocid="trial_room.add_stitching.primary_button"
          onClick={handleAddToStitching}
          disabled={!selectedDesign}
          className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          <ShoppingBag size={15} />
          Add to Stitching
        </button>
      </div>
    </div>
  );
}
