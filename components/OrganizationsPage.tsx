"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import BackButton from "./BackButton";
import SpriteSlot from "./SpriteSlot";
import VideoModal from "./VideoModal";

type Props = {
  onBack: () => void;
};

export default function OrganizationsPage({ onBack }: Props) {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    // overflow-y-auto so very short viewports can still scroll past content;
    // flex-1 on each section splits the available height 50/50 when the page
    // fits the viewport so progsu + cyber are both visible together.
    <main
      className="flex h-full w-full flex-col overflow-y-auto text-white max-sm:h-auto max-sm:overflow-visible"
      style={{ backgroundColor: "#0a0a0f" }}
    >
      <BackButton onClick={onBack} />

      {/* ---------------- progsu (top half) ---------------- */}
      <section className="org-section-progsu flex flex-col justify-center px-6 py-20 sm:flex-1 sm:px-12 sm:py-10 max-sm:min-h-svh">
        <div className="mx-auto w-full max-w-2xl">
          {/* Sprite stays the video trigger; the "progsu" word is now a
              hyperlink out to progsu.com. Wrapped in a `group` so hovering
              either still cues the other (sprite scales, text shifts color),
              matching the original coordinated hover. */}
          <div className="group flex items-center gap-3">
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              aria-label="Play progsu video"
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            >
              <SpriteSlot
                src="/assets/sprites/progsu.png"
                alt="progsu logo"
                fallbackLabel="progsu"
                className="h-11 w-11 shrink-0 rounded-md object-contain transition group-hover:scale-105 sm:h-12 sm:w-12"
              />
            </button>
            <h2 className="text-[22px] font-medium lowercase tracking-tight sm:text-[26px]">
              <a
                href="https://www.progsu.com"
                target="_blank"
                rel="noreferrer noopener"
                className="text-white transition group-hover:text-violet-200 hover:text-violet-200 focus:outline-none focus-visible:text-violet-200 focus-visible:underline"
              >
                progsu
              </a>
            </h2>
          </div>

          <p
            className="mt-4 text-[15px] sm:text-[14.5px]"
            style={{ color: "rgba(255, 255, 255, 0.88)", lineHeight: 1.7 }}
          >
            progsu is a super awesome cool club that encourages students around
            atlanta to build and create a culture towards their unique style
            of character! Ever since I joined progsu I have been amazed with
            the amount of encouragement and respect progsu have towards their
            community and it means so much towards my colleagues! As a eboard
            member of progsu I&apos;m proud to say I&apos;m working on great
            amazing things like hacklanta! progcast! something I can&apos;t
            discuss yet! (you can ask{" "}
            <a
              href="https://www.linkedin.com/company/alphoraapp/"
              target="_blank"
              rel="noreferrer noopener"
              className="text-violet-200 underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
            >
              jared
            </a>
            ) I can go on and on for days
            talking about how much I love progsu and how much it has impacted
            my life thus far but one thing I have to say is that this is the
            club that cares about you! if you&apos;d love to see some of the
            most amazing people that works well in a team, click the progsu
            button to view some of stuff we do :)
          </p>
        </div>
      </section>

      {/* ---------------- GSU Cybersecurity Club (bottom half) ---------------- */}
      <section className="org-section-cyber flex flex-col justify-center px-6 py-20 sm:flex-1 sm:px-12 sm:py-10 max-sm:min-h-svh">
        <div className="mx-auto w-full max-w-2xl">
          <h2 className="text-[22px] font-medium tracking-tight text-white sm:text-[26px]">
            GSU Cybersecurity Club
          </h2>

          <p
            className="mt-4 text-[15px] sm:text-[14.5px]"
            style={{ color: "rgba(255, 255, 255, 0.88)", lineHeight: 1.7 }}
          >
            This is a club I&apos;d love to say is secret and mysterious, this
            is actually the first ever club I joined at GSU and first ever
            eboard position I took up on! Working with this club brings in new
            ways to network and show the cybersecurity skill set that is
            essential for students to learn within the core of protection!
            Think about it like this, cybersecurity just means to be realll
            careful and thats all you gotta really know from the basic of it
            lol. Think of it like this now, In this world of AI it&apos;s so
            easy to leak your API keys when they should be treated as if
            it&apos;s the last donut left in the fridge. YOU GOTTA PROTECT IT!
            and that&apos;s exactly it. period.
          </p>
        </div>
      </section>

      <AnimatePresence>
        {videoOpen && (
          <VideoModal
            src="/assets/videos/progsuvideo.mp4"
            onClose={() => setVideoOpen(false)}
            volume={0.5}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
