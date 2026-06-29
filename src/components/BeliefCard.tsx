"use client";

import { useState } from "react";
import { Belief } from "@/lib/types";
import { confidenceWord, leanWord } from "@/lib/model";

interface Props {
  belief: Belief;
  onSetLean: (v: number) => void;
  onDowngrade: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

export function BeliefCard({
  belief: b,
  onSetLean,
  onDowngrade,
  onDelete,
  onTogglePin,
}: Props) {
  const [editing, setEditing] = useState(false);

  // Decay is visible: low-confidence, unpinned, fading beliefs dim.
  const faded = !b.pinned && b.confidence < 0.2;
  const conf = Math.round(b.confidence * 100);

  return (
    <div
      className={`rounded-lg border p-3 transition-all duration-500 ${
        b.justFlipped
          ? "animate-flipIn border-violet-700/60 bg-violet-950/20"
          : "border-neutral-800 bg-neutral-950/40"
      } ${faded ? "opacity-50" : "opacity-100"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-100">
              {leanWord(b)}
            </span>
            {b.pinned && (
              <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-[10px] text-amber-300">
                pinned
              </span>
            )}
          </div>
          {/* confidence + provenance: how sure, and why */}
          <div className="mt-0.5 text-xs text-neutral-400">
            {confidenceWord(b.confidence)}{" "}
            <span className="text-neutral-600">
              ({b.signals} signal{b.signals === 1 ? "" : "s"})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePin}
            title={b.pinned ? "Unpin" : "Pin to protect from decay"}
            className={`rounded px-1.5 py-0.5 text-xs transition ${
              b.pinned
                ? "text-amber-300 hover:text-amber-200"
                : "text-neutral-600 hover:text-neutral-300"
            }`}
          >
            {b.pinned ? "★" : "☆"}
          </button>
          <button
            onClick={() => setEditing((e) => !e)}
            className="rounded px-1.5 py-0.5 text-xs text-neutral-500 transition hover:text-neutral-200"
          >
            {editing ? "done" : "adjust"}
          </button>
        </div>
      </div>

      {/* confidence bar */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            b.confidence >= 0.7
              ? "bg-emerald-500"
              : b.confidence >= 0.4
                ? "bg-amber-500"
                : "bg-neutral-500"
          }`}
          style={{ width: `${conf}%` }}
        />
      </div>

      {/* contradiction flip announcement */}
      {b.justFlipped && (
        <div className="mt-2.5 text-xs leading-relaxed text-violet-200">
          ↻ {b.justFlipped.reason}
          <span className="ml-1 text-neutral-500">
            ({fmt(b.justFlipped.fromLean)} → {fmt(b.justFlipped.toLean)})
          </span>
        </div>
      )}

      {/* in-flow correction controls */}
      {editing && (
        <div className="mt-3 border-t border-neutral-800 pt-3">
          <label className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="w-10 shrink-0">lean</span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={b.lean}
              onChange={(e) => onSetLean(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
            <span className="w-10 shrink-0 text-right tabular-nums text-neutral-400">
              {fmt(b.lean)}
            </span>
          </label>
          <div className="mt-2.5 flex gap-2">
            <button
              onClick={onDowngrade}
              className="rounded border border-neutral-700 px-2 py-1 text-[11px] text-neutral-300 transition hover:border-neutral-500"
            >
              Downgrade
            </button>
            <button
              onClick={onDelete}
              className="rounded border border-red-900/50 px-2 py-1 text-[11px] text-red-300 transition hover:border-red-700"
            >
              Forget it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function fmt(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(2);
}
