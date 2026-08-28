"use client";

import { motion } from "framer-motion";

/**
 * End-of-feed CTA. Lives at the bottom of the last panel; click smooth-scrolls
 * back to home. framer-motion owns `transform` on the button, so any centering
 * is the parent's job.
 */
export default function BackToTop({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Back to main page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className="flex cursor-pointer flex-col items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
    >
      <motion.svg
        aria-hidden
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ color: "#c4b5fd", filter: "drop-shadow(0 0 8px rgba(167,139,250,0.7))" }}
      >
        <path d="M6 15l6-6 6 6" />
      </motion.svg>
      <span
        className="text-[10px] font-medium uppercase tracking-[0.32em]"
        style={{ color: "rgba(255,255,255,0.78)", textShadow: "0 0 10px rgba(167,139,250,0.55)" }}
      >
        Back to top
      </span>
    </motion.button>
  );
}
