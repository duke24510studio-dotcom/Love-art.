import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateArticleDraft,
  isArticleDirection,
  pickFallbackTopic,
  pickResearchItem,
} from "@/lib/article";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction");
  const status = searchParams.get("status");

  const articles = await prisma.article.findMany({
    where: {
      ...(direction ? { direction } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { researchItem: { select: { title: true, url: true } } },
    take: 100,
  });

  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const direction = body.direction;
    if (!isArticleDirection(direction)) {
      return NextResponse.json(
        { error: "direction must be 'en2ja', 'ja2en', or 'stillflow'" },
        { status: 400 }
      );
    }

    // Explicit topic > specific research item > next unused item > fallback topic
    let researchItem = null;
    let topic = (body.topic as string | undefined)?.trim() || "";
    let category = (body.category as string | undefined) || "";

    if (!topic) {
      if (body.researchItemId) {
        researchItem = await prisma.researchItem.findUnique({
          where: { id: body.researchItemId as string },
        });
        if (!researchItem) {
          return NextResponse.json({ error: "Research item not found" }, { status: 404 });
        }
      } else {
        researchItem = await pickResearchItem(direction);
      }
      if (!researchItem) {
        const fallback = pickFallbackTopic(direction);
        topic = fallback.topic;
        category = category || fallback.category;
      }
    }

    const article = await generateArticleDraft({ direction, researchItem, topic, category });
    return NextResponse.json({ article }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Article generation failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
