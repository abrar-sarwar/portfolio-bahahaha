"use client";

type Props = {
  onClick: () => void;
};

export default function BackButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to home"
      className="fixed top-6 left-6 z-50 px-4 py-2 rounded-md border border-white/40 bg-black/40 text-white text-sm tracking-wide backdrop-blur hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      ← Back
    </button>
  );
}
