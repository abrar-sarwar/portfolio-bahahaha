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

/** Restomp window (ms): a contact that resolves as "damage" within this many
 *  ms of the player's last stomp, against a stompable enemy, is upgraded to a
 *  stomp instead — lets a single fall chain-stomp stacked enemies rather than
 *  stomp one and take contact damage from the next in the same frame. */
export const RESTOMP_WINDOW_MS = 60;

/**
 * Upgrades a "damage" decision to "stomp" when it lands just after another
 * stomp this same fall (stacked/adjacent enemies) and the enemy in question is
 * stompable. An already-resolved "stomp" passes through unchanged.
 */
export function applyRestompWindow(
  decision: "stomp" | "damage",
  stompable: boolean,
  now: number,
  lastStompAt: number,
): "stomp" | "damage" {
  if (decision === "stomp") return decision;
  if (stompable && now - lastStompAt < RESTOMP_WINDOW_MS) return "stomp";
  return decision;
}

export type PhishlingState = "disguised" | "revealed" | "lunging" | "exposed";

/** Stun duration (ms) once the analyze exploit exposes a disguised phishling. */
export const STUN_MS = 1500;

export interface PhishlingInputs {
  /** Distance (px) from the phishling to the player. */
  dist: number;
  /** True once the reveal animation has finished playing (form is dropped). */
  revealed: boolean;
  /** True once the current timed phase (hover cooldown / lunge) has elapsed. */
  cooldownOver: boolean;
  /** True the frame the player uses the analyze exploit within range. */
  analyzed: boolean;
  /** True once the exposed/stun timer (STUN_MS) has elapsed. */
  stunOver: boolean;
}

/**
 * Phishling state machine. Disguised as loot until the player draws near, then
 * reveals and repeatedly lunges with a hover cooldown between strikes. Using
 * the analyze exploit while it is still disguised exposes it (stunned: no
 * lunges, no contact damage, but stompable) for STUN_MS, after which it drops
 * into the same "revealed" hostile state a normal reveal would reach —
 * hover-cooldown -> lunge cycle as usual.
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
      // Stun expires -> normal revealed hostile (hover/lunge cycle resumes).
      return inp.stunOver ? "revealed" : "exposed";
  }
}
