import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ARTICLE_STATUSES } from "@/lib/article";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: { researchItem: { select: { title: true, url: true } } },
  });

  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (
    body.status !== undefined &&
    !ARTICLE_STATUSES.includes(body.status as (typeof ARTICLE_STATUSES)[number])
  ) {
    return NextResponse.json(
      { error: `status must be one of: ${ARTICLE_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.subtitle !== undefined ? { subtitle: body.subtitle } : {}),
      ...(body.body !== undefined ? { body: body.body } : {}),
      ...(body.tags !== undefined ? { tags: body.tags } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
  });

  return NextResponse.json(article);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.article.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
