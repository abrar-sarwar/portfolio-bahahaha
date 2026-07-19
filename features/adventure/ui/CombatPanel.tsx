"use client";

import { useState } from "react";
import { useGameStore } from "../bridge/GameStore";
import type { CombatState, PlayerActionKind } from "../combat/types";
import { playerAttackDamage, isUltimateReady } from "../combat/engine";
import { dispatchCombat, retryCombat } from "../combat/controller";
import { audio } from "../audio/synth";
import Bar from "./Bars";
import TypingBox from "./TypingBox";
import TimedPrompt from "./TimedPrompt";
import BuffTray from "./BuffTray";

const SCRIPTED_STEP_LABELS = [
  "Read the Devil King's pattern — ANALYZE.",
  "Turn the strike aside — PARRY.",
  "Restore the lost chapter — COMMAND.",
  "Seize ROOT ACCESS.",
  "EXECUTE THE FINAL STRIKE.",
];

export default function CombatPanel() {
  const combat = useGameStore((s) => s.combat);
  const [showItems, setShowItems] = useState(false);
  if (!combat) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-3 font-mono sm:p-4">
      {/* boss header */}
      <BossHeader combat={combat} />

      {/* center: log + active interaction */}
      <div className="pointer-events-none mx-auto flex w-full max-w-lg flex-col items-center gap-2">
        <LogPanel log={combat.log} />
        <Interaction combat={combat} showItems={showItems} setShowItems={setShowItems} />
      </div>

      {/* footer: player stats */}
      <PlayerStats combat={combat} />
    </div>
  );
}

