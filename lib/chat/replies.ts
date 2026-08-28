// Small helpers shared by the engine and the commands.

import type { ChatContextState, ChatEntry, ChatMedia, ChatReply } from "./types";

/** Random pick that avoids `avoid` when there is any alternative. */
export function pickRandom(list: string[], avoid: string | undefined, random: () => number): string {
  if (list.length === 0) return "";
  const pool = list.length > 1 && avoid !== undefined ? list.filter((s) => s !== avoid) : list;
  const source = pool.length > 0 ? pool : list;
  const index = Math.min(source.length - 1, Math.floor(random() * source.length));
  return source[index];
}

export function mediaList(media: ChatEntry["media"]): ChatMedia[] | undefined {
  if (!media) return undefined;
  return Array.isArray(media) ? media : [media];
}

/** Build the bot's reply for a matched entry, honouring no-repeat. */
export function replyFromEntry(
  entry: ChatEntry,
  context: ChatContextState,
  random: () => number,
): ChatReply {
  const text = pickRandom(entry.responses, context.lastResponse[entry.id], random);
  return {
    kind: "entry",
    entryId: entry.id,
    text,
    media: mediaList(entry.media),
    project: entry.project,
    links: entry.links,
    effect: entry.effect,
    sound: entry.sound,
  };
}

/** Fold a batch of replies into the context: remember texts, track discovery. */
export function contextAfterReplies(
  context: ChatContextState,
  replies: ChatReply[],
  overrides: { lastEntryId?: string | null } = {},
): ChatContextState {
  const lastResponse = { ...context.lastResponse };
  const discovered = [...context.discovered];
  let lastEntryId = context.lastEntryId;
  for (const reply of replies) {
    if (reply.kind === "entry" && reply.entryId) {
      lastResponse[reply.entryId] = reply.text;
      if (!discovered.includes(reply.entryId)) discovered.push(reply.entryId);
      lastEntryId = reply.entryId;
    }
  }
  if (overrides.lastEntryId !== undefined) lastEntryId = overrides.lastEntryId;
  return { lastEntryId, lastResponse, discovered };
}
