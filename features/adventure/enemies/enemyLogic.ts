// Pure enemy decision logic, extracted so the stomp-vs-touch resolution and the
// phishling state machine are unit-tested without a Phaser scene. No Phaser,
// physics, or timers here — only plain numbers/booleans in, decisions out.

/**
 * Resolve what happens when the player's body overlaps an enemy. A stomp
 * requires the enemy to be stompable, the player to be moving downward
 * (velocity.y > 0), and the player's centre to sit strictly above the enemy's
 * centre by more than the 6px lip. Anything else is contact damage.
 *
 * Note the STRICT `< enemyY - 6`: a player exactly 6px above (playerY ===
 * enemyY - 6) is treated as a side/underside hit, not a stomp.
 */
export function resolvePlayerContact(
  playerVy: number,
  playerY: number,
  enemyY: number,
  stompable: boolean,
): "stomp" | "damage" {
  if (stompable && playerVy > 0 && playerY < enemyY - 6) return "stomp";
  return "damage";
}

export type PhishlingState = "disguised" | "revealed" | "lunging" | "exposed";

export interface PhishlingInputs {
  /** Distance (px) from the phishling to the player. */
  dist: number;
  /** True once the reveal animation has finished playing (form is dropped). */
  revealed: boolean;
  /** True once the current timed phase (hover cooldown / lunge) has elapsed. */
  cooldownOver: boolean;
  /** True the frame the player uses the analyze exploit within range. */
  analyzed: boolean;
}

/**
 * Phishling state machine. Disguised as loot until the player draws near, then
 * reveals and repeatedly lunges with a hover cooldown between strikes. Using
 * the analyze exploit while it is still disguised exposes it permanently
 * (stunned, easy kill).
 */
export function phishlingNext(state: PhishlingState, inp: PhishlingInputs): PhishlingState {
  switch (state) {
    case "disguised":
      if (inp.analyzed) return "exposed"; // exploit only works on the disguise
      return inp.dist < 40 ? "revealed" : "disguised";
    case "revealed":
      // Commit to a lunge once the reveal anim is done AND the hover cooldown
      // has elapsed.
      return inp.revealed && inp.cooldownOver ? "lunging" : "revealed";
    case "lunging":
      // Lunge ends -> back to a revealed hover (which re-arms the cooldown).
      return inp.cooldownOver ? "revealed" : "lunging";
    case "exposed":
    default:
      return "exposed"; // terminal: stays defanged
  }
}
