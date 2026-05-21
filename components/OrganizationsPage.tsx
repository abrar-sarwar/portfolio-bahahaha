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
  description: string;
  logoSrc: string;
};

const PROGSU_ENTRIES: OrgEntry[] = [
  {
    id: "progsu-director",
    role: "Director of Analysis",
    dates: "March 2026 to Present",
    description:
      "Built a centralized member database tracking 100+ students against participation requirements across events, workshops, and competitions. Automated compliance checks cut onboarding to active status time by 35%.",
    logoSrc: "/assets/sprites/progsu-logo.png",
  },
  {
    id: "progsu-reporting",
    role: "Reporting and Dashboards",
    dates: "March 2026 to Present",
    description:
      "Created reporting workflows and performance dashboards for executive leadership covering budget burn, revenue tracking, sponsor pipeline, and expense categorization. Cut event review and strategic planning time by 40%.",
    logoSrc: "/assets/sprites/progsu-logo.png",
  },
];

const CYBER_ENTRIES: OrgEntry[] = [
  {
    id: "cyber-vp",
    role: "Vice President",
    dates: "December 2025 to Present",
    description:
      "Lead planning of 3+ cybersecurity workshops per semester by coordinating with industry speakers, sustaining 50+ attendees per session and growing club engagement by 20% after the leadership transition.",
    logoSrc: "/assets/sprites/cyber-logo.png",
  },
  {
    id: "cyber-ncl",
    role: "NCL Competitor",
    dates: "Spring 2026",
    description:
      "Ranked top 10% individually (724 of 7,006) and top 6% in team play (224 of 3,638) at NCL Spring 2026. Covered OSINT, cryptography, network and log analysis, forensics, web exploitation, and enumeration.",
    logoSrc: "/assets/sprites/cyber-logo.png",
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
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          {entry.description}
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
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold lowercase">
              progsu
            </h2>
          </header>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              GSU Cybersecurity Club
            </h2>
          </header>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CYBER_ENTRIES.map((e) => (
              <OrgEntryCard key={e.id} entry={e} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
