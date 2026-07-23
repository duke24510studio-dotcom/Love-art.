import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ROUND_STATUSES } from "@/lib/review";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const round = await prisma.reviewRound.findUnique({
    where: { id },
    include: { reviews: true, product: true },
  });
  if (!round) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(round);
}

// Bulk status update for the round (and, unless the caller overrides
// individual reviews separately, all reviews inside it) — e.g. approve or
// reject a whole week's batch at once.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (
    body.status !== undefined &&
    !ROUND_STATUSES.includes(body.status as (typeof ROUND_STATUSES)[number])
  ) {
    return NextResponse.json(
      { error: `status must be one of: ${ROUND_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const round = await prisma.reviewRound.update({
    where: { id },
    data: { ...(body.status !== undefined ? { status: body.status } : {}) },
  });

  if (body.status !== undefined && body.applyToReviews) {
    await prisma.productReview.updateMany({
      where: { roundId: id },
      data: { status: body.status },
    });
  }

  return NextResponse.json(round);
}
