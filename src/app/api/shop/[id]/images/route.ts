import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeImageReference } from "@/lib/shop";

// Attach a gallery image to a product. The image itself is not uploaded here —
// it is referenced by its image-store path (a generated poster/mockup asset)
// or by an absolute https URL.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const imagePath = sanitizeImageReference(String(body.imagePath ?? ""));
  if (!imagePath) {
    return NextResponse.json({ error: "画像の指定が不正です" }, { status: 400 });
  }

  const product = await prisma.digitalProduct.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const last = await prisma.digitalProductImage.findFirst({
    where: { productId: id },
    orderBy: { sortOrder: "desc" },
  });

  const image = await prisma.digitalProductImage.create({
    data: {
      productId: id,
      imagePath,
      caption: String(body.caption ?? "").trim(),
      sortOrder: (last?.sortOrder ?? 0) + 10,
    },
  });

  return NextResponse.json(image, { status: 201 });
}
