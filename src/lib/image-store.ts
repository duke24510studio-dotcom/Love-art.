import { prisma } from "@/lib/prisma";

// The table is called ImageAsset for historical reasons, but it is really the
// app's binary blob store — narration audio for the video studio lives here too
// (see src/lib/tts.ts).
const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
};

function contentTypeFor(relativePath: string): string {
  const ext = relativePath.slice(relativePath.lastIndexOf(".")).toLowerCase();
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

// Image saves/loads typically run right after a 60-90s OpenAI image call,
// long enough for a pooled Postgres connection to have gone stale (observed
// live as "Connection terminated unexpectedly"). One retry is enough since
// Prisma opens a fresh connection on the next attempt.
async function withConnectionRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!/connection.*terminated|closed|econnreset/i.test(message)) throw err;
    return fn();
  }
}

/**
 * Save an image's bytes to Postgres, keyed by the same relative path string
 * (e.g. "outputs/images/xxx.png") that used to be a real file path. Render's
 * free web-service plan has no persistent disk, so local files don't survive
 * a redeploy — the DB is the only storage that does.
 */
export async function saveImage(relativePath: string, data: Uint8Array): Promise<void> {
  // Prisma's Bytes field wants a concrete Uint8Array<ArrayBuffer>; a plain
  // Buffer is typed Uint8Array<ArrayBufferLike>, so make a fresh copy.
  const bytes = new Uint8Array(data);
  await withConnectionRetry(() =>
    prisma.imageAsset.upsert({
      where: { path: relativePath },
      create: { path: relativePath, data: bytes, contentType: contentTypeFor(relativePath) },
      update: { data: bytes, contentType: contentTypeFor(relativePath) },
    })
  );
}

export async function loadImage(
  relativePath: string
): Promise<{ data: Uint8Array; contentType: string } | null> {
  const asset = await withConnectionRetry(() =>
    prisma.imageAsset.findUnique({ where: { path: relativePath } })
  );
  if (!asset) return null;
  return { data: asset.data, contentType: asset.contentType };
}
