import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import type { BossId, LevelId, TrackId } from "../ids";
import { registerSprites, frameKey, animKey } from "../art/textures";
import type { SpriteDef } from "../art/textures";
import { PLAYER_SPRITES } from "../art/sprites/player";
import { BOSS_SPRITE_BY_ID } from "../art/sprites/bosses";
import { bus } from "../bridge/EventBus";
import { gameStore } from "../bridge/GameStore";
import { audio } from "../audio/synth";
import { loadSave } from "../state/save";
import type { CombatFxKind } from "../combat/controllerLogic";

// Combat music selection lives HERE (the presentation layer), NOT the headless
// controller: the controller only plays "victory" on a win, and the paused
// Level scene's own track would otherwise keep playing under the fight. On
// create() the backdrop starts the fight's track; the Devil King alone escalates
// it by phase (devil-1 → devil-2 → devil-3), every other boss uses the generic
// "boss" track. Phase switches ride the same "combat:fx" {kind:"phase"} event
// the arena-crack overlay does.
function combatTrackForPhase(bossId: BossId, phaseIndex: number): TrackId {
  if (bossId !== "devil-king") return "boss";
  return phaseIndex >= 2 ? "devil-3" : phaseIndex >= 1 ? "devil-2" : "devil-1";
}

export interface CombatBackdropData {
  bossId: BossId;
  levelId?: LevelId;
  theme?: LevelThemeId;
}

type LevelThemeId = "fields" | "harbor" | "factory" | "archive" | "castle";

// Per-theme arena gradient (top → bottom). A boss with an authored sprite
// (BOSS_SPRITE_BY_ID) mounts at BOSS_ANCHOR; a boss without one yet still gets
// the placeholder summon-portal ring so its door doesn't render a blank arena.
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
const BOSS_SCALE = 2.25;

