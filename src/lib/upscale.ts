import sharp from "sharp";

export type UpscaleResult = { buffer: Buffer; width: number; height: number };

// Safety cap on the longest edge to avoid runaway memory on the server.
const MAX_EDGE = 8000;

function getScale(): number {
  const s = Number(process.env.UPSCALE_SCALE || 4);
  return Number.isFinite(s) && s >= 1 ? s : 4;
}

/**
 * Produce a print-resolution PNG from a generated poster image.
 *
 * Default provider is "local": a high-quality Lanczos upscale with a mild
 * sharpen — no external service, runs on the server, and holds up well for
 * flat-color ukiyo-e style art at typical poster sizes. Set UPSCALE_PROVIDER
 * to something else later to swap in an AI super-resolution provider.
 */
export async function upscaleToPrint(input: Buffer): Promise<UpscaleResult> {
  // Only "local" is wired up today; unknown providers fall back to local.
  return upscaleLocal(input);
}

async function upscaleLocal(input: Buffer): Promise<UpscaleResult> {
  const meta = await sharp(input).metadata();
  const scale = getScale();

  let targetW = Math.round((meta.width ?? 1024) * scale);
  let targetH = Math.round((meta.height ?? 1536) * scale);

  const longest = Math.max(targetW, targetH);
  if (longest > MAX_EDGE) {
    const k = MAX_EDGE / longest;
    targetW = Math.round(targetW * k);
    targetH = Math.round(targetH * k);
  }

  const buffer = await sharp(input)
    .resize(targetW, targetH, { kernel: "lanczos3", fit: "fill" })
    .sharpen({ sigma: 1 })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return { buffer, width: targetW, height: targetH };
}
