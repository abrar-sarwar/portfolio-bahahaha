import { describe, it, expect } from "vitest";
import { defaultSave } from "./save";
import { applyAudioSettings, hazardAccessibilityProfile, rebaseSettings, setVolume, setMuted, setAccessibility } from "./settings";
import { audio } from "../audio/synth";

describe("setVolume / setMuted / setAccessibility (pure)", () => {
  it("setVolume updates only settings.volume", () => {
    const next = setVolume(defaultSave(), 0.3);
    expect(next.settings.volume).toBe(0.3);
    expect(next.settings.muted).toBe(false);
  });

  it("setMuted updates only settings.muted", () => {
    const next = setMuted(defaultSave(), true);
    expect(next.settings.muted).toBe(true);
    expect(next.settings.volume).toBe(defaultSave().settings.volume);
  });

  it("setAccessibility merges a partial patch, leaving other flags untouched", () => {
    const next = setAccessibility(defaultSave(), { reduceFlash: true });
    expect(next.settings.accessibility.reduceFlash).toBe(true);
    expect(next.settings.accessibility.noShake).toBe(false);
    expect(next.settings.accessibility.widerParry).toBe(false);
    expect(next.settings.accessibility.slowerHazards).toBe(false);
  });

  it("does not mutate the input save", () => {
    const save = defaultSave();
    setVolume(save, 0.1);
    setMuted(save, true);
    expect(save.settings.volume).not.toBe(0.1);
    expect(save.settings.muted).toBe(false);
  });

  it("rebases edited settings onto the latest progression snapshot", () => {
    const stalePanelSave = setAccessibility(defaultSave(), { noShake: true });
    const latestSave = { ...defaultSave(), completed: ["1-1" as const], unlocked: ["1-1" as const, "1-2" as const] };
    const rebased = rebaseSettings(latestSave, stalePanelSave.settings);

    expect(rebased.completed).toEqual(["1-1"]);
    expect(rebased.unlocked).toEqual(["1-1", "1-2"]);
    expect(rebased.settings.accessibility.noShake).toBe(true);
  });
});

describe("hazardAccessibilityProfile", () => {
  it("is neutral by default and slows projectiles/timers when enabled", () => {
    expect(hazardAccessibilityProfile(false)).toEqual({ projectileSpeedScale: 1, hazardTimerScale: 1 });
    expect(hazardAccessibilityProfile(true)).toEqual({ projectileSpeedScale: 0.8, hazardTimerScale: 1.25 });
  });
});

describe("applyAudioSettings", () => {
  it("applies the save's volume and muted state to the audio engine", () => {
    applyAudioSettings({
      ...defaultSave(),
      settings: { ...defaultSave().settings, volume: 0.42, muted: true },
    });
    expect(audio.getState()).toEqual({ volume: 0.42, muted: true });
  });
});
