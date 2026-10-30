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
  // Three hard numbers under the hero, for the recruiter who reads for six
  // seconds before deciding whether to read at all. Every one of these is a
  // shipped result, not a self assessment.
  signals: [
    {
      value: "Under 60s",
      label: "from high risk cloud event to automatic rollback, no human in the loop",
    },
    {
      value: "1st place",
      label: "Hacklanta hackathon, built and judged inside one weekend",
    },
    {
      value: "C++",
      label: "intrusion detection engine with per source kill chain correlation",
    },
  ],
  // A photo of me, anchored to the bottom right of the hero.
  photo: "/assets/sprites/abrarmainscreen.png",
};

// ---- About / who I am ----------------------------------------------------
// One statement plus a scannable fact list. The old four card grid said the
// same thing in four times the space.
export const ABOUT = {
  heading: "Who I am",
  lead: "I am Asian American, born and raised in Georgia in a big, diverse family, and I got into computers early as the kid running the Minecraft LAN server and fixing whatever broke at home. That turned into detection and security tooling: a C++ network intrusion detection engine, serverless AWS auto response, OSINT research, usually paired with a front end someone can actually use.",
  closer:
    "What I am working toward is solutions architecture. Not shipping features for their own sake, but designing the whole path from the problem a team keeps hitting to the system that stops it happening.",
  facts: [
    { label: "Based", value: "Atlanta, Georgia" },
    {
      label: "Focus",
      value: "Detection engineering, security automation, full stack",
    },
    { label: "Currently", value: "Building Arkham, NetWraith, and TripWire in the open" },
    { label: "Headed", value: "Solutions architecture" },
    {
      label: "Beyond",
      value: "Drawing, reading, the gym, and finding weird corners of the world",
    },
  ],
};

// ---- How I work under pressure -------------------------------------------
// The differentiator for a recruiter: three operating principles, each one
// backed by something that actually shipped rather than a self assessment.
export interface Principle {
  claim: string;
  body: string;
  receipt: string;
  source: string;
}

export const PRESSURE = {
  heading: "How I work when it goes wrong",
  lead: "Anyone looks good on a quiet day. This is how I operate when the clock is short, the signal is noisy, and nobody has the answer yet.",
  principles: [
    {
      claim: "Rank the noise before touching anything",
      body: "Under pressure the easy mistake is chasing whatever is loudest. I would rather spend the first few minutes deciding what actually matters than spend the next hour undoing the wrong fix.",
      receipt:
        "NetWraith scores every source as traffic moves, so a coordinated attacker surfaces as one rising threat instead of a pile of flat, equal alerts.",
      source: "NetWraith",
    },
    {
      claim: "Decide the response before the incident",
      body: "The calmest moment in an incident is the one you already planned for. If a failure is predictable, the reaction to it belongs in code, not in somebody's head at two in the morning.",
      receipt:
        "TripWire watches for high risk events in AWS and reverses several of them in under a minute, with no human in the loop.",
      source: "TripWire",
    },
    {
      claim: "Cut scope, never quality, when the clock is real",
      body: "A deadline is a design constraint like any other. I decide early what the thing has to do to be worth anything, ship exactly that, and leave the rest legible enough to finish later.",
      receipt:
        "CounterStack went from an idea to a played, judged game inside one hackathon weekend at Hacklanta, and won it.",
      source: "CounterStack",
    },
  ] as Principle[],
  closer:
    "And when I do not know something, I say so. In Leek, every claim is graded by confidence and tied to a source, and the headline finding is the part most coverage skipped: how the build was obtained is still unknown. A clearly marked unknown is worth more to a team than a confident guess.",
};

// ---- Projects (professionally styled, separate from the main site) -------
// Framed as optimization: the problem that existed, and what the work made
// measurably better. Order is the reading order on the page, featured first.
export const WORK = {
  heading: "Problems, and what changed",
  lead: "Every build below is framed the way I actually think about work: what was broken before it existed, and what measurably improved once it did.",
};

