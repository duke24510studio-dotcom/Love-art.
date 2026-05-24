import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const generation = await prisma.posterGeneration.update({
    where: { id },
    data: {
      ...(body.prompt !== undefined ? { prompt: body.prompt } : {}),
      ...(body.imagePath !== undefined ? { imagePath: body.imagePath } : {}),
      ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
      ...(body.qualityScore !== undefined ? { qualityScore: body.qualityScore } : {}),
      ...(body.qualityComment !== undefined ? { qualityComment: body.qualityComment } : {}),
      ...(body.etsyTitle !== undefined ? { etsyTitle: body.etsyTitle } : {}),
      ...(body.etsyDescription !== undefined ? { etsyDescription: body.etsyDescription } : {}),
      ...(body.etsyTags !== undefined ? { etsyTags: body.etsyTags } : {}),
      ...(body.pinterestCaption !== undefined ? { pinterestCaption: body.pinterestCaption } : {}),
      ...(body.instagramCaption !== undefined ? { instagramCaption: body.instagramCaption } : {}),
      ...(body.xCaption !== undefined ? { xCaption: body.xCaption } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
  });

  return NextResponse.json(generation);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.posterGeneration.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
