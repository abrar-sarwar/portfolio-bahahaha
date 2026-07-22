import Phaser from "phaser";
import { PHYSICS } from "../config";
import type { LevelDefinition } from "../levels/types";
import { animKey, frameKey, registerSprites } from "../art/textures";
import { RIFT_SWORDSMAN_SPRITE } from "../art/sprites/bosses2";
import { audio } from "../audio/synth";
import { loadSave } from "../state/save";
import { nextChaseRunnerX } from "../realtime/cutscene";
import { RT_PLAYER } from "../realtime/config";
import { input } from "../input/InputState";
import { chaseAttackPlan } from "./chaseLogic";
import { PlatformLevelScene, type LevelSceneData } from "./PlatformLevelScene";

type Body = Phaser.Physics.Arcade.Body;
const W = 220;
const H = 16;
const FLOOR = 13;
const FINISH_TX = W - 5;

function chaseMap(): string {
  const grid = Array.from({ length: H }, () => Array<string>(W).fill("."));
  const set = (x: number, y: number, value: string) => { if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = value; };
  const fill = (x0: number, x1: number, y: number, value: string) => { for (let x = x0; x <= x1; x++) set(x, y, value); };
  fill(0, W - 1, FLOOR, "#");
  fill(0, W - 1, FLOOR + 1, "#");
  fill(0, W - 1, FLOOR + 2, "#");
  set(2, FLOOR - 1, "P");
  set(FINISH_TX, FLOOR - 1, "D");

  // Interior chase beats: collapsing drawbridges, low lava cuts, broken
  // galleries, and short elevation changes that preserve a running rhythm.
  for (const start of [34, 76, 122, 170]) {
    for (let x = start; x < start + 6; x++) {
      set(x, FLOOR - 1, "~");
      set(x, FLOOR, "^");
      set(x, FLOOR + 1, "^");
      set(x, FLOOR + 2, "^");
    }
    fill(start - 7, start - 3, FLOOR - 3, "=");
    fill(start + 8, start + 13, FLOOR - 2, "=");
  }
  for (const [x, y] of [[55, 9], [96, 8], [145, 9], [193, 8]] as const) fill(x, x + 5, y, "=");
  return grid.map((row) => row.join("")).join("\n");
}

const CHASE_LEVEL: LevelDefinition = {
  id: "castle",
  name: "The Castle Hunt",
  theme: "rift",
  bossId: "devil-king",
  music: "castle",
  map: chaseMap(),
  introDialogueId: null,
  fragmentDialogueId: null,
  decor: [
    { kind: "chain", tx: 42, ty: 2 },
    { kind: "banner", tx: 84, ty: 4 },
    { kind: "statue", tx: 132, ty: 10 },
    { kind: "banner", tx: 182, ty: 3 },
  ],
};

