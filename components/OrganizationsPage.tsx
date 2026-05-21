"use client";

import BackButton from "./BackButton";

type Props = {
  onBack: () => void;
};

type RoleNote = {
  role: string;
  dates: string;
  note: string;
};

const PROGSU_ROLES: RoleNote[] = [
  {
    role: "Director of Analysis",
    dates: "March 2026 to Present",
    note: "Built a member database tracking 100+ students against participation requirements and shipped executive reporting dashboards covering budget burn, revenue, sponsor pipeline, and expenses. Onboarding to active status time down 35%, event review time down 40%.",
  },
];

const CYBER_ROLES: RoleNote[] = [
  {
    role: "Vice President",
    dates: "December 2025 to Present",
    note: "Run planning for 3+ cybersecurity workshops a semester, coordinating speakers and sustaining 50+ attendees per session. Club engagement up 20% after the leadership transition.",
  },
  {
    role: "NCL Competitor",
    dates: "Spring 2026",
    note: "Top 10% individually (724 of 7,006) and top 6% in team play (224 of 3,638) across OSINT, cryptography, network and log analysis, forensics, web exploitation, and enumeration.",
  },
];

function RoleBlock({ role }: { role: RoleNote }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-white">
        {role.role}
        <span className="ml-2 text-xs font-normal text-white/50">
          {role.dates}
        </span>
      </p>
      <p
        className="text-xs text-white/70"
        style={{ lineHeight: 1.65 }}
      >
        {role.note}
      </p>
    </div>
  );
}

export default function OrganizationsPage({ onBack }: Props) {
  return (
    <main className="flex h-full w-full flex-col overflow-y-auto text-white">
      <BackButton onClick={onBack} />

      <section className="flex-1 bg-progsu px-8 py-16 sm:px-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Organization
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold lowercase">
            progsu
          </h2>
          <p
            className="mt-4 text-sm text-white/80"
            style={{ lineHeight: 1.7 }}
          >
            progsu is the biggest club at Georgia State, with over 1,500
            students and growing. It exists to help students land internships
            and grow into the development world together.
          </p>
          <div className="mt-8 space-y-6">
            {PROGSU_ROLES.map((r) => (
              <RoleBlock key={r.role} role={r} />
            ))}
          </div>
        </div>
      </section>

      <section className="flex-1 bg-cyber px-8 py-16 sm:px-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Organization
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold">
            GSU Cybersecurity Club
          </h2>
          <p
            className="mt-4 text-sm text-white/80"
            style={{ lineHeight: 1.7 }}
          >
            The Cybersecurity Club focuses on what cybersecurity actually looks
            like inside companies. How to handle threats, how to prevent them
            from getting worse, and how to think like both defender and
            attacker.
          </p>
          <div className="mt-8 space-y-6">
            {CYBER_ROLES.map((r) => (
              <RoleBlock key={r.role} role={r} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
