"use client";

import type { SubView } from "@/lib/sections";

type Props = {
  onNavigate: (view: SubView) => void;
};

const TILES: { id: SubView; label: string; accent: string }[] = [
  {
    id: "projects",
    label: "Projects",
    accent: "from-cyan-400/40 to-cyan-900/0",
  },
  {
    id: "organizations",
    label: "Organizations",
    accent: "from-fuchsia-400/40 to-fuchsia-900/0",
  },
  {
    id: "fun",
    label: "Fun",
    accent: "from-amber-300/40 to-amber-900/0",
  },
];

export default function HomePage({ onNavigate }: Props) {
  return (
    <main className="h-full w-full overflow-y-auto bg-home text-white">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <header className="mb-16 space-y-4">
          {/* TODO: name */}
          <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight">
            <span className="text-white/40">[ TODO: name ]</span>
          </h1>

          {/* TODO: bio */}
          <p className="max-w-2xl text-base sm:text-lg text-white/70">
            <span className="text-white/40">
              [ TODO: bio — short intro, role, location ]
            </span>
          </p>

          {/* TODO: socials */}
          <ul className="flex flex-wrap gap-4 text-sm text-white/60">
            <li className="text-white/40">
              [ TODO: socials — email / github / linkedin ]
            </li>
          </ul>
        </header>

        <section
          aria-label="Sections"
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {TILES.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => onNavigate(tile.id)}
              className={`group relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${tile.accent} p-6 text-left transition hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
            >
              <span className="absolute top-4 left-4 text-xs uppercase tracking-widest text-white/50">
                Section
              </span>
              <span className="absolute bottom-6 left-6 text-3xl font-semibold tracking-tight">
                {tile.label}
              </span>
              <span className="absolute bottom-6 right-6 text-white/40 transition group-hover:translate-x-1 group-hover:text-white">
                →
              </span>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
