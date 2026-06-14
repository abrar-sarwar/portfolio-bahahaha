"use client";

import { useEffect, useRef } from "react";

// A lightweight canvas starfield that sits behind the globe. Stars are
// placed once on resize; a small subset twinkles via a slow rAF loop. Honors
// prefers-reduced-motion by drawing a single static frame.
type Star = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkle: boolean;
  phase: number;
  speed: number;
};

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;

    const build = () => {
      const parent = canvas.parentElement;
      const rect = parent
        ? parent.getBoundingClientRect()
        : { width: window.innerWidth, height: window.innerHeight };
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Scale star count with area so big screens are not sparse.
      const count = Math.round((width * height) / 1400);
      stars = Array.from({ length: count }, () => {
        const r = Math.random() * 1.1 + 0.25;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r,
          baseAlpha: Math.random() * 0.5 + 0.25,
          twinkle: Math.random() < 0.35,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.9 + 0.4,
        };
      });
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        let alpha = s.baseAlpha;
        if (s.twinkle && !reduceMotion) {
          alpha = s.baseAlpha + Math.sin(t * 0.001 * s.speed + s.phase) * 0.25;
        }
        alpha = Math.max(0, Math.min(1, alpha));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
        // A faint halo on the larger stars for a little depth.
        if (s.r > 1) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.08})`;
          ctx.fill();
        }
      }
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    build();
    if (reduceMotion) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => {
      build();
      if (reduceMotion) draw(0);
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
