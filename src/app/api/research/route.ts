import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectResearch } from "@/lib/research";
import type { ArticleDirection } from "@/lib/article";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction");
  const used = searchParams.get("used");

  const items = await prisma.researchItem.findMany({
    where: {
      ...(direction ? { direction } : {}),
      ...(used !== null ? { used: used === "true" } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const direction = body.direction as ArticleDirection | undefined;

    if (direction && direction !== "en2ja" && direction !== "ja2en") {
      return NextResponse.json(
        { error: "direction must be 'en2ja' or 'ja2en'" },
        { status: 400 }
      );
    }

    const result = await collectResearch(direction);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Research collection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
