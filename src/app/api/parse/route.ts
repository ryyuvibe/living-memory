import { NextRequest, NextResponse } from "next/server";
import { localParse } from "@/lib/localParser";
import { FEATURES, Feature, FeatureDelta, ParsedInteraction } from "@/lib/types";

// The one LLM call that matters: parseInteraction(text) -> signals.
// Runs server-side only; ANTHROPIC_API_KEY never reaches the browser.
// Reuses the validated parse_reaction prompt from taste_engine.py, extended to
// emit `revealed` so the model can weight behavior over critique.

const MODEL = "claude-sonnet-4-6";

const SYSTEM = `You turn a casual cooking comment into structured taste signal.

Distinguish REVEALED signal (reached for vinegar -> wanted more acid; passed the
chili crisp -> wants heat) from STATED critique ("a bit salty"). Revealed is
stronger and should carry higher confidence. Keep confidence LOW for one-off,
mood-contaminated comments; certainty only comes over many meals.

Features are exactly: salt, acid, spice, fat.
- "+" means they want MORE of that feature; "-" means LESS.
- "passed/reached for the vinegar/lemon" -> acid "+", revealed.
- "reached for the chili crisp / hot sauce again" -> spice "+", revealed.
- "a bit salty / too salty" -> salt "-", stated.
- "needed more heat" -> spice "+", stated.
- "stirred in butter / drizzled olive oil / added cream" -> fat "+", revealed.
- "too greasy / trimmed the fat" -> fat "-", stated.

Return ONLY JSON, no prose:
{"sentiment":"positive|neutral|negative",
 "feature_deltas":[{"feature":"salt|acid|spice|fat","dir":"+|-","confidence":0..1,"revealed":true|false}]}`;

function extractJson(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?|```$/gm, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json object found");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function coerce(raw: unknown, text: string): ParsedInteraction {
  const obj = raw as Record<string, unknown>;
  const rawDeltas = Array.isArray(obj.feature_deltas) ? obj.feature_deltas : [];
  const feature_deltas: FeatureDelta[] = [];
  for (const d of rawDeltas) {
    const dd = d as Record<string, unknown>;
    const feature = dd.feature as Feature;
    if (!FEATURES.includes(feature)) continue;
    const dir = dd.dir === "-" ? "-" : "+";
    const confidence = Math.max(0, Math.min(1, Number(dd.confidence) || 0.3));
    feature_deltas.push({ feature, dir, confidence, revealed: Boolean(dd.revealed) });
  }
  const sentiment =
    obj.sentiment === "positive" || obj.sentiment === "negative"
      ? obj.sentiment
      : "neutral";
  return { text, sentiment, feature_deltas, source: "llm" };
}

export async function POST(req: NextRequest) {
  const { text } = (await req.json()) as { text?: string };
  if (!text || !text.trim()) {
    return NextResponse.json({ error: "empty text" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // No key -> deterministic local parser. The demo always works.
  if (!apiKey) {
    return NextResponse.json(localParse(text));
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: SYSTEM,
      messages: [{ role: "user", content: text }],
    });
    const block = resp.content.find((b) => b.type === "text");
    const out = coerce(extractJson(block && "text" in block ? block.text : ""), text);
    // If the model returned nothing usable, fall back so the UI still reacts.
    if (out.feature_deltas.length === 0) {
      const local = localParse(text);
      if (local.feature_deltas.length > 0) return NextResponse.json(local);
    }
    return NextResponse.json(out);
  } catch {
    // Network/key/parse failure -> graceful local fallback.
    return NextResponse.json(localParse(text));
  }
}
