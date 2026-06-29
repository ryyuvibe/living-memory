"use client";

import { Belief, Feature, InferencePrompt } from "@/lib/types";
import { BeliefCard } from "./BeliefCard";
import { TasteRadar } from "./TasteRadar";

interface Props {
  beliefs: Belief[];
  allBeliefs: Belief[];
  inference: InferencePrompt | null;
  daysElapsed: number;
  onSetLean: (f: Feature, v: number) => void;
  onDowngrade: (f: Feature) => void;
  onDelete: (f: Feature) => void;
  onTogglePin: (f: Feature) => void;
  onConfirmInference: (f: Feature) => void;
  onDismissInference: () => void;
}

export function LivingModel({
  beliefs,
  allBeliefs,
  inference,
  onSetLean,
  onDowngrade,
  onDelete,
  onTogglePin,
  onConfirmInference,
  onDismissInference,
}: Props) {
  return (
    <section className="rounded-xl border border-amber-900/40 bg-gradient-to-b from-[var(--panel)] to-neutral-950/40 p-5">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-amber-200">
          Living model
        </h2>
        <span className="text-[11px] text-neutral-500">
          an impression, held with confidence
        </span>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-neutral-500">
        Each belief shows how sure it is and why. Confidence is grounded in the
        count and consistency of signals — not the model guessing at its own
        certainty. It surfaces its own impression and invites the fix, in the
        flow — no monthly settings panel to go prune.
      </p>

      {/* taste-profile radar: salt · fat · acid · heat, shape = lean,
          solidity = confidence */}
      <div className="mb-4 rounded-lg border border-neutral-800 bg-neutral-950/40 py-3">
        <TasteRadar beliefs={allBeliefs} />
        <p className="mt-1 text-center text-[11px] text-neutral-600">
          shape = preference · solidity = confidence
        </p>
        <p className="mt-1 px-3 text-center text-[11px] leading-relaxed text-neutral-600">
          It forgets on purpose: unreinforced beliefs fade, and a conclusion
          your behavior contradicts gets let go — so the shape stays the
          current you.
        </p>
      </div>

      {inference && (
        <div className="mb-4 animate-flipIn rounded-lg border border-sky-800/60 bg-sky-950/30 p-3">
          <div className="text-xs text-sky-200">{inference.question}</div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onConfirmInference(inference.feature)}
              className="rounded bg-sky-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-sky-500"
            >
              Yes, that&apos;s right
            </button>
            <button
              onClick={onDismissInference}
              className="rounded border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 transition hover:border-neutral-500"
            >
              Not quite
            </button>
          </div>
        </div>
      )}

      {beliefs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-800 p-8 text-center text-sm text-neutral-600">
          No beliefs yet. Feed an interaction and watch an impression form.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {beliefs.map((b) => (
            <BeliefCard
              key={b.feature}
              belief={b}
              onSetLean={(v) => onSetLean(b.feature, v)}
              onDowngrade={() => onDowngrade(b.feature)}
              onDelete={() => onDelete(b.feature)}
              onTogglePin={() => onTogglePin(b.feature)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
