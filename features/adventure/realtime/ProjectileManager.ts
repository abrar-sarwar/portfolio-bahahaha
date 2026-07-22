// features/adventure/realtime/ProjectileManager.ts
//
// Phaser-side projectile runtime (amendment §4) over the PURE ProjectileSystem
// kinematics. Owns every live boss projectile in an arena:
//   • spawn(spec + presentation opts) → a tinted rect/orb GameObject
//   • update(dt) steps the pure kinematics, hands homing targets/walls in,
//     and resolves player contact manually (cheap circle-vs-body distance —
//     no per-projectile arcade colliders to leak)
//   • GLOW projectiles are the game-wide parryable signal in flight: a parry
//     stance catching one REFLECTS it (velocity mirrored toward the boss,
//     `reflected` flag, homing-lite steer) instead of damaging the player.
//     Reflection does NOT emit a machine `parried` (boss-demands: reflect must
//     not stagger a masked/armored boss — what a reflected hit does is the
//     mechanics module's call via onReflected/onHitBoss).
//   • resetAll() releases everything — called at create() top and shutdown.
import Phaser from "phaser";
import {
  spawnProjectile,
  stepProjectile,
  type ProjectileSpec,
  type ProjectileState,
  type Wall,
} from "./ProjectileSystem";
import { impactSparks, parryFlashRing } from "./effects";
import { animKey, frameKey } from "../art/textures";
import { audio } from "../audio/synth";

type Body = Phaser.Physics.Arcade.Body;

export interface RtProjectileOpts {
  spec: ProjectileSpec;
  /** Visual size (square edge / orb diameter). Default 6. */
  sizePx?: number;
  color?: number;
  /** Bespoke texture (boss projectile art) instead of the generic orb. */
  texture?: { key: string; anim?: string; flipX?: boolean };
  /** Parryable-in-flight (bright glow). A caught parry reflects it. */
  glow?: boolean;
  /** Hearts of damage on player contact. Default 1. */
  damage?: 1 | 2;
  /** Called once when the player parries this projectile (it now flies back). */
  onReflected?: () => void;
  /** Called once when a REFLECTED projectile reaches the boss body. */
  onHitBoss?: () => void;
}

interface LiveProjectile {
  spec: ProjectileSpec;
  st: ProjectileState;
  go: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
  glowHalo?: Phaser.GameObjects.Arc;
  opts: RtProjectileOpts;
  reflected: boolean;
}

const GLOW_COLOR = 0xffe08a; // the ONE parryable-signal gold, matching telegraphs

export class ProjectileManager {
  private live: LiveProjectile[] = [];

  constructor(
    private scene: Phaser.Scene,
    private deps: {
      player: Phaser.Physics.Arcade.Sprite;
      boss: Phaser.Physics.Arcade.Sprite;
      /** Arena wall AABBs for "bouncing" projectiles. */
      walls: () => Wall[];
      /** True while the player's parry stance is open. */
      isParrying: (now: number) => boolean;
      /** Consume the open stance on a projectile parry (success semantics,
       *  NO machine `parried` event — see the header note). */
      consumeParry: (now: number) => void;
      /** Route player damage through the scene (iframes/death handled there). */
      onPlayerHit: (damage: number) => void;
      /** Silent-assist projectile slowdown (assistRT §6). Default 1. */
      speedScale?: number;
    },
  ) {}

  spawn(opts: RtProjectileOpts): void {
    const size = opts.sizePx ?? 6;
    const color = opts.color ?? 0xff8a6a;
    const scale = this.deps.speedScale ?? 1;
    const spec = {
      ...opts.spec,
      vx: opts.spec.vx * scale,
      vy: opts.spec.vy * scale,
      speed: opts.spec.speed !== undefined ? opts.spec.speed * scale : undefined,
    };
    let go: LiveProjectile["go"];
    if (opts.texture) {
      const s = this.scene.add.sprite(spec.x, spec.y, frameKey(opts.texture.key, 0)).setDepth(20);
      if (opts.texture.anim) s.play(animKey(opts.texture.key, opts.texture.anim));
      if (opts.texture.flipX) s.setFlipX(true);
      go = s;
    } else {
      const c = this.scene.add.circle(spec.x, spec.y, size / 2, color).setDepth(20);
      if (opts.glow) c.setFillStyle(GLOW_COLOR);
      go = c;
    }
    let glowHalo: Phaser.GameObjects.Arc | undefined;
    if (opts.glow) {
      glowHalo = this.scene.add.circle(spec.x, spec.y, size, GLOW_COLOR, 0.35).setDepth(19);
    }
    this.live.push({ spec, st: spawnProjectile(spec), go, glowHalo, opts, reflected: false });
  }

