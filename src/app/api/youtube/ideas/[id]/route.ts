import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CHANNEL_IDEA_STATUSES } from "@/lib/channel-ideas";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idea = await prisma.channelIdea.findUnique({
    where: { id },
    include: { sourceVideo: { select: { title: true, channelTitle: true, regionCode: true } } },
  });

  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(idea);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (
    body.status !== undefined &&
    !CHANNEL_IDEA_STATUSES.includes(body.status as (typeof CHANNEL_IDEA_STATUSES)[number])
  ) {
    return NextResponse.json(
      { error: `status must be one of: ${CHANNEL_IDEA_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const idea = await prisma.channelIdea.update({
    where: { id },
    data: {
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
  });

  return NextResponse.json(idea);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.channelIdea.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
