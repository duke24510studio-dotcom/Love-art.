import { NextRequest, NextResponse } from "next/server";
import { generateVideoVisuals, getProjectWithScenes } from "@/lib/video";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const projectId = body.projectId as string | undefined;
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await getProjectWithScenes(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updated = await generateVideoVisuals(project);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Visual generation failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
