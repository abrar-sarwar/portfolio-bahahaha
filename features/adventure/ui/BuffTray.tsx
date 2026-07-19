"use client";

import type { BuffId } from "../ids";
import { COMBAT_USABLE } from "../combat/buffs";
import { buffName } from "./hudMath";
import { countBuffs } from "./hudMath";
import { dispatchCombat } from "../combat/controller";
import { audio } from "../audio/synth";

// Item pouch: the consumable buffs the player carried into the fight (root
// access, recovery packets). Grouped with an xN stack count; tapping one
// dispatches an {item} event. Passive buffs already auto-applied on entry and
// are not shown here (filtered to COMBAT_USABLE consumables the pouch holds).
export default function BuffTray({ items }: { items: BuffId[] }) {
  const usable = items.filter((b) => COMBAT_USABLE.includes(b));
  if (usable.length === 0) {
    return <div className="text-[9px] uppercase tracking-[0.25em] text-white/30">No items</div>;
  }
  const groups = countBuffs(usable);
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {groups.map(({ buff, n }) => (
        <button
          key={buff}
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            audio.sfx("select");
            dispatchCombat({ type: "item", buff });
          }}
          className="pointer-events-auto flex min-h-[44px] items-center justify-between gap-1 rounded-sm border border-violet-300/40 bg-black/60 px-2 text-[10px] uppercase tracking-wide text-violet-100 transition-colors hover:border-violet-200/80 hover:bg-violet-500/20"
        >
          <span>{buffName(buff)}</span>
          {n > 1 && <span className="text-violet-300">x{n}</span>}
        </button>
      ))}
    </div>
  );
}
