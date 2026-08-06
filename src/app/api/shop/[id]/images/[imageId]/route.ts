import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Detach a gallery image from a product. Only the link row is removed — the
// generated ImageAsset it points at stays available to the poster studio.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id, imageId } = await params;

  const image = await prisma.digitalProductImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.digitalProductImage.delete({ where: { id: imageId } });
  return NextResponse.json({ ok: true });
}
