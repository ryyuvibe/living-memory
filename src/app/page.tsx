"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Belief,
  Feature,
  FEATURE_LABEL,
  FEATURES,
  InferencePrompt,
  ParsedInteraction,
} from "@/lib/types";
import {
  applyInteraction,
  confirmInference,
  DAY_MS,
  decayBeliefs,
  deleteBelief,
  downgrade,
  initialBeliefs,
  isHeld,
  setLean,
  togglePin,
} from "@/lib/model";
import { buildSeedQueue } from "@/lib/seeds";
import { localParse } from "@/lib/localParser";
import { InputPanel } from "@/components/InputPanel";
import { LivingModel } from "@/components/LivingModel";
import { FactSlot, MemoryTodayPanel } from "@/components/MemoryTodayPanel";

// When no LLM is configured we parse locally in the browser — no network hop,
// so "next interaction" feels instant. Set NEXT_PUBLIC_USE_LLM=1 to route
// through /api/parse (which calls Claude server-side).
const USE_LLM = process.env.NEXT_PUBLIC_USE_LLM === "1";

interface LogEntry {
  id: number;
  text: string;
  parsed: ParsedInteraction;
}

export default function Home() {
  const [beliefs, setBeliefs] = useState<Belief[]>(initialBeliefs);
  // "Memory today" cabinet: ONE note per feature slot, overwritten by the latest
  // signal. The contrast to beliefs — recency wins, history is silently lost.
  const [slots, setSlots] = useState<Record<Feature, FactSlot | undefined>>(
    {} as Record<Feature, FactSlot | undefined>
  );
  const [log, setLog] = useState<LogEntry[]>([]);
  // a fresh shuffled queue per session (fixed opener arc, then shuffled pool)
  const [seeds, setSeeds] = useState<string[]>(buildSeedQueue);
  const [seedIdx, setSeedIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [daysElapsed, setDaysElapsed] = useState(0);
  const [inference, setInference] = useState<InferencePrompt | null>(null);
  // virtual clock: starts now, advances when you press "let time pass"
  const clock = useRef<number>(Date.now());
  // monotonic id source for stable log keys (no re-render churn)
  const logId = useRef(0);

  // Commit a parsed interaction to state. Pure state writes — no awaiting.
  const commit = useCallback((text: string, parsed: ParsedInteraction) => {
    const now = clock.current;
    setBeliefs((prev) => {
      const next = applyInteraction(prev, parsed, now);
      // Defer the inference check out of the reducer: calling another state
      // setter mid-update forces an extra render pass. Schedule it instead.
      queueMicrotask(() => maybeRaiseInference(next, setInference));
      return next;
    });
    // The cabinet, fed by the SAME parsed signals: OVERWRITE one note per
    // feature slot. The latest signal replaces whatever was there — no count,
    // no consistency, no provenance. A contradicting signal silently wipes the
    // old note (we stash it as `prev` only to flash what was lost). That
    // recency-only overwrite is the failure the living model answers.
    setSlots((prev) => {
      const next = { ...prev };
      for (const d of parsed.feature_deltas) {
        const text = flatFact(d.feature, d.dir);
        const before = prev[d.feature];
        next[d.feature] = {
          feature: d.feature,
          text,
          prev: before && before.text !== text ? before.text : null,
          updatedAt: now,
        };
      }
      return next;
    });
    // Keep only the most recent rows in the visible log. Older interactions have
    // already shaped the model; capping the list bounds DOM/SVG growth so the
    // panel stays snappy no matter how long the demo runs.
    setLog((prev) => [{ id: logId.current++, text, parsed }, ...prev].slice(0, 12));
  }, []);

  const feed = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      // Fast path: local parse is synchronous — apply in this tick, no busy
      // flicker, no await. This is what "next interaction" hits by default.
      if (!USE_LLM) {
        commit(t, localParse(t));
        return;
      }
      // LLM path: round-trip to the server, guard against double-submit.
      setBusy(true);
      fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      })
        .then((res) => res.json() as Promise<ParsedInteraction>)
        .then((parsed) => commit(t, parsed))
        .finally(() => setBusy(false));
    },
    [commit]
  );

  const nextSeed = useCallback(() => {
    if (seedIdx >= seeds.length) return;
    feed(seeds[seedIdx]);
    setSeedIdx((i) => i + 1);
  }, [seedIdx, seeds, feed]);

  const letTimePass = useCallback(() => {
    clock.current += 4 * DAY_MS;
    setDaysElapsed((d) => d + 4);
    setBeliefs((prev) => decayBeliefs(prev, clock.current));
  }, []);

  const reset = useCallback(() => {
    clock.current = Date.now();
    setBeliefs(initialBeliefs());
    setSlots({} as Record<Feature, FactSlot | undefined>);
    setLog([]);
    setSeeds(buildSeedQueue());
    setSeedIdx(0);
    setDaysElapsed(0);
    setInference(null);
  }, []);

  const held = useMemo(() => beliefs.filter(isHeld), [beliefs]);
  // Cabinet rows in stable Salt·Fat·Acid·Heat order, only the filled slots.
  const slotRows = useMemo(
    () => FEATURES.map((f) => slots[f]).filter((s): s is FactSlot => !!s),
    [slots]
  );

  return (
    <main className="min-h-screen w-full px-5 py-4 lg:px-10">
      <header className="mx-auto mb-4 max-w-7xl">
        <h1 className="text-base font-semibold tracking-tight text-neutral-100">
          Living Memory
        </h1>
        <p className="mt-0.5 max-w-3xl text-xs leading-relaxed text-neutral-400">
          Today&apos;s AI memory is a filing cabinet of flat facts you maintain.
          A better memory is a{" "}
          <span className="text-neutral-200">living model</span> — it holds an
          impression with confidence, corrects itself in the flow, and forgets
          what&apos;s stale on its own. Feed both and watch them diverge.
        </p>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        {/* Top row, full width: the input controls — cooking interaction and
            the clock sit side by side, with the "what it heard" log beneath. */}
        <InputPanel
          onSubmit={feed}
          onNextSeed={nextSeed}
          onLetTimePass={letTimePass}
          onReset={reset}
          busy={busy}
          seedsLeft={seeds.length - seedIdx}
          daysElapsed={daysElapsed}
          log={log}
        />

        {/* Bottom row: the two memories, side by side, fed by the same signals.
            Cabinet left, living model right — stacks on narrow screens. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MemoryTodayPanel slots={slotRows} />

          <LivingModel
            beliefs={held}
            allBeliefs={beliefs}
            inference={inference}
            daysElapsed={daysElapsed}
            onSetLean={(f, v) => setBeliefs((b) => setLean(b, f, v))}
            onDowngrade={(f) => setBeliefs((b) => downgrade(b, f))}
            onDelete={(f) => setBeliefs((b) => deleteBelief(b, f))}
            onTogglePin={(f) => setBeliefs((b) => togglePin(b, f))}
            onConfirmInference={(f) => {
              setBeliefs((b) => confirmInference(b, f));
              setInference(null);
            }}
            onDismissInference={() => setInference(null)}
          />
        </div>
      </div>
    </main>
  );
}

// A parsed delta -> one flat fact string for the cabinet slot.
// "+" -> "likes salt"; "-" -> "avoids heat". No confidence, no provenance —
// just the latest note, which overwrites whatever the slot held before.
function flatFact(feature: Belief["feature"], dir: "+" | "-"): string {
  const verb = dir === "+" ? "likes" : "avoids";
  return `${verb} ${FEATURE_LABEL[feature]}`;
}

// Surface an inference for confirmation when a belief is moderately formed but
// not yet user-vouched: "looks like you run acid-forward — right?"
function maybeRaiseInference(
  beliefs: Belief[],
  set: (p: InferencePrompt | null) => void
) {
  const candidate = beliefs.find(
    (b) => b.confidence >= 0.4 && b.confidence < 0.72 && b.signals >= 2
  );
  if (!candidate) return;
  const word =
    candidate.feature === "acid"
      ? "acid-forward"
      : candidate.feature === "spice"
        ? candidate.lean >= 0
          ? "heat-seeking"
          : "heat-shy"
        : candidate.feature === "salt"
          ? "salt-forward"
          : candidate.lean >= 0
            ? "richness-loving"
            : "fat-averse";
  set({
    id: `${candidate.feature}-${Date.now()}`,
    feature: candidate.feature,
    lean: candidate.lean,
    question: `looks like you run ${word} — right?`,
  });
}
