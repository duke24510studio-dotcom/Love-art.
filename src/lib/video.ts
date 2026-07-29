import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/openai";
import { getGenreLabel } from "@/lib/genres";
import { getVideoStyle } from "@/lib/video-style";
import {
  VIDEO_DISCLOSURE_JA,
  buildChapters,
  estimateSeconds,
  type VideoFormat,
} from "@/lib/video-presets";
import type { Article, VideoProject, VideoScene } from "@/generated/prisma/client";

// Article -> YouTube video planning.
//
// This module produces the PLAN: a narration script split into scenes, an image
// prompt per scene, and the YouTube listing metadata. Images (video-image.ts),
// narration audio (tts.ts) and the final encode (browser studio page) come
// after. Nothing is ever uploaded automatically — the same manual-review rule as
// every other pipeline in this app.
//
// Constants and timing helpers live in video-presets.ts so client components
// can import them without pulling Prisma into the browser bundle; they are
// re-exported here for existing server-side callers.
export * from "@/lib/video-presets";

export function getVideoModel(): string {
  return process.env.VIDEO_MODEL || process.env.ARTICLE_MODEL || "gpt-4o";
}

const FORMAT_SPEC: Record<VideoFormat, string> = {
  long: `Format: a narrated YouTube video, 16:9, aiming for roughly 4-6 minutes.
- Produce 10 to 14 scenes.
- Each scene's narration is 90-160 Japanese characters — one complete thought, spoken aloud comfortably in 15-25 seconds.
- Scene 1 is the hook: state the concrete situation the viewer recognises, and what they will get. No "チャンネル登録" begging, no "衝撃の事実" bait.
- The final scene closes quietly and invites a comment with a genuine question. Do NOT promise anything the video did not deliver.`,
  short: `Format: a YouTube Short, 9:16 vertical, under 60 seconds total.
- Produce 5 to 7 scenes.
- Each scene's narration is 30-55 Japanese characters — short, spoken in 5-9 seconds.
- Scene 1 must land the hook in the first 2 seconds with a concrete image, not a question like "知っていますか？".
- The last scene gives one takeaway. No cliffhanger bait, no "続きはプロフィールへ".`,
};

function buildSystemPrompt(format: VideoFormat, styleKey: string): string {
  const style = getVideoStyle(styleKey);
  return `You are a Japanese video director and scriptwriter who turns written articles into calm, honest, narrated YouTube videos. Your videos are the opposite of hype-driven content farms: no fear tactics, no fake urgency, no exaggerated claims, no selling.

${FORMAT_SPEC[format]}

NARRATION RULES:
- Japanese, 敬体 (です・ます), written to be SPOKEN: short clauses, natural breathing points, no bullet-point syntax, no markdown, no emoji, no parenthetical asides, no bracketed stage directions.
- Do not read the article aloud verbatim. Restructure it for listening: one idea per scene, concrete before abstract.
- Never invent facts, statistics, studies, prices, product specs, or personal experiences that are not in the source material.
- No medical, legal, or financial advice presented as professional guidance. No unqualified superlatives ("日本一", "絶対に", "必ず").
- Numbers and units must be written so a TTS engine reads them naturally.

PER-SCENE FIELDS:
- "heading": a 4-12 character Japanese label for this scene, used as a YouTube chapter name.
- "narration": the spoken text (see length rules above).
- "onScreenText": a very short caption burned onto the slide, max 22 Japanese characters, no punctuation at the end. It must summarise the scene, not repeat the narration word for word.
- "imagePrompt": an ENGLISH description of a single still image for this scene — subject, setting, light, mood, camera distance. Describe only what is visible. The image will be rendered in this house style, so do NOT restate the style: ${style.labelJa} (${style.fragment.slice(0, 120)}...). Never ask for text, letters, numbers, logos, brands, celebrities, or copyrighted characters in the image.
- "seconds": your estimate of the spoken length in seconds (integer).

YOUTUBE METADATA:
- "title": Japanese, 28-45 characters, concrete and honest. No 【】 spam, no ALL-CAPS, no "衝撃"/"ヤバい"/"神"-type bait.
- "description": Japanese, 300-600 characters. Open with 2-3 lines on what the video covers, then a short list of what the viewer takes away, then a closing line. Do NOT include chapter timestamps (they are generated separately) and do NOT include any URL, affiliate link, or call to buy anything. End with this exact line: "${VIDEO_DISCLOSURE_JA}"
- "tags": 8-12 comma-separated Japanese search phrases, no #, no brand names.
- "thumbnailText": 6-14 Japanese characters for the thumbnail. Bold and plain, no punctuation.
- "thumbnailPrompt": an ENGLISH still-image description for the thumbnail — simple, high-contrast, with a large empty area on one side where the thumbnail text will be placed. No text in the image itself.

Respond with valid JSON only, no markdown fences:
{
  "title": "...",
  "description": "...",
  "tags": "...",
  "hook": "one sentence describing the promise of this video, for internal use",
  "thumbnailText": "...",
  "thumbnailPrompt": "...",
  "scenes": [
    { "heading": "...", "narration": "...", "onScreenText": "...", "imagePrompt": "...", "seconds": 18 }
  ]
}`;
}

