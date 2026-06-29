"use client";

import React from "react";

// 12×12 pixel-art glyphs. Higher grid than before so each ingredient reads as
// itself (a lemon wedge, a chili-crisp jar, a soy bottle) rather than a vague
// blob. Each row is a 12-char string; each char is a palette index (0 = clear).
// Rendered as crisp blocky rects to keep the retro 8-bit / Anthropic feel.

export type IconName =
  | "lemon"
  | "lime"
  | "chiliJar"
  | "hotSauce"
  | "sriracha"
  | "pepper"
  | "soy"
  | "fishSauce"
  | "butter"
  | "oil"
  | "cream"
  | "salt"
  | "herb"
  | "pot"
  | "chicken"
  | "noodle"
  | "egg"
  | "clock"
  | "spark";

// ---- glyph maps (12×12) -----------------------------------------------------

const GLYPHS: Record<IconName, string[]> = {
  // lemon wedge — yellow body, pale segments, rind edge
  lemon: [
    "000000000000",
    "000022220000",
    "000222222000",
    "002233332200",
    "022333333220",
    "023313133320",
    "023331333320",
    "022333333220",
    "002233332200",
    "000222222000",
    "000022220000",
    "000000000000",
  ],
  // lime — same wedge, green palette
  lime: [
    "000000000000",
    "000022220000",
    "000222222000",
    "002233332200",
    "022333333220",
    "023313133320",
    "023331333320",
    "022333333220",
    "002233332200",
    "000222222000",
    "000022220000",
    "000000000000",
  ],
  // chili crisp — squat jar, red contents, dark lid, label band
  chiliJar: [
    "000000000000",
    "000033330000",
    "000344443000",
    "000044440000",
    "000444444000",
    "004411114400",
    "004111111400",
    "004155551400",
    "004111111400",
    "004411114400",
    "000444444000",
    "000044440000",
  ],
  // hot sauce — tall slim bottle with a cap
  hotSauce: [
    "000005500000",
    "000005500000",
    "000044440000",
    "000044440000",
    "000411114000",
    "004111111400",
    "004133331400",
    "004133331400",
    "004133331400",
    "004111111400",
    "004411114400",
    "000444444000",
  ],
  // sriracha — bottle with the iconic green cap
  sriracha: [
    "000002200000",
    "000022220000",
    "000044440000",
    "000411114000",
    "004111111400",
    "004133331400",
    "004133331400",
    "004133331400",
    "004133331400",
    "004133331400",
    "004111111400",
    "000444444000",
  ],
  // crushed pepper / chili pod — red with a green stem
  pepper: [
    "000000003300",
    "000000033000",
    "000000110000",
    "000001111000",
    "000011111000",
    "000111110000",
    "001111100000",
    "011111000000",
    "011110000000",
    "001100000000",
    "000000000000",
    "000000000000",
  ],
  // soy sauce — dark bottle, small cap, light label
  soy: [
    "000004400000",
    "000004400000",
    "000044440000",
    "000411114000",
    "004111111400",
    "004111111400",
    "004155551400",
    "004155551400",
    "004111111400",
    "004111111400",
    "004411114400",
    "000444444000",
  ],
  // fish sauce — amber bottle
  fishSauce: [
    "000004400000",
    "000044440000",
    "000422224000",
    "004222222400",
    "004222222400",
    "004255552400",
    "004222222400",
    "004222222400",
    "004222222400",
    "004222222400",
    "004422224400",
    "000444444000",
  ],
  // pat of butter — 3-D yellow block (light top, mid face, dark side) on plate
  butter: [
    "000000000000",
    "000022222000",
    "000222222200",
    "002211111120",
    "002111111120",
    "002111111120",
    "002111111120",
    "002111111120",
    "000222222200",
    "000000000000",
    "044444444440",
    "000000000000",
  ],
  // olive oil — bottle with a green-gold body and long neck
  oil: [
    "000005500000",
    "000005500000",
    "000044440000",
    "000044440000",
    "000422224000",
    "004222222400",
    "004222222400",
    "004233332400",
    "004222222400",
    "004222222400",
    "004422224400",
    "000444444000",
  ],
  // cream / dairy — carton with a spout
  cream: [
    "000000000000",
    "000044000000",
    "000444400000",
    "004444440000",
    "004111114000",
    "004111114000",
    "004133314000",
    "004111114000",
    "004111114000",
    "004111114000",
    "004411144000",
    "000444444000",
  ],
  // salt shaker — holes up top, rounded body, small pile
  salt: [
    "000010100000",
    "000101010000",
    "000011100000",
    "000022200000",
    "000222220000",
    "002222222000",
    "002211122000",
    "002222222000",
    "002222222000",
    "002222222000",
    "000222220000",
    "000000000000",
  ],
  // herb sprig — green leaves on a stem
  herb: [
    "000000300000",
    "000003330000",
    "000033330000",
    "000333033000",
    "003330333000",
    "000333033000",
    "003330333000",
    "000333330000",
    "000003300000",
    "000003300000",
    "000003300000",
    "000000000000",
  ],
  // simmering pot — lid, body, handles, steam wisps
  pot: [
    "000020002000",
    "002000200020",
    "000200020200",
    "000033333000",
    "000333333300",
    "044111111440",
    "004111111400",
    "004111111400",
    "004111111400",
    "004111111400",
    "000411114000",
    "000044440000",
  ],
  // roast drumstick — meat with a bone tip
  chicken: [
    "000000000000",
    "000001110000",
    "000011111000",
    "000111111100",
    "001112111000",
    "001111111000",
    "000111111000",
    "000011110000",
    "000001130000",
    "000000133000",
    "000000033000",
    "000000000000",
  ],
  // bowl of noodles — steam, broth, noodle swirl
  noodle: [
    "000020002000",
    "000200020000",
    "000020002000",
    "000000000000",
    "022222222220",
    "002333333200",
    "023131313320",
    "023313133320",
    "002333333200",
    "000222222000",
    "000033330000",
    "000000000000",
  ],
  // cracked egg — white with a yellow yolk
  egg: [
    "000000000000",
    "000022220000",
    "000222222000",
    "002211112200",
    "022113311220",
    "022133331220",
    "022133331220",
    "022113311220",
    "002211112200",
    "000222222000",
    "000022220000",
    "000000000000",
  ],
  // retro hourglass — frame, sand, pinch in the middle
  clock: [
    "000000000000",
    "001111111100",
    "001222222100",
    "000122221000",
    "000012210000",
    "000001100000",
    "000001100000",
    "000012210000",
    "000123321000",
    "001233332100",
    "001111111100",
    "000000000000",
  ],
  // generic sparkle — neutral / no clear signal
  spark: [
    "000001000000",
    "000001000000",
    "000011100000",
    "000111110000",
    "011111111100",
    "000111110000",
    "000011100000",
    "000101010000",
    "001000001000",
    "000000000000",
    "000000000000",
    "000000000000",
  ],
};

