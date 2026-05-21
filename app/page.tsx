"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SectionTransition from "@/components/SectionTransition";
import IntroVideo from "@/components/IntroVideo";
import HomePage from "@/components/HomePage";
import ProjectsPage from "@/components/ProjectsPage";
import OrganizationsPage from "@/components/OrganizationsPage";
import FunPage from "@/components/FunPage";
import type { Direction, SubView, View } from "@/lib/sections";
import { RETURN_TO_KEY } from "@/lib/projects";

const INTRO_STORAGE_KEY = "intro-seen";

export default function Page() {
  const [view, setView] = useState<View | null>(null);
  const [direction, setDirection] = useState<Direction>("forward");
  const hasMounted = useRef(false);

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    try {
      const returnTo = sessionStorage.getItem(RETURN_TO_KEY);
      if (returnTo === "projects") {
        sessionStorage.removeItem(RETURN_TO_KEY);
        setView("projects");
        return;
      }
      if (sessionStorage.getItem(INTRO_STORAGE_KEY) === "1") {
        setView("home");
        return;
      }
    } catch {
      // sessionStorage may throw in privacy modes; ignore.
    }
    setView("intro");
  }, []);

  const completeIntro = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setDirection("forward");
    setView("home");
  }, []);

  const goToSubView = useCallback((sub: SubView) => {
    setDirection("forward");
    setView(sub);
  }, []);

  const goHome = useCallback(() => {
    setDirection("back");
    setView("home");
  }, []);

  if (view === null) {
    return <div className="h-screen w-screen bg-black" />;
  }

  if (view === "intro") {
    return <IntroVideo onComplete={completeIntro} />;
  }

  return (
    <SectionTransition viewKey={view} direction={direction}>
      {view === "home" && <HomePage onNavigate={goToSubView} />}
      {view === "projects" && <ProjectsPage onBack={goHome} />}
      {view === "organizations" && <OrganizationsPage onBack={goHome} />}
      {view === "fun" && <FunPage onBack={goHome} />}
    </SectionTransition>
  );
}
