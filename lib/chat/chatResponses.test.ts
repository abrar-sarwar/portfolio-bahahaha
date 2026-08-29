// Config sanity: catches the mistakes that are easy to make while adding
// Easter eggs (duplicate ids, colliding triggers, dead suggestion chips,
// media that points at nothing).

import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { CHAT_ENTRIES, FALLBACK_RESPONSES, SUGGESTIONS } from "./chatResponses";
import { CHAT_COMMANDS } from "./commands";
import { respond } from "./engine";
import { normalize } from "./normalize";
import { resolveProjectCard } from "./projectCards";
import { PROJECTS } from "@/lib/projects";

const PUBLIC_DIR = path.resolve(__dirname, "..", "..", "public");

describe("chat config", () => {
  it("has unique ids", () => {
    const ids = CHAT_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry has triggers, and responses unless the media is the reply", () => {
    for (const e of CHAT_ENTRIES) {
      expect(e.triggers.length, e.id).toBeGreaterThan(0);
      if (!e.media) expect(e.responses.length, e.id).toBeGreaterThan(0);
      for (const t of e.triggers) expect(normalize(t), `${e.id}: "${t}"`).not.toBe("");
      for (const r of e.responses) expect(r.trim(), e.id).not.toBe("");
    }
  });

  it("no trigger is claimed by two entries", () => {
    const seen = new Map<string, string>();
    for (const e of CHAT_ENTRIES) {
      for (const t of e.triggers) {
        const key = normalize(t);
        const owner = seen.get(key);
        expect(owner === undefined || owner === e.id, `"${t}" is in both ${owner} and ${e.id}`).toBe(true);
        seen.set(key, e.id);
      }
    }
  });

  it("follow-up keys are non-empty", () => {
    for (const e of CHAT_ENTRIES) {
      for (const k of Object.keys(e.followUps ?? {})) {
        expect(normalize(k), `${e.id}: "${k}"`).not.toBe("");
      }
    }
  });

  it("covers every portfolio project with a card", () => {
    for (const p of PROJECTS) {
      const entry = CHAT_ENTRIES.find((e) => e.project === p.slug);
      expect(entry, p.slug).toBeTruthy();
      const card = resolveProjectCard(p.slug);
      expect(card?.title).toBe(p.title);
      expect(card?.github ?? card?.demo).toBe(p.repoUrl);
      expect(card?.tags?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("existing-asset media actually exists on disk", () => {
    for (const e of CHAT_ENTRIES) {
      const media = e.media ? (Array.isArray(e.media) ? e.media : [e.media]) : [];
      for (const m of media) {
        if (m.type === "terminal") {
          expect(m.lines.length, e.id).toBeGreaterThan(0);
          continue;
        }
        expect(m.src.startsWith("/"), `${e.id}: ${m.src}`).toBe(true);
        // /chat/… are placeholders you fill in later; /assets/… must exist now.
        if (m.src.startsWith("/assets/")) {
          expect(existsSync(path.join(PUBLIC_DIR, m.src)), `${e.id}: missing ${m.src}`).toBe(true);
        }
      }
      if (e.sound?.startsWith("/assets/")) {
        expect(existsSync(path.join(PUBLIC_DIR, e.sound)), `${e.id}: missing ${e.sound}`).toBe(true);
      }
    }
  });

  it("the people with a clip point at the right mp4", () => {
    const clips: Record<string, string> = {
      kevin: "/assets/videos/kevin.mp4",
      john: "/assets/videos/john.mp4",
      luigi: "/assets/videos/luigi.mp4",
    };
    for (const [id, src] of Object.entries(clips)) {
      const entry = CHAT_ENTRIES.find((e) => e.id === id);
      expect(entry, id).toBeTruthy();
      const media = entry!.media ? (Array.isArray(entry!.media) ? entry!.media : [entry!.media]) : [];
      const video = media.find((m) => m.type === "video");
      expect(video, `${id} has no clip`).toBeTruthy();
      expect(video && "src" in video ? video.src : undefined, id).toBe(src);
    }
  });

  it("liam is a picture, not a clip", () => {
    const liam = CHAT_ENTRIES.find((e) => e.id === "liam");
    const media = liam!.media ? (Array.isArray(liam!.media) ? liam!.media : [liam!.media]) : [];
    expect(media.some((m) => m.type === "video"), "liam should have no clip").toBe(false);
    expect(media.find((m) => m.type === "image") && "src" in media[0] ? media[0].src : undefined)
      .toBe("/assets/sprites/liam.png");
  });

  it("a person with something to show says nothing over it", () => {
    // The picture or clip is the whole answer. Only the people with no media
    // (and carolina, whose letter has its own words) get lines.
    const EXEMPT = new Set(["carolina"]);
    for (const e of CHAT_ENTRIES) {
      if (e.category !== "people" || !e.media || EXEMPT.has(e.id)) continue;
      expect(e.responses, `${e.id} still has text over its media`).toHaveLength(0);
    }
  });

  it("poorav answers with his picture and nothing else", () => {
    const poorav = CHAT_ENTRIES.find((e) => e.id === "poorav");
    expect(poorav).toBeTruthy();
    expect(poorav!.category).toBe("people");
    expect(poorav!.hidden).toBe(true);
    expect(poorav!.responses).toHaveLength(0);
    expect(poorav!.triggers).toContain("poorav");
    const media = Array.isArray(poorav!.media) ? poorav!.media[0] : poorav!.media;
    expect(media && "src" in media ? media.src : undefined).toBe("/assets/sprites/poorav.png");
  });

  it("clips are mp4 — never a raw .mov the browser may refuse", () => {
    for (const e of CHAT_ENTRIES) {
      const media = e.media ? (Array.isArray(e.media) ? e.media : [e.media]) : [];
      for (const m of media) {
        if (m.type === "video") expect(m.src, e.id).toMatch(/\.mp4$/);
      }
    }
  });

  it("carolina carries the letter, and the letter is coherent", () => {
    const carolina = CHAT_ENTRIES.find((e) => e.id === "carolina");
    expect(carolina, "carolina entry").toBeTruthy();
    const letter = carolina!.letter;
    expect(letter, "carolina has no letter").toBeTruthy();

    // The portrait swap and the track both have to exist on disk.
    expect(existsSync(path.join(PUBLIC_DIR, letter!.audio)), letter!.audio).toBe(true);
    expect(existsSync(path.join(PUBLIC_DIR, letter!.portrait)), letter!.portrait).toBe(true);
    expect(carolina!.portrait, "the quiet reply keeps ren").toBe(letter!.portrait);

    // Lines are in order, none overlap the end, and the last one gets room to
    // sit before the screen comes back.
    const lines = letter!.lines;
    expect(lines.length).toBeGreaterThan(0);
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i].at, `line ${i} runs before line ${i - 1}`).toBeGreaterThan(lines[i - 1].at);
    }
    for (const line of lines) {
      expect(line.text.trim(), "empty line").not.toBe("");
      expect(line.at, `"${line.text}" starts after the letter ends`).toBeLessThan(letter!.duration);
    }
    const last = lines[lines.length - 1];
    expect(letter!.duration - last.at, "the last line has no room to land").toBeGreaterThanOrEqual(4);

    // Once the letter has played, the entry still answers.
    expect(carolina!.responses.length).toBeGreaterThan(0);
  });

  it("a letter's timings fit the track it is written against", async () => {
    // Guards the thing that silently rots: swap the audio for a shorter cut
    // and the lines outlive it.
    const { execFileSync } = await import("node:child_process");
    for (const e of CHAT_ENTRIES) {
      if (!e.letter) continue;
      const file = path.join(PUBLIC_DIR, e.letter.audio);
      let seconds: number;
      try {
        seconds = Number(
          execFileSync(
            "ffprobe",
            ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
            { encoding: "utf8" },
          ).trim(),
        );
      } catch {
        return; // no ffprobe on this machine, skip rather than fail the suite
      }
      expect(Number.isFinite(seconds), `could not read ${e.letter.audio}`).toBe(true);
      const last = e.letter.lines[e.letter.lines.length - 1].at;
      expect(last, `${e.id}: the last line starts after the track ends`).toBeLessThan(seconds);
      expect(
        Math.abs(e.letter.duration - seconds),
        `${e.id}: duration ${e.letter.duration}s is out of step with a ${seconds.toFixed(1)}s track`,
      ).toBeLessThanOrEqual(3);
    }
  });

  it("every suggestion chip lands on a real reply", () => {
    for (const s of SUGGESTIONS) {
      const r = respond(s.send);
      expect(r.replies[0]?.kind, s.send).not.toBe("fallback");
    }
  });

  it("fallbacks are non-empty and distinct", () => {
    expect(FALLBACK_RESPONSES.length).toBeGreaterThan(3);
    expect(new Set(FALLBACK_RESPONSES).size).toBe(FALLBACK_RESPONSES.length);
  });

  it("command names and aliases do not collide", () => {
    const names = CHAT_COMMANDS.flatMap((c) => [c.name, ...(c.aliases ?? [])]);
    expect(new Set(names).size).toBe(names.length);
  });
});