// palette[index] — index 0 is always transparent (skipped).
const PALETTES: Record<IconName, string[]> = {
  lemon: ["", "#fffbe6", "#ca8a04", "#facc15"],
  lime: ["", "#ecfccb", "#3f6212", "#84cc16"],
  chiliJar: ["", "#dc2626", "#7f1d1d", "#1f2937", "#9ca3af", "#fca5a5"],
  hotSauce: ["", "#ef4444", "#7f1d1d", "#fecaca", "#9ca3af", "#f59e0b"],
  sriracha: ["", "#ef4444", "#22c55e", "#fecaca", "#9ca3af"],
  pepper: ["", "#dc2626", "#16a34a", "#15803d"],
  soy: ["", "#7c2d12", "#451a03", "#1c1917", "#a8a29e", "#fde68a"],
  fishSauce: ["", "#b45309", "#d97706", "#78350f", "#a8a29e", "#fde68a"],
  butter: ["", "#fbbf24", "#fde68a", "#f59e0b", "#a3a3a3"],
  oil: ["", "#a3a335", "#65a30d", "#3f6212", "#9ca3af", "#84cc16"],
  cream: ["", "#f8fafc", "#e2e8f0", "#facc15", "#94a3b8"],
  salt: ["", "#e5e7eb", "#cbd5e1", "#64748b"],
  herb: ["", "#22c55e", "#16a34a", "#15803d"],
  pot: ["", "#9ca3af", "#6b7280", "#4b5563", "#374151"],
  chicken: ["", "#d97706", "#92400e", "#f5f5f4"],
  noodle: ["", "#fcd34d", "#cbd5e1", "#94a3b8", "#e2e8f0"],
  egg: ["", "#f8fafc", "#e2e8f0", "#facc15"],
  clock: ["", "#d4a373", "#fcd34d", "#b45309"],
  spark: ["", "#fbbf24"],
};

