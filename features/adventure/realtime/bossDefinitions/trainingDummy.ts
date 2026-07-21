// features/adventure/realtime/bossDefinitions/trainingDummy.ts
//
// The debug-arena boss (amendment §4), Task 33 edition: the dummy now exercises
// EVERY reusable combat primitive end to end —
//   • melee pokes (one parryable → machine stagger, one not) ......... Task 32
//   • a GLOW ORB projectile: parry reflects it back (Dealer's clasp loop);
//     each reflected hit lands a mechanic hit + force-stagger, lights a
//     seal pip, and counts toward the [ E FINISH ] context action
//   • a jumpable ground SHOCKWAVE (Broken King / hammer vocabulary)
//   • marked FALLING DEBRIS columns (Hollow Giant / bullet-rain vocabulary)
//   • 3 reflections → hold E near the dummy → forceDefeat (Truth-style hold)
// Attrition (slashes/stomps to hp 0) stays a valid alternate win.
import type { MachineEvent, RtBossDef } from "../types";
import type { BossMechanics, MechanicsApi } from "../BossController";
import type Phaser from "phaser";

export const TRAINING_DUMMY: RtBossDef = {
  id: "training-dummy",
  name: "Training Dummy",
  maxHp: 20,
  contactDamage: 1,
  // damageScale omitted → attack ×1, stomp ×1: the dummy takes full damage from
  // both, so the player can validate either path (10 slashes or 7 stomps).
  phases: [
    { id: "steady", attackIds: ["poke", "heavy-poke", "glow-orb", "shockwave", "debris"] },
  ],
  attacks: [
    // maxRangePx 150 == one second of walking (PHYSICS.moveSpeed): anywhere that
    // reads as "standing near the dummy" wakes it. 90 left it asleep at natural
    // approach distances — a static post can never close the gap itself.
    {
      id: "poke",
      telegraphMs: 620,
      activeMs: 160,
      recoveryMs: 700,
      cooldownMs: 1400,
      parryable: true,
      damage: 1,
      weight: 2,
      maxRangePx: 150,
    },
    // Unparryable poke: same tell, no parry glow — jump/dash out or eat a heart.
    {
      id: "heavy-poke",
      telegraphMs: 720,
      activeMs: 160,
      recoveryMs: 900,
      cooldownMs: 1700,
      parryable: false,
      damage: 1,
      weight: 2,
      maxRangePx: 150,
    },
    // Ranged glow orb — the parry-reflect trainer. Selected when the player
    // keeps distance; parryable marks the gold telegraph + the orb glows.
    {
      id: "glow-orb",
      telegraphMs: 700,
      activeMs: 200,
      recoveryMs: 800,
      cooldownMs: 2600,
      parryable: true,
      damage: 1,
      weight: 2,
      minRangePx: 110,
    },
    // Ground shockwave — jump over it (any range; long cooldown).
    {
      id: "shockwave",
      telegraphMs: 800,
      activeMs: 300,
      recoveryMs: 900,
      cooldownMs: 3200,
      parryable: false,
      damage: 1,
      weight: 1,
    },
    // Marked falling debris — move out of the flashing columns.
    {
      id: "debris",
      telegraphMs: 700,
      activeMs: 400,
      recoveryMs: 700,
      cooldownMs: 3600,
      parryable: false,
      damage: 1,
      weight: 1,
    },
  ],
  arenaKey: "training",
  track: "boss",
  // Aligned with the `D` marker in the training arena map (see arenas.ts).
  spawn: { tx: 28, ty: 15 },
};

const REFLECTS_TO_FINISH = 3;
const FINISH_HOLD_MS = 700;
const FINISH_RANGE_PX = 60;

/**
 * Training mechanics: the reflect-counter + E-hold finish. Exercises the
 * MechanicsApi surface the real bosses rely on — seal pips, objective text,
 * context action with hold progress, machine events (mechanic hit,
 * force-stagger, force-defeat), and the projectile/hazard managers via
 * onCommand-keyed spawns.
 */
