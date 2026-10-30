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
import { ABOUT, LINKS, PRESSURE, PROFILE, PROJECTS, WORK } from "@/lib/professional";

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
        yPercent: 8,
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

      // Selected work assembles like a ledger being filled in: the featured
      // build lifts in first, then each row slides up under it in order.
      gsap.from(".pro-feature", {
        scrollTrigger: {
          trigger: ".pro-work",
          scroller: rootRef.current,
          start: "top 78%",
        },
        y: 44,
        autoAlpha: 0,
        duration: 0.85,
        ease: "power3.out",
        clearProps: "transform",
      });
      gsap.from(".pro-row", {
        scrollTrigger: {
          trigger: ".pro-ledger",
          scroller: rootRef.current,
          start: "top 72%",
        },
        y: 26,
        autoAlpha: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.09,
        clearProps: "transform",
      });

      // ---- Pointer interactions (fine pointers only) ---------------------
      if (finePointer) {
        // The featured build keeps an ink sheen that tracks the cursor and a
        // small lift. No 3D tilt: on a block this wide it reads as a wobble.
        gsap.utils.toArray<HTMLElement>(".pro-card").forEach((card) => {
          const lift = gsap.quickTo(card, "y", {
            duration: 0.4,
            ease: "power3.out",
          });
          const onMove = (e: PointerEvent) => {
            const r = card.getBoundingClientRect();
            card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
            card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
          };
          const onEnter = () => lift(-5);
          const onLeave = () => lift(0);
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
        <section className="pro-hero relative flex min-h-[100dvh] flex-col justify-center overflow-hidden py-20">
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
              // Fades out before the hero clips it, so the parallax drift never
              // shows a hard cut against the signals band below.
              maskImage: "linear-gradient(to bottom, black 74%, transparent 94%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 74%, transparent 94%)",
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

        {/* ---- Signals band -----------------------------------------------
            Three shipped results, in the first screen after the hero. A
            recruiter skims for numbers before they read a sentence. */}
        <section aria-label="At a glance" className="pro-signals">
          <div
            className="grid grid-cols-1 border-y sm:grid-cols-3"
            style={{ borderColor: "var(--pro-line)" }}
          >
            {PROFILE.signals.map((signal, i) => (
              <Reveal key={signal.value} delay={0.06 * i}>
                <div
                  className={`h-full px-1 py-7 sm:px-7 ${i > 0 ? "border-t sm:border-l sm:border-t-0" : ""}`}
                  style={{ borderColor: "var(--pro-line)" }}
                >
                  <span
                    className={`${DISPLAY} block text-[1.85rem] leading-none text-[color:var(--pro-ink)] sm:text-[2.1rem]`}
                  >
                    {signal.value}
                  </span>
                  <span className="mt-3 block max-w-[22rem] text-[12.5px] leading-snug text-[color:var(--pro-muted)]">
                    {signal.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
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

          {/* One statement plus a fact list. The old four card grid said the
              same thing in four times the room. */}
          <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-16">
            <Reveal delay={0.1}>
              <p className="text-[15px] leading-relaxed sm:text-lg">{ABOUT.lead}</p>
              <p className="mt-6 text-[15px] leading-relaxed sm:text-lg">
                {ABOUT.closer}
              </p>
            </Reveal>

            <Reveal delay={0.16}>
              <dl className="border-t" style={{ borderColor: "var(--pro-line)" }}>
                {ABOUT.facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 border-b py-4 sm:grid-cols-[6.5rem_minmax(0,1fr)]"
                    style={{ borderColor: "var(--pro-line)" }}
                  >
                    <dt
                      className={`${MONO} pt-[3px] text-[10px] uppercase tracking-[0.22em] text-[color:var(--pro-muted)] sm:text-[10.5px]`}
                    >
                      {fact.label}
                    </dt>
                    <dd className="text-[14.5px] leading-relaxed text-[color:var(--pro-ink)]">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        {/* ---- Under pressure ----------------------------------------------
            The part a repo list cannot show: how I behave when the thing is on
            fire. Every claim carries a receipt from work that shipped, so it
            reads as evidence instead of self assessment. */}
        <section className="py-24 sm:py-32">
          <Reveal>
            <SectionLabel index="02" title="Under pressure" />
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className={`${DISPLAY} max-w-3xl font-light leading-[1.05] tracking-[-0.01em] text-[color:var(--pro-ink)]`}
              style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}
            >
              {PRESSURE.heading}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed sm:text-lg">
              {PRESSURE.lead}
            </p>
          </Reveal>

          <div className="mt-14">
            {PRESSURE.principles.map((principle, i) => (
              <Reveal key={principle.claim} delay={0.06 * i}>
                <article
                  className="grid grid-cols-1 gap-x-10 gap-y-5 border-t py-9 md:grid-cols-[3rem_minmax(0,1fr)_minmax(0,0.85fr)]"
                  style={{ borderColor: "var(--pro-line)" }}
                >
                  <span
                    className={`${DISPLAY} text-[2rem] leading-none text-[color:var(--pro-ink)]`}
                    style={{ opacity: 0.24 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3
                      className={`${DISPLAY} text-[1.5rem] leading-[1.15] text-[color:var(--pro-ink)] sm:text-[1.7rem]`}
                    >
                      {principle.claim}
                    </h3>
                    <p className="mt-3 text-[14.5px] leading-relaxed">
                      {principle.body}
                    </p>
                  </div>
                  <div
                    className="border-t pt-4 md:border-l md:border-t-0 md:pl-7 md:pt-0"
                    style={{ borderColor: "var(--pro-line)" }}
                  >
                    <span
                      className={`${MONO} text-[10px] uppercase tracking-[0.26em]`}
                      style={{ color: "var(--pro-accent)" }}
                    >
                      Receipt / {principle.source}
                    </span>
                    <p className="mt-3 text-[13.5px] leading-relaxed text-[color:var(--pro-muted)]">
                      {principle.receipt}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.08}>
            <blockquote
              className="mt-14 border-l-2 pl-6 sm:pl-8"
              style={{ borderColor: "var(--pro-ink)" }}
            >
              <p
                className={`${DISPLAY} max-w-3xl text-pretty text-[1.1rem] italic leading-relaxed text-[color:var(--pro-ink)] sm:text-[1.3rem]`}
                style={{ opacity: 0.9 }}
              >
                {PRESSURE.closer}
              </p>
            </blockquote>
          </Reveal>
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

        {/* ---- Selected work -----------------------------------------------
            Not a card wall. A case study index: the featured build gets the
            room to explain itself, the rest are ledger rows stating the
            problem and what the work optimized. Five entries sit in it as
            comfortably as four or seven, which a two column grid never did. */}
        <section className="pro-work py-24 sm:py-32">
          <Reveal>
            <SectionLabel index="03" title="Selected work" />
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className={`${DISPLAY} max-w-3xl font-light leading-[1.05] tracking-[-0.01em] text-[color:var(--pro-ink)]`}
              style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}
            >
              {WORK.heading}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed sm:text-lg">
              {WORK.lead}
            </p>
          </Reveal>

          <div className="pro-ledger mt-14">
            {PROJECTS.map((project, i) => {
              const index = String(i + 1).padStart(2, "0");
              const external = project.href.startsWith("http");
              const cue = project.href.includes("github.com")
                ? "View repo"
                : "Visit site";
              const linkProps = {
                href: project.href,
                target: external ? "_blank" : undefined,
                rel: external ? "noopener noreferrer" : undefined,
              };

              if (project.featured) {
                return (
                  <a
                    key={project.title}
                    {...linkProps}
                    className="pro-feature pro-card group relative mb-10 block rounded-lg border p-7 backdrop-blur-md transition-colors duration-300 hover:border-[color:var(--pro-ink)] focus:outline-none focus-visible:ring-2 sm:p-10"
                    style={{
                      borderColor: "var(--pro-line)",
                      backgroundColor: "var(--pro-panel)",
                    }}
                  >
                    {/* Ink sheen that follows the cursor (position from JS vars). */}
                    <span aria-hidden className="pro-card-sheen" />

                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
                      <div className="flex items-baseline gap-5">
                        <span
                          className={`${MONO} text-[11px] tracking-[0.3em] text-[color:var(--pro-muted)]`}
                        >
                          {index}
                        </span>
                        <h3
                          className={`${DISPLAY} text-[2.2rem] leading-none text-[color:var(--pro-ink)] sm:text-[2.9rem]`}
                        >
                          {project.title}
                        </h3>
                      </div>
                      <span
                        className={`${MONO} text-[10px] uppercase tracking-[0.26em]`}
                        style={{ color: "var(--pro-accent)" }}
                      >
                        Featured
                      </span>
                    </div>

                    <div className="mt-9 grid gap-8 md:grid-cols-2 md:gap-12">
                      <div>
                        <span
                          className={`${MONO} text-[10px] uppercase tracking-[0.26em] text-[color:var(--pro-muted)]`}
                        >
                          Problem
                        </span>
                        <p className="mt-3 text-[14.5px] leading-relaxed">
                          {project.problem}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`${MONO} text-[10px] uppercase tracking-[0.26em]`}
                          style={{ color: "var(--pro-accent)" }}
                        >
                          Optimized
                        </span>
                        <p className="mt-3 text-[14.5px] leading-relaxed text-[color:var(--pro-ink)]">
                          {project.optimized}
                        </p>
                      </div>
                    </div>

                    <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
                      <ul className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <li
                            key={tag}
                            className={`${MONO} rounded-full border px-3 py-1 text-[10.5px] uppercase tracking-[0.16em] text-[color:var(--pro-muted)]`}
                            style={{ borderColor: "var(--pro-line)" }}
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                      <span
                        className={`${MONO} text-[11px] uppercase tracking-[0.2em] text-[color:var(--pro-ink)] opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
                      >
                        {cue} &#8599;
                      </span>
                    </div>
                  </a>
                );
              }

              return (
                <a
                  key={project.title}
                  {...linkProps}
                  className="pro-row group grid grid-cols-1 gap-x-8 gap-y-3 px-1 py-7 focus:outline-none focus-visible:ring-2 sm:grid-cols-[3rem_minmax(0,0.75fr)_minmax(0,1.6fr)_auto] sm:items-baseline sm:px-4"
                >
                  <span
                    className={`${MONO} pro-row-index text-[11px] tracking-[0.3em] text-[color:var(--pro-muted)]`}
                  >
                    {index}
                  </span>

                  <div>
                    <h3
                      className={`${DISPLAY} text-[1.5rem] leading-none text-[color:var(--pro-ink)]`}
                    >
                      {project.title}
                    </h3>
                    <span
                      className={`${MONO} mt-2 block text-[10px] uppercase tracking-[0.2em] text-[color:var(--pro-muted)]`}
                    >
                      {project.tags.slice(0, 2).join("  ·  ")}
                    </span>
                  </div>

                  <div className="max-w-2xl">
                    <p className="text-[13.5px] leading-relaxed text-[color:var(--pro-muted)]">
                      {project.problem}
                    </p>
                    <p className="mt-2 flex gap-2 text-[14px] leading-relaxed text-[color:var(--pro-ink)]">
                      <span aria-hidden style={{ color: "var(--pro-accent)" }}>
                        &rarr;
                      </span>
                      <span>{project.optimized}</span>
                    </p>
                  </div>

                  <span
                    className={`${MONO} whitespace-nowrap text-[10.5px] uppercase tracking-[0.2em] text-[color:var(--pro-ink)] opacity-55 transition-opacity duration-300 group-hover:opacity-100`}
                  >
                    {cue} &#8599;
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        {/* ---- Links ------------------------------------------------------- */}
        <section className="py-24 sm:py-32">
          <Reveal>
            <SectionLabel index="04" title="Elsewhere" />
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
