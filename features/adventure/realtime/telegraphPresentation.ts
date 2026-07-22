export interface TelegraphPresentation {
  tint: number;
  halo: number;
  finalPulseDelayMs: number | null;
}

export function telegraphPresentation(
  parryable: boolean,
  telegraphMs: number,
): TelegraphPresentation {
  return parryable
    ? {
        tint: 0xffe08a,
        halo: 0xffd75e,
        finalPulseDelayMs: Math.max(0, telegraphMs - 320),
      }
    : {
        tint: 0xff6a6a,
        halo: 0xef4444,
        finalPulseDelayMs: null,
      };
}
