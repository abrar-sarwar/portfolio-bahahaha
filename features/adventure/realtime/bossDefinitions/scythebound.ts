// features/adventure/realtime/bossDefinitions/scythebound.ts
//
// THE SCYTHEBOUND — World 1-4 mini-boss (amendment Task 40; boss-demands memo).
// NO hp win: damageScale zeroes everything and hp never moves — the ONLY defeat
// path is FIFTEEN STOMPS (`STOMPS: n / 15` objective). Stomps bypass the
// machine, so each one emits force-stagger (the stun + post-stun grace) and the
// tier escalation rides force-phase{lock} at stomps 5 / 10 / 14:
//   1–5 slow (sweep+overhead) · 6–10 faster (+leap) · 11–14 (+spin+throw) ·
//   15 = the finishing impact → forceDefeat → he crashes through the wall.
// Stompable = grounded and not spinning (head top-third via StompSystem).
import type { MachineEvent, RtBossDef } from "../types";
import type { BossMechanics, MechanicsApi } from "../BossController";
import { animKey } from "../../art/textures";
import { SCYTHE_PROJECTILE_SPRITES } from "../../art/sprites/bosses2";
import type Phaser from "phaser";

export const SCYTHEBOUND: RtBossDef = {
  id: "scythebound",
  name: "The Scythebound",
  maxHp: 15, // thematic only — hp NEVER moves (damageScale 0 / contact-only threat)
  contactDamage: 1,
  hideHealthBar: true,
  damageScale: { attack: 0, stomp: 0 },
  body: { w: 20, h: 32 },
  spriteFeetY: 36,
  phases: [
    { id: "waxing", attackIds: ["sweep", "overhead"] }, // stomps 1–5
    { id: "quickening", attackIds: ["sweep", "overhead", "leap"], tempoScale: 0.85 },
    { id: "reaping", attackIds: ["sweep", "overhead", "leap", "spin", "throw"], tempoScale: 0.75 },
    { id: "final", attackIds: ["sweep", "overhead"], tempoScale: 0.7 }, // stomp 15 window
  ],
  attacks: [
    // Horizontal sweep — jump over it.
    {
      id: "sweep",
      telegraphMs: 500,
      activeMs: 240,
      recoveryMs: 500,
      cooldownMs: 1800,
      damage: 1,
      weight: 3,
      maxRangePx: 120,
    },
    // Leap + downward slam; the long recovery IS the taught stomp window.
    {
      id: "overhead",
      telegraphMs: 800,
      activeMs: 300,
      recoveryMs: 1300,
      cooldownMs: 3200,
      damage: 1,
      weight: 3,
    },
    // High leap over the player, backstrike on landing; whiff = stomp window.
    {
      id: "leap",
      telegraphMs: 500,
      activeMs: 700,
      recoveryMs: 1100,
      cooldownMs: 3600,
      damage: 1,
      weight: 2,
      minRangePx: 50,
    },
    // Moving spin across the yard — UNSTOMPABLE while spinning; use the ledges.
    {
      id: "spin",
      telegraphMs: 600,
      activeMs: 2200,
      recoveryMs: 700,
      cooldownMs: 5600,
      damage: 1,
      weight: 2,
    },
    // Boomerang scythe; he chases unarmed (still stompable) until the catch.
    {
      id: "throw",
      telegraphMs: 600,
      activeMs: 1400,
      recoveryMs: 900,
      cooldownMs: 5200,
      damage: 1,
      weight: 2,
      minRangePx: 70,
    },
  ],
  arenaKey: "courtyard",
  track: "scythebound",
  spawn: { tx: 30, ty: 14 },
  animFor: (anim, ctx) => {
    const perAttack: Record<string, Record<string, string>> = {
      telegraph: {
        sweep: "sweep-prep",
        overhead: "overhead-leap",
        leap: "high-leap",
        spin: "spin",
        throw: "throw",
      },
      attack: {
        sweep: "sweep",
        overhead: "overhead-slam",
        leap: "high-leap",
        spin: "spin",
        throw: "throw",
      },
    };
    if ((anim === "telegraph" || anim === "attack") && ctx.attackId) {
      return perAttack[anim][ctx.attackId] ?? null;
    }
    if (anim === "stagger") return "stun";
    if (anim === "damage") return "hurt";
    if (anim === "defeat") return "defeat";
    if (anim === "move") return "run";
    return null;
  },
};

