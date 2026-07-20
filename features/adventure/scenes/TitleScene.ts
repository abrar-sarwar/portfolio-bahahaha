import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";
import { audio } from "../audio/synth";
import { defaultSave, loadSave, persistSave, type AdventureSave } from "../state/save";

// The Title screen: the game's front door. Shows the logo, plays the title
// track, and offers START (fresh save) or CONTINUE / NEW GAME (a save with
// progress). NEW GAME raises a React confirm dialog (gameStore.confirm) and
// wipes on confirm. Every path ends at the Overworld.

interface Option {
  label: string;
  onActivate: () => void;
}

const VIOLET = "#c4b5fd";
const VIOLET_GLOW = "#8b6cf0";
const DIM = "#6b6b7a";

export class TitleScene extends Phaser.Scene {
  private options: Option[] = [];
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private selected = 0;
  private awaitingConfirm = false;
  private confirmOff?: () => void;

  constructor() {
    super("Title");
  }

  create() {
    gameStore.set({ scene: "Title", confirm: null });
    bus.emit("scene:changed", { scene: "Title" });

    this.cameras.main.setBackgroundColor("#07060d");
    this.drawBackdrop();
    this.drawLogo();
    this.buildOptions();
    this.drawFooter();

    // Music: attempt now (no-op while audio is locked), then guarantee it on
    // the first gesture (browser autoplay policy) — same pattern as the Level.
    audio.playTrack("title");
    this.input.once("pointerdown", () => {
      audio.unlock();
      audio.playTrack("title");
    });

    // Keyboard: up/down to move, Enter/Space to activate.
    const kb = this.input.keyboard!;
    kb.on("keydown-UP", () => this.move(-1));
    kb.on("keydown-DOWN", () => this.move(1));
    kb.on("keydown-W", () => this.move(-1));
    kb.on("keydown-S", () => this.move(1));
    kb.on("keydown-ENTER", () => this.activate());
    kb.on("keydown-SPACE", () => this.activate());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.confirmOff?.();
      this.confirmOff = undefined;
    });
  }

  private drawBackdrop() {
    // A quiet violet vignette: a few concentric faint rings behind the logo so
    // the screen isn't flat black. Cheap and theme-appropriate.
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT * 0.34;
    for (let i = 6; i >= 1; i--) {
      this.add
        .circle(cx, cy, i * 60, 0x1a1230, 0.06)
        .setStrokeStyle(1, 0x3a2a66, 0.12);
    }
  }

  private drawLogo() {
    const cx = GAME_WIDTH / 2;
    const title = this.add
      .text(cx, GAME_HEIGHT * 0.3, "ABRAR'S ADVENTURE", {
        fontFamily: "monospace",
        fontSize: "52px",
        fontStyle: "bold",
        color: "#f2f0ff",
      })
      .setOrigin(0.5);
    title.setLetterSpacing(6);
    title.setShadow(0, 0, VIOLET_GLOW, 20, false, true);

    const subtitle = this.add
      .text(cx, GAME_HEIGHT * 0.3 + 46, "THE LOST KEY", {
        fontFamily: "monospace",
        fontSize: "20px",
        fontStyle: "bold",
        color: VIOLET,
      })
      .setOrigin(0.5);
    subtitle.setLetterSpacing(10);
    subtitle.setShadow(0, 0, VIOLET_GLOW, 12, false, true);
  }

  private buildOptions() {
    const hasProgress = loadSave().completed.length > 0;

    if (hasProgress) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.56, "SAVE FOUND", {
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#8f7a55",
        })
        .setOrigin(0.5)
        .setLetterSpacing(6);
      this.options = [
        { label: "CONTINUE", onActivate: () => this.goOverworld(loadSave()) },
        { label: "NEW GAME", onActivate: () => this.requestNewGame() },
      ];
    } else {
      this.options = [{ label: "START", onActivate: () => this.goOverworld(loadSave()) }];
    }

    const baseY = GAME_HEIGHT * 0.66;
    this.options.forEach((opt, i) => {
      const t = this.add
        .text(GAME_WIDTH / 2, baseY + i * 46, opt.label, {
          fontFamily: "monospace",
          fontSize: "22px",
          fontStyle: "bold",
          color: DIM,
        })
        .setOrigin(0.5)
        .setLetterSpacing(4)
        .setInteractive({ useHandCursor: true });
      t.on("pointerover", () => this.setSelected(i));
      t.on("pointerdown", () => {
        this.setSelected(i);
        this.activate();
      });
      this.optionTexts.push(t);
    });
    this.setSelected(0);
  }

  private drawFooter() {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, "↑ ↓  SELECT      ENTER  CONFIRM", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#4a4a58",
      })
      .setOrigin(0.5)
      .setLetterSpacing(3);
  }

  private move(delta: number) {
    if (this.awaitingConfirm || this.options.length === 0) return;
    const n = this.options.length;
    this.setSelected((this.selected + delta + n) % n);
    audio.sfx("select");
  }

  private setSelected(i: number) {
    this.selected = i;
    this.optionTexts.forEach((t, idx) => {
      const on = idx === i;
      t.setColor(on ? "#ffffff" : DIM);
      t.setText(on ? `▶  ${this.options[idx].label}` : this.options[idx].label);
      if (on) t.setShadow(0, 0, VIOLET_GLOW, 12, false, true);
      else t.setShadow(0, 0, "#000000", 0, false, false);
    });
  }

  private activate() {
    if (this.awaitingConfirm) return;
    const opt = this.options[this.selected];
    if (!opt) return;
    audio.sfx("select");
    opt.onActivate();
  }

  /** CONTINUE / START: seed the store from the given save and enter the map. */
  private goOverworld(save: AdventureSave) {
    seedStore(save);
    this.scene.start("Overworld");
  }

  /** NEW GAME: raise the React confirm dialog; wipe + fresh-seed on confirm. */
  private requestNewGame() {
    if (this.awaitingConfirm) return;
    this.awaitingConfirm = true;
    gameStore.set({ confirm: { message: "Erase your saved adventure?" } });
    this.confirmOff?.();
    this.confirmOff = bus.on("ui:confirm", ({ confirmed }) => {
      this.confirmOff?.();
      this.confirmOff = undefined;
      this.awaitingConfirm = false;
      gameStore.set({ confirm: null });
      if (confirmed) {
        const fresh = defaultSave();
        persistSave(fresh);
        this.goOverworld(fresh);
      }
    });
  }
}

/** Push a save's progression onto the runtime store — the Overworld reads
 *  completed/unlocked from here. Kept module-local (not exported) so the Title
 *  is the single seam that seeds the store on a menu transition. */
function seedStore(save: AdventureSave) {
  gameStore.set({
    abilities: save.abilities,
    keyFragments: save.keyFragments,
    deaths: save.deaths,
    completed: save.completed,
    unlocked: save.unlocked,
  });
}
