import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVideoPlan, isVideoFormat, type VideoFormat } from "@/lib/video";
import { isVideoStyleKey } from "@/lib/video-style";
import { renderMissingSceneImages } from "@/lib/video-image";
import { renderMissingNarration } from "@/lib/tts";

// Daily "article -> video" pipeline for an external cron.
//
// Picks approved article drafts that don't have a video yet, plans a video for
// each, then optionally renders scene images and narration. The final encode
// always happens in the browser at /videos/[id]/studio, and uploading to
// YouTube stays manual — nothing here publishes anything.

export const maxDuration = 800;

const MAX_COUNT = 3;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  if (header === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

async function handle(req: NextRequest, body: Record<string, unknown>) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = (body.format as VideoFormat | undefined) ?? "long";
  if (!isVideoFormat(format)) {
    return NextResponse.json({ error: "format must be 'long' or 'short'" }, { status: 400 });
  }
  const visualStyle = (body.visualStyle as string | undefined) || "japandi";
  if (!isVideoStyleKey(visualStyle)) {
    return NextResponse.json({ error: "Unknown visualStyle" }, { status: 400 });
  }
  const voice = (body.voice as string | undefined) || "alloy";

  const rawCount = Number(body.count ?? 1);
  const count = Math.min(Math.max(Number.isFinite(rawCount) ? rawCount : 1, 1), MAX_COUNT);

  // Media generation is expensive and slow; opt in explicitly.
  const withImages = body.images !== false;
  const withNarration = body.narration === true;

  // Only articles a human already approved become videos.
  const articles = await prisma.article.findMany({
    where: {
      status: { in: ["approved", "published"] },
      language: "ja",
      videos: { none: {} },
    },
    orderBy: { createdAt: "desc" },
    take: count,
  });

  const created: { id: string; title: string; articleId: string | null }[] = [];
  const errors: string[] = [];

  for (const article of articles) {
    try {
      const project = await createVideoPlan({
        article,
        format,
        visualStyle,
        voice,
      });
      created.push({ id: project.id, title: project.title, articleId: article.id });

      if (withImages) {
        const imageResult = await renderMissingSceneImages(project, project.scenes, {
          limit: format === "short" ? 7 : 14,
        });
        errors.push(...imageResult.errors);
      }
      if (withNarration) {
        const narrationResult = await renderMissingNarration(project, project.scenes);
        errors.push(...narrationResult.errors);
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      break;
    }
  }

  return NextResponse.json({
    candidates: articles.length,
    created,
    errors,
    note: "Drafts only. Render the video at /videos/[id]/studio and upload to YouTube manually.",
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return handle(req, body);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const body: Record<string, unknown> = {};
  for (const key of ["format", "visualStyle", "voice", "count"]) {
    const value = searchParams.get(key);
    if (value) body[key] = value;
  }
  if (searchParams.get("images") === "false") body.images = false;
  if (searchParams.get("narration") === "true") body.narration = true;
  return handle(req, body);
}
