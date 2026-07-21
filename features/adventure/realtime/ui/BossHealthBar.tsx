"use client";

import { useGameStore } from "../../bridge/GameStore";

// Top boss health bar (amendment §3): ALL-CAPS boss name, an hp bar, and one pip
// per phase (lit up to the current phase). Mounted by Overlay only while a
// realtime boss is active (gameStore.rtBoss non-null). Pure Tailwind, matching
// the overlay's monospace pixel idiom.
export default function BossHealthBar() {
  const boss = useGameStore((s) => s.rtBoss);
  if (!boss) return null;

  const frac = boss.maxHp > 0 ? Math.max(0, Math.min(1, boss.hp / boss.maxHp)) : 0;

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-20 flex -translate-x-1/2 flex-col items-center gap-1 font-mono">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-200 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
          {boss.name}
        </span>
        {boss.phases > 1 && (
          <span className="flex items-center gap-1">
            {Array.from({ length: boss.phases }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full border ${
                  i <= boss.phase
                    ? "border-red-300 bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    : "border-red-400/40 bg-transparent"
                }`}
              />
            ))}
          </span>
        )}
      </div>
      <div className="h-2 w-64 overflow-hidden rounded-sm border border-red-400/50 bg-black/60 shadow-[0_0_16px_rgba(239,68,68,0.25)]">
        <div
          className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-[width] duration-150"
          style={{ width: `${frac * 100}%` }}
        />
      </div>
    </div>
  );
}
