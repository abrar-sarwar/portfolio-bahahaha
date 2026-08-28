import { describe, expect, it } from "vitest";
import { respond } from "./engine";
import { normalize, tokenize } from "./normalize";
import { findBestMatch } from "./matcher";
import { FALLBACK_RESPONSES, CHAT_ENTRIES } from "./chatResponses";
import { createChatContext, type ChatEntry } from "./types";
import { PROJECTS } from "@/lib/projects";

/** Deterministic rng: cycles through a fixed sequence. */
function seeded(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

const first = (input: string, ctx = createChatContext()) => respond(input, ctx).replies[0];

describe("normalize", () => {
  it("lowercases, trims and collapses whitespace", () => {
    expect(normalize("  BLEACH   is  Peak ")).toBe("bleach is peak");
  });
  it("strips punctuation and apostrophes", () => {
    expect(normalize("bleach!!!")).toBe("bleach");
    expect(normalize("what's up?")).toBe("whats up");
    expect(normalize("gojo’s")).toBe("gojos");
    expect(normalize("jujutsu-kaisen")).toBe("jujutsu kaisen");
  });
  it("keeps + and # so c++ / c# can be triggers", () => {
    expect(tokenize("I write C++ and C#")).toEqual(["i", "write", "c++", "and", "c#"]);
  });
  it("strips accents", () => {
    expect(normalize("résumé")).toBe("resume");
  });
});

describe("matching", () => {
  it("is case-insensitive", () => {
    expect(first("BLEACH").entryId).toBe("bleach");
    expect(first("Bleach").entryId).toBe("bleach");
  });
  it("ignores punctuation", () => {
    expect(first("bleach!!!").entryId).toBe("bleach");
    expect(first("who are you???").entryId).toBe("who-are-you");
  });
  it("matches aliases", () => {
    expect(first("JJK").entryId).toBe("jjk");
    expect(first("jujutsu kaisen").entryId).toBe("jjk");
    expect(first("Luigi").entryId).toBe("luigi");
    expect(first("luigi fernandez").entryId).toBe("luigi");
  });
  it("matches multi-word phrases inside a sentence", () => {
    expect(first("i love threat intelligence").entryId).toBe("threat-intel");
    expect(first("so what do you build?").entryId).toBe("what-do-you-build");
  });
  it("prefers the most specific trigger", () => {
    expect(first("threat intelligence").entryId).toBe("threat-intel");
    expect(first("intelligence").entryId).toBe("intelligence");
    const entries: ChatEntry[] = [
      { id: "a", category: "general", triggers: ["intelligence"], responses: ["a"] },
      { id: "b", category: "general", triggers: ["threat intelligence"], responses: ["b"] },
    ];
    expect(findBestMatch("threat intelligence", entries)?.entry.id).toBe("b");
    expect(findBestMatch("intelligence", entries)?.entry.id).toBe("a");
  });
  it("breaks equal-length ties by priority", () => {
    // "where" (location, priority -1) vs "john" (people, priority 1)
    expect(first("where is john").entryId).toBe("john");
    expect(first("hey abrar").entryId).toBe("abrar");
  });
  it("does not match substrings of larger words", () => {
    expect(first("johnson").kind).toBe("fallback");
    expect(first("johnny").kind).toBe("fallback");
    expect(first("bleached").kind).toBe("fallback");
    expect(first("socket").kind).toBe("fallback");
    expect(first("kevinnnn").kind).toBe("fallback");
  });
  it("forgives a trailing s and possessives", () => {
    expect(first("hackers").entryId).toBe("hacker");
    expect(first("gojo's").entryId).toBe("gojo");
  });
  it("matches c++", () => {
    expect(first("C++").entryId).toBe("network");
  });
});

describe("fallback", () => {
  it("returns a configured fallback for unknown input", () => {
    const reply = first("purple monkey dishwasher xyzzy");
    expect(reply.kind).toBe("fallback");
    expect(FALLBACK_RESPONSES).toContain(reply.text);
  });
  it("returns nothing for empty input", () => {
    expect(respond("   ").replies).toHaveLength(0);
  });
  it("avoids repeating the same fallback twice in a row", () => {
    let ctx = createChatContext();
    let prev: string | null = null;
    for (let i = 0; i < 40; i++) {
      const r = respond("zzzz qqqq", ctx);
      expect(r.replies[0].text).not.toBe(prev);
      prev = r.replies[0].text;
      ctx = r.context;
    }
  });
});

describe("random responses", () => {
  const entry: ChatEntry = {
    id: "multi",
    category: "general",
    triggers: ["multi"],
    responses: ["one", "two", "three"],
  };
  it("picks using the injected rng", () => {
    const a = respond("multi", createChatContext(), { entries: [entry], random: () => 0 });
    const b = respond("multi", createChatContext(), { entries: [entry], random: () => 0.99 });
    expect(a.replies[0].text).toBe("one");
    expect(b.replies[0].text).toBe("three");
  });
  it("never repeats the previous response back to back", () => {
    let ctx = createChatContext();
    let prev: string | null = null;
    const random = seeded([0, 0, 0.5, 0.5, 0.99, 0.99, 0.2, 0.7]);
    for (let i = 0; i < 40; i++) {
      const r = respond("multi", ctx, { entries: [entry], random });
      expect(r.replies[0].text).not.toBe(prev);
      prev = r.replies[0].text;
      ctx = r.context;
    }
  });
});

describe("commands", () => {
  it("/help lists commands and the discovery count", () => {
    const r = respond("/help");
    expect(r.replies[0].kind).toBe("command");
    expect(r.replies[0].text).toContain("/projects");
    expect(r.replies[0].text).toContain(`0 / ${CHAT_ENTRIES.length}`);
  });
  it("is case-insensitive and tolerant of spacing", () => {
    expect(respond("/HELP").replies[0].kind).toBe("command");
    expect(respond("  /help  ").replies[0].kind).toBe("command");
  });
  it("/projects returns a card for every portfolio project", () => {
    const r = respond("/projects");
    const slugs = r.replies.map((x) => x.project).filter((p) => typeof p === "string");
    for (const p of PROJECTS) expect(slugs).toContain(p.slug);
    expect(slugs).toContain("arkham");
    expect(slugs).toContain("leek");
  });
  it("/clear clears and resets the context", () => {
    const seeded = respond("bleach");
    const r = respond("/clear", seeded.context);
    expect(r.action).toBe("clear");
    expect(r.replies).toHaveLength(0);
    expect(r.context.lastEntryId).toBeNull();
    expect(r.context.discovered).toHaveLength(0);
  });
  it("/random surfaces an entry and marks it discovered", () => {
    const r = respond("/random", createChatContext(), { random: () => 0.42 });
    expect(r.replies[0].text).toMatch(/rolled/);
    expect(r.replies[1].kind).toBe("entry");
    expect(r.context.discovered).toContain(r.replies[1].entryId);
    expect(r.context.lastEntryId).toBe(r.replies[1].entryId);
  });
  it("unknown commands point at /help", () => {
    expect(respond("/nope").replies[0].text).toContain("/help");
  });
});

describe("follow-ups", () => {
  it("answers 'why?' in the context of the last entry", () => {
    const a = respond("bleach");
    const b = respond("why?", a.context);
    expect(b.replies[0].kind).toBe("followup");
    expect(b.replies[0].text).toBe("soul society alone clears half your watchlist.");
  });
  it("keeps the context alive across follow-ups", () => {
    const a = respond("bleach");
    const b = respond("why", a.context);
    const c = respond("favorite character?", b.context);
    expect(c.replies[0].kind).toBe("followup");
    expect(c.replies[0].text).toMatch(/aizen/);
  });
  it("falls back to normal matching without context", () => {
    expect(respond("why?").replies[0].kind).toBe("fallback");
  });
  it("loses to a strictly more specific trigger", () => {
    const a = respond("gojo");
    const b = respond("who are you", a.context); // 3-token trigger beats 'who' follow-up
    expect(b.replies[0].entryId).toBe("who-are-you");
  });
  it("survives a typo in between", () => {
    const a = respond("bleach");
    const b = respond("asdfgh", a.context);
    const c = respond("why", b.context);
    expect(c.replies[0].kind).toBe("followup");
  });
});

describe("context", () => {
  it("tracks discovered entries without duplicates", () => {
    let ctx = createChatContext();
    for (const word of ["bleach", "gojo", "bleach", "luigi"]) ctx = respond(word, ctx).context;
    expect(ctx.discovered).toEqual(["bleach", "gojo", "luigi"]);
  });
});

describe("initial content", () => {
  it.each([
    ["abrar", "abrar"],
    ["bro", "abrar"],
    ["kevin", "kevin"],
    ["jared", "jared"],
    ["natasha", "natasha"],
    ["liam", "liam"],
    ["john", "john"],
    ["carolina", "carolina"],
    ["sarah", "sarah"],
    ["sara", "sarah"],
    ["ishan", "ishan"],
    ["arhaan", "arhaan"],
    ["charan", "charan"],
    ["fat", "fat"],
    ["fatty", "fat"],
    ["you're chubby", "fat"],
    ["joey", "joey"],
    ["jeremiah", "jeremiah"],
    ["gojo", "gojo"],
    ["sukuna", "sukuna"],
    ["ichigo", "ichigo"],
    ["aizen", "aizen"],
    ["hacker", "hacker"],
    ["hacking", "hacker"],
    ["cybersecurity", "cybersecurity"],
    ["ctf", "ctf"],
    ["malware", "malware"],
    ["soc", "soc"],
    ["siem", "siem"],
    ["threat intelligence", "threat-intel"],
    ["arkham", "arkham"],
    ["tripwire", "tripwire"],
    ["counterstack", "counterstack"],
    ["netwraith", "netwraith"],
    ["glint", "leek"],
    ["leek", "leek"],
    ["who are you", "who-are-you"],
    ["what do you do", "what-do-you-build"],
    ["what do you build", "what-do-you-build"],
    ["what are you working on", "working-on"],
    ["favorite project", "favorite-project"],
    ["github", "github"],
    ["resume", "resume"],
    ["contact", "contact"],
    ["hire you", "hire"],
  ])("%s -> %s", (input, id) => {
    expect(first(input).entryId).toBe(id);
  });

  it("aizen glitches", () => {
    expect(first("aizen").effect).toBe("glitch");
  });
  it.each([
    ["jared", "/assets/sprites/jared.gif"],
    ["natasha", "/assets/sprites/bignash.gif"],
    ["ishan", "/assets/sprites/ishan.gif"],
    ["arhaan", "/assets/sprites/arhaan.jpg"],
    ["charan", "/assets/sprites/charan.png"],
    ["joey", "/assets/sprites/joey.jpg"],
  ])("%s answers with just the picture", (word, src) => {
    const r = first(word);
    expect(r.text).toBe("");
    expect(r.media?.[0]).toMatchObject({ src });
  });
  it("calling him fat shakes the window and brings out the real fist", () => {
    const r = first("fat");
    expect(r.effect).toBe("shake");
    expect(r.media?.[0]).toMatchObject({ type: "video", src: "/assets/videos/ultrapunchvideo.mp4" });
  });
  it("project entries carry a card", () => {
    expect(first("arkham").project).toBe("arkham");
    expect(first("tripwire").project).toBe("tripwire");
  });
});
