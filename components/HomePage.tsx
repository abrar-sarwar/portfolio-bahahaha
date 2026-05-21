"use client";

import type { SubView } from "@/lib/sections";

type Props = {
  onNavigate: (view: SubView) => void;
};

const MAIN_TILES: { id: SubView; label: string }[] = [
  { id: "projects", label: "Projects" },
  { id: "organizations", label: "Organizations" },
];

const SOCIALS = [
  { label: "Email", href: "mailto:abrartsarwar@gmail.com", text: "abrartsarwar@gmail.com" },
  { label: "Phone", href: "tel:4703992597", text: "470.399.2597" },
  { label: "LinkedIn", href: "https://linkedin.com/in/abrar-sarwar/", text: "linkedin.com/in/abrar-sarwar" },
  { label: "GitHub", href: "https://github.com/abrar-sarwar", text: "github.com/abrar-sarwar" },
];

function PurpleAura() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: [
          "radial-gradient(60% 40% at 50% 0%, rgba(124, 58, 237, 0.28), transparent 70%)",
          "radial-gradient(60% 40% at 50% 100%, rgba(124, 58, 237, 0.22), transparent 70%)",
          "radial-gradient(40% 60% at 0% 50%, rgba(107, 33, 168, 0.22), transparent 70%)",
          "radial-gradient(40% 60% at 100% 50%, rgba(107, 33, 168, 0.22), transparent 70%)",
        ].join(", "),
        filter: "blur(40px)",
      }}
    />
  );
}

export default function HomePage({ onNavigate }: Props) {
  return (
    <main className="relative h-full w-full overflow-y-auto bg-black text-white">
      <PurpleAura />

      <div className="relative z-10 flex min-h-full max-w-2xl flex-col gap-8 px-8 py-12 text-xs sm:px-12 sm:py-16">
        <header className="space-y-4">
          <h1 className="text-base font-semibold tracking-tight">
            Abrar Tahir Sarwar
          </h1>

          <p
            className="text-xs text-white/75"
            style={{ lineHeight: 1.65 }}
          >
            Hey, I&apos;m Abrar. I&apos;m Asian American, born and raised in
            Georgia in a pretty diverse family. Outside of work I draw, read,
            hit the gym, game, and spend as much time as I can hiking and
            finding weird corners of the world to explore. On the career side,
            I&apos;ve been into CS and cybersecurity since I was the kid setting
            up Minecraft LAN servers for my friends and fixing the TV whenever
            it cut out at home. Long term I want to be a solutions architect,
            building systems that actually solve problems for the people using
            them. If you&apos;ve got hiking spots to share, let&apos;s talk.
          </p>

          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-white/55">
            {SOCIALS.map((s, i) => (
              <li key={s.label} className="flex items-center gap-3">
                {i > 0 && (
                  <span aria-hidden className="text-white/25">
                    ·
                  </span>
                )}
                <a
                  href={s.href}
                  className="hover:text-white focus:outline-none focus-visible:text-white focus-visible:underline"
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noreferrer noopener" : undefined}
                >
                  {s.text}
                </a>
              </li>
            ))}
          </ul>
        </header>

        <div className="flex-1" />

        <section
          aria-label="Sections"
          className="flex flex-col items-start gap-3"
        >
          <div className="flex w-full max-w-sm flex-col gap-2">
            {MAIN_TILES.map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => onNavigate(tile.id)}
                className="group flex w-full items-center justify-between rounded-md border border-white/15 bg-white/[0.03] px-3 py-2 text-left text-xs transition hover:border-violet-400/60 hover:bg-violet-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <span className="font-medium tracking-tight">{tile.label}</span>
                <span className="text-white/40 transition group-hover:translate-x-1 group-hover:text-violet-200">
                  →
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onNavigate("fun")}
            className="text-[10px] uppercase tracking-[0.3em] text-white/40 transition hover:text-violet-300 focus:outline-none focus-visible:text-violet-300"
          >
            · fun ·
          </button>
        </section>
      </div>
    </main>
  );
}
