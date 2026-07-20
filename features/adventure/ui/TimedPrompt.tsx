"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../bridge/GameStore";
import { dispatchCombat, SCRIPTED_PARRY_STEP } from "../combat/controller";
import { audio } from "../audio/synth";
import CountdownBar from "./CountdownBar";
import { resolveParry, markerPosition, resolveMarker, type QteSpec, type ParryGrade } from "../combat/timedEvents";

// Renders the active defense mini-game against the telegraphed boss move: a
// parry flash ring (Space or pointerdown = press), a moving-pip marker bar, a
// timed choice, or a type-word mini input. Resolution is dispatched exactly
// once per telegraph; the controller's deadline handles a total no-answer.
//
// The telegraph is read straight off the store (`s.telegraph`), not from the
// `combat:telegraph` bus event. A bus subscription only starts listening once
// this component's mount-time effect runs — and under React's automatic
// batching, dispatchCombat's store write happens synchronously while the
// re-render that MOUNTS this component (when `combat` first flips into a
// defense-awaiting tag) is deferred until the current stack unwinds. That
// ordering means a bus emit fired during dispatchCombat always arrives before
// TimedPrompt exists to hear it, and the event has no replay — the prompt
// would render null forever, auto-force-failing every normal telegraph and
// permanently soft-locking the devil-king's scripted parry step (which
// deliberately has no force-fail timer). Reading store state on every render,
// including the first, closes that race by construction.
export default function TimedPrompt() {
  const combat = useGameStore((s) => s.combat);
  const tel = useGameStore((s) => s.telegraph);
  const resolvedFor = useRef<number>(-1);

  // A prompt is live only while the engine actually awaits a defense-result
  // AND the controller has armed a telegraph for it.
  const awaiting =
    !!combat &&
    !!tel &&
    (combat.tag === "telegraph" ||
      (combat.tag === "scripted" && combat.mechanic.finalStep === SCRIPTED_PARRY_STEP));

  const spec = tel?.spec;

  // Keyed off telegraph.startedAt (unique per arm) rather than a bus-derived
  // local counter, so a resolution can never double-fire even if this
  // component mounted mid-telegraph.
  const resolveOnce = (fn: () => void) => {
    if (!tel || resolvedFor.current === tel.startedAt) return;
    resolvedFor.current = tel.startedAt;
    fn();
  };

  const submitParry = () => {
    resolveOnce(() => {
      if (!tel || !combat) return;
      const windowMs = tel.spec.kind === "parry" ? tel.spec.windowMs : combat.player.parryWindowMs;
      const grade: ParryGrade = resolveParry(
        performance.now(),
        tel.impactAt,
        windowMs,
        combat.player.perfectParryMs,
      );
      audio.sfx(grade === "miss" ? "damage" : "parry");
      dispatchCombat({ type: "defense-result", parry: grade });
    });
  };

  const submitQte = (ok: boolean) => {
    resolveOnce(() => {
      audio.sfx(ok ? "parry" : "damage");
      dispatchCombat({ type: "defense-result", qteSuccess: ok });
    });
  };

  // Space keydown = parry press (do NOT reuse the platformer input singleton).
  useEffect(() => {
    if (!awaiting || !spec || spec.kind !== "parry") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        submitParry();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaiting, spec, tel?.startedAt]);

  if (!awaiting || !tel || !spec) return null;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {spec.kind === "parry" && <ParryRing onPress={submitParry} />}
      {spec.kind === "marker" && <MarkerBar spec={spec} startedAt={tel.startedAt} onPress={submitQte} />}
      {spec.kind === "choice" && (
        <ChoiceButtons key={tel.startedAt} spec={spec} onPick={submitQte} />
      )}
      {spec.kind === "type-word" && <TypeWord spec={spec} onSubmit={submitQte} />}
    </div>
  );
}

