export type ParryGrade = "perfect" | "normal" | "miss";

export type QteSpec =
  | { kind: "parry"; windowMs: number }
  | { kind: "marker"; travelMs: number; targetStart: number; targetEnd: number }
  | { kind: "choice"; promptText: string; options: string[]; correctIndex: number; timeLimitMs: number }
  | { kind: "type-word"; word: string; timeLimitMs: number };

export function resolveParry(pressAt: number | null, impactAt: number, windowMs: number, perfectMs: number): ParryGrade {
  if (pressAt === null) return "miss";
  const lead = impactAt - pressAt;
  if (lead < 0 || lead > windowMs) return "miss";
  return lead <= perfectMs ? "perfect" : "normal";
}

export function markerPosition(elapsedMs: number, travelMs: number): number {
  const t = elapsedMs / travelMs;
  const cycle = t % 2;
  return cycle <= 1 ? cycle : 2 - cycle;
}

export function resolveMarker(
  pressElapsedMs: number | null,
  spec: Extract<QteSpec, { kind: "marker" }>,
): boolean {
  if (pressElapsedMs === null) return false;
  const pos = markerPosition(pressElapsedMs, spec.travelMs);
  return pos >= spec.targetStart && pos <= spec.targetEnd;
}

export function scaleQte(spec: QteSpec, scale: number): QteSpec {
  switch (spec.kind) {
    case "parry": return { ...spec, windowMs: spec.windowMs * scale };
    case "marker": return { ...spec, travelMs: spec.travelMs * scale };
    case "choice": return { ...spec, timeLimitMs: spec.timeLimitMs * scale };
    case "type-word": return { ...spec, timeLimitMs: spec.timeLimitMs * scale };
  }
}
