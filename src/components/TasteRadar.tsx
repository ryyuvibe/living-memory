"use client";

import { Belief, Feature, FEATURES, FEATURE_LABEL } from "@/lib/types";

interface Props {
  beliefs: Belief[];
}

// Geometry: a square diamond. Salt (top) · Fat (right) · Acid (bottom) · Heat (left).
// Angles in radians, measured clockwise from straight up.
// Drawing box is wider than tall so the left/right axis labels ("HEAT", "FAT")
// have room and don't clip at the edges.
const W = 300;
const H = 248;
const CX = W / 2;
const CY = H / 2;
const R_MAX = 92; // outer ring radius (lean = +1)
const R_BASE = 46; // population-default ring (lean = 0)

// FEATURES is ["salt", "fat", "acid", "spice"]; place them clockwise from top.
const ANGLE: Record<Feature, number> = {
  salt: -Math.PI / 2, // top
  fat: 0, // right
  acid: Math.PI / 2, // bottom
  spice: Math.PI, // left  (renders as "heat")
};

// lean -1..+1 -> radius. 0 sits on the baseline ring; +1 reaches the rim,
// -1 collapses toward center. An unformed belief (lean 0) traces the baseline.
function radiusFor(lean: number): number {
  const r = R_BASE + lean * (R_MAX - R_BASE);
  return Math.max(6, Math.min(R_MAX, r));
}

function pt(feature: Feature, radius: number): [number, number] {
  const a = ANGLE[feature];
  return [CX + radius * Math.cos(a), CY + radius * Math.sin(a)];
}

export function TasteRadar({ beliefs }: Props) {
  const byFeature = new Map(beliefs.map((b) => [b.feature, b]));

  // Average confidence drives how solid the taste-shape reads.
  const held = beliefs.filter((b) => b.signals > 0 || b.pinned);
  const avgConf =
    held.length === 0
      ? 0
      : held.reduce((s, b) => s + b.confidence, 0) / held.length;
  const fillOpacity = 0.06 + avgConf * 0.34; // 0.06..0.40
  const strokeOpacity = 0.25 + avgConf * 0.6; // 0.25..0.85

  const polygon = FEATURES.map((f) => {
    const b = byFeature.get(f);
    const lean = b ? b.lean : 0;
    const [x, y] = pt(f, radiusFor(lean));
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  // concentric guide rings (diamonds) at a few radii
  const rings = [R_MAX, (R_MAX + R_BASE) / 2 + 11, R_BASE, R_BASE / 2].map((r) =>
    FEATURES.map((f) => pt(f, r).map((n) => n.toFixed(1)).join(",")).join(" ")
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto block h-[248px] w-[300px] max-w-full"
      role="img"
      aria-label="Taste profile radar: salt, fat, acid, heat"
    >
      {/* guide rings */}
      {rings.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="rgb(64 64 64)"
          strokeOpacity={i === 2 ? 0.7 : 0.3}
          strokeWidth={i === 2 ? 1.1 : 0.8}
          strokeDasharray={i === 2 ? "none" : "2 3"}
        />
      ))}

      {/* spokes */}
      {FEATURES.map((f) => {
        const [x, y] = pt(f, R_MAX);
        return (
          <line
            key={f}
            x1={CX}
            y1={CY}
            x2={x}
            y2={y}
            stroke="rgb(64 64 64)"
            strokeOpacity={0.35}
            strokeWidth={0.8}
          />
        );
      })}

      {/* the taste shape */}
      <polygon
        points={polygon}
        fill="rgb(245 158 11)"
        fillOpacity={fillOpacity}
        stroke="rgb(251 191 36)"
        strokeOpacity={strokeOpacity}
        strokeWidth={1.5}
        strokeLinejoin="round"
        className="[transition:fill-opacity_400ms,stroke-opacity_400ms] motion-reduce:transition-none"
      />

      {/* per-vertex confidence dots + pin rings */}
      {FEATURES.map((f) => {
        const b = byFeature.get(f);
        const lean = b ? b.lean : 0;
        const conf = b ? b.confidence : 0;
        const [x, y] = pt(f, radiusFor(lean));
        const flipped = !!b?.justFlipped;
        const dotR = 2 + conf * 4; // 2..6 px by confidence
        const color = flipped ? "rgb(167 139 250)" : "rgb(251 191 36)";
        return (
          <g key={f} className="[transition:fill-opacity_400ms,stroke-opacity_400ms] motion-reduce:transition-none">
            {b?.pinned && (
              <circle
                cx={x}
                cy={y}
                r={dotR + 3.5}
                fill="none"
                stroke="rgb(251 191 36)"
                strokeOpacity={0.7}
                strokeWidth={1.2}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={dotR}
              fill={color}
              fillOpacity={0.35 + conf * 0.6}
              stroke={color}
              strokeWidth={1}
            />
          </g>
        );
      })}

      {/* axis labels */}
      {FEATURES.map((f) => {
        const [x, y] = pt(f, R_MAX + 22);
        return (
          <text
            key={f}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-neutral-400 text-[11px] font-medium uppercase tracking-wide"
          >
            {FEATURE_LABEL[f]}
          </text>
        );
      })}
    </svg>
  );
}