// ── parry ────────────────────────────────────────────────────────────────────
function ParryRing({ onPress }: { onPress: () => void }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      aria-label="Parry"
      className="pointer-events-auto flex min-h-[44px] flex-col items-center gap-1 focus:outline-none"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full border-4 border-violet-300/70" />
        <div className="absolute inset-2 rounded-full border-2 border-red-400/60" />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">PARRY</span>
      </div>
      <span className="text-[9px] uppercase tracking-[0.25em] text-violet-200/80">
        Space / Tap on impact
      </span>
    </button>
  );
}

// ── marker ────────────────────────────────────────────────────────────────────
function MarkerBar({
  spec,
  startedAt,
  onPress,
}: {
  spec: Extract<QteSpec, { kind: "marker" }>;
  startedAt: number;
  onPress: (ok: boolean) => void;
}) {
  const [pos, setPos] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const loop = () => {
      setPos(markerPosition(performance.now() - startedAt, spec.travelMs));
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [spec.travelMs, startedAt]);

  const press = () => {
    cancelAnimationFrame(raf.current);
    onPress(resolveMarker(performance.now() - startedAt, spec));
  };

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        press();
      }}
      aria-label="Stop the marker in the target zone"
      className="pointer-events-auto flex min-h-[44px] w-full max-w-xs flex-col items-center gap-1"
    >
      <div className="relative h-5 w-full overflow-hidden rounded-sm border border-violet-300/40 bg-black/60">
        <div
          className="absolute inset-y-0 bg-teal-400/30"
          style={{
            left: `${spec.targetStart * 100}%`,
            width: `${(spec.targetEnd - spec.targetStart) * 100}%`,
          }}
        />
        <div
          className="absolute inset-y-0 w-1 bg-violet-200 shadow-[0_0_10px_rgba(167,139,250,0.8)]"
          style={{ left: `calc(${pos * 100}% - 2px)` }}
        />
      </div>
      <span className="text-[9px] uppercase tracking-[0.25em] text-violet-200/80">STOP in the zone</span>
    </button>
  );
}

// ── choice ────────────────────────────────────────────────────────────────────
function ChoiceButtons({
  spec,
  onPick,
}: {
  spec: Extract<QteSpec, { kind: "choice" }>;
  onPick: (ok: boolean) => void;
}) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-1.5">
      <div className="text-center text-[11px] text-violet-100">{spec.promptText}</div>
      <div className="grid w-full grid-cols-2 gap-1.5">
        {spec.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onPick(i === spec.correctIndex);
            }}
            className="pointer-events-auto min-h-[44px] rounded-sm border border-violet-300/40 bg-black/60 px-2 text-[12px] text-white transition-colors hover:border-violet-200/80 hover:bg-violet-500/20"
          >
            {opt}
          </button>
        ))}
      </div>
      {/* shrinking countdown (visual; controller force-fails on timeout).
          ChoiceButtons itself is remounted per-telegraph by its parent's
          key, so this bar restarts exactly once per prompt too. */}
      <CountdownBar durationMs={spec.timeLimitMs} />
    </div>
  );
}

// ── type-word ─────────────────────────────────────────────────────────────────
function TypeWord({
  spec,
  onSubmit,
}: {
  spec: Extract<QteSpec, { kind: "type-word" }>;
  onSubmit: (ok: boolean) => void;
}) {
  const [typed, setTyped] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-1">
      <div className="rounded-sm border border-violet-300/40 bg-black/60 px-2 py-0.5 font-mono text-[13px] text-violet-100">
        {spec.word}
      </div>
      <input
        ref={ref}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit(typed.trim().toLowerCase() === spec.word.toLowerCase());
          }
        }}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        aria-label="Type the word"
        className="min-h-[44px] w-full rounded-sm border border-violet-300/40 bg-black/70 px-2 text-center font-mono text-[14px] text-white outline-none focus:border-violet-200/80"
      />
    </div>
  );
}
