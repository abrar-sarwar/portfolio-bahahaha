"use client";

import dynamic from "next/dynamic";

const AdventureApp = dynamic(() => import("@/features/adventure/AdventureApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-svh w-screen items-center justify-center bg-black font-mono text-xs uppercase tracking-[0.3em] text-white/50">
      loading adventure…
    </div>
  ),
});

export default function AdventurePage() {
  return <AdventureApp />;
}
