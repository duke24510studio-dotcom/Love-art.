import { NextRequest, NextResponse } from "next/server";
import { collectTrendingVideos } from "@/lib/channel-research";
import { generateChannelIdea, pickTrendingSource } from "@/lib/channel-ideas";

// Research + idea-generation pipeline, meant to be hit by an external cron
// (e.g. every 6 hours). Generates channel-concept PROPOSALS only — nothing is
// auto-uploaded or auto-posted. See docs/YOUTUBE_RESEARCH.md.

const MAX_IDEAS = 5;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  if (header === `Bearer ${secret}`) return true;
  // Fallback for cron services that cannot set headers
  return new URL(req.url).searchParams.get("secret") === secret;
}

async function runPipeline(regions: string[] | undefined, ideaCount: number) {
  const collected = await collectTrendingVideos(regions);

  const ideas: { id: string; channelName: string }[] = [];
  const errors: string[] = [];
  for (let i = 0; i < ideaCount; i++) {
    try {
      const sourceVideo = await pickTrendingSource();
      if (!sourceVideo) break;
      const idea = await generateChannelIdea(sourceVideo);
      ideas.push({ id: idea.id, channelName: idea.channelName });
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      break; // stop on error (e.g. missing API key)
    }
  }

  return { collected, ideas, errors };
}

async function handle(req: NextRequest, body: Record<string, unknown>) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const regions = Array.isArray(body.regions) ? (body.regions as string[]) : undefined;
  const rawCount = Number(body.ideaCount ?? 1);
  const ideaCount = Math.min(Math.max(Number.isFinite(rawCount) ? rawCount : 1, 0), MAX_IDEAS);

  try {
    const summary = await runPipeline(regions, ideaCount);
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
  if (searchParams.get("ideaCount")) body.ideaCount = searchParams.get("ideaCount");
  return handle(req, body);
}
