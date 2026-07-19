import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assembleVideo,
  generateVideoAudio,
  generateVideoScript,
  generateVideoVisuals,
  getProjectWithScenes,
  isFfmpegAvailable,
  pickNextVideoTopic,
} from "@/lib/video";

// Faceless-video pipeline, meant to be hit by an external cron.
// Creates a project from the topic bank and runs the generation steps.
// Drafts only — review, approval, and YouTube upload stay manual.

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  if (header === `Bearer ${secret}`) return true;
  // Fallback for cron services that cannot set headers
  return new URL(req.url).searchParams.get("secret") === secret;
}

async function handle(req: NextRequest, body: Record<string, unknown>) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // mode "script" (default, cheap): script + metadata only.
  // mode "full": script + narration audio + visuals + ffmpeg assembly.
  const mode = body.mode === "full" ? "full" : "script";
  const steps: string[] = [];
  const errors: string[] = [];

  try {
    const requestedTopic = typeof body.topic === "string" ? body.topic.trim() : "";
    const requestedPillar = typeof body.pillar === "string" ? body.pillar.trim() : "";
    const picked = requestedTopic ? null : await pickNextVideoTopic();

    const project = await prisma.videoProject.create({
      data: {
        pillar: requestedPillar || picked?.pillar || "wabi-sabi",
        topic: requestedTopic || picked?.topic || "Wabi-Sabi: Learning to Love Imperfection at Home",
      },
    });

    let current = await generateVideoScript(project);
    steps.push("script");

    if (mode === "full") {
      try {
        current = await generateVideoAudio(current);
        steps.push("audio");
        current = await generateVideoVisuals(current);
        steps.push("visuals");
        if (isFfmpegAvailable()) {
          await assembleVideo(current);
          steps.push("assemble");
        } else {
          errors.push("ffmpeg not installed — skipped assembly");
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    const final = await getProjectWithScenes(project.id);
    return NextResponse.json({
      project: final && {
        id: final.id,
        topic: final.topic,
        title: final.title,
        status: final.status,
        scenes: final.scenes.length,
      },
      steps,
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Video pipeline failed";
    return NextResponse.json({ error: message, steps, errors }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return handle(req, body);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const body: Record<string, unknown> = {};
  for (const key of ["mode", "topic", "pillar"]) {
    const value = searchParams.get(key);
    if (value) body[key] = value;
  }
  return handle(req, body);
}
