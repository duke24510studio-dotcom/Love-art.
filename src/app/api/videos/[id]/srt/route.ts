import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildSrt } from "@/lib/video";

/** SRT caption file, timed by each scene's measured narration length. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.videoProject.findUnique({
    where: { id },
    include: { scenes: { orderBy: { index: "asc" } } },
  });
  if (!project) return new NextResponse("Not found", { status: 404 });

  const srt = buildSrt(project.scenes);
  const filename = `video-${project.id}.srt`;

  return new NextResponse(srt, {
    headers: {
      "Content-Type": "application/x-subrip; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
