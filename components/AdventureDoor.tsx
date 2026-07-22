"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function AdventureDoor() {
  return (
    <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} className="pointer-events-auto">
      <Link href="/adventure" aria-label="Enter the hidden adventure" className="group flex flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
        <span className="adventure-pixel-key" aria-hidden>
          <span />
        </span>
        <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.32em] text-white/40 transition-colors group-hover:text-violet-100/80">
          a hidden adventure awaits
        </span>
      </Link>
    </motion.div>
  );
}
