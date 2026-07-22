import type { StompContact } from "./StompSystem";

export type BossBodyContactOutcome = "safe" | "stomp" | "damage";

export function bossBodyContactOutcome(
  contact: StompContact,
  stompAccepted: boolean,
): BossBodyContactOutcome {
  if (contact === "contact") return "safe";
  return stompAccepted ? "stomp" : "damage";
}
