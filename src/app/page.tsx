"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Belief, InferencePrompt, ParsedInteraction } from "@/lib/types";
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
  const [log, setLog] = useState<LogEntry[]>([]);
  // a fresh shuffled queue per session (fixed opener arc, then shuffled pool)
  const [seeds, setSeeds] = useState<string[]>(buildSeedQueue);
  const [seedIdx, setSeedIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [daysElapsed, setDaysElapsed] = useState(0);
  const [inference, setInference] = useState<InferencePrompt | null>(null);
  // virtual clock: starts now, advances when you press "let time pass"
  const clock = useRef<number>(Date.now());
  // monotonic id source for log rows -> stable React keys (no re-render churn)
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
    setLog([]);
    setSeeds(buildSeedQueue());
    setSeedIdx(0);
    setDaysElapsed(0);
    setInference(null);
  }, []);

  const held = useMemo(() => beliefs.filter(isHeld), [beliefs]);

  return (
    <main className="min-h-screen w-full px-5 py-8 lg:px-10">
      <header className="mx-auto mb-8 max-w-6xl">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-100">
          Living Memory
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-400">
          Today&apos;s AI memory is a filing cabinet of flat facts you have to
          maintain. A better memory is a{" "}
          <span className="text-neutral-200">living model</span> — it holds an
          impression with confidence, corrects itself in the flow, and forgets
          what&apos;s stale on its own.
        </p>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
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
    </main>
  );
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
