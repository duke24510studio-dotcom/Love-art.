import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StudioClient from "./StudioClient";

export default async function VideoStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.videoProject.findUnique({
    where: { id },
    include: { scenes: { orderBy: { index: "asc" } } },
  });

  if (!project) notFound();

  return <StudioClient project={project} />;
}
