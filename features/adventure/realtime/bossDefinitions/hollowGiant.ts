// features/adventure/realtime/bossDefinitions/hollowGiant.ts
//
// THE HOLLOW GIANT — World 1-2 (owner-directed rework). A background-anchored
// buried colossus: the torso is scenery (noContact), the player renders in
// FRONT of it, and only the HEART hurts it — by STOMPING it, three times
// total (maxHp 3; each stomp is one mechanic-source hit).
//
// The fight: his hands rise from the sand and slam. Usually it's the FIST
// (damage, nothing to stand on). Rarely it's the OPEN PALM — the palm stays
// planted as a platform, and THAT is the only ladder: hand → double-jump →
// stomp the heart. The heart sits high enough that no double jump from the
// floor ever reaches it. He also SWEEPS the arena with a slap (jump it — or
// parry it), and slams BOTH fists to send floor shockwaves racing both ways —
// the "everybody jumps" beat. No extra platforms, no climb scaffolding: the
// palm is the whole route.
import type { MachineEvent, RtBossDef } from "../types";
import type { BossMechanics, MechanicsApi } from "../BossController";
import { RT_PLAYER } from "../config";
import { animKey, frameKey } from "../../art/textures";
import { HOLLOW_GIANT_HAND, HOLLOW_GIANT_HEART } from "../../art/sprites/bosses2";
import type Phaser from "phaser";

export const HOLLOW_GIANT: RtBossDef = {
  id: "hollow-giant",
  name: "The Hollow Giant",
  maxHp: 3, // three heart stomps end him — the ONLY damage that counts
  contactDamage: 1, // inert — noContact
  noContact: true,
  damageScale: { attack: 0, stomp: 0 }, // swings/body-stomps do nothing
  body: { w: 8, h: 8 }, // vestigial: the torso is scenery, not a hitbox
  phases: [
    { id: "cycle-1", attackIds: ["palm-slam", "fist-slam", "sweep-slap", "double-fist"] },
    {
      id: "cycle-2",
      enterBelowHpFrac: 0.67, // after the first heart stomp (hp 2)
      attackIds: ["palm-slam", "fist-slam", "sweep-slap", "double-fist"],
      tempoScale: 0.85,
    },
    {
      id: "cycle-3",
      enterBelowHpFrac: 0.34, // after the second (hp 1)
      attackIds: ["palm-slam", "fist-slam", "sweep-slap", "double-fist"],
      tempoScale: 0.72,
    },
  ],
  attacks: [
    // The RARE open-palm slam: the impact hurts, then the palm stays planted
    // as the climbing platform. Long cooldown + low weight = the bait-game.
    {
      id: "palm-slam",
      telegraphMs: 900,
      activeMs: 300,
      recoveryMs: 900,
      cooldownMs: 9000,
      damage: 1,
      weight: 1,
    },
    // His USUAL answer: a knuckle slam on the player's column. No platform.
    {
      id: "fist-slam",
      telegraphMs: 700,
      activeMs: 250,
      recoveryMs: 600,
      cooldownMs: 2200,
      damage: 1,
      weight: 4,
    },
    // A low slap dragged across most of the arena — jump it, or parry it.
    {
      id: "sweep-slap",
      telegraphMs: 800,
      activeMs: 500,
      recoveryMs: 900,
      cooldownMs: 5600,
      parryable: true,
      damage: 1,
      weight: 2,
    },
    // BOTH fists at once: converging floor shockwaves — get airborne.
    {
      id: "double-fist",
      telegraphMs: 1000,
      activeMs: 350,
      recoveryMs: 1000,
      cooldownMs: 6400,
      damage: 2,
      weight: 2,
    },
  ],
  arenaKey: "hollow-giant",
  track: "hollow-giant",
  // Torso anchor: body {8,8} + ty 9 puts the 128×136 sprite's base exactly on
  // the floor line (y 224) with the chest cavity centred at y ≈ 140 — above
  // any double jump from the floor; only the planted palm reaches it.
  spawn: { tx: 24, ty: 9 },
  animFor: (anim) => {
    if (anim === "damage") return "hurt";
    if (anim === "defeat") return "defeat";
    return null; // idle covers the rest (the giant is anchored)
  },
};

