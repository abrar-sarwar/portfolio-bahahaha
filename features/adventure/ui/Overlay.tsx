"use client";

import { useCallback, useEffect, useState } from "react";
import { useGameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";
import { audio } from "../audio/synth";
import { loadSave, persistSave } from "../state/save";
import { setMuted as setSaveMuted } from "../state/settings";
import Hud from "./Hud";
import CombatPanel from "./CombatPanel";
import ConfirmDialog from "./ConfirmDialog";

export default function Overlay() {
  const scene = useGameStore((s) => s.scene);
  const inCombat = useGameStore((s) => s.combat !== null);
  const confirm = useGameStore((s) => s.confirm);

  // The OverworldScene's archive node emits "nav:external" to leave the game
  // for the gallery route; the Phaser side can't navigate, so the React shell
  // owns the actual window navigation.
  useEffect(() => bus.on("nav:external", ({ href }) => window.location.assign(href)), []);
  // Initialize from the SAVE, not the audio engine: this component renders
  // before BootScene applies the saved settings, so the engine still holds
  // its defaults here — reading it made the label show the opposite of the
  // persisted state after a mute-then-reload.
  const [muted, setMuted] = useState(() => loadSave().settings.muted);

  const toggleSound = useCallback(() => {
    audio.unlock(); // must run inside the gesture before toggling
    const next = !audio.getState().muted;
    audio.setMuted(next);
    setMuted(next);
    persistSave(setSaveMuted(loadSave(), next)); // write-through: survives reload
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 select-none font-mono"
      onPointerDown={() => audio.unlock()}
    >
      {/* Later tasks mount dialogue panels here. */}
      {scene === "Level" && !inCombat && <Hud />}
      {inCombat && <CombatPanel />}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={() => bus.emit("ui:confirm", { confirmed: true })}
          onCancel={() => bus.emit("ui:confirm", { confirmed: false })}
        />
      )}
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
