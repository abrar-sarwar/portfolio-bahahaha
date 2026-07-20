"use client";

import { useEffect } from "react";

// A tiny, presentational confirm overlay (Task 16). Not the Task 17 dialogue
// system (that's script-driven typewriter lines for level/boss story beats;
// this is a one-off yes/no prompt) — this is the minimal panel the Title's
// NEW GAME wipe needs. It owns no state beyond its keyboard listener: the
// Overlay wires `message` from gameStore.confirm and turns the two buttons
// (or Enter/Escape — Task 17 review fold-in fix) into `ui:confirm` bus
// results.
export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Enter = confirm, Escape = cancel. Mounted only while gameStore.confirm is
  // set (Overlay's gate), so the listener's lifetime already matches the
  // dialog's — still cleaned up on unmount to avoid leaking a handler that
  // would otherwise fire Enter/Escape after the dialog closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onConfirm, onCancel]);

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/70 font-mono">
      <div className="flex flex-col items-center gap-4 rounded-sm border border-violet-300/50 bg-black/80 px-8 py-6 text-center shadow-[0_0_28px_rgba(167,139,250,0.35)]">
        <div className="max-w-xs text-[13px] font-bold uppercase tracking-[0.15em] text-violet-100">
          {message}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="min-h-[44px] rounded-sm border border-red-400/60 bg-red-500/20 px-5 text-[12px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-red-500/40"
          >
            Erase
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onCancel();
            }}
            className="min-h-[44px] rounded-sm border border-violet-300/50 bg-violet-500/20 px-5 text-[12px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-violet-500/40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