export function createTrainingMechanics(_scene: Phaser.Scene, api: MechanicsApi): BossMechanics {
  let reflected = 0;
  let finishArmed = false;
  const pending: MachineEvent[] = [];

  api.setObjective(`REFLECT THE GLOW: 0 / ${REFLECTS_TO_FINISH}`);
  api.setSeals({ lit: 0, of: REFLECTS_TO_FINISH });

  return {
    onCommand(cmd) {
      if (cmd.kind !== "attack-active") return;
      const bossX = api.boss.x;
      const bossY = api.boss.y;
      if (cmd.attackId === "glow-orb") {
        const dir = api.player.x < bossX ? -1 : 1;
        api.projectiles.spawn({
          spec: {
            kind: "linear",
            x: bossX + dir * 14,
            // Torso height: the player body spans y≈234..256 on the floor, so
            // bossY+4 (≈244) crosses its middle. bossY-6 grazed the top edge
            // with near-zero contact depth — unparryable in practice.
            y: bossY + 4,
            vx: 150 * dir,
            vy: 0,
            ttlMs: 4200,
          },
          sizePx: 8,
          glow: true,
          damage: 1,
          onHitBoss: () => {
            reflected = Math.min(REFLECTS_TO_FINISH, reflected + 1);
            api.sfx("boss-hit");
            api.setSeals({ lit: reflected, of: REFLECTS_TO_FINISH });
            pending.push({ kind: "hit", amount: 2, source: "mechanic" });
            if (reflected >= REFLECTS_TO_FINISH && !finishArmed) {
              // Third reflect arms the finish: the dummy drops into a LONG
              // daze (finish holds live inside safe windows — the same
              // grammar as the Broken King's Truth) and stays dazed until
              // the hold completes (see update()).
              finishArmed = true;
              pending.push({ kind: "force-stagger", ms: 4000 });
              api.setObjective("HOLD E BESIDE THE DUMMY TO FINISH");
            } else {
              pending.push({ kind: "force-stagger", ms: 900 });
              api.setObjective(`REFLECT THE GLOW: ${reflected} / ${REFLECTS_TO_FINISH}`);
            }
          },
        });
      } else if (cmd.attackId === "shockwave") {
        api.hazards.spawnShockwave({
          x: bossX,
          dir: api.player.x < bossX ? -1 : 1,
          speed: 240,
          damage: 1,
        });
      } else if (cmd.attackId === "debris") {
        // One column on the player, two flanking — dodge the flashing markers.
        const px = api.player.x;
        api.hazards.spawnDebris({ xs: [px - 40, px, px + 40], delayMs: 750, damage: 1 });
      }
    },

    update() {
      if (!finishArmed) return;
      // Keep the dummy dazed while the finish is armed: if the stagger lapses
      // back to idle, immediately re-stagger (processed before any attack
      // selection, so it can never wake mid-telegraph).
      const fsm = api.machine().fsm;
      if (fsm === "idle") pending.push({ kind: "force-stagger", ms: 4000 });
      const dist = Math.abs(api.player.x - api.boss.x);
      if (dist > FINISH_RANGE_PX) {
        api.setContextAction(null);
        return;
      }
      const held = api.interactHeldMs();
      api.setContextAction({
        key: "E",
        label: "FINISH",
        progress: Math.min(1, held / FINISH_HOLD_MS),
      });
      if (held >= FINISH_HOLD_MS) {
        finishArmed = false;
        api.setContextAction(null);
        api.setObjective(null);
        api.sfx("seal");
        api.forceDefeat();
      }
    },

    events() {
      const out = [...pending];
      pending.length = 0;
      return out;
    },

    destroy() {
      api.setContextAction(null);
      api.setObjective(null);
      api.setSeals(null);
    },
  };
}
