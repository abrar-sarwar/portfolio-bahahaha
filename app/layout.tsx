import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abrar Sarwar",
  description: "Portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden bg-black text-white">
        {children}
      </body>
    </html>
  );
}