export interface ProProject {
  title: string;
  description: string;
  problem: string;
  optimized: string;
  tags: string[];
  href: string;
  featured?: boolean;
  image?: string;
}

export const PROJECTS: ProProject[] = [
  {
    title: "NetWraith",
    description:
      "A C++ network intrusion detection engine with per source kill chain correlation. It scores every source as traffic moves, so a coordinated attacker surfaces as one rising threat instead of a pile of flat alerts.",
    problem:
      "A flat alert stream hides the one attacker patiently working through the kill chain. Everything arrives at the same priority, so triage becomes guesswork.",
    optimized:
      "Correlation per source, scored live as packets move. One coordinated attacker now reads as a single rising threat instead of fifty unrelated lines nobody has time to join up.",
    tags: ["C++", "libpcap", "Detection Engineering", "Next.js"],
    href: "https://github.com/abrar-sarwar/netwraith",
    featured: true,
  },
  {
    title: "TripWire",
    description:
      "Serverless AWS detection and automatic response. It watches for high risk events and reverses several of them in under a minute, with no human in the loop.",
    problem:
      "A risky cloud change sits live for as long as it takes a person to read the alert, understand it, and decide what to undo.",
    optimized:
      "Detection and rollback in one loop. Several high risk event types are reversed in under a minute, with no human in the loop and no pager at two in the morning.",
    tags: ["AWS", "Lambda", "Security Automation"],
    href: "https://github.com/abrar-sarwar/tripwire",
  },
  {
    title: "Arkham",
    description:
      "My open source cyber threat intelligence briefing system. It gathers what is moving in the threat landscape and turns it into a briefing I would actually read.",
    problem:
      "Threat feeds produce far more reading than any team finishes, so the important item gets buried under the merely recent.",
    optimized:
      "The landscape is gathered automatically and cut down to a briefing short enough to actually get read, which is the only length that changes anyone's day.",
    tags: ["Threat Intel", "Open Source", "Automation"],
    href: "https://github.com/abrar-sarwar/arkham",
  },
  {
    title: "Leek",
    description:
      "A living, evidence-driven case file on the CyberLeek campaign leaking Grand Theft Auto VI footage. Every claim is graded by confidence and tied to a source, and the central finding is the one most coverage skipped: how the build was obtained is still unknown.",
    problem:
      "Fast coverage of a breach quietly promotes speculation into fact, and the gaps in the story disappear first.",
    optimized:
      "Every claim carries a confidence grade and a source, which surfaced the finding most coverage skipped: how the build was obtained is still unknown.",
    tags: ["OSINT", "Threat Intel", "Research"],
    href: "https://github.com/abrar-sarwar/leek",
  },
  {
    title: "CounterStack",
    description:
      "A NIST security controls card game built at the Hacklanta hackathon, where it won. Security training you actually play.",
    problem:
      "NIST controls training is dry enough that people sit through it and retain close to nothing.",
    optimized:
      "The controls became a card game people choose to play, designed, built, and judged inside a single hackathon weekend, where it won.",
    tags: ["Game Design", "Security Education", "Hackathon Winner"],
    href: "https://counterstack.dev",
  },
  {
    title: "Bump",
    description:
      "An iOS app from HackGT 13 that gives two people standing near each other something real to say first. Tap phones, confirm the connection, and Bump reveals the specific interests you actually share.",
    problem:
      "Two people can share the one interest that would start a ten minute conversation and still walk past each other, because a stranger gives you no context to open with.",
    optimized:
      "A bump gesture, confirmed on both phones, exchanges approved profiles and surfaces the distinctive overlap with grounded openers. AI phrases the match; it never invents it.",
    tags: ["Swift", "SwiftUI", "Ultra Wideband", "Hackathon"],
    href: "https://github.com/bump-hackgt/bump",
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
