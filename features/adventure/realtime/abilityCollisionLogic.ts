export function canAbilityHit(lastHitId: number | undefined, currentHitId: number): boolean {
  return lastHitId !== currentHitId;
}

export function nextAbilityHitId(current: number): number {
  return current + 1;
}
