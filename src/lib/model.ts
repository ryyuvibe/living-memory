// The living model: soft updates, evidence-grounded confidence, designed
// forgetting (decay), and the contradiction-flip. Ported from the validated
// soft-update math in taste_engine.py (apply_updates) and extended for the demo.

import {
  Belief,
  Feature,
  FEATURES,
  FEATURE_LABEL,
  FeatureDelta,
  ParsedInteraction,
} from "./types";

// One demo "day" is compressed so decay is visible in seconds while you click.
// lastSeen ages by this much each time you advance the clock.
export const DAY_MS = 24 * 60 * 60 * 1000;

// How fast an unreinforced belief loses confidence, per day of staleness.
const DECAY_PER_DAY = 0.06;

// Soft-update step size (from taste_engine.py: step = 0.15 * confidence).
const STEP_SCALE = 0.15;
// Revealed behavior counts harder than stated critique.
const REVEALED_BOOST = 1.4;

export function emptyBelief(feature: Feature): Belief {
  return {
    feature,
    lean: 0,
    confidence: 0,
    signals: 0,
    posSignals: 0,
    negSignals: 0,
    lastSeen: Date.now(),
    pinned: false,
    justFlipped: null,
  };
}

export function initialBeliefs(): Belief[] {
  return FEATURES.map(emptyBelief);
}

// Evidence-grounded confidence: grows with the COUNT of signals and their
// CONSISTENCY. Never the model introspecting on its own certainty.
//   count term  -> saturating curve on total signals
//   consistency -> how lopsided pos vs neg are (0.5 = noise, 1 = unanimous)
function evidenceConfidence(b: Belief): number {
  if (b.signals === 0) return 0;
  // Net evidence in the dominant direction: agreeing signals minus contradicting
  // ones. A belief that's been reinforced repeatedly in one direction earns
  // confidence; one that's been pulled both ways does not.
  const dominant = Math.max(b.posSignals, b.negSignals);
  const opposing = Math.min(b.posSignals, b.negSignals);
  const net = Math.max(0, dominant - opposing);
  // saturating curve on NET evidence: ~0.28 @1, ~0.49 @2, ~0.63 @3, ~0.82 @5, ~0.92 @7
  const strength = 1 - Math.exp(-net / 3);
  // a mild penalty for noise: lots of contradicting signals cap the ceiling
  const consistency = dominant / b.signals; // 0.5..1
  const ceiling = 0.4 + 0.6 * consistency; // 0.7..1.0
  return clamp01(strength * ceiling);
}

// Apply one parsed interaction to the belief set. Returns a NEW array.
export function applyInteraction(
  beliefs: Belief[],
  parsed: ParsedInteraction,
  now: number = Date.now()
): Belief[] {
  const byFeature = new Map(beliefs.map((b) => [b.feature, { ...b, justFlipped: null as Belief["justFlipped"] }]));

  for (const d of parsed.feature_deltas) {
    const b = byFeature.get(d.feature);
    if (!b) continue;

    const before = b.lean;
    const weight = d.confidence * (d.revealed ? REVEALED_BOOST : 1);
    const step = STEP_SCALE * weight;
    const signed = d.dir === "+" ? step : -step;

    b.lean = clampLean(b.lean + signed);
    b.signals += 1;
    if (d.dir === "+") b.posSignals += 1;
    else b.negSignals += 1;
    b.lastSeen = now;
    b.confidence = evidenceConfidence(b);

    // Contradiction-flip: the belief crossed zero. Announce before -> after.
    const crossedZero =
      (before > 0.05 && b.lean < -0.001) || (before < -0.05 && b.lean > 0.001);
    if (crossedZero) {
      b.justFlipped = {
        fromLean: before,
        toLean: b.lean,
        reason: flipReason(d, b),
      };
    }
  }

  return FEATURES.map((f) => byFeature.get(f)!);
}

// Natural-language object for each feature, e.g. heat -> "chili".
const FLIP_OBJECT: Record<Feature, { reachFor: string; pullBack: string }> = {
  spice: { reachFor: "chili", pullBack: "the heat" },
  acid: { reachFor: "the vinegar", pullBack: "the acid" },
  salt: { reachFor: "the salt", pullBack: "the salt" },
  fat: { reachFor: "the butter", pullBack: "the richness" },
};

