import { notFound } from "next/navigation";
import { getProjectWithScenes } from "@/lib/video";
import VideoDetailClient from "./VideoDetailClient";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectWithScenes(id);
  if (!project) notFound();

  return <VideoDetailClient project={project} />;
}
