import { NextRequest, NextResponse } from "next/server";
import { getRapidlyGrowingChannels } from "@/lib/channel-research";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lookbackDays = Math.min(Number(searchParams.get("days") ?? 7) || 7, 30);
  const limit = Math.min(Number(searchParams.get("limit") ?? 25) || 25, 100);

  const growth = await getRapidlyGrowingChannels(lookbackDays, limit);
  return NextResponse.json(growth);
}
