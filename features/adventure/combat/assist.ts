export function assistLevelFor(deaths: number): 0 | 1 | 2 | 3 {
  if (deaths >= 6) return 3;
  if (deaths >= 4) return 2;
  if (deaths >= 2) return 1;
  return 0;
}

const TIME_SCALE = [1, 1.25, 1.5, 1.75] as const;
const START_HEAL = [0, 0, 2, 2] as const;

export function assistTimeScale(level: 0 | 1 | 2 | 3): 1 | 1.25 | 1.5 | 1.75 {
  return TIME_SCALE[level];
}

export function assistStartHeal(level: 0 | 1 | 2 | 3): 0 | 2 {
  return START_HEAL[level];
}

export function assistShowsHint(level: 0 | 1 | 2 | 3): boolean {
  return level === 3;
}
