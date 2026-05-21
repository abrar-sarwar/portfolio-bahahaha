"use client";

import BackButton from "./BackButton";
import SpriteSlot from "./SpriteSlot";

type Props = {
  onBack: () => void;
};

type OrgEntry = {
  id: string;
  role: string;
  dates: string;
  logoSrc: string;
};

const PROGSU_ENTRIES: OrgEntry[] = [
  {
    id: "progsu-1",
    role: "[ TODO: progsu entry-1 role ]",
    dates: "[ TODO: dates ]",
    logoSrc: "/assets/sprites/progsu-1-logo.png",
  },
  {
    id: "progsu-2",
    role: "[ TODO: progsu entry-2 role ]",
    dates: "[ TODO: dates ]",
    logoSrc: "/assets/sprites/progsu-2-logo.png",
  },
];

const CYBER_ENTRIES: OrgEntry[] = [
  {
    id: "cyber-1",
    role: "[ TODO: cyber entry-1 role ]",
    dates: "[ TODO: dates ]",
    logoSrc: "/assets/sprites/cyber-1-logo.png",
  },
  {
    id: "cyber-2",
    role: "[ TODO: cyber entry-2 role ]",
    dates: "[ TODO: dates ]",
    logoSrc: "/assets/sprites/cyber-2-logo.png",
  },
];

function OrgEntryCard({ entry }: { entry: OrgEntry }) {
  return (
    <article className="flex gap-4 rounded-xl border border-white/10 bg-black/30 p-4">
      <SpriteSlot
        src={entry.logoSrc}
        alt={`${entry.role} logo`}
        fallbackLabel="Logo"
        className="h-16 w-16 shrink-0 rounded-lg"
      />
      <div className="flex flex-col">
        <h3 className="text-base font-semibold text-white">{entry.role}</h3>
        <p className="text-xs text-white/50">{entry.dates}</p>
        <p className="mt-2 text-sm text-white/60">
          <span className="text-white/40">
            [ TODO: description for {entry.id} ]
          </span>
        </p>
      </div>
    </article>
  );
}

export default function OrganizationsPage({ onBack }: Props) {
  return (
    <main className="flex h-full w-full flex-col overflow-y-auto text-white">
      <BackButton onClick={onBack} />

      <section className="flex-1 bg-progsu px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Organization
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold">ProgSU</h2>
          </header>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* TODO: progsu entry-1, entry-2 */}
            {PROGSU_ENTRIES.map((e) => (
              <OrgEntryCard key={e.id} entry={e} />
            ))}
          </div>
        </div>
      </section>

      <section className="flex-1 bg-cyber px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Organization
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold">
              Cybersecurity Club
            </h2>
          </header>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* TODO: cyber entry-1, entry-2 */}
            {CYBER_ENTRIES.map((e) => (
              <OrgEntryCard key={e.id} entry={e} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
