// features/adventure/realtime/bossDefinitions/hollowGiant.ts
//
// THE HOLLOW GIANT — World 1-2 (amendment Task 37; boss-demands/hollow-giant.md).
// A background-anchored colossus. Body/hand damage is ZERO (damageScale 0) —
// only the exposed heart counts, and each connected strike emits exactly ONE
// {hit, amount:1, source:"mechanic"} so every cycle is exactly 3 contacts.
// Loop: bait the DOUBLE SLAM → the planted hands become a ladder (hand → arm →
// shoulder platforms) → the heart is exposed → 3 strikes → knockback blast,
// heart cracks, tempo rises (hp thresholds ARE the cycle counter: 9→6→3→0).
import type { MachineEvent, RtBossDef } from "../types";
import type { BossMechanics, MechanicsApi } from "../BossController";
import { RT_PLAYER } from "../config";
import { animKey, frameKey } from "../../art/textures";
import {
  HOLLOW_GIANT_HAND,
  HOLLOW_GIANT_FOREARM,
  HOLLOW_GIANT_HEART,
} from "../../art/sprites/bosses2";
import type Phaser from "phaser";

export const HOLLOW_GIANT: RtBossDef = {
  id: "hollow-giant",
  name: "The Hollow Giant",
  maxHp: 9, // == 3 cycles × 3 heart-hits (quantized via mechanic-source hits)
  contactDamage: 1, // inert — noContact
  noContact: true,
  damageScale: { attack: 0, stomp: 0 }, // ONLY the heart hurts it
  body: { w: 8, h: 8 }, // vestigial: the torso is scenery, not a hitbox
  phases: [
    { id: "cycle-1", attackIds: ["hand-slam", "double-slam", "mouth-shockwave", "inhale"] },
    {
      id: "cycle-2",
      enterBelowHpFrac: 0.7, // fires exactly at hp 6
      attackIds: ["hand-slam", "double-slam", "mouth-shockwave", "inhale"],
      tempoScale: 0.85,
    },
    {
      id: "cycle-3",
      enterBelowHpFrac: 0.34, // fires exactly at hp 3
      attackIds: ["hand-slam", "double-slam", "mouth-shockwave", "inhale"],
      tempoScale: 0.7,
    },
  ],
  attacks: [
    // One hand slams a marked column; the hand lingers as a platform.
    {
      id: "hand-slam",
      telegraphMs: 700,
      activeMs: 300,
      recoveryMs: 600,
      cooldownMs: 2600,
      damage: 1,
      weight: 3,
    },
    // Both hands strike, flanking the chamber center — the LADDER opener.
    // Weighted up + a shorter cooldown so the climb window returns quickly
    // after each knockback (portfolio-visitor pacing).
    {
      id: "double-slam",
      telegraphMs: 1000,
      activeMs: 350,
      recoveryMs: 900,
      cooldownMs: 5000,
      damage: 2,
      weight: 3,
    },
    // Horizontal force wave along the floor — jump it or perch on a tier.
    {
      id: "mouth-shockwave",
      telegraphMs: 900,
      activeMs: 400,
      recoveryMs: 800,
      cooldownMs: 5200,
      damage: 1,
      weight: 2,
    },
    // Sustained pull toward the maw — brace behind the anchor rocks.
    {
      id: "inhale",
      telegraphMs: 600,
      activeMs: 2800, // == the pull duration (never tempo-scaled)
      recoveryMs: 700,
      cooldownMs: 8000,
      damage: 1,
      weight: 1,
    },
  ],
  arenaKey: "hollow-giant",
  track: "hollow-giant",
  // Torso anchor: high enough that the chest cavity (~y 170) is OUT of
  // floor-swing reach — the heart must be climbed to, never poked from below.
  spawn: { tx: 29, ty: 9 },
  animFor: (anim, ctx) => {
    if (
      (anim === "telegraph" || anim === "attack") &&
      (ctx.attackId === "mouth-shockwave" || ctx.attackId === "inhale")
    ) {
      return "mouth-open";
    }
    if (anim === "damage") return "hurt";
    if (anim === "defeat") return "defeat";
    return null; // idle covers the rest (the giant is anchored)
  },
};

// Geometry (world px) inside the 60×16 chamber.
const CENTER_X = 29 * 16 + 8; // 472 — torso/heart column
const FLOOR_Y = 14 * 16; // 224 — floor top
const HEART = { x: CENTER_X, y: 170 }; // chest cavity center
const HAND_XS: [number, number] = [CENTER_X - 72, CENTER_X + 72]; // double-slam pair
const EXPOSE_MS = 10000; // generous: the climb is the world's teaching mechanic
const HITS_PER_CYCLE = 3;

