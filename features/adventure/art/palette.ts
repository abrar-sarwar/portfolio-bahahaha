/** Global 32-color palette. Char → hex. "." is transparent (not listed). */
export const PALETTE: Record<string, string> = {
  // neutrals
  O: "#0a0a0d", K: "#16161c", k: "#23232c", D: "#33333f", d: "#4a4a58",
  W: "#e8e8ee", C: "#d7d9e0", c: "#9a9dab",
  // skin / hair
  S: "#c98f5f", s: "#a8714a", H: "#1b1410", h: "#33261a",
  // site violet / magic
  V: "#c4b5fd", v: "#8b6cf0", U: "#5b3fb8",
  // cyber blue
  B: "#6ec1ff", b: "#2f7fd4", N: "#1a3a5c",
  // corruption red
  R: "#ef4444", r: "#a02030", X: "#5c0f18",
  // world greens (Bug Fields)
  G: "#59c95f", g: "#2f8f45", F: "#1c5a30",
  // harbor teal
  T: "#3fbdb0", t: "#20726e",
  // factory orange / molten
  M: "#ff9f45", m: "#d4622a", L: "#8f3415",
  // archive sepia
  P: "#cbb289", p: "#8f7a55",
  // gold / key
  Y: "#ffd75e", y: "#c9a227",
  // World 1-1 city→temple additions (Task 34, realtime rework; ≤8 budget, 4 used)
  J: "#4f9e86", // jade — pagoda roof tiles, temple trim, horizon band
  e: "#cf4b2a", // lacquer red / cinnabar — temple beams, lanterns, door frame
  w: "#6f4326", // timber — door planks, beam platforms, scaffolds
  E: "#ff5db0", // city neon magenta — signage tube
  // World 1-2 desert→underground additions (Task 36; kit char E remapped → x)
  A: "#e6d0a3", // lit dune-crest sand highlight
  x: "#9c6b3f", // weathered sandstone / ruin-block & tunnel-brick mid
  u: "#4a3524", // umber cave-rock body
  n: "#10203a", // deep-blue underground gloom
  Q: "#bff2ff", // icy crystal sparkle highlight
  // Hollow Giant flesh ramp (Task 37; kit chars E/e remapped → f/i)
  f: "#a3838c", // dead-flesh light (pallid mauve)
  i: "#6d5259", // dead-flesh shadow (deep mauve-brown)
};
