import type { Metadata } from "next";
import YoutubeResearchClient from "./YoutubeResearchClient";

export const metadata: Metadata = {
  title: "YouTube Research — Japandi Poster Auto Studio",
  description:
    "Find trending YouTube videos by keyword and track daily view growth via the YouTube Data API.",
};

export default function YoutubeResearchPage() {
  return <YoutubeResearchClient />;
}
