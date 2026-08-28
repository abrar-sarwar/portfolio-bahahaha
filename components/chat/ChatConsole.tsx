"use client";

import { useEffect, useState, type RefObject } from "react";
import { AnimatePresence } from "framer-motion";
import { CHAT_COMMANDS, INPUT_PLACEHOLDERS, SUGGESTIONS } from "@/lib/chat";
import { useChat } from "./ChatContext";
import ChatInput from "./ChatInput";
import ChatSuggestions from "./ChatSuggestions";

type Props = {
  /** The panel is on screen, placeholders only rotate while it is. */
  active: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
};

/**
 * The one box: suggestion chips while the conversation is empty, the input,
 * and the slash commands on a line underneath. Replies never render in here;
 * they go to the stage above.
 */
export default function ChatConsole({ active, inputRef }: Props) {
  const { messages, typing, send, requestFocus, reduceMotion } = useChat();

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(
      () => setPlaceholderIndex((i) => (i + 1) % INPUT_PLACEHOLDERS.length),
      3400,
    );
    return () => window.clearInterval(id);
  }, [active]);

  const showSuggestions = messages.length <= 1 && !typing;
  const commands = CHAT_COMMANDS.filter((c) => !c.hidden);

  const run = (text: string) => {
    send(text);
    requestFocus();
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="chat-console">
        <AnimatePresence initial={false}>
          {showSuggestions && (
            <ChatSuggestions
              key="suggestions"
              suggestions={SUGGESTIONS}
              onPick={run}
              reduceMotion={reduceMotion}
              className="border-b border-white/10 pt-3"
            />
          )}
        </AnimatePresence>
        <ChatInput
          onSend={send}
          onEscape={() => inputRef.current?.blur()}
          inputRef={inputRef}
          placeholder={INPUT_PLACEHOLDERS[placeholderIndex]}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
        <ul className="flex flex-wrap gap-1" aria-label="commands">
          {commands.map((c) => (
            <li key={c.name}>
              <button
                type="button"
                className="chat-cmd"
                title={c.description}
                onClick={() => run(`/${c.name}`)}
              >
                /{c.name}
              </button>
            </li>
          ))}
        </ul>
        <p className="hidden font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/25 sm:block">
          enter to send · shift+enter for newline
        </p>
      </div>
    </div>
  );
}
