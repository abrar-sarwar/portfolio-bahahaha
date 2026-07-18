import Phaser from "phaser";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";
import { registerSprites } from "../art/textures";
import { PLAYER_SPRITES } from "../art/sprites/player";
import { tilesetFor } from "../art/sprites/tiles-fields";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    // Register every texture the Level scene relies on (idempotent — Level
    // also calls registerSprites for robustness), then hand straight off.
    // Title / Overworld replace this direct start in Task 16.
    registerSprites(this, [PLAYER_SPRITES, ...tilesetFor("fields")]);
    gameStore.set({ scene: "Boot" });
    bus.emit("scene:changed", { scene: "Boot" });
    this.scene.start("Level", { levelId: "1-1" });
  }
}
