import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderMissingSceneImages, renderSceneImage, renderThumbnail } from "@/lib/video-image";

// Image generation runs one scene at a time and each call can take 60-90s.
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
    // Thumbnail only
    if (body.target === "thumbnail") {
      const updated = await renderThumbnail(project);
      return NextResponse.json({ project: updated });
    }

    // A single scene, e.g. to re-roll one image the reviewer didn't like
    if (typeof body.sceneId === "string") {
      const scene = project.scenes.find((s) => s.id === body.sceneId);
      if (!scene) return NextResponse.json({ error: "Scene not found" }, { status: 404 });
      const updated = await renderSceneImage(project, scene);
      return NextResponse.json({ scene: updated });
    }

    // Batch: fill in whatever is missing. `limit` keeps a single request from
    // running past the platform timeout — the UI just calls again.
    const rawLimit = Number(body.limit ?? 4);
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 4, 1), 20);
    const result = await renderMissingSceneImages(project, project.scenes, {
      force: body.force === true,
      limit,
    });

    const scenes = await prisma.videoScene.findMany({
      where: { projectId: id },
      orderBy: { index: "asc" },
    });
    const remaining = scenes.filter((s) => !s.imagePath).length;

    if (remaining === 0 && project.status === "planned") {
      await prisma.videoProject.update({ where: { id }, data: { status: "images" } });
    }

    return NextResponse.json({ ...result, remaining, scenes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image generation failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
