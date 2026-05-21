"use client";

import { motion } from "framer-motion";
import SpriteSlot from "./SpriteSlot";
import TypingText from "./TypingText";
import type { SubView } from "@/lib/sections";

type Props = {
  onNavigate: (view: SubView) => void;
};

const NAV_LINKS: { id: SubView; label: string }[] = [
  { id: "projects", label: "Projects" },
  { id: "organizations", label: "Organizations" },
  { id: "fun", label: "Fun" },
];

const SOCIALS = [
  { label: "Email", href: "mailto:abrartsarwar@gmail.com", text: "abrartsarwar@gmail.com" },
  { label: "Phone", href: "tel:4703992597", text: "470.399.2597" },
  { label: "LinkedIn", href: "https://linkedin.com/in/abrar-sarwar/", text: "linkedin.com/in/abrar-sarwar" },
  { label: "GitHub", href: "https://github.com/abrar-sarwar", text: "github.com/abrar-sarwar" },
];

const BIO_TEXT =
  "Hey, I'm Abrar. I'm Asian American, born and raised in Georgia in a pretty diverse family. Outside of work I draw, read, hit the gym, game, and spend as much time as I can hiking and finding weird corners of the world to explore. On the career side, I've been into CS and cybersecurity since I was the kid setting up Minecraft LAN servers for my friends and fixing the TV whenever it cut out at home. Long term I want to be a solutions architect, building systems that actually solve problems for the people using them. If you've got hiking spots to share, let's talk.";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const portraitVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay: 0.25 },
  },
};

const bamVariants = {
  hidden: { opacity: 0, scale: 0.4, rotate: 25 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: -12,
    transition: {
      type: "spring" as const,
      stiffness: 380,
      damping: 14,
      delay: 0.8,
    },
  },
};

function PurpleAura() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: [
          "radial-gradient(60% 40% at 50% 0%, rgba(124, 58, 237, 0.28), transparent 70%)",
          "radial-gradient(60% 40% at 50% 100%, rgba(124, 58, 237, 0.22), transparent 70%)",
          "radial-gradient(40% 60% at 0% 50%, rgba(107, 33, 168, 0.22), transparent 70%)",
          "radial-gradient(40% 60% at 100% 50%, rgba(107, 33, 168, 0.22), transparent 70%)",
        ].join(", "),
        filter: "blur(40px)",
      }}
    />
  );
}

export default function HomePage({ onNavigate }: Props) {
  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative h-full w-full overflow-hidden bg-black text-white"
    >
      <PurpleAura />

      <motion.nav
        variants={itemVariants}
        aria-label="Sections"
        className="relative z-20 flex items-center justify-end gap-6 px-8 py-5 text-xs uppercase tracking-[0.25em] sm:px-12"
      >
        {NAV_LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => onNavigate(link.id)}
            className="text-white/55 transition hover:text-violet-300 focus:outline-none focus-visible:text-violet-300 focus-visible:underline"
          >
            {link.label}
          </button>
        ))}
      </motion.nav>

      <section className="relative z-10 max-w-2xl space-y-4 px-8 pt-2 text-xs sm:px-12">
        <motion.h1
          variants={itemVariants}
          className="text-base font-semibold tracking-tight"
        >
          Abrar Tahir Sarwar
        </motion.h1>

        <motion.div variants={itemVariants}>
          <TypingText
            text={BIO_TEXT}
            speed={12}
            className="text-xs text-white/75"
            style={{ lineHeight: 1.65 }}
          />
        </motion.div>

        <motion.ul
          variants={itemVariants}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-white/55"
        >
          {SOCIALS.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3">
              {i > 0 && (
                <span aria-hidden className="text-white/25">
                  ·
                </span>
              )}
              <a
                href={s.href}
                className="hover:text-white focus:outline-none focus-visible:text-white focus-visible:underline"
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noreferrer noopener" : undefined}
              >
                {s.text}
              </a>
            </li>
          ))}
        </motion.ul>
      </section>

      <motion.aside
        variants={portraitVariants}
        className="pointer-events-none absolute bottom-0 right-4 z-0 sm:right-8 md:right-12"
      >
        <div className="relative">
          <SpriteSlot
            src="/assets/sprites/abrarmainscreen.png"
            alt="Abrar"
            fallbackLabel="abrarmainscreen.png"
            className="block h-80 w-auto select-none object-contain sm:h-96 md:h-[26rem]"
          />
          <motion.div
            variants={bamVariants}
            className="pointer-events-none absolute -left-16 -top-4 sm:-left-20 sm:-top-6"
          >
            <SpriteSlot
              src="/assets/sprites/BAM.png"
              alt="BAM"
              fallbackLabel="BAM"
              className="h-20 w-20 select-none object-contain sm:h-24 sm:w-24"
            />
          </motion.div>
        </div>
      </motion.aside>
    </motion.main>
  );
}
