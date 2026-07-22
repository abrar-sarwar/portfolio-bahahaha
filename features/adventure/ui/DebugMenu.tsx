"use client";

import { useEffect, useState } from "react";
import type { LevelId } from "../ids";
import type { RtBossId } from "../realtime/types";
import { defaultSave, grantCompletionThrough, loadSave, persistSave } from "../state/save";
import { gameStore } from "../bridge/GameStore";
import { isDebugEnabled } from "../state/debugQuery";

const LEVELS: LevelId[] = ["1-1", "1-2", "1-3", "1-4", "castle"];
const BOSSES: RtBossId[] = ["training-dummy", "broken-king", "hollow-giant", "one-eyed-dealer", "scythebound", "veiled-archer", "devil-king"];

export default function DebugMenu() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<LevelId>("1-1");
  const [boss, setBoss] = useState<RtBossId>("training-dummy");
  const [through, setThrough] = useState<LevelId>("1-1");
  const [status, setStatus] = useState("");

  useEffect(() => setEnabled(isDebugEnabled(new URLSearchParams(window.location.search))), []);
  if (!enabled) return null;

  const go = (kind: "level" | "arena", value: string) => {
    window.location.assign(`/adventure?debug=1&${kind}=${encodeURIComponent(value)}`);
  };

  const grant = () => {
    const save = grantCompletionThrough(loadSave(), through);
    persistSave(save);
    gameStore.set({ completed: save.completed, unlocked: save.unlocked });
    setStatus(`GRANTED THROUGH ${through.toUpperCase()}`);
  };

  const wipe = () => {
    const save = defaultSave();
    persistSave(save);
    gameStore.set({ completed: save.completed, unlocked: save.unlocked, abilities: save.abilities, keyFragments: [], castleKey: false, deaths: {} });
    setStatus("SAVE WIPED");
  };

  return (
    <div className="pointer-events-auto absolute left-2 top-7 z-[65] font-mono">
      <button type="button" onClick={() => setOpen((value) => !value)} className="border border-fuchsia-300/30 bg-black/75 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.22em] text-fuchsia-200/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-200">
        Debug
      </button>
      {open && (
        <section className="mt-2 w-72 border border-fuchsia-300/25 bg-[#09080d]/95 p-3 shadow-2xl">
          <div className="mb-3 text-[8px] uppercase tracking-[0.3em] text-fuchsia-200/45">Shipped test surface</div>
          <DebugRow label="World">
            <select value={level} onChange={(event) => setLevel(event.target.value as LevelId)} className="min-w-0 flex-1 bg-black/60 p-2 text-[9px] text-white/65 outline-none">
              {LEVELS.map((id) => <option key={id}>{id}</option>)}
            </select>
            <button onClick={() => go("level", level)} className="border border-white/15 px-3 text-[8px] text-white/60">GO</button>
          </DebugRow>
          <DebugRow label="Arena">
            <select value={boss} onChange={(event) => setBoss(event.target.value as RtBossId)} className="min-w-0 flex-1 bg-black/60 p-2 text-[9px] text-white/65 outline-none">
              {BOSSES.map((id) => <option key={id}>{id}</option>)}
            </select>
            <button onClick={() => go("arena", boss)} className="border border-white/15 px-3 text-[8px] text-white/60">GO</button>
          </DebugRow>
          <DebugRow label="Grant">
            <select value={through} onChange={(event) => setThrough(event.target.value as LevelId)} className="min-w-0 flex-1 bg-black/60 p-2 text-[9px] text-white/65 outline-none">
              {LEVELS.map((id) => <option key={id}>{id}</option>)}
            </select>
            <button onClick={grant} className="border border-white/15 px-3 text-[8px] text-white/60">APPLY</button>
          </DebugRow>
          <button type="button" onClick={wipe} className="mt-3 w-full border border-red-300/20 py-2 text-[8px] uppercase tracking-[0.2em] text-red-200/55">Wipe save</button>
          <div className="mt-2 min-h-3 text-[7px] uppercase tracking-[0.2em] text-fuchsia-200/50">{status}</div>
        </section>
      )}
    </div>
  );
}

function DebugRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-2 block">
      <span className="mb-1 block text-[7px] uppercase tracking-[0.22em] text-white/30">{label}</span>
      <span className="flex gap-1">{children}</span>
    </label>
  );
}
