"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProfessionalBackground from "@/components/ProfessionalBackground";
import { RETURN_TO_KEY } from "@/lib/projects";
import { ABOUT, LINKS, PROFILE, PROJECTS } from "@/lib/professional";

const DISPLAY = "font-[family-name:var(--font-pro-display)]";
const MONO = "font-[family-name:var(--font-pro-mono)]";

// useLayoutEffect on the client, useEffect on the server, so the GSAP "from"
// start states are set before paint without tripping the SSR warning.
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Scroll-reveal wrapper for the non-hero sections. Honors reduced motion.
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 26 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
    },
  };
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-10 flex items-center gap-4">
      <span className={`${MONO} text-[11px] tracking-[0.4em] text-[color:var(--pro-ink)]`}>
        {index}
      </span>
      <span
        aria-hidden
        className="h-px flex-1 max-w-[3rem]"
        style={{ background: "var(--pro-ink)", opacity: 0.5 }}
      />
      <span
        className={`${MONO} text-[11px] uppercase tracking-[0.34em] text-[color:var(--pro-muted)]`}
      >
        {title}
      </span>
    </div>
  );
}

export default function ProfessionalPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);

  // Return to the home feed without replaying the intro video.
  const goBack = useCallback(() => {
    try {
      sessionStorage.setItem(RETURN_TO_KEY, "home");
    } catch {
      // ignore privacy-mode failures
    }
    router.push("/");
  }, [router]);

  // GSAP opening + scroll choreography. The ink overlay holds the name and an
  // accent line, then wipes up to reveal the page; the hero lines rise out of
  // their masks; the photo eases in and breathes. Project cards rise and settle
  // as they scroll into view. Reduced-motion users skip all of it.
  useIso(() => {
    if (reduce) {
      if (overlayRef.current) overlayRef.current.style.display = "none";
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.set(".pro-hero-rise", { yPercent: 118 })
        // The overlay holds for a beat: name fades in, accent line draws.
        .from(".pro-overlay-mark", {
          opacity: 0,
          y: 14,
          duration: 0.8,
          ease: "power2.out",
        })
        .fromTo(
          ".pro-overlay-line",
          { scaleX: 0 },
          { scaleX: 1, duration: 0.9, ease: "power2.inOut" },
          0.15,
        )
        .to(
          [".pro-overlay-mark", ".pro-overlay-line"],
          { opacity: 0, y: -12, duration: 0.6, ease: "power2.in" },
          2.3,
        )
        // Then the curtain wipes up.
        .to(
          overlayRef.current,
          { yPercent: -100, duration: 1.1, ease: "power4.inOut" },
          2.45,
        )
        // Hero rises out of its masks.
        .to(
          ".pro-hero-rise",
          { yPercent: 0, duration: 1.1, stagger: 0.14 },
          2.75,
        )
        // Photo eases in.
        .from(
          photoRef.current,
          { autoAlpha: 0, xPercent: 10, duration: 1.4 },
          2.9,
        );

      // A slow, ongoing float so the portrait feels alive.
      gsap.to(photoRef.current, {
        y: -12,
        duration: 4.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 4.6,
      });

      // Projects are dealt in like thrown cards: each flies from an alternating
      // side, spinning, and settles into its slot with a little overshoot.
      gsap.from(".pro-card", {
        scrollTrigger: {
          trigger: ".pro-deck",
          scroller: rootRef.current,
          start: "top 80%",
        },
        x: (i: number) => (i % 2 === 0 ? -260 : 260),
        y: 80,
        rotation: (i: number) => (i % 2 === 0 ? -24 : 24),
        scale: 0.7,
        autoAlpha: 0,
        transformOrigin: "center center",
        duration: 0.95,
        ease: "back.out(1.3)",
        stagger: 0.13,
        // Drop the inline transform when done so the CSS hover lift/tilt works.
        clearProps: "transform",
      });
    }, rootRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <main
      ref={rootRef}
      className="pro-root relative h-[100dvh] w-screen overflow-y-auto font-[family-name:var(--font-pro-body)]"
      style={{ color: "var(--pro-text)" }}
    >
      <ProfessionalBackground />

      {/* GSAP opening overlay: wipes up to reveal the page. */}
      <div
        ref={overlayRef}
        aria-hidden
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4"
        style={{ background: "var(--pro-ink)" }}
      >
        <span
          className={`${MONO} pro-overlay-mark text-[11px] uppercase tracking-[0.5em]`}
          style={{ color: "var(--pro-bg)" }}
        >
          Abrar Sarwar
        </span>
        <span
          aria-hidden
          className="pro-overlay-line h-px w-28 origin-center"
          style={{ background: "var(--pro-bg)", opacity: 0.6 }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-6 sm:px-8">
        {/* ---- Hero (GSAP opening) ----------------------------------------- */}
        <section className="relative flex min-h-[100dvh] flex-col justify-center py-20">
          {/* Me, anchored bottom right of the hero on larger screens. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={photoRef}
            src={PROFILE.photo}
            alt="Abrar Sarwar"
            draggable={false}
            className="pointer-events-none absolute bottom-0 right-0 hidden h-[56vh] w-auto select-none object-contain object-bottom md:block lg:h-[66vh]"
            style={{
              filter: "drop-shadow(0 24px 50px rgba(11,11,12,0.18))",
              maskImage: "linear-gradient(to bottom, black 86%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, black 86%, transparent)",
            }}
          />

          <div className="relative z-10 md:max-w-[62%]">
            <div className="overflow-hidden pb-[0.12em]">
              <h1
                className={`${DISPLAY} pro-hero-rise font-light leading-[0.92] tracking-[-0.02em] text-[color:var(--pro-ink)]`}
                style={{ fontSize: "clamp(2.6rem, 8vw, 5.75rem)" }}
              >
                {PROFILE.name}
              </h1>
            </div>
            <div className="mt-5 overflow-hidden">
              <p
                className={`${DISPLAY} pro-hero-rise max-w-xl text-pretty text-xl italic text-[color:var(--pro-ink)] sm:text-2xl`}
                style={{ opacity: 0.88 }}
              >
                {PROFILE.oneLiner}
              </p>
            </div>
            <div className="mt-6 overflow-hidden">
              <p className="pro-hero-rise max-w-xl text-[15px] leading-relaxed sm:text-base">
                {PROFILE.intro}
              </p>
            </div>
            <div className="mt-8 overflow-hidden">
              <p
                className={`${MONO} pro-hero-rise text-[11px] uppercase tracking-[0.3em] text-[color:var(--pro-muted)]`}
              >
                {PROFILE.meta}
              </p>
            </div>
          </div>

          {/* Photo on small screens, in flow so it never covers the copy. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PROFILE.photo}
            alt="Abrar Sarwar"
            draggable={false}
            className="pointer-events-none mx-auto mt-12 block h-60 w-auto select-none self-end object-contain md:hidden"
            style={{ filter: "drop-shadow(0 18px 36px rgba(11,11,12,0.16))" }}
          />
        </section>

        {/* ---- About ------------------------------------------------------- */}
        <section className="py-24 sm:py-32">
          <Reveal>
            <SectionLabel index="01" title="About" />
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className={`${DISPLAY} max-w-3xl font-light leading-[1.05] tracking-[-0.01em] text-[color:var(--pro-ink)]`}
              style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}
            >
              {ABOUT.heading}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed sm:text-lg">
              {ABOUT.lead}
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ABOUT.hooks.map((hook, i) => (
              <Reveal key={hook.title} delay={0.06 * i}>
                <article
                  className="h-full rounded-2xl border p-6 backdrop-blur-md transition-colors duration-300 hover:border-[color:var(--pro-ink)] sm:p-7"
                  style={{
                    borderColor: "var(--pro-line)",
                    backgroundColor: "var(--pro-panel)",
                  }}
                >
                  <span
                    className={`${MONO} text-[11px] tracking-[0.28em] text-[color:var(--pro-muted)]`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className={`${DISPLAY} mt-3 text-2xl text-[color:var(--pro-ink)]`}
                  >
                    {hook.title}
                  </h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed">{hook.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---- Projects ---------------------------------------------------- */}
        <section className="py-24 sm:py-32">
          <Reveal>
            <SectionLabel index="02" title="Selected work" />
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className={`${DISPLAY} max-w-3xl font-light leading-[1.05] tracking-[-0.01em] text-[color:var(--pro-ink)]`}
              style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}
            >
              Projects
            </h2>
          </Reveal>

          {/* A dealt hand: each project is a playing card (no images), thrown in
              by GSAP. The rank corners and divider lean into the card metaphor. */}
          <div className="pro-deck mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {PROJECTS.map((project, i) => {
              const rank = String(i + 1).padStart(2, "0");
              return (
                <a
                  key={project.title}
                  href={project.href}
                  target={project.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="pro-card group relative flex h-full min-h-[19rem] flex-col rounded-2xl border p-7 backdrop-blur-md transition-[transform,border-color] duration-300 will-change-transform hover:-translate-y-1.5 hover:rotate-[-0.7deg] hover:border-[color:var(--pro-ink)] focus:outline-none focus-visible:ring-2 sm:p-8"
                  style={{
                    borderColor: "var(--pro-line)",
                    backgroundColor: "var(--pro-panel)",
                  }}
                >
                  {/* Card rank corner. */}
                  <div className="flex items-start justify-between">
                    <span
                      className={`${DISPLAY} text-[2.75rem] leading-none text-[color:var(--pro-ink)]`}
                    >
                      {rank}
                    </span>
                    <span
                      className={`${MONO} mt-2 text-[10px] uppercase tracking-[0.26em] text-[color:var(--pro-muted)]`}
                    >
                      {project.tags[0]}
                    </span>
                  </div>
                  <span
                    aria-hidden
                    className="mt-5 block h-px w-10"
                    style={{ background: "var(--pro-ink)", opacity: 0.45 }}
                  />

                  <h3
                    className={`${DISPLAY} mt-6 text-[1.9rem] leading-[1.05] text-[color:var(--pro-ink)]`}
                  >
                    {project.title}
                  </h3>
                  <p className="mt-3 flex-1 text-[14.5px] leading-relaxed">
                    {project.description}
                  </p>

                  <ul className="mt-6 flex flex-wrap gap-2">
                    {project.tags.map((tag, ti) => (
                      <li
                        key={`${tag}-${ti}`}
                        className={`${MONO} rounded-full border px-3 py-1 text-[10.5px] uppercase tracking-[0.16em] text-[color:var(--pro-muted)]`}
                        style={{ borderColor: "var(--pro-line)" }}
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>

                  {/* Footer: visit cue + a mirrored rank like the bottom of a card. */}
                  <div className="mt-6 flex items-end justify-between">
                    <span
                      className={`${MONO} text-[11px] uppercase tracking-[0.2em] text-[color:var(--pro-ink)] opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
                    >
                      Visit &#8599;
                    </span>
                    <span
                      aria-hidden
                      className={`${DISPLAY} rotate-180 text-[2.75rem] leading-none text-[color:var(--pro-ink)]`}
                      style={{ opacity: 0.1 }}
                    >
                      {rank}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* ---- Links ------------------------------------------------------- */}
        <section className="py-24 sm:py-32">
          <Reveal>
            <SectionLabel index="03" title="Elsewhere" />
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className={`${DISPLAY} max-w-3xl font-light leading-[1.05] tracking-[-0.01em] text-[color:var(--pro-ink)]`}
              style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}
            >
              Let us connect
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-12 flex flex-wrap gap-3">
              {LINKS.map((link) => {
                const primary = link.kind === "primary";
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`${MONO} group inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[12px] uppercase tracking-[0.18em] transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2`}
                    style={
                      primary
                        ? {
                            borderColor: "var(--pro-ink)",
                            backgroundColor: "var(--pro-ink)",
                            color: "var(--pro-bg)",
                          }
                        : {
                            borderColor: "var(--pro-line)",
                            backgroundColor: "var(--pro-panel)",
                            color: "var(--pro-ink)",
                          }
                    }
                  >
                    {link.label}
                    <span
                      aria-hidden
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    >
                      &rarr;
                    </span>
                  </a>
                );
              })}
            </div>
          </Reveal>
        </section>

        {/* ---- Footer / the only way back ---------------------------------- */}
        <footer
          className="flex flex-col items-center gap-8 border-t py-16 text-center"
          style={{ borderColor: "var(--pro-line)" }}
        >
          <p className={`${DISPLAY} text-xl text-[color:var(--pro-ink)]`}>
            {PROFILE.name}
          </p>
          {/* The single way back: return to the playful main site. */}
          <button
            type="button"
            onClick={goBack}
            className={`${MONO} group inline-flex items-center gap-2.5 rounded-full border px-7 py-4 text-[12px] uppercase tracking-[0.2em] transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2`}
            style={{
              borderColor: "var(--pro-ink)",
              backgroundColor: "var(--pro-ink)",
              color: "var(--pro-bg)",
            }}
          >
            <span aria-hidden>&larr;</span>
            <span>Return to the cool place</span>
          </button>
        </footer>
      </div>
    </main>
  );
}
