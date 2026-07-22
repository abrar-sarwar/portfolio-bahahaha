// THE DEVIL KING — final encounter. Phase one is a fair, human-scale sword
// duel. Below half health he unfolds the four stolen weapons and becomes
// armored: each weapon teaches its own answer, breaking one arsenal seal.
// All four seals open a six-second damage window; missed windows recur so the
// finale can never soft-lock after the player has solved it once.
import type Phaser from "phaser";
import type { BossMechanics, MechanicsApi } from "../BossController";
import type { MachineEvent, RtBossDef } from "../types";
import { audio } from "../../audio/synth";
import {
  allArsenalSealsBroken,
  arsenalPhaseForElapsed,
  breakArsenalSeal,
  brokenSealCount,
  devilBladePreview,
  devilDuelTargetX,
  emptyArsenalSeals,
  type ArsenalSeal,
} from "./devilKingLogic";

const SWORD_ATTACKS = [
  "quick-slash", "delayed-slash", "dash-cut", "air-slash", "sword-wave",
  "counter-stance", "three-hit",
];
const BOW_ATTACKS = ["bow-direct", "bow-rain", "bow-spread", "bow-explosive"];
const SPEAR_ATTACKS = ["spear-thrust", "spear-launch", "spear-spin", "spear-line"];
const HAMMER_ATTACKS = ["hammer-slam", "hammer-shockwave", "hammer-break", "hammer-double"];

