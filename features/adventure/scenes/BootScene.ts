import Phaser from "phaser";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";
import { registerSprites } from "../art/textures";
import { PLAYER_SPRITES } from "../art/sprites/player";
import { tilesetFor } from "../art/sprites/tiles-fields";
import { loadSave } from "../state/save";
import { applyAudioSettings } from "../state/settings";
import { getRtBoss } from "../realtime/bossDefinitions";
import type { RtBossId } from "../realtime/types";
import { debugLevelFrom } from "../state/debugQuery";

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

    // Debug/verification entry (Tasks 32/37): ?arena=<rt-boss-id> jumps
    // straight into the BossArenaScene for any REGISTERED realtime boss
    // (?arena=training aliases the dummy). Shipped, gated, harmless — the
    // Task-48 debug menu reuses the same launch. No fromLevel, so a debug
    // victory never writes completion. Anything else boots to the Title.
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const arena =
      typeof window !== "undefined"
        ? params?.get("arena") ?? null
        : null;
    if (arena) {
      const bossId = (arena === "training" ? "training-dummy" : arena) as RtBossId;
      if (getRtBoss(bossId)) {
        this.scene.start("Arena", { bossId, returnScene: "Title" });
        return;
      }
    }

    // Unlike the harmless isolated arena harness above, whole-level skips can
    // mutate progression, so they only exist behind the exact `?debug=1` flag.
    const level = params ? debugLevelFrom(params) : null;
    if (level) {
      this.scene.start("Level", { levelId: level, spawnAt: "start" });
      return;
    }

    this.scene.start("Title");
  }
}
