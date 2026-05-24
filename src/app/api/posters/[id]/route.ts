import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const theme = await prisma.posterTheme.findUnique({
    where: { id },
    include: {
      generations: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!theme) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(theme);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const theme = await prisma.posterTheme.update({
    where: { id },
    data: {
      ...(body.collection !== undefined ? { collection: body.collection } : {}),
      ...(body.themeJa !== undefined ? { themeJa: body.themeJa } : {}),
      ...(body.themeEn !== undefined ? { themeEn: body.themeEn } : {}),
      ...(body.verticalTextJa !== undefined ? { verticalTextJa: body.verticalTextJa } : {}),
      ...(body.subtitleEn !== undefined ? { subtitleEn: body.subtitleEn } : {}),
      ...(body.motif !== undefined ? { motif: body.motif } : {}),
      ...(body.colorPalette !== undefined ? { colorPalette: body.colorPalette } : {}),
      ...(body.stylePreset !== undefined ? { stylePreset: body.stylePreset } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
    include: {
      generations: { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json(theme);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.posterTheme.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
