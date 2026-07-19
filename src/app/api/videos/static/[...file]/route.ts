import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getOutputVideosDir } from "@/lib/video";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
};

// Serve generated video assets from outputs/videos for the review UI.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string[] }> }
) {
  const { file } = await params;
  const baseDir = path.resolve(process.cwd(), getOutputVideosDir());
  const filePath = path.resolve(baseDir, ...file);

  // Prevent path traversal outside the videos output directory.
  if (!filePath.startsWith(baseDir + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const data = fs.readFileSync(filePath);
  return new NextResponse(data, {
    headers: { "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream" },
  });
}
