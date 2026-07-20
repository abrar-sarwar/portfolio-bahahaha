// features/adventure/scenes/overworldLogic.ts
// Pure, headless-testable logic for the Overworld map. No Phaser, no store —
// just the node chain, per-node save-state derivation, and path-walking. The
// OverworldScene owns all rendering/tween glue; this file owns the rules.
import type { LevelId } from "../ids";

/** A map node: every playable level plus the special gallery "archive" node. */
export type OverNodeId = LevelId | "archive";

/** The locked linear chain. Adjacency for walking is "consecutive in this
 *  array". Mirrors the world order used everywhere else (fields → harbor →
 *  factory → archive-theme level → castle) with the gallery archive last. */
export const NODE_ORDER: OverNodeId[] = ["1-1", "1-2", "1-3", "1-4", "castle", "archive"];

export type NodeState = "locked" | "unlocked" | "completed" | "hidden";

/** The minimal progress shape nodeStateFor needs — satisfied by both an
 *  AdventureSave and the runtime gameStore's additive `completed`/`unlocked`
 *  fields. `gameCompleted` only lives on the save; a bare store shape omits it
 *  and the archive stays hidden (its intended pre-endgame state). */
export interface ProgressShape {
  completed: readonly LevelId[];
  unlocked: readonly LevelId[];
  gameCompleted?: boolean;
}

/** Derive a node's display state from progress.
 *
 *  The archive (gallery) node is HIDDEN until the whole game is beaten
 *  (`gameCompleted`), then it shows as an ordinary unlocked node.
 *
 *  Every other node — INCLUDING the castle — is a plain three-way of the
 *  persisted lists: completed wins, else unlocked, else locked. The castle
 *  node unlocks the same way any level does: completing 1-4 pushes "castle"
 *  into `unlocked` (save.ts UNLOCK_NEXT). The `castleKey` requirement gates
 *  the castle DOOR inside the castle level (Task 21), NOT this overworld node,
 *  so nothing here consults castleKey. */
export function nodeStateFor(p: ProgressShape, id: OverNodeId): NodeState {
  if (id === "archive") return p.gameCompleted ? "unlocked" : "hidden";
  if (p.completed.includes(id)) return "completed";
  if (p.unlocked.includes(id)) return "unlocked";
  return "locked";
}

/** Plan the chibi's walk from `from` to `to` along the linear chain, returning
 *  the inclusive sequence of node ids to step through — or null if the walk is
 *  impossible because some node on the segment (either endpoint included) is
 *  not in the walkable `unlocked` set.
 *
 *  The chain is a line, so there is exactly one route between any two nodes;
 *  we walk index-by-index toward the target and bail the moment we hit a node
 *  that isn't walkable. Callers pass the union of unlocked + completed nodes
 *  (completed levels stay walkable for replay) plus the archive once visible. */
export function walkPath(
  from: OverNodeId,
  to: OverNodeId,
  unlocked: readonly OverNodeId[],
): OverNodeId[] | null {
  const fi = NODE_ORDER.indexOf(from);
  const ti = NODE_ORDER.indexOf(to);
  if (fi < 0 || ti < 0) return null;
  const step = ti >= fi ? 1 : -1;
  const path: OverNodeId[] = [];
  for (let i = fi; ; i += step) {
    const node = NODE_ORDER[i];
    if (!unlocked.includes(node)) return null; // blocked: a locked node on the way
    path.push(node);
    if (i === ti) break;
  }
  return path;
}
