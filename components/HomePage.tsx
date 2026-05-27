"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SpriteSlot from "./SpriteSlot";
import TypingText from "./TypingText";
import VideoModal from "./VideoModal";
import type { SubView } from "@/lib/sections";

const GOJO_VIDEO_SRC = "/assets/videos/idwin.mp4";
const GRIFFITH_AUDIO_SRC = "/assets/videos/griffith.mp3";
const CALENDLY_URL = "https://calendly.com/abrartsarwar/30min";

type Props = {
  onNavigate: (view: SubView) => void;
};

const NAV_LINKS: { id: SubView; label: string }[] = [
  { id: "projects", label: "Projects" },
  { id: "organizations", label: "Organizations" },
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
  hidden: { clipPath: "circle(0% at 50% 50%)" },
  visible: {
    clipPath: "circle(140% at 50% 50%)",
    transition: {
      clipPath: { duration: 0.9, ease: [0.65, 0, 0.35, 1] as const },
      staggerChildren: 0.12,
      delayChildren: 0.45,
    },
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

const navContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const navPopVariants = {
  hidden: { opacity: 0, scale: 0.3, y: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 520, damping: 16 },
  },
};

const portraitVariants = {
  hidden: { opacity: 0, x: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay: 0.35 },
  },
};

const bamVariants = {
  hidden: { opacity: 0, scale: 0.3, rotate: 35 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: -12,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 12,
      delay: 1.0,
    },
  },
};

const eclipseVariants = {
  hidden: { opacity: 0, scale: 0.4, y: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 220,
      damping: 18,
      delay: 0.7,
    },
  },
};

const charRowVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.55 } },
};

const charVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const SIDE_CHARS = [
  { src: "/assets/sprites/ichigo.png", alt: "Ichigo", extraClass: "" },
  { src: "/assets/sprites/dante.png", alt: "Dante", extraClass: "" },
  {
    src: "/assets/sprites/mori.png",
    alt: "Mori",
    // Stacked drop-shadows trace the alpha edge so Mori's dark hair pops
    // against the black page.
    extraClass:
      "[filter:drop-shadow(0_0_1.5px_#fff)_drop-shadow(0_0_1.5px_#fff)_drop-shadow(0_0_2px_#fff)]",
  },
];

const nameContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.5 },
  },
};

const letterVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.5, rotate: -10 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { type: "spring" as const, stiffness: 480, damping: 14 },
  },
};

