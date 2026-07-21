import Phaser from "phaser";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";
import { registerSprites } from "../art/textures";
import { PLAYER_SPRITES } from "../art/sprites/player";
import { tilesetFor } from "../art/sprites/tiles-fields";
import { loadSave } from "../state/save";
import { applyAudioSettings } from "../state/settings";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    // Register every texture the Level scene relies on (idempotent — Level
    // also calls registerSprites for robustness), then hand off to the Title.
    registerSprites(this, [PLAYER_SPRITES, ...tilesetFor("fields")]);

    // Read the durable save once at boot and reseed gameStore's runtime fields
    // from it (gameStore stays the session's source of truth from here on —
    // see state/save.ts's header comment). completed/unlocked seed the
    // Overworld's unlock chain; abilities/keyFragments/deaths drive gameplay.
    const save = loadSave();
    gameStore.set({
      scene: "Boot",
      abilities: save.abilities,
      keyFragments: save.keyFragments,
      castleKey: save.castleKey,
      deaths: save.deaths,
      completed: save.completed,
      unlocked: save.unlocked,
    });
    applyAudioSettings(save);

    bus.emit("scene:changed", { scene: "Boot" });

    // Debug/verification entry (Task 32): ?arena=training jumps straight into the
    // BossArenaScene with the shipped, gated, harmless training dummy. This is
    // the internal test arena the brief mandates; the Task-48 debug menu reuses
    // the same launch. Anything else boots normally to the Title.
    const arena =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("arena")
        : null;
    if (arena === "training") {
      this.scene.start("Arena", { bossId: "training-dummy", returnScene: "Title" });
      return;
    }

    this.scene.start("Title");
  }
}
