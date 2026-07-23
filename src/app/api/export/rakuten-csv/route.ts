import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const approved = await prisma.productReview.findMany({
    where: { status: "approved" },
    include: { round: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "productName",
    "affiliateUrl",
    "weekNumber",
    "persona",
    "personaJa",
    "title",
    "body",
    "rating",
    "snsCaption",
    "roundImagePath",
  ];

  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

  const rows = approved.map((r) =>
    [
      escape(r.round.product.name),
      escape(r.round.product.affiliateUrl),
      escape(String(r.round.weekNumber)),
      escape(r.persona),
      escape(r.personaJa),
      escape(r.title),
      escape(r.body),
      escape(String(r.rating)),
      escape(r.snsCaption),
      escape(r.round.imagePath),
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rakuten-reviews-export-${Date.now()}.csv"`,
    },
  });
}
