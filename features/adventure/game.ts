import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from "./config";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { OverworldScene } from "./scenes/OverworldScene";
import { PlatformLevelScene } from "./scenes/PlatformLevelScene";
import { BossArenaScene } from "./realtime/BossArenaScene";
import { ChaseScene } from "./scenes/ChaseScene";
import { VictoryScene } from "./scenes/VictoryScene";
import { ChestScene } from "./scenes/ChestScene";

export function sceneList(): Phaser.Types.Scenes.SceneType[] {
  // Boot registers textures + seeds the store, then hands to Title → Overworld
  // → Level. BossArenaScene ("Arena") is the real-time boss arena (Task 32);
  // Boot routes ?arena=training straight into it. Later worlds add their own
  // level/backdrop scenes here.
  return [BootScene, TitleScene, OverworldScene, PlatformLevelScene, BossArenaScene, ChaseScene, VictoryScene, ChestScene];
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