// ── boss header ───────────────────────────────────────────────────────────────
function BossHeader({ combat }: { combat: CombatState }) {
  const { def } = combat;
  const breach = def.mechanic === "breach-meter";
  return (
    <div className="pointer-events-none mx-auto w-full max-w-lg">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-200 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
          {def.name}
        </span>
        {breach && (
          <span className="flex items-center gap-1">
            {[0, 1].map((i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full border ${
                  combat.mechanic.breachMeter > i
                    ? "border-red-300 bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    : "border-red-400/40 bg-transparent"
                }`}
              />
            ))}
            <span className="text-[7px] uppercase tracking-widest text-red-200/70">
              {combat.mechanic.breached ? "BREACHED" : "ARMOR"}
            </span>
          </span>
        )}
      </div>
      <Bar label="Corruption" value={combat.bossHealth} max={def.maxHealth} tone="boss" />
    </div>
  );
}

// ── log ──────────────────────────────────────────────────────────────────────
function LogPanel({ log }: { log: string[] }) {
  const lines = log.slice(-6);
  return (
    <div className="pointer-events-none w-full rounded-sm border border-violet-300/20 bg-black/50 px-2 py-1.5 text-[10px] leading-snug text-violet-100/90 shadow-[0_0_20px_rgba(167,139,250,0.15)]">
      {lines.map((line, i) => (
        <div key={i} className={i === lines.length - 1 ? "text-white" : "text-violet-200/60"}>
          {line}
        </div>
      ))}
    </div>
  );
}

// ── interaction area ──────────────────────────────────────────────────────────
function Interaction({
  combat,
  showItems,
  setShowItems,
}: {
  combat: CombatState;
  showItems: boolean;
  setShowItems: (v: boolean) => void;
}) {
  if (combat.tag === "victory") {
    return (
      <div className="pointer-events-auto rounded-sm border border-amber-300/50 bg-black/70 px-6 py-3 text-center shadow-[0_0_24px_rgba(255,215,94,0.4)]">
        <div className="text-[14px] font-bold uppercase tracking-[0.3em] text-amber-200">Victory</div>
        <div className="mt-1 text-[10px] text-amber-100/70">{combat.def.name} is defeated.</div>
      </div>
    );
  }
  if (combat.tag === "defeat") {
    return (
      <div className="pointer-events-auto flex flex-col items-center gap-2 rounded-sm border border-red-400/50 bg-black/70 px-6 py-3 text-center shadow-[0_0_24px_rgba(239,68,68,0.35)]">
        <div className="text-[14px] font-bold uppercase tracking-[0.3em] text-red-300">Defeated</div>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            audio.sfx("select");
            retryCombat();
          }}
          className="min-h-[44px] rounded-sm border border-violet-300/50 bg-violet-500/20 px-6 text-[12px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-violet-500/40"
        >
          Retry
        </button>
      </div>
    );
  }

  // A pending prompt (COMMAND or the scripted restore line) → typing input.
  if (combat.prompt) {
    return (
      <div className="pointer-events-auto w-full max-w-sm">
        <TypingBox
          text={combat.prompt.text}
          display={combat.prompt.display}
          timeLimitMs={combat.prompt.timeLimitMs}
        />
      </div>
    );
  }

  // Awaiting a defense-result → the timed defense mini-game.
  const awaitingDefense =
    combat.tag === "telegraph" || (combat.tag === "scripted" && combat.mechanic.finalStep === 1);
  if (awaitingDefense) {
    return (
      <div className="pointer-events-auto w-full">
        <TimedPrompt />
      </div>
    );
  }

  // Otherwise: the action menu (player-turn or a scripted non-parry step).
  return (
    <div className="pointer-events-auto flex w-full max-w-md flex-col gap-2">
      {combat.tag === "scripted" && <ScriptedBanner step={combat.mechanic.finalStep} />}
      <ActionMenu combat={combat} showItems={showItems} setShowItems={setShowItems} />
      {showItems && (
        <div className="rounded-sm border border-violet-300/30 bg-black/60 p-2">
          <BuffTray items={combat.items} />
        </div>
      )}
    </div>
  );
}

function ScriptedBanner({ step }: { step: number }) {
  return (
    <div className="rounded-sm border border-violet-300/50 bg-violet-500/10 px-3 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-violet-100 shadow-[0_0_20px_rgba(167,139,250,0.3)]">
      {SCRIPTED_STEP_LABELS[step] ?? "…"}
    </div>
  );
}

// ── action menu ───────────────────────────────────────────────────────────────
function ActionMenu({
  combat,
  showItems,
  setShowItems,
}: {
  combat: CombatState;
  showItems: boolean;
  setShowItems: (v: boolean) => void;
}) {
  const scripted = combat.tag === "scripted";
  const step = combat.mechanic.finalStep;
  const ultReady = isUltimateReady(combat);
  const dmg = playerAttackDamage(combat);

  const act = (kind: PlayerActionKind, sfx = true) => {
    if (sfx) audio.sfx("select");
    dispatchCombat({ type: "action", kind });
  };
  const mech = (choice: string) => {
    audio.sfx("select");
    dispatchCombat({ type: "mechanic", choice });
  };

  const isSeq = combat.def.mechanic === "sequence-puzzle";
  const showRootAccess = (scripted && step === 3) || (!scripted && combat.fx.rootAccessCharges > 0);
  const rootChoice = scripted && step === 3 ? "root-access" : "use-root-access";
  const showStrikeAdds = scripted && step === 4 && combat.mechanic.summons > 0;
  const showFinalStrike = scripted && step === 4;

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <MenuButton
        label={ultReady ? `ULTIMATE (${dmg})` : `Attack (${dmg})`}
        highlight={ultReady}
        onPress={() => act("attack")}
      />
      <MenuButton label="Command" onPress={() => act("command")} />
      <MenuButton label="Defend" onPress={() => act("defend")} />
      <MenuButton label="Parry Stance" onPress={() => act("parry-stance")} />
      <MenuButton label="Analyze" onPress={() => act("analyze")} />
      <MenuButton
        label={showItems ? "Close" : `Items (${combat.items.length})`}
        onPress={() => {
          audio.sfx("select");
          setShowItems(!showItems);
        }}
      />

      {isSeq && !scripted && <MenuButton label="Remember" onPress={() => mech("remember")} />}
      {isSeq && !scripted && <MenuButton label="Create" onPress={() => mech("create")} />}
      {showRootAccess && (
        <MenuButton label="Use Root Access" highlight onPress={() => mech(rootChoice)} />
      )}
      {showStrikeAdds && <MenuButton label="Strike Adds" onPress={() => mech("strike-adds")} />}
      {showFinalStrike && (
        <div className="col-span-3">
          <MenuButton
            label="Execute Final Strike"
            highlight
            big
            onPress={() => mech("strike")}
          />
        </div>
      )}
    </div>
  );
}

function MenuButton({
  label,
  onPress,
  highlight = false,
  big = false,
}: {
  label: string;
  onPress: () => void;
  highlight?: boolean;
  big?: boolean;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={`pointer-events-auto min-h-[44px] rounded-sm border px-2 text-[11px] font-bold uppercase tracking-wide transition-colors ${
        big ? "w-full py-2 text-[13px]" : ""
      } ${
        highlight
          ? "border-violet-200/80 bg-violet-500/30 text-white shadow-[0_0_18px_rgba(167,139,250,0.5)]"
          : "border-violet-300/40 bg-black/60 text-violet-100 hover:border-violet-200/70 hover:bg-violet-500/20"
      }`}
    >
      {label}
    </button>
  );
}

// ── player stats ──────────────────────────────────────────────────────────────
function PlayerStats({ combat }: { combat: CombatState }) {
  return (
    <div className="pointer-events-none mx-auto flex w-full max-w-lg flex-col gap-1.5">
      <Bar label="HP" value={combat.player.health} max={combat.player.maxHealth} tone="player" />
      <Bar label="Ultimate" value={combat.ultimate} max={100} tone="ultimate" readout={`${combat.ultimate}%`} />
    </div>
  );
}
