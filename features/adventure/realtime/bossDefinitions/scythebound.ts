import type { RtBossDef } from "../types";
import type { BossMechanics, MechanicsApi } from "../BossController";
import { animKey } from "../../art/textures";
import { SCYTHE_PROJECTILE_SPRITES } from "../../art/sprites/bosses2";
import type Phaser from "phaser";

export const SCYTHEBOUND: RtBossDef = {
  id: "scythebound",
  name: "The Scythebound",
  maxHp: 55,
  contactDamage: 1,
  body: { w: 20, h: 32 },
  spriteFeetY: 36,
  phases: [
    { id: "waxing", attackIds: ["sweep", "overhead", "throw"] },
    { id: "quickening", enterBelowHpFrac: 0.65, attackIds: ["sweep", "overhead", "leap", "throw"], tempoScale: 0.88 },
    { id: "reaping", enterBelowHpFrac: 0.3, attackIds: ["sweep", "overhead", "leap", "spin", "throw"], tempoScale: 0.78 },
  ],
  attacks: [
    { id: "sweep", telegraphMs: 560, activeMs: 240, recoveryMs: 560, cooldownMs: 1800, parryable: true, damage: 1, weight: 3, maxRangePx: 120 },
    { id: "overhead", telegraphMs: 800, activeMs: 300, recoveryMs: 1000, cooldownMs: 3000, damage: 1, weight: 3 },
    { id: "leap", telegraphMs: 620, activeMs: 700, recoveryMs: 850, cooldownMs: 3300, damage: 1, weight: 2, minRangePx: 50 },
    { id: "spin", telegraphMs: 700, activeMs: 1700, recoveryMs: 800, cooldownMs: 5200, damage: 1, weight: 2 },
    { id: "throw", telegraphMs: 700, activeMs: 1400, recoveryMs: 760, cooldownMs: 4600, damage: 1, weight: 2, minRangePx: 70 },
  ],
  arenaKey: "courtyard",
  track: "scythebound",
  spawn: { tx: 30, ty: 14 },
  animFor: (anim, ctx) => {
    const perAttack: Record<string, Record<string, string>> = {
      telegraph: { sweep: "sweep-prep", overhead: "overhead-leap", leap: "high-leap", spin: "spin", throw: "throw" },
      attack: { sweep: "sweep", overhead: "overhead-slam", leap: "high-leap", spin: "spin", throw: "throw" },
    };
    if ((anim === "telegraph" || anim === "attack") && ctx.attackId) return perAttack[anim][ctx.attackId] ?? null;
    if (anim === "stagger") return "stun";
    if (anim === "damage") return "hurt";
    if (anim === "defeat") return "defeat";
    if (anim === "move") return "run";
    return null;
  },
};

const ARENA_W = 40 * 16;

export function scythePursuitX(
  bossX: number,
  playerX: number,
  dtMs: number,
  arenaWidth: number,
): number {
  const direction = Math.sign(playerX - bossX);
  return Math.max(48, Math.min(arenaWidth - 48, bossX + direction * 0.1 * dtMs));
}

export function createScytheboundMechanics(scene: Phaser.Scene, api: MechanicsApi): BossMechanics {
  let scytheOut = false;
  api.setObjective("BREAK HIS GUARD — SWORD OR STOMP");

  return {
    onCommand(cmd) {
      if (cmd.kind === "attack-start") {
        api.boss.setFlipX(api.player.x < api.boss.x);
        return;
      }
      if (cmd.kind !== "attack-active") return;
      const dir: 1 | -1 = api.player.x < api.boss.x ? -1 : 1;
      if (cmd.attackId === "sweep") {
        api.shapeAttack({ w: 96, h: 30, ox: dir * 34, oy: 6 });
      } else if (cmd.attackId === "overhead") {
        const targetX = Math.max(48, Math.min(ARENA_W - 48, api.player.x));
        scene.tweens.add({ targets: api.boss, x: targetX, y: api.boss.y - 40, duration: 170, yoyo: true });
        api.shapeAttack({ w: 60, h: 44, ox: 0, oy: 4 });
      } else if (cmd.attackId === "leap") {
        const targetX = Math.max(48, Math.min(ARENA_W - 48, api.player.x + dir * 70));
        scene.tweens.add({ targets: api.boss, x: targetX, y: api.boss.y - 56, duration: 330, yoyo: true, ease: "Sine.easeOut" });
        api.shapeAttack({ w: 52, h: 40 });
      } else if (cmd.attackId === "spin") {
        const targetX = api.boss.x < ARENA_W / 2 ? ARENA_W - 56 : 56;
        scene.tweens.add({ targets: api.boss, x: targetX, duration: 1650, ease: "Sine.easeInOut" });
        api.shapeAttack({ w: 56, h: 40 });
      } else if (cmd.attackId === "throw") {
        scytheOut = true;
        api.shapeAttack({ w: 2, h: 2, oy: -400 });
        api.projectiles.spawn({
          spec: { kind: "arc", x: api.boss.x + dir * 14, y: api.boss.y - 10, vx: dir * 230, vy: -60, gravity: 120, ttlMs: 1400 },
          texture: { key: SCYTHE_PROJECTILE_SPRITES.key, anim: "spin", flipX: dir === -1 },
          damage: 1,
        });
        scene.time.delayedCall(1450, () => { scytheOut = false; });
      }
    },

    update(dtMs) {
      const machine = api.machine();
      if (machine.fsm === "defeated") return;
      if (machine.fsm === "idle" || machine.fsm === "recovery" || scytheOut) {
        const nextX = scythePursuitX(api.boss.x, api.player.x, dtMs, ARENA_W);
        api.boss.setX(nextX).setFlipX(api.player.x < nextX);
        const moveAnim = animKey(api.def.id, scytheOut ? "chase" : "run");
        if (scene.anims.exists(moveAnim)) api.boss.play(moveAnim, true);
      }
    },

    events: () => [],
    destroy() {
      scene.tweens.killTweensOf(api.boss);
      api.setObjective(null);
    },
  };
}
