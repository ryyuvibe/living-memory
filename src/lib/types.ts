// The "living memory" is just this structured JSON. That's the whole trick.

// Salt · Fat · Acid · Heat — the four axes of the taste profile.
// (Internally "spice" is the heat axis; it renders as "heat".)
export type Feature = "salt" | "fat" | "acid" | "spice";

// Ordered clockwise for the radar: Salt (top) · Fat (right) · Acid (bottom) · Heat (left).
export const FEATURES: Feature[] = ["salt", "fat", "acid", "spice"];

export const FEATURE_LABEL: Record<Feature, string> = {
  salt: "salt",
  fat: "fat",
  acid: "acid",
  spice: "heat",
};

// A single taste signal extracted from one interaction line.
export interface FeatureDelta {
  feature: Feature;
  dir: "+" | "-";
  confidence: number; // 0..1, how strongly this one line implies the signal
  revealed: boolean; // revealed behavior (reached for vinegar) vs stated critique
}

export interface ParsedInteraction {
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  feature_deltas: FeatureDelta[];
  source: "llm" | "local";
}

// A belief the living model holds about one taste feature.
export interface Belief {
  feature: Feature;
  lean: number; // -1..+1 vs population default
  confidence: number; // 0..1, evidence-grounded (count + consistency)
  signals: number; // how many signals have touched this belief
  posSignals: number; // signals pushing positive (for consistency)
  negSignals: number; // signals pushing negative
  lastSeen: number; // epoch ms of last reinforcement
  pinned: boolean;
  // transient UI flags, set when a belief just flipped across zero
  justFlipped?: { fromLean: number; toLean: number; reason: string } | null;
}

export interface InferencePrompt {
  id: string;
  feature: Feature;
  question: string; // "looks like you run acid-forward — right?"
  lean: number;
}
