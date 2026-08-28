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
      liam: "/assets/videos/liam.mp4",
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
