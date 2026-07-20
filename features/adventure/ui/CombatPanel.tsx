"use client";

import { useState, type ReactNode } from "react";
import { useGameStore, gameStore } from "../bridge/GameStore";
import type { CombatEvent, CombatState, PlayerActionKind, Reward } from "../combat/types";
import { playerAttackDamage, isUltimateReady } from "../combat/engine";
import { dispatchCombat, retryCombat, returnToOverworld, SCRIPTED_PARRY_STEP } from "../combat/controller";
import { loadSave } from "../state/save";
import { audio } from "../audio/synth";

// The four verbs of the making-order, in engine order (see engine.ts SEQ_ORDER).
// Drives the sequence-puzzle glyph tracker + the ≥2-fragment ANALYZE clue.
const SEQ_GLYPHS = ["A", "D", "R", "C"] as const;
const SEQ_LABELS = ["ANALYZE", "DEFEND", "REMEMBER", "CREATE"] as const;
import Bar from "./Bars";
import TypingBox from "./TypingBox";
import TimedPrompt from "./TimedPrompt";
import BuffTray from "./BuffTray";
import Dialogue from "../dialogue/Dialogue";

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
  // The ≥2-fragment ANALYZE clue (Task 20): revealed the moment the player
  // presses ANALYZE in the sequence fight while holding ≥2 memory fragments —
  // read from the durable save, NOT the engine (the clue is a UI/save hook).
  const [clueRevealed, setClueRevealed] = useState(false);
  // Wrong-verb reset flag (Task 20): set when a sequence verb drops seqIndex to
  // 0, cleared when a step advances — persists across the intervening boss turn
  // (the engine's own reset log line is masked by the telegraph line by the time
  // the menu returns, so a log scrape can't drive this; local state can).
  const [seqReset, setSeqReset] = useState(false);
  if (!combat) return null;
  const onSeqAnalyze = () => {
    if (loadSave().memoryFragments.length >= 2) setClueRevealed(true);
  };
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-3 font-mono sm:p-4">
      {/* boss header */}
      <BossHeader combat={combat} />

      {/* center: log + active interaction */}
      <div className="pointer-events-none mx-auto flex w-full max-w-lg flex-col items-center gap-2">
        <LogPanel log={combat.log} />
        <Interaction
          combat={combat}
          showItems={showItems}
          setShowItems={setShowItems}
          clueRevealed={clueRevealed}
          onSeqAnalyze={onSeqAnalyze}
          seqReset={seqReset}
          onSeqStep={setSeqReset}
        />
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
  const sequence = def.mechanic === "sequence-puzzle";
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
        {sequence && <SequenceTracker seqIndex={combat.mechanic.seqIndex} breached={combat.mechanic.breached} />}
      </div>
      <Bar label="Corruption" value={combat.bossHealth} max={def.maxHealth} tone="boss" />
    </div>
  );
}

