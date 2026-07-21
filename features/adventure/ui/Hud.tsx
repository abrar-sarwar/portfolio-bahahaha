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

export default function Hud() {
  const hud = useGameStore((s) => s.hud);
  // 6-heart unification (Task 32): hearts render from the canonical realtime
  // `hearts` store field, in whole hearts (no halves), in levels AND arenas.
  const heartState = useGameStore((s) => s.hearts);
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

      {/* buff chips (stacked buffs collapse to one chip with an xN count) + fragment icon */}
      {(hud.buffs.length > 0 || hud.fragments > 0) && (
        <div className="flex items-center gap-1">
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
