"use client";

import BackButton from "./BackButton";
import SpriteSlot from "./SpriteSlot";

type Props = {
  onBack: () => void;
};

export default function FunPage({ onBack }: Props) {
  return (
    <main className="relative h-full w-full bg-black text-white">
      <BackButton onClick={onBack} />

      <div className="flex h-full w-full items-center justify-center">
        <SpriteSlot
          src="/assets/sprites/abrarshoot.png"
          alt="Fun sprite"
          fallbackLabel="abrarshoot.png"
          className="max-h-[70vh] max-w-[70vw] object-contain"
        />
      </div>

      {/* TODO: fun interactive content */}
    </main>
  );
}
