import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abrar's Adventure",
  description: "The Lost Key — a hidden pixel adventure",
};

export default function AdventureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
