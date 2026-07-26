import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sanitizeExternalUrl,
  sanitizeImageReference,
  slugifyShop,
} from "@/lib/shop";

export async function GET() {
  const products = await prisma.digitalProduct.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const rawSlug = typeof body.slug === "string" && body.slug.trim() ? body.slug : title;
  const slug = slugifyShop(rawSlug);
  if (!slug) {
    return NextResponse.json(
      { error: "slugを自動生成できませんでした。手動で入力してください（a-z, 0-9, -）" },
      { status: 400 }
    );
  }

  const existing = await prisma.digitalProduct.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: `このslugは既に使われています: ${slug}` }, { status: 409 });
  }

  const coverImage = sanitizeImageReference(String(body.coverImage ?? ""));
  if (coverImage === null) {
    return NextResponse.json({ error: "カバー画像の指定が不正です" }, { status: 400 });
  }

  const rawCheckout = String(body.checkoutUrl ?? "").trim();
  const checkoutUrl = rawCheckout ? sanitizeExternalUrl(rawCheckout) : "";
  if (checkoutUrl === null) {
    return NextResponse.json({ error: "購入リンクは http(s) のURLを指定してください" }, { status: 400 });
  }

  const product = await prisma.digitalProduct.create({
    data: {
      slug,
      title,
      tagline: String(body.tagline ?? "").trim(),
      description: String(body.description ?? "").trim(),
      category: String(body.category ?? "").trim(),
      price: Number.isFinite(Number(body.price)) ? Math.max(0, Math.trunc(Number(body.price))) : 0,
      currency: String(body.currency ?? "JPY").trim() || "JPY",
      coverImage,
      checkoutUrl,
      fileFormat: String(body.fileFormat ?? "").trim(),
      includes: String(body.includes ?? "").trim(),
      featured: Boolean(body.featured),
      published: body.published !== false,
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
