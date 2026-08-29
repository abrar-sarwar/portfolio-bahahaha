// Config sanity for the projects list: every referenced asset exists, every
// slug has an accent, and the newest-first order holds.

import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  PROJECTS,
  PROJECTS_MAIN_BACKGROUND,
  PROJECT_ACCENTS,
  PROJECT_CHARACTER_LIST,
  PROJECT_CHARACTERS,
} from "./projects";
import { PROJECTS as PRO_PROJECTS } from "./professional";

const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
const onDisk = (p: string) => existsSync(path.join(PUBLIC_DIR, p));

describe("projects config", () => {
  it("has unique slugs", () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("is ordered newest first — arkham leads, counterstack closes", () => {
    expect(PROJECTS[0].slug).toBe("arkham");
    expect(PROJECTS[PROJECTS.length - 1].slug).toBe("counterstack");
  });

  it("renamed glint to leek", () => {
    const leek = PROJECTS.find((p) => p.slug === "leek");
    expect(leek?.title).toBe("Leek");
    expect(leek?.repoUrl).toBe("https://github.com/abrar-sarwar/leek");
    expect(PROJECTS.some((p) => (p.slug as string) === "glint")).toBe(false);
  });

  it("every project has a write-up, and every write-up is lowercase", () => {
    for (const p of PROJECTS) {
      expect(p.description?.trim(), `${p.slug} has no description`).toBeTruthy();
      // The write-ups are deliberately all-lowercase, matching the chat's voice.
      expect(p.description, `${p.slug} has uppercase copy`).toBe(p.description!.toLowerCase());
    }
  });

  it("every write-up stays at a glance — 3 sentences, no scrolling", () => {
    for (const p of PROJECTS) {
      const copy = p.description ?? "";
      const sentences = copy.split(/\.\s+/).filter((x) => x.trim() !== "").length;
      expect(sentences, `${p.slug} runs ${sentences} sentences`).toBeLessThanOrEqual(3);
      expect(copy.length, `${p.slug} is ${copy.length} chars`).toBeLessThanOrEqual(440);
    }
  });

  it("leek is the gta 6 leak case study, not the old shinyhunters dossier", () => {
    const leek = PROJECTS.find((p) => p.slug === "leek");
    expect(leek?.tag.toLowerCase()).toContain("gta 6");
    expect(leek?.description).toContain("gta 6");
    // The old subject must not linger anywhere a visitor can read it.
    const surfaces = [leek?.tag, leek?.description, ...PRO_PROJECTS.map((p) => p.description)];
    for (const text of surfaces) {
      expect(text?.toLowerCase() ?? "", "stale shinyhunters copy").not.toContain("shinyhunters");
    }
  });

  it("counterstack's write-up covers the game, the win, the suits and the ai boss", () => {
    const cs = PROJECTS.find((p) => p.slug === "counterstack");
    const copy = cs?.description ?? "";
    for (const beat of ["nist", "hacklanta", "won", "spades", "diamonds", "ai boss"]) {
      expect(copy, `counterstack write-up is missing "${beat}"`).toContain(beat);
    }
    expect(cs?.video?.src).toMatch(/\.mp4$/);
  });

  it("arkham has its own artwork and batman as its character", () => {
    const arkham = PROJECTS.find((p) => p.slug === "arkham");
    expect(arkham?.spriteSrc).toBe("/assets/sprites/arkhamcity.webp");
    expect(arkham?.backgroundSrc).toBe("/assets/sprites/arkhamcity.webp");
    // No longer borrowing the projects page's backdrop.
    expect(arkham?.backgroundSrc).not.toBe(PROJECTS_MAIN_BACKGROUND);

    const batman = PROJECT_CHARACTERS.arkham;
    expect(batman?.img).toBe("/assets/sprites/batman.png");
    expect(batman?.video).toBe("/assets/videos/arkham.mp4");
  });

  it("leek embeds its clip in the panel while chrollo keeps his own, like counterstack", () => {
    const leek = PROJECTS.find((p) => p.slug === "leek");
    expect(leek?.video?.src).toBe("/assets/videos/leek.mp4");
    expect(leek?.video?.poster).toBe("/assets/videos/leek-poster.jpg");
    // The character clip is the Chrollo edit, not the embedded one — the same
    // split counterstack has (counterstack.mp4 embedded, magicianvideo.mp4 on
    // the character). Its `credit` belongs to the Chrollo edit.
    expect(PROJECT_CHARACTERS.leek?.video).toBe("/assets/videos/abrarglint.mp4");
    expect(PROJECT_CHARACTERS.leek?.credit).toBe("_sarah.aep");
    expect(PROJECT_CHARACTERS.counterstack?.video).not.toBe(
      PROJECTS.find((p) => p.slug === "counterstack")?.video?.src,
    );
  });

  it("an embedded clip's `original` source, when present, exists on disk", () => {
    // `original` renders as a second <source>. This catches a typo'd path; it
    // cannot catch a file that exists locally but is left untracked in git.
    for (const p of PROJECTS) {
      if (p.video?.original) {
        expect(onDisk(p.video.original), `${p.slug}: ${p.video.original}`).toBe(true);
      }
    }
  });

  it("every character clip is an mp4, never a raw .mov", () => {
    for (const c of PROJECT_CHARACTER_LIST) {
      expect(c.video, c.alt).toMatch(/\.mp4$/);
    }
  });

  it("every referenced asset exists on disk", () => {
    for (const p of PROJECTS) {
      expect(onDisk(p.spriteSrc), `${p.slug}: ${p.spriteSrc}`).toBe(true);
      expect(onDisk(p.backgroundSrc), `${p.slug}: ${p.backgroundSrc}`).toBe(true);
      if (p.video) {
        expect(onDisk(p.video.src), `${p.slug}: ${p.video.src}`).toBe(true);
        if (p.video.original) expect(onDisk(p.video.original), `${p.slug}: ${p.video.original}`).toBe(true);
        if (p.video.poster) expect(onDisk(p.video.poster), `${p.slug}: ${p.video.poster}`).toBe(true);
      }
    }
    for (const c of PROJECT_CHARACTER_LIST) {
      expect(onDisk(c.img), c.img).toBe(true);
      expect(onDisk(c.video), c.video).toBe(true);
    }
  });

  it("every project has an accent, and a character or the main fallback", () => {
    for (const p of PROJECTS) {
      expect(PROJECT_ACCENTS[p.slug], p.slug).toBeTruthy();
      expect(PROJECT_CHARACTERS[p.slug] ?? PROJECT_CHARACTERS.main, p.slug).toBeTruthy();
    }
  });
});
