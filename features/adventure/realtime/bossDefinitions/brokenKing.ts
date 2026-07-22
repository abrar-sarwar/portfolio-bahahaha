// features/adventure/realtime/bossDefinitions/brokenKing.ts
//
// THE BROKEN KING — World 1-1 (amendment Task 35; boss-demands/broken-king.md).
// A towering, exhausted old king fighting with his one remaining arm. Attrition
// is possible but much slower than the intended solution: the TRUTH mechanic.
// The big openings DOWN him: a parried sweep, a charge into the wall, or the
// overhead slam's long recovery drop him to one knee for DOWNED_MS — he is
// highlighted (gold ring + floor glow), a bouncing E keycap with a draining
// timer hangs over him, and the player must RUN IN CLOSE and MASH E
// (MASH_TARGET taps) before he gets back up. Each completed mash tears out one
// Truth:
//   1 cracks the crown · 2 removes the rage · 3 drops the sword → kneel → end.
// Between downs, swings still chip him (POWER stacks from stomped level
// enemies raise that chip). No dialogue, no written truth statements — visual
// beats only.
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
  // Wide enough that brushing the SPRITE means touching the BODY: at 34px a
  // player could visibly lean into the cape/sword with no overlap and no
  // contact damage ("when i get close to him he doesn't hurt me").
  body: { w: 44, h: 64 },
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
  // Spawn on the flat main floor (ty 13): his y never changes while charge
  // tweens drag him across the arena, so any raised-ground baseline had him
  // hovering over the floor everywhere else ("the king is floating").
  spawn: { tx: 28, ty: 13 },
  // The art keeps one transparent row under the boots; without this he sinks
  // |spriteH − bodyH| − 1 = 3px into the floor (see BossArenaScene grounding).
  spriteFeetY: 71,
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

const TRUTH_RANGE_PX = 56;
const TRUTH_TOTAL = 3;
// The downed window: he drops to one knee for this long — run in and MASH E
// (MASH_TARGET taps, in range) to tear a truth out before he gets back up.
const DOWNED_MS = 5000;
const MASH_TARGET = 6;
const REVEAL_STAGGER_MS = 1500;

