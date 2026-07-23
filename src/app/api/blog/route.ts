import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const postBody = typeof body.body === "string" ? body.body.trim() : "";
  if (!title || !postBody) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 });
  }

  const rawSlug = typeof body.slug === "string" && body.slug.trim() ? body.slug : title;
  const slug = slugify(rawSlug);
  if (!slug) {
    return NextResponse.json({ error: "Could not derive a valid slug — please set one manually (a-z, 0-9, -)" }, { status: 400 });
  }

  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: `このslugは既に使われています: ${slug}` }, { status: 409 });
  }

  const post = await prisma.blogPost.create({
    data: {
      slug,
      title,
      excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() : "",
      category: typeof body.category === "string" ? body.category.trim() : "",
      body: postBody,
      published: body.published !== false,
    },
  });
  return NextResponse.json(post, { status: 201 });
}
