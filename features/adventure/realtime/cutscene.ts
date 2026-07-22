// Small no-dialogue scripted-sequence seam shared by visual story beats. The
// ordering and chase math stay pure; Phaser scenes only supply delayedCall.
export interface CutsceneStep {
  atMs: number;
  run: () => void;
}

export interface CutsceneScheduler {
  delayedCall(delay: number, callback: () => void): unknown;
}

export function orderedCutsceneSteps(steps: readonly CutsceneStep[]): CutsceneStep[] {
  return steps
    .map((step, order) => ({ step, order }))
    .sort((a, b) => a.step.atMs - b.step.atMs || a.order - b.order)
    .map(({ step }) => step);
}

export function playCutscene(
  scheduler: CutsceneScheduler,
  steps: readonly CutsceneStep[],
  onComplete?: () => void,
): void {
  const ordered = orderedCutsceneSteps(steps);
  for (const step of ordered) scheduler.delayedCall(Math.max(0, step.atMs), step.run);
  const end = ordered.at(-1)?.atMs ?? 0;
  if (onComplete) scheduler.delayedCall(Math.max(0, end), onComplete);
}

export function nextChaseRunnerX(input: {
  runnerX: number;
  playerX: number;
  dtMs: number;
  runSpeed: number;
  finishX: number;
}): number {
  const freeRun = input.runnerX + input.runSpeed * 1.4 * (input.dtMs / 1000);
  const rubberBand = input.playerX + 140;
  return Math.min(input.finishX, Math.max(freeRun, rubberBand));
}
