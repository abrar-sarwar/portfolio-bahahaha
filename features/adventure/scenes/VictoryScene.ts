import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";
import { input } from "../input/InputState";
import { audio } from "../audio/synth";
import { registerSprites, animKey, frameKey } from "../art/textures";
import { PLAYER_SPRITES } from "../art/sprites/player";
import { DEVIL_KING_SPRITE } from "../art/sprites/bosses2";
import { ARCHIVE_KEY_SPRITE, ENDING_SPRITES } from "../art/sprites/ending";

const W = GAME_WIDTH / 2;
const H = GAME_HEIGHT / 2;
const FLOOR_Y = 224;

/** Silent throne aftermath: dissolve, key drop, then a short controllable walk. */
export class VictoryScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private archiveKey?: Phaser.GameObjects.Sprite;
  private prompt?: Phaser.GameObjects.Text;
  private detachInput?: () => void;
  private control = false;
  private keyCollected = false;
  private leaving = false;
  private door!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("Victory");
  }

  create() {
    gameStore.set({ scene: "Victory", rtBoss: null, rtObjective: null, rtSeals: null });
    bus.emit("scene:changed", { scene: "Victory" });
    audio.stopTrack();

    registerSprites(this, [PLAYER_SPRITES, DEVIL_KING_SPRITE, ...ENDING_SPRITES]);
    this.cameras.main.setZoom(2).centerOn(W / 2, H / 2).setBackgroundColor("#050407");
    this.drawThroneRoom();

    this.player = this.add.sprite(82, FLOOR_Y - 12, frameKey("player", 0)).setDepth(12);
    this.player.play(animKey("player", "idle"), true);
    const king = this.add.sprite(322, FLOOR_Y - 20, frameKey("devil-king", 0)).setDepth(11);
    king.play(animKey("devil-king", "defeat"), true);

    // Four weapon remnants quietly wink out before the King's body follows.
    const weaponColors = [0xe8e8ee, 0xc4b5fd, 0xffd75e, 0xef4444];
    const remnants = weaponColors.map((color, i) =>
      this.add.rectangle(285 + i * 23, 174 - (i % 2) * 12, 13, 3 + i, color, 0.85).setDepth(15).setAngle(i * 28),
    );
    remnants.forEach((weapon, i) => {
      this.tweens.add({ targets: weapon, alpha: 0, scale: 0.1, delay: 180 + i * 120, duration: 520 });
    });

    this.time.delayedCall(820, () => {
      for (let i = 0; i < 28; i++) {
        const mote = this.add.circle(king.x, king.y, 1, i % 3 === 0 ? 0xef4444 : 0x8b6cf0, 0.9).setDepth(14);
        const angle = (i / 28) * Math.PI * 2;
        this.tweens.add({
          targets: mote,
          x: king.x + Math.cos(angle) * (24 + (i % 5) * 4),
          y: king.y + Math.sin(angle) * (24 + (i % 4) * 3),
          alpha: 0,
          delay: i * 18,
          duration: 760,
          onComplete: () => mote.destroy(),
        });
      }
      this.tweens.add({ targets: king, alpha: 0, scale: 0.2, duration: 900, ease: "Quad.easeIn" });
    });

    this.time.delayedCall(1660, () => this.dropKey());
    this.time.delayedCall(2440, () => {
      this.control = true;
      this.showBanner("TAKE WHAT HE LEFT BEHIND", "#c4b5fd", 1500);
    });

    this.detachInput = input.attachKeyboard();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.detachInput?.();
      input.setHeld("left", false);
      input.setHeld("right", false);
    });
  }

  update(_time: number, dt: number) {
    const snap = input.read();
    if (!this.control || this.leaving) {
      input.consume();
      return;
    }

    const axis = Number(snap.right) - Number(snap.left);
    this.player.x = Phaser.Math.Clamp(this.player.x + axis * 92 * (dt / 1000), 24, W - 12);
    if (axis !== 0) {
      this.player.setFlipX(axis < 0).play(animKey("player", "run"), true);
    } else {
      this.player.play(animKey("player", "idle"), true);
    }

    if (!this.keyCollected && this.archiveKey) {
      const near = Math.abs(this.player.x - this.archiveKey.x) < 28;
      if (near) this.showPrompt("[ E ] TAKE THE KEY", this.archiveKey.x, this.archiveKey.y - 24);
      else this.clearPrompt();
      if (near && snap.interactPressed) this.collectKey();
    } else if (this.keyCollected && this.player.x > W - 28) {
      this.leaving = true;
      this.cameras.main.fadeOut(260, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start("Chest"));
    }
    input.consume();
  }

  private drawThroneRoom() {
    this.add.rectangle(0, 0, W, H, 0x09070d).setOrigin(0).setDepth(-10);
    for (let x = 0; x < W; x += 16) {
      this.add.rectangle(x, FLOOR_Y, 16, H - FLOOR_Y, x % 32 === 0 ? 0x16161c : 0x23232c).setOrigin(0).setDepth(-3);
    }
    for (let x = 16; x < W; x += 48) this.add.rectangle(x, 36, 25, 82, 0x16121f, 0.8).setOrigin(0).setDepth(-8);
    this.add.rectangle(322, 181, 54, 74, 0x16161c).setOrigin(0.5, 1).setStrokeStyle(2, 0x5b3fb8).setDepth(-1);
    this.door = this.add.rectangle(W - 28, 168, 36, 112, 0x0a0a0d).setStrokeStyle(2, 0x5c0f18).setDepth(2);
    this.add.text(W - 28, 105, "◆", { fontFamily: "monospace", fontSize: "20px", color: "#5b3fb8" }).setOrigin(0.5).setDepth(3);
  }

  private dropKey() {
    this.archiveKey = this.add.sprite(322, 112, ARCHIVE_KEY_SPRITE.key).setDepth(16).setScale(1.2);
    this.archiveKey.setTint(0xffd75e);
    audio.sfx("key-drop");
    this.tweens.add({ targets: this.archiveKey, y: FLOOR_Y - 10, duration: 620, ease: "Bounce.easeOut" });
    this.tweens.add({ targets: this.archiveKey, alpha: 0.55, duration: 520, yoyo: true, repeat: -1 });
  }

  private collectKey() {
    this.keyCollected = true;
    this.clearPrompt();
    this.archiveKey?.destroy();
    this.archiveKey = undefined;
    this.player.play(animKey("player", "interact"), true);
    audio.sfx("collect");
    this.showBanner("ARCHIVE KEY ACQUIRED", "#ffd75e", 2200);
    this.tweens.add({ targets: this.door, y: 76, alpha: 0.15, duration: 1250, ease: "Sine.easeInOut" });
  }

  private showPrompt(text: string, x: number, y: number) {
    if (!this.prompt) {
      this.prompt = this.add.text(x, y, text, {
        fontFamily: "monospace", fontSize: "8px", color: "#ffd75e", backgroundColor: "#000000cc", padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setDepth(30);
    }
  }

  private clearPrompt() {
    this.prompt?.destroy();
    this.prompt = undefined;
  }

  private showBanner(text: string, color: string, ms: number) {
    const banner = this.add.text(W / 2, 42, text, {
      fontFamily: "monospace", fontSize: "10px", fontStyle: "bold", color, backgroundColor: "#000000dd", padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(40);
    this.time.delayedCall(ms, () => banner.destroy());
  }
}
