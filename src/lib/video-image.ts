import path from "path";
import type OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient, getOutputImagesDir } from "@/lib/openai";
import { saveImage } from "@/lib/image-store";
import { buildScenePrompt } from "@/lib/video-style";
import type { VideoProject, VideoScene } from "@/generated/prisma/client";

/** Image model for video stills. Shares POSTER_IMAGE_MODEL by default. */
export function getVideoImageModel(): string {
  return process.env.VIDEO_IMAGE_MODEL || process.env.POSTER_IMAGE_MODEL || "gpt-image-1";
}

function buildImageParams(
  model: string,
  prompt: string,
  format: string
): OpenAI.Images.ImageGenerateParams {
  const vertical = format === "short";

  if (model.startsWith("gpt-image")) {
    return {
      model,
      prompt,
      n: 1,
      // gpt-image-1 supports 1536x1024 / 1024x1536; the browser renderer
      // letterboxes to exact 16:9 / 9:16, so these are close enough.
      size: vertical ? "1024x1536" : "1536x1024",
      quality: (process.env.VIDEO_IMAGE_QUALITY || "medium") as
        OpenAI.Images.ImageGenerateParams["quality"],
    };
  }
  return {
    model,
    prompt,
    n: 1,
    size: vertical ? "1024x1792" : "1792x1024",
    quality: "standard",
    response_format: "url",
  };
}

async function generateOne(prompt: string, format: string): Promise<Buffer> {
  const openai = getOpenAIClient();
  const model = getVideoImageModel();
  const result = (await openai.images.generate(
    buildImageParams(model, prompt, format)
  )) as OpenAI.Images.ImagesResponse;

  const first = result.data?.[0];
  if (first?.b64_json) return Buffer.from(first.b64_json, "base64");
  if (first?.url) {
    const res = await fetch(first.url);
    if (!res.ok) throw new Error("Failed to download generated image");
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error("No image returned from the image model");
}

/** Render (or re-render) the still for one scene. */
export async function renderSceneImage(
  project: VideoProject,
  scene: VideoScene
): Promise<VideoScene> {
  if (!scene.imagePrompt) {
    throw new Error(`Scene ${scene.index + 1} has no image prompt`);
  }
  const prompt = buildScenePrompt(scene.imagePrompt, project.visualStyle, project.format);
  const buffer = await generateOne(prompt, project.format);

  const imagePath = path
    .join(getOutputImagesDir(), `video-${scene.id}.png`)
    .replace(/\\/g, "/");
  await saveImage(imagePath, buffer);

  return prisma.videoScene.update({
    where: { id: scene.id },
    data: { imagePath },
  });
}

/** Render the thumbnail still (text is overlaid later, not baked in). */
export async function renderThumbnail(project: VideoProject): Promise<VideoProject> {
  if (!project.thumbnailPrompt) {
    throw new Error("This project has no thumbnail prompt");
  }
  const prompt = buildScenePrompt(
    project.thumbnailPrompt,
    project.visualStyle,
    project.format
  );
  const buffer = await generateOne(prompt, project.format);

  const thumbnailPath = path
    .join(getOutputImagesDir(), `video-thumb-${project.id}.png`)
    .replace(/\\/g, "/");
  await saveImage(thumbnailPath, buffer);

  return prisma.videoProject.update({
    where: { id: project.id },
    data: { thumbnailPath },
  });
}

export type SceneImageResult = {
  rendered: number;
  skipped: number;
  errors: string[];
};

/**
 * Render stills for every scene that doesn't have one yet. Sequential on
 * purpose: image calls are slow and the free Render instance has 512MB, so
 * parallel requests risk both rate limits and an OOM kill.
 */
export async function renderMissingSceneImages(
  project: VideoProject,
  scenes: VideoScene[],
  { force = false, limit = 20 }: { force?: boolean; limit?: number } = {}
): Promise<SceneImageResult> {
  const result: SceneImageResult = { rendered: 0, skipped: 0, errors: [] };

  for (const scene of scenes) {
    if (result.rendered >= limit) break;
    if (scene.imagePath && !force) {
      result.skipped += 1;
      continue;
    }
    try {
      await renderSceneImage(project, scene);
      result.rendered += 1;
    } catch (err) {
      result.errors.push(
        `Scene ${scene.index + 1}: ${err instanceof Error ? err.message : String(err)}`
      );
      break; // stop on the first failure (usually quota / API key)
    }
  }

  return result;
}
