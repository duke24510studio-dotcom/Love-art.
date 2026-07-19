import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVideoScript } from "@/lib/video";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const projectId = body.projectId as string | undefined;
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await prisma.videoProject.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updated = await generateVideoScript(project);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Script generation failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
