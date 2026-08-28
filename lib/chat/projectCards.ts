// Turns a project slug into a chat card using the data the portfolio already
// has: title/tagline/links/artwork from lib/projects, the short recruiter
// description + tech tags from lib/professional. Nothing is duplicated here.

import {
  PROJECTS,
  PROJECT_ACCENTS,
  type ProjectSlug,
} from "@/lib/projects";
import { PROJECTS as PRO_PROJECTS } from "@/lib/professional";
import type { ChatProjectCard, ChatProjectRef } from "./types";

export function projectCardFromSlug(slug: ProjectSlug): ChatProjectCard | null {
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) return null;
  const pro = PRO_PROJECTS.find(
    (p) => p.title.toLowerCase() === project.title.toLowerCase(),
  );
  const isDemo = project.linkLabel === "demo link";
  return {
    title: project.title,
    tagline: project.tag,
    // The professional page's one-paragraph description is the right length
    // for a card; the main site's write-up is a full essay.
    description: pro?.description ?? project.description?.split("\n")[0] ?? "",
    tags: pro?.tags,
    github: !isDemo ? project.repoUrl : undefined,
    demo: isDemo ? project.repoUrl : undefined,
    learnMore: `/projects/${project.slug}`,
    image: project.spriteSrc,
    accent: PROJECT_ACCENTS[project.slug],
  };
}

export function resolveProjectCard(ref: ChatProjectRef): ChatProjectCard | null {
  return typeof ref === "string" ? projectCardFromSlug(ref) : ref;
}
