import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REVIEW_STATUSES } from "@/lib/review";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (
    body.status !== undefined &&
    !REVIEW_STATUSES.includes(body.status as (typeof REVIEW_STATUSES)[number])
  ) {
    return NextResponse.json(
      { error: `status must be one of: ${REVIEW_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const review = await prisma.productReview.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.body !== undefined ? { body: body.body } : {}),
      ...(body.snsCaption !== undefined ? { snsCaption: body.snsCaption } : {}),
      ...(body.rating !== undefined ? { rating: Math.min(5, Math.max(1, Number(body.rating))) } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
  });

  return NextResponse.json(review);
}
