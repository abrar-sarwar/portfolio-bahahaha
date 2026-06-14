import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abrar Sarwar",
  description: "Portfolio",
  // Favicon served from the public asset at a fresh, versioned URL so browsers
  // that cached the old /icon.png are forced to re-fetch. Bump ?v=N to bust it
  // again later.
  icons: {
    icon: [
      { url: "/assets/sprites/mainimage-favicon-16.png?v=6", sizes: "16x16", type: "image/png" },
      { url: "/assets/sprites/mainimage-favicon-32.png?v=6", sizes: "32x32", type: "image/png" },
      { url: "/assets/sprites/mainimage-favicon.png?v=6", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/assets/sprites/mainimage-favicon.png?v=6", type: "image/png" },
    ],
  },
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
