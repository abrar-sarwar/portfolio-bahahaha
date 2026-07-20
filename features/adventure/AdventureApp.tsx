"use client";

import { useEffect, useRef } from "react";
import Overlay from "./ui/Overlay";
import { teardownCombat } from "./combat/controller";

export default function AdventureApp() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { buildConfig } = await import("./game");
      const { default: Phaser } = await import("phaser");
      if (cancelled || gameRef.current || !hostRef.current) return;
      gameRef.current = new Phaser.Game(buildConfig(hostRef.current));
    })();
    return () => {
      cancelled = true;
      // Tear down the combat controller BEFORE destroying the Phaser game:
      // this cancels any pending force-fail timer and nulls the controller's
      // game reference, so nothing can dispatch into (or call scene methods
      // on) a game that's mid-destroy.
      teardownCombat();
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-svh w-screen overflow-hidden bg-black">
      <div ref={hostRef} className="absolute inset-0" />
      <Overlay />
    </div>
  );
}
