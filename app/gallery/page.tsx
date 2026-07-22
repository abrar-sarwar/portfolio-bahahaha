import type { Metadata } from "next";
import GalleryBook from "@/components/GalleryBook";

export const metadata: Metadata = {
  title: "The Archive",
  description: "A locked chapter recovered through Abrar's Adventure.",
};

export default function GalleryPage() {
  return <GalleryBook />;
}
