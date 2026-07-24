import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMockup, isMockupSceneKey, MOCKUP_SCENES } from "@/lib/poster-mockup";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mockups = await prisma.posterMockup.findMany({
    where: { generationId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(mockups);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const count = Math.min(Math.max(Number(body.count) || 6, 1), MOCKUP_SCENES.length);
  const requestedScenes: string[] | undefined = Array.isArray(body.scenes)
    ? body.scenes
    : undefined;

  const generation = await prisma.posterGeneration.findUnique({
    where: { id },
    include: { theme: true },
  });
  if (!generation) {
    return NextResponse.json({ error: "Generation not found" }, { status: 404 });
  }
  if (!generation.imagePath) {
    return NextResponse.json(
      { error: "This poster has no generated image yet." },
      { status: 400 }
    );
  }

  const existing = await prisma.posterMockup.findMany({
    where: { generationId: id },
    select: { scene: true },
  });
  const existingScenes = new Set(existing.map((m) => m.scene));

  let scenesToRun: string[];
  if (requestedScenes) {
    scenesToRun = requestedScenes.filter(isMockupSceneKey);
  } else {
    scenesToRun = MOCKUP_SCENES.map((s) => s.key)
      .filter((key) => !existingScenes.has(key))
      .slice(0, count);
  }

  const mockups = [];
  const errors: { scene: string; error: string }[] = [];

  for (const sceneKey of scenesToRun) {
    if (!isMockupSceneKey(sceneKey)) continue;
    try {
      const mockup = await generateMockup(generation, sceneKey);
      mockups.push(mockup);
    } catch (err) {
      errors.push({
        scene: sceneKey,
        error: err instanceof Error ? err.message : "Mockup generation failed",
      });
    }
  }

  const status = mockups.length === 0 && errors.length > 0 ? 502 : 200;
  return NextResponse.json({ mockups, errors }, { status });
}
