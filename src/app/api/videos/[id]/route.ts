import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getProjectDir, getProjectWithScenes, VIDEO_STATUSES } from "@/lib/video";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProjectWithScenes(id);
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
      ...(body.topic !== undefined ? { topic: body.topic } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.tags !== undefined ? { tags: body.tags } : {}),
      ...(body.thumbnailText !== undefined ? { thumbnailText: body.thumbnailText } : {}),
      ...(body.voice !== undefined ? { voice: body.voice } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.videoProject.delete({ where: { id } });

  // Remove generated assets for this project as well.
  const dir = path.resolve(process.cwd(), getProjectDir(id));
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  return NextResponse.json({ ok: true });
}
