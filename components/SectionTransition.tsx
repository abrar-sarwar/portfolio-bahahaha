"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Direction } from "@/lib/sections";

type Props = {
  viewKey: string;
  direction: Direction;
  children: React.ReactNode;
};

const EASE = [0.65, 0, 0.35, 1] as const;

export default function SectionTransition({
  viewKey,
  direction,
  children,
}: Props) {
  const sign = direction === "forward" ? 1 : -1;

  return (
    <div className="relative h-screen w-screen" style={{ perspective: 1400 }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={viewKey}
          initial={{ rotateY: 90 * sign, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90 * sign, opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
            backfaceVisibility: "hidden",
          }}
          className="absolute inset-0"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
