import { NextRequest, NextResponse } from "next/server";
import { assembleVideo, getProjectWithScenes } from "@/lib/video";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProjectWithScenes(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updated = await assembleVideo(project);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Video assembly failed";
    const status = message.includes("ffmpeg is not installed") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
