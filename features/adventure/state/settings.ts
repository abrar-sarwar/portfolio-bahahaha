// features/adventure/state/settings.ts
// Thin helpers over AdventureSave.settings — settings live inside the save
// (there is no separate settings store/storage key). Pure setters return a
// new AdventureSave; applyAudioSettings is the one impure function here,
// pushing a loaded save's volume/muted onto the `audio` singleton (called
// once at boot, after loadSave()).
import type { AdventureSave } from "./save";
import { audio } from "../audio/synth";

/** Push save.settings.{volume,muted} onto the audio engine. Call once at
 *  boot (after loadSave()) so a returning player's mute/volume choice is
 *  live before the first track plays — audio.setVolume/setMuted are safe to
 *  call before the AudioContext exists (they just prime the values that
 *  buildGraph() reads once unlock() actually creates it). */
export function applyAudioSettings(save: AdventureSave): void {
  // Guard against hand-edited/corrupted saves: the shallow shape check in
  // loadSave doesn't validate nested settings, and a non-finite volume would
  // silently corrupt the master gain (Math.min(1, undefined) -> NaN).
  const v = save.settings.volume;
  audio.setVolume(Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.8);
  audio.setMuted(save.settings.muted === true);
}

export function setVolume(save: AdventureSave, volume: number): AdventureSave {
  return { ...save, settings: { ...save.settings, volume } };
}

export function setMuted(save: AdventureSave, muted: boolean): AdventureSave {
  return { ...save, settings: { ...save.settings, muted } };
}

export function setAccessibility(
  save: AdventureSave,
  patch: Partial<AdventureSave["settings"]["accessibility"]>,
): AdventureSave {
  return {
    ...save,
    settings: { ...save.settings, accessibility: { ...save.settings.accessibility, ...patch } },
  };
}