// The 4-slot glyph tracker for a sequence-puzzle boss (Task 20 Blank Page): one
// pip per verb of the making-order, filled as combat.mechanic.seqIndex advances
// and reset with it on a wrong verb. All four lit + breached reads UNDERSTOOD.
function SequenceTracker({ seqIndex, breached }: { seqIndex: number; breached: boolean }) {
  return (
    <span className="flex items-center gap-1">
      {SEQ_GLYPHS.map((glyph, i) => (
        <span
          key={glyph}
          title={SEQ_LABELS[i]}
          className={`flex h-4 w-4 items-center justify-center rounded-sm border text-[8px] font-bold ${
            seqIndex > i
              ? "border-amber-200 bg-amber-400/30 text-amber-100 shadow-[0_0_8px_rgba(255,215,94,0.7)]"
              : "border-violet-300/40 bg-transparent text-violet-200/50"
          }`}
        >
          {glyph}
        </span>
      ))}
      <span className="text-[7px] uppercase tracking-widest text-violet-200/70">
        {breached ? "UNDERSTOOD" : "ARMORED"}
      </span>
    </span>
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
  clueRevealed,
  onSeqAnalyze,
  seqReset,
  onSeqStep,
}: {
  combat: CombatState;
  showItems: boolean;
  setShowItems: (v: boolean) => void;
  clueRevealed: boolean;
  onSeqAnalyze: () => void;
  seqReset: boolean;
  onSeqStep: (wasReset: boolean) => void;
}) {
  // Boss intro (before the first turn) and boss defeat (inside the victory
  // flow) both play through the same Dialogue overlay — the controller opens
  // `boss-intro-<bossId>` / `boss-defeat-<bossId>` (see combat/controller.ts's
  // beginCombat / handleOutcome). This is the single gate that swaps Dialogue
  // in ahead of everything else below: the action menu, the victory panel's
  // reward chips, and the defeat/retry panel all wait behind it.
  const dialogue = useGameStore((s) => s.dialogue);
  if (dialogue) return <Dialogue />;

  if (combat.tag === "victory") {
    return <VictoryPanel combat={combat} />;
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

  // Awaiting a defense-result → the timed defense mini-game. The scripted
  // banner renders here too (not just in the action-menu branch below) so
  // the finalStep-1 parry prompt still shows what step of the finale it is.
  const awaitingDefense =
    combat.tag === "telegraph" ||
    (combat.tag === "scripted" && combat.mechanic.finalStep === SCRIPTED_PARRY_STEP);
  if (awaitingDefense) {
    return (
      <div className="pointer-events-auto flex w-full max-w-md flex-col items-center gap-2">
        {combat.tag === "scripted" && <ScriptedBanner step={combat.mechanic.finalStep} />}
        {/* Tutorial mechanic (Task 14): the FIRST boss telegraph — bossTurns
            ticks to 1 the instant it's armed — gets an enlarged callout so a
            first-time player knows exactly what the parry ring is asking. */}
        {combat.def.mechanic === "tutorial" && combat.mechanic.bossTurns === 1 && <TutorialParryCallout />}
        <TimedPrompt />
      </div>
    );
  }

  // Otherwise: the action menu (player-turn or a scripted non-parry step).
  const isSeq = combat.def.mechanic === "sequence-puzzle";
  return (
    <div className="pointer-events-auto flex w-full max-w-md flex-col gap-2">
      {combat.tag === "scripted" && <ScriptedBanner step={combat.mechanic.finalStep} />}
      {/* Tutorial mechanic (Task 14): hint chips on the player's first turn
          only — additive UI, no engine/controller changes. */}
      {combat.def.mechanic === "tutorial" && combat.turn === 0 && <TutorialHints />}
      {isSeq && seqReset && <SeqBanner tone="reset">The page swallows your effort. Start from seeing.</SeqBanner>}
      {isSeq && clueRevealed && (
        <SeqBanner tone="clue">The fragments whisper the order: {combat.def.weaknesses[2]}</SeqBanner>
      )}
      <ActionMenu
        combat={combat}
        showItems={showItems}
        setShowItems={setShowItems}
        onSeqAnalyze={onSeqAnalyze}
        onSeqStep={onSeqStep}
      />
      {showItems && (
        <div className="rounded-sm border border-violet-300/30 bg-black/60 p-2">
          <BuffTray items={combat.items} />
        </div>
      )}
    </div>
  );
}

function SeqBanner({ tone, children }: { tone: "reset" | "clue"; children: ReactNode }) {
  const cls =
    tone === "reset"
      ? "border-red-400/50 bg-red-500/10 text-red-200 shadow-[0_0_16px_rgba(239,68,68,0.25)]"
      : "border-amber-300/50 bg-amber-500/10 text-amber-100 shadow-[0_0_16px_rgba(255,215,94,0.3)]";
  return (
    <div className={`rounded-sm border px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] ${cls}`}>
      {children}
    </div>
  );
}

// ── tutorial mechanic (Task 14, Glitch Toad) ────────────────────────────────
function TutorialHints() {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {["COMMAND starts a typing attack.", "PARRY STANCE widens your parry window."].map((hint) => (
        <span
          key={hint}
          className="rounded-sm border border-teal-300/40 bg-teal-500/10 px-2 py-1 text-[9px] uppercase tracking-wide text-teal-100"
        >
          {hint}
        </span>
      ))}
    </div>
  );
}

