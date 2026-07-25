import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { attachVelocity } from "@/lib/channel-research";
import { getVideoType, type VideoType } from "@/lib/youtube";

const RECENT_WINDOW_DAYS = 4;
const DEFAULT_PUBLISHED_WITHIN_DAYS = 7;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const sort = searchParams.get("sort") === "vph" ? "vph" : "views";
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 50) || 50, 200);
  const minViews = Math.max(Number(searchParams.get("minViews") ?? 0) || 0, 0);
  const type = searchParams.get("type") as VideoType | null;
  const publishedWithinDays =
    Math.min(Number(searchParams.get("publishedWithinDays") ?? DEFAULT_PUBLISHED_WITHIN_DAYS) || 0, 30) ||
    DEFAULT_PUBLISHED_WITHIN_DAYS;

  const since = new Date(Date.now() - RECENT_WINDOW_DAYS * 86_400_000);
  const publishedSince = new Date(Date.now() - publishedWithinDays * 86_400_000);

  const snapshots = await prisma.ytVideoSnapshot.findMany({
    where: {
      fetchedAt: { gte: since },
      publishedAt: { gte: publishedSince },
      ...(region && region !== "ALL" ? { regionCode: region } : {}),
    },
    orderBy: [{ videoId: "asc" }, { fetchedAt: "desc" }],
    distinct: ["videoId"],
  });

  let filtered = q
    ? snapshots.filter(
        (v) => v.title.toLowerCase().includes(q) || v.channelTitle.toLowerCase().includes(q)
      )
    : snapshots;

  if (minViews > 0) filtered = filtered.filter((v) => v.viewCount >= minViews);
  if (type) {
    filtered = filtered.filter(
      (v) => getVideoType(v.durationSec, v.liveBroadcastContent) === type
    );
  }

  filtered.sort((a, b) => (sort === "vph" ? b.vph - a.vph : b.viewCount - a.viewCount));

  const withVelocity = await attachVelocity(filtered.slice(0, limit));
  if (sort === "vph") withVelocity.sort((a, b) => b.vph - a.vph);

  return NextResponse.json(
    withVelocity.map((v) => ({
      ...v,
      videoType: getVideoType(v.durationSec, v.liveBroadcastContent),
    }))
  );
}
