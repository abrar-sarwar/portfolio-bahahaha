"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import IntroVideo from "@/components/IntroVideo";
import ScrollFeed, { type Panel } from "@/components/ScrollFeed";
import { RETURN_TO_KEY } from "@/lib/projects";

type View = "loading" | "intro" | "feed";

export default function Page() {
  const [view, setView] = useState<View>("loading");
  const [initialPanel, setInitialPanel] = useState<Panel>("home");
  const hasMounted = useRef(false);

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    try {
      const returnTo = sessionStorage.getItem(RETURN_TO_KEY);
      if (returnTo === "projects") {
        sessionStorage.removeItem(RETURN_TO_KEY);
        setInitialPanel("projects");
        setView("feed");
        return;
      }
    } catch {
      // ignore privacy-mode failures
    }
    setView("intro");
  }, []);

  const completeIntro = useCallback(() => {
    try {
      sessionStorage.removeItem("bio-typed");
    } catch {
      // ignore
    }
    setInitialPanel("home");
    setView("feed");
  }, []);

  if (view === "loading") {
    return <div className="h-screen w-screen bg-black" />;
  }
  if (view === "intro") {
    return <IntroVideo onComplete={completeIntro} />;
  }
  return <ScrollFeed initial={initialPanel} />;
}
