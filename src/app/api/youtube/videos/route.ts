import { NextRequest, NextResponse } from "next/server";
import { listSavedVideos, refreshTrackedVideos, type YoutubeOrder } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videos = await listSavedVideos({
      trackedOnly: searchParams.get("tracked") === "true",
      order: (searchParams.get("order") as YoutubeOrder | null) ?? undefined,
    });
    return NextResponse.json(videos);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list videos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Re-fetch stats + snapshot for all tracked videos (manual refresh button). */
export async function POST() {
  try {
    const result = await refreshTrackedVideos();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refresh failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
