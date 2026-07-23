import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupRakutenItem } from "@/lib/rakuten";

export async function GET() {
  const products = await prisma.rakutenProduct.findMany({
    orderBy: { createdAt: "desc" },
    include: { rounds: { orderBy: { weekNumber: "desc" }, take: 1 } },
  });
  return NextResponse.json(products);
}

// Register a new tracked product from its Rakuten item URL. Weekly review
// rounds are generated later (manually via POST /api/products/[id]/generate,
// or by the weekly cron) — registering just looks the product up and saves it.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const itemUrl = typeof body.itemUrl === "string" ? body.itemUrl.trim() : "";
  if (!itemUrl) {
    return NextResponse.json({ error: "itemUrl is required" }, { status: 400 });
  }

  try {
    const item = await lookupRakutenItem(itemUrl);
    const existing = await prisma.rakutenProduct.findUnique({ where: { itemUrl: item.itemUrl } });
    if (existing) {
      return NextResponse.json({ error: "この商品はすでに登録されています" }, { status: 409 });
    }

    const product = await prisma.rakutenProduct.create({
      data: {
        itemUrl: item.itemUrl,
        itemCode: item.itemCode,
        shopCode: item.shopCode,
        shopName: item.shopName,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        catchcopy: item.catchcopy,
        itemCaption: item.itemCaption,
        genreName: item.genreName,
        reviewAverage: item.reviewAverage,
        reviewCount: item.reviewCount,
        affiliateUrl: item.affiliateUrl,
        status: "active",
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to register product";
    const status = /RAKUTEN_APP_ID/.test(message) ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
