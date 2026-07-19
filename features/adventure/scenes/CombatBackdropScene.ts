import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import type { BossId, LevelId } from "../ids";
import { registerSprites, frameKey, animKey } from "../art/textures";
import { PLAYER_SPRITES } from "../art/sprites/player";
import { bus } from "../bridge/EventBus";
import type { CombatFxKind } from "../combat/controllerLogic";

export interface CombatBackdropData {
  bossId: BossId;
  levelId?: LevelId;
  theme?: LevelThemeId;
}

type LevelThemeId = "fields" | "harbor" | "factory" | "archive" | "castle";

// Per-theme arena gradient (top → bottom). Bosses get REAL sprites in their own
// tasks; here we render the player side plus a boss ANCHOR (a summon portal ring
// where the boss sprite will stand). No placeholder boss rect — Task 14 drops
// the Glitch Toad sprite in at BOSS_ANCHOR.
const THEME_GRADIENT: Record<LevelThemeId, [number, number]> = {
  fields: [0x1a3a5c, 0x0a0a0d],
  harbor: [0x20726e, 0x081413],
  factory: [0x8f3415, 0x120806],
  archive: [0x8f7a55, 0x14100a],
  castle: [0x5b3fb8, 0x0a0710],
};

const PLAYER_ANCHOR = { x: GAME_WIDTH * 0.28, y: GAME_HEIGHT * 0.66 };
const BOSS_ANCHOR = { x: GAME_WIDTH * 0.72, y: GAME_HEIGHT * 0.6 };
const PLAYER_SCALE = 5;

export class CombatBackdropScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Sprite;
  private busOff?: () => void;
  private anchorRing?: Phaser.GameObjects.Arc;

  constructor() {
    super("CombatBackdrop");
  }

  create(data: CombatBackdropData) {
    const theme: LevelThemeId = data.theme ?? "fields";
    registerSprites(this, [PLAYER_SPRITES]);

    // Static camera — no follow, no zoom (combat is a fixed head-on view).
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    this.drawArena(theme);
    this.spawnPlayer();
    this.drawBossAnchor();

    // Drive player combat animations off the controller's fx bus events.
    const onFx = (p: { kind: CombatFxKind }) => this.onCombatFx(p.kind);
    this.busOff = bus.on("combat:fx", onFx);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.busOff?.();
      this.busOff = undefined;
    });
  }

  private drawArena(theme: LevelThemeId) {
    const [top, bottom] = THEME_GRADIENT[theme];
    const g = this.add.graphics().setDepth(-30);
    g.fillGradientStyle(top, top, bottom, bottom, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Floor strip: a darker band with a lit violet edge the fighters stand on.
    const floorY = GAME_HEIGHT * 0.74;
    const floor = this.add.graphics().setDepth(-20);
    floor.fillStyle(0x0a0a0d, 0.85);
    floor.fillRect(0, floorY, GAME_WIDTH, GAME_HEIGHT - floorY);
    floor.lineStyle(2, 0x8b6cf0, 0.5);
    floor.beginPath();
    floor.moveTo(0, floorY);
    floor.lineTo(GAME_WIDTH, floorY);
    floor.strokePath();

    // Soft vignette so the fighters read against the backdrop.
    const vig = this.add.graphics().setDepth(-10);
    vig.fillStyle(0x000000, 0.35);
    vig.fillRect(0, 0, GAME_WIDTH, 60);
    vig.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 60);
  }

  private spawnPlayer() {
    const sprite = this.add
      .sprite(PLAYER_ANCHOR.x, PLAYER_ANCHOR.y, frameKey("player", 0))
      .setDepth(10)
      .setScale(PLAYER_SCALE)
      .setOrigin(0.5, 1);
    sprite.play(animKey("player", "idle"));
    this.player = sprite;
  }

  private drawBossAnchor() {
    // A pulsing portal ring marking where the boss will materialize (Task 14+).
    const ring = this.add
      .circle(BOSS_ANCHOR.x, BOSS_ANCHOR.y, 42)
      .setStrokeStyle(3, 0xc4b5fd, 0.7)
      .setDepth(5);
    this.tweens.add({
      targets: ring,
      scale: { from: 0.9, to: 1.15 },
      alpha: { from: 0.7, to: 0.3 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    this.anchorRing = ring;
  }

  private onCombatFx(kind: CombatFxKind) {
    const key = (a: string) => animKey("player", a);
    switch (kind) {
      case "boss-hit":
      case "crit":
        this.player.play(key("attack"), true);
        this.lunge(12);
        break;
      case "parry":
        this.player.play(key("parry"), true);
        break;
      case "player-hit":
        this.player.play(key("hurt"), true);
        this.lunge(-14);
        break;
      case "breach":
      case "phase":
      case "summon":
        // Arena reacts: a quick camera shake + anchor flare.
        this.cameras.main.shake(220, 0.006);
        if (this.anchorRing) this.anchorRing.setStrokeStyle(3, 0xef4444, 0.9);
        break;
    }
    // Return to idle after a one-shot anim finishes (attack/parry/hurt = repeat 0).
    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.player.play(key("idle"), true);
    });
  }

  private lunge(dx: number) {
    this.tweens.add({
      targets: this.player,
      x: PLAYER_ANCHOR.x + dx,
      duration: 90,
      yoyo: true,
      ease: "Quad.out",
    });
  }
}