  /** Number of currently-live projectiles (test/verification hook). */
  count(): number {
    return this.live.length;
  }

  update(dtMs: number): void {
    if (this.live.length === 0) return;
    const now = this.scene.time.now;
    const player = this.deps.player;
    const boss = this.deps.boss;
    const pb = player.body as Body;
    const bb = boss.body as Body;
    const walls = this.deps.walls();

    for (const p of this.live) {
      // Reflected projectiles steer home to the boss; normal homing to the player.
      const homingTarget = p.reflected
        ? { x: boss.x, y: boss.y }
        : { x: player.x, y: player.y };
      p.st = stepProjectile(p.spec, p.st, {
        dt: dtMs,
        targetX: homingTarget.x,
        targetY: homingTarget.y,
        walls,
      });
      p.go.setPosition(p.st.x, p.st.y);
      p.glowHalo?.setPosition(p.st.x, p.st.y);

      if (!p.st.alive) continue;

      // Solid walls stop EVERY projectile: bouncing kinds reflect inside
      // stepProjectile; everything else shatters on contact. (Falling blade
      // arcs used to sink straight through the floor until their TTL ran out
      // — "attacks going through the ground".)
      if (p.spec.kind !== "bouncing") {
        for (const w of walls) {
          if (p.st.x >= w.x && p.st.x <= w.x + w.w && p.st.y >= w.y && p.st.y <= w.y + w.h) {
            impactSparks(this.scene, p.st.x, p.st.y);
            p.st = { ...p.st, alive: false };
            break;
          }
        }
        if (!p.st.alive) continue;
      }

      const r = (p.opts.sizePx ?? 6) / 2 + 2;
      if (!p.reflected) {
        // Player contact: parry-catch a glow, otherwise damage.
        if (rectCircleOverlap(pb, p.st.x, p.st.y, r)) {
          if (p.opts.glow && this.deps.isParrying(now)) {
            this.deps.consumeParry(now);
            parryFlashRing(this.scene, player.x, player.y);
            audio.sfx("parry");
            p.reflected = true;
            // Mirror + retarget: swap to a homing steer back at the boss.
            const speed = Math.max(60, Math.hypot(p.st.vx, p.st.vy));
            const ang = Math.atan2(boss.y - p.st.y, boss.x - p.st.x);
            p.st = { ...p.st, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, ageMs: 0 };
            p.spec = { ...p.spec, kind: "homing", speed, turnRateRadPerSec: 6, ttlMs: 4000 };
            // Reflected = mint (no longer a threat): tint sprites, refill arcs.
            if (p.go instanceof Phaser.GameObjects.Sprite) p.go.setTint(0x9affb0);
            else if ("setFillStyle" in p.go) p.go.setFillStyle(0x9affb0);
            p.opts.onReflected?.();
          } else {
            this.deps.onPlayerHit(p.opts.damage ?? 1);
            p.st = { ...p.st, alive: false };
          }
        }
      } else if (rectCircleOverlap(bb, p.st.x, p.st.y, r)) {
        p.opts.onHitBoss?.();
        p.st = { ...p.st, alive: false };
      }
    }

    // Sweep the dead.
    for (let i = this.live.length - 1; i >= 0; i--) {
      if (!this.live[i].st.alive) {
        this.live[i].go.destroy();
        this.live[i].glowHalo?.destroy();
        this.live.splice(i, 1);
      }
    }
  }

  resetAll(): void {
    for (const p of this.live) {
      p.go.destroy();
      p.glowHalo?.destroy();
    }
    this.live = [];
  }
}

function rectCircleOverlap(body: Body, cx: number, cy: number, r: number): boolean {
  const nx = Math.max(body.left, Math.min(cx, body.right));
  const ny = Math.max(body.top, Math.min(cy, body.bottom));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}
