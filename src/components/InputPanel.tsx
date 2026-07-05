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
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_320px] lg:grid-rows-1 lg:items-stretch">
      {/* Column 1: cooking interaction — where you feed the model. The primary
          demo CTA ("Next interaction") leads on top; the custom-input submodule
          sits below it as the secondary, self-contained escape hatch. */}
      <div className="rounded-xl border border-neutral-800 bg-[var(--panel)] p-3">
        <div className="mb-1.5 text-xs uppercase tracking-wider text-neutral-500">
          Cooking interaction
        </div>

        {/* Primary CTA: stepping through seeded interactions is the guided
            narrative. Full-width so it clearly leads the column. */}
        <button
          onClick={onNextSeed}
          disabled={busy || seedsLeft === 0}
          className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {seedsLeft > 0 ? `Next interaction (${seedsLeft})` : "No seeds left"}
        </button>

        {/* Divider — "or write your own" marks the drop to the secondary path. */}
        <div className="my-2 flex items-center gap-2 text-[11px] text-neutral-600">
          <span className="h-px flex-1 bg-neutral-800" />
          or write your own
          <span className="h-px flex-1 bg-neutral-800" />
        </div>

        {/* Secondary submodule: the textarea and its "Feed it" affordance read
            as one unit — Feed it is fused to the bottom of the input rather than
            floating beside it, so an empty (inert) button no longer feels like a
            broken control sitting next to the primary CTA. */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 focus-within:border-neutral-600">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={1}
            placeholder='e.g. "reached for the chili crisp again"'
            className="w-full resize-none rounded-t-lg bg-transparent p-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2 border-t border-neutral-800 px-2.5 py-2">
            <span className="text-[10px] text-neutral-600">
              ⌘/Ctrl + Enter
            </span>
            <button
              onClick={submit}
              disabled={busy || !text.trim()}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-amber-300/90 transition hover:bg-amber-500/10 hover:text-amber-200 disabled:pointer-events-none disabled:text-neutral-600"
            >
              Feed it →
            </button>
          </div>
        </div>

        <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-600">
          Revealed behavior counts for more than stated critique.
        </p>
      </div>

      {/* Column 2: what it heard — a bounded scroll log. The PANEL stretches to
          the row height (no max-h) so it always sits flush with the control
          columns — no dead gap when the log is short. The INNER list is the
          bounded part: flex-1 + min-h-0 lets it fill the panel and scroll
          within it, so a growing log scrolls instead of driving the row taller.
          Capping the panel (not the list) was the earlier bug — it shortened
          the panel below the row and reopened the gap. On mobile it spans full
          width beneath the two control cards. */}
      <div className="relative h-64 rounded-xl border border-neutral-800 bg-[var(--panel)] lg:h-auto lg:min-h-0">
        {/* On lg the inner content is absolutely positioned to fill the panel —
            this removes the (growing) log from the grid row's intrinsic-size
            calculation entirely, so Columns 1 & 3 alone set the row height and
            this panel simply matches it, no matter how many rows the log holds.
            A tall log scrolls inside; it can never drive the row taller.
            On mobile the grid is a single column with no sibling row to stretch
            against, so an absolute panel would collapse to 0px and vanish —
            there the content stays in normal flow (h-full) and the panel's own
            FIXED height (h-64) bounds it: a growing log scrolls inside instead
            of driving the panel taller. A min-h here would let it grow without
            limit — the bug this replaced. */}
        <div className="flex h-full flex-col p-4 lg:absolute lg:inset-0">
          <div className="mb-2 text-xs uppercase tracking-wider text-neutral-500">
            What it heard
          </div>
          {log.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-center text-xs text-neutral-600">
              Fed interactions show up here, parsed into signals.
            </div>
          ) : (
            <ul className="thin-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
              {log.map((e) => (
                <LogRow key={e.id} entry={e} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Column 3: the clock — the "let time pass" lever. Flex column so the big
          square CTA can stretch (flex-1) into the vertical negative space. */}
      <div className="flex flex-col rounded-xl border border-neutral-800 bg-[var(--panel)] p-3">
        <div className="mb-1.5 flex items-center justify-between">
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
        <p className="mb-2 text-[11px] leading-relaxed text-neutral-500">
          Beliefs you don&apos;t reinforce fade on their own. Pinned beliefs are
          protected.
        </p>
        {/* Big square CTA: a large hourglass dominates and fills the negative
            space; the "Let time pass +4 days" label is demoted beneath it as a
            small caption so the glyph carries the hierarchy. flex-1 lets the
            block grow to fill whatever height the row settles at. */}
        <button
          onClick={onLetTimePass}
          disabled={busy}
          className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-3 text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-900/60 disabled:opacity-40"
        >
          <PixelIcon name="clock" size={40} />
          <span className="text-[11px] uppercase tracking-wide text-neutral-500">
            Let time pass
            <span className="ml-1 text-neutral-600">+4 days</span>
          </span>
        </button>
        <button
          onClick={onReset}
          className="mt-2 w-full rounded-lg px-3 py-1.5 text-center text-xs text-neutral-500 transition hover:text-neutral-300"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
