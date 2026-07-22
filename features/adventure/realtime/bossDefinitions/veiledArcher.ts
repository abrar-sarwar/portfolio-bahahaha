// features/adventure/realtime/bossDefinitions/veiledArcher.ts
//
// THE VEILED ARCHER — World 1-4's cathedral boss. She is permanently armored
// against ordinary boss-body damage: selected spectral arrows become temporary
// stairs, and reaching her opens one short "catch". A swing during that window
// emits exactly one mechanic hit, she vanishes to the next ledge, and the third
// catch hands the normal defeated beat to Task 42's post-fight cutscene.
import type Phaser from "phaser";
import type { BossMechanics, MechanicsApi } from "../BossController";
import type { MachineEvent, RtBossDef } from "../types";
import { animKey } from "../../art/textures";
import {
  VA_ARROW_PLATFORM_SPRITE,
  VA_ARROW_SPRITE,
  VA_GLOW_ARROW_SPRITE,
} from "../../art/sprites/bosses2";

export const VEILED_ARCHER: RtBossDef = {
  id: "veiled-archer",
  name: "The Veiled Archer",
  maxHp: 3,
  contactDamage: 1,
  invulnerableBaseline: true,
  damageScale: { attack: 0, stomp: 0 },
  body: { w: 14, h: 28 },
  spriteFeetY: 32,
  phases: [
    { id: "first-ledge", attackIds: ["direct-arrow", "arrow-rain", "triple-spread", "backstep-shot"] },
    { id: "second-ledge", attackIds: ["direct-arrow", "arrow-rain", "triple-spread", "piercing-arrow", "arrow-trap", "backstep-shot"], tempoScale: 0.88 },
    { id: "final-ledge", attackIds: ["direct-arrow", "arrow-rain", "triple-spread", "piercing-arrow", "arrow-trap", "backstep-shot", "cathedral-volley"], tempoScale: 0.76 },
  ],
  attacks: [
    { id: "direct-arrow", telegraphMs: 700, activeMs: 140, recoveryMs: 520, cooldownMs: 1500, damage: 1, weight: 4 },
    { id: "arrow-rain", telegraphMs: 900, activeMs: 700, recoveryMs: 650, cooldownMs: 3800, damage: 1, weight: 2 },
    { id: "triple-spread", telegraphMs: 650, activeMs: 180, recoveryMs: 560, cooldownMs: 3000, damage: 1, weight: 2 },
    { id: "piercing-arrow", telegraphMs: 900, activeMs: 220, recoveryMs: 800, cooldownMs: 4200, damage: 2, weight: 2, minRangePx: 80 },
    { id: "arrow-trap", telegraphMs: 700, activeMs: 300, recoveryMs: 600, cooldownMs: 4000, damage: 1, weight: 2 },
    { id: "backstep-shot", telegraphMs: 420, activeMs: 180, recoveryMs: 480, cooldownMs: 1800, damage: 1, weight: 4, maxRangePx: 70 },
    { id: "cathedral-volley", telegraphMs: 850, activeMs: 1200, recoveryMs: 750, cooldownMs: 5200, damage: 1, weight: 2 },
  ],
  arenaKey: "cathedral",
  track: "veiled-archer",
  spawn: { tx: 24, ty: 5 },
  animFor: (anim, ctx) => {
    if (anim === "telegraph") {
      if (ctx.attackId === "backstep-shot") return "backstep";
      if (ctx.attackId === "cathedral-volley") return "volley";
      return "aim";
    }
    if (anim === "attack") return ctx.attackId === "cathedral-volley" ? "volley" : "release";
    if (anim === "stagger") return "vulnerable";
    if (anim === "transition") return "vanish";
    if (anim === "damage") return "hurt";
    if (anim === "defeat") return "defeat";
    return null;
  },
};

const ARENA_W = 46 * 16;
const FLOOR_Y = 15 * 16;
const CATCH_MS = 2500;
const PERCHES = [
  { x: 24 * 16 + 8, y: 80 },
  { x: 16 * 16 + 8, y: 128 },
  { x: 32 * 16 + 8, y: 128 },
] as const;