function flipReason(d: FeatureDelta, b: Belief): string {
  const towardPositive = d.dir === "+";
  const obj = FLIP_OBJECT[b.feature];
  const label = FEATURE_LABEL[b.feature];
  const usedTo = towardPositive ? `avoid ${label}` : `lean into ${label}`;
  const recent = towardPositive ? b.posSignals : b.negSignals;
  const phrase = towardPositive
    ? `you've reached for ${obj.reachFor} ${recent}× lately`
    : `you've pulled back on ${obj.pullBack} ${recent}× lately`;
  return `you used to ${usedTo} → updated, ${phrase}`;
}

// Fraction of an established lean that survives forgetting. Taste leaves a mark:
// even once the model has lost all CONFIDENCE in a preference, the SHAPE keeps a
// faint imprint of which way you leaned — it contracts toward this floor, never
// all the way to neutral. (Confidence is what terminates at zero.)
const LEAN_RETAINED_FLOOR = 0.45;

// Designed forgetting: age every UNPINNED belief. Confidence decays toward 0 the
// longer it goes unreinforced. Lean contracts toward a retained floor — a faint
// persistent imprint of the established preference — rather than collapsing to a
// zero'd-out neutral. Pinned beliefs are protected.
export function decayBeliefs(beliefs: Belief[], now: number = Date.now()): Belief[] {
  return beliefs.map((b) => {
    if (b.pinned || b.signals === 0) return { ...b, justFlipped: null };
    const ageDays = Math.max(0, (now - b.lastSeen) / DAY_MS);
    if (ageDays < 0.001) return { ...b, justFlipped: null };
    const lost = DECAY_PER_DAY * ageDays;
    const confidence = clamp01(b.confidence - lost);
    // How far we've slid toward the floor (0 = fresh, 1 = fully forgotten).
    const slide = Math.min(1, lost * 0.8);
    // Contract lean toward a retained fraction of itself, not toward 0. A strong
    // preference keeps a visible imprint forever; only its solidity fades.
    const floor = b.lean * LEAN_RETAINED_FLOOR;
    const lean = clampLean(b.lean + (floor - b.lean) * slide);
    return { ...b, confidence, lean, justFlipped: null };
  });
}

// ---- manual, in-flow corrections (the user editing right there) -------------

export function setLean(beliefs: Belief[], feature: Feature, lean: number): Belief[] {
  return beliefs.map((b) =>
    b.feature === feature
      ? { ...b, lean: clampLean(lean), lastSeen: Date.now(), justFlipped: null }
      : b
  );
}

export function downgrade(beliefs: Belief[], feature: Feature): Belief[] {
  return beliefs.map((b) =>
    b.feature === feature
      ? { ...b, confidence: clamp01(b.confidence - 0.25), justFlipped: null }
      : b
  );
}

export function deleteBelief(beliefs: Belief[], feature: Feature): Belief[] {
  // "delete" = forget it entirely; it resets to an empty belief.
  return beliefs.map((b) => (b.feature === feature ? emptyBelief(feature) : b));
}

export function togglePin(beliefs: Belief[], feature: Feature): Belief[] {
  return beliefs.map((b) =>
    b.feature === feature ? { ...b, pinned: !b.pinned } : b
  );
}

export function confirmInference(beliefs: Belief[], feature: Feature): Belief[] {
  // confirming an inference bumps confidence a little — the user vouched for it.
  return beliefs.map((b) =>
    b.feature === feature ? { ...b, confidence: clamp01(b.confidence + 0.12) } : b
  );
}

// ---- describing a belief in words -------------------------------------------

export function leanWord(b: Belief): string {
  const a = Math.abs(b.lean);
  const strong = a > 0.45;
  switch (b.feature) {
    case "acid":
      return b.lean >= 0 ? (strong ? "acid-forward" : "acid-leaning") : "acid-shy";
    case "spice":
      return b.lean >= 0 ? (strong ? "heat-seeking" : "heat-leaning") : "heat-shy";
    case "salt":
      return b.lean >= 0 ? (strong ? "salt-forward" : "salt-leaning") : "under-salts";
    case "fat":
      return b.lean >= 0 ? (strong ? "richness-loving" : "fat-leaning") : "fat-averse";
  }
}

export function confidenceWord(c: number): string {
  if (c >= 0.7) return "fairly sure";
  if (c >= 0.4) return "leaning that way";
  if (c >= 0.15) return "a hunch";
  return "just a guess";
}

// A belief is worth showing once it has any signal.
export function isHeld(b: Belief): boolean {
  return b.signals > 0 || b.pinned;
}

// ---- helpers ----------------------------------------------------------------

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function clampLean(x: number): number {
  return Math.max(-1, Math.min(1, x));
}
