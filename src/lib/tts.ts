import path from "path";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient, getOutputAudioDir } from "@/lib/openai";
import { saveImage } from "@/lib/image-store";
import { mp3Duration } from "@/lib/mp3-duration";
import { estimateSeconds } from "@/lib/video";
import type { VideoProject, VideoScene } from "@/generated/prisma/client";

/** TTS model for narration. gpt-4o-mini-tts follows tone instructions. */
export function getTtsModel(): string {
  return process.env.TTS_MODEL || "gpt-4o-mini-tts";
}

const TONE_INSTRUCTIONS = `落ち着いた日本語のナレーションとして読んでください。
- 話速はややゆっくり。句読点でしっかり間を取る。
- 感情を作りすぎず、低めのトーンで穏やかに。
- 語尾を上げすぎない。宣伝のような明るさは出さない。`;

/** Synthesize one scene's narration and store the mp3 in the blob store. */
export async function renderSceneNarration(
  project: VideoProject,
  scene: VideoScene
): Promise<VideoScene> {
  const text = scene.narration.trim();
  if (!text) throw new Error(`Scene ${scene.index + 1} has no narration text`);

  const openai = getOpenAIClient();
  const response = await openai.audio.speech.create({
    model: getTtsModel(),
    voice: project.voice || "alloy",
    input: text,
    instructions: TONE_INSTRUCTIONS,
    response_format: "mp3",
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  const audioPath = path
    .join(getOutputAudioDir(), `${scene.id}.mp3`)
    .replace(/\\/g, "/");
  await saveImage(audioPath, buffer);

  // Fall back to the text-length estimate if the file can't be parsed, so
  // timings stay usable rather than collapsing to zero.
  const measured = mp3Duration(buffer);
  const audioSeconds = measured > 0 ? measured : estimateSeconds(text);

  return prisma.videoScene.update({
    where: { id: scene.id },
    data: { audioPath, audioSeconds },
  });
}

export type NarrationResult = {
  rendered: number;
  skipped: number;
  errors: string[];
};

/** Narrate every scene missing audio. Sequential — same reason as the images. */
export async function renderMissingNarration(
  project: VideoProject,
  scenes: VideoScene[],
  { force = false }: { force?: boolean } = {}
): Promise<NarrationResult> {
  const result: NarrationResult = { rendered: 0, skipped: 0, errors: [] };

  for (const scene of scenes) {
    if (scene.audioPath && !force) {
      result.skipped += 1;
      continue;
    }
    try {
      await renderSceneNarration(project, scene);
      result.rendered += 1;
    } catch (err) {
      result.errors.push(
        `Scene ${scene.index + 1}: ${err instanceof Error ? err.message : String(err)}`
      );
      break;
    }
  }

  return result;
}
