import { NextRequest, NextResponse } from "next/server";
import { searchYoutubeTrends, type YoutubeOrder } from "@/lib/youtube";

const ORDERS: YoutubeOrder[] = ["views", "likeRate", "viewsPerDay", "growth"];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const query = typeof body.query === "string" ? body.query : "";
    if (!query.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const order = body.order as YoutubeOrder | undefined;
    if (order && !ORDERS.includes(order)) {
      return NextResponse.json(
        { error: `order must be one of: ${ORDERS.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await searchYoutubeTrends({
      query,
      publishedWithinDays: body.publishedWithinDays ? Number(body.publishedWithinDays) : undefined,
      excludeShorts: body.excludeShorts === undefined ? undefined : Boolean(body.excludeShorts),
      regionCode:
        typeof body.regionCode === "string" && body.regionCode.trim()
          ? body.regionCode.trim().toUpperCase()
          : undefined,
      top: body.top ? Number(body.top) : undefined,
      order,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "YouTube search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
