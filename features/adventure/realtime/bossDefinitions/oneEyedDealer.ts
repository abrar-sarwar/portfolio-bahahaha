// features/adventure/realtime/bossDefinitions/oneEyedDealer.ts
//
// THE ONE-EYED DEALER — World 1-3 (amendment Task 39; boss-demands memo).
// A masked, gliding gunslinger: invulnerable while the mask is secured. Every
// third bullet GLOWS (the game-wide parryable signal); a parry reflects it into
// the nearest intact mask clasp. Three shattered clasps drop the mask — the
// music ducks to silence, the Dealer freezes, and the player lands real hits
// for four seconds before he re-masks (clasps restore, tempo rises). At low hp
// he stops shooting and CHASES the grounded mask; walking into it (or E)
// punts it away — land the finish before he reaches it.
//
// Per the memo: NO attack is machine-`parryable` (a glow-parry must reflect the
// bullet, never stagger the armored boss); masked/unmasked ride the
// set-invulnerable + force-stagger events; the mask-chase phase is the
// empty-attackIds pool entered by force-phase.
import type { MachineEvent, RtBossDef } from "../types";
import type { BossMechanics, MechanicsApi } from "../BossController";
import { animKey, frameKey } from "../../art/textures";
import {
  DEALER_MASK_SPRITES,
  DEALER_MUZZLE_SPRITES,
} from "../../art/sprites/bosses2";
import { audio } from "../../audio/synth";
import type Phaser from "phaser";

export const ONE_EYED_DEALER: RtBossDef = {
  id: "one-eyed-dealer",
  name: "The One-Eyed Dealer",
  maxHp: 12,
  contactDamage: 1,
  invulnerableBaseline: true, // masked on spawn (mechanics keeps it in sync)
  body: { w: 16, h: 36 },
  spriteFeetY: 40,
  phases: [
    {
      id: "masked",
      attackIds: ["direct-shot", "ricochet-shot", "triple-shot", "teleport-shot", "bullet-rain", "pistol-strike"],
    },
    // Entered via force-phase when the final unmasking leaves the mask down:
    // no attacks — he chases the mask (movement is mechanics-driven).
    { id: "mask-chase", attackIds: [] },
  ],
  attacks: [
    // Laser-line aim → a single quick slug.
    {
      id: "direct-shot",
      telegraphMs: 600,
      activeMs: 150,
      recoveryMs: 500,
      cooldownMs: 1700,
      damage: 1,
      weight: 3,
      minRangePx: 60,
    },
    // Bounce-path preview → a two-bounce slug off the walls.
    {
      id: "ricochet-shot",
      telegraphMs: 700,
      activeMs: 150,
      recoveryMs: 600,
      cooldownMs: 3200,
      damage: 1,
      weight: 2,
      minRangePx: 80,
    },
    // Three slugs at three heights.
    {
      id: "triple-shot",
      telegraphMs: 600,
      activeMs: 200,
      recoveryMs: 550,
      cooldownMs: 3600,
      damage: 1,
      weight: 2,
      minRangePx: 90,
    },
    // Dissolve → reappear elsewhere → immediate shot (reposition in telegraph).
    {
      id: "teleport-shot",
      telegraphMs: 500,
      activeMs: 200,
      recoveryMs: 500,
      cooldownMs: 4200,
      damage: 1,
      weight: 2,
    },
    // Marked columns → slugs fall from above.
    {
      id: "bullet-rain",
      telegraphMs: 700,
      activeMs: 800,
      recoveryMs: 700,
      cooldownMs: 5200,
      damage: 1,
      weight: 2,
    },
    // Point-blank pistol-whip when crowded.
    {
      id: "pistol-strike",
      telegraphMs: 350,
      activeMs: 140,
      recoveryMs: 500,
      cooldownMs: 1600,
      damage: 1,
      weight: 4,
      maxRangePx: 40,
    },
  ],
  arenaKey: "dealer-room",
  track: "one-eyed-dealer",
  spawn: { tx: 25, ty: 15 },
  animFor: (anim, ctx) => {
    if (anim === "telegraph") {
      if (ctx.attackId === "teleport-shot") return "teleport";
      if (ctx.attackId === "pistol-strike") return "strike";
      return "aim";
    }
    if (anim === "attack") {
      if (ctx.attackId === "teleport-shot") return "reappear";
      if (ctx.attackId === "pistol-strike") return "strike";
      return "fire";
    }
    if (anim === "stagger") return "frozen";
    if (anim === "damage") return "damage";
    if (anim === "defeat") return "defeat";
    return null;
  },
};

