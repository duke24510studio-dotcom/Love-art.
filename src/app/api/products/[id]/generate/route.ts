import { NextRequest, NextResponse } from "next/server";
import { generateNextRound } from "@/lib/review-round";

// Manually trigger this product's next weekly review round right now
// (bootstrapping week 1, or catching up ahead of the weekly cron).
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const round = await generateNextRound(id);
    return NextResponse.json(round, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Round generation failed";
    const status = /見つかりません/.test(message) ? 404 : /OPENAI_API_KEY/.test(message) ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
