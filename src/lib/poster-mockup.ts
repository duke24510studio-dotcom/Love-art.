import path from "path";
import type OpenAI from "openai";
import { toFile } from "openai";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient, getOutputImagesDir } from "@/lib/openai";
import { saveImage, loadImage } from "@/lib/image-store";
import type { PosterGeneration, PosterTheme } from "@/generated/prisma/client";
import { MOCKUP_SCENES, type MockupSceneKey } from "@/lib/poster-mockup-scenes";

export { MOCKUP_SCENES, isMockupSceneKey, type MockupSceneKey } from "@/lib/poster-mockup-scenes";

/** Image model for room mockups. Default gpt-image-1; override with POSTER_MOCKUP_MODEL. */
export function getMockupImageModel(): string {
  return process.env.POSTER_MOCKUP_MODEL || process.env.POSTER_IMAGE_MODEL || "gpt-image-1";
}

function buildEditPrompt(
  scene: (typeof MOCKUP_SCENES)[number],
  theme: PosterTheme
): string {
  return [
    "Create a single ultra-realistic, professional interior product photography image, like a high-end Etsy listing photo.",
    "Take this exact wall art poster image and place it accurately, unaltered — preserve its exact composition, colors, and text — as if it were printed and framed.",
    `The poster ("${theme.themeEn}" / ${theme.subtitleEn}) is ${scene.scenePrompt}.`,
    "Style: photorealistic lifestyle/product photography, natural lighting, magazine-quality styling that makes the artwork feel desirable and premium to a buyer. No added text overlays, no watermarks.",
  ].join(" ");
}

/**
 * Generate one room-mockup photo for a poster generation by editing its own
 * approved image (openai.images.edit) — same technique as ReviewRound's
 * lifestyle photos (src/lib/review-image.ts). Best-effort per scene: callers
 * should tolerate individual failures across a batch.
 */
export async function generateMockup(
  generation: PosterGeneration & { theme: PosterTheme },
  sceneKey: MockupSceneKey
) {
  const scene = MOCKUP_SCENES.find((s) => s.key === sceneKey);
  if (!scene) throw new Error(`Unknown mockup scene: ${sceneKey}`);
  if (!generation.imagePath) {
    throw new Error("This poster has no generated image yet.");
  }

  const source = await loadImage(generation.imagePath);
  if (!source) {
    throw new Error("This poster's source image could not be found in storage.");
  }
  const sourceFile = await toFile(source.data, "poster.png", { type: "image/png" });

  const openai = getOpenAIClient();
  const model = getMockupImageModel();

  const result = (await openai.images.edit({
    model,
    image: sourceFile,
    prompt: buildEditPrompt(scene, generation.theme),
    size: "1024x1024",
    n: 1,
  })) as OpenAI.Images.ImagesResponse;

  const first = result.data?.[0];
  let buffer: Buffer;
  if (first?.b64_json) {
    buffer = Buffer.from(first.b64_json, "base64");
  } else if (first?.url) {
    const imageRes = await fetch(first.url);
    if (!imageRes.ok) throw new Error("Failed to download generated mockup image");
    buffer = Buffer.from(await imageRes.arrayBuffer());
  } else {
    throw new Error("No image returned from the image model");
  }

  const filename = `mockup-${generation.id}-${scene.key}.png`;
  const imagePath = path.join(getOutputImagesDir(), filename).replace(/\\/g, "/");
  await saveImage(imagePath, buffer);

  return prisma.posterMockup.upsert({
    where: { generationId_scene: { generationId: generation.id, scene: scene.key } },
    create: { generationId: generation.id, scene: scene.key, label: scene.label, imagePath },
    update: { imagePath },
  });
}
