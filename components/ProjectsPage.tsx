"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BackButton from "./BackButton";
import VideoModal from "./VideoModal";
import {
  PROJECTS,
  PROJECTS_MAIN_BACKGROUND,
  PROJECT_CHARACTERS,
  type Project,
  type ProjectSlug,
} from "@/lib/projects";

type Props = {
  onBack: () => void;
};

type ViewKey = ProjectSlug | "main";

const PROJECTS_INTRO =
  "This is where I'm doing all sorts of unique new stuff by pushing myself to work on things to build that “experience” ykwim? Top is the most recent and bottom is oldest. Most of my projects are poured from how I view them from someone else, for example my project “CounterStack” a project that is mainly casino theme which brings me that in light of what they can view as, feel free to look at all of them! I'd love feedback :)";

export default function ProjectsPage({ onBack }: Props) {
  const [selected, setSelected] = useState<ProjectSlug | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const viewKey: ViewKey = selected ?? "main";
  const character = PROJECT_CHARACTERS[viewKey];
  const selectedProject =
    selected != null ? PROJECTS.find((p) => p.slug === selected) ?? null : null;

  const backgroundSrc = selectedProject?.backgroundSrc ?? PROJECTS_MAIN_BACKGROUND;

  const onCharacterClick = useCallback(() => {
    setPlayingVideo(character.video);
  }, [character.video]);

  const handleBackToList = useCallback(() => {
    setSelected(null);
  }, []);

  // Esc returns to the landing screen when no video is playing.
  useEffect(() => {
    if (playingVideo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selected) setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [playingVideo, selected]);

  // Preload list — every background + every character video, hidden in DOM.
  const preloadVideos = useMemo(
    () =>
      Array.from(new Set(Object.values(PROJECT_CHARACTERS).map((c) => c.video))),
    [],
  );
  const preloadBackgrounds = useMemo(
    () => [PROJECTS_MAIN_BACKGROUND, ...PROJECTS.map((p) => p.backgroundSrc)],
    [],
  );
  const preloadCharacters = useMemo(
    () =>
      Array.from(new Set(Object.values(PROJECT_CHARACTERS).map((c) => c.img))),
    [],
  );

  return (
    <main className="relative h-full w-full overflow-hidden bg-black text-white max-sm:h-auto max-sm:min-h-svh max-sm:overflow-visible">
      <BackButton onClick={onBack} />

      <BackgroundLayer src={backgroundSrc} viewKey={viewKey} />

      {/* ----------------------------------------------------------------------
          MOBILE LAYOUT — stacked, scrollable column. The character portrait
          becomes a tappable hero and each project is a full-width card that
          expands inline to reveal its detail. Hidden on sm+ where the desktop
          collage (absolute character + side list + center panel) takes over.
          --------------------------------------------------------------------- */}
      <div className="relative z-20 mx-auto flex w-full max-w-lg flex-col px-5 pb-16 pt-20 sm:hidden">
        <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-violet-300/85">
          Project archive
        </p>
        <h1
          className="mt-2 text-[26px] font-medium tracking-tight"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
        >
          Projects
        </h1>
        <p
          className="mt-3 text-[14px] text-white/85"
          style={{ lineHeight: 1.7, textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}
        >
          {PROJECTS_INTRO}
        </p>

        {/* Tappable character hero — plays the current view's video. */}
        <button
          type="button"
          onClick={onCharacterClick}
          aria-label={`Play ${character.alt} video`}
          className="mt-6 flex flex-col items-center gap-2 self-center focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={character.img}
            alt={character.alt}
            draggable={false}
            className="block h-44 w-auto select-none object-contain"
            style={{
              filter:
                "drop-shadow(0 8px 24px rgba(0,0,0,0.55)) drop-shadow(0 0 24px rgba(167,139,250,0.25))",
            }}
          />
          <span className="text-[10px] uppercase tracking-[0.28em] text-violet-200/80">
            tap to play
          </span>
        </button>

        {/* Project list — tap a card to expand its detail inline. */}
        <div className="mt-6 flex flex-col gap-3">
          {PROJECTS.map((p, i) => (
            <div key={p.slug}>
              <ProjectCard
                project={p}
                index={i}
                isActive={selected === p.slug}
                onClick={() =>
                  setSelected(selected === p.slug ? null : p.slug)
                }
              />
              <AnimatePresence initial={false}>
                {selected === p.slug && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 rounded-lg border border-violet-300/25 bg-[rgba(10,10,15,0.6)] px-4 py-4 backdrop-blur">
                      <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-violet-300">
                        {p.tag}
                      </p>
                      <p
                        className="mt-2 text-[14px] text-white/85"
                        style={{ lineHeight: 1.7 }}
                      >
                        {p.description}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* "Stage transition" sweep — a violet diagonal flash on project enter. */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={`sweep-${selected}`}
            aria-hidden
            initial={{ x: "-110%", opacity: 0.7 }}
            animate={{ x: "110%", opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-0 z-[15]"
            style={{
              background:
                "linear-gradient(120deg, transparent 30%, rgba(167,139,250,0.18) 47%, rgba(196,181,253,0.45) 50%, rgba(167,139,250,0.18) 53%, transparent 70%)",
              mixBlendMode: "screen",
            }}
          />
        )}
      </AnimatePresence>

      {/* Vignette + subtle grain to keep typography legible over any bg. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.45) 75%, rgba(0,0,0,0.7) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
        }}
      />

      <CharacterPortrait
        character={character}
        onClick={onCharacterClick}
        compact={selected !== null}
      />

      <ProjectListPanel
        projects={PROJECTS}
        selected={selected}
        onSelect={setSelected}
      />

      {/* Shanks — only the MAIN projects view. Each project gets its own
          bottom-right mascot via ProjectDecorations instead. */}
      {!selectedProject && (
        <motion.img
          src="/assets/sprites/shanks.gif"
          alt=""
          aria-hidden
          draggable={false}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="pointer-events-none absolute z-[6] hidden h-36 w-auto select-none object-contain sm:block sm:h-52 md:h-60"
          style={{
            bottom: "2%",
            right: "2%",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Per-project decorative gifs — different mascot per project, slotted
          where Shanks would otherwise sit. */}
      {selectedProject && <ProjectDecorations slug={selectedProject.slug} />}

      <AnimatePresence mode="wait">
        {selectedProject ? (
          <DetailPanel
            key={selectedProject.slug}
            project={selectedProject}
            onBack={handleBackToList}
          />
        ) : (
          <IntroPanel key="intro" />
        )}
      </AnimatePresence>

      {/* Preload — invisible but eagerly fetched. */}
      <div aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
        {preloadBackgrounds.map((src) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={src} src={src} alt="" />
        ))}
        {preloadCharacters.map((src) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={src} src={src} alt="" />
        ))}
        {preloadVideos.map((src) => (
          <video key={src} src={src} preload="none" muted playsInline />
        ))}
      </div>

      <AnimatePresence>
        {playingVideo && (
          <VideoModal
            key={playingVideo}
            src={playingVideo}
            onClose={() => setPlayingVideo(null)}
            volume={0.6}
            credit={character.credit}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ---------------- Subcomponents ---------------- */

function BackgroundLayer({ src, viewKey }: { src: string; viewKey: ViewKey }) {
  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={viewKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${src}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
    </AnimatePresence>
  );
}

function CharacterPortrait({
  character,
  onClick,
  compact,
}: {
  character: { img: string; alt: string; video: string };
  onClick: () => void;
  compact: boolean;
}) {
  // Pinned to the bottom-left of the viewport. Compact = a project detail
  // panel is open and we shrink slightly on mobile so the panel has room.
  const widthClass = compact
    ? "w-[min(48vw,_320px)] sm:w-[min(44vw,_460px)] md:w-[min(42vw,_540px)]"
    : "w-[min(65vw,_400px)] sm:w-[min(55vw,_540px)] md:w-[min(46vw,_640px)]";

  return (
    // mode="wait" — only one character renders at a time so the previous
    // portrait doesn't bleed into the new background during a swap.
    // z-10 sits below the detail panel (z-20) so the character never paints
    // through the title/description copy.
    <AnimatePresence mode="wait">
      <motion.button
        key={character.img}
        type="button"
        onClick={onClick}
        aria-label={`Play ${character.alt} video`}
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.985 }}
        className="absolute bottom-0 left-0 z-10 origin-bottom-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 max-sm:hidden"
        style={{
          filter:
            "drop-shadow(0 8px 24px rgba(0,0,0,0.55)) drop-shadow(0 0 28px rgba(167,139,250,0.25))",
        }}
      >
        {/* Ground glow so the character feels planted on the floor. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-4 left-1/2 -z-10 h-24 w-3/4 -translate-x-1/2 rounded-[50%] blur-2xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(167,139,250,0.5), transparent 70%)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={character.img}
          alt={character.alt}
          draggable={false}
          className={`block h-auto select-none object-contain ${widthClass}`}
        />
      </motion.button>
    </AnimatePresence>
  );
}

function ProjectListPanel({
  projects,
  selected,
  onSelect,
}: {
  projects: Project[];
  selected: ProjectSlug | null;
  onSelect: (slug: ProjectSlug) => void;
}) {
  return (
    <aside
      aria-label="Projects"
      className="absolute right-4 top-1/2 z-20 hidden w-[260px] -translate-y-1/2 flex-col gap-3 sm:right-8 sm:flex sm:w-[340px] md:right-12 md:w-[360px]"
    >
      <p
        className="pb-1 pl-1 text-[10px] uppercase tracking-[0.4em]"
        style={{
          color: "rgba(196, 181, 253, 0.85)",
          textShadow: "0 0 12px rgba(0,0,0,0.6)",
        }}
      >
        Most recent projects
      </p>
      {projects.map((p, i) => (
        <ProjectCard
          key={p.slug}
          project={p}
          index={i}
          isActive={selected === p.slug}
          onClick={() => onSelect(p.slug)}
        />
      ))}
    </aside>
  );
}

function ProjectCard({
  project,
  index,
  isActive,
  onClick,
}: {
  project: Project;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.15 + index * 0.07,
      }}
      whileHover={{ scale: 1.015, x: -2 }}
      whileTap={{ scale: 0.985 }}
      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-lg border p-3 text-left transition-colors duration-200 focus:outline-none"
      style={{
        backgroundColor: isActive
          ? "rgba(168, 139, 250, 0.18)"
          : "rgba(10, 10, 15, 0.55)",
        borderColor: isActive
          ? "rgba(168, 139, 250, 0.7)"
          : "rgba(255, 255, 255, 0.1)",
        borderWidth: 0.5,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: isActive
          ? "0 0 24px rgba(167, 139, 250, 0.25), inset 0 0 12px rgba(167,139,250,0.08)"
          : undefined,
      }}
    >
      {/* Numbered marker */}
      <span
        className="shrink-0 font-mono text-[10px] tabular-nums"
        style={{
          color: isActive ? "#c4b5fd" : "rgba(255,255,255,0.4)",
          letterSpacing: "0.1em",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Thumb */}
      <div
        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md"
        style={{
          borderWidth: 0.5,
          borderStyle: "solid",
          borderColor: isActive
            ? "rgba(168, 139, 250, 0.55)"
            : "rgba(255, 255, 255, 0.12)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.spriteSrc}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="truncate text-sm font-medium tracking-tight"
          style={{
            color: isActive ? "#ddd6fe" : "rgba(255,255,255,0.92)",
          }}
        >
          {project.title}
        </div>
        <div
          className="mt-0.5 truncate text-[10px] uppercase tracking-[0.18em]"
          style={{
            color: isActive
              ? "rgba(196, 181, 253, 0.85)"
              : "rgba(255, 255, 255, 0.5)",
          }}
        >
          {project.tag}
        </div>
      </div>

      {/* Active corner accent */}
      {isActive && (
        <motion.span
          aria-hidden
          layoutId="project-active-accent"
          className="absolute right-0 top-0 h-full w-[2px]"
          style={{
            background:
              "linear-gradient(180deg, transparent, #c4b5fd, transparent)",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
        />
      )}
    </motion.button>
  );
}

/**
 * DetailPanel — project info shown when a project is selected. Lighter
 * treatment than a hard card: just title + tag + description over a soft
 * scrim so text stays legible against any project background.
 */
function DetailPanel({
  project,
  onBack,
}: {
  project: Project;
  onBack: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 hidden items-center justify-center px-4 sm:flex sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="pointer-events-auto w-[min(92vw,_520px)]"
        style={{
          // Subtle scrim — keeps copy legible without putting a hard card box
          // around it. Wide soft fade rather than a clipped rectangle.
          background:
            "radial-gradient(ellipse 95% 80% at 50% 50%, rgba(8,8,14,0.78), rgba(8,8,14,0.45) 60%, transparent 95%)",
          padding: "1.75rem 0.5rem",
        }}
      >
        <motion.button
          type="button"
          onClick={onBack}
          whileHover={{ x: -3, color: "#ddd6fe" }}
          transition={{ duration: 0.15 }}
          className="mb-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.34em] focus:outline-none"
          style={{
            color: "rgba(255,255,255,0.6)",
            textShadow: "0 0 8px rgba(0,0,0,0.7)",
          }}
        >
          <span aria-hidden>←</span>
          <span>Back to projects</span>
        </motion.button>

        <p
          className="text-[11px] font-medium uppercase tracking-[0.32em]"
          style={{
            color: "#c4b5fd",
            textShadow: "0 0 14px rgba(0,0,0,0.7)",
          }}
        >
          {project.tag}
        </p>
        <h2
          className="mt-2 text-[28px] font-medium leading-tight tracking-tight sm:text-[32px]"
          style={{
            color: "rgba(255,255,255,0.98)",
            textShadow: "0 2px 12px rgba(0,0,0,0.55)",
          }}
        >
          {project.title}
        </h2>

        <span
          aria-hidden
          className="mt-4 block h-px w-12"
          style={{
            background:
              "linear-gradient(90deg, rgba(196,181,253,0.7), transparent)",
          }}
        />

        <p
          className="mt-4 text-[14.5px] sm:text-[15px]"
          style={{
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.7,
            textShadow: "0 1px 6px rgba(0,0,0,0.6)",
          }}
        >
          {project.description}
        </p>
      </motion.div>
    </div>
  );
}

/**
 * HoverSwapGif — layered gifs that snap-swap on hover without re-loading.
 * Both src files are in the DOM from mount so the browser keeps both gifs
 * decoded + playing; on hover we just flip opacity. No transition so the
 * swap is game-snappy rather than soft.
 */
function HoverSwapGif({
  base,
  hover,
  sizeClass,
  className,
}: {
  base: string;
  hover: string;
  sizeClass: string;
  className?: string;
}) {
  const onErr = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.currentTarget as HTMLImageElement).style.display = "none";
  };
  // No `relative` on the wrapper — callers pass `absolute …` in className,
  // and an absolute element already creates a containing block for its
  // absolutely-positioned descendants. Adding `relative` here collided with
  // the caller's `absolute` (alphabetical CSS order let `relative` win) so
  // the wrapper drifted out of the bottom-right slot.
  return (
    <div className={`group ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={base}
        alt=""
        aria-hidden
        draggable={false}
        onError={onErr}
        className={`block w-auto select-none group-hover:opacity-0 ${sizeClass}`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={hover}
        alt=""
        aria-hidden
        draggable={false}
        onError={onErr}
        className={`absolute left-0 top-0 block w-auto select-none opacity-0 group-hover:opacity-100 ${sizeClass}`}
      />
    </div>
  );
}

/**
 * Per-project decorative gifs. Anchored to the bottom of the right column,
 * directly below the project list panel — same right offset so they line up
 * with the cards above. The second CounterStack gif (gambitcard) gets its
 * own slot up-top so the two don't collide.
 */
function ProjectDecorations({ slug }: { slug: ProjectSlug }) {
  const onErr = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.currentTarget as HTMLImageElement).style.display = "none";
  };

  // Shared slot — bottom-right corner, same place Shanks sits on the main
  // projects view. Each project's mascot takes over the corner cleanly.
  // Sizes pulled in so the mascot reads as an accent rather than crowding.
  const slotClass =
    "absolute bottom-[2%] right-[2%] z-[6] hidden sm:block";
  const sizeClass = "h-24 sm:h-32 md:h-40";

  switch (slug) {
    case "tripwire":
      // TripWire now uses ichigoglint as its mascot (static — no hover swap).
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/assets/sprites/ichigoglint.gif"
          alt=""
          aria-hidden
          draggable={false}
          onError={onErr}
          className={`${slotClass} pointer-events-none w-auto select-none object-contain ${sizeClass}`}
          /* TODO: tune position */
        />
      );
    case "glint":
      // GLINT now uses tripwirebot as its mascot (static).
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/assets/sprites/tripwirebot.gif"
          alt=""
          aria-hidden
          draggable={false}
          onError={onErr}
          className={`${slotClass} pointer-events-none w-auto select-none object-contain ${sizeClass}`}
          /* TODO: tune position */
        />
      );
    case "counterstack":
      return (
        <>
          <HoverSwapGif
            base="/assets/sprites/gambitstanding.gif"
            hover="/assets/sprites/gambithover.gif"
            sizeClass={sizeClass}
            className={slotClass}
            /* TODO: tune position */
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/sprites/gambitcard.gif"
            alt=""
            aria-hidden
            draggable={false}
            onError={onErr}
            className="pointer-events-none absolute top-[10%] right-[32%] z-[6] hidden h-24 w-auto select-none object-contain sm:block sm:h-32"
            /* TODO: tune position */
          />
        </>
      );
    default:
      return null;
  }
}

function IntroPanel() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[5%] z-20 hidden justify-center px-4 sm:flex sm:bottom-[6%] sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="pointer-events-auto w-[min(88vw,_560px)] rounded-xl border p-5 sm:p-6"
        style={{
          backgroundColor: "rgba(10, 10, 15, 0.78)",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 0.5,
          backdropFilter: "blur(12px) saturate(140%)",
          WebkitBackdropFilter: "blur(12px) saturate(140%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.4)",
        }}
      >
        <p
          className="text-[10px] font-medium uppercase tracking-[0.34em]"
          style={{ color: "#c4b5fd" }}
        >
          Project archive
        </p>
        <p
          className="mt-3 text-[13.5px] sm:text-[14.5px]"
          style={{
            color: "rgba(255,255,255,0.88)",
            lineHeight: 1.65,
          }}
        >
          {PROJECTS_INTRO}
        </p>
      </motion.div>
    </div>
  );
}
