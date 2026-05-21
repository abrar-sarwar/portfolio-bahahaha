"use client";

import { useEffect, useState } from "react";

const TYPED_KEY = "bio-typed";

type Props = {
  text: string;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function TypingText({
  text,
  speed = 14,
  className,
  style,
}: Props) {
  const [revealed, setRevealed] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      if (sessionStorage.getItem(TYPED_KEY) === "1") return text.length;
    } catch {
      // ignore
    }
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return text.length;
    }
    return 0;
  });

  useEffect(() => {
    if (revealed >= text.length) {
      try {
        sessionStorage.setItem(TYPED_KEY, "1");
      } catch {
        // ignore
      }
      return;
    }
    const id = window.setInterval(() => {
      setRevealed((r) => {
        const next = r + 1;
        if (next >= text.length) {
          window.clearInterval(id);
          try {
            sessionStorage.setItem(TYPED_KEY, "1");
          } catch {
            // ignore
          }
        }
        return next;
      });
    }, speed);
    return () => window.clearInterval(id);
  }, [revealed, text, speed]);

  const isDone = revealed >= text.length;

  return (
    <p className={className} style={style}>
      <span>{text.slice(0, revealed)}</span>
      {!isDone && (
        <span
          aria-hidden
          className="ml-[1px] inline-block w-[1px] -translate-y-[1px] animate-pulse bg-white/70"
          style={{ height: "0.9em" }}
        />
      )}
      <span aria-hidden className="opacity-0">
        {text.slice(revealed)}
      </span>
    </p>
  );
}
