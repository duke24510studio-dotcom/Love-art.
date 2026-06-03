import { prisma } from "@/lib/prisma";
import type { PosterGeneration, PosterTheme } from "@/generated/prisma/client";

export async function getThemeWithGenerations(themeId: string) {
  return prisma.posterTheme.findUnique({
    where: { id: themeId },
    include: { generations: { orderBy: { createdAt: "desc" } } },
  });
}

export async function getGenerationWithTheme(generationId: string) {
  return prisma.posterGeneration.findUnique({
    where: { id: generationId },
    include: { theme: true },
  });
}

/** Reuse latest generation without an image, or create a new one. */
export async function getOrCreateActiveGeneration(themeId: string): Promise<PosterGeneration> {
  const latest = await prisma.posterGeneration.findFirst({
    where: { themeId, imagePath: "" },
    orderBy: { createdAt: "desc" },
  });
  if (latest) return latest;

  return prisma.posterGeneration.create({
    data: { themeId, status: "idea" },
  });
}

export async function syncThemeStatus(themeId: string, status: string) {
  await prisma.posterTheme.update({
    where: { id: themeId },
    data: { status },
  });
}

export type ThemeForCopy = PosterTheme & { generations: PosterGeneration[] };