const STOMPS_TO_WIN = 15;
const STUN_MS = 900;
const ARENA_W = 40 * 16;

export function createScytheboundMechanics(scene: Phaser.Scene, api: MechanicsApi): BossMechanics {
  const pending: MachineEvent[] = [];
  let stomps = 0;
  let scytheOut = false;

  api.setObjective(`STOMPS: 0 / ${STOMPS_TO_WIN}`);

  // The scene classifies stomp CONTACT; a mechanics-armed listener converts it
  // into the counter (the machine's stomp damage is zeroed — this is the win).
  // BossArenaScene emits {hit, source:"stomp"} through the shared combat
  // controller; we read those events via onCommand? No — stomps arrive as
  // machine events the reducer ignores (damage 0). The mechanics instead
  // watches the SAME contact through its own registration:
  const disposeStomp = api.onStomp(() => onStomp());

  const stompable = () => {
    const m = api.machine();
    return !(m.fsm === "attack" && m.currentAttackId === "spin");
  };

  function onStomp(): boolean {
    if (!stompable() || api.machine().fsm === "defeated") return false;
    stomps += 1;
    api.sfx("stomp");
    api.setObjective(`STOMPS: ${stomps} / ${STOMPS_TO_WIN}`);
    if (stomps >= STOMPS_TO_WIN) {
      api.forceDefeat(); // the 15th: crash-through beat plays on defeat anim
      return true;
    }
    // Stun + grace (the machine can't see zero-damage stomps — force it).
    pending.push({ kind: "force-stagger", ms: STUN_MS });
    if (stomps === 5) pending.push({ kind: "force-phase", phaseIndex: 1, lock: true });
    else if (stomps === 10) pending.push({ kind: "force-phase", phaseIndex: 2, lock: true });
    else if (stomps === 14) pending.push({ kind: "force-phase", phaseIndex: 3, lock: true });
    return true;
  }

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
        // He leaps to the player's column and slams.
        const targetX = Math.max(40, Math.min(ARENA_W - 40, api.player.x));
        scene.tweens.add({ targets: api.boss, x: targetX, y: api.boss.y - 40, duration: 140, yoyo: true });
        api.shapeAttack({ w: 60, h: 44, ox: 0, oy: 4 });
      } else if (cmd.attackId === "leap") {
        // Cross over the player and strike behind.
        const targetX = Math.max(40, Math.min(ARENA_W - 40, api.player.x + dir * 70));
        scene.tweens.add({
          targets: api.boss,
          x: targetX,
          y: api.boss.y - 56,
          duration: 330,
          yoyo: true,
          ease: "Sine.easeOut",
        });
        api.shapeAttack({ w: 52, h: 40 });
      } else if (cmd.attackId === "spin") {
        // Travel the yard while spinning (unstompable — see stompable()).
        const targetX = api.boss.x < ARENA_W / 2 ? ARENA_W - 56 : 56;
        scene.tweens.add({ targets: api.boss, x: targetX, duration: 2100, ease: "Sine.easeInOut" });
        api.shapeAttack({ w: 56, h: 40 });
      } else if (cmd.attackId === "throw") {
        scytheOut = true;
        api.projectiles.spawn({
          spec: {
            kind: "arc",
            x: api.boss.x + dir * 14,
            y: api.boss.y - 10,
            vx: dir * 250,
            vy: -60,
            gravity: 120,
            ttlMs: 1400,
          },
          texture: { key: SCYTHE_PROJECTILE_SPRITES.key, anim: "spin", flipX: dir === -1 },
          damage: 1,
        });
        scene.time.delayedCall(1450, () => {
          scytheOut = false;
          if (api.machine().fsm !== "defeated") api.boss.play(animKey(api.def.id, "idle"), true);
        });
        // Unarmed chase while the scythe flies: drift toward the player.
        api.shapeAttack({ w: 30, h: 34 });
      }
    },

    update() {
      const m = api.machine();
      if (m.fsm === "defeated") return;
      // Unarmed chase drift during the throw's flight window.
      if (scytheOut && m.fsm === "attack" && m.currentAttackId === "throw") {
        const dx = api.player.x - api.boss.x;
        api.boss.setX(api.boss.x + Math.sign(dx) * 1.1);
        api.boss.play(animKey(api.def.id, "chase"), true);
      }
    },

    events() {
      const out = [...pending];
      pending.length = 0;
      return out;
    },

    destroy() {
      disposeStomp();
      api.setObjective(null);
    },
  };
}
