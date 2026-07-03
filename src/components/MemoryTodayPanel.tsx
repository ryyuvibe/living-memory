"use client";

import { Feature } from "@/lib/types";
import { CabinetDrawers } from "./CabinetDrawers";

// "Memory today" — the filing-cabinet paradigm, depicted faithfully. This is how
// today's flat-fact memory (ChatGPT included) actually behaves: it keeps ONE
// note per slot — salt, fat, acid, heat — and a new signal OVERWRITES the slot.
// On contradiction it silently replaces "likes heat" with "avoids heat" and
// keeps no record the old note ever existed. The loss is invisible: no count,
// no consistency, no provenance, no "you used to" — just the latest thing said,
// standing in for the whole history. That silent, recency-only overwrite is the
// failure the living model answers.
//
// The single depiction is the filing cabinet itself (CabinetDrawers): one card
// per drawer, the newest replacing whatever was filed. We used to render a flat
// text list of the same four facts above it — but that was literally the same
// information twice, so the list is gone and the drawers carry the whole story.

// One slot's current note. `prev` is the note that was just wiped (kept only for
// a transient "← was: …" flash, not by the cabinet itself — the cabinet forgets
// it the moment it's overwritten).
export interface FactSlot {
  feature: Feature;
  text: string; // e.g. "likes acid", "avoids heat" — the last thing said
  prev?: string | null; // the note this one replaced (transient UI hint only)
  updatedAt: number; // bump key so an overwritten row re-flashes
}

interface Props {
  slots: FactSlot[];
}

export function MemoryTodayPanel({ slots }: Props) {
  return (
    <section className="flex flex-col rounded-xl border border-neutral-800 bg-[var(--panel)] p-3">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-neutral-300">
          Memory today
        </h2>
        <span className="text-[11px] text-neutral-600">
          one flat fact per slot
        </span>
      </div>
      <p className="mb-2 text-xs leading-relaxed text-neutral-500">
        One note per slot, overwritten by the latest signal — no confidence, no
        count, no why.
      </p>

      {slots.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-800 p-8 text-center text-sm text-neutral-600">
          No facts yet. Feed an interaction and watch a drawer fill in.
        </div>
      ) : (
        // The filing cabinet, drawn literally — the flat-memory foil to the
        // living radar across the way. It grows to fill the column so the two
        // panels read at a comparable height. This is the ONLY depiction now.
        <div className="flex-1">
          <CabinetDrawers slots={slots} />
        </div>
      )}

      {slots.length > 0 && (
        <p className="mt-2 border-t border-neutral-800 pt-2 text-[11px] leading-relaxed text-neutral-600">
          Whatever you said last wins — one outlier overwrites a season of
          habit, and the cabinet never knows it contradicted itself.
        </p>
      )}
    </section>
  );
}
