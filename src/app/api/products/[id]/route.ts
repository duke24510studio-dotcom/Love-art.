import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PRODUCT_STATUSES = ["active", "paused", "archived"] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.rakutenProduct.findUnique({
    where: { id },
    include: {
      rounds: {
        orderBy: { weekNumber: "desc" },
        include: { reviews: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (
    body.status !== undefined &&
    !PRODUCT_STATUSES.includes(body.status as (typeof PRODUCT_STATUSES)[number])
  ) {
    return NextResponse.json(
      { error: `status must be one of: ${PRODUCT_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const product = await prisma.rakutenProduct.update({
    where: { id },
    data: {
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.affiliateUrl !== undefined ? { affiliateUrl: body.affiliateUrl } : {}),
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.rakutenProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
