"use client";

import { useEffect, useState } from "react";
import { bus } from "../bridge/EventBus";
import { useGameStore } from "../bridge/GameStore";
import { audio } from "../audio/synth";
import { loadSave, persistSave } from "../state/save";
import { rebaseSettings, setAccessibility, setMuted, setVolume } from "../state/settings";

export default function PauseMenu() {
  const paused = useGameStore((state) => state.paused);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [save, setSave] = useState(() => loadSave());

  useEffect(() => {
    if (paused) setSave(loadSave());
    else setSettingsOpen(false);
  }, [paused]);

  useEffect(() => {
    if (!paused) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Escape" && event.code !== "KeyP") return;
      event.preventDefault();
      bus.emit("ui:pause-action", { action: "resume" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused]);

  if (!paused) return null;

  const commit = (next: typeof save) => {
    const rebased = rebaseSettings(loadSave(), next.settings);
    setSave(rebased);
    persistSave(rebased);
    bus.emit("settings:changed", { accessibility: rebased.settings.accessibility });
  };

  const toggleAccessibility = (key: "widerParry" | "slowerHazards" | "reduceFlash" | "noShake") => {
    commit(setAccessibility(save, { [key]: !save.settings.accessibility[key] }));
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-[70] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
      <section className="w-full max-w-md border border-violet-200/25 bg-[#09080d]/95 p-6 font-mono shadow-[0_0_70px_rgba(91,63,184,0.2)]">
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.34em] text-violet-100">{settingsOpen ? "Settings" : "Paused"}</h2>
          <span className="text-[8px] uppercase tracking-[0.3em] text-white/25">Esc / P</span>
        </div>

        {settingsOpen ? (
          <div className="space-y-5">
            <label className="block text-[10px] uppercase tracking-[0.24em] text-white/55">
              <span className="mb-2 flex justify-between"><span>Volume</span><span>{Math.round(save.settings.volume * 100)}%</span></span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={save.settings.volume}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  audio.setVolume(value);
                  commit(setVolume(save, value));
                }}
                className="w-full accent-violet-300"
              />
            </label>

            <Toggle label="Mute audio" checked={save.settings.muted} onChange={() => {
              const next = !save.settings.muted;
              audio.setMuted(next);
              commit(setMuted(save, next));
            }} />

            <div className="border-t border-white/10 pt-4">
              <div className="mb-3 text-[9px] uppercase tracking-[0.3em] text-violet-200/45">Accessibility</div>
              <div className="space-y-3">
                <Toggle label="Wider parry window" checked={save.settings.accessibility.widerParry} onChange={() => toggleAccessibility("widerParry")} />
                <Toggle label="Slower hazards" checked={save.settings.accessibility.slowerHazards} onChange={() => toggleAccessibility("slowerHazards")} />
                <Toggle label="Reduced flashing" checked={save.settings.accessibility.reduceFlash} onChange={() => toggleAccessibility("reduceFlash")} />
                <Toggle label="No screen shake" checked={save.settings.accessibility.noShake} onChange={() => toggleAccessibility("noShake")} />
              </div>
            </div>

            <MenuButton onClick={() => setSettingsOpen(false)}>Back</MenuButton>
          </div>
        ) : (
          <div className="space-y-3">
            <MenuButton primary onClick={() => bus.emit("ui:pause-action", { action: "resume" })}>Resume</MenuButton>
            <MenuButton onClick={() => bus.emit("ui:pause-action", { action: "restart" })}>Restart from checkpoint</MenuButton>
            <MenuButton onClick={() => setSettingsOpen(true)}>Settings</MenuButton>
            <MenuButton danger onClick={() => bus.emit("ui:pause-action", { action: "quit" })}>Quit to map</MenuButton>
          </div>
        )}
      </section>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 text-[10px] uppercase tracking-[0.16em] text-white/65">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 shrink-0 accent-violet-300" />
    </label>
  );
}

function MenuButton({ children, onClick, primary = false, danger = false }: { children: React.ReactNode; onClick: () => void; primary?: boolean; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`w-full border px-4 py-3 text-[10px] font-bold uppercase tracking-[0.25em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 ${primary ? "border-violet-200/45 bg-violet-300/10 text-violet-100" : danger ? "border-red-300/20 text-red-200/60 hover:bg-red-400/10" : "border-white/15 text-white/60 hover:bg-white/5 hover:text-white/85"}`}>
      {children}
    </button>
  );
}
