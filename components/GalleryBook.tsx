"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { codeService } from "@/features/adventure/services/codeService";
import { GALLERY_KEY } from "@/features/adventure/config";
import { loadSave } from "@/features/adventure/state/save";

export default function GalleryBook() {
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [denied, setDenied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    try {
      setUnlocked(window.localStorage.getItem(GALLERY_KEY) === "true");
    } catch {
      // Storage-denied browsers can still unlock for the current page view.
    }
    setCompleted(loadSave().gameCompleted);
    setMounted(true);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (checking) return;
    setChecking(true);
    const valid = await codeService.validate(code);
    setChecking(false);
    if (valid) {
      setDenied(false);
      setUnlocked(true);
      try {
        window.localStorage.setItem(GALLERY_KEY, "true");
      } catch {
        // Keep the in-memory unlock even when persistence is unavailable.
      }
    } else {
      setDenied(false);
      window.requestAnimationFrame(() => setDenied(true));
    }
  };

  return (
    <main className={`gallery-archive relative grid h-svh w-screen place-items-center overflow-hidden px-5 py-8 transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}>
      <div className="gallery-catalog-mark" aria-hidden>
        LOST / 01
      </div>
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center">
        <div className="mb-7 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.46em] text-violet-200/45">Restricted collection</p>
          <h1 className="mt-2 font-[Georgia,serif] text-3xl italic tracking-[-0.03em] text-[#d7d9e0] sm:text-5xl">The Archive</h1>
        </div>

        <div className={`gallery-book ${unlocked ? "gallery-book--open" : ""}`}>
          <div className="gallery-pages" aria-hidden />
          <section className="gallery-inside" aria-live="polite">
            <div className="gallery-page-rule" />
            <div className="text-[9px] uppercase tracking-[0.38em] text-[#8f7a55]">Recovered leaf</div>
            <h2 className="mt-4 font-[Georgia,serif] text-2xl italic text-[#33261a] sm:text-3xl">The Lost Chapter</h2>
            <div className="mx-auto my-6 h-px w-24 bg-[#8f7a55]/35" />
            <p className="font-mono text-[11px] leading-6 text-[#4a3524] sm:text-xs">
              {"// the lost chapter will be restored here soon"}
            </p>
            <Link href="/" className="mt-8 inline-block border-b border-[#8f7a55]/45 pb-1 font-mono text-[9px] uppercase tracking-[0.28em] text-[#6f4326] transition hover:border-[#6f4326] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6cf0]">
              Return home
            </Link>
          </section>

          <div className={`gallery-cover ${denied ? "gallery-cover--denied" : ""}`}>
            <div className="gallery-cover-noise" aria-hidden />
            <div className="gallery-spine" aria-hidden />
            <div className="gallery-cover-frame">
              <div className="font-mono text-[8px] uppercase tracking-[0.42em] text-violet-100/35">A.S. / Restricted</div>
              <div className="mt-8 font-[Georgia,serif] text-3xl italic leading-none text-[#d7d9e0] sm:text-4xl">The Lost<br />Chapter</div>
              <div className="mt-5 h-px w-16 bg-[#ffd75e]/35" />
            </div>
            <div className="gallery-clasp" aria-hidden>
              <span className="gallery-keyhole" />
            </div>

            <form onSubmit={(event) => void submit(event)} className="gallery-code-strip">
              <label htmlFor="archive-code" className="font-mono text-[8px] uppercase tracking-[0.34em] text-violet-100/45">
                Archive code
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="archive-code"
                  value={code}
                  onChange={(event) => {
                    setDenied(false);
                    setCode(event.target.value.toUpperCase());
                  }}
                  maxLength={8}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="XXX-XXXX"
                  aria-describedby="archive-status"
                  className="min-w-0 flex-1 border border-violet-200/20 bg-black/35 px-3 py-2 font-mono text-xs uppercase tracking-[0.22em] text-white outline-none placeholder:text-white/20 focus:border-[#ffd75e]/60 focus:ring-1 focus:ring-[#ffd75e]/30"
                />
                <button type="submit" disabled={checking || code.length === 0} className="border border-[#ffd75e]/35 px-3 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#ffd75e] transition hover:bg-[#ffd75e]/10 disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd75e]">
                  {checking ? "..." : "Unlock"}
                </button>
              </div>
              <div id="archive-status" className={`mt-2 min-h-4 font-mono text-[9px] uppercase tracking-[0.28em] ${denied ? "text-[#ef4444]" : "text-white/25"}`}>
                {denied ? "Access denied" : "Clasp authentication required"}
              </div>
            </form>
          </div>
        </div>

        {!unlocked && (
          <div className="mt-8 text-center font-mono text-[10px] leading-5 text-white/35">
            {completed ? (
              <p>You&apos;ve already recovered the code. Check the chest.</p>
            ) : (
              <Link href="/adventure" className="text-violet-200/55 transition hover:text-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
                🗝 there is another way in →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
