import type { Metadata } from "next";
import MyWorldPage from "@/components/MyWorldPage";

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/assets/sprites/myworldimage-favicon-16.png?v=6", sizes: "16x16", type: "image/png" },
      { url: "/assets/sprites/myworldimage-favicon-32.png?v=6", sizes: "32x32", type: "image/png" },
      { url: "/assets/sprites/myworldimage-favicon.png?v=6", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/assets/sprites/myworldimage-favicon.png?v=6", type: "image/png" },
    ],
  },
};

export default function MyWorldRoute() {
  return <MyWorldPage />;
}
