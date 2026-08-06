import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type ShopAsset = {
  path: string;
  label: string;
  kind: "poster" | "mockup";
  createdAt: string;
};

// Lists generated images that can be attached to a shop listing, so the
// storefront can sell what the poster pipeline produces without re-uploading
// anything. Read-only; lives outside /api/shop/[id] to avoid a dynamic-segment
// collision with a product id.
export async function GET(req: NextRequest) {
  const limitParam = Number(req.nextUrl.searchParams.get("limit"));
  const take = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 60;

  const [generations, mockups] = await Promise.all([
    prisma.posterGeneration.findMany({
      where: { imagePath: { not: "" } },
      orderBy: { createdAt: "desc" },
      take,
      include: { theme: { select: { themeEn: true, themeJa: true } } },
    }),
    prisma.posterMockup.findMany({
      where: { imagePath: { not: "" } },
      orderBy: { createdAt: "desc" },
      take,
    }),
  ]);

  const assets: ShopAsset[] = [
    ...generations.map((gen) => ({
      path: gen.imagePath,
      label: `${gen.theme.themeEn || gen.theme.themeJa} · ${gen.orientation}`,
      kind: "poster" as const,
      createdAt: gen.createdAt.toISOString(),
    })),
    ...mockups.map((mockup) => ({
      path: mockup.imagePath,
      label: `Mockup · ${mockup.label || mockup.scene}`,
      kind: "mockup" as const,
      createdAt: mockup.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, take);

  return NextResponse.json(assets);
}
