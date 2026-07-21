// features/adventure/realtime/ArenaHazardSystem.ts
//
// Pooled arena hazards (amendment §4), all reset-safe:
//   • ground SHOCKWAVES — low traveling crests the player jumps over
//   • marked FALLING DEBRIS — target marker → delay → falling rock
//   • timed damage ZONES — telegraphed strips that arm after a delay (lasers /
//     energy lines in later worlds)
//   • temporary PLATFORMS — lingering solid one-off platforms (the Hollow
//     Giant's planted hands, the Archer's embedded arrows) with a TTL
// Player damage is routed through the scene callback (iframes/death live
// there). resetAll() releases everything — create() top and shutdown both call
// it so nothing survives a restart (T18 scene-instance hygiene).
import Phaser from "phaser";

type Body = Phaser.Physics.Arcade.Body;

interface Shockwave {
  go: Phaser.GameObjects.Rectangle;
  vx: number;
  damage: 1 | 2;
  minX: number;
  maxX: number;
  done: boolean;
}

interface Debris {
  marker: Phaser.GameObjects.Rectangle;
  rock?: Phaser.GameObjects.Rectangle;
  x: number;
  dropAt: number;
  vy: number;
  damage: 1 | 2;
  floorY: number;
  done: boolean;
}

interface Zone {
  go: Phaser.GameObjects.Rectangle;
  armAt: number;
  disarmAt: number;
  damage: 1 | 2;
  done: boolean;
}

interface TempPlatform {
  go: Phaser.GameObjects.Rectangle;
  collider: Phaser.Physics.Arcade.Collider;
  dieAt: number;
  done: boolean;
}

export class ArenaHazardSystem {
  private shockwaves: Shockwave[] = [];
  private debris: Debris[] = [];
  private zones: Zone[] = [];
  private platforms: TempPlatform[] = [];

  constructor(
    private scene: Phaser.Scene,
    private deps: {
      player: Phaser.Physics.Arcade.Sprite;
      /** Inclusive world-x span the arena floor covers (walls clip hazards). */
      bounds: () => { minX: number; maxX: number; floorY: number; ceilingY: number };
      onPlayerHit: (damage: 1 | 2) => void;
    },
  ) {}

  /** A traveling ground crest. `dir` 1 → right, -1 → left, 0 → both ways. */
  spawnShockwave(opts: { x: number; dir: 1 | -1 | 0; speed?: number; damage?: 1 | 2; height?: number }): void {
    const { minX, maxX, floorY } = this.deps.bounds();
    const speed = opts.speed ?? 240;
    const h = opts.height ?? 12;
    const dirs: (1 | -1)[] = opts.dir === 0 ? [1, -1] : [opts.dir];
    for (const d of dirs) {
      const go = this.scene.add
        .rectangle(opts.x, floorY - h / 2, 10, h, 0xffb26a)
        .setDepth(18);
      this.shockwaves.push({ go, vx: speed * d, damage: opts.damage ?? 1, minX, maxX, done: false });
    }
  }

  /** Marked-column falling debris: marker flashes at the floor, rock drops after `delayMs`. */
  spawnDebris(opts: { xs: number[]; delayMs?: number; damage?: 1 | 2; speed?: number }): void {
    const { floorY } = this.deps.bounds();
    const now = this.scene.time.now;
    for (const x of opts.xs) {
      const marker = this.scene.add
        .rectangle(x, floorY - 2, 14, 4, 0xff6a6a, 0.8)
        .setDepth(17);
      this.scene.tweens.add({ targets: marker, alpha: 0.25, duration: 160, yoyo: true, repeat: -1 });
      this.debris.push({
        marker,
        x,
        dropAt: now + (opts.delayMs ?? 700),
        vy: opts.speed ?? 330,
        damage: opts.damage ?? 1,
        floorY,
        done: false,
      });
    }
  }

