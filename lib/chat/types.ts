// Portfolio chat, shared types.
//
// The chat is deterministic: a visitor's message is matched against the
// entries in `chatResponses.ts` and the reply comes straight out of that
// config. Nothing here talks to a model or a server.

import type { ProjectSlug } from "@/lib/projects";

/**
 * A picture or animated gif shown under a reply, or a clip. Clips don't embed:
 * they open in the site's video popup, with sound, the moment the reply lands.
 */
export type ChatFileMedia = {
  type: "image" | "gif" | "video";
  src: string;
  /** Alt text for images and gifs; accessible name for videos. */
  alt?: string;
  /** Small line under the media. Images and gifs only. */
  caption?: string;
  /** CSS aspect-ratio (e.g. "16 / 9") so space is reserved before load. */
  aspect?: string;
};

/**
 * A tiny fake terminal that types its lines out one by one. No asset needed,
 * which makes it the go-to "hacker-style animation" for cyber replies.
 */
export type ChatTerminalMedia = {
  type: "terminal";
  lines: string[];
  title?: string;
};

export type ChatMedia = ChatFileMedia | ChatTerminalMedia;

export type ChatLink = {
  label: string;
  /**
   * Any URL. Two special forms:
   *   "#projects" / "#gallery" / "#fun" / "#home", scroll the feed there.
   *   "/professional", "/myworld", internal routes.
   */
  href: string;
};

export type ChatProjectCard = {
  title: string;
  tagline?: string;
  description: string;
  tags?: string[];
  github?: string;
  demo?: string;
  /** Where the "learn more" button goes. */
  learnMore?: string;
  image?: string;
  video?: string;
  accent?: { text: string; glow: string };
};

/** Either a slug from lib/projects (auto-filled card) or a hand-written card. */
export type ChatProjectRef = ProjectSlug | ChatProjectCard;

/** Short window-level effects. Skipped under prefers-reduced-motion. */
export type ChatEffect = "glitch" | "shake" | "flash";

/** One line of a letter, and when it lands. */
export type ChatLetterLine = {
  /** Seconds from the moment the track starts. */
  at: number;
  text: string;
};

/**
 * A letter: the one sequence that takes the whole screen. The panel dims, the
 * portrait changes, a track plays, and the lines arrive on top of it one at a
 * time and stay. There is no close button and Escape does nothing; it ends
 * when it ends.
 *
 * It runs once per visit. After that the entry answers with its ordinary
 * `responses` (and `portrait`, if it has one). A reload starts it over.
 *
 * The schedule is driven by timers rather than by the audio element, so a
 * track that never loads still ends the sequence instead of trapping someone
 * behind it.
 */
export type ChatLetter = {
  /** Audio track. Line timings are written against it. */
  audio: string;
  /** Portrait shown for the length of the sequence. */
  portrait: string;
  /** Total run time in seconds. Give the last line room to sit. */
  duration: number;
  lines: ChatLetterLine[];
};

export type ChatCategory =
  | "me"
  | "people"
  | "anime"
  | "cyber"
  | "project"
  | "general"
  | "secret";

export type ChatEntry = {
  id: string;
  category: ChatCategory;
  /** Words or phrases. Matched on whole tokens, case/punctuation-insensitive. */
  triggers: string[];
  /**
   * One is picked at random; never the same one twice in a row. Leave it
   * empty (`[]`) for a media-only reply, the picture or gif is the answer.
   */
  responses: string[];
  media?: ChatMedia | ChatMedia[];
  project?: ChatProjectRef;
  links?: ChatLink[];
  effect?: ChatEffect;
  /** Audio file played once when the reply lands. Keep it short. */
  sound?: string;
  /** Swaps the chat portrait for as long as this reply is on the stage. */
  portrait?: string;
  /** Plays a full-screen letter the first time this entry is hit each visit. */
  letter?: ChatLetter;
  /**
   * Context-aware replies. Keys are phrases matched the same way triggers are,
   * but only while this entry was the last thing the bot answered with.
   */
  followUps?: Record<string, string | string[]>;
  /** Hidden entries are never listed by /help. They still match. */
  hidden?: boolean;
  /** Tie-breaker when two triggers are equally specific. Higher wins. */
  priority?: number;
};

export type ChatSuggestion = {
  /** Chip label. */
  label: string;
  /** What gets sent when the chip is clicked, exactly as if typed. */
  send: string;
};

export type ChatReplyKind = "entry" | "followup" | "command" | "fallback";

export type ChatReply = {
  kind: ChatReplyKind;
  entryId?: string;
  text: string;
  media?: ChatMedia[];
  project?: ChatProjectRef;
  links?: ChatLink[];
  effect?: ChatEffect;
  sound?: string;
  portrait?: string;
  letter?: ChatLetter;
};

export type ChatContextState = {
  /** Entry the last reply came from, what follow-ups key off. */
  lastEntryId: string | null;
  /** Last response text used per entry (and per command), to avoid repeats. */
  lastResponse: Record<string, string>;
  /** Entry ids the visitor has uncovered this session. */
  discovered: string[];
};

export type ChatAction = "clear";

export type ChatResult = {
  replies: ChatReply[];
  action?: ChatAction;
  context: ChatContextState;
};

export type CommandDeps = {
  entries: ChatEntry[];
  commands: ChatCommand[];
  context: ChatContextState;
  random: () => number;
};

export type CommandOutput = {
  replies: ChatReply[];
  action?: ChatAction;
  /** Override the context's lastEntryId (e.g. /random hands off to an entry). */
  lastEntryId?: string | null;
  /** Remember something for no-repeat purposes, keyed by command name. */
  remember?: string;
};

export type ChatCommand = {
  /** Without the slash. */
  name: string;
  aliases?: string[];
  description: string;
  hidden?: boolean;
  run: (args: string, deps: CommandDeps) => CommandOutput;
};

export function createChatContext(): ChatContextState {
  return { lastEntryId: null, lastResponse: {}, discovered: [] };
}
