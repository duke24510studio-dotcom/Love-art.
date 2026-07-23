import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNextRound } from "@/lib/review-round";

// Weekly review pipeline: for each "active" tracked product, generate its
// next weekly round (5 persona reviews + one lifestyle photo). Meant to be
// hit by an external cron, once a week. Generates DRAFTS only — publishing
// stays human-reviewed at /products/[id].

const MAX_PRODUCTS = 5;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  if (header === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

async function runReviewPipeline(count: number) {
  const products = await prisma.rakutenProduct.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "asc" },
    take: count,
  });

  const generated: { productId: string; name: string; weekNumber: number; roundId: string }[] = [];
  const errors: string[] = [];

  for (const product of products) {
    try {
      const round = await generateNextRound(product.id);
      generated.push({
        productId: product.id,
        name: product.name,
        weekNumber: round.weekNumber,
        roundId: round.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${product.name || product.id}: ${message}`);
      if (/OPENAI_API_KEY|401|403/i.test(message)) break;
    }
  }

  return { generated, errors };
}

async function handle(req: NextRequest, body: Record<string, unknown>) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rawCount = Number(body.count ?? MAX_PRODUCTS);
  const count = Math.min(Math.max(Number.isFinite(rawCount) ? rawCount : MAX_PRODUCTS, 1), MAX_PRODUCTS);

  try {
    const summary = await runReviewPipeline(count);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review pipeline failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return handle(req, body);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const body: Record<string, unknown> = {};
  if (searchParams.get("count")) body.count = searchParams.get("count");
  return handle(req, body);
}
