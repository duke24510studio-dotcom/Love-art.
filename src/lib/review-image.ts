import fs from "fs";
import path from "path";
import OpenAI, { toFile } from "openai";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient, getOutputImagesDir } from "@/lib/openai";
import type { RakutenProduct, ReviewRound } from "@/generated/prisma/client";

/** Image model for review lifestyle photos. Default gpt-image-1; override with RAKUTEN_IMAGE_MODEL. */
export function getReviewImageModel(): string {
  return process.env.RAKUTEN_IMAGE_MODEL || "gpt-image-1";
}

// Rotates through natural home-life scenes so weekly rounds don't repeat.
const SCENE_PROMPTS = [
  "a bright, tidy Japanese home living room in soft morning light, the product placed naturally as if just unboxed and being tried for the first time",
  "a warm kitchen counter scene, the product being used mid-way through a real daily routine",
  "a cozy home desk / work-from-home setup, the product in natural everyday use",
  "a genkan (entryway) or bedroom scene with soft afternoon light, the product in relaxed everyday use",
  "a casual weekend scene at home, the product being wrapped or handed over as a small gift to a family member",
];

export function pickScenePrompt(weekNumber: number): string {
  return SCENE_PROMPTS[(Math.max(weekNumber, 1) - 1) % SCENE_PROMPTS.length];
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`商品画像のダウンロードに失敗しました (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function buildEditPrompt(product: RakutenProduct, weekNumber: number): string {
  return [
    "Create a single realistic, natural-light lifestyle photo that features this exact product.",
    "Keep the product's real design, label text, and packaging accurate — do not invent a different product or alter its branding.",
    `Scene: ${pickScenePrompt(weekNumber)}.`,
    `Product context: ${product.name || "a Japanese e-commerce product"}.`,
    "Style: authentic candid smartphone-style photography, believable home setting, soft natural light, no added text overlays, no invented logos or brand names, no close-up of any person's face (hands or partial body are fine).",
  ].join(" ");
}

/**
 * Generate one AI lifestyle photo for a review round by editing the
 * product's own source image (openai.images.edit). Best-effort: callers
 * should tolerate failure (e.g. missing source image, model error) the same
 * way the poster pipeline tolerates print-upscale failures.
 */
export async function generateRoundImage(
  round: ReviewRound,
  product: RakutenProduct
): Promise<ReviewRound> {
  if (!product.imageUrl) {
    throw new Error("商品に元画像がないため、画像生成をスキップしました");
  }

  const openai = getOpenAIClient();
  const model = getReviewImageModel();
  const sourceBuffer = await downloadImage(product.imageUrl);
  const sourceFile = await toFile(sourceBuffer, "product.png", { type: "image/png" });

  const result = (await openai.images.edit({
    model,
    image: sourceFile,
    prompt: buildEditPrompt(product, round.weekNumber),
    size: "1024x1024",
    n: 1,
  })) as OpenAI.Images.ImagesResponse;

  const first = result.data?.[0];
  let buffer: Buffer;
  if (first?.b64_json) {
    buffer = Buffer.from(first.b64_json, "base64");
  } else if (first?.url) {
    const imageRes = await fetch(first.url);
    if (!imageRes.ok) throw new Error("生成された画像のダウンロードに失敗しました");
    buffer = Buffer.from(await imageRes.arrayBuffer());
  } else {
    throw new Error("画像モデルから画像が返されませんでした");
  }

  const imagesDir = path.resolve(process.cwd(), getOutputImagesDir());
  fs.mkdirSync(imagesDir, { recursive: true });
  const filename = `review-${round.id}.png`;
  fs.writeFileSync(path.join(imagesDir, filename), buffer);
  const imagePath = path.join(getOutputImagesDir(), filename).replace(/\\/g, "/");

  return prisma.reviewRound.update({
    where: { id: round.id },
    data: { imagePath },
  });
}
