"use client";

import { Feature, FEATURES, FEATURE_LABEL } from "@/lib/types";
import { FactSlot } from "./MemoryTodayPanel";

// The literal filing cabinet. Four stacked drawers — Salt, Fat, Acid, Heat —
// each holding exactly ONE index card with the last thing said. A drawer can't
// hold two cards and can't tell you how sure it is; the newest card just
// replaces whatever was filed before. Skeuomorphic mirror of the metaphor.

function stateText(slot: FactSlot | undefined): { label: string; filled: boolean } {
  if (!slot) return { label: "— empty —", filled: false };
  return { label: slot.text, filled: true };
}

function Drawer({ feature, slot }: { feature: Feature; slot: FactSlot | undefined }) {
  const { label, filled } = stateText(slot);
  const overwritten = !!slot?.prev && slot.prev !== slot.text;
  return (
    // Each drawer stretches to share the column height evenly (flex-1), so four
    // of them fill the panel instead of huddling at the top.
    <div className="flex flex-1 items-stretch gap-2">
      {/* drawer face */}
      <div
        className={`flex flex-1 items-center gap-3 rounded-md border bg-gradient-to-b px-3 py-2.5 ${
          filled
            ? "border-neutral-700 from-neutral-800/70 to-neutral-900/70"
            : "border-neutral-800 from-neutral-900/40 to-neutral-950/40"
        }`}
      >
        {/* drawer pull handle */}
        <span className="h-2 w-8 shrink-0 rounded-full bg-neutral-600" />
        <span className="w-12 shrink-0 text-xs uppercase tracking-wide text-neutral-400">
          {FEATURE_LABEL[feature]}
        </span>
        {/* the single index card inside */}
        <div className="min-w-0 flex-1">
          <span
            className={`block truncate rounded-sm border-l-2 px-2.5 py-1.5 text-sm ${
              filled
                ? "border-amber-500/50 bg-neutral-950/50 text-neutral-200"
                : "border-neutral-800 bg-neutral-950/30 text-neutral-700"
            }`}
          >
            {label}
          </span>
          {overwritten && (
            // The card that was silently replaced — struck through to show the
            // loss the cabinet itself keeps no record of.
            <span className="mt-1 block truncate pl-2.5 text-[11px] text-rose-400/60 line-through decoration-rose-400/40">
              was: {slot!.prev}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CabinetDrawers({ slots }: { slots: FactSlot[] }) {
  const byFeature = new Map(slots.map((s) => [s.feature, s]));
  return (
    <div className="flex h-full flex-col rounded-lg border border-neutral-800 bg-neutral-950/40 p-2">
      <div className="flex flex-1 flex-col gap-1.5">
        {FEATURES.map((f) => (
          <Drawer key={f} feature={f} slot={byFeature.get(f)} />
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-neutral-600">
        one card per drawer · the newest replaces whatever was filed
      </p>
    </div>
  );
}
