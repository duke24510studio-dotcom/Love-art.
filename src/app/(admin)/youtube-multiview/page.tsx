import type { Metadata } from "next";
import YoutubeMultiviewClient from "./YoutubeMultiviewClient";

export const metadata: Metadata = {
  title: "YouTube Multiview — Japandi Poster Auto Studio",
  description: "Watch multiple YouTube videos or live streams side by side in a grid.",
};

export default function YoutubeMultiviewPage() {
  return <YoutubeMultiviewClient />;
}
