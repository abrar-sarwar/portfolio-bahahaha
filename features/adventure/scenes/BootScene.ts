import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";
import { registerSprites, frameKey, animKey } from "../art/textures";
import { PLAYER_SPRITES } from "../art/sprites/player";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    registerSprites(this, [PLAYER_SPRITES]);
    this.add
      .sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, frameKey("player", 0))
      .setScale(4)
      .play(animKey("player", "idle"));
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, "BOOT OK", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#c4b5fd",
      })
      .setOrigin(0.5);
    gameStore.set({ scene: "Boot" });
    bus.emit("scene:changed", { scene: "Boot" });
  }
}
