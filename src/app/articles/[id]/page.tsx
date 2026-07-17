import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ArticleDetailClient from "./ArticleDetailClient";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: { researchItem: { select: { title: true, url: true } } },
  });

  if (!article) notFound();

  return <ArticleDetailClient article={article} />;
}
