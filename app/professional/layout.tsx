import type { Metadata } from "next";
import { Fraunces, Schibsted_Grotesk, JetBrains_Mono } from "next/font/google";

// Distinctive type pairing for the professional page: a characterful editorial
// serif for display, a clean modern grotesque for body, and a mono for labels.
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-pro-display",
  display: "swap",
});

const body = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pro-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-pro-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Abrar Sarwar | Professional",
  description: "The professional profile of Abrar Sarwar.",
};

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${display.variable} ${body.variable} ${mono.variable}`}>
      {children}
    </div>
  );
}
