"use client";

// A tiny, presentational confirm overlay (Task 16). No dialogue system yet
// (Task 17) — this is the minimal panel the Title's NEW GAME wipe needs. It
// owns no state: the Overlay wires `message` from gameStore.confirm and turns
// the two buttons into `ui:confirm` bus results. Additive, self-contained.

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
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