interface Props {
  name: IconName;
  size?: number; // rendered px (square)
  className?: string;
}

export function PixelIcon({ name, size = 22, className }: Props) {
  const glyph = GLYPHS[name];
  const palette = PALETTES[name];
  const rects: React.ReactElement[] = [];
  for (let y = 0; y < glyph.length; y++) {
    const row = glyph[y];
    for (let x = 0; x < row.length; x++) {
      const idx = Number(row[x]);
      if (!idx) continue;
      rects.push(
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={palette[idx]} />
      );
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      {rects}
    </svg>
  );
}

// Map a free-text interaction line to the most specific INGREDIENT glyph. Order
// matters: more specific items (sriracha, chili crisp) are tested before generic
// ones (chili, oil). Works for both seeds and typed input; falls back to a
// dish/sparkle icon.
export function iconForText(text: string): IconName {
  const t = text.toLowerCase();

  // --- specific additives first ---
  if (/\bchili crisp\b|\bchili oil\b|\bchilli crisp\b/.test(t)) return "chiliJar";
  if (/\bsriracha\b/.test(t)) return "sriracha";
  if (/\bhot sauce\b/.test(t)) return "hotSauce";
  if (/\b(sambal|gochujang|harissa|chili paste|chilli paste)\b/.test(t)) return "chiliJar";
  if (/\b(cayenne|pepper flakes|crushed red|chili flakes|jalape|chili|chilli|pepper(s)?)\b/.test(t))
    return "pepper";

  if (/\blime\b/.test(t)) return "lime";
  if (/\b(lemon|citrus|vinegar)\b/.test(t)) return "lemon";

  if (/\bfish sauce\b/.test(t)) return "fishSauce";
  if (/\b(soy|tamari)\b/.test(t)) return "soy";

  if (/\b(olive oil|sesame oil)\b|\boil\b/.test(t)) return "oil";
  if (/\b(creme fraiche|cream|crème)\b/.test(t)) return "cream";
  if (/\b(butter|ghee|tahini|mayo|schmaltz|lard|duck fat|bacon fat)\b/.test(t)) return "butter";

  if (/\b(flaky salt|sea salt|salt|season|kosher)\b/.test(t)) return "salt";
  if (/\b(herb|cilantro|basil|parsley|scallion|greens|dill|mint)\b/.test(t)) return "herb";

  // --- dishes / vehicles ---
  if (/\b(egg|eggs|omelet|frittata)\b/.test(t)) return "egg";
  if (/\b(noodle|noodles|ramen|pasta|udon|soba|spaghetti)\b/.test(t)) return "noodle";
  if (/\b(chicken|thigh|thighs|drumstick|wing|wings|roast)\b/.test(t)) return "chicken";
  if (/\b(broth|soup|curry|braise|stew|stir.?fry|chili con|congee|dal|dhal)\b/.test(t))
    return "pot";

  return "spark";
}
