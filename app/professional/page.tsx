"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import ProfessionalBackground from "@/components/ProfessionalBackground";
import { RETURN_TO_KEY } from "@/lib/projects";
import { ABOUT, LINKS, PROFILE, PROJECTS } from "@/lib/professional";

const DISPLAY = "font-[family-name:var(--font-pro-display)]";
const MONO = "font-[family-name:var(--font-pro-mono)]";

// The "decode" motif: mono labels scramble into place like text being
// decrypted. Character set stays terminal-flavored to match the security work.
const SCRAMBLE_CHARS = "01<>#/+*";

// Ticker content: every tag across the selected projects, deduped in order.
const STACK = Array.from(new Set(PROJECTS.flatMap((p) => p.tags)));

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
        className="pro-label-line h-px flex-1 max-w-[3rem] origin-left"
        style={{ background: "var(--pro-ink)", opacity: 0.5 }}
      />
      <span
        className={`${MONO} pro-scramble text-[11px] uppercase tracking-[0.34em] text-[color:var(--pro-muted)]`}
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
  const heroTitleRef = useRef<HTMLHeadingElement | null>(null);
  const heroMetaRef = useRef<HTMLParagraphElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Return to the home feed without replaying the intro video.
  const goBack = useCallback(() => {
    try {
      sessionStorage.setItem(RETURN_TO_KEY, "home");
    } catch {
      // ignore privacy-mode failures
    }
    router.push("/");
  }, [router]);

  // GSAP choreography. The ink overlay holds the name then wipes up; the hero
  // headline rises character by character; the meta line decrypts; the portrait
  // eases in, breathes, and drifts on scroll. Section labels decode as they
  // enter, project cards deal in and tilt under the cursor, contact pills are
  // magnetic. Reduced-motion users skip all of it.
  useIso(() => {
    if (reduce) {
      if (overlayRef.current) overlayRef.current.style.display = "none";
      return;
    }
    gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    let split: SplitText | null = null;
    const removers: Array<() => void> = [];

    const ctx = gsap.context(() => {
      // ---- Opening -----------------------------------------------------
      if (heroTitleRef.current) {
        split = new SplitText(heroTitleRef.current, { type: "words,chars" });
      }
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.set(".pro-hero-rise", { yPercent: 118 });
      if (split) tl.set(split.chars, { yPercent: 120 });
      // The overlay holds for a beat: name fades in, accent line draws.
      tl.from(".pro-overlay-mark", {
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
        );
      // Headline rises character by character out of its mask.
      if (split) {
        tl.to(
          split.chars,
          { yPercent: 0, duration: 0.9, stagger: 0.032, ease: "power3.out" },
          2.7,
        );
      }
      // Remaining hero lines rise out of their masks.
      tl.to(
        ".pro-hero-rise",
        { yPercent: 0, duration: 1.1, stagger: 0.14 },
        2.85,
      )
        // Photo eases in.
        .from(
          photoRef.current,
          { autoAlpha: 0, xPercent: 10, duration: 1.4 },
          2.95,
        );
      // Meta line decrypts as it arrives.
      if (heroMetaRef.current) {
        tl.to(
          heroMetaRef.current,
          {
            duration: 1.5,
            ease: "none",
            scrambleText: {
              text: PROFILE.meta,
              chars: SCRAMBLE_CHARS,
              speed: 0.4,
            },
          },
          3.05,
        );
      }

      // A slow, ongoing float so the portrait feels alive.
      gsap.to(photoRef.current, {
        y: -12,
        duration: 4.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 4.6,
      });

      // Portrait parallax: it lags gently behind the hero as you scroll away.
      gsap.to(photoRef.current, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: ".pro-hero",
          scroller: rootRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Scroll progress hairline across the top of the page.
      gsap.to(progressRef.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: contentRef.current,
          scroller: rootRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
        },
      });

      // Section label hairlines draw in; label titles decode.
      gsap.utils.toArray<HTMLElement>(".pro-label-line").forEach((line) => {
        gsap.from(line, {
          scaleX: 0,
          duration: 0.8,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: line,
            scroller: rootRef.current,
            start: "top 88%",
            once: true,
          },
        });
      });
      gsap.utils.toArray<HTMLElement>(".pro-scramble").forEach((el) => {
        const text = el.textContent ?? "";
        gsap.to(el, {
          duration: 1.1,
          ease: "none",
          scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.35 },
          scrollTrigger: {
            trigger: el,
            scroller: rootRef.current,
            start: "top 88%",
            once: true,
          },
        });
      });

      // Toolkit ticker: two identical copies side by side, shifted by half the
      // track per loop so the scroll reads as endless.
      gsap.to(".pro-marquee-track", {
        xPercent: -50,
        ease: "none",
        duration: 30,
        repeat: -1,
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
        // Drop the inline transform when done so the pointer tilt can take over.
        clearProps: "transform",
      });

      // ---- Pointer interactions (fine pointers only) ---------------------
      if (finePointer) {
        // Cards tilt in 3D under the cursor, with an ink sheen that follows it.
        gsap.utils.toArray<HTMLElement>(".pro-card").forEach((card) => {
          const rotX = gsap.quickTo(card, "rotationX", {
            duration: 0.5,
            ease: "power3.out",
          });
          const rotY = gsap.quickTo(card, "rotationY", {
            duration: 0.5,
            ease: "power3.out",
          });
          const lift = gsap.quickTo(card, "y", {
            duration: 0.4,
            ease: "power3.out",
          });
          const onMove = (e: PointerEvent) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            gsap.set(card, { transformPerspective: 900 });
            rotY((px - 0.5) * 10);
            rotX((0.5 - py) * 8);
            card.style.setProperty("--mx", `${px * 100}%`);
            card.style.setProperty("--my", `${py * 100}%`);
          };
          const onEnter = () => lift(-6);
          const onLeave = () => {
            rotX(0);
            rotY(0);
            lift(0);
          };
          card.addEventListener("pointermove", onMove);
          card.addEventListener("pointerenter", onEnter);
          card.addEventListener("pointerleave", onLeave);
          removers.push(() => {
            card.removeEventListener("pointermove", onMove);
            card.removeEventListener("pointerenter", onEnter);
            card.removeEventListener("pointerleave", onLeave);
          });
        });

        // Contact pills and the footer CTA pull gently toward the cursor.
        gsap.utils.toArray<HTMLElement>(".pro-magnet").forEach((el) => {
          const qx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
          const qy = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
          const onMove = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            qx((e.clientX - (r.left + r.width / 2)) * 0.25);
            qy((e.clientY - (r.top + r.height / 2)) * 0.35);
          };
          const onLeave = () => {
            qx(0);
            qy(0);
          };
          el.addEventListener("pointermove", onMove);
          el.addEventListener("pointerleave", onLeave);
          removers.push(() => {
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerleave", onLeave);
          });
        });
      }
    }, rootRef);

    return () => {
      removers.forEach((fn) => fn());
      split?.revert();
      ctx.revert();
    };
  }, [reduce]);

  return (
    <main
      ref={rootRef}
      className="pro-root relative h-[100dvh] w-screen overflow-y-auto font-[family-name:var(--font-pro-body)]"
      style={{ color: "var(--pro-text)" }}
    >
      <ProfessionalBackground />

      {/* Scroll progress hairline. Below the opening overlay, above content. */}
      <div
        ref={progressRef}
        aria-hidden
        className="pro-progress fixed left-0 top-0 z-[55] h-[2px] w-full"
        style={{ background: "var(--pro-ink)" }}
      />

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

      <div ref={contentRef} className="relative mx-auto w-full max-w-5xl px-6 sm:px-8">
        {/* ---- Hero (GSAP opening) ----------------------------------------- */}
        <section className="pro-hero relative flex min-h-[100dvh] flex-col justify-center py-20">
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
                ref={heroTitleRef}
                className={`${DISPLAY} font-light leading-[0.92] tracking-[-0.02em] text-[color:var(--pro-ink)]`}
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
                ref={heroMetaRef}
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
                  className="h-full rounded-lg border p-6 backdrop-blur-md transition-colors duration-300 hover:border-[color:var(--pro-ink)] sm:p-7"
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

        {/* ---- Toolkit ticker ----------------------------------------------
            An endless strip of the real stack from the selected projects, so
            the keywords a recruiter scans for literally walk past. */}
        <section aria-label="Toolkit" className="py-4">
          <div
            className="pro-marquee overflow-hidden border-y py-5"
            style={{ borderColor: "var(--pro-line)" }}
          >
            <div className="pro-marquee-track flex w-max items-center whitespace-nowrap">
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  aria-hidden={copy === 1}
                  className="flex items-center"
                >
                  {STACK.map((item) => (
                    <span key={`${copy}-${item}`} className="flex items-center">
                      <span
                        className={`${DISPLAY} px-6 text-[1.35rem] italic text-[color:var(--pro-ink)] sm:text-[1.6rem]`}
                        style={{ opacity: 0.85 }}
                      >
                        {item}
                      </span>
                      <span
                        aria-hidden
                        className={`${MONO} text-[11px] tracking-widest text-[color:var(--pro-muted)]`}
                        style={{ opacity: 0.55 }}
                      >
                        {"//"}
                      </span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
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
              by GSAP, then held under the cursor — it tilts in 3D and an ink
              sheen tracks the pointer. The rank corners lean into the metaphor. */}
          <div className="pro-deck mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {PROJECTS.map((project, i) => {
              const rank = String(i + 1).padStart(2, "0");
              return (
                <a
                  key={project.title}
                  href={project.href}
                  target={project.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="pro-card group relative flex h-full min-h-[19rem] flex-col rounded-lg border p-7 backdrop-blur-md transition-colors duration-300 will-change-transform hover:border-[color:var(--pro-ink)] focus:outline-none focus-visible:ring-2 sm:p-8"
                  style={{
                    borderColor: "var(--pro-line)",
                    backgroundColor: "var(--pro-panel)",
                  }}
                >
                  {/* Ink sheen that follows the cursor (position from JS vars). */}
                  <span aria-hidden className="pro-card-sheen" />

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
                    className={`${MONO} pro-magnet group inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[12px] uppercase tracking-[0.18em] transition-colors duration-200 focus:outline-none focus-visible:ring-2`}
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
            className={`${MONO} pro-magnet group inline-flex items-center gap-2.5 rounded-full border px-7 py-4 text-[12px] uppercase tracking-[0.2em] transition-colors duration-200 focus:outline-none focus-visible:ring-2`}
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
