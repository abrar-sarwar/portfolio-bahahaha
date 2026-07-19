import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from "./config";
import { BootScene } from "./scenes/BootScene";
import { PlatformLevelScene } from "./scenes/PlatformLevelScene";
import { CombatBackdropScene } from "./scenes/CombatBackdropScene";

export function sceneList(): Phaser.Types.Scenes.SceneType[] {
  // Later tasks append scenes here (Title, Overworld, ...).
  return [BootScene, PlatformLevelScene, CombatBackdropScene];
}

export function buildConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#050507",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: PHYSICS.gravity }, debug: false },
    },
    scene: sceneList(),
  };
}
