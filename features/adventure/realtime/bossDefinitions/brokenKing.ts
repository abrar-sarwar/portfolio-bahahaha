// features/adventure/realtime/bossDefinitions/brokenKing.ts
//
// THE BROKEN KING — World 1-1 (amendment Task 35; boss-demands/broken-king.md).
// A towering, exhausted old king fighting with his one remaining arm. Attrition
// is possible but ~10× slower than the intended solution: the TRUTH mechanic.
// During any vulnerable window (missed heavy recovery, parried sweep, charge
// wall-hit stagger) the player stands close and HOLDS E to reveal one Truth:
//   1 cracks the crown · 2 removes the rage · 3 drops the sword → kneel → end.
// No dialogue, no written truth statements — visual beats only.
import type { MachineEvent, RtBossDef } from "../types";
import type { BossMechanics, MechanicsApi } from "../BossController";
import { animKey } from "../../art/textures";
import {
  BROKEN_KING_SHOCKWAVE,
  BROKEN_KING_BLADE_ARC,
} from "../../art/sprites/bosses2";
import type Phaser from "phaser";

const CHARGE_SPEED = 340; // px/s — activeMs must outlast the longest traversal

export const BROKEN_KING: RtBossDef = {
  id: "broken-king",
  name: "The Broken King",
  maxHp: 24,
  contactDamage: 1,
  // Attrition path: attacks land at ×0.25 (~48 slashes), stomps do nothing —
  // Truth is dramatically faster and clearly the intended solution.
  damageScale: { attack: 0.25, stomp: 0 },
  body: { w: 34, h: 64 },
  phases: [
    { id: "sovereign", attackIds: ["overhead", "sweep", "charge", "blade-waves"] },
    // Royal rage ≤ 50% hp: crown glows, tempo ×0.75. Truth 2 force-phases back
    // to phase 0 with lock — the rage never returns once the truth is out.
    {
      id: "royal-rage",
      enterBelowHpFrac: 0.5,
      attackIds: ["overhead", "sweep", "charge", "blade-waves"],
      tempoScale: 0.75,
    },
  ],
  attacks: [
    // Giant overhead strike: slow raise, floor slam, shockwaves both ways.
    // The long recovery IS the primary Truth window.
    {
      id: "overhead",
      telegraphMs: 900,
      activeMs: 200,
      recoveryMs: 1500,
      cooldownMs: 3800,
      damage: 2,
      weight: 2,
      maxRangePx: 150,
    },
    // Horizontal sweep: the parryable teaching attack — parry → stagger →
    // Truth window.
    {
      id: "sweep",
      telegraphMs: 650,
      activeMs: 320,
      recoveryMs: 950,
      cooldownMs: 2800,
      parryable: true,
      damage: 1,
      weight: 3,
      maxRangePx: 230,
    },
    // Sword charge: crosses the arena; hitting the wall staggers him. The
    // active window spans the whole traversal (mechanics drives the sprite,
    // wall contact emits wall-hit while the machine is still in `attack`).
    {
      id: "charge",
      telegraphMs: 700,
      activeMs: 2600,
      recoveryMs: 1500,
      cooldownMs: 5200,
      damage: 1,
      weight: 2,
      minRangePx: 150,
    },
    // Falling blade waves: four descending arcs, one safe gap.
    {
      id: "blade-waves",
      telegraphMs: 800,
      activeMs: 400,
      recoveryMs: 1100,
      cooldownMs: 4600,
      damage: 1,
      weight: 2,
      minRangePx: 60,
    },
  ],
  arenaKey: "temple-throne",
  track: "broken-king",
  spawn: { tx: 30, ty: 12 },
  animFor: (anim, ctx) => {
    const perAttack: Record<string, Record<string, string>> = {
      telegraph: {
        overhead: "overhead-prep",
        sweep: "sweep-prep",
        charge: "charge-crouch",
        "blade-waves": "blade-wave",
      },
      attack: {
        overhead: "overhead-slam",
        sweep: "sweep",
        charge: "charge",
        "blade-waves": "blade-wave",
      },
    };
    if ((anim === "telegraph" || anim === "attack") && ctx.attackId) {
      return perAttack[anim][ctx.attackId] ?? null;
    }
    if (anim === "recovery") return "stagger"; // winded — the punish window reads
    if (anim === "transition") return ctx.phaseIndex >= 1 ? "rage-transition" : null;
    if (anim === "defeat") return "kneel";
    return null; // idle/move/stagger/damage: generic chain resolves them
  },
};

const TRUTH_RANGE_PX = 52;
const TRUTH_HOLD_MS = 900;
const TRUTH_TOTAL = 3;

