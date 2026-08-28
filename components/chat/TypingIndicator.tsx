"use client";

import { motion } from "framer-motion";
import { BOT_NAME } from "@/lib/chat";

export default function TypingIndicator({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-center gap-2 pl-0.5"
      role="status"
      aria-label={`${BOT_NAME} is typing`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">
        {BOT_NAME}
      </span>
      <span className="chat-typing" aria-hidden>
        <i />
        <i />
        <i />
      </span>
    </motion.div>
  );
}
