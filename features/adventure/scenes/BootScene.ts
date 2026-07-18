import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    // Placeholder 16x24 magenta/black checker proves canvas-texture generation
    // works end to end; Task 4 replaces this with the real sprite registry.
    const c = this.textures.createCanvas("boot-check", 16, 24);
    if (c) {
      const ctx = c.getContext();
      for (let y = 0; y < 24; y++)
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = (x + y) % 2 ? "#c4b5fd" : "#101014";
          ctx.fillRect(x, y, 1, 1);
        }
      c.refresh();
    }
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "boot-check")
      .setScale(4);
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
