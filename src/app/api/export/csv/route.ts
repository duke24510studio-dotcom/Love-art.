import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const approved = await prisma.posterGeneration.findMany({
    where: { status: "approved" },
    include: { theme: true },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "title",
    "description",
    "tags",
    "price",
    "imagePath",
    "collection",
    "themeEn",
    "themeJa",
    "verticalTextJa",
    "subtitleEn",
    "instagramCaption",
    "pinterestCaption",
    "xCaption",
  ];

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;

  const rows = approved.map((g) =>
    [
      escape(g.etsyTitle),
      escape(g.etsyDescription),
      escape(g.etsyTags),
      escape("9.99"),
      escape(g.imagePath),
      escape(g.theme.collection),
      escape(g.theme.themeEn),
      escape(g.theme.themeJa),
      escape(g.theme.verticalTextJa),
      escape(g.theme.subtitleEn),
      escape(g.instagramCaption),
      escape(g.pinterestCaption),
      escape(g.xCaption),
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="etsy-export-${Date.now()}.csv"`,
    },
  });
}
