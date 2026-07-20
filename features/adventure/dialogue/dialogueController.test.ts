import { describe, it, expect, beforeEach } from "vitest";
import { openDialogue, advanceDialogue, closeDialogue } from "./dialogueController";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";

beforeEach(() => {
  gameStore.set({ dialogue: null });
});

describe("openDialogue", () => {
  it("resolves a known script id and opens it at line 0", () => {
    const opened = openDialogue("intro-1-1");
    expect(opened).toBe(true);
    const d = gameStore.get().dialogue;
    expect(d).not.toBeNull();
    expect(d!.id).toBe("intro-1-1");
    expect(d!.line).toBe(0);
    expect(d!.lines.length).toBeGreaterThan(0);
  });

  it("returns false and leaves the store untouched for an unknown id", () => {
    const before = gameStore.get().dialogue;
    const opened = openDialogue("totally-not-a-script");
    expect(opened).toBe(false);
    expect(gameStore.get().dialogue).toBe(before);
  });

  it("resolves a dynamic boss id", () => {
    expect(openDialogue("boss-intro-glitch-toad")).toBe(true);
    expect(gameStore.get().dialogue!.id).toBe("boss-intro-glitch-toad");
  });

  it("emits dialogue:open with the id", () => {
    const seen: string[] = [];
    const off = bus.on("dialogue:open", ({ id }) => seen.push(id));
    openDialogue("intro-1-1");
    off();
    expect(seen).toEqual(["intro-1-1"]);
  });

  it("does not emit dialogue:open for an unknown id", () => {
    const seen: string[] = [];
    const off = bus.on("dialogue:open", ({ id }) => seen.push(id));
    openDialogue("totally-not-a-script");
    off();
    expect(seen).toEqual([]);
  });
});

describe("advanceDialogue", () => {
  it("moves to the next line when more remain", () => {
    openDialogue("intro-1-1");
    const total = gameStore.get().dialogue!.lines.length;
    expect(total).toBeGreaterThan(1); // multi-line script needed for this case
    advanceDialogue();
    expect(gameStore.get().dialogue!.line).toBe(1);
    expect(gameStore.get().dialogue!.id).toBe("intro-1-1"); // still open
  });

  it("closes the dialogue when advancing past the last line", () => {
    openDialogue("frag-1-1"); // single-line script
    advanceDialogue();
    expect(gameStore.get().dialogue).toBeNull();
  });

  it("is a no-op when no dialogue is open", () => {
    expect(() => advanceDialogue()).not.toThrow();
    expect(gameStore.get().dialogue).toBeNull();
  });
});

describe("closeDialogue", () => {
  it("clears the dialogue and emits dialogue:closed with the id that closed", () => {
    openDialogue("intro-1-1");
    const seen: string[] = [];
    const off = bus.on("dialogue:closed", ({ id }) => seen.push(id));
    closeDialogue();
    off();
    expect(gameStore.get().dialogue).toBeNull();
    expect(seen).toEqual(["intro-1-1"]);
  });

  it("is a no-op (no emit) when no dialogue is open", () => {
    const seen: string[] = [];
    const off = bus.on("dialogue:closed", ({ id }) => seen.push(id));
    closeDialogue();
    off();
    expect(seen).toEqual([]);
    expect(gameStore.get().dialogue).toBeNull();
  });
});