export class ChaseScene extends PlatformLevelScene {
  private runner!: Phaser.GameObjects.Sprite;
  private finishing = false;
  private nextAttackAt = 0;
  private parryUntil = 0;
  private slowedUntil = 0;
  private waves: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super("Chase");
    this.drawDoorMarker = false;
  }

  protected resolveLevelDef(_data: LevelSceneData): LevelDefinition {
    return CHASE_LEVEL;
  }

  protected onCreated(): void {
    registerSprites(this, [RIFT_SWORDSMAN_SPRITE]);
    this.runner = this.add
      .sprite(this.player.x + 170, this.player.y, frameKey(RIFT_SWORDSMAN_SPRITE.key, 0))
      .setDepth(11)
      .setFlipX(false);
    this.runner.play(animKey(RIFT_SWORDSMAN_SPRITE.key, "run"), true);
    this.nextAttackAt = this.time.now + 1500;
    this.finishing = false;
    this.waves = [];
    if (!loadSave().settings.accessibility.reduceFlash) this.cameras.main.flash(160, 91, 15, 30);
  }

  update(time: number, dtMs: number): void {
    const snap = input.read();
    if (snap.parryPressed) {
      this.parryUntil = this.time.now + RT_PLAYER.parryWindowMs;
      this.player.play(animKey("player", "parry"), true);
    }
    this.externalMoveScale = this.time.now < this.slowedUntil ? 0.65 : 1;
    super.update(time, dtMs);
    if (!this.runner || this.finishing || this.dead) return;

    const finishX = FINISH_TX * 16;
    this.runner.x = nextChaseRunnerX({
      runnerX: this.runner.x,
      playerX: this.player.x,
      dtMs,
      runSpeed: PHYSICS.runSpeed,
      finishX,
    });
    this.runner.y = FLOOR * 16 - 17 + Math.sin(time / 75) * 1.5;

    if (this.time.now >= this.nextAttackAt && this.runner.x - this.player.x < 230) {
      this.telegraphRunnerAttack();
      const progress = this.player.x / finishX;
      const plan = chaseAttackPlan(this.time.now, progress);
      this.nextAttackAt = plan.nextAt;
      if (plan.followupDelayMs !== null) {
        this.time.delayedCall(plan.followupDelayMs, () => {
          if (!this.finishing && !this.dead) this.telegraphRunnerAttack();
        });
      }
    }

    this.waves = this.waves.filter((wave) => {
      if (!wave.active || wave.x < this.player.x - 360) {
        wave.destroy();
        return false;
      }
      return true;
    });
    if (this.player.x >= finishX - 120) this.finishChase();
  }

  private telegraphRunnerAttack(): void {
    this.runner.setFlipX(true).setTint(0xffd75e);
    this.runner.play(animKey(RIFT_SWORDSMAN_SPRITE.key, "draw"), true);
    const tell = this.add
      .line(0, 0, this.runner.x - 18, FLOOR * 16 - 6, this.runner.x - 150, FLOOR * 16 - 6, 0xffd75e, 0.8)
      .setOrigin(0, 0)
      .setDepth(18);
    this.tweens.add({ targets: tell, alpha: 0.2, duration: 130, yoyo: true, repeat: 2 });
    audio.sfx("telegraph");
    this.time.delayedCall(520, () => {
      tell.destroy();
      if (this.finishing || this.dead) return;
      this.runner.clearTint().play(animKey(RIFT_SWORDSMAN_SPRITE.key, "slash"), true);
      this.spawnSwordWave();
      this.time.delayedCall(180, () => {
        if (!this.finishing) this.runner.setFlipX(false).play(animKey(RIFT_SWORDSMAN_SPRITE.key, "run"), true);
      });
    });
  }

  private spawnSwordWave(): void {
    const wave = this.add
      .rectangle(this.runner.x - 22, FLOOR * 16 - 7, 30, 11, 0xc4b5fd, 0.22)
      .setStrokeStyle(2, 0xf4f0ff, 0.95)
      .setDepth(14)
      .setAngle(-12);
    this.physics.add.existing(wave);
    const body = wave.body as Body;
    body.setAllowGravity(false);
    body.setVelocityX(-260);
    this.physics.add.overlap(wave, this.player, () => {
      if (!wave.active) return;
      if (this.time.now <= this.parryUntil) {
        audio.sfx("parry");
        const ring = this.add.circle(this.player.x, this.player.y, 8).setStrokeStyle(2, 0xffd75e).setDepth(20);
        this.tweens.add({ targets: ring, scale: 2.5, alpha: 0, duration: 180, onComplete: () => ring.destroy() });
      } else {
        this.damagePlayer(1);
        this.slowedUntil = this.time.now + 650;
      }
      wave.destroy();
    });
    this.waves.push(wave);
    audio.sfx("slash");
  }

  protected enterBoss(): void {
    this.finishChase();
  }

  private finishChase(): void {
    if (this.finishing) return;
    this.finishing = true;
    audio.stopTrack();
    const body = this.player.body as Body;
    body.setVelocity(0, 0);
    body.enable = false;
    this.runner.play(animKey(RIFT_SWORDSMAN_SPRITE.key, "transform"), true);
    const rift = this.add.circle(this.runner.x + 36, this.runner.y - 26, 6, 0x5b0f8a, 0.9).setDepth(30);
    this.tweens.add({ targets: rift, scale: 9, alpha: 0.15, duration: 900, ease: "Quad.easeOut" });
    if (!loadSave().settings.accessibility.noShake) this.cameras.main.shake(500, 0.012);
    this.tweens.add({ targets: this.runner, x: rift.x, y: rift.y, angle: -20, alpha: 0, duration: 820, ease: "Quad.easeIn" });
    this.time.delayedCall(1200, () => {
      this.scene.start("Level", {
        levelId: "castle",
        spawnAt: "start",
        chaseCleared: true,
        ultimateSpent: this.abilities.ultimateSpent,
      } satisfies LevelSceneData);
    });
  }
}