// Each offset = the source sprite's own bottom-padding percent. Translating
// each letter down by its own bot-pad puts every visible glyph bottom on a
// single line at the flex items-end edge (R2nd's circle bottom is naturally
// on that line, so its offset is 0).
const NAME_SPRITES = [
  {
    src: "/assets/sprites/A1st.png",
    alt: "A",
    sizeClass: "h-12 sm:h-14 md:h-[4.5rem]",
    offsetClass: "translate-y-[13%]",
  },
  {
    src: "/assets/sprites/B.png",
    alt: "B",
    sizeClass: "h-16 sm:h-[4.5rem] md:h-[5.5rem]",
    offsetClass: "translate-y-[21%]",
  },
  {
    src: "/assets/sprites/R1st.png",
    alt: "R",
    sizeClass: "h-12 sm:h-14 md:h-[4.25rem]",
    offsetClass: "translate-y-[15%]",
  },
  {
    src: "/assets/sprites/A2nd.png",
    alt: "A",
    sizeClass: "h-14 sm:h-16 md:h-20",
    offsetClass: "translate-y-[25%]",
    // White outline so the near-transparent A2nd reads on the dark page.
    extraClass:
      "[filter:drop-shadow(0_0_1.5px_#fff)_drop-shadow(0_0_1.5px_#fff)_drop-shadow(0_0_2px_#fff)]",
  },
  {
    src: "/assets/sprites/R2nd.png",
    alt: "R",
    sizeClass: "h-11 sm:h-12 md:h-14",
    offsetClass: "translate-y-[8%]",
  },
];

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
  // Drive the entrance via a state flip on the next frame instead of the
  // initial/animate props, because <AnimatePresence initial={false}> in
  // SectionTransition propagates "skip initial" down to descendant motion
  // components. A state change after mount is a regular update that
  // AnimatePresence can't intercept, so variants actually run.
  const [stage, setStage] = useState<"hidden" | "visible">("hidden");
  const [gojoVideoOpen, setGojoVideoOpen] = useState(false);
  const [songPlaying, setSongPlaying] = useState(false);
  const griffithRef = useRef<HTMLAudioElement | null>(null);
  const favoriteSongRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setStage("visible"));
    return () => cancelAnimationFrame(id);
  }, []);

  // Reset the play state when the track ends naturally so the disc stops
  // spinning and the click prompt comes back.
  useEffect(() => {
    const audio = favoriteSongRef.current;
    if (!audio) return;
    const onEnded = () => setSongPlaying(false);
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  const playGriffith = () => {
    const audio = griffithRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    // Browsers can reject autoplay-style calls; swallow silently.
    audio.play().catch(() => {});
  };

  const toggleFavoriteSong = () => {
    const audio = favoriteSongRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.currentTime = 0;
      audio
        .play()
        .then(() => setSongPlaying(true))
        .catch(() => {});
    } else {
      audio.pause();
      setSongPlaying(false);
    }
  };

  return (
    <motion.main
      animate={stage}
      variants={containerVariants}
      className="relative h-full w-full overflow-hidden bg-black text-white"
    >
      <PurpleAura />

      {/* Jotaro — leisurely walk across the bottom of the page on a 30s
          linear loop (.jotaro-walk in globals.css). High z-index so he
          walks IN FRONT of every character he passes (sonic, side chars,
          bonfire, gojo, abrar, mahoraga, gyro). Sits below nav (z-50). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/sprites/jotaropage.gif"
        alt=""
        aria-hidden
        draggable={false}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
        className="jotaro-walk pointer-events-none absolute bottom-0 left-0 z-[20] h-16 w-auto select-none sm:h-24"
        /* TODO: tune position */
      />

      {/* Eclipse — clickable, plays the griffith.mp3 stinger. */}
      <motion.button
        type="button"
        onClick={playGriffith}
        aria-label="Play Griffith"
        variants={eclipseVariants}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        className="absolute left-1/2 top-2 z-10 -translate-x-1/2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:top-3"
      >
        <div className="relative">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle, rgba(255,80,30,0.55) 0%, rgba(255,140,40,0.32) 35%, rgba(255,90,20,0.12) 60%, transparent 75%)",
              filter: "blur(14px)",
              transform: "scale(2.1)",
              transformOrigin: "center",
            }}
            animate={{ opacity: [0.7, 1, 0.7], scale: [2.0, 2.25, 2.0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <SpriteSlot
            src="/assets/sprites/eclipse.png"
            alt="Eclipse"
            fallbackLabel="Eclipse"
            className="relative block h-16 w-auto select-none object-contain sm:h-20 md:h-24"
          />
        </div>
      </motion.button>

      {/* Preloaded audio element so the eclipse click feels instant. */}
      <audio
        ref={griffithRef}
        src={GRIFFITH_AUDIO_SRC}
        preload="auto"
        aria-hidden
      />

      {/* Favorite-song disc — sits in the upper-right quadrant, below and to
          the right of the eclipse with enough air between them that they
          don't read as a single unit. Click toggles play/pause; the disc
          spins while playing and the track name slides in underneath. */}
      <motion.button
        type="button"
        onClick={toggleFavoriteSong}
        aria-label={
          songPlaying ? "Pause favorite song" : "Play favorite song"
        }
        initial={{ opacity: 0, scale: 0.6, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          delay: 1.2,
          type: "spring",
          stiffness: 280,
          damping: 18,
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="absolute right-8 top-28 z-30 flex cursor-pointer flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 sm:right-[14%] sm:top-32 md:right-[16%]"
      >
        <motion.div
          animate={{ rotate: songPlaying ? 360 : 0 }}
          transition={
            songPlaying
              ? { duration: 4, repeat: Infinity, ease: "linear" }
              : { duration: 0.4, ease: "easeOut" }
          }
          className="relative"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgba(196,181,253,0.45), transparent 70%)",
              filter: "blur(14px)",
              transform: "scale(1.4)",
            }}
          />
          <SpriteSlot
            src="/assets/sprites/disc.png"
            alt="Favorite song disc"
            fallbackLabel="disc"
            className="block h-14 w-14 select-none object-contain sm:h-16 sm:w-16 md:h-20 md:w-20"
          />
        </motion.div>

        <div className="flex flex-col items-center gap-0.5 text-center leading-tight">
          <span
            className="text-[8px] font-medium uppercase tracking-[0.14em] text-white/72 sm:text-[9px]"
            style={{ textShadow: "0 0 8px rgba(167,139,250,0.5)" }}
          >
            {songPlaying ? (
              "click to pause"
            ) : (
              <>
                click to play
                <br />
                my favorite song
              </>
            )}
          </span>
          <AnimatePresence>
            {songPlaying && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="block text-[9px] italic text-violet-200/90 sm:text-[10px]"
                style={{ textShadow: "0 0 10px rgba(167,139,250,0.55)" }}
              >
                L&apos;Amour Toujours
                <br />
                <span className="text-white/60">Gigi D&apos;Agostino</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      <audio
        ref={favoriteSongRef}
        src="/assets/videos/favoritesong.mp3"
        preload="auto"
        aria-hidden
      />

      {/* Bonfire sits BEFORE the side-chars row in the DOM so Mori (last
          side-char, same z-index) paints on top of it. */}
      <motion.img
        src="/assets/sprites/bonfire.gif"
        alt=""
        aria-hidden
        draggable={false}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="pointer-events-none absolute bottom-0 left-[18%] z-0 hidden h-28 w-auto select-none object-contain sm:block sm:h-40 sm:left-[20%] md:h-48 md:left-[22%]"
        style={{ mixBlendMode: "screen" }}
      />

      <motion.div
        variants={charRowVariants}
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 z-0 hidden items-end gap-1 pl-2 sm:flex sm:gap-2 sm:pl-4"
      >
        {SIDE_CHARS.map((c) => (
          <motion.div key={c.alt} variants={charVariants}>
            <SpriteSlot
              src={c.src}
              alt={c.alt}
              fallbackLabel={c.alt}
              className={`block h-40 w-auto select-none object-contain sm:h-52 md:h-64 ${c.extraClass}`}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Sonic — smaller buddy hanging next to Ichigo. Standalone so adding
          him doesn't shift the rest of the side-char row. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src="/assets/sprites/sonic.gif"
        alt=""
        aria-hidden
        draggable={false}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute bottom-0 z-0 hidden h-20 w-auto select-none object-contain sm:block sm:h-28 md:h-32"
        style={{
          left: "8%",
        }}
        /* TODO: tune position */
      />

      <motion.nav
        variants={navContainerVariants}
        aria-label="Sections"
        className="absolute left-1/2 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 rounded-xl bg-black/35 px-6 py-4 text-base uppercase tracking-[0.28em] backdrop-blur-sm sm:left-auto sm:right-0 sm:top-0 sm:translate-x-0 sm:translate-y-0 sm:items-end sm:gap-3 sm:rounded-none sm:bg-transparent sm:px-12 sm:py-5 sm:backdrop-blur-none"
      >
        {NAV_LINKS.map((link) => (
          <motion.button
            key={link.id}
            variants={navPopVariants}
            whileHover={{ scale: 1.06, x: -2 }}
            transition={{ type: "spring", stiffness: 480, damping: 22 }}
            type="button"
            onClick={() => onNavigate(link.id)}
            className="px-2 py-1 text-white/60 transition-colors duration-150 hover:text-violet-300 focus:outline-none focus-visible:text-violet-300 focus-visible:underline"
          >
            {link.label}
          </motion.button>
        ))}

        <motion.div variants={navPopVariants}>
          <motion.button
            type="button"
            onClick={() => onNavigate("fun")}
            aria-label="Fun"
            inherit={false}
            animate={{
              rotate: [-8, 8, -8],
              scale: [0.96, 1.18, 0.96],
              color: [
                "rgb(244, 114, 182)",
                "rgb(167, 139, 250)",
                "rgb(251, 146, 60)",
                "rgb(244, 114, 182)",
              ],
            }}
            transition={{
              rotate: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
              color: { duration: 3.6, repeat: Infinity, ease: "linear" },
            }}
            className="origin-center px-2 py-1 focus:outline-none focus-visible:underline"
          >
            Fun
          </motion.button>
        </motion.div>
      </motion.nav>

      <section className="relative z-10 max-w-2xl space-y-3 px-6 pt-8 text-xs sm:px-12 sm:pt-10">
        <motion.div
          variants={nameContainerVariants}
          aria-label="ABRAR"
          className="flex items-end"
        >
          {NAME_SPRITES.map((letter, i) => (
            <motion.div
              key={i}
              variants={letterVariants}
              className={
                i === 0
                  ? ""
                  : i === 1
                    ? "-ml-3 sm:-ml-4"
                    : i === 2
                      ? "-ml-5 sm:-ml-6"
                      : "-ml-1 sm:-ml-1.5"
              }
            >
              <div className={letter.offsetClass}>
                <SpriteSlot
                  src={letter.src}
                  alt={letter.alt}
                  fallbackLabel={letter.alt}
                  className={`block w-auto select-none object-contain ${letter.sizeClass} ${
                    "extraClass" in letter ? letter.extraClass : ""
                  }`}
                />
              </div>
            </motion.div>
          ))}
          {/* Money flourish next to the name. Pops in after the letters land. */}
          <motion.img
            src="/assets/sprites/money.gif"
            alt=""
            aria-hidden
            draggable={false}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
            initial={{ opacity: 0, scale: 0.3, rotate: -25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              delay: 1.05,
              type: "spring",
              stiffness: 420,
              damping: 14,
            }}
            className="ml-2 block h-10 w-auto select-none sm:ml-3 sm:h-12 md:h-14"
            /* TODO: tune position */
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TypingText
            text={BIO_TEXT}
            speed={5}
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

        <motion.div variants={itemVariants} className="pt-3">
          <motion.a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: "spring", stiffness: 480, damping: 22 }}
            className="group inline-flex items-center gap-2 border border-white/25 px-4 py-2 text-[12px] text-white/85 transition-colors hover:border-white hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <span>schedule a chat with me :)</span>
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </motion.a>
        </motion.div>
      </section>

      {/* Scroll-down cue — sits in the bottom-center gap between Mori (left
          side-chars row) and Gojo (right aside). Click drops the user into
          the scroll feed starting at Projects, mirroring the top-right nav
          but as an inline "more below" hint. */}
      <motion.button
        type="button"
        onClick={() => onNavigate("projects")}
        aria-label="Scroll down to projects"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 sm:bottom-8"
      >
        <span
          className="text-[10px] font-medium uppercase tracking-[0.32em]"
          style={{
            color: "rgba(255,255,255,0.78)",
            textShadow: "0 0 10px rgba(167,139,250,0.55)",
          }}
        >
          Scroll
        </span>
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
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            color: "#c4b5fd",
            filter: "drop-shadow(0 0 8px rgba(167,139,250,0.7))",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </motion.button>

      <motion.aside
        variants={portraitVariants}
        className="pointer-events-none absolute bottom-0 right-4 z-0 flex items-end gap-1 sm:right-8 sm:gap-2 md:right-12"
      >
        {/* Gojo — clickable sidekick standing alongside the main portrait. */}
        <motion.button
          type="button"
          onClick={() => setGojoVideoOpen(true)}
          aria-label="Play Gojo video"
          whileHover={{ scale: 1.04, y: -3 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className="pointer-events-auto relative -mr-6 origin-bottom-right cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:-mr-14 md:-mr-20"
          style={{
            filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.5))",
          }}
        >
          {/* Pulsing violet halo — the "click me" cue. Sits behind the sprite. */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            animate={{
              opacity: [0.5, 0.95, 0.5],
              scale: [0.94, 1.08, 0.94],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(closest-side, rgba(196,181,253,0.6) 0%, rgba(167,139,250,0.35) 40%, transparent 72%)",
              filter: "blur(22px)",
            }}
          />

          {/* "Naw I'd Win" callout above his head */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0, y: 6, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: -3 }}
            transition={{ delay: 1.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap sm:-top-11"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 8px rgba(255,255,255,0.18), 0 0 18px rgba(196,181,253,0.28), inset 0 0 0 1px rgba(255,255,255,0.12)",
                  "0 0 18px rgba(255,255,255,0.42), 0 0 32px rgba(196,181,253,0.55), inset 0 0 0 1px rgba(255,255,255,0.18)",
                  "0 0 8px rgba(255,255,255,0.18), 0 0 18px rgba(196,181,253,0.28), inset 0 0 0 1px rgba(255,255,255,0.12)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] sm:text-[11px]"
              style={{
                borderColor: "rgba(255,255,255,0.22)",
                backgroundColor: "rgba(10,10,15,0.7)",
                color: "#ede9fe",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              Naw I&apos;d Win
              {/* tiny speech-bubble tail */}
              <span
                aria-hidden
                className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r"
                style={{
                  borderColor: "rgba(255,255,255,0.22)",
                  backgroundColor: "rgba(10,10,15,0.7)",
                }}
              />
            </motion.div>
          </motion.div>

          <SpriteSlot
            src="/assets/sprites/gojo.png"
            alt="Gojo"
            fallbackLabel="Gojo"
            className="relative block h-32 w-auto select-none object-contain sm:h-52 md:h-64 [filter:drop-shadow(0_0_6px_rgba(196,181,253,0.95))_drop-shadow(0_0_16px_rgba(167,139,250,0.7))]"
          />
        </motion.button>

        <div className="relative">
          <SpriteSlot
            src="/assets/sprites/abrarmainscreen.png"
            alt="Abrar"
            fallbackLabel="abrarmainscreen.png"
            className="block h-56 w-auto select-none object-contain sm:h-96 md:h-[26rem]"
          />
          {/* BAM popping off Abrar's right side — Gojo lives on the left now. */}
          <motion.div
            variants={bamVariants}
            className="pointer-events-none absolute -right-3 top-6 sm:-right-4 sm:top-10 md:top-12"
          >
            <SpriteSlot
              src="/assets/sprites/BAM.png"
              alt="BAM"
              fallbackLabel="BAM"
              className="h-16 w-16 select-none object-contain sm:h-20 sm:w-20 md:h-24 md:w-24"
            />
          </motion.div>
        </div>
      </motion.aside>

      {/* Decorative easter-eggs — TODO: tune position to taste. */}
      <motion.img
        src="/assets/sprites/mahoraga.png"
        alt=""
        aria-hidden
        draggable={false}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 0.85, scale: 1 }}
        transition={{ delay: 1.4, duration: 0.6, ease: "easeOut" }}
        className="pointer-events-none absolute z-[1] hidden h-44 w-auto select-none object-contain sm:block sm:h-56 md:h-64"
        style={{
          top: "18%",
          left: "52%",
          mixBlendMode: "screen",
        }}
      />
      {/* gyro.gif — sits in the right column between the Fun nav and Abrar. */}
      <motion.img
        src="/assets/sprites/gyro.gif"
        alt=""
        aria-hidden
        draggable={false}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 1.8, duration: 0.5 }}
        className="pointer-events-none absolute z-[1] h-20 w-auto select-none object-contain sm:h-28"
        style={{
          top: "24%",
          right: "2%",
          mixBlendMode: "screen",
        }}
      />

      {/* Preload Gojo's video so the click feels instant. */}
      <div aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
        <video src={GOJO_VIDEO_SRC} preload="none" muted playsInline />
      </div>

      <AnimatePresence>
        {gojoVideoOpen && (
          <VideoModal
            src={GOJO_VIDEO_SRC}
            onClose={() => setGojoVideoOpen(false)}
            volume={0.6}
            credit="goaten"
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
