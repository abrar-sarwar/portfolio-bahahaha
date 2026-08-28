"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  resolveProjectCard,
  type ChatFileMedia,
  type ChatLink,
  type ChatMedia,
  type ChatProjectCard,
  type ChatReply,
  type ChatTerminalMedia,
} from "@/lib/chat";
import { RETURN_TO_KEY } from "@/lib/projects";

type Props = {
  reply: ChatReply;
  onNavigate: (href: string) => boolean;
  /** Re-open a clip in the video popup. */
  onPlayVideo: (src: string) => void;
  reduceMotion: boolean;
};

/**
 * Everything under a reply's text: media, a project card, link pills. Media
 * that fails to load simply disappears, a missing file never breaks a reply.
 */
export default function RichResponse({ reply, onNavigate, onPlayVideo, reduceMotion }: Props) {
  const card = reply.project ? resolveProjectCard(reply.project) : null;
  const media = reply.media ?? [];
  const links = reply.links ?? [];
  if (media.length === 0 && !card && links.length === 0) return null;

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26, delay: 0.14 }}
      className="mt-2.5 flex flex-col gap-2.5"
    >
      {media.map((m, i) => (
        <MediaItem key={i} media={m} reduceMotion={reduceMotion} onPlayVideo={onPlayVideo} />
      ))}
      {card && <ProjectCard card={card} />}
      {links.length > 0 && <LinkRow links={links} onNavigate={onNavigate} />}
    </motion.div>
  );
}

/* ---------------------------------------------------------------- media */

function MediaItem({
  media,
  reduceMotion,
  onPlayVideo,
}: {
  media: ChatMedia;
  reduceMotion: boolean;
  onPlayVideo: (src: string) => void;
}) {
  if (media.type === "terminal") return <TerminalMedia media={media} reduceMotion={reduceMotion} />;
  if (media.type === "video") return <ReplayClip media={media} onPlay={onPlayVideo} />;
  return <ImageMedia media={media} />;
}

function ImageMedia({ media }: { media: ChatFileMedia }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className="chat-media">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.src}
        alt={media.alt ?? ""}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
        className="chat-media-img block select-none"
      />
      {media.caption && <figcaption className="chat-caption">{media.caption}</figcaption>}
    </figure>
  );
}

/**
 * Clips don't embed. They come up in the site's video popup the moment the
 * reply lands, this pill is just the way back in once it has closed.
 */
function ReplayClip({ media, onPlay }: { media: ChatFileMedia; onPlay: (src: string) => void }) {
  return (
    <div>
      <button type="button" className="chat-btn" onClick={() => onPlay(media.src)} aria-label={media.alt ? `play ${media.alt} again` : "play again"}>
        ▶ play again
      </button>
    </div>
  );
}

function TerminalMedia({ media, reduceMotion }: { media: ChatTerminalMedia; reduceMotion: boolean }) {
  const total = media.lines.length;
  const [shown, setShown] = useState(reduceMotion ? total : 0);

  useEffect(() => {
    if (shown >= total) return;
    const id = window.setTimeout(() => setShown((s) => s + 1), shown === 0 ? 180 : 230);
    return () => window.clearTimeout(id);
  }, [shown, total]);

  return (
    <div className="chat-terminal" role="img" aria-label={media.lines.join("\n")}>
      <div className="chat-terminal-bar">
        <span className="chat-terminal-dot" aria-hidden />
        <span>{media.title ?? "terminal"}</span>
      </div>
      <pre aria-hidden>
        {media.lines.slice(0, shown).map((line, i) => (
          <span key={i} className={line.startsWith("$") ? "chat-terminal-cmd" : "chat-terminal-out"}>
            {line}
            {"\n"}
          </span>
        ))}
        {shown < total && <span className="chat-cursor" />}
      </pre>
    </div>
  );
}

/* --------------------------------------------------------- project card */

function ProjectCard({ card }: { card: ChatProjectCard }) {
  const [imageFailed, setImageFailed] = useState(false);
  const accent = card.accent ?? { text: "#c4b5fd", glow: "167,139,250" };
  const rememberReturn = () => {
    try {
      sessionStorage.setItem(RETURN_TO_KEY, "projects");
    } catch {
      // ignore
    }
  };

  return (
    <article
      className="chat-card"
      style={{ ["--chat-accent" as string]: accent.text, ["--chat-glow" as string]: accent.glow }}
    >
      {card.image && !imageFailed && (
        <div className="chat-card-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.image}
            alt={`${card.title} artwork`}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setImageFailed(true)}
          />
        </div>
      )}
      <div className="px-3.5 pb-3.5 pt-3">
        {card.tagline && (
          <p className="text-[9.5px] font-medium uppercase tracking-[0.28em] text-white/40">
            {card.tagline}
          </p>
        )}
        <h4 className="mt-1 text-[17px] font-medium tracking-tight" style={{ color: accent.text }}>
          {card.title}
        </h4>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/70">{card.description}</p>
        {card.tags && card.tags.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="technologies">
            {card.tags.map((t) => (
              <li key={t} className="chat-tag">
                {t}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {card.github && (
            <a className="chat-btn chat-btn--primary" href={card.github} target="_blank" rel="noopener noreferrer">
              github ↗
            </a>
          )}
          {card.demo && (
            <a className="chat-btn chat-btn--primary" href={card.demo} target="_blank" rel="noopener noreferrer">
              live demo ↗
            </a>
          )}
          {card.learnMore && (
            <Link className="chat-btn" href={card.learnMore} onClick={rememberReturn}>
              learn more →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- links */

function LinkRow({ links, onNavigate }: { links: ChatLink[]; onNavigate: (href: string) => boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => {
        if (l.href.startsWith("#")) {
          return (
            <button key={l.href + l.label} type="button" className="chat-btn" onClick={() => onNavigate(l.href)}>
              {l.label} ↑
            </button>
          );
        }
        if (l.href.startsWith("/")) {
          return (
            <Link key={l.href + l.label} className="chat-btn" href={l.href}>
              {l.label} →
            </Link>
          );
        }
        return (
          <a key={l.href + l.label} className="chat-btn" href={l.href} target="_blank" rel="noopener noreferrer">
            {l.label} ↗
          </a>
        );
      })}
    </div>
  );
}
