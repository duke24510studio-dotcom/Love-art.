import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const collection = searchParams.get("collection");
  const status = searchParams.get("status");

  const themes = await prisma.posterTheme.findMany({
    where: {
      ...(collection ? { collection } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      generations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return NextResponse.json(themes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const theme = await prisma.posterTheme.create({
    data: {
      collection: body.collection,
      themeJa: body.themeJa,
      themeEn: body.themeEn,
      verticalTextJa: body.verticalTextJa,
      subtitleEn: body.subtitleEn,
      motif: body.motif,
      colorPalette: body.colorPalette,
      stylePreset: body.stylePreset ?? "",
      status: "idea",
    },
  });

  return NextResponse.json(theme, { status: 201 });
}
