import type Phaser from "phaser";
import type { BossMechanics, MechanicsApi } from "../BossController";
import type { MachineEvent, RtBossDef } from "../types";
import { animKey } from "../../art/textures";
import { VA_ARROW_SPRITE, VA_GLOW_ARROW_SPRITE } from "../../art/sprites/bosses2";

export const VEILED_ARCHER: RtBossDef = {
  id: "veiled-archer",
  name: "The Veiled Archer",
  maxHp: 35,
  contactDamage: 1,
  body: { w: 14, h: 28 },
  spriteFeetY: 32,
  phases: [
    { id: "first-flight", attackIds: ["direct-arrow", "arrow-rain", "triple-spread", "backstep-shot"] },
    { id: "second-flight", enterBelowHpFrac: 0.66, attackIds: ["direct-arrow", "arrow-rain", "triple-spread", "piercing-arrow", "arrow-trap", "backstep-shot"], tempoScale: 0.9 },
    { id: "final-flight", enterBelowHpFrac: 0.33, attackIds: ["direct-arrow", "arrow-rain", "triple-spread", "piercing-arrow", "arrow-trap", "backstep-shot", "cathedral-volley"], tempoScale: 0.8 },
  ],
  attacks: [
    { id: "direct-arrow", telegraphMs: 700, activeMs: 140, recoveryMs: 520, cooldownMs: 1500, damage: 1, weight: 4 },
    { id: "arrow-rain", telegraphMs: 900, activeMs: 700, recoveryMs: 650, cooldownMs: 3800, damage: 1, weight: 2 },
    { id: "triple-spread", telegraphMs: 650, activeMs: 180, recoveryMs: 560, cooldownMs: 3000, damage: 1, weight: 2 },
    { id: "piercing-arrow", telegraphMs: 900, activeMs: 220, recoveryMs: 800, cooldownMs: 4200, damage: 2, weight: 2, minRangePx: 80 },
    { id: "arrow-trap", telegraphMs: 700, activeMs: 300, recoveryMs: 600, cooldownMs: 4000, damage: 1, weight: 2 },
    { id: "backstep-shot", telegraphMs: 520, activeMs: 180, recoveryMs: 480, cooldownMs: 1800, parryable: true, damage: 1, weight: 4, maxRangePx: 70 },
    { id: "cathedral-volley", telegraphMs: 850, activeMs: 1200, recoveryMs: 750, cooldownMs: 5200, damage: 1, weight: 2 },
  ],
  arenaKey: "cathedral",
  track: "veiled-archer",
  spawn: { tx: 27, ty: 14 },
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

type Perch = { x: number; y: number };
const ARENA_W = 34 * 16;
const FLOOR_Y = 15 * 16;
const PERCHES: Perch[] = [
  { x: 72, y: FLOOR_Y - 18 },
  { x: ARENA_W / 2, y: FLOOR_Y - 52 },
  { x: ARENA_W - 72, y: FLOOR_Y - 18 },
];

export function chooseArcherPerch(
  playerX: number,
  _bossX: number,
  perches: readonly Perch[],
): Perch {
  return [...perches].sort((a, b) => Math.abs(b.x - playerX) - Math.abs(a.x - playerX))[0];
}

export function createVeiledArcherMechanics(scene: Phaser.Scene, api: MechanicsApi): BossMechanics {
  const pending: MachineEvent[] = [];
  let shotCount = 0;
  let aimLine: Phaser.GameObjects.Line | null = null;
  let relocating = false;
  api.setObjective("KEEP PRESSURE — SHE RELOCATES AFTER EVERY HIT");

  const clearAim = () => {
    aimLine?.destroy();
    aimLine = null;
  };

  const relocate = () => {
    if (relocating || api.machine().fsm === "defeated") return;
    relocating = true;
    const perch = chooseArcherPerch(api.player.x, api.boss.x, PERCHES);
    api.boss.play(animKey(api.def.id, "vanish"), true);
    scene.time.delayedCall(180, () => {
      if (api.machine().fsm === "defeated") return;
      api.boss.setPosition(perch.x, perch.y).setFlipX(api.player.x < perch.x);
      api.boss.play(animKey(api.def.id, "idle"), true);
      relocating = false;
    });
  };

  api.onSwingHit(api.boss, relocate);

  const aimAngle = () => Math.atan2(api.player.y - api.boss.y, api.player.x - api.boss.x);
  const spawnArrow = (angle: number, opts: { glow?: boolean; piercing?: boolean } = {}) => {
    const speed = opts.piercing ? 390 : 340;
    api.projectiles.spawn({
      spec: {
        kind: "linear",
        x: api.boss.x + Math.cos(angle) * 14,
        y: api.boss.y - 6 + Math.sin(angle) * 14,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ttlMs: 3000,
      },
      texture: { key: opts.glow ? VA_GLOW_ARROW_SPRITE.key : VA_ARROW_SPRITE.key, flipX: Math.cos(angle) < 0 },
      sizePx: opts.piercing ? 10 : 6,
      glow: opts.glow,
      damage: opts.piercing ? 2 : 1,
      throughWalls: opts.piercing,
      onHitBoss: opts.glow ? () => pending.push({ kind: "force-stagger", ms: 900 }) : undefined,
    });
  };

  return {
    onCommand(cmd) {
      if (cmd.kind === "anim" && cmd.anim === "damage") relocate();
      if (cmd.kind === "stagger") relocate();
      if (cmd.kind === "attack-start") {
        api.boss.setFlipX(api.player.x < api.boss.x);
        if (cmd.attackId !== "arrow-rain" && cmd.attackId !== "arrow-trap") {
          clearAim();
          const angle = aimAngle();
          aimLine = scene.add
            .line(0, 0, api.boss.x, api.boss.y - 6, api.boss.x + Math.cos(angle) * 520, api.boss.y - 6 + Math.sin(angle) * 520, 0xf4f0ff, 0.55)
            .setOrigin(0, 0)
            .setDepth(19);
        }
        if (cmd.attackId === "backstep-shot") {
          const dir = api.player.x < api.boss.x ? 1 : -1;
          scene.tweens.add({ targets: api.boss, x: Math.max(48, Math.min(ARENA_W - 48, api.boss.x + dir * 80)), duration: 260, ease: "Sine.easeOut" });
        } else if (cmd.attackId === "arrow-rain") {
          const px = api.player.x;
          api.hazards.spawnDebris({ xs: [px - 70, px - 24, px + 24, px + 70], delayMs: 900, damage: 1, speed: 340 });
        }
        return;
      }
      if (cmd.kind === "attack-end" || cmd.kind === "stagger" || cmd.kind === "defeated") clearAim();
      if (cmd.kind !== "attack-active") return;
      api.shapeAttack({ w: 2, h: 2, oy: -400 });
      const angle = aimAngle();
      if (cmd.attackId === "direct-arrow" || cmd.attackId === "backstep-shot") {
        shotCount += 1;
        spawnArrow(angle, { glow: shotCount % 2 === 0 });
      } else if (cmd.attackId === "triple-spread") {
        for (const offset of [-0.22, 0, 0.22]) spawnArrow(angle + offset, { glow: offset === 0 });
      } else if (cmd.attackId === "piercing-arrow") {
        spawnArrow(angle, { piercing: true });
      } else if (cmd.attackId === "arrow-trap") {
        for (const x of [api.player.x - 44, api.player.x, api.player.x + 44]) {
          api.hazards.spawnZone({ x, y: FLOOR_Y - 12, w: 22, h: 24, delayMs: 500, activeMs: 3000, damage: 1 });
        }
      } else if (cmd.attackId === "cathedral-volley") {
        for (const offset of [-0.38, -0.19, 0, 0.19, 0.38]) spawnArrow(angle + offset, { glow: offset === 0 });
      }
    },
    events() {
      const out = [...pending];
      pending.length = 0;
      return out;
    },
    destroy() {
      clearAim();
      scene.tweens.killTweensOf(api.boss);
      api.setObjective(null);
    },
  };
}
