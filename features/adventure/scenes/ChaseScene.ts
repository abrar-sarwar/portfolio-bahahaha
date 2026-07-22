import Phaser from "phaser";
import { PHYSICS } from "../config";
import type { LevelId } from "../ids";
import type { LevelDefinition } from "../levels/types";
import { animKey, frameKey, registerSprites } from "../art/textures";
import { RIFT_SWORDSMAN_SPRITE } from "../art/sprites/bosses2";
import { audio } from "../audio/synth";
import { gameStore } from "../bridge/GameStore";
import { completeLevel, loadSave, persistSave } from "../state/save";
import { nextChaseRunnerX } from "../realtime/cutscene";
import { PlatformLevelScene, type LevelSceneData } from "./PlatformLevelScene";

const W = 300;
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
  // A readable cathedral escape: shallow pits, ruined choir lofts, roof beams,
  // then a long exterior sprint. All jumps stay within the base jump envelope.
  for (const start of [34, 78, 126, 174, 218]) {
    for (let x = start; x < start + 3; x++) {
      set(x, FLOOR, "^"); set(x, FLOOR + 1, "^"); set(x, FLOOR + 2, "^");
    }
    fill(start - 6, start - 3, FLOOR - 2, "=");
    fill(start + 5, start + 9, FLOOR - 3, "=");
  }
  for (const [x, y] of [[52, 9], [58, 7], [96, 10], [102, 8], [146, 9], [152, 7], [198, 10], [204, 8]] as const) {
    fill(x, x + 4, y, "=");
  }
  return grid.map((row) => row.join("")).join("\n");
}

const CHASE_LEVEL: LevelDefinition = {
  id: "1-4",
  name: "Cathedral Escape",
  theme: "rain",
  bossId: "veiled-archer",
  music: "level-4",
  map: chaseMap(),
  introDialogueId: null,
  fragmentDialogueId: null,
  decor: [
    { kind: "rain-glass", tx: 42, ty: 7 },
    { kind: "rain-bell", tx: 112, ty: 4 },
    { kind: "rain-chandelier", tx: 164, ty: 5 },
    { kind: "rain-headstone", tx: 238, ty: 12 },
  ],
};

export class ChaseScene extends PlatformLevelScene {
  private runner!: Phaser.GameObjects.Sprite;
  private finishing = false;

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
    if (!loadSave().settings.accessibility.reduceFlash) {
      this.cameras.main.flash(180, 91, 63, 184);
    }
  }

  update(time: number, dtMs: number): void {
    super.update(time, dtMs);
    if (!this.runner || this.finishing || this.dead) return;
    const finishX = FINISH_TX * 16;
    this.runner.x = nextChaseRunnerX({
      runnerX: this.runner.x,
      playerX: this.player.x,
      dtMs,
      runSpeed: PHYSICS.moveSpeed,
      finishX,
    });
    this.runner.y = FLOOR * 16 - 17 + Math.sin(time / 75) * 1.5;
    if (this.player.x >= finishX - 120) this.finishChase();
  }

  protected enterBoss(): void {
    this.finishChase();
  }

  private finishChase(): void {
    if (this.finishing) return;
    this.finishing = true;
    audio.stopTrack();
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;
    this.runner.play(animKey(RIFT_SWORDSMAN_SPRITE.key, "transform"), true);
    const rift = this.add.circle(this.runner.x + 36, this.runner.y - 26, 6, 0x5b0f8a, 0.9).setDepth(30);
    this.tweens.add({ targets: rift, scale: 9, alpha: 0.15, duration: 900, ease: "Quad.easeOut" });
    if (!loadSave().settings.accessibility.noShake) this.cameras.main.shake(500, 0.012);
    this.tweens.add({
      targets: this.runner,
      x: rift.x,
      y: rift.y,
      angle: -20,
      alpha: 0,
      duration: 820,
      ease: "Quad.easeIn",
    });
    this.time.delayedCall(1350, () => {
      const save = completeLevel(loadSave(), "1-4" as LevelId);
      persistSave(save);
      gameStore.set({ completed: save.completed, unlocked: save.unlocked });
      this.scene.start("Overworld", { justCompleted: "1-4", castleUnlocked: true });
    });
  }
}
