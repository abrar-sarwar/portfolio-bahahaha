import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";
import { input } from "../input/InputState";
import { audio } from "../audio/synth";
import { registerSprites, animKey, frameKey } from "../art/textures";
import { PLAYER_SPRITES } from "../art/sprites/player";
import { ENDING_SPRITES, TREASURE_CHEST_SPRITE } from "../art/sprites/ending";
import { codeService } from "../services/codeService";
import { finishAdventure, loadSave, persistSave } from "../state/save";

const W = GAME_WIDTH / 2;
const H = GAME_HEIGHT / 2;
const FLOOR_Y = 226;

export class ChestScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private chest!: Phaser.GameObjects.Sprite;
  private prompt?: Phaser.GameObjects.Text;
  private detachInput?: () => void;
  private returnOff?: () => void;
  private opened = false;

  constructor() {
    super("Chest");
  }

  create() {
    gameStore.set({ scene: "Chest", chest: null });
    bus.emit("scene:changed", { scene: "Chest" });
    registerSprites(this, [PLAYER_SPRITES, ...ENDING_SPRITES]);
    this.cameras.main.setZoom(2).centerOn(W / 2, H / 2).setBackgroundColor("#08070b");
    this.drawTreasureRoom();

    this.player = this.add.sprite(56, FLOOR_Y - 12, frameKey("player", 0)).setDepth(12);
    this.player.play(animKey("player", "idle"), true);
    this.chest = this.add.sprite(340, FLOOR_Y - 12, frameKey(TREASURE_CHEST_SPRITE.key, 0)).setDepth(11);
    this.chest.play(animKey(TREASURE_CHEST_SPRITE.key, "closed"), true);

    audio.playTrack("chest");
    this.input.once("pointerdown", () => {
      audio.unlock();
      audio.playTrack("chest");
    });
    this.detachInput = input.attachKeyboard();
    this.returnOff = bus.on("ending:return-overworld", () => {
      gameStore.set({ chest: null });
      this.scene.start("Overworld", { justCompleted: "castle" });
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.detachInput?.();
      this.returnOff?.();
      gameStore.set({ chest: null });
      input.setHeld("left", false);
      input.setHeld("right", false);
    });
  }

  update(_time: number, dt: number) {
    const snap = input.read();
    if (this.opened) {
      input.consume();
      return;
    }
    const axis = Number(snap.right) - Number(snap.left);
    this.player.x = Phaser.Math.Clamp(this.player.x + axis * 92 * (dt / 1000), 22, W - 18);
    if (axis !== 0) this.player.setFlipX(axis < 0).play(animKey("player", "run"), true);
    else this.player.play(animKey("player", "idle"), true);

    const near = Math.abs(this.player.x - this.chest.x) < 34;
    if (near) this.showPrompt();
    else this.clearPrompt();
    if (near && snap.interactPressed) void this.openChest();
    input.consume();
  }

  private drawTreasureRoom() {
    this.add.rectangle(0, 0, W, H, 0x09070d).setOrigin(0).setDepth(-10);
    // Five quiet wall emblems: bug, tide, gear, page, rift.
    const symbols = ["◇", "≈", "⚙", "▤", "◆"];
    symbols.forEach((symbol, i) => {
      const x = 74 + i * 82;
      this.add.circle(x, 76, 20, 0x16161c, 0.8).setStrokeStyle(1, i === 4 ? 0xef4444 : 0x8b6cf0, 0.7).setDepth(-5);
      this.add.text(x, 76, symbol, { fontFamily: "monospace", fontSize: "16px", color: i === 4 ? "#ef4444" : "#c4b5fd" }).setOrigin(0.5).setDepth(-4);
    });
    this.add.triangle(340, 78, -42, 122, 42, 122, 0, 0, 0xffd75e, 0.08).setDepth(-6);
    for (let x = 0; x < W; x += 16) {
      this.add.rectangle(x, FLOOR_Y, 16, H - FLOOR_Y, x % 32 === 0 ? 0x23232c : 0x16161c).setOrigin(0).setDepth(-2);
    }
    for (let i = 0; i < 18; i++) {
      const dust = this.add.circle(285 + (i * 31) % 115, 115 + (i * 17) % 94, 0.7, 0xc4b5fd, 0.35).setDepth(5);
      this.tweens.add({ targets: dust, y: dust.y - 28, alpha: 0, duration: 1800 + i * 80, delay: i * 95, repeat: -1 });
    }
  }

  private async openChest() {
    if (this.opened) return;
    this.opened = true;
    this.clearPrompt();
    this.player.play(animKey("player", "interact"), true);
    this.chest.play(animKey(TREASURE_CHEST_SPRITE.key, "open"), true);
    audio.sfx("chest");
    persistSave(finishAdventure(loadSave()));
    const code = await codeService.getUnlockCode();
    gameStore.set({ chest: { code } });
  }

  private showPrompt() {
    if (this.prompt) return;
    this.prompt = this.add.text(this.chest.x, this.chest.y - 27, "[ E ] OPEN", {
      fontFamily: "monospace", fontSize: "8px", color: "#ffd75e", backgroundColor: "#000000cc", padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(25);
  }

  private clearPrompt() {
    this.prompt?.destroy();
    this.prompt = undefined;
  }
}
