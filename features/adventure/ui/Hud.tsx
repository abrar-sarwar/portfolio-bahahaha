"use client";

import { useGameStore } from "../bridge/GameStore";
import { heartsFromHealth, buffTag, countBuffs } from "./hudMath";
import Toast from "./Toast";

// 8x8 heart bitmap (1 = filled cell). Rendered as a pixel div grid so the HUD
// stays in the game's blocky pixel-art idiom.
const HEART: number[][] = [
  [0, 1, 1, 0, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const RED = "#ef4444"; // palette R
const DIM = "#5c0f18"; // palette X (empty-heart husk)

function Heart({ fill }: { fill: "full" | "half" | "empty" }) {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "repeat(8, 2px)", gridTemplateRows: "repeat(8, 2px)" }}
      aria-hidden
    >
      {HEART.flatMap((row, y) =>
        row.map((cell, x) => {
          let color = "transparent";
          if (cell) {
            if (fill === "full") color = RED;
            else if (fill === "empty") color = DIM;
            else color = x < 4 ? RED : DIM; // half: left lobe filled
          }
          return <div key={`${y}-${x}`} style={{ width: 2, height: 2, backgroundColor: color }} />;
        }),
      )}
    </div>
  );
}

function DemonSeal({ status, remainingFrac }: { status: "ready" | "active" | "spent"; remainingFrac: number }) {
  const filled = status === "ready" ? 8 : status === "active" ? Math.ceil(remainingFrac * 8) : 0;
  const label = status === "ready" ? "Demon form ready" : status === "active" ? `Demon form ${Math.ceil(remainingFrac * 30)} seconds` : "Demon form spent";
  return (
    <div className="mt-0.5 flex items-center gap-1" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={8} aria-valuenow={filled}>
      <span className={`text-[10px] leading-none ${status === "ready" ? "animate-pulse text-red-300" : "text-red-950"}`} aria-hidden>♜</span>
      <div className={`flex gap-px border px-0.5 py-0.5 ${status === "ready" ? "border-red-400/80 shadow-[0_0_9px_rgba(239,68,68,0.55)]" : "border-red-950"}`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 w-2 skew-x-[-18deg] ${index < filled ? "bg-gradient-to-r from-red-900 to-red-400" : "bg-red-950/50"}`}
            aria-hidden
          />
        ))}
      </div>
      <span className={`text-[6px] font-black uppercase tracking-[0.18em] ${status === "spent" ? "text-red-950" : "text-red-300/80"}`}>
        Q {status}
      </span>
    </div>
  );
}

export default function Hud() {
  const hud = useGameStore((s) => s.hud);
  // 6-heart unification (Task 32): hearts render from the canonical realtime
  // `hearts` store field, in whole hearts (no halves), in levels AND arenas.
  const heartState = useGameStore((s) => s.hearts);
  const ultimate = useGameStore((s) => s.rtAbilities.ultimate);
  const { full, empty } = heartsFromHealth(heartState.current, heartState.max);
  const buffCounts = countBuffs(hud.buffs); // buffs stack -> one chip per id, xN

  const hearts: ("full" | "half" | "empty")[] = [
    ...Array<"full">(full).fill("full"),
    ...Array<"empty">(empty).fill("empty"),
  ];

  return (
    <>
      <Toast />
      <div className="pointer-events-none absolute left-2 top-6 z-20 flex flex-col gap-1.5 font-mono">
      {/* hearts */}
      <div className="flex items-center gap-1">
        {hearts.map((f, i) => (
          <Heart key={i} fill={f} />
        ))}
      </div>
      <DemonSeal status={ultimate.status} remainingFrac={ultimate.remainingFrac} />

      {/* buff chips (stacked buffs collapse to one chip with an xN count) +
          POWER stacks (stomp kills -> boss swing bonus) + fragment icon */}
      {(hud.buffs.length > 0 || hud.fragments > 0 || hud.power > 0) && (
        <div className="flex items-center gap-1">
          {hud.power > 0 && (
            <span className="rounded-sm border border-amber-300/70 bg-amber-400/10 px-1 text-[8px] font-bold uppercase leading-tight tracking-widest text-amber-200">
              ⚡ PWR x{hud.power}
            </span>
          )}
          {buffCounts.map(({ buff, n }) => (
            <span
              key={buff}
              className="rounded-sm border border-violet-400/70 px-1 text-[8px] uppercase leading-tight tracking-widest text-violet-200"
            >
              {buffTag(buff)}
              {n > 1 ? ` x${n}` : ""}
            </span>
          ))}
          {hud.fragments > 0 && (
            <span className="flex items-center gap-0.5 rounded-sm border border-amber-300/70 px-1 text-[8px] uppercase leading-tight tracking-widest text-amber-200">
              <span aria-hidden>◆</span>
              {hud.fragments}
            </span>
          )}
        </div>
      )}
      </div>
    </>
  );
}
