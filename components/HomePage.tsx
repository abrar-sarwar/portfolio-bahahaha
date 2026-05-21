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

      <div className="relative z-10 mx-auto flex min-h-full max-w-3xl flex-col px-6 py-16 sm:py-24">
        <header className="space-y-5">
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight">
            Abrar Tahir Sarwar
          </h1>

          <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-white/80">
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

          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
            {SOCIALS.map((s) => (
              <li key={s.label}>
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
          className="mt-16 flex flex-col items-start gap-4 sm:mt-24"
        >
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {MAIN_TILES.map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => onNavigate(tile.id)}
                className="group flex items-center justify-between rounded-lg border border-white/15 bg-white/[0.03] px-5 py-4 text-left transition hover:border-violet-400/60 hover:bg-violet-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <span className="text-lg font-medium tracking-tight">
                  {tile.label}
                </span>
                <span className="text-white/40 transition group-hover:translate-x-1 group-hover:text-violet-200">
                  →
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onNavigate("fun")}
            className="text-xs uppercase tracking-[0.3em] text-white/40 transition hover:text-violet-300 focus:outline-none focus-visible:text-violet-300"
          >
            · fun ·
          </button>
        </section>
      </div>
    </main>
  );
}
