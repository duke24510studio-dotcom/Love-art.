import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VIDEO_STATUSES, refreshChapters } from "@/lib/video";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.videoProject.findUnique({
    where: { id },
    include: {
      scenes: { orderBy: { index: "asc" } },
      article: { select: { id: true, title: true } },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (
    body.status !== undefined &&
    !VIDEO_STATUSES.includes(body.status as (typeof VIDEO_STATUSES)[number])
  ) {
    return NextResponse.json(
      { error: `status must be one of: ${VIDEO_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const project = await prisma.videoProject.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.tags !== undefined ? { tags: body.tags } : {}),
      ...(body.thumbnailText !== undefined ? { thumbnailText: body.thumbnailText } : {}),
      ...(body.voice !== undefined ? { voice: body.voice } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
  });

  // Editing scene text can change timings, so keep chapters in sync.
  if (Array.isArray(body.scenes)) {
    for (const scene of body.scenes as Record<string, unknown>[]) {
      if (typeof scene.id !== "string") continue;
      await prisma.videoScene.update({
        where: { id: scene.id },
        data: {
          ...(typeof scene.heading === "string" ? { heading: scene.heading } : {}),
          ...(typeof scene.narration === "string" ? { narration: scene.narration } : {}),
          ...(typeof scene.onScreenText === "string"
            ? { onScreenText: scene.onScreenText }
            : {}),
          ...(typeof scene.imagePrompt === "string"
            ? { imagePrompt: scene.imagePrompt }
            : {}),
        },
      });
    }
    await refreshChapters(id);
  }

  const updated = await prisma.videoProject.findUnique({
    where: { id: project.id },
    include: { scenes: { orderBy: { index: "asc" } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.videoProject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
