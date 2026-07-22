"use client";

import { PointerEvent, useRef } from "react";
import { useGameStore } from "../../bridge/GameStore";
import { input } from "../../input/InputState";

// Bottom action bar (amendment §3): the small, always-on control/ability strip
// for Level + Arena. Slots: [ J ATTACK ] [ SPACE JUMP ] [ SHIFT DASH ]
// [ K PARRY ] [ E INTERACT ]. Attack/dash/parry render a bottom-up cooldown
// sweep from gameStore.rtActions; the interact slot swaps to a boss-mechanic
// context action when one is set (with an optional hold-progress fill). An
// objective line + seal pips sit just above the bar. Pure Tailwind, monospace
// pixel idiom; small + bottom-centered so it never covers the player.

function Slot({
  icon,
  keyLabel,
  label,
  frac = 0,
  progress,
  tone = "violet",
}: {
  icon: string;
  keyLabel: string;
  label: string;
  frac?: number;
  progress?: number;
  tone?: "violet" | "amber" | "crimson";
}) {
  const border = tone === "amber" ? "border-amber-300/60" : tone === "crimson" ? "border-red-400/60" : "border-violet-300/40";
  const text = tone === "amber" ? "text-amber-100" : tone === "crimson" ? "text-red-200" : "text-violet-100";
  const sub = tone === "amber" ? "text-amber-200/80" : tone === "crimson" ? "text-red-300/80" : "text-violet-200/70";
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
        <div className={`text-[11px] font-black leading-none ${text}`} aria-hidden>{icon}</div>
        <div className={`mt-0.5 text-[7px] uppercase leading-tight tracking-widest ${sub}`}>{label}</div>
        <div className="mt-0.5 text-[6px] font-bold leading-none text-white/35">{keyLabel}</div>
      </div>
    </div>
  );
}

function TouchAction({ icon, label, frac = 0, held = false, onPress }: {
  icon: string;
  label: string;
  frac?: number;
  held?: boolean;
  onPress: () => void;
}) {
  const active = useRef(new Set<number>());
  const release = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    active.current.delete(event.pointerId);
    if (held && active.current.size === 0) input.setHeld("interactHeld", false);
  };
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        active.current.add(event.pointerId);
        event.currentTarget.setPointerCapture(event.pointerId);
        onPress();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      className="relative grid h-11 min-w-11 touch-none select-none place-items-center overflow-hidden rounded-full border border-violet-200/30 bg-black/55 px-1.5 font-mono text-violet-100 backdrop-blur-sm active:bg-violet-400/20"
    >
      {frac > 0 && <span className="absolute inset-x-0 bottom-0 bg-white/15" style={{ height: `${Math.min(1, frac) * 100}%` }} />}
      <span className="relative text-center"><span className="block text-base font-black leading-none">{icon}</span><span className="mt-1 block text-[7px] font-bold uppercase tracking-wider">{label}</span></span>
    </button>
  );
}

export default function ActionBar() {
  const scene = useGameStore((s) => s.scene);
  const actions = useGameStore((s) => s.rtActions);
  const abilities = useGameStore((s) => s.rtAbilities);
  const objective = useGameStore((s) => s.rtObjective);
  const seals = useGameStore((s) => s.rtSeals);
  const context = actions.context;
  const ending = scene === "Victory" || scene === "Chest";

  return (
    <div className="action-bar-root pointer-events-none absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 font-mono">
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

      {!ending && <div className="action-bar-desktop flex items-end gap-1">
        <Slot icon="✦" keyLabel="J" label="ATTACK" frac={actions.attack.cooldownFrac} />
        <Slot icon="↑" keyLabel="SPACE" label="JUMP" />
        <Slot icon="»" keyLabel="SHIFT" label="RUN" />
        <Slot icon="◇" keyLabel="K" label="PARRY" frac={actions.parry.cooldownFrac} />
        <Slot icon="⌁" keyLabel="R" label={`SWING ${abilities.grapple.charges}/${abilities.grapple.maxCharges}`} />
        <Slot icon="➤" keyLabel="F" label="RUSH" frac={abilities.slashRush.cooldownFrac} />
        <Slot icon="◖" keyLabel="Z" label="WAVE" frac={abilities.swordWave.cooldownFrac} />
        <Slot
          icon="♜"
          keyLabel="Q"
          label={abilities.ultimate.status.toUpperCase()}
          frac={abilities.ultimate.status === "active" ? 1 - abilities.ultimate.remainingFrac : 0}
          tone="crimson"
        />
        {context ? (
          <Slot icon="◆" keyLabel={context.key} label={context.label} progress={context.progress} tone="amber" />
        ) : (
          <Slot icon="◆" keyLabel="E" label="INTERACT" />
        )}
      </div>}

      <div className="action-bar-mobile pointer-events-auto max-w-[22rem] flex-wrap items-end justify-center gap-1.5">
        {!ending && <TouchAction icon="✦" label="Attack" frac={actions.attack.cooldownFrac} onPress={() => input.press("attackPressed")} />}
        {!ending && <TouchAction icon="◇" label="Parry" frac={actions.parry.cooldownFrac} onPress={() => input.press("parryPressed")} />}
        {!ending && <TouchAction icon="⌁" label={`R ${abilities.grapple.charges}`} onPress={() => input.press("grapplePressed")} />}
        {!ending && <TouchAction icon="➤" label="F" frac={abilities.slashRush.cooldownFrac} onPress={() => input.press("slashRushPressed")} />}
        {!ending && <TouchAction icon="◖" label="Z" frac={abilities.swordWave.cooldownFrac} onPress={() => input.press("swordWavePressed")} />}
        {!ending && <TouchAction icon="♜" label="Q" frac={abilities.ultimate.status === "active" ? 1 - abilities.ultimate.remainingFrac : 0} onPress={() => input.press("ultimatePressed")} />}
        <TouchAction
          icon="◆"
          label={context?.label ?? "Interact"}
          held
          onPress={() => {
            input.setHeld("interactHeld", true);
            input.press("interactPressed");
          }}
        />
      </div>
    </div>
  );
}
