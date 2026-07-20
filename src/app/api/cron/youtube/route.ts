import { NextRequest, NextResponse } from "next/server";
import { refreshTrackedVideos } from "@/lib/youtube";

// Snapshot stats for all tracked videos, meant to be hit by an external cron
// (e.g. every 6 hours) so day-over-day view growth can be computed.

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  if (header === `Bearer ${secret}`) return true;
  // Fallback for cron services that cannot set headers
  return new URL(req.url).searchParams.get("secret") === secret;
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await refreshTrackedVideos();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "YouTube refresh failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
