export type ProjectSlug = "counterstack" | "tripwire" | "glint";

export type Project = {
  slug: ProjectSlug;
  title: string;
  tag: string;
  description: string;
  spriteSrc: string;
  linkLabel: "demo link" | "github link";
};

export const PROJECTS: Project[] = [
  {
    slug: "counterstack",
    title: "CounterStack",
    tag: "Hacklanta Hackathon Winner",
    description:
      "Built a full stack app in 12 hours that consolidates three SIEM sources into a PostgreSQL backbone, maps NIST CSF assessment data to an AI generated security posture score using Gemini, and visualizes risk as a 4 card poker hand covering resilience, recovery, and technical controls.",
    spriteSrc: "/assets/sprites/counterstack.png",
    linkLabel: "demo link",
  },
  {
    slug: "tripwire",
    title: "TripWire",
    tag: "Serverless AWS Detection and Auto Response",
    description:
      "A serverless AWS pipeline using CloudTrail, EventBridge, and Lambda that detects 5 high risk control plane events across IAM, S3, and EC2 in seconds, mapped to MITRE ATT&CK. Python boto3 remediation Lambdas auto revert public S3 buckets, open security group rules, and unrestricted IAM policies in under 10 seconds.",
    spriteSrc: "/assets/sprites/tripwire.png",
    linkLabel: "github link",
  },
  {
    slug: "glint",
    title: "GLINT",
    tag: "ShinyHunters OSINT Research",
    description:
      "OSINT research project on the ShinyHunters threat cluster across 3 major campaigns (UNC5537, UNC6395, 2026 Canvas extortion). Every claim cited to Mandiant, vendor disclosures, or major news reporting.",
    spriteSrc: "/assets/sprites/glint.png",
    linkLabel: "github link",
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export const RETURN_TO_KEY = "returnTo";