type PlanScene = {
  heading?: string;
  narration?: string;
  onScreenText?: string;
  imagePrompt?: string;
  seconds?: number;
};

type PlanPayload = {
  title: string;
  description: string;
  tags: string;
  hook?: string;
  thumbnailText?: string;
  thumbnailPrompt?: string;
  scenes: PlanScene[];
};

function parsePlanJson(raw: string): PlanPayload {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  const parsed = JSON.parse(trimmed) as PlanPayload;
  for (const key of ["title", "description", "tags"] as const) {
    if (!parsed[key] || typeof parsed[key] !== "string") {
      throw new Error(`Missing or invalid field in video plan: ${key}`);
    }
  }
  if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error("Video plan contains no scenes");
  }
  return parsed;
}

function ensureDisclosure(description: string): string {
  if (description.includes(VIDEO_DISCLOSURE_JA)) return description.trim();
  return `${description.trim()}\n\n${VIDEO_DISCLOSURE_JA}`;
}

export type CreateVideoInput = {
  article?: Article | null;
  topic?: string;
  genre?: string;
  format: VideoFormat;
  visualStyle: string;
  voice: string;
};

export type VideoProjectWithScenes = VideoProject & { scenes: VideoScene[] };

/** Plan one video (script + scenes + YouTube metadata) and persist it. */
export async function createVideoPlan(
  input: CreateVideoInput
): Promise<VideoProjectWithScenes> {
  const { article, format, visualStyle, voice } = input;
  const topic = input.topic?.trim() || article?.title || "";
  if (!topic && !article) {
    throw new Error("Either an article or a topic is required");
  }

  const genre = input.genre || article?.genre || article?.category || "";
  const genreLabel = genre ? getGenreLabel(genre) : "";

  const userPrompt = article
    ? [
        `Source article title: ${article.title}`,
        article.subtitle ? `Subtitle: ${article.subtitle}` : "",
        genreLabel ? `Genre: ${genreLabel}` : "",
        "",
        "Source article body (restructure it for listening — do not read it out verbatim):",
        article.body,
      ]
        .filter(Boolean)
        .join("\n")
    : [
        `Topic: ${topic}`,
        genreLabel ? `Genre: ${genreLabel}` : "",
        "There is no source article. Write the video from this topic alone, staying concrete and never inventing facts or statistics.",
      ]
        .filter(Boolean)
        .join("\n");

  const model = getVideoModel();
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: buildSystemPrompt(format, visualStyle) },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No video plan returned from OpenAI");
  const plan = parsePlanJson(content);

  const scenes = plan.scenes
    .filter((s) => (s.narration ?? "").trim())
    .map((s, i) => ({
      index: i,
      heading: (s.heading ?? "").trim().slice(0, 40),
      narration: (s.narration ?? "").trim(),
      onScreenText: (s.onScreenText ?? "").trim().slice(0, 40),
      imagePrompt: (s.imagePrompt ?? "").trim(),
      seconds: Math.min(Math.max(Math.round(s.seconds ?? 0) || estimateSeconds(s.narration ?? ""), 2), 60),
    }));

  if (scenes.length === 0) throw new Error("Video plan contains no usable scenes");

  return prisma.videoProject.create({
    data: {
      articleId: article?.id ?? null,
      format,
      visualStyle,
      voice,
      genre,
      topic,
      title: plan.title.trim(),
      description: ensureDisclosure(plan.description),
      tags: plan.tags.trim(),
      hook: (plan.hook ?? "").trim(),
      thumbnailText: (plan.thumbnailText ?? "").trim().slice(0, 40),
      thumbnailPrompt: (plan.thumbnailPrompt ?? "").trim(),
      chapters: buildChapters(scenes),
      model,
      status: "planned",
      scenes: { create: scenes },
    },
    include: { scenes: { orderBy: { index: "asc" } } },
  });
}

/** Recompute chapters after narration changed the real scene durations. */
export async function refreshChapters(projectId: string): Promise<void> {
  const scenes = await prisma.videoScene.findMany({
    where: { projectId },
    orderBy: { index: "asc" },
  });
  await prisma.videoProject.update({
    where: { id: projectId },
    data: { chapters: buildChapters(scenes) },
  });
}