export function createBrokenKingMechanics(scene: Phaser.Scene, api: MechanicsApi): BossMechanics {
  let truths = 0;
  let sealsLeft = TRUTH_TOTAL; // arena entry silently tops the count to 3
  let holdConsumed = false; // one truth per continuous E-hold
  let pendingTruthAnim: string | null = null;
  const pending: MachineEvent[] = [];

  // Rage aura: a crimson glow behind the King while royal-rage is active.
  const aura = scene.add
    .ellipse(api.boss.x, api.boss.y, 64, 84, 0xef4444, 0.16)
    .setDepth(11)
    .setVisible(false);

  api.setSeals({ lit: sealsLeft, of: TRUTH_TOTAL });

  const playBoss = (anim: string) => api.boss.play(animKey(api.def.id, anim), true);

  return {
    onCommand(cmd) {
      if (cmd.kind === "attack-start") {
        // Face the player for the whole attack.
        api.boss.setFlipX(api.player.x < api.boss.x);
        return;
      }
      if (cmd.kind === "phase") {
        aura.setVisible(cmd.phaseIndex >= 1);
        return;
      }
      if (cmd.kind === "stagger" && pendingTruthAnim) {
        // A truth just landed: hold its pose through the scripted stagger.
        playBoss(pendingTruthAnim);
        pendingTruthAnim = null;
        return;
      }
      if (cmd.kind === "anim" && cmd.anim === "idle" && truths > 0) {
        // The broken poses ARE his weakened idle — the crown stays cracked.
        playBoss(`truth-${Math.min(truths, 3)}`);
        return;
      }
      if (cmd.kind !== "attack-active") return;

      const bossX = api.boss.x;
      const dir: 1 | -1 = api.player.x < bossX ? -1 : 1;
      if (cmd.attackId === "overhead") {
        api.shapeAttack({ w: 96, h: 90, ox: dir * 20 });
        api.hazards.spawnShockwave({
          x: bossX + dir * 26,
          dir: 0,
          speed: 240,
          damage: 1,
          sprite: { key: BROKEN_KING_SHOCKWAVE.key, anim: "roll" },
        });
      } else if (cmd.attackId === "sweep") {
        // The blade drags across most of the arena on the player's side.
        api.shapeAttack({ w: 250, h: 46, ox: dir * 110, oy: 8 });
      } else if (cmd.attackId === "charge") {
        api.shapeAttack({ w: 54, h: 62 });
        // Drive the sprite across the arena; reaching the wall = wall-hit →
        // the machine staggers (it is still inside the 2600ms active window).
        const targetX = dir === 1 ? 60 * 16 - 44 : 44;
        const dist = Math.abs(targetX - bossX);
        scene.tweens.add({
          targets: api.boss,
          x: targetX,
          duration: (dist / CHARGE_SPEED) * 1000,
          ease: "Sine.easeIn",
          onComplete: () => {
            if (api.machine().fsm === "attack" && api.machine().currentAttackId === "charge") {
              pending.push({ kind: "wall-hit" });
            }
          },
        });
      } else if (cmd.attackId === "blade-waves") {
        // Four descending arcs bracketing the player, one safe gap.
        const px = api.player.x;
        const offsets = [-96, -32, 32, 96]; // gap: stand at ±64
        for (const off of offsets) {
          api.projectiles.spawn({
            spec: { kind: "linear", x: px + off, y: 30, vx: 0, vy: 190, ttlMs: 3200 },
            texture: { key: BROKEN_KING_BLADE_ARC.key, anim: "fall" },
            damage: 1,
          });
        }
      }
    },

    update() {
      aura.setPosition(api.boss.x, api.boss.y - 6);

      const m = api.machine();
      if (m.fsm === "defeated") {
        api.setContextAction(null);
        return;
      }
      const dist = Math.abs(api.player.x - api.boss.x);
      const windowOpen = m.vulnerableMs > 0 && sealsLeft > 0 && dist <= TRUTH_RANGE_PX;
      if (!windowOpen) {
        api.setContextAction(null);
        holdConsumed = false;
        return;
      }
      const held = api.interactHeldMs();
      if (held === 0) holdConsumed = false;
      api.setContextAction({
        key: "E",
        label: "REVEAL TRUTH",
        progress: holdConsumed ? 1 : Math.min(1, held / TRUTH_HOLD_MS),
      });
      if (!holdConsumed && held >= TRUTH_HOLD_MS) {
        holdConsumed = true;
        truths += 1;
        sealsLeft -= 1;
        api.setSeals({ lit: sealsLeft, of: TRUTH_TOTAL });
        api.sfx("seal");
        pendingTruthAnim = `truth-${truths}`;
        // Hold the revelation beat; the machine parks in a scripted stagger.
        pending.push({ kind: "force-stagger", ms: 1500 });
        if (truths === 2) {
          // The rage leaves him — and can never return.
          pending.push({ kind: "force-phase", phaseIndex: 0, lock: true });
          aura.setVisible(false);
        }
        if (truths >= TRUTH_TOTAL) {
          // Sword drop → kneel → the fight ends (no dialogue).
          playBoss("sword-drop");
          scene.time.delayedCall(700, () => api.forceDefeat());
          api.setContextAction(null);
        }
      }
    },

    events() {
      const out = [...pending];
      pending.length = 0;
      return out;
    },

    destroy() {
      aura.destroy();
      api.setContextAction(null);
      api.setSeals(null);
    },
  };
}