export function createVeiledArcherMechanics(scene: Phaser.Scene, api: MechanicsApi): BossMechanics {
  const pending: MachineEvent[] = [];
  let catches = 0;
  let catchOpen = false;
  let shotCount = 0;
  let aimLine: Phaser.GameObjects.Line | null = null;
  let exposureTimer: Phaser.Time.TimerEvent | null = null;

  api.setObjective("USE HER GLOWING ARROWS TO CLOSE THE DISTANCE");

  const clearAim = () => {
    aimLine?.destroy();
    aimLine = null;
  };

  const moveToPerch = (index: number) => {
    const perch = PERCHES[Math.min(index, PERCHES.length - 1)];
    api.boss.play(animKey(api.def.id, "vanish"), true);
    scene.time.delayedCall(220, () => {
      if (api.machine().fsm === "defeated") return;
      api.boss.setPosition(perch.x, perch.y);
      api.boss.play(animKey(api.def.id, "idle"), true);
    });
  };

  const closeExposure = () => {
    catchOpen = false;
    exposureTimer = null;
    if (api.machine().fsm !== "defeated") {
      api.setObjective("USE HER GLOWING ARROWS TO CLOSE THE DISTANCE");
    }
  };

  const openExposure = (ms = CATCH_MS) => {
    if (catchOpen || api.machine().fsm === "defeated") return;
    catchOpen = true;
    pending.push({ kind: "force-stagger", ms });
    api.setObjective("CLOSE IN — LAND ONE CATCH");
    api.sfx("expose");
    exposureTimer?.remove(false);
    exposureTimer = scene.time.delayedCall(ms, closeExposure);
  };

  // Ordinary boss-body hits stay blocked by baseline armor. This second swing
  // registration is the one-catch-per-opening weak-point contract.
  api.onSwingHit(api.boss, () => {
    if (!catchOpen || api.machine().fsm === "defeated") return;
    catchOpen = false;
    exposureTimer?.remove(false);
    exposureTimer = null;
    catches += 1;
    pending.push({ kind: "hit", amount: 1, source: "mechanic" });
    api.sfx("boss-hit");
    api.setObjective(catches < 3 ? `CATCHES LANDED: ${catches} / 3` : null);
    if (catches < 3) {
      pending.push({ kind: "force-phase", phaseIndex: catches, lock: true });
      moveToPerch(catches);
    }
  });

  const spawnArrow = (angle: number, opts: { glow?: boolean; piercing?: boolean } = {}) => {
    const speed = opts.piercing ? 430 : 380;
    api.projectiles.spawn({
      spec: {
        kind: "linear",
        x: api.boss.x + Math.cos(angle) * 14,
        y: api.boss.y - 6 + Math.sin(angle) * 14,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ttlMs: 3000,
      },
      texture: {
        key: opts.glow ? VA_GLOW_ARROW_SPRITE.key : VA_ARROW_SPRITE.key,
        flipX: Math.cos(angle) < 0,
      },
      sizePx: opts.piercing ? 10 : 6,
      glow: opts.glow,
      damage: opts.piercing ? 2 : 1,
      throughWalls: opts.piercing,
      onHitBoss: opts.glow ? () => openExposure(1500) : undefined,
    });
  };

  const aimAngle = () => Math.atan2(api.player.y - api.boss.y, api.player.x - api.boss.x);

  const buildArrowStair = () => {
    const fromX = api.player.x;
    const toX = api.boss.x;
    for (let i = 1; i <= 3; i++) {
      api.hazards.spawnPlatform({
        x: fromX + ((toX - fromX) * i) / 4,
        y: FLOOR_Y - i * 35,
        w: 34,
        h: 7,
        ttlMs: 6000,
        texture: { key: VA_ARROW_PLATFORM_SPRITE.key },
      });
    }
    api.setObjective("CLIMB THE EMBEDDED ARROWS");
  };

  return {
    onCommand(cmd) {
      if (cmd.kind === "attack-start") {
        api.boss.setFlipX(api.player.x < api.boss.x);
        if (cmd.attackId !== "arrow-rain" && cmd.attackId !== "arrow-trap") {
          clearAim();
          const angle = aimAngle();
          aimLine = scene.add
            .line(0, 0, api.boss.x, api.boss.y - 6, api.boss.x + Math.cos(angle) * 520, api.boss.y - 6 + Math.sin(angle) * 520, 0xf4f0ff, 0.45)
            .setOrigin(0, 0)
            .setDepth(19);
        }
        if (cmd.attackId === "backstep-shot") {
          const dir = api.player.x < api.boss.x ? 1 : -1;
          scene.tweens.add({
            targets: api.boss,
            x: Math.max(48, Math.min(ARENA_W - 48, api.boss.x + dir * 80)),
            y: api.boss.y - 24,
            duration: 260,
            yoyo: true,
            ease: "Sine.easeOut",
          });
        } else if (cmd.attackId === "arrow-rain") {
          const px = api.player.x;
          api.hazards.spawnDebris({ xs: [px - 70, px - 24, px + 24, px + 70], delayMs: 900, damage: 1, speed: 380 });
        }
        return;
      }

      if (cmd.kind === "attack-end" || cmd.kind === "stagger" || cmd.kind === "defeated") clearAim();
      if (cmd.kind !== "attack-active") return;
      // Projectile attacks own their hit geometry; suppress the generic melee
      // zone so standing under a ledge never causes an invisible body strike.
      api.shapeAttack({ w: 2, h: 2, oy: -400 });
      const angle = aimAngle();

      if (cmd.attackId === "direct-arrow" || cmd.attackId === "backstep-shot") {
        shotCount += 1;
        const glow = shotCount % 2 === 0;
        spawnArrow(angle, { glow });
        if (glow) scene.time.delayedCall(700, buildArrowStair);
      } else if (cmd.attackId === "triple-spread") {
        for (const offset of [-0.22, 0, 0.22]) spawnArrow(angle + offset);
      } else if (cmd.attackId === "piercing-arrow") {
        spawnArrow(angle, { piercing: true });
      } else if (cmd.attackId === "arrow-trap") {
        for (const x of [api.player.x - 44, api.player.x, api.player.x + 44]) {
          api.hazards.spawnZone({ x, y: FLOOR_Y - 12, w: 22, h: 24, delayMs: 500, activeMs: 4000, damage: 1 });
        }
      } else if (cmd.attackId === "cathedral-volley") {
        for (const offset of [-0.38, -0.19, 0, 0.19, 0.38]) spawnArrow(angle + offset, { glow: offset === 0 });
        scene.time.delayedCall(650, buildArrowStair);
      }
    },

    update() {
      if (api.machine().fsm === "defeated") return;
      // Reaching her ledge is the primary opening; reflected glowing arrows are
      // the alternate opening handled by onHitBoss above.
      const dx = Math.abs(api.player.x - api.boss.x);
      const dy = Math.abs(api.player.y - api.boss.y);
      if (!catchOpen && dx < 44 && dy < 54) openExposure();
    },

    events() {
      const out = [...pending];
      pending.length = 0;
      return out;
    },

    destroy() {
      clearAim();
      exposureTimer?.remove(false);
      api.setObjective(null);
    },
  };
}
