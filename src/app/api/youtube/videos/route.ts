import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RECENT_WINDOW_DAYS = 4;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const sort = searchParams.get("sort") === "vph" ? "vph" : "views";
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 50) || 50, 200);

  const since = new Date(Date.now() - RECENT_WINDOW_DAYS * 86_400_000);

  const snapshots = await prisma.ytVideoSnapshot.findMany({
    where: {
      fetchedAt: { gte: since },
      ...(region && region !== "ALL" ? { regionCode: region } : {}),
    },
    orderBy: [{ videoId: "asc" }, { fetchedAt: "desc" }],
    distinct: ["videoId"],
  });

  const filtered = q
    ? snapshots.filter(
        (v) =>
          v.title.toLowerCase().includes(q) || v.channelTitle.toLowerCase().includes(q)
      )
    : snapshots;

  filtered.sort((a, b) => (sort === "vph" ? b.vph - a.vph : b.viewCount - a.viewCount));

  return NextResponse.json(filtered.slice(0, limit));
}
