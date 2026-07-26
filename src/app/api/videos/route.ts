import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVideoPlan, isVideoFormat } from "@/lib/video";
import { isVideoStyleKey } from "@/lib/video-style";

// Planning a video is one long OpenAI call over a full article body.
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const format = searchParams.get("format");

  const projects = await prisma.videoProject.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(format ? { format } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { scenes: { orderBy: { index: "asc" } } },
    take: 100,
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const format = body.format ?? "long";
    if (!isVideoFormat(format)) {
      return NextResponse.json({ error: "format must be 'long' or 'short'" }, { status: 400 });
    }

    const visualStyle = body.visualStyle ?? "japandi";
    if (!isVideoStyleKey(visualStyle)) {
      return NextResponse.json({ error: "Unknown visualStyle" }, { status: 400 });
    }

    const articleId = (body.articleId as string | undefined)?.trim();
    const topic = (body.topic as string | undefined)?.trim();
    if (!articleId && !topic) {
      return NextResponse.json(
        { error: "Provide either articleId or topic" },
        { status: 400 }
      );
    }

    const article = articleId
      ? await prisma.article.findUnique({ where: { id: articleId } })
      : null;
    if (articleId && !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const project = await createVideoPlan({
      article,
      topic,
      genre: (body.genre as string | undefined) ?? "",
      format,
      visualStyle,
      voice: (body.voice as string | undefined) || "alloy",
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Video planning failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
