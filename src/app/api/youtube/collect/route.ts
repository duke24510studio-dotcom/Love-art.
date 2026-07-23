import { NextRequest, NextResponse } from "next/server";
import { collectTrendingVideos } from "@/lib/channel-research";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const regions = Array.isArray(body.regions) ? (body.regions as string[]) : undefined;
    const result = await collectTrendingVideos(regions);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Collection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
