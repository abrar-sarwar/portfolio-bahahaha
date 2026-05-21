"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SectionTransition from "@/components/SectionTransition";
import IntroVideo from "@/components/IntroVideo";
import HomePage from "@/components/HomePage";
import ProjectsPage from "@/components/ProjectsPage";
import OrganizationsPage from "@/components/OrganizationsPage";
import FunPage from "@/components/FunPage";
import type { Direction, SubView, View } from "@/lib/sections";

const INTRO_STORAGE_KEY = "intro-seen";

export default function Page() {
  const [view, setView] = useState<View>("intro");
  const [direction, setDirection] = useState<Direction>("forward");
  const hasMounted = useRef(false);

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    try {
      if (sessionStorage.getItem(INTRO_STORAGE_KEY) === "1") {
        setView("home");
      }
    } catch {
      // sessionStorage may throw in privacy modes; ignore.
    }
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

  const renderView = () => {
    switch (view) {
      case "intro":
        return <IntroVideo onComplete={completeIntro} />;
      case "home":
        return <HomePage onNavigate={goToSubView} />;
      case "projects":
        return <ProjectsPage onBack={goHome} />;
      case "organizations":
        return <OrganizationsPage onBack={goHome} />;
      case "fun":
        return <FunPage onBack={goHome} />;
    }
  };

  if (view === "intro") {
    return renderView();
  }

  return (
    <SectionTransition viewKey={view} direction={direction}>
      {renderView()}
    </SectionTransition>
  );
}
