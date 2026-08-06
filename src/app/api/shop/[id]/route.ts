import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sanitizeExternalUrl,
  sanitizeImageReference,
  slugifyShop,
} from "@/lib/shop";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.digitalProduct.findUnique({
    where: { id },
    include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
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

  let slug: string | undefined;
  if (body.slug !== undefined) {
    slug = slugifyShop(String(body.slug));
    if (!slug) {
      return NextResponse.json({ error: "無効なslugです（a-z, 0-9, - のみ）" }, { status: 400 });
    }
    const existing = await prisma.digitalProduct.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `このslugは既に使われています: ${slug}` }, { status: 409 });
    }
  }

  let coverImage: string | undefined;
  if (body.coverImage !== undefined) {
    const cleaned = sanitizeImageReference(String(body.coverImage));
    if (cleaned === null) {
      return NextResponse.json({ error: "カバー画像の指定が不正です" }, { status: 400 });
    }
    coverImage = cleaned;
  }

  let checkoutUrl: string | undefined;
  if (body.checkoutUrl !== undefined) {
    const raw = String(body.checkoutUrl).trim();
    if (!raw) {
      checkoutUrl = "";
    } else {
      const cleaned = sanitizeExternalUrl(raw);
      if (cleaned === null) {
        return NextResponse.json(
          { error: "購入リンクは http(s) のURLを指定してください" },
          { status: 400 }
        );
      }
      checkoutUrl = cleaned;
    }
  }

  const product = await prisma.digitalProduct.update({
    where: { id },
    data: {
      ...(slug !== undefined ? { slug } : {}),
      ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
      ...(body.tagline !== undefined ? { tagline: String(body.tagline) } : {}),
      ...(body.description !== undefined ? { description: String(body.description) } : {}),
      ...(body.category !== undefined ? { category: String(body.category) } : {}),
      ...(body.price !== undefined
        ? { price: Number.isFinite(Number(body.price)) ? Math.max(0, Math.trunc(Number(body.price))) : 0 }
        : {}),
      ...(body.currency !== undefined ? { currency: String(body.currency) || "JPY" } : {}),
      ...(coverImage !== undefined ? { coverImage } : {}),
      ...(checkoutUrl !== undefined ? { checkoutUrl } : {}),
      ...(body.fileFormat !== undefined ? { fileFormat: String(body.fileFormat) } : {}),
      ...(body.includes !== undefined ? { includes: String(body.includes) } : {}),
      ...(body.featured !== undefined ? { featured: Boolean(body.featured) } : {}),
      ...(body.published !== undefined ? { published: Boolean(body.published) } : {}),
      ...(body.sortOrder !== undefined
        ? { sortOrder: Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0 }
        : {}),
    },
    include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });

  return NextResponse.json(product);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Gallery rows cascade with the product (see schema). The underlying
  // ImageAsset rows are shared with the poster studio and are deliberately
  // left alone — deleting a listing must not destroy the generated asset.
  await prisma.digitalProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
