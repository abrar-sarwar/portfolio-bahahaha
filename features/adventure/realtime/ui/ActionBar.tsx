"use client";

import { useGameStore } from "../../bridge/GameStore";

// Bottom action bar (amendment §3): the small, always-on control/ability strip
// for Level + Arena. Slots: [ J ATTACK ] [ SPACE JUMP ] [ SHIFT DASH ]
// [ K PARRY ] [ E INTERACT ]. Attack/dash/parry render a bottom-up cooldown
// sweep from gameStore.rtActions; the interact slot swaps to a boss-mechanic
// context action when one is set (with an optional hold-progress fill). An
// objective line + seal pips sit just above the bar. Pure Tailwind, monospace
// pixel idiom; small + bottom-centered so it never covers the player.

function Slot({
  keyLabel,
  label,
  frac = 0,
  progress,
  tone = "violet",
}: {
  keyLabel: string;
  label: string;
  frac?: number;
  progress?: number;
  tone?: "violet" | "amber";
}) {
  const border = tone === "amber" ? "border-amber-300/60" : "border-violet-300/40";
  const text = tone === "amber" ? "text-amber-100" : "text-violet-100";
  const sub = tone === "amber" ? "text-amber-200/80" : "text-violet-200/70";
  return (
    <div className={`relative min-w-[46px] overflow-hidden rounded-sm border ${border} bg-black/60 px-2 py-1 text-center`}>
      {/* cooldown sweep (fills from the bottom up as an ability recharges) */}
      {frac > 0 && (
        <div
          className="absolute inset-x-0 bottom-0 bg-white/15"
          style={{ height: `${Math.min(1, frac) * 100}%` }}
          aria-hidden
        />
      )}
      {/* hold-progress fill (context action, e.g. holding E) */}
      {progress !== undefined && (
        <div
          className="absolute inset-x-0 bottom-0 bg-amber-400/40"
          style={{ height: `${Math.min(1, progress) * 100}%` }}
          aria-hidden
        />
      )}
      <div className="relative">
        <div className={`text-[9px] font-bold leading-tight ${text}`}>{keyLabel}</div>
        <div className={`text-[7px] uppercase leading-tight tracking-widest ${sub}`}>{label}</div>
      </div>
    </div>
  );
}

export default function ActionBar() {
  const actions = useGameStore((s) => s.rtActions);
  const objective = useGameStore((s) => s.rtObjective);
  const seals = useGameStore((s) => s.rtSeals);
  const context = actions.context;

  return (
    <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 font-mono">
      {(objective || seals) && (
        <div className="flex items-center gap-2">
          {objective && (
            <span className="rounded-sm border border-violet-300/40 bg-black/60 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.15em] text-violet-100">
              {objective}
            </span>
          )}
          {seals && (
            <span className="flex items-center gap-1">
              {Array.from({ length: seals.of }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rotate-45 border ${
                    i < seals.lit
                      ? "border-amber-200 bg-amber-400 shadow-[0_0_8px_rgba(255,215,94,0.7)]"
                      : "border-amber-300/40 bg-transparent"
                  }`}
                  aria-hidden
                />
              ))}
            </span>
          )}
        </div>
      )}

      <div className="flex items-end gap-1">
        <Slot keyLabel="J" label="ATTACK" frac={actions.attack.cooldownFrac} />
        <Slot keyLabel="SPACE" label="JUMP" />
        <Slot keyLabel="SHIFT" label="DASH" frac={actions.dash.cooldownFrac} />
        <Slot keyLabel="K" label="PARRY" frac={actions.parry.cooldownFrac} />
        {context ? (
          <Slot keyLabel={context.key} label={context.label} progress={context.progress} tone="amber" />
        ) : (
          <Slot keyLabel="E" label="INTERACT" />
        )}
      </div>
    </div>
  );
}
