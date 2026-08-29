"use client";

import { motion } from "framer-motion";

export type ChatPose = "idle" | "answer";

const FRAMES: Record<ChatPose, string> = {
  idle: "/assets/sprites/chatidle.png",
  answer: "/assets/sprites/chatanswer.png",
};

type Props = {
  pose: ChatPose;
  reduceMotion: boolean;
  /**
   * A reply can ask for a different face (carolina brings ren). While one is
   * set it covers both normal frames; clearing it fades back to the pose.
   */
  override?: string | null;
};

/**
 * The portrait in the bottom-left corner. Thinking pose while nothing has
 * been asked (and while a reply is still being typed), looking straight at
 * you once an answer lands. Both frames stay mounted so the swap is a
 * crossfade rather than a fresh image load.
 */
export default function ChatPortrait({ pose, reduceMotion, override }: Props) {
  return (
    <div
      aria-hidden
      data-pose={pose}
      className="chat-portrait pointer-events-none select-none max-sm:relative max-sm:mt-2 max-sm:h-56 max-sm:w-full sm:absolute sm:bottom-0 sm:left-0 sm:z-0 sm:h-[min(60svh,580px)] sm:w-[min(46vw,640px)]"
    >
      <span className="chat-portrait-glow" />
      {(Object.keys(FRAMES) as ChatPose[]).map((p) => (
        <motion.img
          key={p}
          src={FRAMES[p]}
          alt=""
          draggable={false}
          initial={false}
          animate={{ opacity: pose === p ? 1 : 0, y: pose === p ? 0 : 14 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-0 left-0 h-full w-auto max-w-none object-contain"
        />
      ))}
      {override && (
        <motion.img
          key={override}
          src={override}
          alt=""
          draggable={false}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-0 left-0 h-full w-auto max-w-none object-contain"
        />
      )}
    </div>
  );
}
