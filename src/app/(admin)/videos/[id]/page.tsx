import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VideoDetailClient from "./VideoDetailClient";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.videoProject.findUnique({
    where: { id },
    include: {
      scenes: { orderBy: { index: "asc" } },
      article: { select: { id: true, title: true } },
    },
  });

  if (!project) notFound();

  return <VideoDetailClient project={project} />;
}