const ARENA_W = 48 * 16;

export function shouldPuntDealerMask(
  punted: boolean,
  playerDistance: number,
  interactPressed: boolean,
): boolean {
  return !punted && (playerDistance < 26 || (playerDistance < 60 && interactPressed));
}
const FLOOR_Y = 16 * 16; // floor top (row 16)
const CLASP_TOTAL = 3;
const UNMASK_MS = 4000;
export const DEALER_BULLET_SPEED = 190;
const GLOW_EVERY = 3; // every 3rd bullet glows (parryable)
const CHASE_HP = 4; // ≤ 4 hp → the mask stays down; he chases it
const TELEPORT_SPOTS = [120, 240, 400, 560, 640];

export function willNextDealerShotGlow(bulletCount: number): boolean {
  return (bulletCount + 1) % GLOW_EVERY === 0;
}

export function dealerStrafeX(
  bossX: number,
  _playerX: number,
  direction: 1 | -1,
  dtMs: number,
  arenaWidth: number,
): number {
  return Math.max(48, Math.min(arenaWidth - 48, bossX + direction * 0.07 * dtMs));
}

export function createDealerMechanics(scene: Phaser.Scene, api: MechanicsApi): BossMechanics {
  const pending: MachineEvent[] = [];
  let clasps = CLASP_TOTAL;
  let bulletCount = 0;
  let unmaskings = 0;
  let masked = true;
  let chasing = false;
  let punted = false;
  let laserLine: Phaser.GameObjects.Line | null = null;
  let parryWarning: Phaser.GameObjects.Arc | null = null;
  let strafeDir: 1 | -1 = -1;
  let nextStrafeFlipAt = 0;

  // The mask rides the Dealer's face until it falls; then it is a floor object.
  const mask = scene.add
    .sprite(api.boss.x, api.boss.y - 12, frameKey(DEALER_MASK_SPRITES.key, 0))
    .setDepth(13);
  mask.play(animKey(DEALER_MASK_SPRITES.key, "worn"));

  api.setSeals({ lit: clasps, of: CLASP_TOTAL });
  api.setObjective("PARRY THE GLOWING SHOTS");
  pending.push({ kind: "set-invulnerable", value: true });

  const clearLaser = () => {
    laserLine?.destroy();
    laserLine = null;
  };

  const clearParryWarning = () => {
    if (!parryWarning) return;
    scene.tweens.killTweensOf(parryWarning);
    parryWarning.destroy();
    parryWarning = null;
  };

  const showParryWarning = () => {
    clearParryWarning();
    parryWarning = scene.add
      .circle(api.boss.x, api.boss.y - 8, 13, 0xffd75e, 0.08)
      .setStrokeStyle(2, 0xffd75e, 1)
      .setDepth(22);
    scene.tweens.add({
      targets: parryWarning,
      scale: 1.55,
      alpha: 0.25,
      duration: 160,
      yoyo: true,
      repeat: -1,
    });
  };

  const claspHit = () => {
    if (masked === false || clasps <= 0) return;
    clasps -= 1;
    api.sfx("mask-break");
    api.setSeals({ lit: clasps, of: CLASP_TOTAL });
    if (clasps <= 0) dropMask();
  };

  const dropMask = () => {
    masked = false;
    unmaskings += 1;
    audio.stopTrack(); // the room goes SILENT for the unmasked beat (brief)
    api.sfx("expose");
    // The mask falls to the floor beneath him; the room goes still.
    mask.play(animKey(DEALER_MASK_SPRITES.key, "fallen"));
    mask.setPosition(api.boss.x, FLOOR_Y - 6);
    pending.push({ kind: "set-invulnerable", value: false });
    pending.push({ kind: "force-stagger", ms: UNMASK_MS });
    api.setObjective("STRIKE HIM DOWN");
    if (api.machine().hp - 0 <= CHASE_HP || unmaskings >= 3) {
      // Final unmasking: he will chase the mask instead of re-masking.
      chasing = true;
      punted = false;
      pending.push({ kind: "force-phase", phaseIndex: 1, lock: true });
      api.setObjective("KEEP THE MASK AWAY — FINISH HIM");
    } else {
      scene.time.delayedCall(UNMASK_MS, () => remask());
    }
  };

  const remask = () => {
    if (chasing || api.machine().fsm === "defeated") return;
    masked = true;
    clasps = CLASP_TOTAL;
    audio.playTrack(api.def.track); // the music slams back with the mask
    api.sfx("weapon-swap");
    mask.play(animKey(DEALER_MASK_SPRITES.key, "worn"));
    api.setSeals({ lit: clasps, of: CLASP_TOTAL });
    api.setObjective("PARRY THE GLOWING SHOTS");
    pending.push({ kind: "set-invulnerable", value: true });
    pending.push({ kind: "force-stagger", ms: 1 }); // release the freeze early
    // Each re-mask quickens him (memo: tempo + per cycle).
    pending.push({ kind: "set-tempo", scale: unmaskings >= 2 ? 0.75 : 0.85 });
  };

  const fireBullet = (angleRad: number, glow: boolean) => {
    const bx = api.boss.x;
    const by = api.boss.y - 8;
    const muzzle = scene.add
      .sprite(bx + Math.cos(angleRad) * 14, by + Math.sin(angleRad) * 14, frameKey(DEALER_MUZZLE_SPRITES.key, 0))
      .setDepth(21);
    scene.time.delayedCall(90, () => muzzle.destroy());
    api.projectiles.spawn({
      spec: {
        kind: "linear",
        x: bx + Math.cos(angleRad) * 16,
        y: by + Math.sin(angleRad) * 16,
        vx: Math.cos(angleRad) * DEALER_BULLET_SPEED,
        vy: Math.sin(angleRad) * DEALER_BULLET_SPEED,
        ttlMs: 3200,
      },
      sizePx: glow ? 8 : 6,
      glow,
      damage: 1,
      onHitBoss: glow ? () => claspHit() : undefined,
    });
  };

  const aimAngle = () => Math.atan2(api.player.y - 10 - (api.boss.y - 8), api.player.x - api.boss.x);
  const nextGlow = () => {
    bulletCount += 1;
    return bulletCount % GLOW_EVERY === 0;
  };

  return {
    onCommand(cmd) {
      if (cmd.kind === "attack-start") {
        api.boss.setFlipX(api.player.x < api.boss.x);
        const firesBullet = ["direct-shot", "ricochet-shot", "triple-shot", "teleport-shot"].includes(cmd.attackId);
        const nextIsGlow = firesBullet && willNextDealerShotGlow(bulletCount);
        if (nextIsGlow) showParryWarning();
        if (cmd.attackId === "direct-shot" || cmd.attackId === "triple-shot" || cmd.attackId === "ricochet-shot") {
          // The laser aim line (bullet-path preview).
          clearLaser();
          const ang = aimAngle();
          laserLine = scene.add
            .line(0, 0, api.boss.x, api.boss.y - 8, api.boss.x + Math.cos(ang) * 500, api.boss.y - 8 + Math.sin(ang) * 500, nextIsGlow ? 0xffd75e : 0xff5cc8, nextIsGlow ? 0.9 : 0.5)
            .setOrigin(0, 0)
            .setDepth(19);
        } else if (cmd.attackId === "teleport-shot") {
          // Dissolve now; reappear at a new spot mid-telegraph.
          const spot = TELEPORT_SPOTS[Math.floor((bulletCount + unmaskings) % TELEPORT_SPOTS.length)];
          scene.time.delayedCall(280, () => {
            if (api.machine().currentAttackId === "teleport-shot") {
              api.boss.setX(spot);
              api.boss.play(animKey(api.def.id, "reappear"), true);
            }
          });
        } else if (cmd.attackId === "bullet-rain") {
          const px = api.player.x;
          api.hazards.spawnDebris({ xs: [px - 60, px, px + 60], delayMs: 750, damage: 1, speed: 260 });
        }
        return;
      }
      if (cmd.kind === "attack-end" || cmd.kind === "stagger" || cmd.kind === "defeated") {
        clearLaser();
        clearParryWarning();
      }
      if (cmd.kind !== "attack-active") return;
      clearParryWarning();

      if (cmd.attackId === "direct-shot") {
        fireBullet(aimAngle(), nextGlow());
      } else if (cmd.attackId === "ricochet-shot") {
        const ang = aimAngle();
        const glow = nextGlow();
        api.projectiles.spawn({
          spec: {
            kind: "bouncing",
            x: api.boss.x,
            y: api.boss.y - 8,
            vx: Math.cos(ang - 0.5) * DEALER_BULLET_SPEED,
            vy: Math.sin(ang - 0.5) * DEALER_BULLET_SPEED,
            ttlMs: 4200,
            maxBounces: 2,
          },
          sizePx: glow ? 8 : 6,
          glow,
          damage: 1,
          onHitBoss: glow ? () => claspHit() : undefined,
        });
      } else if (cmd.attackId === "triple-shot") {
        const base = aimAngle();
        const glowIdx = nextGlow() ? 1 : -1; // middle bullet may glow
        for (const [i, off] of [-0.22, 0, 0.22].entries()) {
          const glow = i === 1 && glowIdx === 1;
          fireBullet(base + off, glow);
          bulletCount += i === 1 ? 0 : 0; // spread counts as one pull
        }
      } else if (cmd.attackId === "teleport-shot") {
        fireBullet(aimAngle(), nextGlow());
      }
      // pistol-strike: the melee window is the shared boss attack zone.
    },

    update(dtMs) {
      const m = api.machine();
      if (m.fsm === "defeated") {
        clearLaser();
        return;
      }
      // The worn mask rides his face; fallen mask sits where it dropped.
      if (masked) mask.setPosition(api.boss.x + (api.boss.flipX ? -2 : 2), api.boss.y - 12);
      if (parryWarning) parryWarning.setPosition(api.boss.x, api.boss.y - 8);

      if (masked && !chasing && (m.fsm === "idle" || m.fsm === "recovery")) {
        if (scene.time.now >= nextStrafeFlipAt) {
          strafeDir = strafeDir === 1 ? -1 : 1;
          nextStrafeFlipAt = scene.time.now + 1100;
        }
        const nextX = dealerStrafeX(api.boss.x, api.player.x, strafeDir, dtMs, ARENA_W);
        if (nextX <= 48 || nextX >= ARENA_W - 48) strafeDir = strafeDir === 1 ? -1 : 1;
        api.boss.setX(nextX).setFlipX(api.player.x < nextX);
      }

      if (chasing) {
        // He glides toward the mask; reaching it re-masks him (fight resets
        // to the masked pool). Punt it by touching it or pressing E nearby.
        const dx = mask.x - api.boss.x;
        api.boss.setX(api.boss.x + Math.sign(dx) * 1.6);
        api.boss.play(animKey(api.def.id, "maskgrab"), true);
        const pDist = Math.abs(api.player.x - mask.x);
        if (shouldPuntDealerMask(punted, pDist, pDist < 60 && api.interactPressed())) {
          const dir = api.player.x < mask.x ? 1 : -1;
          mask.setX(Math.max(40, Math.min(ARENA_W - 40, mask.x + dir * 140)));
          mask.play(animKey(DEALER_MASK_SPRITES.key, "spin"));
          scene.time.delayedCall(400, () => mask.play(animKey(DEALER_MASK_SPRITES.key, "fallen")));
          api.sfx("select");
          punted = true;
        }
        api.setContextAction(
          pDist < 60 ? { key: "E", label: "KICK MASK" } : null,
        );
        if (Math.abs(dx) < 14) {
          // He got it back — re-mask and resume the masked pool.
          chasing = false;
          punted = false;
          pending.push({ kind: "force-phase", phaseIndex: 0, lock: true });
          remask();
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
      clearLaser();
      clearParryWarning();
      mask.destroy();
      api.setContextAction(null);
      api.setObjective(null);
      api.setSeals(null);
    },
  };
}
