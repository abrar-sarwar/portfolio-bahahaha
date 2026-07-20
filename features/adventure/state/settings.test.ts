import { describe, it, expect } from "vitest";
import { defaultSave } from "./save";
import { applyAudioSettings, setVolume, setMuted, setAccessibility } from "./settings";
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
  });

  it("does not mutate the input save", () => {
    const save = defaultSave();
    setVolume(save, 0.1);
    setMuted(save, true);
    expect(save.settings.volume).not.toBe(0.1);
    expect(save.settings.muted).toBe(false);
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
