import { NextRequest, NextResponse } from "next/server";
import { collectResearch } from "@/lib/research";
import {
  generateArticleDraft,
  pickFallbackTopic,
  pickResearchItem,
  type ArticleDirection,
} from "@/lib/article";

// Research + draft-generation pipeline, meant to be hit by an external cron
// (e.g. every 3 hours). Generates DRAFTS only — publishing stays human-reviewed.

const DIRECTIONS: ArticleDirection[] = ["en2ja", "ja2en", "stillflow"];
const MAX_COUNT = 5;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  if (header === `Bearer ${secret}`) return true;
  // Fallback for cron services that cannot set headers
  return new URL(req.url).searchParams.get("secret") === secret;
}

type DirectionResult = {
  direction: ArticleDirection;
  generated: { id: string; title: string; topic: string }[];
  errors: string[];
};

async function runPipeline(directions: ArticleDirection[], count: number) {
  const research = await collectResearch(
    directions.length === 1 ? directions[0] : undefined
  );

  const results: DirectionResult[] = [];
  for (const direction of directions) {
    const result: DirectionResult = { direction, generated: [], errors: [] };
    for (let i = 0; i < count; i++) {
      try {
        const researchItem = await pickResearchItem(direction);
        const fallback = researchItem ? null : pickFallbackTopic(direction);
        const article = await generateArticleDraft({
          direction,
          researchItem,
          topic: fallback?.topic,
          category: fallback?.category,
        });
        result.generated.push({ id: article.id, title: article.title, topic: article.topic });
      } catch (err) {
        result.errors.push(err instanceof Error ? err.message : String(err));
        break; // stop this direction on error (e.g. missing API key)
      }
    }
    results.push(result);
  }

  return { research, results };
}

async function handle(req: NextRequest, body: Record<string, unknown>) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requested = body.direction as ArticleDirection | undefined;
  if (requested && !DIRECTIONS.includes(requested)) {
    return NextResponse.json(
      { error: "direction must be 'en2ja', 'ja2en', or 'stillflow'" },
      { status: 400 }
    );
  }
  const directions = requested ? [requested] : DIRECTIONS;
  const rawCount = Number(body.count ?? 1);
  const count = Math.min(Math.max(Number.isFinite(rawCount) ? rawCount : 1, 1), MAX_COUNT);

  try {
    const summary = await runPipeline(directions, count);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline failed";
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
  if (searchParams.get("direction")) body.direction = searchParams.get("direction");
  if (searchParams.get("count")) body.count = searchParams.get("count");
  return handle(req, body);
}
