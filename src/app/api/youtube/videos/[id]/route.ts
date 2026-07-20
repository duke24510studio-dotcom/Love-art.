import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof body.tracked !== "boolean") {
      return NextResponse.json({ error: "tracked (boolean) is required" }, { status: 400 });
    }
    const video = await prisma.youtubeVideo.update({
      where: { id },
      data: { tracked: body.tracked },
      select: { id: true, tracked: true },
    });
    return NextResponse.json(video);
  } catch {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.youtubeVideo.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }
}
