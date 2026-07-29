import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderMissingNarration, renderSceneNarration } from "@/lib/tts";
import { refreshChapters } from "@/lib/video";

export const maxDuration = 800;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const project = await prisma.videoProject.findUnique({
    where: { id },
    include: { scenes: { orderBy: { index: "asc" } } },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    if (typeof body.sceneId === "string") {
      const scene = project.scenes.find((s) => s.id === body.sceneId);
      if (!scene) return NextResponse.json({ error: "Scene not found" }, { status: 404 });
      const updated = await renderSceneNarration(project, scene);
      await refreshChapters(id);
      return NextResponse.json({ scene: updated });
    }

    const result = await renderMissingNarration(project, project.scenes, {
      force: body.force === true,
    });
    await refreshChapters(id);

    const scenes = await prisma.videoScene.findMany({
      where: { projectId: id },
      orderBy: { index: "asc" },
    });
    const remaining = scenes.filter((s) => !s.audioPath).length;

    if (remaining === 0) {
      const hasAllImages = scenes.every((s) => s.imagePath);
      await prisma.videoProject.update({
        where: { id },
        data: { status: hasAllImages ? "ready" : "narrated" },
      });
    }

    return NextResponse.json({ ...result, remaining, scenes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Narration failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
