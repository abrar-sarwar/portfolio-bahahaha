// Config for the /professional page. Real content, config-driven so it stays
// easy to edit. Copy intentionally avoids em dashes and en dashes.

// ---- Hero / intro --------------------------------------------------------
export const PROFILE = {
  name: "Abrar Sarwar",
  oneLiner:
    "Security minded software engineer building systems that actually solve problems.",
  intro:
    "I am a CS and cybersecurity engineer from Atlanta who likes turning messy problems into clean, reliable systems. I have been at this since I was the kid running the Minecraft LAN server and fixing the TV when it cut out, and these days I build detection engines, security automation, and full stack tools. Long term I want to be a solutions architect, designing systems that genuinely work for the people using them.",
  kicker: "Professional Profile",
  meta: "Atlanta, Georgia  ·  Open to opportunities",
  // A photo of me, anchored to the bottom right of the hero.
  photo: "/assets/sprites/abrarmainscreen.png",
};

// ---- About / who I am ----------------------------------------------------
export const ABOUT = {
  heading: "Who I am",
  lead: "A fast, human read on where I come from, what I build, and where I am headed.",
  hooks: [
    {
      title: "Background",
      body: "Asian American, born and raised in Georgia in a big, diverse family. I got into computers early as the kid running the Minecraft LAN server and fixing whatever broke at home, and it grew into a real love for CS and security.",
    },
    {
      title: "What I do",
      body: "I build detection and security tooling alongside full stack apps. Recent work spans a C++ network intrusion detection engine, serverless AWS auto response, and OSINT research, usually paired with a clean front end.",
    },
    {
      title: "Where I am headed",
      body: "I want to grow into a solutions architect, designing systems that solve real problems end to end instead of just shipping features. I care about reliability, clarity, and tools people actually enjoy using.",
    },
    {
      title: "Beyond the screen",
      body: "Outside of work I draw, read, hit the gym, game, and spend as much time as I can adventuring and finding weird corners of the world to explore.",
    },
  ],
};

// ---- Projects (professionally styled, separate from the main site) -------
export interface ProProject {
  title: string;
  description: string;
  tags: string[];
  href: string;
  image?: string;
}

export const PROJECTS: ProProject[] = [
  {
    title: "Arkham",
    description:
      "My open source cyber threat intelligence briefing system. It gathers what is moving in the threat landscape and turns it into a briefing I would actually read.",
    tags: ["Threat Intel", "Open Source", "Automation"],
    href: "https://github.com/abrar-sarwar/arkham",
  },
  {
    title: "NetWraith",
    description:
      "A C++ network intrusion detection engine with per source kill chain correlation. It scores every source as traffic moves, so a coordinated attacker surfaces as one rising threat instead of a pile of flat alerts.",
    tags: ["C++", "libpcap", "Detection Engineering", "Next.js"],
    href: "https://github.com/abrar-sarwar/netwraith",
  },
  {
    title: "TripWire",
    description:
      "Serverless AWS detection and automatic response. It watches for high risk events and reverses several of them in under a minute, with no human in the loop.",
    tags: ["AWS", "Lambda", "Security Automation"],
    href: "https://github.com/abrar-sarwar/tripwire",
  },
  {
    title: "Leek",
    description:
      "A living, evidence-driven case file on the CyberLeek campaign leaking Grand Theft Auto VI footage. Every claim is graded by confidence and tied to a source, and the central finding is the one most coverage skipped: how the build was obtained is still unknown.",
    tags: ["OSINT", "Threat Intel", "Research"],
    href: "https://github.com/abrar-sarwar/leek",
  },
  {
    title: "CounterStack",
    description:
      "A NIST security controls card game built at the Hacklanta hackathon, where it won. Security training you actually play.",
    tags: ["Game Design", "Security Education", "Hackathon Winner"],
    href: "https://counterstack.dev",
  },
];

// ---- Links ---------------------------------------------------------------
export interface ProLink {
  label: string;
  href: string;
  kind?: "primary" | "default";
}

export const CALENDLY_URL = "https://calendly.com/abrartsarwar/30min";

export const LINKS: ProLink[] = [
  { label: "Schedule a call", href: CALENDLY_URL, kind: "primary" },
  { label: "GitHub", href: "https://github.com/abrar-sarwar" },
  { label: "LinkedIn", href: "https://linkedin.com/in/abrar-sarwar/" },
  { label: "Email", href: "mailto:abrartsarwar@gmail.com" },
  { label: "ProgSU", href: "https://progsu.org" },
];