  /** A telegraphed strip that becomes damaging between armAt and disarmAt. */
  spawnZone(opts: { x: number; y: number; w: number; h: number; delayMs?: number; activeMs?: number; damage?: 1 | 2 }): void {
    const now = this.scene.time.now;
    const go = this.scene.add.rectangle(opts.x, opts.y, opts.w, opts.h, 0xff6a6a, 0.22).setDepth(16);
    this.zones.push({
      go,
      armAt: now + (opts.delayMs ?? 600),
      disarmAt: now + (opts.delayMs ?? 600) + (opts.activeMs ?? 900),
      damage: opts.damage ?? 1,
      done: false,
    });
  }

  /** A temporary solid platform (lingering hand / embedded arrow). */
  spawnPlatform(opts: { x: number; y: number; w: number; h?: number; ttlMs: number; color?: number }): void {
    const go = this.scene.add
      .rectangle(opts.x, opts.y, opts.w, opts.h ?? 8, opts.color ?? 0xcfd6e0)
      .setDepth(15);
    this.scene.physics.add.existing(go, true); // static body
    const collider = this.scene.physics.add.collider(this.deps.player, go);
    this.platforms.push({ go, collider, dieAt: this.scene.time.now + opts.ttlMs, done: false });
  }

  update(_dtMs: number): void {
    const now = this.scene.time.now;
    const pb = this.deps.player.body as Body;
    const dtS = this.scene.game.loop.delta / 1000;

    for (const s of this.shockwaves) {
      if (s.done) continue;
      s.go.x += s.vx * dtS;
      if (s.go.x < s.minX || s.go.x > s.maxX) {
        s.done = true;
        s.go.destroy();
        continue;
      }
      if (rectsOverlap(pb, s.go.getBounds())) this.deps.onPlayerHit(s.damage);
    }

    for (const d of this.debris) {
      if (d.done) continue;
      if (!d.rock && now >= d.dropAt) {
        const { ceilingY } = this.deps.bounds();
        d.marker.destroy();
        d.rock = this.scene.add.rectangle(d.x, ceilingY + 8, 12, 12, 0x9aa4b0).setDepth(18);
      }
      if (d.rock) {
        d.rock.y += d.vy * dtS;
        if (rectsOverlap(pb, d.rock.getBounds())) {
          this.deps.onPlayerHit(d.damage);
          d.done = true;
          d.rock.destroy();
          continue;
        }
        if (d.rock.y >= d.floorY - 6) {
          d.done = true;
          d.rock.destroy();
        }
      }
    }

    for (const z of this.zones) {
      if (z.done) continue;
      const armed = now >= z.armAt && now < z.disarmAt;
      z.go.setFillStyle(0xff6a6a, armed ? 0.55 : 0.22);
      if (armed && rectsOverlap(pb, z.go.getBounds())) this.deps.onPlayerHit(z.damage);
      if (now >= z.disarmAt) {
        z.done = true;
        z.go.destroy();
      }
    }

    for (const p of this.platforms) {
      if (p.done) continue;
      if (now >= p.dieAt) {
        p.done = true;
        p.collider.destroy();
        p.go.destroy();
      }
    }

    this.shockwaves = this.shockwaves.filter((s) => !s.done);
    this.debris = this.debris.filter((d) => !d.done);
    this.zones = this.zones.filter((z) => !z.done);
    this.platforms = this.platforms.filter((p) => !p.done);
  }

  resetAll(): void {
    for (const s of this.shockwaves) s.go.destroy();
    for (const d of this.debris) {
      d.marker.destroy();
      d.rock?.destroy();
    }
    for (const z of this.zones) z.go.destroy();
    for (const p of this.platforms) {
      p.collider.destroy();
      p.go.destroy();
    }
    this.shockwaves = [];
    this.debris = [];
    this.zones = [];
    this.platforms = [];
  }
}

function rectsOverlap(body: Body, r: Phaser.Geom.Rectangle): boolean {
  return body.left < r.right && body.right > r.left && body.top < r.bottom && body.bottom > r.top;
}