export const DEVIL_KING: RtBossDef = {
  id: "devil-king",
  name: "The Devil King",
  maxHp: 100,
  contactDamage: 1,
  body: { w: 18, h: 36 },
  spriteFeetY: 37,
  phases: [
    { id: "duel", attackIds: SWORD_ATTACKS },
    { id: "arsenal-sword", enterBelowHpFrac: 0.51, attackIds: SWORD_ATTACKS, tempoScale: 0.9 },
    { id: "arsenal-bow", attackIds: BOW_ATTACKS, tempoScale: 0.88 },
    { id: "arsenal-spear", attackIds: SPEAR_ATTACKS, tempoScale: 0.86 },
    { id: "arsenal-hammer", attackIds: HAMMER_ATTACKS, tempoScale: 0.84 },
    { id: "mixed-arsenal", attackIds: [...SWORD_ATTACKS, ...BOW_ATTACKS, ...SPEAR_ATTACKS, ...HAMMER_ATTACKS], tempoScale: 0.78 },
  ],
  attacks: [
    { id: "quick-slash", telegraphMs: 620, activeMs: 150, recoveryMs: 480, cooldownMs: 900, parryable: true, damage: 1, weight: 5, maxRangePx: 78 },
    { id: "delayed-slash", telegraphMs: 920, activeMs: 190, recoveryMs: 720, cooldownMs: 2100, parryable: true, damage: 2, weight: 2, maxRangePx: 94 },
    { id: "dash-cut", telegraphMs: 620, activeMs: 500, recoveryMs: 650, cooldownMs: 2500, parryable: true, damage: 1, weight: 3, minRangePx: 70 },
    { id: "air-slash", telegraphMs: 700, activeMs: 520, recoveryMs: 700, cooldownMs: 3000, damage: 1, weight: 2 },
    { id: "sword-wave", telegraphMs: 760, activeMs: 220, recoveryMs: 720, cooldownMs: 3000, damage: 1, weight: 2, minRangePx: 80 },
    { id: "counter-stance", telegraphMs: 700, activeMs: 950, recoveryMs: 650, cooldownMs: 4400, damage: 1, weight: 1 },
    { id: "three-hit", telegraphMs: 720, activeMs: 720, recoveryMs: 820, cooldownMs: 3600, parryable: true, damage: 2, weight: 2, maxRangePx: 100 },

    { id: "bow-direct", telegraphMs: 620, activeMs: 160, recoveryMs: 500, cooldownMs: 1200, damage: 1, weight: 4 },
    { id: "bow-rain", telegraphMs: 820, activeMs: 760, recoveryMs: 650, cooldownMs: 3200, damage: 1, weight: 2 },
    { id: "bow-spread", telegraphMs: 660, activeMs: 180, recoveryMs: 580, cooldownMs: 2200, damage: 1, weight: 3 },
    { id: "bow-explosive", telegraphMs: 900, activeMs: 220, recoveryMs: 760, cooldownMs: 3000, damage: 2, weight: 3 },

    { id: "spear-thrust", telegraphMs: 620, activeMs: 220, recoveryMs: 520, cooldownMs: 1200, parryable: true, damage: 1, weight: 4, maxRangePx: 112 },
    { id: "spear-launch", telegraphMs: 700, activeMs: 460, recoveryMs: 620, cooldownMs: 2600, damage: 1, weight: 2 },
    { id: "spear-spin", telegraphMs: 740, activeMs: 850, recoveryMs: 720, cooldownMs: 3200, damage: 2, weight: 2, maxRangePx: 86 },
    { id: "spear-line", telegraphMs: 900, activeMs: 800, recoveryMs: 850, cooldownMs: 3400, damage: 2, weight: 3 },

    { id: "hammer-slam", telegraphMs: 820, activeMs: 260, recoveryMs: 800, cooldownMs: 1900, damage: 2, weight: 4, maxRangePx: 92 },
    { id: "hammer-shockwave", telegraphMs: 760, activeMs: 260, recoveryMs: 720, cooldownMs: 2400, damage: 1, weight: 3 },
    { id: "hammer-break", telegraphMs: 1050, activeMs: 320, recoveryMs: 1500, cooldownMs: 3600, damage: 2, weight: 3 },
    { id: "hammer-double", telegraphMs: 900, activeMs: 700, recoveryMs: 950, cooldownMs: 3800, damage: 2, weight: 2 },
  ],
  arenaKey: "rift-throne",
  track: "devil-duel",
  spawn: { tx: 46, ty: 15 },
  animFor: (anim, ctx) => {
    const id = ctx.attackId ?? "";
    if (anim === "telegraph") {
      if (id === "delayed-slash") return "delayed";
      if (id === "counter-stance") return "counter";
      if (id.startsWith("bow-")) return "bow";
      if (id.startsWith("spear-")) return id === "spear-spin" ? "spear-spin" : "spear";
      if (id.startsWith("hammer-")) return "hammer";
      return "slash-prep";
    }
    if (anim === "attack") {
      if (id === "dash-cut") return "dash";
      if (id === "air-slash") return "air";
      if (id === "counter-stance") return "counter";
      if (id.startsWith("bow-")) return "bow";
      if (id.startsWith("spear-")) return id === "spear-spin" ? "spear-spin" : "spear";
      if (id.startsWith("hammer-")) return "hammer-slam";
      return "slash";
    }
    if (anim === "transition") return "transform";
    if (anim === "damage" || anim === "stagger") return "hurt";
    if (anim === "defeat") return "defeat";
    if (anim === "move") return "move";
    return null;
  },
};

const ARENA_W = 52 * 16;
const FLOOR_Y = 16 * 16;
const ARSENAL_FORM_MS = 15_000;
const EXPOSURE_MS = 6_000;
const EXPOSURE_COOLDOWN_MS = 7_000;

