import type { CSSProperties } from "react";

export type NeckShape = "u-neck" | "boat-neck" | "deep-back" | "princess-cut";
export type SleeveLength = "short" | "elbow" | "full";
export type MannequinView = "front" | "back" | "left" | "right";

interface BlouseMannequinProps {
  blouseColor: string;
  neckShape: NeckShape;
  sleeveLength: SleeveLength;
  view: MannequinView;
  style?: CSSProperties;
  className?: string;
}

function darken(hex: string, amount = 0.15): string {
  const r = Math.max(
    0,
    Math.round(Number.parseInt(hex.slice(1, 3), 16) * (1 - amount)),
  );
  const g = Math.max(
    0,
    Math.round(Number.parseInt(hex.slice(3, 5), 16) * (1 - amount)),
  );
  const b = Math.max(
    0,
    Math.round(Number.parseInt(hex.slice(5, 7), 16) * (1 - amount)),
  );
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function lighten(hex: string, amount = 0.2): string {
  const r = Math.min(
    255,
    Math.round(Number.parseInt(hex.slice(1, 3), 16) + 255 * amount),
  );
  const g = Math.min(
    255,
    Math.round(Number.parseInt(hex.slice(3, 5), 16) + 255 * amount),
  );
  const b = Math.min(
    255,
    Math.round(Number.parseInt(hex.slice(5, 7), 16) + 255 * amount),
  );
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Front neckline paths by shape
function getFrontNeckPath(shape: NeckShape): string {
  switch (shape) {
    case "u-neck":
      // Classic U-neck: moderate depth
      return "M 115,82 Q 150,130 185,82";
    case "boat-neck":
      // Wide shallow boat neck
      return "M 100,82 Q 150,95 200,82";
    case "deep-back":
      // Sweetheart/princess front
      return "M 120,82 Q 150,110 180,82";
    case "princess-cut":
      // Straight across slightly curved
      return "M 108,80 Q 150,88 192,80";
  }
}

// Back neckline paths by shape
function getBackNeckPath(shape: NeckShape): string {
  switch (shape) {
    case "u-neck":
      return "M 115,82 Q 150,115 185,82";
    case "boat-neck":
      return "M 100,80 Q 150,90 200,80";
    case "deep-back":
      // Very deep V back
      return "M 118,82 L 150,155 L 182,82";
    case "princess-cut":
      return "M 110,80 Q 150,100 190,80";
  }
}

// Sleeve end Y position based on length
function getSleeveEndY(length: SleeveLength): number {
  switch (length) {
    case "short":
      return 180;
    case "elbow":
      return 240;
    case "full":
      return 320;
  }
}

export function BlouseMannequin({
  blouseColor,
  neckShape,
  sleeveLength,
  view,
  style,
  className = "",
}: BlouseMannequinProps) {
  const shade1 = darken(blouseColor, 0.12);
  const shade2 = darken(blouseColor, 0.25);
  const highlight = lighten(blouseColor, 0.15);
  const sleeveEndY = getSleeveEndY(sleeveLength);

  // Skin tones for neck/shoulder area
  const skinBase = "#F5D5B5";
  const skinDark = "#E8C4A0";

  const frontNeckPath = getFrontNeckPath(neckShape);
  const backNeckPath = getBackNeckPath(neckShape);

  if (view === "front") {
    return (
      <svg
        viewBox="0 0 300 450"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        className={`w-full h-auto ${className}`}
        role="img"
        aria-label="Blouse mannequin front view"
      >
        <defs>
          <linearGradient id="torso-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={shade2} />
            <stop offset="20%" stopColor={shade1} />
            <stop offset="50%" stopColor={highlight} />
            <stop offset="80%" stopColor={shade1} />
            <stop offset="100%" stopColor={shade2} />
          </linearGradient>
          <linearGradient
            id="sleeve-left-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={shade2} />
            <stop offset="60%" stopColor={blouseColor} />
            <stop offset="100%" stopColor={shade1} />
          </linearGradient>
          <linearGradient
            id="sleeve-right-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={shade1} />
            <stop offset="40%" stopColor={blouseColor} />
            <stop offset="100%" stopColor={shade2} />
          </linearGradient>
          <linearGradient id="neck-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={skinBase} />
            <stop offset="100%" stopColor={skinDark} />
          </linearGradient>
          <filter id="soft-shadow">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Neck */}
        <rect
          x="130"
          y="30"
          width="40"
          height="55"
          rx="8"
          fill="url(#neck-grad)"
        />

        {/* Left shoulder cap */}
        <ellipse cx="80" cy="90" rx="32" ry="18" fill={shade1} />
        {/* Right shoulder cap */}
        <ellipse cx="220" cy="90" rx="32" ry="18" fill={shade1} />

        {/* Left sleeve */}
        <path
          d={`M 52,90 L 48,${sleeveEndY} Q 68,${sleeveEndY + 8} 88,${sleeveEndY} L 92,90 Z`}
          fill="url(#sleeve-left-grad)"
          filter="url(#soft-shadow)"
        />
        {/* Left sleeve hem */}
        <path
          d={`M 48,${sleeveEndY} Q 68,${sleeveEndY + 10} 88,${sleeveEndY}`}
          fill="none"
          stroke={shade2}
          strokeWidth="2"
        />
        {/* Left sleeve seam */}
        <line
          x1="70"
          y1="95"
          x2="70"
          y2={sleeveEndY - 5}
          stroke={shade1}
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.6"
        />

        {/* Right sleeve */}
        <path
          d={`M 208,90 L 212,${sleeveEndY} Q 232,${sleeveEndY + 8} 252,${sleeveEndY} L 248,90 Z`}
          fill="url(#sleeve-right-grad)"
          filter="url(#soft-shadow)"
        />
        {/* Right sleeve hem */}
        <path
          d={`M 212,${sleeveEndY} Q 232,${sleeveEndY + 10} 252,${sleeveEndY}`}
          fill="none"
          stroke={shade2}
          strokeWidth="2"
        />
        {/* Right sleeve seam */}
        <line
          x1="230"
          y1="95"
          x2="230"
          y2={sleeveEndY - 5}
          stroke={shade1}
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.6"
        />

        {/* Main torso body */}
        <path
          d="M 88,90 Q 80,180 78,280 Q 78,310 90,330 L 210,330 Q 222,310 222,280 Q 220,180 212,90 Z"
          fill="url(#torso-grad)"
          filter="url(#soft-shadow)"
        />

        {/* Princess seams (dart lines for realism) */}
        {neckShape === "princess-cut" && (
          <>
            <path
              d="M 118,140 Q 120,200 125,260"
              fill="none"
              stroke={shade2}
              strokeWidth="1.5"
              opacity="0.7"
            />
            <path
              d="M 182,140 Q 180,200 175,260"
              fill="none"
              stroke={shade2}
              strokeWidth="1.5"
              opacity="0.7"
            />
          </>
        )}

        {/* Vertical center dart */}
        <line
          x1="150"
          y1="160"
          x2="150"
          y2="310"
          stroke={shade1}
          strokeWidth="1"
          strokeDasharray="3 5"
          opacity="0.5"
        />

        {/* Waist darts */}
        <path
          d="M 108,200 Q 118,220 110,240"
          fill="none"
          stroke={shade2}
          strokeWidth="1"
          opacity="0.6"
        />
        <path
          d="M 192,200 Q 182,220 190,240"
          fill="none"
          stroke={shade2}
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Bottom hem curve */}
        <path
          d="M 90,330 Q 150,345 210,330"
          fill="none"
          stroke={shade2}
          strokeWidth="2"
        />

        {/* Neckline cutout (white fill to simulate open area) */}
        <path
          d={`M 115,82 ${frontNeckPath.replace("M 115,82 ", "")} L 185,82 L 185,75 Q 150,70 115,75 Z`}
          fill="#e8e0d8"
          opacity="0.6"
        />

        {/* Neckline stitching */}
        <path
          d={frontNeckPath}
          fill="none"
          stroke={shade2}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Inner neckline decorative stitch */}
        <path
          d={frontNeckPath}
          fill="none"
          stroke={shade1}
          strokeWidth="1"
          strokeDasharray="3 4"
          strokeLinecap="round"
          transform="translate(0 4) scale(1 0.85) translate(0 -4)"
          opacity="0.5"
        />

        {/* Shoulder seam lines */}
        <line
          x1="88"
          y1="90"
          x2="110"
          y2="82"
          stroke={shade2}
          strokeWidth="1.5"
          opacity="0.7"
        />
        <line
          x1="212"
          y1="90"
          x2="190"
          y2="82"
          stroke={shade2}
          strokeWidth="1.5"
          opacity="0.7"
        />

        {/* Side seam lines */}
        <line
          x1="88"
          y1="95"
          x2="82"
          y2="280"
          stroke={shade2}
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="212"
          y1="95"
          x2="218"
          y2="280"
          stroke={shade2}
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
    );
  }

  if (view === "back") {
    return (
      <svg
        viewBox="0 0 300 450"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        className={`w-full h-auto ${className}`}
        role="img"
        aria-label="Blouse mannequin back view"
      >
        <defs>
          <linearGradient
            id="torso-back-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={shade2} />
            <stop offset="20%" stopColor={shade1} />
            <stop offset="50%" stopColor={blouseColor} />
            <stop offset="80%" stopColor={shade1} />
            <stop offset="100%" stopColor={shade2} />
          </linearGradient>
          <filter id="soft-shadow-b">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Neck back */}
        <rect x="130" y="30" width="40" height="50" rx="8" fill={skinDark} />

        {/* Shoulder caps back */}
        <ellipse cx="80" cy="90" rx="32" ry="16" fill={shade2} />
        <ellipse cx="220" cy="90" rx="32" ry="16" fill={shade2} />

        {/* Left sleeve back */}
        <path
          d={`M 52,90 L 48,${sleeveEndY} Q 68,${sleeveEndY + 8} 88,${sleeveEndY} L 92,90 Z`}
          fill={shade1}
        />
        <path
          d={`M 48,${sleeveEndY} Q 68,${sleeveEndY + 10} 88,${sleeveEndY}`}
          fill="none"
          stroke={shade2}
          strokeWidth="2"
        />

        {/* Right sleeve back */}
        <path
          d={`M 208,90 L 212,${sleeveEndY} Q 232,${sleeveEndY + 8} 252,${sleeveEndY} L 248,90 Z`}
          fill={shade1}
        />
        <path
          d={`M 212,${sleeveEndY} Q 232,${sleeveEndY + 10} 252,${sleeveEndY}`}
          fill="none"
          stroke={shade2}
          strokeWidth="2"
        />

        {/* Main torso back */}
        <path
          d="M 88,90 Q 80,180 78,280 Q 78,310 90,330 L 210,330 Q 222,310 222,280 Q 220,180 212,90 Z"
          fill="url(#torso-back-grad)"
          filter="url(#soft-shadow-b)"
        />

        {/* Back neck cutout */}
        <path
          d={`M 115,82 ${backNeckPath.replace("M 115,82 ", "")} L 185,82 L 185,75 Q 150,70 115,75 Z`}
          fill="#e8e0d8"
          opacity="0.6"
        />

        {/* Back neckline stitch */}
        <path
          d={backNeckPath}
          fill="none"
          stroke={shade2}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Hook/eye closures on center back */}
        {[110, 140, 170, 200, 230, 260].map((y) => (
          <g key={y}>
            <circle cx="150" cy={y} r="2" fill={shade2} opacity="0.8" />
            <line
              x1="147"
              y1={y}
              x2="153"
              y2={y}
              stroke={shade2}
              strokeWidth="1"
              opacity="0.6"
            />
          </g>
        ))}

        {/* Center back seam */}
        <line
          x1="150"
          y1="82"
          x2="150"
          y2="330"
          stroke={shade2}
          strokeWidth="1.5"
          opacity="0.5"
        />

        {/* Bottom hem */}
        <path
          d="M 90,330 Q 150,345 210,330"
          fill="none"
          stroke={shade2}
          strokeWidth="2"
        />

        {/* Side seams */}
        <line
          x1="88"
          y1="95"
          x2="82"
          y2="280"
          stroke={shade2}
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="212"
          y1="95"
          x2="218"
          y2="280"
          stroke={shade2}
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
    );
  }

  if (view === "left") {
    return (
      <svg
        viewBox="0 0 300 450"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        className={`w-full h-auto ${className}`}
        role="img"
        aria-label="Blouse mannequin left side view"
      >
        <defs>
          <linearGradient
            id="torso-left-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={shade2} />
            <stop offset="40%" stopColor={shade1} />
            <stop offset="100%" stopColor={blouseColor} />
          </linearGradient>
          <linearGradient
            id="sleeve-side-grad"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={shade1} />
            <stop offset="50%" stopColor={blouseColor} />
            <stop offset="100%" stopColor={shade1} />
          </linearGradient>
        </defs>

        {/* Neck side */}
        <rect x="140" y="30" width="28" height="52" rx="7" fill={skinDark} />

        {/* Shoulder */}
        <ellipse
          cx="130"
          cy="90"
          rx="20"
          ry="55"
          fill={shade1}
          transform="rotate(-5 130 90)"
        />

        {/* Sleeve (side view - elongated arm) */}
        <path
          d={`M 80,88 Q 72,${sleeveEndY - 20} 75,${sleeveEndY} Q 110,${sleeveEndY + 12} 118,${sleeveEndY} Q 120,${sleeveEndY - 20} 112,88 Z`}
          fill="url(#sleeve-side-grad)"
        />
        {/* Sleeve hem */}
        <path
          d={`M 75,${sleeveEndY} Q 97,${sleeveEndY + 14} 118,${sleeveEndY}`}
          fill="none"
          stroke={shade2}
          strokeWidth="2"
        />
        {/* Sleeve front seam line */}
        <line
          x1="118"
          y1="95"
          x2="117"
          y2={sleeveEndY - 5}
          stroke={shade2}
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.6"
        />

        {/* Torso side profile */}
        <path
          d="M 112,90 Q 120,120 125,180 Q 130,240 128,280 Q 127,310 130,330 L 185,330 Q 190,310 188,280 Q 185,240 185,180 Q 188,120 185,90 Z"
          fill="url(#torso-left-grad)"
        />

        {/* Side seam */}
        <line
          x1="112"
          y1="95"
          x2="128"
          y2="300"
          stroke={shade2}
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Bottom hem */}
        <path
          d="M 130,330 Q 157,342 185,330"
          fill="none"
          stroke={shade2}
          strokeWidth="2"
        />

        {/* Bust dart for realism */}
        <path
          d="M 185,155 Q 175,175 180,195"
          fill="none"
          stroke={shade2}
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
    );
  }

  // right view (mirror of left)
  return (
    <svg
      viewBox="0 0 300 450"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={`w-full h-auto ${className}`}
      role="img"
      aria-label="Blouse mannequin right side view"
    >
      <defs>
        <linearGradient id="torso-right-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={blouseColor} />
          <stop offset="60%" stopColor={shade1} />
          <stop offset="100%" stopColor={shade2} />
        </linearGradient>
        <linearGradient
          id="sleeve-side-r-grad"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor={shade1} />
          <stop offset="50%" stopColor={blouseColor} />
          <stop offset="100%" stopColor={shade1} />
        </linearGradient>
      </defs>

      {/* Neck side right */}
      <rect x="132" y="30" width="28" height="52" rx="7" fill={skinDark} />

      {/* Shoulder */}
      <ellipse
        cx="170"
        cy="90"
        rx="20"
        ry="55"
        fill={shade1}
        transform="rotate(5 170 90)"
      />

      {/* Sleeve right side */}
      <path
        d={`M 182,88 Q 190,${sleeveEndY - 20} 185,${sleeveEndY} Q 220,${sleeveEndY + 12} 225,${sleeveEndY} Q 228,${sleeveEndY - 20} 220,88 Z`}
        fill="url(#sleeve-side-r-grad)"
      />
      {/* Sleeve hem */}
      <path
        d={`M 185,${sleeveEndY} Q 205,${sleeveEndY + 14} 225,${sleeveEndY}`}
        fill="none"
        stroke={shade2}
        strokeWidth="2"
      />
      {/* Sleeve back seam line */}
      <line
        x1="183"
        y1="95"
        x2="183"
        y2={sleeveEndY - 5}
        stroke={shade2}
        strokeWidth="1"
        strokeDasharray="3 4"
        opacity="0.6"
      />

      {/* Torso side profile right */}
      <path
        d="M 115,90 Q 112,120 115,180 Q 115,240 115,280 Q 110,310 110,330 L 188,330 Q 188,310 188,280 Q 188,240 188,180 Q 180,120 188,90 Z"
        fill="url(#torso-right-grad)"
      />

      {/* Side seam */}
      <line
        x1="188"
        y1="95"
        x2="172"
        y2="300"
        stroke={shade2}
        strokeWidth="1.5"
        opacity="0.6"
      />

      {/* Bottom hem */}
      <path
        d="M 115,330 Q 143,342 188,330"
        fill="none"
        stroke={shade2}
        strokeWidth="2"
      />

      {/* Bust dart */}
      <path
        d="M 115,155 Q 125,175 120,195"
        fill="none"
        stroke={shade2}
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}
