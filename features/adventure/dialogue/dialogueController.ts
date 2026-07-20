// features/adventure/dialogue/dialogueController.ts
// The bridge between a dialogue script id and the running game: resolves the
// id (resolveScript), publishes the { id, lines, line } snapshot to the
// store Dialogue.tsx renders from, and emits the dialogue:open / :closed bus
// events other systems react to. Mirrors combat/controller.ts's shape at a
// much smaller scale.
//
// Deliberately does NOT touch gameStore.paused. That field is
// PlatformLevelScene's own P/Esc manual-pause toggle: its update() loop
// unconditionally flips `paused` back to false and resumes physics the
// instant it sees a pause-key press, with no notion of an open dialogue —
// and Dialogue.tsx itself treats Space/Enter/E as "advance the line", the
// very same keys that toggle a manual pause. Reusing `paused` here would
// fight that toggle (Escape could silently resume the world out from under
// an open dialogue while the dialogue panel is still showing). Instead,
// gameplay freeze is driven independently: PlatformLevelScene listens for
// dialogue:open/:closed itself (physics.pause()/resume()) and gates its own
// update() loop on `gameStore.dialogue !== null` directly, alongside — not
// through — the `paused` branch. See PlatformLevelScene's create()/update()
// doc comments for that half of the wiring.
import { resolveScript } from "./scripts";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";

/** Open a dialogue script by id. Returns true if it resolved and opened,
 *  false (no-op, store untouched) if `id` doesn't resolve to any script —
 *  callers treat that as "nothing to show for this beat", not an error. */
export function openDialogue(id: string): boolean {
  const lines = resolveScript(id);
  if (!lines || lines.length === 0) return false;
  gameStore.set({ dialogue: { id, lines, line: 0 } });
  bus.emit("dialogue:open", { id });
  return true;
}

/** Advance past the current line: to the next line if any remain, else close
 *  the whole script (same effect as an explicit skip). No-op if no dialogue
 *  is open. */
export function advanceDialogue(): void {
  const d = gameStore.get().dialogue;
  if (!d) return;
  if (d.line + 1 >= d.lines.length) {
    closeDialogue();
    return;
  }
  gameStore.set({ dialogue: { ...d, line: d.line + 1 } });
}

/** End the whole script immediately (SKIP button, or advanceDialogue past
 *  the last line) and emit dialogue:closed with the id that just closed.
 *  No-op (no emit) if no dialogue is open. */
export function closeDialogue(): void {
  const d = gameStore.get().dialogue;
  if (!d) return;
  gameStore.set({ dialogue: null });
  bus.emit("dialogue:closed", { id: d.id });
}
