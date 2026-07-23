import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateChannelIdea, pickTrendingSource } from "@/lib/channel-ideas";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const ideas = await prisma.channelIdea.findMany({
    where: {
      ...(status ? { status } : {}),
    },
    include: { sourceVideo: { select: { title: true, channelTitle: true, regionCode: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(ideas);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const regionCode = typeof body.regionCode === "string" ? body.regionCode : undefined;
    const sourceVideoId = typeof body.sourceVideoId === "string" ? body.sourceVideoId : undefined;

    const sourceVideo = sourceVideoId
      ? await prisma.ytVideoSnapshot.findUnique({ where: { id: sourceVideoId } })
      : await pickTrendingSource(regionCode);

    if (!sourceVideo) {
      return NextResponse.json(
        { error: "No trending video available. Run POST /api/youtube/collect first." },
        { status: 400 }
      );
    }

    const idea = await generateChannelIdea(sourceVideo);
    return NextResponse.json(idea);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Idea generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
