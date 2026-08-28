// The response engine. Pure and synchronous: (input, context) -> result.
//
// Order of resolution:
//   1. slash commands        "/help", "/random", …
//   2. follow-ups            context-aware replies for the last entry ("why?")
//   3. trigger matching      most specific phrase wins
//   4. fallback              never invents anything
//
// Randomness is injected so tests can seed it.

import { CHAT_COMMANDS, findCommand } from "./commands";
import { CHAT_ENTRIES, FALLBACK_RESPONSES } from "./chatResponses";
import { bestPhrase, findBestMatch } from "./matcher";
import { tokenize } from "./normalize";
import { contextAfterReplies, pickRandom, replyFromEntry } from "./replies";
import {
  createChatContext,
  type ChatCommand,
  type ChatContextState,
  type ChatEntry,
  type ChatResult,
} from "./types";

export type RespondOptions = {
  entries?: ChatEntry[];
  commands?: ChatCommand[];
  fallbacks?: string[];
  random?: () => number;
};

export function respond(
  rawInput: string,
  context: ChatContextState = createChatContext(),
  options: RespondOptions = {},
): ChatResult {
  const entries = options.entries ?? CHAT_ENTRIES;
  const commands = options.commands ?? CHAT_COMMANDS;
  const fallbacks = options.fallbacks ?? FALLBACK_RESPONSES;
  const random = options.random ?? Math.random;

  const input = rawInput.trim();
  if (!input) return { replies: [], context };

  // 1. commands
  if (input.startsWith("/")) {
    const [name, ...rest] = input.slice(1).trim().split(/\s+/);
    const command = findCommand(name ?? "", commands);
    if (!command) {
      return {
        replies: [{ kind: "command", text: `unknown command: /${name}. /help exists for a reason.` }],
        context,
      };
    }
    const out = command.run(rest.join(" "), { entries, commands, context, random });
    if (out.action === "clear") {
      return { replies: out.replies, action: "clear", context: createChatContext() };
    }
    let next = contextAfterReplies(context, out.replies, { lastEntryId: out.lastEntryId });
    if (out.remember !== undefined) {
      next = { ...next, lastResponse: { ...next.lastResponse, [`/${command.name}`]: out.remember } };
    }
    return { replies: out.replies, action: out.action, context: next };
  }

  const inputTokens = tokenize(input);
  const match = findBestMatch(input, entries);

  // 2. follow-ups, only beaten by a strictly more specific trigger match, so
  //    "why?" after "bleach" follows up, but "why is arkham cool" hits arkham
  //    only if its trigger is longer than the follow-up key.
  const last = context.lastEntryId
    ? entries.find((e) => e.id === context.lastEntryId)
    : undefined;
  if (last?.followUps) {
    const keys = Object.keys(last.followUps);
    const hit = bestPhrase(inputTokens, keys);
    if (hit && (!match || hit.tokens >= match.tokens)) {
      const raw = last.followUps[hit.phrase];
      const list = Array.isArray(raw) ? raw : [raw];
      const key = `${last.id}::${hit.phrase}`;
      const text = pickRandom(list, context.lastResponse[key], random);
      return {
        replies: [{ kind: "followup", entryId: last.id, text }],
        context: {
          ...context,
          lastEntryId: last.id,
          lastResponse: { ...context.lastResponse, [key]: text },
        },
      };
    }
  }

  // 3. entries
  if (match) {
    const reply = replyFromEntry(match.entry, context, random);
    return { replies: [reply], context: contextAfterReplies(context, [reply]) };
  }

  // 4. fallback, the context is left alone so a typo doesn't kill follow-ups.
  const text = pickRandom(fallbacks, context.lastResponse["__fallback"], random);
  return {
    replies: [{ kind: "fallback", text }],
    context: { ...context, lastResponse: { ...context.lastResponse, __fallback: text } },
  };
}

/** How many things the chat knows, shown as the discovery denominator. */
export const TOTAL_ENTRIES = CHAT_ENTRIES.length;
