"use client";

import { useGameStore } from "../bridge/GameStore";

export default function Overlay() {
  const scene = useGameStore((s) => s.scene);
  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none font-mono">
      {/* Later tasks mount HUD / dialogue / combat panels here. */}
      <div className="absolute left-2 top-2 text-[10px] uppercase tracking-[0.3em] text-white/30">
        {scene}
      </div>
    </div>
  );
}
