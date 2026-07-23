import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  let slug: string | undefined;
  if (body.slug !== undefined) {
    slug = slugify(String(body.slug));
    if (!slug) {
      return NextResponse.json({ error: "無効なslugです（a-z, 0-9, - のみ）" }, { status: 400 });
    }
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `このslugは既に使われています: ${slug}` }, { status: 409 });
    }
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(slug !== undefined ? { slug } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.excerpt !== undefined ? { excerpt: body.excerpt } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.body !== undefined ? { body: body.body } : {}),
      ...(body.published !== undefined ? { published: Boolean(body.published) } : {}),
    },
  });
  return NextResponse.json(post);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
