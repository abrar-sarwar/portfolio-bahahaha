// Slash commands. Add one here and it works. /help lists it automatically
// unless `hidden` is set.

import { PROJECTS } from "@/lib/projects";
import { replyFromEntry } from "./replies";
import type { ChatCommand, ChatReply } from "./types";

const say = (text: string, extra: Partial<ChatReply> = {}): ChatReply => ({
  kind: "command",
  text,
  ...extra,
});

export const CHAT_COMMANDS: ChatCommand[] = [
  {
    name: "help",
    aliases: ["?", "h", "commands"],
    description: "this menu",
    run: (_args, { entries, commands, context }) => {
      const visible = commands.filter((c) => !c.hidden);
      const found = context.discovered.length;
      const lines = [
        "things that work in here:",
        "· projects: arkham, netwraith, tripwire, leek, counterstack",
        "· cyber words: hacker, ctf, siem, threat intelligence, and more",
        "· shows: jjk, bleach, and a few i'm not listing",
        "· people: try a name. some of them are in here.",
        "· questions: who are you, what do you build, contact, hire you",
        `commands: ${visible.map((c) => `/${c.name}`).join(" ")}`,
        `found ${found} / ${entries.length} so far.`,
      ];
      return { replies: [say(lines.join("\n"))] };
    },
  },
  {
    name: "projects",
    aliases: ["work"],
    description: "every project, as cards",
    run: () => ({
      replies: [say("the lineup:"), ...PROJECTS.map((p) => say("", { project: p.slug }))],
    }),
  },
  {
    name: "random",
    aliases: ["roll", "dice"],
    description: "a random easter egg",
    run: (_args, { entries, context, random }) => {
      // A letter takes over the whole screen and cannot be dismissed. Nobody
      // should land in one from a dice roll, and the roll announces the
      // trigger it picked, which would give it away besides. Found by typing
      // the name, never by rolling.
      const rollable = entries.filter((e) => !e.letter);
      if (rollable.length === 0) return { replies: [say("nothing to roll.")] };
      const last = context.lastResponse["/random"];
      const pool = rollable.length > 1 ? rollable.filter((e) => e.id !== last) : rollable;
      const entry = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
      const trigger = entry.triggers[0];
      return {
        replies: [say(`🎲 rolled: ${trigger}`), replyFromEntry(entry, context, random)],
        remember: entry.id,
      };
    },
  },
  {
    name: "clear",
    aliases: ["cls", "reset"],
    description: "wipe the conversation",
    run: () => ({ replies: [], action: "clear" }),
  },
  {
    name: "whoami",
    hidden: true,
    description: "",
    run: () => ({ replies: [say("visitor. curious. probably supposed to be doing something else.")] }),
  },
];

export function findCommand(name: string, commands: ChatCommand[]): ChatCommand | undefined {
  const key = name.toLowerCase();
  return commands.find((c) => c.name === key || c.aliases?.includes(key));
}
