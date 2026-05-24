import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PosterDetailClient from "./PosterDetailClient";

export default async function PosterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const theme = await prisma.posterTheme.findUnique({
    where: { id },
    include: {
      generations: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!theme) notFound();

  return <PosterDetailClient theme={theme} />;
}