function TutorialParryCallout() {
  return (
    <div className="rounded-sm border border-teal-300/60 bg-teal-500/15 px-4 py-2 text-center text-[13px] font-bold uppercase tracking-[0.15em] text-teal-100 shadow-[0_0_20px_rgba(63,189,176,0.35)]">
      Press Space on the Flash
    </div>
  );
}

// ── victory ──────────────────────────────────────────────────────────────────
// def.defeatLines play through the Dialogue overlay (Interaction()'s gate
// above), opened by the controller BEFORE combatResult flips to "victory" is
// even visible here — so by the time this panel renders, the lines have
// already been shown or skipped. No static text list needed.
function VictoryPanel({ combat }: { combat: CombatState }) {
  const { def } = combat;
  return (
    <div className="pointer-events-auto flex flex-col items-center gap-2 rounded-sm border border-amber-300/50 bg-black/70 px-6 py-3 text-center shadow-[0_0_24px_rgba(255,215,94,0.4)]">
      <div className="text-[14px] font-bold uppercase tracking-[0.3em] text-amber-200">Victory</div>
      {def.rewards.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {def.rewards.map((r, i) => (
            <span
              key={i}
              className="rounded-sm border border-amber-300/50 bg-amber-500/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-amber-200"
            >
              {rewardLabel(r)}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          audio.sfx("select");
          returnToOverworld();
        }}
        className="min-h-[44px] rounded-sm border border-amber-300/50 bg-amber-500/20 px-6 text-[12px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-amber-500/40"
      >
        Return to the Map
      </button>
    </div>
  );
}

function rewardLabel(r: Reward): string {
  switch (r.kind) {
    case "ability":
      return `Ability: ${r.id}`;
    case "key-fragment":
      return `${r.id} key fragment`;
    case "castle-key":
      // The three fragments fuse here (Task 20 Blank Page) — the victory chip.
      return "CASTLE KEY FORGED";
  }
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
  onSeqAnalyze,
  onSeqStep,
}: {
  combat: CombatState;
  showItems: boolean;
  setShowItems: (v: boolean) => void;
  onSeqAnalyze: () => void;
  onSeqStep: (wasReset: boolean) => void;
}) {
  const scripted = combat.tag === "scripted";
  const step = combat.mechanic.finalStep;
  const ultReady = isUltimateReady(combat);
  const dmg = playerAttackDamage(combat);
  const isSeq = combat.def.mechanic === "sequence-puzzle";

  const act = (kind: PlayerActionKind, sfx = true) => {
    if (sfx) audio.sfx("select");
    dispatchCombat({ type: "action", kind });
  };
  const mech = (choice: string) => {
    audio.sfx("select");
    dispatchCombat({ type: "mechanic", choice });
  };
  // A sequence verb: dispatch it, then report to the panel whether it RESET the
  // order (seqIndex fell to 0) so the wrong-verb banner can persist across the
  // boss turn. ANALYZE also fires the ≥2-fragment clue seam.
  const seqVerb = (verb: "analyze" | "defend" | "remember" | "create") => {
    audio.sfx("select");
    if (verb === "analyze") onSeqAnalyze();
    const ev: CombatEvent =
      verb === "analyze" || verb === "defend"
        ? { type: "action", kind: verb }
        : { type: "mechanic", choice: verb };
    dispatchCombat(ev);
    onSeqStep((gameStore.get().combat?.mechanic.seqIndex ?? 0) === 0);
  };

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
      <MenuButton label="Defend" onPress={() => (isSeq && !scripted ? seqVerb("defend") : act("defend"))} />
      <MenuButton label="Parry Stance" onPress={() => act("parry-stance")} />
      <MenuButton label="Analyze" onPress={() => (isSeq && !scripted ? seqVerb("analyze") : act("analyze"))} />
      <MenuButton
        label={showItems ? "Close" : `Items (${combat.items.length})`}
        onPress={() => {
          audio.sfx("select");
          setShowItems(!showItems);
        }}
      />

      {isSeq && !scripted && <MenuButton label="Remember" onPress={() => seqVerb("remember")} />}
      {isSeq && !scripted && <MenuButton label="Create" onPress={() => seqVerb("create")} />}
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
