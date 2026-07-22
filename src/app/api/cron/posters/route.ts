import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildHokusaiPrompt,
  ensureHokusaiThemes,
  HOKUSAI_COLLECTION,
  type PosterOrientation,
} from "@/lib/hokusai";
import { renderPosterImage } from "@/lib/poster-image";

// Daily poster pipeline: generate N original Hokusai-style aizuri-e (indigo
// ukiyo-e) poster images. Meant to be hit by an external cron.
// Images only — approval/export stays human-reviewed (/posters).

const MAX_COUNT = 6;

type OrientationInput = "portrait" | "landscape" | "mixed";

function pickOrientation(input: OrientationInput, index: number): PosterOrientation {
  if (input === "portrait" || input === "landscape") return input;
  // "mixed": mostly portrait (wall-art posters), with 1 in 3 landscape
  // (YouTube thumbnails/banners, e-commerce hero images).
  return index % 3 === 2 ? "landscape" : "portrait";
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  if (header === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

async function runPosterPipeline(count: number, orientationInput: OrientationInput) {
  await ensureHokusaiThemes();

  const themes = await prisma.posterTheme.findMany({
    where: { collection: HOKUSAI_COLLECTION },
    orderBy: { createdAt: "asc" },
  });
  if (themes.length === 0) {
    throw new Error("No Hokusai themes available");
  }

  // Rotate the starting theme each day so mornings vary.
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));

  const generated: { id: string; themeEn: string; orientation: string }[] = [];
  const errors: string[] = [];

  for (let i = 0; i < count; i++) {
    const theme = themes[(dayIndex + i) % themes.length];
    const orientation = pickOrientation(orientationInput, i);
    try {
      const generation = await prisma.posterGeneration.create({
        data: {
          themeId: theme.id,
          orientation,
          prompt: buildHokusaiPrompt(theme, orientation),
          status: "prompted",
        },
      });
      const updated = await renderPosterImage(generation);
      generated.push({ id: updated.id, themeEn: theme.themeEn, orientation });
    } catch (err) {
      errors.push(`${theme.themeEn}: ${err instanceof Error ? err.message : String(err)}`);
      // Stop early on auth/config errors (e.g. missing/invalid API key).
      if (err instanceof Error && /OPENAI_API_KEY|verif|401|403/i.test(err.message)) break;
    }
  }

  return { generated, errors };
}

async function handle(req: NextRequest, body: Record<string, unknown>) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rawCount = Number(body.count ?? 3);
  const count = Math.min(Math.max(Number.isFinite(rawCount) ? rawCount : 3, 1), MAX_COUNT);
  const rawOrientation = body.orientation;
  const orientation: OrientationInput =
    rawOrientation === "portrait" || rawOrientation === "landscape" ? rawOrientation : "mixed";

  try {
    const summary = await runPosterPipeline(count, orientation);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Poster pipeline failed";
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
  if (searchParams.get("orientation")) body.orientation = searchParams.get("orientation");
  return handle(req, body);
}
