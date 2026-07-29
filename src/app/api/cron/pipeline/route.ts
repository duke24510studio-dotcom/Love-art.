import { NextRequest, NextResponse } from "next/server";
import { collectResearch } from "@/lib/research";
import {
  ARTICLE_DIRECTIONS,
  generateArticleDraft,
  pickFallbackTopic,
  pickResearchItem,
  type ArticleDirection,
} from "@/lib/article";
import { isGenreKey, pickRotatingGenre } from "@/lib/genres";

// Research + draft-generation pipeline, meant to be hit by an external cron
// (e.g. every 3 hours). Generates DRAFTS only — publishing stays human-reviewed.

// "note" is the generic multi-genre channel: with no genre given it rotates
// through the presets in src/lib/genres.ts, one genre per day.
const DIRECTIONS: ArticleDirection[] = ["en2ja", "ja2en", "stillflow", "econ", "note"];
const MAX_COUNT = 5;

// Research feeds are only tagged en2ja / ja2en, so the other channels always
// fall back to their own topic lists.
export const maxDuration = 800;

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

async function runPipeline(
  directions: ArticleDirection[],
  count: number,
  genre?: string
) {
  const research = await collectResearch(
    directions.length === 1 && directions[0] !== "note" ? directions[0] : undefined
  );

  const results: DirectionResult[] = [];
  for (const direction of directions) {
    const result: DirectionResult = { direction, generated: [], errors: [] };
    for (let i = 0; i < count; i++) {
      try {
        const researchItem = await pickResearchItem(direction);
        // Each draft in a multi-draft "note" run takes the next genre, so a
        // count of 3 gives three different genres rather than three near-copies.
        const genreKey =
          direction === "note" ? genre || pickRotatingGenre(i).key : undefined;
        const fallback = researchItem ? null : pickFallbackTopic(direction, genreKey);
        const article = await generateArticleDraft({
          direction,
          researchItem,
          topic: fallback?.topic,
          category: fallback?.category,
          genre: genreKey,
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
      { error: `direction must be one of: ${ARTICLE_DIRECTIONS.join(", ")}` },
      { status: 400 }
    );
  }
  const genre = (body.genre as string | undefined)?.trim() || "";
  if (genre && !isGenreKey(genre)) {
    return NextResponse.json({ error: `Unknown genre: ${genre}` }, { status: 400 });
  }
  const directions = requested ? [requested] : DIRECTIONS;
  const rawCount = Number(body.count ?? 1);
  const count = Math.min(Math.max(Number.isFinite(rawCount) ? rawCount : 1, 1), MAX_COUNT);

  try {
    const summary = await runPipeline(directions, count, genre);
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
  if (searchParams.get("genre")) body.genre = searchParams.get("genre");
  if (searchParams.get("count")) body.count = searchParams.get("count");
  return handle(req, body);
}
