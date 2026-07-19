import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pickNextVideoTopic, VIDEO_PILLARS, VIDEO_VOICES } from "@/lib/video";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const pillar = searchParams.get("pillar") ?? undefined;

  const projects = await prisma.videoProject.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(pillar ? { pillar } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { scenes: { select: { id: true }, orderBy: { order: "asc" } } },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  let pillar = typeof body.pillar === "string" ? body.pillar.trim() : "";
  let topic = typeof body.topic === "string" ? body.topic.trim() : "";

  if (pillar && !VIDEO_PILLARS.some((p) => p.id === pillar)) {
    return NextResponse.json(
      { error: `pillar must be one of: ${VIDEO_PILLARS.map((p) => p.id).join(", ")}` },
      { status: 400 }
    );
  }

  // No topic given: auto-pick the next unused topic from the bank.
  if (!topic) {
    const picked = await pickNextVideoTopic();
    topic = picked.topic;
    pillar = pillar || picked.pillar;
  }
  if (!pillar) pillar = VIDEO_PILLARS[0].id;

  const voice = typeof body.voice === "string" && (VIDEO_VOICES as readonly string[]).includes(body.voice)
    ? body.voice
    : "onyx";
  const rawDuration = Number(body.durationTargetMin ?? 10);
  const durationTargetMin = Math.min(Math.max(Number.isFinite(rawDuration) ? Math.round(rawDuration) : 10, 5), 20);

  const project = await prisma.videoProject.create({
    data: { pillar, topic, voice, durationTargetMin },
  });

  return NextResponse.json(project, { status: 201 });
}
