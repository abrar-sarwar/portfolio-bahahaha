import Phaser from "phaser";
import { animKey } from "../art/textures";
import { PHISHLING_SPRITES } from "../art/sprites/enemies1";
import { Enemy } from "./Enemy";
import { phishlingNext, type PhishlingState } from "./enemyLogic";

// Reveal aggro range (player within 40px) lives in the pure phishlingNext().
export const ANALYZE_RANGE_PX = 60; // analyze exploit reach
const REVEAL_MS = 250; // reveal animation before it can strike
const HOVER_COOLDOWN_MS = 700; // hover between lunges
const LUNGE_MS = 500; // lunge travel time
const LUNGE_SPEED = 160;
const HOVER_AMP = 6;

/**
 * Phishling: a floating gift-box mimic. It hovers disguised (dangling a fake
 * "FREE UPGRADE") until the player draws near, then reveals a toothy maw and
 * repeatedly lunges. Stompable only once revealed. The analyze exploit, used
 * while it is still disguised, exposes it permanently (stunned, easy kill).
 */
export class Phishling extends Enemy {
  private phase: PhishlingState = "disguised";
  private phaseEnteredAt = 0;
  private baseY: number;
  private tAccum = 0;
  private revealAnimDone = false;
  private analyzePending = false;
  private freeText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "phishling", PHISHLING_SPRITES.key);
    this.hp = 1;
    this.touchDamage = 1;
    this.stompable = false;
    this.turnAtLedges = false;
    this.baseY = y;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);

    this.play(animKey(this.animBase, "disguise"));
    this.freeText = scene.add
      .text(x - 14, y - 14, "FREE UPGRADE", {
        fontFamily: "monospace",
        fontSize: "6px",
        color: "#c4b5fd",
      })
      .setDepth(11);
  }

  /** Called by the scene when the player uses the analyze exploit in range
   *  while this phishling is still disguised. */
  tryExpose(): void {
    if (this.phase === "disguised") this.analyzePending = true;
  }

  override tick(dtMs: number): void {
    if (this.dying) return;
    const now = this.scene.time.now;
    const player = this.host.playerSprite;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const cooldownOver = now - this.phaseEnteredAt >= this.phaseDuration();

    const next = phishlingNext(this.phase, {
      dist,
      revealed: this.revealAnimDone,
      cooldownOver,
      analyzed: this.analyzePending,
    });
    this.analyzePending = false;
    if (next !== this.phase) this.enterState(next, now);

    switch (this.phase) {
      case "disguised":
        this.tAccum += dtMs;
        this.setVelocity(0, 0);
        this.y = this.baseY + Math.sin(this.tAccum / 260) * HOVER_AMP;
        this.stompable = false;
        break;
      case "revealed":
        this.tAccum += dtMs;
        this.setVelocity(0, 0);
        this.y = this.baseY + Math.sin(this.tAccum / 200) * (HOVER_AMP - 2);
        this.stompable = true;
        break;
      case "lunging":
        this.stompable = true; // velocity carries from enterState()
        break;
      case "exposed":
        this.setVelocity(0, 0);
        this.stompable = true;
        break;
    }

    this.freeText?.setPosition(this.x - 14, this.y - 14);
  }

  /** Timeout length of the current state's timed phase (Infinity = untimed). */
  private phaseDuration(): number {
    if (this.phase === "revealed") return HOVER_COOLDOWN_MS;
    if (this.phase === "lunging") return LUNGE_MS;
    return Infinity; // disguised / exposed are driven by dist / terminal
  }

  private enterState(next: PhishlingState, now: number): void {
    this.phase = next;
    this.phaseEnteredAt = now;
    switch (next) {
      case "revealed": {
        this.baseY = this.y;
        this.tAccum = 0;
        this.destroyFreeText();
        this.play(animKey(this.animBase, "reveal"));
        if (!this.revealAnimDone)
          this.scene.time.delayedCall(REVEAL_MS, () => {
            this.revealAnimDone = true;
          });
        break;
      }
      case "lunging": {
        this.play(animKey(this.animBase, "lunge"));
        const p = this.host.playerSprite;
        const ang = Math.atan2(p.y - this.y, p.x - this.x);
        this.setVelocity(Math.cos(ang) * LUNGE_SPEED, Math.sin(ang) * LUNGE_SPEED);
        this.setFlipX(p.x < this.x);
        break;
      }
      case "exposed": {
        this.destroyFreeText();
        this.play(animKey(this.animBase, "reveal"));
        this.setVelocity(0, 0);
        this.setTint(0x9a9dab); // greyed-out = stunned
        break;
      }
      case "disguised":
        this.play(animKey(this.animBase, "disguise"));
        break;
    }
  }

  private destroyFreeText(): void {
    this.freeText?.destroy();
    this.freeText = undefined;
  }

  protected override onDeath(): void {
    this.destroyFreeText();
  }
}
