import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import type { LevelId } from "../ids";
import { LEVELS } from "../levels";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";
import { audio } from "../audio/synth";
import { loadSave } from "../state/save";
import { registerSprites, frameKey, animKey } from "../art/textures";
import { FIELDS_PARALLAX, FIELD_PARALLAX_KEYS } from "../art/sprites/tiles-fields";
import {
  OVERWORLD_SPRITES,
  OW_MAP_PLAYER,
  OW_CASTLE,
  OW_GATE,
  OW_FLAG,
  OW_PATH_DOT,
  nodeDiscKey,
} from "../art/sprites/overworld";
import {
  NODE_ORDER,
  OVERWORLD_ACTIVATE_KEY_EVENTS,
  castlePresentation,
  nodeStateFor,
  walkPath,
  type OverNodeId,
  type NodeState,
  type ProgressShape,
} from "./overworldLogic";
import { levelEntryScene } from "./chaseLogic";

// The Overworld map: a winding path over a dark backdrop with one node per
// level. Locked nodes show a gate, completed nodes a flag, the castle keep sits
// behind its node, and the chibi walks the path (90px/s) between reachable
// nodes. E/Enter on a lit node enters its level (or a "coming soon" toast for
// levels not built yet); the archive/gallery node leaves for the gallery route.

interface NodePoint {
  id: OverNodeId;
  x: number;
  y: number;
}

// LOCKED coordinate table (task brief). Screen-space in the 960×540 view.
const NODES: NodePoint[] = [
  { id: "1-1", x: 120, y: 380 },
  { id: "1-2", x: 260, y: 300 },
  { id: "1-3", x: 420, y: 350 },
  { id: "1-4", x: 580, y: 260 },
  { id: "castle", x: 760, y: 180 },
  { id: "archive", x: 880, y: 120 },
];

const WALK_SPEED = 90; // px/s
const DISC_SCALE = 2.4;
const PLAYER_SCALE = 2.2;

const NODE_LABEL: Record<OverNodeId, string> = {
  "1-1": "1-1", "1-2": "1-2", "1-3": "1-3", "1-4": "1-4",
  castle: "CASTLE", archive: "GALLERY",
};

export class OverworldScene extends Phaser.Scene {
  private progress!: ProgressShape;
  private visible: NodePoint[] = []; // nodes whose state !== hidden, in chain order
  private walkableIds: OverNodeId[] = []; // unlocked | completed (chibi may stand/pass here)
  private player!: Phaser.GameObjects.Sprite;
  private reticle!: Phaser.GameObjects.Arc;
  private cursor = 0; // index into `visible`
  private playerNode!: OverNodeId; // where the chibi stands
  private walking = false;
  private toast?: Phaser.GameObjects.Text;

  constructor() {
    super("Overworld");
  }

  create(data: { justCompleted?: LevelId; castleUnlocked?: boolean } = {}) {
    gameStore.set({ scene: "Overworld" });
    bus.emit("scene:changed", { scene: "Overworld" });

    registerSprites(this, [...FIELDS_PARALLAX, ...OVERWORLD_SPRITES]);

    // Progress: completed/unlocked from the runtime store (seeded at boot /
    // Title / victory), gameCompleted from the durable save (the store doesn't
    // track it) — together they decide every node's state and archive visibility.
    const store = gameStore.get();
    this.progress = {
      completed: store.completed,
      unlocked: store.unlocked,
      gameCompleted: loadSave().gameCompleted,
    };
    this.visible = NODES.filter((n) => this.stateOf(n.id) !== "hidden");
    this.walkableIds = this.visible
      .filter((n) => {
        const s = this.stateOf(n.id);
        return s === "unlocked" || s === "completed";
      })
      .map((n) => n.id);

    this.cameras.main.setBackgroundColor("#06060b");
    this.drawBackdrop();
    this.drawPaths();
    this.drawCastle();
    this.drawNodes(data.justCompleted);
    this.spawnPlayer();
    this.drawHeader();
    if (data.castleUnlocked) this.showToast("CASTLE UNLOCKED");

    audio.playTrack("overworld");
    this.input.once("pointerdown", () => {
      audio.unlock();
      audio.playTrack("overworld");
    });

    const kb = this.input.keyboard!;
    kb.on("keydown-RIGHT", () => this.moveCursor(1));
    kb.on("keydown-UP", () => this.moveCursor(1));
    kb.on("keydown-LEFT", () => this.moveCursor(-1));
    kb.on("keydown-DOWN", () => this.moveCursor(-1));
    kb.on("keydown-D", () => this.moveCursor(1));
    kb.on("keydown-A", () => this.moveCursor(-1));
    OVERWORLD_ACTIVATE_KEY_EVENTS.forEach((eventName) => {
      kb.on(eventName, () => this.activate());
    });
  }

