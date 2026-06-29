"use client";

import { memo, useState } from "react";
import { ParsedInteraction } from "@/lib/types";
import { PixelIcon, iconForText } from "./PixelIcon";

interface LogEntry {
  id: number;
  text: string;
  parsed: ParsedInteraction;
}

// One row of "what it heard". Memoized + keyed by a stable id so that feeding a
// new interaction only mounts the new row — existing rows (and their ~144-rect
// pixel-art SVGs) are not re-rendered. This keeps "next interaction" snappy as
// the log grows.
const LogRow = memo(function LogRow({ entry }: { entry: LogEntry }) {
  const { text, parsed } = entry;
  return (
    <li className="flex gap-2.5 text-xs">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded border border-neutral-800 bg-neutral-950/60">
        <PixelIcon name={iconForText(text)} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-neutral-300">&ldquo;{text}&rdquo;</div>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {parsed.feature_deltas.length === 0 && (
            <span className="text-neutral-600">no clear signal</span>
          )}
          {parsed.feature_deltas.map((d, j) => (
            <span
              key={j}
              className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300"
            >
              {d.feature}
              {d.dir}
              {d.revealed ? " · revealed" : ""}
            </span>
          ))}
          <span className="rounded px-1 py-0.5 text-[10px] text-neutral-600">
            via {parsed.source}
          </span>
        </div>
      </div>
    </li>
  );
});

interface Props {
  onSubmit: (text: string) => void;
  onNextSeed: () => void;
  onLetTimePass: () => void;
  onReset: () => void;
  busy: boolean;
  seedsLeft: number;
  daysElapsed: number;
  log: LogEntry[];
}

export function InputPanel({
  onSubmit,
  onNextSeed,
  onLetTimePass,
  onReset,
  busy,
  seedsLeft,
  daysElapsed,
  log,
}: Props) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onSubmit(text);
    setText("");
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-xl border border-neutral-800 bg-[var(--panel)] p-4">
        <div className="mb-2 text-xs uppercase tracking-wider text-neutral-500">
          Cooking interaction
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={3}
          placeholder='e.g. "reached for the chili crisp again"'
          className="w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
        />
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={submit}
            disabled={busy || !text.trim()}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-neutral-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Feed it
          </button>
          <button
            onClick={onNextSeed}
            disabled={busy || seedsLeft === 0}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {seedsLeft > 0 ? `Next interaction (${seedsLeft})` : "No seeds left"}
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-600">
          ⌘/Ctrl + Enter to feed. Each line is parsed into taste signals —
          revealed behavior counts for more than stated critique.
        </p>
      </div>

      {log.length > 0 && (
        <div className="thin-scroll max-h-64 overflow-y-auto rounded-xl border border-neutral-800 bg-[var(--panel)] p-4">
          <div className="mb-2 text-xs uppercase tracking-wider text-neutral-500">
            What it heard
          </div>
          <ul className="flex flex-col gap-2.5">
            {log.map((e) => (
              <LogRow key={e.id} entry={e} />
            ))}
          </ul>
        </div>
      )}

      {/* The clock lives at the bottom — it's the "let time pass" lever you reach
          for after you've fed some interactions. */}
      <div className="rounded-xl border border-neutral-800 bg-[var(--panel)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PixelIcon name="clock" size={18} />
            <div className="text-xs uppercase tracking-wider text-neutral-500">
              The clock
            </div>
          </div>
          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[11px] tabular-nums text-neutral-300">
            day {daysElapsed}
          </span>
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-neutral-500">
          Beliefs you don&apos;t reinforce fade on their own. Pinned beliefs are
          protected.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onLetTimePass}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-neutral-500 disabled:opacity-40"
          >
            <PixelIcon name="clock" size={14} />
            Let time pass (+4 days)
          </button>
          <button
            onClick={onReset}
            className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 transition hover:text-neutral-300"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
