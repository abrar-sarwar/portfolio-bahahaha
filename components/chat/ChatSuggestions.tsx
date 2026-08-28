"use client";

import { motion } from "framer-motion";
import type { ChatSuggestion } from "@/lib/chat";

type Props = {
  suggestions: ChatSuggestion[];
  onPick: (text: string) => void;
  reduceMotion: boolean;
  className?: string;
};

/** The chips under the welcome line. Clicking one sends it as if typed. */
export default function ChatSuggestions({ suggestions, onPick, reduceMotion, className = "" }: Props) {
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className={`flex flex-wrap gap-2 px-4 pb-3 ${className}`}
      aria-label="suggestions"
    >
      {suggestions.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => onPick(s.send)}
          className="chat-chip"
        >
          {s.label}
        </button>
      ))}
    </motion.div>
  );
}