  private stateOf(id: OverNodeId): NodeState {
    return nodeStateFor(this.progress, id);
  }

  private nodeAt(id: OverNodeId): NodePoint {
    return this.visible.find((n) => n.id === id)!;
  }

  // ── drawing ─────────────────────────────────────────────────────────────

  private drawBackdrop() {
    // Reuse the fields parallax as a dark, low-alpha map backdrop (480×270 →
    // scale 2 to fill the 960×540 view), then a violet dusk wash over it.
    const layers = [
      { key: FIELD_PARALLAX_KEYS.bg0, alpha: 0.5 },
      { key: FIELD_PARALLAX_KEYS.bg2, alpha: 0.28 },
      { key: FIELD_PARALLAX_KEYS.bg1, alpha: 0.18 },
    ];
    for (const l of layers) {
      this.add.image(0, 0, l.key).setOrigin(0, 0).setScale(2).setAlpha(l.alpha).setDepth(-30);
    }
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0714, 0.55).setOrigin(0, 0).setDepth(-20);
  }

  private drawPaths() {
    // Path dots between consecutive VISIBLE nodes. A dim path to a locked node
    // still hints the route; the dots brighten when both ends are walkable.
    for (let i = 0; i < this.visible.length - 1; i++) {
      const a = this.visible[i];
      const b = this.visible[i + 1];
      const lit = this.walkableIds.includes(a.id) && this.walkableIds.includes(b.id);
      const dist = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      const count = Math.max(2, Math.floor(dist / 24));
      for (let s = 1; s < count; s++) {
        const t = s / count;
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        this.add
          .image(x, y, OW_PATH_DOT.key)
          .setScale(1.5)
          .setAlpha(lit ? 0.9 : 0.35)
          .setDepth(-10);
      }
    }
  }

  private drawCastle() {
    const castle = NODES.find((n) => n.id === "castle")!;
    const unlocked = this.stateOf("castle") !== "locked";
    const presentation = castlePresentation(unlocked);
    const keep = this.add
      .image(castle.x, castle.y - 34, OW_CASTLE.key)
      .setScale(2)
      .setAlpha(unlocked ? 0.95 : 0.4)
      .setDepth(-5);
    if (presentation.rifted) {
      keep.setTint(0xb21852);
      this.tweens.add({ targets: keep, alpha: 0.62, duration: 520, yoyo: true, repeat: -1 });
      this.add.circle(castle.x, castle.y - 38, 34, 0x5b0f8a, 0.18).setDepth(-6);
    }
  }

  private drawNodes(justCompleted?: LevelId) {
    for (const n of this.visible) {
      const state = this.stateOf(n.id);
      const disc = this.add
        .image(n.x, n.y, nodeDiscKey(n.id))
        .setScale(DISC_SCALE)
        .setDepth(2)
        .setInteractive({ useHandCursor: true });
      if (state === "locked") disc.setAlpha(0.45).setTint(0x8890a0);
      disc.on("pointerdown", () => this.clickNode(n.id));

      // Label under the node.
      this.add
        .text(n.x, n.y + 26, n.id === "castle"
          ? castlePresentation(state !== "locked").label
          : NODE_LABEL[n.id], {
          fontFamily: "monospace",
          fontSize: "11px",
          fontStyle: "bold",
          color: state === "locked" ? "#5a5a68" : "#d7d9e0",
        })
        .setOrigin(0.5)
        .setDepth(3);

      if (state === "locked") {
        this.add.image(n.x, n.y - 2, OW_GATE.key).setScale(1.6).setDepth(4);
      } else if (state === "completed") {
        const flag = this.add.image(n.x + 12, n.y - 16, OW_FLAG.key).setScale(1.8).setDepth(4);
        if (justCompleted && n.id === justCompleted) {
          flag.setScale(0.4);
          this.tweens.add({ targets: flag, scale: 1.8, duration: 350, ease: "Back.Out" });
          audio.sfx("collect");
        }
      }
    }

    // Selection reticle (repositioned by setCursor).
    this.reticle = this.add
      .circle(0, 0, 22)
      .setStrokeStyle(2, 0xc4b5fd, 0.9)
      .setDepth(5)
      .setVisible(false);
    this.tweens.add({ targets: this.reticle, scale: 1.15, duration: 620, yoyo: true, repeat: -1 });
  }

  private drawHeader() {
    this.add
      .text(GAME_WIDTH / 2, 34, "THE OVERWORLD", {
        fontFamily: "monospace",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#c4b5fd",
      })
      .setOrigin(0.5)
      .setLetterSpacing(6)
      .setShadow(0, 0, "#8b6cf0", 12, false, true);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 26, "←  →  MOVE      SPACE / ENTER / E  SELECT", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#4a4a58",
      })
      .setOrigin(0.5)
      .setLetterSpacing(3);
  }

  private spawnPlayer() {
    // Start on the frontier: the furthest-along walkable node.
    const frontier = [...this.visible].reverse().find((n) => this.walkableIds.includes(n.id));
    this.playerNode = frontier ? frontier.id : this.visible[0].id;
    const at = this.nodeAt(this.playerNode);
    this.player = this.add
      .sprite(at.x, at.y - 18, frameKey(OW_MAP_PLAYER.key, 0))
      .setScale(PLAYER_SCALE)
      .setDepth(10);
    this.setCursor(this.visible.findIndex((n) => n.id === this.playerNode));
  }

  // ── selection + walking ──────────────────────────────────────────────────

  private setCursor(i: number) {
    this.cursor = Phaser.Math.Clamp(i, 0, this.visible.length - 1);
    const n = this.visible[this.cursor];
    this.reticle.setPosition(n.x, n.y).setVisible(true);
  }

  private moveCursor(delta: number) {
    if (this.walking) return;
    const next = Phaser.Math.Clamp(this.cursor + delta, 0, this.visible.length - 1);
    if (next === this.cursor) return;
    this.setCursor(next);
    audio.sfx("select");
    this.tryWalkTo(this.visible[next].id);
  }

  private clickNode(id: OverNodeId) {
    if (this.walking) return;
    const idx = this.visible.findIndex((n) => n.id === id);
    if (idx < 0) return;
    this.setCursor(idx);
    if (id === this.playerNode) {
      this.activate(); // tap the node you're already on → enter it
    } else {
      audio.sfx("select");
      this.tryWalkTo(id);
    }
  }

  /** Walk the chibi from its node to `to` if the whole segment is walkable. */
  private tryWalkTo(to: OverNodeId) {
    if (to === this.playerNode) return;
    const path = walkPath(this.playerNode, to, this.walkableIds);
    if (!path) return; // blocked by a locked node — cursor still highlights it
    this.walkAlong(path);
  }

  private walkAlong(path: OverNodeId[]) {
    this.walking = true;
    this.player.play(animKey(OW_MAP_PLAYER.key, "walk"), true);
    const steps = path.slice(1).map((id) => this.nodeAt(id));

    const stepTo = (i: number) => {
      if (i >= steps.length) {
        this.walking = false;
        this.playerNode = path[path.length - 1];
        this.player.anims.stop();
        this.player.setTexture(frameKey(OW_MAP_PLAYER.key, 0));
        return;
      }
      const target = steps[i];
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y - 18);
      if (target.x < this.player.x) this.player.setFlipX(true);
      else if (target.x > this.player.x) this.player.setFlipX(false);
      this.tweens.add({
        targets: this.player,
        x: target.x,
        y: target.y - 18,
        duration: Math.max(120, (dist / WALK_SPEED) * 1000),
        ease: "Linear",
        onComplete: () => stepTo(i + 1),
      });
    };
    stepTo(0);
  }

  // ── activation ────────────────────────────────────────────────────────────

  private activate() {
    if (this.walking) return;
    const n = this.visible[this.cursor];
    const state = this.stateOf(n.id);

    if (n.id === "archive") {
      audio.sfx("select");
      bus.emit("nav:external", { href: "/gallery" });
      return;
    }

    if (state === "locked") {
      audio.sfx("error");
      this.showToast("LOCKED — clear the path first");
      return;
    }

    // Unlocked / completed level (or castle). All five levels exist now, so
    // the COMING SOON branch is a defensive guard only (it protects against a
    // level ever being unregistered, rather than crashing scene.start).
    const levelId = n.id as LevelId;
    if (LEVELS[levelId]) {
      audio.sfx("select");
      this.scene.start(levelEntryScene(levelId), { levelId });
    } else {
      audio.sfx("select");
      this.showToast("COMING SOON");
    }
  }

  private showToast(msg: string) {
    this.toast?.destroy();
    const t = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.82, msg, {
        fontFamily: "monospace",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ffd75e",
        backgroundColor: "#000000cc",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.toast = t;
    this.tweens.add({
      targets: t,
      alpha: { from: 1, to: 0 },
      delay: 900,
      duration: 700,
      onComplete: () => t.destroy(),
    });
  }
}
