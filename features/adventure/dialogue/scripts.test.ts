import { describe, it, expect } from "vitest";
import { SCRIPTS, resolveScript } from "./scripts";
import { GLITCH_TOAD } from "../bosses/glitchToad";

describe("SCRIPTS", () => {
  it("has the four memory-fragment notes VERBATIM", () => {
    expect(SCRIPTS["frag-1-1"]).toEqual([
      "First bug I ever fixed took me six hours. It was a semicolon. NetWraith watches millions of packets now — same person, better tools.",
    ]);
    expect(SCRIPTS["frag-1-2"]).toEqual([
      "Phishing works because it looks legit. So does self-doubt. Verify the source on both.",
    ]);
    expect(SCRIPTS["frag-1-3"]).toEqual([
      "TripWire fires in under 60 seconds. Discipline is just automation for humans.",
    ]);
    expect(SCRIPTS["frag-1-4"]).toEqual([
      "There's a manga chapter I never drew. This game exists because blank pages lose if you start anyway.",
    ]);
  });

  it("has a 2-3 line, non-empty Bug Fields intro", () => {
    const lines = SCRIPTS["intro-1-1"];
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines.length).toBeLessThanOrEqual(3);
    for (const line of lines) expect(line.length).toBeGreaterThan(0);
  });
});

describe("resolveScript", () => {
  it("hits the static table for a known id (same reference — no copy)", () => {
    expect(resolveScript("intro-1-1")).toBe(SCRIPTS["intro-1-1"]);
  });

  it("dynamically resolves a registered boss's intro lines from BOSSES", () => {
    expect(resolveScript("boss-intro-glitch-toad")).toEqual(GLITCH_TOAD.intro);
  });

  it("dynamically resolves a registered boss's defeat lines from BOSSES", () => {
    expect(resolveScript("boss-defeat-glitch-toad")).toEqual(GLITCH_TOAD.defeatLines);
  });

  it("returns null for boss-shaped ids naming an unregistered boss", () => {
    expect(resolveScript("boss-intro-warden")).toBeNull();
    expect(resolveScript("boss-defeat-warden")).toBeNull();
  });

  it("returns null for a totally unknown id", () => {
    expect(resolveScript("nonsense")).toBeNull();
    expect(resolveScript("")).toBeNull();
  });
});
