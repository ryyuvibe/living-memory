// Deterministic, offline parser. Maps casual cooking lines to taste signals so
// the demo runs with no API key. The LLM route uses the same output shape.
//
// Distinguishes REVEALED behavior ("reached for the chili crisp") from STATED
// critique ("a bit salty") — revealed is stronger and higher confidence.

import { Feature, FeatureDelta, ParsedInteraction } from "./types";

interface Rule {
  feature: Feature;
  dir: "+" | "-";
  revealed: boolean;
  confidence: number;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  // ---- ACID ----
  {
    feature: "acid",
    dir: "+",
    revealed: true,
    confidence: 0.6,
    patterns: [
      /\b(reached?|grab(bed)?|passed?|added more|splash(ed)?|hit it with|squeez(e|ed))\b.*\b(vinegar|lemon|lime|acid|citrus)\b/i,
      /\b(extra|more)\s+(vinegar|lemon|lime|citrus|acid)\b/i,
    ],
  },
  {
    feature: "acid",
    dir: "+",
    revealed: false,
    confidence: 0.35,
    patterns: [/\b(needed|wanted)\s+(more\s+)?(acid|brightness|tang|zip)\b/i, /\bflat\b.*\b(needed|wanted)\b/i],
  },
  {
    feature: "acid",
    dir: "-",
    revealed: false,
    confidence: 0.4,
    patterns: [/\btoo\s+(sour|acidic|tart|sharp)\b/i, /\b(less|cut the)\s+(vinegar|lemon|lime|acid)\b/i],
  },

  // ---- SPICE ----
  {
    feature: "spice",
    dir: "+",
    revealed: true,
    confidence: 0.6,
    patterns: [
      /\b(reached?|grab(bed)?|added|more|extra|piled on|doused|loaded up)\b.*\b(chili crisp|chili oil|chili|hot sauce|sriracha|gochujang|sambal|cayenne|jalape|pepper flakes|crushed red)\b/i,
      /\b(chili|hot sauce|sriracha)\b.*\b(again|every time)\b/i,
    ],
  },
  {
    feature: "spice",
    dir: "+",
    revealed: false,
    confidence: 0.35,
    patterns: [/\b(wanted|needed|could use)\s+(more\s+)?(heat|spice|kick)\b/i, /\bnot\s+spicy enough\b/i],
  },
  {
    feature: "spice",
    dir: "-",
    revealed: false,
    confidence: 0.45,
    patterns: [/\btoo\s+(spicy|hot|much heat)\b/i, /\b(avoid|skip|no|hold the|cut the)\s+(spice|heat|chili|pepper)\b/i, /\bmouth.?on.?fire\b/i],
  },

  // ---- SALT ----
  {
    feature: "salt",
    dir: "+",
    revealed: true,
    confidence: 0.5,
    patterns: [/\b(reached?|added|more|extra|finished with)\b.*\b(salt|soy|fish sauce|flaky salt)\b/i, /\bneeded salt\b/i],
  },
  {
    feature: "salt",
    dir: "-",
    revealed: false,
    confidence: 0.45,
    patterns: [/\b(a\s+)?(bit|little|touch|too)\s+salty\b/i, /\btoo much salt\b/i, /\boversalted\b/i],
  },

  // ---- FAT ----
  {
    feature: "fat",
    dir: "+",
    revealed: true,
    confidence: 0.6,
    patterns: [
      /\b(reached?|grab(bed)?|added|more|extra|finished with|stirred in|drizzled?|swirled)\b.*\b(butter|olive oil|cream|creme fraiche|tahini|lard|schmaltz|bacon fat|duck fat|ghee|mayo)\b/i,
      /\b(extra|more)\s+(butter|oil|cream|fat|richness)\b/i,
      /\b(basted|finished)\b.*\bbutter\b/i,
    ],
  },
  {
    feature: "fat",
    dir: "+",
    revealed: false,
    confidence: 0.35,
    patterns: [
      /\b(wanted|needed|could use)\s+(more\s+)?(richness|fat|silkiness|unctuous)\b/i,
      /\b(rich|silky|luscious|velvety|unctuous|buttery)\b/i,
      /\bfatty\s+(cut|piece|marbl)/i,
    ],
  },
  {
    feature: "fat",
    dir: "-",
    revealed: false,
    confidence: 0.45,
    patterns: [
      /\btoo\s+(rich|greasy|oily|heavy|fatty)\b/i,
      /\b(cut|trimmed|drained|skimmed)\s+(the\s+)?(fat|grease|oil)\b/i,
      /\b(lighter|leaner)\b.*\b(next time|version)\b/i,
    ],
  },
];

const POSITIVE = /\b(great|loved?|delicious|amazing|again|perfect|nailed|so good|banger|crushed it)\b/i;
const NEGATIVE = /\b(meh|bad|off|wrong|disappointing|bland|flat|won'?t make|never again)\b/i;

export function localParse(text: string): ParsedInteraction {
  const deltas: FeatureDelta[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(text))) {
      const key = `${rule.feature}:${rule.dir}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deltas.push({
        feature: rule.feature,
        dir: rule.dir,
        confidence: rule.confidence,
        revealed: rule.revealed,
      });
    }
  }

  let sentiment: ParsedInteraction["sentiment"] = "neutral";
  if (POSITIVE.test(text)) sentiment = "positive";
  if (NEGATIVE.test(text)) sentiment = "negative";

  return { text, sentiment, feature_deltas: deltas, source: "local" };
}
