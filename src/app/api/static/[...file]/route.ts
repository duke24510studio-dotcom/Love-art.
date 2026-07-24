import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getOutputImagesDir } from "@/lib/openai";
import { loadImage } from "@/lib/image-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string[] }> }
) {
  const { file } = await params;
  const relativePath = path.join(getOutputImagesDir(), ...file).replace(/\\/g, "/");

  const asset = await loadImage(relativePath);
  if (!asset) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(asset.data), {
    headers: { "Content-Type": asset.contentType },
  });
}
