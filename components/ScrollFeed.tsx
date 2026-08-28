"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HomePage from "./HomePage";
import ProjectsPage from "./ProjectsPage";
import GallerySection from "./gallery/GallerySection";
import FunPage from "./FunPage";
import { ChatProvider } from "./chat/ChatContext";
import ChatSection from "./chat/ChatSection";
import type { SubView } from "@/lib/sections";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type Panel =
  | "home"
  | "projects"
  | "gallery"
  | "fun"
  | "chat";

// Order of the feed: Main -> Projects -> Gallery -> Fun -> Chat. My
// World lives on its own /myworld route, not in this feed. To slot a new
// section in later, add it here and drop a matching panel <section> in the same
// position below.
const PANEL_INDEX: Record<Panel, number> = {
  home: 0,
  projects: 1,
  gallery: 2,
  fun: 3,
  chat: 4,
};

function isPanel(value: string): value is Panel {
  return value in PANEL_INDEX;
}

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
  // into a smooth scroll instead of a page-level view switch. My World is its
  // own route, so it never resolves to a feed panel; HomePage routes there
  // directly. Everything else scrolls within the feed. There is no back button
  // in the feed panels — you simply scroll back up to home.
  const handleNavigate = (view: SubView) => {
    if (view === "myworld") return;
    scrollToPanel(view);
  };
  // Used only by the single end-of-feed CTA at the very bottom of the Chat panel.
  const handleBackToTop = () => scrollToPanel("home");
  // Links inside the chat ("#projects") scroll the feed too.
  const handleChatNavigate = (panel: string) => {
    if (isPanel(panel)) scrollToPanel(panel);
  };

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

        // Gallery opts out of the shared fade + parallax: its collage is sized
        // to fill the screen exactly, so a yPercent shift would push the bottom
        // row out of view, and it runs its own entrance once it is on screen.
        if (panel.dataset.feedParallax === "off") return;

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
    <ChatProvider onNavigate={handleChatNavigate}>
    <div
      ref={rootRef}
      className="relative h-svh w-screen overflow-hidden bg-black"
    >
      <div
        ref={scrollerRef}
        // data-scroll-root lets nested sections (Gallery) find the real
        // scrolling element for their own ScrollTriggers and scroll locking,
        // without threading a ref down through the tree.
        data-scroll-root
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
            <ProjectsPage />
          </div>
        </section>

        {/* Gallery — one viewport like the others, but opted out of the shared
            fade/parallax: its collage is sized to fill the screen exactly, so a
            panel-level yPercent shift would push photos off the bottom, and it
            runs its own timed intro once the panel is actually on screen. */}
        <section
          data-feed-parallax="off"
          className="scroll-feed-panel relative h-full w-full overflow-hidden"
        >
          <div className="scroll-feed-inner relative h-full w-full">
            <GallerySection />
          </div>
        </section>

        <section className="scroll-feed-panel relative h-full w-full overflow-hidden max-sm:h-auto max-sm:min-h-svh max-sm:overflow-visible">
          <div className="scroll-feed-inner relative h-full w-full will-change-transform max-sm:h-auto max-sm:min-h-svh max-sm:will-change-auto">
            <FunPage />
          </div>
        </section>

        {/* Chat — the last panel, and the only place the chat lives: portrait
            bottom-left, the latest reply staged in the middle, the input box at
            the bottom. The end-of-feed "Back to top" CTA sits in its header. */}
        <section className="scroll-feed-panel relative h-full w-full overflow-hidden max-sm:h-auto max-sm:min-h-svh max-sm:overflow-visible">
          <div className="scroll-feed-inner relative h-full w-full will-change-transform max-sm:h-auto max-sm:min-h-svh max-sm:will-change-auto">
            <ChatSection onBackToTop={handleBackToTop} />
          </div>
        </section>
      </div>
    </div>
    </ChatProvider>
  );
}
