"use client";

type Props = {
  onClick: () => void;
};

export default function SkipButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Skip intro"
      className="fixed top-6 right-6 z-50 px-4 py-2 rounded-md border border-white/60 bg-black/60 text-white text-sm tracking-wide backdrop-blur hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      Skip →
    </button>
  );
}
