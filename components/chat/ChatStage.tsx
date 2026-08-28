"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BOT_NAME } from "@/lib/chat";
import { useChat, type ChatEffectEvent, type ChatMessage } from "./ChatContext";
import RichResponse from "./RichResponse";
import TypingIndicator from "./TypingIndicator";

const EFFECT_MS = 650;

/**
 * The latest exchange, staged big in the middle of the panel: the visitor's
 * last line in monospace, then every reply it produced. Before anything is
 * asked it shows the welcome line. Older exchanges aren't kept on screen;
 * the console below is for the next one.
 */
export default function ChatStage({ active }: { active: boolean }) {
  const { messages, typing, effect, navigate, openVideo, reduceMotion } = useChat();

  // --- short window-level effects (aizen's glitch, etc.) --------------------
  const [fx, setFx] = useState<ChatEffectEvent | null>(null);
  useEffect(() => {
    if (!effect || !active) return;
    setFx(effect);
    const id = window.setTimeout(() => setFx(null), EFFECT_MS);
    return () => window.clearTimeout(id);
  }, [effect, active]);

  let lastUser = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      lastUser = i;
      break;
    }
  }
  const prompt = lastUser >= 0 ? messages[lastUser] : null;
  const replies = messages.slice(lastUser + 1).filter((m) => m.role === "bot");

  return (
    <div
      className={`chat-stage chat-shell chat-scroll max-h-full w-full max-w-2xl overflow-y-auto overflow-x-hidden overscroll-contain ${
        fx ? `chat-fx-${fx.kind}` : ""
      }`}
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={prompt?.id ?? "welcome"}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: 0.1 } }
              : { opacity: 0, y: -10, transition: { duration: 0.16 } }
          }
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="flex flex-col gap-4 py-2"
        >
          {prompt && (
            <p className="chat-stage-user">
              <span aria-hidden>›</span>
              <span className="whitespace-pre-wrap break-words">{prompt.text}</span>
            </p>
          )}
          {replies.map((m, i) => (
            <StageReply
              key={m.id}
              message={m}
              showLabel={i === 0}
              onNavigate={navigate}
              onPlayVideo={openVideo}
              reduceMotion={reduceMotion}
            />
          ))}
          <AnimatePresence>
            {typing && <TypingIndicator key="typing" reduceMotion={reduceMotion} />}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StageReply({
  message,
  showLabel,
  onNavigate,
  onPlayVideo,
  reduceMotion,
}: {
  message: ChatMessage;
  showLabel: boolean;
  onNavigate: (href: string) => boolean;
  onPlayVideo: (src: string) => void;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="min-w-0"
    >
      {showLabel && <span className="chat-stage-label">{BOT_NAME}</span>}
      {message.text && <p className="chat-stage-bot whitespace-pre-line break-words">{message.text}</p>}
      {message.reply && (
        <RichResponse
          reply={message.reply}
          onNavigate={onNavigate}
          onPlayVideo={onPlayVideo}
          reduceMotion={reduceMotion}
        />
      )}
    </motion.div>
  );
}