export function createBrokenKingMechanics(scene: Phaser.Scene, api: MechanicsApi): BossMechanics {
  let truths = 0;
  let sealsLeft = TRUTH_TOTAL; // arena entry silently tops the count to 3
  let pendingTruthAnim: string | null = null;
  const pending: MachineEvent[] = [];

  // Downed-window state: `downed` while he is on one knee waiting to be
  // mashed; `mash` counts the in-range E-taps; `suppressVuln` swallows the
  // vulnerable commands our OWN force-staggers echo back (they must not
  // re-trigger a fresh window).
  let downed = false;
  let mash = 0;
  let suppressVuln = 0;

  // Rage aura: a crimson glow behind the King while royal-rage is active.
  const aura = scene.add
    .ellipse(api.boss.x, api.boss.y, 64, 84, 0xef4444, 0.16)
    .setDepth(11)
    .setVisible(false);

  // Downed-window presentation: gold floor glow + a pulsing ring highlight on
  // the King, an "E / MASH!" keycap bobbing over his head, and a draining
  // timer bar. Created once, hidden; positioned every update while downed.
  const glow = scene.add.ellipse(0, 0, 78, 18, 0xffd75e, 0.22).setDepth(11).setVisible(false);
  const ring = scene.add
    .ellipse(0, 0, 66, 88)
    .setStrokeStyle(2, 0xffd75e, 0.9)
    .setFillStyle(0, 0)
    .setDepth(30)
    .setVisible(false);
  const keycap = scene.add
    .text(0, 0, " E ", {
      fontFamily: "monospace",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#16161c",
      backgroundColor: "#ffd75e",
      padding: { x: 3, y: 2 },
    })
    .setOrigin(0.5)
    .setDepth(31)
    .setVisible(false);
  const mashLabel = scene.add
    .text(0, 0, "MASH!", {
      fontFamily: "monospace",
      fontSize: "8px",
      fontStyle: "bold",
      color: "#ffd75e",
      backgroundColor: "#000000aa",
      padding: { x: 2, y: 1 },
    })
    .setOrigin(0.5)
    .setDepth(31)
    .setVisible(false);
  const timerBg = scene.add.rectangle(0, 0, 40, 3, 0x16161c, 0.8).setDepth(31).setVisible(false);
  const timerFill = scene.add
    .rectangle(0, 0, 40, 3, 0xffd75e, 1)
    .setOrigin(0, 0.5)
    .setDepth(32)
    .setVisible(false);

  const promptParts = [glow, ring, keycap, mashLabel, timerBg, timerFill];
  const hidePrompt = () => {
    for (const p of promptParts) p.setVisible(false);
    api.setContextAction(null);
    api.setObjective(null);
  };

  const endDowned = () => {
    downed = false;
    hidePrompt();
  };

  /** He drops: convert the opening into the scripted DOWNED_MS stagger and
   *  light the whole mash affordance up. */
  const beginDowned = () => {
    downed = true;
    mash = 0;
    pendingTruthAnim = null; // a stale reveal pose must not hijack this window
    suppressVuln++; // our force-stagger echoes one vulnerable command back
    pending.push({ kind: "force-stagger", ms: DOWNED_MS });
    for (const p of promptParts) p.setVisible(true);
    // (no expose sfx here — the controller already plays it per vulnerable cmd)
    api.setObjective("HE'S DOWN — GET CLOSE, MASH E!");
  };

  /** A full mash: tear one truth out (crown crack / rage removal / sword). */
  const fireTruth = () => {
    endDowned();
    truths += 1;
    sealsLeft -= 1;
    api.setSeals({ lit: sealsLeft, of: TRUTH_TOTAL });
    api.sfx("seal");
    if (truths >= TRUTH_TOTAL) {
      // Sword drop → kneel → the fight ends (no dialogue). No reveal stagger:
      // the defeat flow owns the pose from here.
      playBoss("sword-drop");
      scene.time.delayedCall(700, () => api.forceDefeat());
      return;
    }
    pendingTruthAnim = `truth-${truths}`;
    // Hold the revelation beat; the machine parks in a scripted stagger.
    suppressVuln++;
    pending.push({ kind: "force-stagger", ms: REVEAL_STAGGER_MS });
    if (truths === 2) {
      // The rage leaves him — and can never return.
      pending.push({ kind: "force-phase", phaseIndex: 0, lock: true });
      aura.setVisible(false);
    }
  };

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
        if (downed) endDowned(); // a forced phase cancels the machine's stagger
        aura.setVisible(cmd.phaseIndex >= 1);
        return;
      }
      if (cmd.kind === "defeated") {
        if (downed) endDowned();
        return;
      }
      if (cmd.kind === "vulnerable") {
        if (suppressVuln > 0) {
          suppressVuln--;
          return;
        }
        // The big openings DOWN him: an attack-born stagger (parried sweep,
        // charge into the wall) or the overhead slam's recovery. Smaller
        // recoveries stay plain chip-damage punish windows.
        const m = api.machine();
        const bigOpening =
          m.fsm === "stagger" || (m.fsm === "recovery" && m.currentAttackId === "overhead");
        if (!downed && sealsLeft > 0 && bigOpening) beginDowned();
        return;
      }
      if (cmd.kind === "stagger" && pendingTruthAnim) {
        // A truth just landed: hold its pose through the scripted stagger.
        playBoss(pendingTruthAnim);
        pendingTruthAnim = null;
        return;
      }
      if (cmd.kind === "anim") {
        if (downed && (cmd.anim === "stagger" || cmd.anim === "recovery" || cmd.anim === "damage")) {
          // Downed reads as DOWN: hold the knocked pose (propped on the sword,
          // crown fallen — distinct from the `kneel` defeat collapse) through
          // the whole window, re-asserted after damage-flinch frames.
          playBoss("downed");
          return;
        }
        if (cmd.anim === "idle") {
          // Timer ran out → the machine stood him back up.
          if (downed) endDowned();
          if (truths > 0) {
            // The broken poses ARE his weakened idle — the crown stays cracked.
            playBoss(`truth-${Math.min(truths, 3)}`);
          }
          return;
        }
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
        // Wall x derives from the camera bounds (the arena map size) so the
        // charge always spans the CURRENT arena, not a hardcoded width.
        const targetX = dir === 1 ? scene.cameras.main.getBounds().right - 44 : 44;
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
        if (downed) endDowned();
        api.setContextAction(null);
        return;
      }
      if (!downed) return;
      if (m.fsm !== "stagger") {
        // Safety net: the machine left the stagger some other way (e.g. a
        // forced phase) — the window is over.
        endDowned();
        return;
      }

      const now = scene.time.now;
      const bx = api.boss.x;
      const by = api.boss.y;
      const inRange = Math.abs(api.player.x - bx) <= TRUTH_RANGE_PX;

      // Highlight + prompt track the kneeling King: floor glow, pulsing ring,
      // bobbing E keycap (dimmed until in range) and the draining 5s bar.
      glow.setPosition(bx, by + 34).setAlpha(0.18 + 0.1 * (1 + Math.sin(now / 140)));
      ring.setPosition(bx, by + 4).setScale(1 + 0.05 * Math.sin(now / 120));
      const bob = Math.sin(now / 110) * 2;
      keycap.setPosition(bx, by - 56 + bob).setAlpha(inRange ? 1 : 0.6);
      mashLabel
        .setPosition(bx, by - 44 + bob)
        .setAlpha(inRange ? 1 : 0.75)
        .setText(inRange ? "MASH!" : "GET CLOSE!");
      const remainingFrac = Math.max(0, Math.min(1, m.vulnerableMs / DOWNED_MS));
      timerBg.setPosition(bx, by - 66);
      timerFill.setPosition(bx - 20, by - 66).setSize(40 * remainingFrac, 3);

      api.setContextAction({ key: "E", label: "MASH E!", progress: mash / MASH_TARGET });

      if (inRange && api.interactPressed()) {
        mash++;
        api.sfx("type");
        scene.tweens.add({ targets: keycap, scale: { from: 1.35, to: 1 }, duration: 90 });
        if (mash >= MASH_TARGET) fireTruth();
      }
    },

    events() {
      const out = [...pending];
      pending.length = 0;
      return out;
    },

    destroy() {
      aura.destroy();
      for (const p of promptParts) p.destroy();
      api.setContextAction(null);
      api.setObjective(null);
      api.setSeals(null);
    },
  };
}
