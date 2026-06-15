export type ProjectSlug = "netwraith" | "counterstack" | "tripwire" | "glint";

export type Project = {
  slug: ProjectSlug;
  title: string;
  tag: string;
  description: string;
  spriteSrc: string;
  backgroundSrc: string;
  linkLabel: "demo link" | "github link";
  // External destination for the clickable title and the Link button.
  repoUrl?: string;
};

// Order here drives the on-screen order (top → bottom in the project list).
export const PROJECTS: Project[] = [
  {
    slug: "netwraith",
    title: "NetWraith",
    tag: "Chain Correlation IDS System",
    description: `I set the background to Dante for NetWraith, and it goes deeper than the name.

Dante shows up to a horde of demons, sighs, and turns the whole thing into a style contest, the harder they swing the higher his rank climbs while he acts mildly bored about it. NetWraith does the same thing to your network, watching the wire packet by packet and scoring every source as it moves, so a lone ping basically gets a participation trophy but a source that chains recon into a scan into an exploit climbs the ranks fast, all the way to SSS when it goes full kill chain. That's when the dashboard hits Devil Trigger and pins the worst offender to the top like a wanted poster. Under the styling it's real correlation work, per-source attack-chain scoring that treats a coordinated attacker as one rising threat instead of a pile of flat alerts. Reading the fight before it lands, looking good doing it.`,
    spriteSrc: "/assets/sprites/netwraitharea.jpg",
    backgroundSrc: "/assets/sprites/netwraitharea.jpg",
    linkLabel: "github link",
    repoUrl: "https://github.com/abrar-sarwar/netwraith",
  },
  {
    slug: "tripwire",
    title: "TripWire",
    tag: "Serverless AWS Detection and Auto Response",
    description: `I set the background to Sukuna for TripWire, and the connection clicks once you see how it works.

Sukuna's whole thing is the domain, where the moment he opens it the space becomes his, every cut lands guaranteed, and the enemy doesn't get a say in what happens next. TripWire runs on the same idea, where the second someone trips one of the five wires, a root login, a bucket going public, a security group thrown open, CloudTrail getting killed, it fires inside seconds and takes control of the response in its own space. Two of those it doesn't just flag, it reverses the attack before the alert even lands, under 60 seconds, no negotiation. You step into the account wrong and the domain is already closed around you. Guaranteed hit, every time, on the defender's terms instead of yours.`,
    spriteSrc: "/assets/sprites/tripwire.jpg",
    backgroundSrc: "/assets/sprites/tripwire.jpg",
    linkLabel: "github link",
    repoUrl: "https://github.com/abrar-sarwar/tripwire",
  },
  {
    slug: "glint",
    title: "GLINT",
    tag: "ShinyHunters OSINT Research",
    description: `I set the background to Chrollo Lucilfer on purpose, and it ties into GLINT more than it looks.

The part I keep coming back to with Chrollo is the notebook, where he studies an ability, documents exactly how it works, and only then uses it, because the knowledge is the weapon, not the raw power. That is the entire model GLINT runs on, where you pick a target, watch how it operates, write everything down with sources, then turn that into detections a defender can use. It maps onto the subject too, since ShinyHunters isn't one guy but a collective moving as one just like the Troupe, which is why I built it as a single-cluster dossier instead of chasing one name. Chrollo treats understanding as the sharpest thing he owns, and I pointed that same instinct the other way, toward catching the thing instead of being it.`,
    spriteSrc: "/assets/sprites/glint.jpg",
    backgroundSrc: "/assets/sprites/glint.jpg",
    linkLabel: "github link",
    repoUrl: "https://github.com/abrar-sarwar/glint",
  },
  {
    slug: "counterstack",
    title: "CounterStack",
    tag: "Hacklanta Hackathon Winner",
    description: `I set the background to Gambit for Counterstack, and it fits almost too well.

Gambit doesn't hit hard on his own, he takes whatever's in front of him, a regular deck of cards, and charges it into something that wins the fight, playing his own game on his own terms. That's exactly what Counterstack does, where we took NIST security controls and turned them into a card game, spades to detect, diamonds to harden, the whole posture played out as a hand you deploy under pressure. Even the AI Adapter boss leans into it, learning from your own defense and turning it back on you, kinetic energy bouncing the other way. We built it at Hacklanta in 12 hours and won, and it won because we stopped treating security training like a lecture and made it a game you actually play.`,
    spriteSrc: "/assets/sprites/counterstack.jpg",
    backgroundSrc: "/assets/sprites/counterstack.jpg",
    linkLabel: "demo link",
    repoUrl: "https://counterstack.dev",
  },
];

export const PROJECTS_MAIN_BACKGROUND = "/assets/sprites/projectsmainpage.jpg";

// Character + click-triggered video per project. Add new slugs here as more
// projects ship — each one can have its own portrait + video pairing.
// `credit` is shown under the video in VideoModal once playback starts.
// `creditLabel` overrides the lead-in verb (default "video made by") — e.g.
// glint's video is an edit, so it reads "edit by ...".
export const PROJECT_CHARACTERS: Record<
  ProjectSlug | "main",
  {
    img: string;
    video: string;
    alt: string;
    credit?: string;
    creditLabel?: string;
    // Optional per-character size multiplier for the portrait (default 1).
    scale?: number;
    // Optional horizontal nudge in px for the desktop portrait (negative = left).
    offsetX?: number;
    // When true, the portrait gets a white outline + Gear 5 idle animation.
    gear5?: boolean;
  }
> = {
  main: {
    img: "/assets/sprites/abrarluffy.png",
    video: "/assets/videos/abrarluffy5.mp4",
    alt: "Abrar as Luffy",
    credit: "itxjoel",
    gear5: true,
  },
  netwraith: {
    img: "/assets/sprites/dantenetwraith.png",
    video: "/assets/videos/netwraithvideo.mp4",
    alt: "Abrar as Dante (NetWraith)",
    scale: 1.15,
    offsetX: -120,
    credit: "dev",
    creditLabel: "edited by",
  },
  tripwire: {
    img: "/assets/sprites/sukuna.png",
    video: "/assets/videos/abrartripwire.mp4",
    alt: "Abrar as Sukuna",
    credit: "unknown",
  },
  glint: {
    img: "/assets/sprites/glintpic.png",
    video: "/assets/videos/abrarglint.mp4",
    alt: "Abrar (GLINT)",
    credit: "_sarah.aep",
    creditLabel: "edit by",
  },
  counterstack: {
    img: "/assets/sprites/abrargambit.png",
    video: "/assets/videos/magicianvideo.mp4",
    alt: "Abrar as Gambit",
    credit: "localcomicsstore",
  },
};

// Per-project accent so the projects view isn't one flat purple. `text` is a
// readable label/title color on the dark background; `glow` is an "r,g,b" triplet
// fed into rgba() for borders, halos, and shadows. "main" is the default
// (unselected) violet.
export type ProjectAccent = { text: string; glow: string };

export const PROJECT_ACCENTS: Record<ProjectSlug | "main", ProjectAccent> = {
  main: { text: "#c4b5fd", glow: "167,139,250" }, // violet (default)
  netwraith: { text: "#ef4444", glow: "153,27,27" }, // dark red
  tripwire: { text: "#ffffff", glow: "229,231,235" }, // white
  glint: { text: "#60a5fa", glow: "30,58,138" }, // dark blue
  counterstack: { text: "#f87171", glow: "220,38,38" }, // red
};

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export const RETURN_TO_KEY = "returnTo";
