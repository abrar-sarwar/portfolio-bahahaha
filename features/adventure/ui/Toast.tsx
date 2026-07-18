"use client";

import { useEffect, useRef, useState } from "react";
import { bus } from "../bridge/EventBus";
import { buffName } from "./hudMath";

const TOAST_MS = 1500;

// Transient "buff collected" toast: subscribes to the "buff:collected" bus
// event and shows the named buff in violet for 1.5s. Pointer-events-none so it
// never eats gameplay clicks.
export default function Toast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const off = bus.on("buff:collected", ({ buff }) => {
      setMessage(`${buffName(buff)} acquired`);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), TOAST_MS);
    });
    return () => {
      off();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-30 -translate-x-1/2 font-mono">
      <span className="rounded-sm border border-violet-400/70 bg-black/50 px-2 py-1 text-[10px] uppercase tracking-widest text-violet-200">
        {message}
      </span>
    </div>
  );
}
