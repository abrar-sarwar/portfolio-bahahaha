"use client";

import { PointerEvent, ReactNode, useRef } from "react";
import { input } from "../input/InputState";

function TouchButton({
  label,
  children,
  onDown,
  onUp,
}: {
  label: string;
  children: ReactNode;
  onDown: () => void;
  onUp?: () => void;
}) {
  const active = useRef(new Set<number>());
  const down = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    active.current.add(event.pointerId);
    event.currentTarget.setPointerCapture(event.pointerId);
    onDown();
  };
  const up = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    active.current.delete(event.pointerId);
    if (active.current.size === 0) onUp?.();
  };
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      className="grid h-14 w-14 touch-none select-none place-items-center rounded-full border border-white/15 bg-black/45 font-mono text-sm font-black text-white/65 shadow-[0_3px_18px_rgba(0,0,0,0.35)] backdrop-blur-sm active:border-violet-200/50 active:bg-violet-400/20 active:text-white"
    >
      {children}
    </button>
  );
}

export default function VirtualControls({ walkOnly = false, showPause = true }: { walkOnly?: boolean; showPause?: boolean }) {
  return (
    <div className="virtual-controls pointer-events-none absolute inset-0 z-30 touch-none select-none">
      {showPause && <button
        type="button"
        aria-label="Pause game"
        onPointerDown={(event) => {
          event.preventDefault();
          input.press("pausePressed");
        }}
        className="pointer-events-auto absolute right-3 top-11 grid h-9 w-9 touch-none place-items-center rounded-full border border-white/15 bg-black/50 font-mono text-xs text-white/60 backdrop-blur-sm active:bg-violet-400/20"
      >
        Ⅱ
      </button>}

      <div className="pointer-events-auto absolute bottom-4 left-4 flex gap-2">
        <TouchButton label="Move left" onDown={() => input.setHeld("left", true)} onUp={() => input.setHeld("left", false)}>◀</TouchButton>
        <TouchButton label="Move right" onDown={() => input.setHeld("right", true)} onUp={() => input.setHeld("right", false)}>▶</TouchButton>
      </div>

      {!walkOnly && <div className="pointer-events-auto absolute bottom-4 right-4 flex items-end gap-2">
        <TouchButton label="Dash" onDown={() => input.press("dashPressed")}>DASH</TouchButton>
        <TouchButton
          label="Jump"
          onDown={() => {
            input.setHeld("jumpHeld", true);
            input.press("jumpPressed");
          }}
          onUp={() => input.setHeld("jumpHeld", false)}
        >
          JUMP
        </TouchButton>
      </div>}
    </div>
  );
}
