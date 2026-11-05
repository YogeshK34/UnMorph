import { useId } from "react";
import { scenePalettes, type SceneVariant } from "@/lib/scenes";
import { cn } from "@/lib/utils";

type LandscapeProps = {
  variant?: SceneVariant;
  /** Renders the "morphed" version: a fabricated peak and a cloned sun. */
  tampered?: boolean;
  className?: string;
  title?: string;
};

/** Where the tampered edits sit, in % of the frame — used for heatmap overlays. */
export const TAMPER_REGIONS = [
  { id: "A", label: "Generative fill", left: 77, top: 36, width: 19, height: 27, score: 97.2 },
  { id: "B", label: "Cloned element", left: 11, top: 10, width: 13, height: 19, score: 92.6 },
] as const;

const STARS = [
  [24, 18],
  [62, 40],
  [104, 22],
  [150, 46],
  [188, 14],
  [226, 34],
  [262, 12],
  [318, 26],
  [352, 48],
  [378, 16],
  [130, 70],
  [40, 66],
  [210, 60],
  [300, 64],
] as const;

/**
 * A crisp, procedural landscape "photograph". Purely presentational SVG —
 * it stands in for user imagery across the marketing site and dashboard.
 */
export function Landscape({
  variant = "glacier",
  tampered = false,
  className,
  title,
}: LandscapeProps) {
  const p = scenePalettes[variant];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `${name}-${uid}`;
  const night = variant === "aurora";

  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      className={cn("block size-full", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="1" stopColor={p.sky[1]} />
        </linearGradient>
        <radialGradient id={id("glow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={p.sun} stopOpacity="0.95" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("mid")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.mid[0]} />
          <stop offset="1" stopColor={p.mid[1]} />
        </linearGradient>
        <linearGradient id={id("near")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.near[0]} />
          <stop offset="1" stopColor={p.near[1]} />
        </linearGradient>
        <linearGradient id={id("water")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.water[0]} />
          <stop offset="1" stopColor={p.water[1]} />
        </linearGradient>
        <linearGradient id={id("aurora")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#22D3EE" stopOpacity="0" />
          <stop offset="0.5" stopColor="#5EEAD4" stopOpacity="0.7" />
          <stop offset="1" stopColor="#06D6FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="400" height="260" fill={`url(#${id("sky")})`} />

      {night && (
        <g>
          {STARS.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i % 3 === 0 ? 1.2 : 0.8}
              fill="#E0F7FF"
              opacity={0.5 + (i % 4) * 0.12}
            />
          ))}
          <path
            d="M-10 92 C 60 40, 140 110, 220 58 S 360 30, 420 70"
            stroke={`url(#${id("aurora")})`}
            strokeWidth="18"
            fill="none"
            opacity="0.55"
          />
          <path
            d="M-10 70 C 80 30, 160 84, 240 44 S 370 20, 420 46"
            stroke={`url(#${id("aurora")})`}
            strokeWidth="8"
            fill="none"
            opacity="0.4"
          />
        </g>
      )}

      {/* sun + glow */}
      <circle cx="290" cy="70" r="74" fill={`url(#${id("glow")})`} opacity={night ? 0.35 : 0.8} />
      <circle cx="290" cy="70" r={night ? 14 : 24} fill={p.sun} opacity={night ? 0.9 : 1} />

      {/* soft clouds */}
      {!night && (
        <g fill="#FFFFFF" opacity="0.55">
          <ellipse cx="96" cy="58" rx="38" ry="7" />
          <ellipse cx="124" cy="51" rx="22" ry="6" />
          <ellipse cx="340" cy="104" rx="30" ry="5" opacity="0.7" />
        </g>
      )}

      {/* far ridge */}
      <path
        d="M0 150 L30 132 L62 142 L98 112 L132 134 L168 104 L204 128 L238 116 L276 138 L312 108 L350 130 L400 112 V260 H0Z"
        fill={p.far}
        opacity="0.9"
      />

      {/* mid mountains */}
      <path
        d="M0 186 L48 150 L78 166 L132 92 L176 150 L206 132 L246 168 L298 118 L340 156 L372 140 L400 152 V260 H0Z"
        fill={`url(#${id("mid")})`}
      />
      <path d="M132 92 L176 150 L156 162 L140 118Z" fill={p.near[1]} opacity="0.22" />
      <path d="M298 118 L340 156 L322 162 L304 134Z" fill={p.near[1]} opacity="0.2" />
      <path d="M132 92 L117 112 L126 109 L133 117 L140 108 L149 113Z" fill={p.snow} />
      <path d="M298 118 L286 133 L294 130 L300 137 L306 129 L313 132Z" fill={p.snow} />

      {tampered && (
        <g>
          {/* fabricated peak (generative fill) */}
          <path d="M314 162 L346 102 L380 160Z" fill={`url(#${id("mid")})`} />
          <path d="M346 102 L380 160 L364 164 L352 124Z" fill={p.near[1]} opacity="0.25" />
          <path d="M346 102 L336 117 L344 114 L347 121 L352 113 L359 117Z" fill={p.snow} />
          {/* cloned sun */}
          <circle cx="70" cy="50" r="15" fill={p.sun} opacity="0.95" />
        </g>
      )}

      {/* lake */}
      <rect x="0" y="194" width="400" height="66" fill={`url(#${id("water")})`} />
      <g stroke="#FFFFFF" strokeLinecap="round" opacity="0.35">
        <line x1="40" y1="206" x2="96" y2="206" strokeWidth="1.5" />
        <line x1="180" y1="214" x2="260" y2="214" strokeWidth="1.5" />
        <line x1="270" y1="204" x2="312" y2="204" strokeWidth="1.2" />
        <line x1="120" y1="222" x2="150" y2="222" strokeWidth="1" />
      </g>

      {/* foreground shore + pines */}
      <path
        d="M0 236 L60 222 L120 232 L180 220 L240 236 L300 226 L360 234 L400 228 V260 H0Z"
        fill={`url(#${id("near")})`}
      />
      <g fill={p.near[1]}>
        <path d="M26 230 L34 204 L42 230Z" />
        <path d="M40 232 L50 196 L60 232Z" />
        <path d="M58 230 L65 210 L72 230Z" />
        <path d="M342 232 L351 206 L360 232Z" />
        <path d="M356 234 L364 214 L372 234Z" />
      </g>
    </svg>
  );
}
