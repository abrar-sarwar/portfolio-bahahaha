"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import HomePage from "./HomePage";
import ProjectsPage from "./ProjectsPage";
import OrganizationsPage from "./OrganizationsPage";
import FunPage from "./FunPage";
import type { SubView } from "@/lib/sections";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type Panel = "home" | "projects" | "organizations" | "fun";

const PANEL_INDEX: Record<Panel, number> = {
  home: 0,
  projects: 1,
  organizations: 2,
  fun: 3,
};

type Props = {
  initial?: Panel;
};

export default function ScrollFeed({ initial = "home" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollToPanel = (panel: Panel) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    // Scroll to the panel's actual offset rather than index * viewport height.
    // On desktop every panel is exactly one viewport tall so the two are
    // equivalent, but on mobile panels grow to fit their content, so we must
    // use the real laid-out position.
    const panels = scroller.querySelectorAll<HTMLElement>(".scroll-feed-panel");
    const target = panels[PANEL_INDEX[panel]];
    if (!target) return;
    scroller.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  };

  // HomePage's nav + the SCROLL arrow call onNavigate(view); we route that
  // into a smooth scroll instead of a page-level view switch. BackButton
  // inside any section calls onBack → smooth scroll back to the home panel.
  const handleNavigate = (view: SubView) => scrollToPanel(view);
  const handleBackToTop = () => scrollToPanel("home");

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    // Jump to the initial panel without animation, before triggers register.
    const initialEl = scroller.querySelectorAll<HTMLElement>(
      ".scroll-feed-panel",
    )[PANEL_INDEX[initial]];
    if (initialEl) scroller.scrollTop = initialEl.offsetTop;

    // On phones we drop the GSAP scroll-pinning + parallax entirely: each
    // panel grows to fit its content and the page scrolls naturally. Running
    // the desktop triggers here would fade panels out (autoAlpha: 0) and clip
    // the taller mobile layouts, so we bail before registering them.
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches;
    if (isMobile) return;

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".scroll-feed-panel");

      panels.forEach((panel, i) => {
        const inner = panel.querySelector<HTMLElement>(".scroll-feed-inner");
        if (!inner) return;

        // Panels other than the initial one start hidden — they fade in as
        // scroll brings them into view.
        if (i !== PANEL_INDEX[initial]) gsap.set(inner, { autoAlpha: 0, y: 60 });

        gsap.to(inner, {
          autoAlpha: 1,
          y: 0,
          ease: "power3.out",
          scrollTrigger: {
            scroller,
            trigger: panel,
            start: "top 75%",
            end: "top 25%",
            scrub: 0.6,
          },
        });

        gsap.fromTo(
          inner,
          { yPercent: 0 },
          {
            yPercent: -6,
            ease: "none",
            scrollTrigger: {
              scroller,
              trigger: panel,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });

      ScrollTrigger.refresh();
    }, rootRef);

    return () => ctx.revert();
  }, [initial]);

  return (
    <div
      ref={rootRef}
      className="relative h-svh w-screen overflow-hidden bg-black"
    >
      <div
        ref={scrollerRef}
        className="relative h-full w-full overflow-y-auto overflow-x-hidden"
        style={{ scrollBehavior: "smooth" }}
      >
        <section className="scroll-feed-panel relative h-full w-full overflow-hidden max-sm:h-auto max-sm:min-h-svh max-sm:overflow-visible">
          <div className="scroll-feed-inner relative h-full w-full will-change-transform max-sm:h-auto max-sm:min-h-svh max-sm:will-change-auto">
            <HomePage onNavigate={handleNavigate} />
          </div>
        </section>

        <section className="scroll-feed-panel relative h-full w-full overflow-hidden max-sm:h-auto max-sm:min-h-svh max-sm:overflow-visible">
          <div className="scroll-feed-inner relative h-full w-full will-change-transform max-sm:h-auto max-sm:min-h-svh max-sm:will-change-auto">
            <ProjectsPage onBack={handleBackToTop} />
          </div>
        </section>

        <section className="scroll-feed-panel relative h-full w-full overflow-hidden max-sm:h-auto max-sm:min-h-svh max-sm:overflow-visible">
          <div className="scroll-feed-inner relative h-full w-full will-change-transform max-sm:h-auto max-sm:min-h-svh max-sm:will-change-auto">
            <OrganizationsPage onBack={handleBackToTop} />
          </div>
        </section>

        <section className="scroll-feed-panel relative h-full w-full overflow-hidden max-sm:h-auto max-sm:min-h-svh max-sm:overflow-visible">
          <div className="scroll-feed-inner relative h-full w-full will-change-transform max-sm:h-auto max-sm:min-h-svh max-sm:will-change-auto">
            <FunPage onBack={handleBackToTop} />

            {/* End-of-feed CTA — sits inside the Fun panel's wrapper so it
                fades in with the panel. Click smooth-scrolls back to home.
                The wrapper handles the horizontal centering (left:50% +
                translateX(-50%)) because framer-motion controls `transform`
                on motion.button directly and would clobber a Tailwind
                translate utility. */}
            <div className="pointer-events-none absolute bottom-6 left-1/2 z-40 -translate-x-1/2 sm:bottom-8">
              <motion.button
                type="button"
                onClick={handleBackToTop}
                aria-label="Back to main page"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.4,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                className="pointer-events-auto flex cursor-pointer flex-col items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
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
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    color: "#c4b5fd",
                    filter: "drop-shadow(0 0 8px rgba(167,139,250,0.7))",
                  }}
                >
                  <path d="M6 15l6-6 6 6" />
                </motion.svg>
                <span
                  className="text-[10px] font-medium uppercase tracking-[0.32em]"
                  style={{
                    color: "rgba(255,255,255,0.78)",
                    textShadow: "0 0 10px rgba(167,139,250,0.55)",
                  }}
                >
                  Back to top
                </span>
              </motion.button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
