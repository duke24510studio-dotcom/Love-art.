import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isArticleDirection } from "@/lib/article";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction");

  const feeds = await prisma.feedSource.findMany({
    where: direction ? { direction } : {},
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(feeds);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, feedUrl, direction } = body as {
    name?: string;
    feedUrl?: string;
    direction?: string;
  };

  if (!name || !feedUrl || !direction) {
    return NextResponse.json(
      { error: "name, feedUrl, direction are required" },
      { status: 400 }
    );
  }
  if (!isArticleDirection(direction)) {
    return NextResponse.json(
      { error: "direction must be 'en2ja', 'ja2en', or 'stillflow'" },
      { status: 400 }
    );
  }

  const feed = await prisma.feedSource.create({
    data: {
      name,
      feedUrl,
      direction,
      category: body.category ?? "",
      active: body.active ?? true,
    },
  });

  return NextResponse.json(feed, { status: 201 });
}