export class CombatBackdropScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Sprite;
  private boss?: Phaser.GameObjects.Sprite;
  private bossDef?: SpriteDef;
  private bossDefeated = false;
  private busOff?: () => void;
  private busOffOver?: () => void;
  private anchorRing?: Phaser.GameObjects.Arc;
  private bossId: BossId = "glitch-toad";
  private combatTrack: TrackId = "boss";
  private noShake = false;
  private crackOverlay?: Phaser.GameObjects.Graphics;

  constructor() {
    super("CombatBackdrop");
  }

  create(data: CombatBackdropData) {
    // Phaser reuses this scene instance across re-fights (walk out, re-enter
    // the door) — reset the one-shot defeat-dissolve flag every create(), or
    // a second fight's boss-hit/player-hit fx stay frozen out on the guard
    // left true by the previous victory (see onBossFx / onCombatOver).
    this.bossDefeated = false;
    this.bossId = data.bossId;
    this.crackOverlay = undefined; // re-fights re-create the scene — drop the stale overlay ref
    // Accessibility: skip the arena camera shake when the player asked for it
    // (save.settings.accessibility.noShake). TODO(Task 28): once the settings
    // menu is wired, this reads live; today it reflects the persisted save.
    this.noShake = loadSave().settings.accessibility.noShake === true;
    const theme: LevelThemeId = data.theme ?? "fields";
    this.bossDef = BOSS_SPRITE_BY_ID[data.bossId];
    registerSprites(this, [PLAYER_SPRITES, ...(this.bossDef ? [this.bossDef] : [])]);

    // Start the fight's music (see combatTrackForPhase). Phase 0 track; the
    // Devil King escalates it on each "phase" fx below. playTrack is a no-op
    // while the AudioContext is still locked, which is fine — by the time a
    // player reaches any boss door the level track has already unlocked it.
    this.combatTrack = combatTrackForPhase(data.bossId, 0);
    audio.playTrack(this.combatTrack);

    // Static camera — no follow, no zoom (combat is a fixed head-on view).
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    this.drawArena(theme);
    this.spawnPlayer();
    if (this.bossDef) this.spawnBoss(this.bossDef);
    else this.drawBossAnchor();

    // Drive player + boss combat animations off the controller's fx bus events.
    const onFx = (p: { kind: CombatFxKind }) => this.onCombatFx(p.kind);
    this.busOff = bus.on("combat:fx", onFx);
    // "combat:over" (not an fx kind) is the victory/defeat signal Task 14's
    // reward flow also reads off gameStore.combatResult — the scene listens
    // separately so a victory can drive the boss's one-shot defeat dissolve.
    const onOver = (p: { outcome: "victory" | "defeat"; bossId: BossId }) => this.onCombatOver(p.outcome);
    this.busOffOver = bus.on("combat:over", onOver);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.busOff?.();
      this.busOff = undefined;
      this.busOffOver?.();
      this.busOffOver = undefined;
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

  private spawnBoss(def: SpriteDef) {
    const sprite = this.add
      .sprite(BOSS_ANCHOR.x, BOSS_ANCHOR.y, frameKey(def.key, 0))
      .setDepth(10)
      .setScale(BOSS_SCALE)
      .setOrigin(0.5, 1);
    sprite.play(animKey(def.key, "idle"));
    this.boss = sprite;
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
    // Only the hit/parry kinds below call .play() on the player sprite; the
    // arena-reaction kinds (breach/phase/summon) never start a new
    // animation, so they must NOT register the once-listener either — doing
    // so unconditionally left a stray ANIMATION_COMPLETE listener armed that
    // would fire on whatever animation happened to finish next (e.g. a later
    // unrelated attack), snapping the player back to idle mid-animation.
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
        // Arena reacts: a quick camera shake + anchor flare. No sprite
        // animation plays, so return before arming the once-listener below.
        if (!this.noShake) this.cameras.main.shake(220, 0.006);
        if (kind === "phase" && this.bossId === "devil-king") this.onDevilPhase();
        if (this.anchorRing) this.anchorRing.setStrokeStyle(3, 0xef4444, 0.9);
        return;
    }
    // Return to idle after a one-shot anim finishes (attack/parry/hurt = repeat 0).
    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.player.play(key("idle"), true);
    });

    this.onBossFx(kind);
  }

  // Devil-King phase escalation: the throne room SHATTERS. Draw the arena-crack
  // overlay + a red flash (flash gated on the reduceFlash accessibility flag),
  // and escalate the music to the current phase's track (devil-2 on phase 1,
  // devil-3 on the scripted finale). The phase index is read live off the store
  // so the track always matches the engine's current phase.
  private onDevilPhase() {
    this.drawCrackOverlay();
    const phaseIndex = gameStore.get().combat?.phaseIndex ?? 1;
    const next = combatTrackForPhase(this.bossId, phaseIndex);
    if (next !== this.combatTrack) {
      this.combatTrack = next;
      audio.playTrack(next);
    }
  }

  // Jagged red cracks radiating out from under the boss across the arena floor,
  // plus a dim crimson under-glow — the throne room breaking apart as he
  // descends into the breach. Drawn once (guarded); a re-fight re-creates the
  // scene, which clears the ref in create().
  private drawCrackOverlay() {
    if (this.crackOverlay) return;
    const floorY = GAME_HEIGHT * 0.74;
    const g = this.add.graphics().setDepth(-15);
    g.fillStyle(0x5c0f18, 0.35);
    g.fillRect(0, floorY, GAME_WIDTH, GAME_HEIGHT - floorY);
    g.lineStyle(2, 0xef4444, 0.85);
    const dirs: [number, number][] = [[-1, 0.25], [-0.6, 0.55], [-0.2, 0.85], [0.3, 0.9], [0.7, 0.6], [1, 0.3]];
    for (const [dxf, dyf] of dirs) {
      let x = GAME_WIDTH * 0.72;
      let y = floorY;
      g.beginPath();
      g.moveTo(x, y);
      const seg = 5;
      for (let i = 1; i <= seg; i++) {
        x += (dxf * GAME_WIDTH) / (2 * seg) + (Math.random() - 0.5) * 22;
        y += (dyf * (GAME_HEIGHT - floorY)) / seg;
        g.lineTo(x, y);
      }
      g.strokePath();
    }
    this.crackOverlay = g;
    if (loadSave().settings.accessibility.reduceFlash !== true) {
      const flash = this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xef4444, 0.4)
        .setDepth(50);
      this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
    }
  }

  // Mirror of onCombatFx's player-side switch, from the boss's point of view:
  // "boss-hit" (the boss's own health dropped) plays its hurt flash; "player-hit"
  // (the player's health dropped, i.e. the boss's attack just landed) plays its
  // attack lunge. Everything else (parry / arena-reaction kinds) is a no-op for
  // the boss sprite, same reasoning as the player switch above: no .play() call
  // means no once-listener gets armed.
  private onBossFx(kind: CombatFxKind) {
    if (!this.boss || !this.bossDef || this.bossDefeated) return;
    const key = (a: string) => animKey(this.bossDef!.key, a);
    switch (kind) {
      case "boss-hit":
      case "crit":
        this.boss.play(key("hurt"), true);
        this.bossBump(10); // recoil away from the hit it just took
        break;
      case "player-hit":
        this.boss.play(key("attack"), true);
        this.bossBump(-14); // lunge toward the player it just struck
        break;
      default:
        return;
    }
    this.boss.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      // A victory can land mid-flight (the killing blow's own "boss-hit" fires
      // this same listener) — guard so it never snaps back to idle over the
      // defeat dissolve onCombatOver already started.
      if (this.bossDefeated) return;
      this.boss?.play(key("idle"), true);
    });
  }

  // Victory plays the boss's one-shot defeat dissolve and — deliberately —
  // registers no return-to-idle listener, so Phaser holds it on the last
  // (repeat: 0) frame for the victory panel to sit over. A defeat (player
  // lost) leaves the boss as-is; RETRY restarts the fight from scratch anyway.
  private onCombatOver(outcome: "victory" | "defeat") {
    if (!this.boss || !this.bossDef || outcome !== "victory") return;
    this.bossDefeated = true;
    this.boss.play(animKey(this.bossDef.key, "defeat"), true);
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

  private bossBump(dx: number) {
    if (!this.boss) return;
    this.tweens.add({
      targets: this.boss,
      x: BOSS_ANCHOR.x + dx,
      duration: 90,
      yoyo: true,
      ease: "Quad.out",
    });
  }
}