export function createHollowGiantMechanics(scene: Phaser.Scene, api: MechanicsApi): BossMechanics {
  const pending: MachineEvent[] = [];
  let exposed = false;
  let exposeUntil = 0;
  let hitsThisCycle = 0;
  let lastPulseAt = 0;
  let swingReady = true; // one heart-hit per registered swing overlap

  // The heart overlay: pulses over the torso cavity, cracking per cycle.
  const heart = scene.add.sprite(HEART.x, HEART.y, frameKey(HOLLOW_GIANT_HEART.key, 0)).setDepth(13);
  const heartAnim = () => {
    const hp = api.machine().hp;
    const state = hp > 6 ? "whole" : hp > 3 ? "crack1" : hp > 0 ? "crack2" : "shatter";
    heart.play(animKey(HOLLOW_GIANT_HEART.key, state), true);
  };
  heartAnim();

  // A physics zone over the heart, armed only while exposed. Tall on purpose:
  // a swing from the first arm step (feet ≈181 → blade band ≈160–180) and a
  // falling stomp through the cavity both connect without pixel footing.
  const heartZone = scene.add.zone(HEART.x, HEART.y + 8, 40, 56);
  scene.physics.add.existing(heartZone);
  const hzBody = heartZone.body as Phaser.Physics.Arcade.Body;
  hzBody.setAllowGravity(false);
  hzBody.enable = false;

  const heartHit = () => {
    if (!exposed || api.machine().fsm === "defeated") return;
    hitsThisCycle += 1;
    api.sfx("heart-hit");
    api.setSeals({ lit: Math.max(0, HITS_PER_CYCLE - hitsThisCycle), of: HITS_PER_CYCLE });
    api.setObjective(`STRIKE THE HEART — ${hitsThisCycle} / ${HITS_PER_CYCLE}`);
    api.boss.play(animKey(api.def.id, "hurt"), true);
    pending.push({ kind: "hit", amount: 1, source: "mechanic" });
    heartAnim();
    if (hitsThisCycle >= HITS_PER_CYCLE) endExpose(true);
  };
  api.onSwingHit(heartZone, () => {
    if (swingReady) {
      swingReady = false;
      scene.time.delayedCall(200, () => (swingReady = true));
      heartHit();
    }
  });

  const openExpose = () => {
    // A double-slam landing while the chest is already open only refreshes
    // the window — cycle progress and the ladder are never reset mid-climb.
    if (exposed) {
      exposeUntil = scene.time.now + EXPOSE_MS;
      return;
    }
    exposed = true;
    hitsThisCycle = 0;
    exposeUntil = scene.time.now + EXPOSE_MS;
    // Park the machine in a scripted stagger for the climb: no new attacks
    // while the chest is open (playtest finding — slam marks lock onto the
    // climber and snipe them off the anatomy; the boss-demands memo reserved
    // exactly this hold for exactly this outcome).
    pending.push({ kind: "force-stagger", ms: EXPOSE_MS });
    api.sfx("expose");
    api.setSeals({ lit: HITS_PER_CYCLE, of: HITS_PER_CYCLE });
    api.setObjective("CLIMB — STRIKE THE HEART");
    hzBody.enable = true;
    // The planted hands stay as the ladder; add arm steps. From the upper
    // step (top ≈163, swing band ≈142–162) the enlarged heart zone
    // (≈153–187) is in reach without pixel-perfect footing.
    // Two clean 20-24px risers: palm (top 203) → forearm step (top 181, the
    // strike spot beside the cavity) → shoulder step (top 163, the stomp perch).
    api.hazards.spawnPlatform({
      x: CENTER_X - 30,
      y: 186,
      w: 36,
      h: 8,
      ttlMs: EXPOSE_MS,
      texture: { key: HOLLOW_GIANT_FOREARM.key, offsetY: 18 },
    });
    api.hazards.spawnPlatform({
      x: CENTER_X - 10,
      y: 168,
      w: 28,
      h: 8,
      ttlMs: EXPOSE_MS,
      texture: { key: HOLLOW_GIANT_FOREARM.key, offsetY: 18, flipX: true },
    });
  };

  const endExpose = (knockback: boolean) => {
    if (!exposed) return;
    exposed = false;
    hzBody.enable = false;
    api.setSeals(null);
    api.setObjective("BAIT THE DOUBLE SLAM");
    // Release the scripted hold (re-forcing replaces the window; 1ms drains
    // on the next step and the giant returns to its attack loop).
    if (api.machine().fsm !== "defeated") pending.push({ kind: "force-stagger", ms: 1 });
    if (knockback) {
      // The giant blasts the player away from the chest.
      const body = api.player.body as Phaser.Physics.Arcade.Body;
      const dir = api.player.x < CENTER_X ? -1 : 1;
      body.setVelocity(260 * dir, -240);
      api.sfx("boss-hit");
    }
  };

  api.setObjective("BAIT THE DOUBLE SLAM");

  let slamX = CENTER_X; // hand-slam column, locked at telegraph start
  const tempo = () => api.def.phases[api.machine().phaseIndex]?.tempoScale ?? 1;

  return {
    onCommand(cmd) {
      if (cmd.kind === "attack-start") {
        if (cmd.attackId === "hand-slam") {
          // MARKED column (brief): lock the target and show the warning strip
          // for the rest of the telegraph; it arms exactly at the impact.
          slamX = Math.max(56, Math.min(60 * 16 - 56, api.player.x));
          api.hazards.spawnZone({
            x: slamX,
            y: FLOOR_Y - 14,
            w: 44,
            h: 28,
            delayMs: 700 * tempo(),
            activeMs: 260,
            damage: 1,
          });
          api.boss.play(
            animKey(api.def.id, slamX < CENTER_X ? "slam-left" : "slam-right"),
            true,
          );
        } else if (cmd.attackId === "double-slam") {
          // Both columns marked through the long telegraph — the safe gap
          // between them is visible before the hands ever fall (brief).
          for (const hx of HAND_XS) {
            api.hazards.spawnZone({
              x: hx,
              y: FLOOR_Y - 14,
              w: 48,
              h: 28,
              delayMs: 1000 * tempo(),
              activeMs: 300,
              damage: 2,
            });
          }
          api.boss.play(animKey(api.def.id, "slam-left"), true);
        }
        return;
      }
      if (cmd.kind !== "attack-active") {
        if (cmd.kind === "phase" || cmd.kind === "defeated") {
          endExpose(false);
        }
        return;
      }
      if (cmd.attackId === "hand-slam") {
        // The palm lands on the marked column and lingers as a step.
        api.hazards.spawnPlatform({
          x: slamX,
          y: FLOOR_Y - 16,
          w: 40,
          h: 10,
          ttlMs: 2500,
          texture: { key: HOLLOW_GIANT_HAND.key, anim: "open", offsetY: 6 },
        });
      } else if (cmd.attackId === "double-slam") {
        for (const [i, hx] of HAND_XS.entries()) {
          api.hazards.spawnPlatform({
            x: hx,
            y: FLOOR_Y - 16,
            w: 40,
            h: 10,
            ttlMs: EXPOSE_MS + 500,
            texture: { key: HOLLOW_GIANT_HAND.key, anim: "open", offsetY: 6, flipX: i === 1 },
          });
        }
        // The bait worked: the chest opens once the slam settles.
        scene.time.delayedCall(500, () => {
          if (api.machine().fsm !== "defeated") openExpose();
        });
      } else if (cmd.attackId === "mouth-shockwave") {
        api.hazards.spawnShockwave({ x: CENTER_X, dir: 0, speed: 200, damage: 1, height: 14 });
      }
      // inhale: the pull runs frame-by-frame in update()
    },

    update(dt) {
      const m = api.machine();
      if (m.fsm === "defeated") {
        heart.play(animKey(HOLLOW_GIANT_HEART.key, "shatter"), true);
        heartZone.destroy();
        return;
      }
      // Sustained inhale pull (anchor nubs block the slide).
      if (m.fsm === "attack" && m.currentAttackId === "inhale") {
        const pull = (120 * dt) / 1000;
        api.player.x += api.player.x < CENTER_X ? pull : -pull;
        if (Math.abs(api.player.x - CENTER_X) < 30 && api.player.y < 200) {
          // Dragged into the maw.
          (api.player.body as Phaser.Physics.Arcade.Body).setVelocity(
            api.player.x < CENTER_X ? -220 : 220,
            -180,
          );
        }
      }
      if (exposed) {
        if (scene.time.now >= exposeUntil) endExpose(false);
        // Heart-pulse rings: slow radial bolts while the chest is open.
        // Pulse rings burst DOWN-AND-OUT toward the floor approach (jump
        // between them, per the brief); the climb lane beside the cavity
        // stays honest but survivable.
        if (scene.time.now - lastPulseAt > 3000) {
          lastPulseAt = scene.time.now;
          for (const [vx, vy] of [
            [-150, 70],
            [150, 70],
            [-80, 120],
            [80, 120],
          ] as const) {
            api.projectiles.spawn({
              spec: { kind: "linear", x: HEART.x, y: HEART.y + 14, vx, vy, ttlMs: 2000 },
              sizePx: 6,
              color: 0xef4444,
              damage: 1,
            });
          }
        }
        // Stomp contact on the heart: falling feet through the zone.
        const pb = api.player.body as Phaser.Physics.Arcade.Body;
        if (
          hzBody.enable &&
          pb.velocity.y > 40 &&
          pb.bottom >= hzBody.top &&
          pb.bottom <= hzBody.top + 14 &&
          pb.right > hzBody.left &&
          pb.left < hzBody.right &&
          swingReady
        ) {
          swingReady = false;
          scene.time.delayedCall(250, () => (swingReady = true));
          pb.setVelocityY(RT_PLAYER.stompBounceVel);
          heartHit();
        }
      }
    },

    events() {
      const out = [...pending];
      pending.length = 0;
      return out;
    },

    destroy() {
      heart.destroy();
      heartZone.destroy();
      api.setObjective(null);
      api.setSeals(null);
    },
  };
}