// Geometry (world px) inside the 48×17 chamber.
const ARENA_W = 48 * 16;
const CENTER_X = 24 * 16 + 8; // 392 — torso/heart column
const FLOOR_Y = 14 * 16; // 224 — floor top
const HEART = { x: CENTER_X, y: 140 }; // chest cavity centre
const HAND_XS: [number, number] = [CENTER_X - 64, CENTER_X + 64]; // fist pair
const PALM_MS = 4500; // how long the planted palm stays before sinking back
const HEART_HITS = 3;

export function createHollowGiantMechanics(scene: Phaser.Scene, api: MechanicsApi): BossMechanics {
  const pending: MachineEvent[] = [];
  let stompReady = true;
  let hits = 0;

  // The heart: pulses in the cavity, cracking per stomp. Depth 9 keeps it over
  // the torso (8) but BEHIND the player (10) — the player is always in front.
  const heart = scene.add
    .sprite(HEART.x, HEART.y, frameKey(HOLLOW_GIANT_HEART.key, 0))
    .setDepth(9);
  const heartAnim = () => {
    const hp = api.machine().hp;
    const state = hp > 2 ? "whole" : hp > 1 ? "crack1" : hp > 0 ? "crack2" : "shatter";
    heart.play(animKey(HOLLOW_GIANT_HEART.key, state), true);
  };
  heartAnim();

  // Stomp target over the cavity — always live; the floor can't reach it.
  const heartZone = scene.add.zone(HEART.x, HEART.y, 36, 34);
  scene.physics.add.existing(heartZone);
  const hzBody = heartZone.body as Phaser.Physics.Arcade.Body;
  hzBody.setAllowGravity(false);
  hzBody.enable = true;

  const heartHit = () => {
    if (api.machine().fsm === "defeated") return;
    hits += 1;
    api.sfx("heart-hit");
    api.setSeals({ lit: Math.max(0, HEART_HITS - hits), of: HEART_HITS });
    api.setObjective(hits < HEART_HITS ? `HEART STOMPS — ${hits} / ${HEART_HITS}` : null);
    pending.push({ kind: "hit", amount: 1, source: "mechanic" });
    // The hurt beat: hold him reeling while the player is blasted clear.
    pending.push({ kind: "force-stagger", ms: 1200 });
    api.boss.play(animKey(api.def.id, "hurt"), true);
    heartAnim();
    const body = api.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(api.player.x < CENTER_X ? -260 : 260, -240);
    api.sfx("boss-hit");
  };

  api.setObjective("BAIT HIS OPEN PALM — RIDE IT TO THE HEART");
  api.setSeals({ lit: HEART_HITS, of: HEART_HITS });

  let slamX = CENTER_X; // fist-slam column, locked at telegraph start
  let palmX = CENTER_X - 64; // palm-slam column, locked at telegraph start
  const tempo = () => api.def.phases[api.machine().phaseIndex]?.tempoScale ?? 1;

  /** A fist/palm drop visual: the hand sprite falls onto (x, floor) fast,
   *  holds, then fades. The DAMAGE comes from the pre-marked hazard zone. */
  const dropHand = (x: number, fist: boolean, holdMs: number) => {
    const s = scene.add
      .sprite(x, 40, frameKey(HOLLOW_GIANT_HAND.key, fist ? 1 : 0))
      .setDepth(15)
      .setFlipX(x > CENTER_X);
    scene.tweens.add({
      targets: s,
      y: FLOOR_Y - 12,
      duration: 110,
      ease: "Quad.easeIn",
      onComplete: () => {
        scene.tweens.add({
          targets: s,
          alpha: 0,
          delay: holdMs,
          duration: 200,
          onComplete: () => s.destroy(),
        });
      },
    });
  };

  return {
    onCommand(cmd) {
      if (cmd.kind === "attack-start") {
        if (cmd.attackId === "fist-slam") {
          // Marked column on the player, armed exactly at impact.
          slamX = Math.max(56, Math.min(ARENA_W - 56, api.player.x));
          api.hazards.spawnZone({
            x: slamX,
            y: FLOOR_Y - 14,
            w: 48,
            h: 28,
            delayMs: 700 * tempo(),
            activeMs: 250,
            damage: 1,
          });
        } else if (cmd.attackId === "palm-slam") {
          // The palm plants on the player's SIDE of the chest — close enough
          // that the heart is a double jump off the fingers.
          palmX = api.player.x < CENTER_X ? HAND_XS[0] : HAND_XS[1];
          api.hazards.spawnZone({
            x: palmX,
            y: FLOOR_Y - 14,
            w: 44,
            h: 28,
            delayMs: 900 * tempo(),
            activeMs: 200,
            damage: 1,
          });
        } else if (cmd.attackId === "double-fist") {
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
        }
        return;
      }
      if (cmd.kind !== "attack-active") return;

      // Hand attacks damage through their marked hazard zones/shockwaves —
      // park the generic melee window far off-field so the scenery torso
      // never lands an invisible hit. The sweep re-shapes it back on purpose.
      if (cmd.attackId !== "sweep-slap") api.shapeAttack({ w: 2, h: 2, oy: -400 });

      if (cmd.attackId === "fist-slam") {
        dropHand(slamX, true, 350);
      } else if (cmd.attackId === "palm-slam") {
        // The whole point: the palm STAYS as the platform to the heart.
        dropHand(palmX, false, 60);
        api.hazards.spawnPlatform({
          x: palmX,
          y: FLOOR_Y - 30,
          w: 36,
          h: 10,
          ttlMs: PALM_MS,
          texture: { key: HOLLOW_GIANT_HAND.key, anim: "open", offsetY: 3, flipX: palmX > CENTER_X },
        });
      } else if (cmd.attackId === "sweep-slap") {
        // The armed melee window IS the slap: a low band across the arena.
        api.shapeAttack({ w: 520, h: 34, oy: FLOOR_Y - 18 - api.boss.y });
        // Visual: the open hand drags across the floor from the far side.
        const fromLeft = api.player.x >= CENTER_X;
        const s = scene.add
          .sprite(fromLeft ? 40 : ARENA_W - 40, FLOOR_Y - 18, frameKey(HOLLOW_GIANT_HAND.key, 0))
          .setDepth(15)
          .setFlipX(!fromLeft);
        scene.tweens.add({
          targets: s,
          x: fromLeft ? ARENA_W - 40 : 40,
          duration: 500,
          ease: "Sine.easeIn",
          onComplete: () => s.destroy(),
        });
      } else if (cmd.attackId === "double-fist") {
        for (const hx of HAND_XS) dropHand(hx, true, 400);
        // Converging + crossing floor waves — airborne is the only answer.
        api.hazards.spawnShockwave({ x: HAND_XS[0], dir: 0, speed: 210, damage: 1, height: 12 });
        api.hazards.spawnShockwave({ x: HAND_XS[1], dir: 0, speed: 210, damage: 1, height: 12 });
      }
    },

    update() {
      const m = api.machine();
      if (m.fsm === "defeated") {
        heart.play(animKey(HOLLOW_GIANT_HEART.key, "shatter"), true);
        hzBody.enable = false;
        api.setContextAction(null);
        return;
      }
      // Heart stomp: falling feet crossing the cavity from above. Only the
      // planted palm gets the player up here — never the bare floor.
      const pb = api.player.body as Phaser.Physics.Arcade.Body;
      if (
        hzBody.enable &&
        stompReady &&
        pb.velocity.y > 40 &&
        pb.bottom >= hzBody.top &&
        pb.bottom <= hzBody.top + 16 &&
        pb.right > hzBody.left &&
        pb.left < hzBody.right
      ) {
        stompReady = false;
        scene.time.delayedCall(400, () => (stompReady = true));
        pb.setVelocityY(RT_PLAYER.stompBounceVel);
        heartHit();
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
