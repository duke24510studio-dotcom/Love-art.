import type { Metadata } from "next";
import YoutubeResearchClient from "./YoutubeResearchClient";

export const metadata: Metadata = {
  title: "YouTube Research — Japandi Poster Auto Studio",
  description:
    "Research overseas YouTube trends (trending videos, early velocity, rapidly growing channels) and generate original channel-concept proposals for human review.",
};

export default function YoutubeResearchPage() {
  return <YoutubeResearchClient />;
}
