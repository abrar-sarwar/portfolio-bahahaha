// Config sanity for the globe: pins (places I'm headed) and visited places
// share one slug namespace, and the panel lookup covers both.

import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  WORLD_HOME,
  WORLD_LOCATIONS,
  WORLD_PINS,
  locationBySlug,
  panelEntryBySlug,
  pinBySlug,
} from "./world";

const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
const onDisk = (p: string) => existsSync(path.join(PUBLIC_DIR, p));

describe("world pins", () => {
  it("drops a red dot on seattle for the microsoft internship", () => {
    const wa = pinBySlug("washington");
    expect(wa?.label).toBe("Seattle");
    expect(wa?.content).toEqual(["Incoming SWE @ Microsoft"]);
    // The logo that fades in when the pin is opened, on a lanyard badge
    // that carries the start date.
    expect(wa?.image).toBe("/assets/sprites/microsoft-logo.png");
    expect(wa?.badge?.starts).toBe("May 17th, 2027");
    expect(wa?.badge?.name).toBe("Abrar Sarwar");
    // Seattle proper, not D.C.: inside Washington state's bounding box and
    // on Puget Sound.
    expect(wa!.lat).toBeCloseTo(47.6, 0);
    expect(wa!.lng).toBeCloseTo(-122.3, 0);
    expect(wa!.lat).toBeGreaterThan(45.5);
    expect(wa!.lat).toBeLessThan(49.1);
    expect(wa!.lng).toBeGreaterThan(-124.9);
    expect(wa!.lng).toBeLessThan(-116.9);
  });

  it("the trip to seattle starts at home, with the on-the-way loop that stops on arrival", () => {
    const wa = pinBySlug("washington");
    expect(wa?.journey?.from).toBe(WORLD_HOME.slug);
    expect(wa?.journey?.sound).toBe("/assets/videos/ontheway.m4a");
    // Every journey starts from a visited place, so the arc has somewhere to
    // begin.
    for (const pin of WORLD_PINS) {
      if (pin.journey) {
        expect(locationBySlug(pin.journey.from), `${pin.slug} journeys from nowhere`).toBeTruthy();
      }
    }
  });

  it("home is a star on atlanta, georgia", () => {
    expect(WORLD_HOME.slug).toBe("georgia");
    expect(WORLD_HOME.label.toLowerCase()).toContain("here");
    // Atlanta.
    expect(WORLD_HOME.lat).toBeCloseTo(33.75, 1);
    expect(WORLD_HOME.lng).toBeCloseTo(-84.39, 1);
    // The star sits on a visited place, so clicking it opens that panel.
    expect(locationBySlug(WORLD_HOME.slug)).toBeTruthy();
  });

  it("every pin and home asset exists on disk", () => {
    for (const pin of WORLD_PINS) {
      if (pin.image) expect(onDisk(pin.image), `${pin.slug}: ${pin.image}`).toBe(true);
      if (pin.journey) expect(onDisk(pin.journey.sound), `${pin.slug}: ${pin.journey.sound}`).toBe(true);
    }
  });

  it("pins never share a slug with a visited place", () => {
    const visited = new Set(WORLD_LOCATIONS.map((l) => l.slug));
    for (const pin of WORLD_PINS) {
      expect(visited.has(pin.slug), `pin "${pin.slug}" collides with a visited place`).toBe(false);
    }
    const pinSlugs = WORLD_PINS.map((p) => p.slug);
    expect(new Set(pinSlugs).size).toBe(pinSlugs.length);
  });

  it("the panel lookup finds visited places and pins alike", () => {
    const georgia = panelEntryBySlug("georgia");
    expect(georgia?.kind).toBe("visited");
    expect(georgia?.kicker).toBe("Been here");
    expect(georgia?.image).toBeTruthy();

    const wa = panelEntryBySlug("washington");
    expect(wa?.kind).toBe("pin");
    expect(wa?.kicker).toBe("Up next");
    expect(wa?.label).toBe("Seattle");
    expect(wa?.content).toEqual(["Incoming SWE @ Microsoft"]);
    expect(wa?.image).toBe("/assets/sprites/microsoft-logo.png");
    expect(wa?.badge?.starts).toBe("May 17th, 2027");

    expect(panelEntryBySlug("atlantis")).toBeUndefined();
  });
});
