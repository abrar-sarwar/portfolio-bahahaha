"use client";

import { useCallback, useState } from "react";
import { useGameStore } from "../bridge/GameStore";
import { audio } from "../audio/synth";
import Hud from "./Hud";

export default function Overlay() {
  const scene = useGameStore((s) => s.scene);
  const [muted, setMuted] = useState(() => audio.getState().muted);

  const toggleSound = useCallback(() => {
    audio.unlock(); // must run inside the gesture before toggling
    audio.setMuted(!audio.getState().muted);
    setMuted(audio.getState().muted);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 select-none font-mono"
      onPointerDown={() => audio.unlock()}
    >
      {/* Later tasks mount dialogue / combat panels here. */}
      {scene === "Level" && <Hud />}
      <div className="absolute left-2 top-2 text-[10px] uppercase tracking-[0.3em] text-white/30">
        {scene}
      </div>
      <button
        type="button"
        onClick={toggleSound}
        className="pointer-events-auto absolute right-2 top-2 text-[10px] uppercase tracking-[0.3em] text-white/50 transition-colors hover:text-white/80"
      >
        {muted ? "SND OFF" : "SND ON"}
      </button>
    </div>
  );
}
