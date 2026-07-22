import fs from "fs";
import path from "path";
import type OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient, getOutputImagesDir } from "@/lib/openai";
import { syncThemeStatus } from "@/lib/generation";
import type { PosterGeneration } from "@/generated/prisma/client";

/** Image model for posters. Default gpt-image-1; override with POSTER_IMAGE_MODEL. */
export function getPosterImageModel(): string {
  return process.env.POSTER_IMAGE_MODEL || "gpt-image-1";
}

function buildImageParams(model: string, prompt: string): OpenAI.Images.ImageGenerateParams {
  if (model.startsWith("gpt-image")) {
    return {
      model,
      prompt,
      n: 1,
      size: "1024x1536", // portrait; gpt-image-1 does not support 1024x1792
      quality: (process.env.POSTER_IMAGE_QUALITY || "high") as
        OpenAI.Images.ImageGenerateParams["quality"],
    };
  }
  // dall-e-3 and compatible
  return {
    model,
    prompt,
    n: 1,
    size: "1024x1792",
    quality: "hd",
    response_format: "url",
  };
}

/**
 * Render a poster image for a generation that already has a prompt:
 * call the configured image model, save the result under the output images
 * dir, and persist imagePath/imageUrl. Shared by the manual route and the cron.
 *
 * Handles both response shapes: gpt-image-1 returns base64 (b64_json),
 * dall-e-3 returns a temporary URL.
 */
export async function renderPosterImage(
  generation: PosterGeneration
): Promise<PosterGeneration> {
  if (!generation.prompt) {
    throw new Error("No prompt on this generation. Generate a prompt first.");
  }

  const openai = getOpenAIClient();
  const model = getPosterImageModel();
  // Non-streaming call; narrow away the streaming union member.
  const result = (await openai.images.generate(
    buildImageParams(model, generation.prompt)
  )) as OpenAI.Images.ImagesResponse;

  const first = result.data?.[0];
  let buffer: Buffer;
  let imageUrl = "";

  if (first?.b64_json) {
    buffer = Buffer.from(first.b64_json, "base64");
  } else if (first?.url) {
    imageUrl = first.url;
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error("Failed to download generated image");
    }
    buffer = Buffer.from(await imageRes.arrayBuffer());
  } else {
    throw new Error("No image returned from the image model");
  }

  const imagesDir = path.resolve(process.cwd(), getOutputImagesDir());
  fs.mkdirSync(imagesDir, { recursive: true });

  const filename = `${generation.id}.png`;
  const absPath = path.join(imagesDir, filename);
  fs.writeFileSync(absPath, buffer);

  const imagePath = path.join(getOutputImagesDir(), filename).replace(/\\/g, "/");

  const updated = await prisma.posterGeneration.update({
    where: { id: generation.id },
    data: { imagePath, imageUrl, status: "generated" },
  });

  await syncThemeStatus(generation.themeId, "generated");
  return updated;
}
