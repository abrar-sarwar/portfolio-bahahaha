export interface EnemyStunState {
  stunnedUntil: number;
  restingTouchDamage: number;
}

export function beginEnemyStun(
  state: EnemyStunState,
  now: number,
  durationMs: number,
): EnemyStunState {
  return {
    ...state,
    stunnedUntil: Math.max(state.stunnedUntil, now + durationMs),
  };
}

export function stepEnemyStun(
  state: EnemyStunState,
  now: number,
): { stunned: boolean; touchDamage: number } {
  const stunned = now < state.stunnedUntil;
  return { stunned, touchDamage: stunned ? 0 : state.restingTouchDamage };
}