export function createDevilKingMechanics(scene: Phaser.Scene, api: MechanicsApi): BossMechanics {
  const pending: MachineEvent[] = [];
  let seals = emptyArsenalSeals();
  let arsenalStart: number | null = null;
  let currentForm = 0;
  let lastAttack = "";
  let counterActive = false;
  let spearLineUntil = 0;
  let hammerStuckUntil = 0;
  let exposedUntil = 0;
  let nextExposureAt = Number.POSITIVE_INFINITY;
  let bladePreview: Phaser.GameObjects.Line | null = null;

  const inArsenal = () => arsenalStart !== null;
  const dir = (): 1 | -1 => (api.player.x < api.boss.x ? -1 : 1);
  const aim = () => Math.atan2(api.player.y - api.boss.y, api.player.x - api.boss.x);
  const clearBladePreview = () => {
    bladePreview?.destroy();
    bladePreview = null;
  };

  const setArsenalObjective = () => {
    const count = brokenSealCount(seals);
    api.setSeals({ lit: count, of: 4 });
    api.setObjective(count < 4 ? `BREAK THE ARSENAL SEALS: ${count} / 4` : "THE RIFT IS OPEN — STRIKE");
  };

  const openExposure = () => {
    if (api.machine().fsm === "defeated") return;
    exposedUntil = scene.time.now + EXPOSURE_MS;
    nextExposureAt = exposedUntil + EXPOSURE_COOLDOWN_MS;
    pending.push({ kind: "set-invulnerable", value: false });
    pending.push({ kind: "force-stagger", ms: EXPOSURE_MS });
    api.setObjective("THE RIFT IS OPEN — STRIKE");
    api.sfx("expose");
  };

  const shatter = (seal: ArsenalSeal) => {
    if (!inArsenal() || seals[seal]) return;
    seals = breakArsenalSeal(seals, seal);
    api.sfx("seal");
    setArsenalObjective();
    if (allArsenalSealsBroken(seals)) openExposure();
  };

  const fireArrow = (angle: number, explosive = false) => {
    const speed = explosive ? 280 : 390;
    api.projectiles.spawn({
      spec: {
        kind: "linear",
        x: api.boss.x + Math.cos(angle) * 16,
        y: api.boss.y - 7 + Math.sin(angle) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ttlMs: 3300,
      },
      sizePx: explosive ? 10 : 6,
      color: explosive ? 0xef4444 : 0xc4b5fd,
      glow: explosive,
      damage: explosive ? 2 : 1,
      onHitBoss: explosive ? () => shatter("bow") : undefined,
    });
  };

  // Counter-punish: ordinary swing damage is blocked by the stance armor; the
  // response appears at the player's feet with a short reaction tell.
  api.onSwingHit(api.boss, () => {
    if (!counterActive || api.machine().fsm === "defeated") return;
    counterActive = false;
    api.hazards.spawnZone({ x: api.player.x, y: api.player.y, w: 34, h: 42, delayMs: 180, activeMs: 260, damage: 1 });
    api.sfx("telegraph");
  });

  const disposeStomp = api.onStomp(() => {
    if (!inArsenal() || scene.time.now > hammerStuckUntil || seals.hammer) return false;
    hammerStuckUntil = 0;
    shatter("hammer");
    return true;
  });

  return {
    onCommand(cmd) {
      if (cmd.kind === "stagger" || cmd.kind === "defeated" || cmd.kind === "phase") {
        clearBladePreview();
        scene.tweens.killTweensOf(api.boss);
      }
      if (cmd.kind === "phase") {
        if (cmd.phaseIndex === 1 && arsenalStart === null) {
          arsenalStart = scene.time.now;
          currentForm = 1;
          audio.playTrack("devil-arsenal");
          pending.push({ kind: "set-invulnerable", value: true });
          api.boss.play("devil-king:transform", true);
          setArsenalObjective();
          api.sfx("weapon-swap");
        } else if (cmd.phaseIndex > 1) {
          currentForm = cmd.phaseIndex;
          api.sfx("weapon-swap");
        }
        return;
      }

      if (cmd.kind === "stagger") {
        if (inArsenal() && SWORD_ATTACKS.includes(lastAttack)) shatter("sword");
        counterActive = false;
        return;
      }

      if (cmd.kind === "attack-start") {
        lastAttack = cmd.attackId;
        api.boss.setFlipX(api.player.x < api.boss.x);
        clearBladePreview();
        const d = dir();
        const preview = devilBladePreview(cmd.attackId, d);
        if (preview) {
          const spec = api.def.attacks.find((attack) => attack.id === cmd.attackId);
          const color = spec?.parryable ? 0xffd75e : 0xef4444;
          const startX = api.boss.x + d * 8;
          const endX = api.boss.x + preview.offsetX + d * preview.width / 2;
          bladePreview = scene.add
            .line(0, 0, startX, api.boss.y, endX, api.boss.y, color, 0.82)
            .setOrigin(0, 0)
            .setLineWidth(3, 1)
            .setDepth(19);
          scene.tweens.add({ targets: bladePreview, alpha: 0.25, duration: 150, yoyo: true, repeat: -1 });
        }
        if (cmd.attackId === "counter-stance") {
          counterActive = true;
          pending.push({ kind: "set-invulnerable", value: true });
        }
        return;
      }

      if (cmd.kind === "attack-end") {
        clearBladePreview();
        if (cmd.attackId === "counter-stance") {
          counterActive = false;
          if (!inArsenal()) pending.push({ kind: "set-invulnerable", value: false });
        }
        return;
      }

      if (cmd.kind !== "attack-active") return;
      clearBladePreview();
      const d = dir();
      const id = cmd.attackId;

      if (id === "quick-slash" || id === "delayed-slash") {
        api.shapeAttack({ w: 82, h: 36, ox: d * 32, oy: 0 });
      } else if (id === "dash-cut") {
        const target = Math.max(42, Math.min(ARENA_W - 42, api.player.x + d * 24));
        scene.tweens.add({ targets: api.boss, x: target, duration: 420, ease: "Sine.easeInOut" });
        api.shapeAttack({ w: 94, h: 36, ox: d * 28 });
      } else if (id === "air-slash") {
        const target = Math.max(42, Math.min(ARENA_W - 42, api.player.x));
        scene.tweens.add({ targets: api.boss, x: target, y: api.boss.y - 54, duration: 245, yoyo: true, ease: "Sine.easeOut" });
        api.shapeAttack({ w: 66, h: 60, oy: 8 });
      } else if (id === "sword-wave") {
        api.shapeAttack({ w: 2, h: 2, oy: -400 });
        api.hazards.spawnShockwave({ x: api.boss.x, dir: d, speed: 330, damage: 1, height: 18 });
      } else if (id === "counter-stance") {
        api.shapeAttack({ w: 2, h: 2, oy: -400 });
      } else if (id === "three-hit") {
        api.shapeAttack({ w: 88, h: 38, ox: d * 30 });
        for (const delay of [210, 430]) {
          scene.time.delayedCall(delay, () => {
            if (api.machine().currentAttackId !== "three-hit") return;
            api.hazards.spawnZone({ x: api.boss.x + d * 42, y: api.boss.y, w: 72, h: 38, delayMs: 0, activeMs: 130, damage: 1 });
          });
        }
      } else if (id === "bow-direct") {
        api.shapeAttack({ w: 2, h: 2, oy: -400 });
        fireArrow(aim());
      } else if (id === "bow-rain") {
        api.shapeAttack({ w: 2, h: 2, oy: -400 });
        api.hazards.spawnDebris({ xs: [api.player.x - 72, api.player.x - 24, api.player.x + 24, api.player.x + 72], delayMs: 480, damage: 1, speed: 420 });
      } else if (id === "bow-spread") {
        api.shapeAttack({ w: 2, h: 2, oy: -400 });
        const a = aim();
        for (const offset of [-0.28, 0, 0.28]) fireArrow(a + offset);
      } else if (id === "bow-explosive") {
        api.shapeAttack({ w: 2, h: 2, oy: -400 });
        fireArrow(aim(), true);
      } else if (id === "spear-thrust") {
        api.shapeAttack({ w: 116, h: 28, ox: d * 50 });
      } else if (id === "spear-launch") {
        api.shapeAttack({ w: 2, h: 2, oy: -400 });
        const a = aim();
        api.projectiles.spawn({
          spec: { kind: "arc", x: api.boss.x + d * 16, y: api.boss.y - 8, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300 - 60, gravity: 260, ttlMs: 3000 },
          sizePx: 8,
          color: 0xc4b5fd,
          damage: 1,
        });
      } else if (id === "spear-spin") {
        api.shapeAttack({ w: 104, h: 52 });
      } else if (id === "spear-line") {
        api.shapeAttack({ w: 2, h: 2, oy: -400 });
        spearLineUntil = scene.time.now + 820;
        api.hazards.spawnZone({ x: ARENA_W / 2, y: FLOOR_Y - 10, w: ARENA_W - 40, h: 20, delayMs: 0, activeMs: 800, damage: 2 });
      } else if (id === "hammer-slam") {
        api.shapeAttack({ w: 74, h: 54, ox: d * 26, oy: 6 });
      } else if (id === "hammer-shockwave") {
        api.shapeAttack({ w: 2, h: 2, oy: -400 });
        api.hazards.spawnShockwave({ x: api.boss.x, dir: 0, speed: 290, damage: 1, height: 20 });
      } else if (id === "hammer-break") {
        api.shapeAttack({ w: 86, h: 58, ox: d * 20, oy: 6 });
        api.hazards.spawnShockwave({ x: api.boss.x, dir: 0, speed: 350, damage: 2, height: 22 });
        hammerStuckUntil = scene.time.now + 1900;
        api.setObjective(seals.hammer ? "BREAK THE REMAINING ARSENAL SEALS" : "THE HAMMER IS STUCK — STOMP HIM");
      } else if (id === "hammer-double") {
        api.shapeAttack({ w: 84, h: 56, ox: d * 24, oy: 6 });
        scene.time.delayedCall(340, () => {
          if (api.machine().currentAttackId !== "hammer-double") return;
          api.hazards.spawnShockwave({ x: api.boss.x, dir: 0, speed: 360, damage: 2, height: 22 });
        });
      }
    },

    update(dtMs) {
      if (api.machine().fsm === "defeated") return;
      const now = scene.time.now;
      const machine = api.machine();

      if (machine.fsm === "idle" || machine.fsm === "recovery") {
        const targetX = devilDuelTargetX(api.boss.x, api.player.x, ARENA_W);
        const maxStep = 0.085 * dtMs;
        const delta = Math.max(-maxStep, Math.min(maxStep, targetX - api.boss.x));
        if (Math.abs(delta) > 0.1) {
          api.boss.setX(api.boss.x + delta).setFlipX(api.player.x < api.boss.x + delta);
          const move = `devil-king:move`;
          if (scene.anims.exists(move)) api.boss.play(move, true);
        }
      }

      if (arsenalStart !== null && exposedUntil === 0) {
        const nextForm = arsenalPhaseForElapsed(now - arsenalStart);
        if (nextForm !== currentForm) {
          currentForm = nextForm;
          pending.push({ kind: "force-phase", phaseIndex: nextForm, lock: true });
        }
      }

      if (spearLineUntil > now && !seals.spear) {
        const body = api.player.body as Phaser.Physics.Arcade.Body;
        if (!body.blocked.down && !body.touching.down) shatter("spear");
      }

      if (exposedUntil > 0 && now >= exposedUntil) {
        exposedUntil = 0;
        pending.push({ kind: "set-invulnerable", value: true });
        api.setObjective("THE RIFT IS REFORMING — HOLD ON");
      } else if (allArsenalSealsBroken(seals) && exposedUntil === 0 && now >= nextExposureAt) {
        openExposure();
      } else if (hammerStuckUntil > 0 && now >= hammerStuckUntil) {
        hammerStuckUntil = 0;
        setArsenalObjective();
      }
    },

    events() {
      const out = [...pending];
      pending.length = 0;
      return out;
    },

    destroy() {
      clearBladePreview();
      scene.tweens.killTweensOf(api.boss);
      disposeStomp();
      api.setObjective(null);
      api.setSeals(null);
    },
  };
}
