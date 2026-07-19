import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/openai";
import type { VideoProject, VideoScene } from "@/generated/prisma/client";

// --- Japandi faceless YouTube video pipeline ---
// Script -> narration audio (TTS) -> scene visuals -> ffmpeg assembly.
// Everything stays a local draft; uploading to YouTube is manual by design.

export const VIDEO_DISCLOSURE =
  "This video was created with the help of AI tools (script, narration, and visuals) and was reviewed, curated, and edited by a human.";

export const VIDEO_STATUSES = [
  "idea",
  "scripted",
  "voiced",
  "visualized",
  "assembled",
  "review",
  "approved",
  "exported",
  "rejected",
] as const;

export type VideoStatus = (typeof VIDEO_STATUSES)[number];

// Calm narration voices supported by the OpenAI TTS API.
export const VIDEO_VOICES = ["onyx", "echo", "alloy", "ash", "sage", "shimmer"] as const;

// Content pillars for the channel, each with evergreen topic ideas.
export const VIDEO_PILLARS: {
  id: string;
  label: string;
  topics: string[];
}[] = [
  {
    id: "morning-routine",
    label: "Morning / Evening Routines",
    topics: [
      "7 Japanese Morning Habits for a Calm Mind",
      "The Quiet Japanese Evening Routine That Ends the Day Peacefully",
      "How Japanese People Start Their Day Slowly (and Why It Works)",
    ],
  },
  {
    id: "minimal-home",
    label: "Minimalist Home Habits",
    topics: [
      "The Minimalist Rule Japanese People Follow Daily",
      "Why Japanese Homes Feel So Calm — 8 Habits Behind It",
      "One-In-One-Out: The Japanese Way to Keep a Home Uncluttered",
    ],
  },
  {
    id: "kitchen",
    label: "Kitchen Rules",
    topics: [
      "Why Japanese Kitchens Never Get Messy",
      "8 Japanese Kitchen Habits That Keep Cooking Peaceful",
      "The Small Japanese Kitchen Philosophy: Less Space, Less Stress",
    ],
  },
  {
    id: "calm-mind",
    label: "Habits for a Calm Mind",
    topics: [
      "Japanese Habits That Quietly Reduce Stress",
      "How to Slow Down Your Mind the Japanese Way",
      "5 Zen-Inspired Habits for a Quieter Everyday Life",
    ],
  },
  {
    id: "longevity",
    label: "Longevity & Healthy Aging",
    topics: [
      "Everyday Habits from Japan Linked to Long, Healthy Lives",
      "Hara Hachi Bu: The Japanese Habit of Eating Until 80% Full",
      "Why Walking Is the Quiet Core of Japanese Longevity",
    ],
  },
  {
    id: "mottainai",
    label: "Mottainai / Mindful Spending",
    topics: [
      "Mottainai: The Japanese Mindset That Saves Money Naturally",
      "Japanese Frugal Habits That Never Feel Like Sacrifice",
      "Kakeibo: The Gentle Japanese Way to Track Spending",
    ],
  },
  {
    id: "ikigai",
    label: "Ikigai & Purpose",
    topics: [
      "Ikigai: Finding a Reason to Get Up in the Morning",
      "Small Daily Purpose: The Japanese Alternative to Big Goals",
      "How Ordinary Routines Become Meaningful — the Ikigai Way",
    ],
  },
  {
    id: "cleaning-ritual",
    label: "Cleaning & Organization Rituals",
    topics: [
      "Why Cleaning Is a Daily Ritual in Japan, Not a Chore",
      "The 10-Minute Japanese Evening Reset for a Tidy Home",
      "Osoji: The Japanese Deep-Cleaning Tradition Explained",
    ],
  },
  {
    id: "wabi-sabi",
    label: "Wabi-Sabi & Zen Teachings",
    topics: [
      "Wabi-Sabi: Learning to Love Imperfection at Home",
      "Zen Lessons You Can Practice While Washing Dishes",
      "Ichigo Ichie: Treating Ordinary Moments as Once-in-a-Lifetime",
    ],
  },
];

const STYLE_SUFFIX =
  "Japandi aesthetic, Japanese minimalism, wabi-sabi, muted natural palette, warm soft light, " +
  "film-like calm atmosphere, premium cinematic still, no text, no captions, no watermarks, " +
  "no brand logos, no recognizable real people, no copyrighted characters.";

export function getVideoScriptModel(): string {
  return process.env.VIDEO_SCRIPT_MODEL || process.env.ARTICLE_MODEL || "gpt-4o";
}

export function getVideoTtsModel(): string {
  return process.env.VIDEO_TTS_MODEL || "gpt-4o-mini-tts";
}

export function getOutputVideosDir(): string {
  return process.env.OUTPUT_DIR
    ? `${process.env.OUTPUT_DIR.replace(/\/$/, "")}/videos`
    : "outputs/videos";
}

export function getProjectDir(projectId: string): string {
  return path.join(getOutputVideosDir(), projectId).replace(/\\/g, "/");
}

function absProjectDir(projectId: string, ...parts: string[]): string {
  return path.resolve(process.cwd(), getProjectDir(projectId), ...parts);
}

export type ProjectWithScenes = VideoProject & { scenes: VideoScene[] };

export async function getProjectWithScenes(id: string): Promise<ProjectWithScenes | null> {
  return prisma.videoProject.findUnique({
    where: { id },
    include: { scenes: { orderBy: { order: "asc" } } },
  });
}

// --- Step 1: script generation ---

const SCRIPT_SYSTEM = `You write scripts for a faceless YouTube channel about Japanese lifestyle wisdom — Japandi living, wabi-sabi, Zen-inspired habits, minimalism, and everyday Japanese culture — for Western viewers.

The channel voice: calm, warm, thoughtful, slightly meditative. Long-form narration read slowly over quiet Japanese imagery (tatami rooms, tea, morning light, tidy kitchens, gardens, rain on stone).

STRICT RULES:
- Write COMPLETELY ORIGINAL content. Do not reproduce any existing video, article, or book.
- Be culturally accurate and respectful. No stereotypes, no orientalist cliches, no invented statistics, no invented quotes, no claims about real living people.
- No medical, legal, or financial advice presented as professional advice. Frame health/longevity topics as cultural habits and general wellbeing, not treatment.
- Keep everything family-friendly and non-political.
- Narration is spoken text: flowing sentences, no headings, no bullet symbols, no stage directions, no emojis.
- Include Japanese terms with romaji and a short natural gloss the first time they appear.
- Scene 1 is the HOOK: the first ~30 seconds must give the viewer a reason to stay, without clickbait lies.
- The final scene gently recaps and invites the viewer to subscribe for more quiet Japanese lifestyle videos (one soft sentence, not pushy).
- Each scene needs a visualPrompt describing ONE quiet Japandi image (interior, nature, object, hands doing a task — never a recognizable face), concrete enough for an image model.

Respond with valid JSON only, no markdown fences:
{
  "title": "YouTube title, max 70 chars, searchable and honest, includes a Japanese-lifestyle keyword",
  "description": "YouTube description: 2 short paragraphs summarizing the video with natural keywords, then a blank line and 3-6 relevant hashtags",
  "tags": "12-18 comma-separated YouTube tags (lowercase natural search phrases)",
  "thumbnailText": "3-5 word thumbnail text, calm and intriguing",
  "thumbnailPrompt": "one Japandi image concept for the thumbnail background, no text in image",
  "scenes": [
    { "heading": "short internal label for the scene", "narration": "spoken narration paragraph(s) for this scene", "visualPrompt": "one quiet Japandi visual for this scene" }
  ]
}`;

type ScriptPayload = {
  title: string;
  description: string;
  tags: string;
  thumbnailText: string;
  thumbnailPrompt: string;
  scenes: { heading: string; narration: string; visualPrompt: string }[];
};

function parseScriptJson(raw: string): ScriptPayload {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  const parsed = JSON.parse(trimmed) as ScriptPayload;
  for (const key of ["title", "description", "tags", "thumbnailText", "thumbnailPrompt"] as const) {
    if (!parsed[key] || typeof parsed[key] !== "string") {
      throw new Error(`Missing or invalid field: ${key}`);
    }
  }
  if (!Array.isArray(parsed.scenes) || parsed.scenes.length < 3) {
    throw new Error("Script must contain at least 3 scenes");
  }
  for (const scene of parsed.scenes) {
    if (!scene.narration || !scene.visualPrompt) {
      throw new Error("Every scene needs narration and visualPrompt");
    }
  }
  return parsed;
}

function ensureVideoDisclosure(description: string): string {
  if (description.includes(VIDEO_DISCLOSURE)) return description;
  return `${description.trim()}\n\n${VIDEO_DISCLOSURE}`;
}

/** Generate the full script + metadata for a project and persist scenes. */
export async function generateVideoScript(project: VideoProject): Promise<ProjectWithScenes> {
  // ~140 spoken words per minute; 12-16 scenes for a long-form video.
  const targetWords = project.durationTargetMin * 140;
  const sceneCount = Math.min(16, Math.max(8, Math.round(project.durationTargetMin * 1.3)));

  const userPrompt = [
    `Topic: ${project.topic}`,
    `Content pillar: ${project.pillar}`,
    `Target audience: ${project.targetAudience}`,
    `Target length: about ${project.durationTargetMin} minutes of narration (~${targetWords} words total).`,
    `Split the narration into about ${sceneCount} scenes of similar length.`,
    "Write today's original script.",
  ].join("\n");

  const model = getVideoScriptModel();
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SCRIPT_SYSTEM },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No script returned from OpenAI");
  const payload = parseScriptJson(content);

  // Replace any previous scenes (re-generating a script resets downstream assets).
  await prisma.videoScene.deleteMany({ where: { projectId: project.id } });
  await prisma.videoScene.createMany({
    data: payload.scenes.map((scene, i) => ({
      projectId: project.id,
      order: i + 1,
      heading: scene.heading?.trim() ?? "",
      narration: scene.narration.trim(),
      visualPrompt: scene.visualPrompt.trim(),
    })),
  });

  await prisma.videoProject.update({
    where: { id: project.id },
    data: {
      title: payload.title.trim(),
      description: ensureVideoDisclosure(payload.description),
      tags: payload.tags.trim(),
      hook: payload.scenes[0].narration.trim(),
      thumbnailText: payload.thumbnailText.trim(),
      thumbnailPrompt: payload.thumbnailPrompt.trim(),
      model,
      status: "scripted",
      videoPath: "",
    },
  });

  const updated = await getProjectWithScenes(project.id);
  if (!updated) throw new Error("Project disappeared during script generation");
  return updated;
}

// --- Step 2: narration audio (TTS) ---

function estimateDurationSec(narration: string): number {
  const words = narration.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3, (words / 140) * 60);
}

function probeDurationSec(absFile: string): number | null {
  const res = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", absFile],
    { encoding: "utf8" }
  );
  if (res.error || res.status !== 0) return null;
  const value = parseFloat(res.stdout.trim());
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Generate one narration MP3 per scene with the OpenAI TTS API. */
export async function generateVideoAudio(project: ProjectWithScenes): Promise<ProjectWithScenes> {
  if (project.scenes.length === 0) {
    throw new Error("No scenes yet. Generate the script first.");
  }

  const openai = getOpenAIClient();
  const ttsModel = getVideoTtsModel();
  const voice = process.env.VIDEO_TTS_VOICE || project.voice || "onyx";
  const audioDir = absProjectDir(project.id, "audio");
  fs.mkdirSync(audioDir, { recursive: true });

  for (const scene of project.scenes) {
    const filename = `scene-${String(scene.order).padStart(2, "0")}.mp3`;
    const absFile = path.join(audioDir, filename);

    const speech = await openai.audio.speech.create({
      model: ttsModel,
      voice: voice as "onyx",
      input: scene.narration,
      response_format: "mp3",
      // `instructions` is only supported by the gpt-4o-mini-tts family.
      ...(ttsModel.includes("gpt-4o-mini-tts")
        ? {
            instructions:
              "Calm, warm, slow-paced and slightly meditative narration for a quiet Japanese lifestyle video. Leave gentle pauses between sentences.",
          }
        : {}),
    });
    fs.writeFileSync(absFile, Buffer.from(await speech.arrayBuffer()));

    const relPath = `${getProjectDir(project.id)}/audio/${filename}`;
    await prisma.videoScene.update({
      where: { id: scene.id },
      data: {
        audioPath: relPath,
        durationSec: probeDurationSec(absFile) ?? estimateDurationSec(scene.narration),
      },
    });
  }

  await prisma.videoProject.update({
    where: { id: project.id },
    data: { status: "voiced" },
  });

  const updated = await getProjectWithScenes(project.id);
  if (!updated) throw new Error("Project disappeared during audio generation");
  return updated;
}

// --- Step 3: scene visuals + thumbnail ---

/** Generate one landscape image per scene plus the thumbnail background. */
export async function generateVideoVisuals(project: ProjectWithScenes): Promise<ProjectWithScenes> {
  if (project.scenes.length === 0) {
    throw new Error("No scenes yet. Generate the script first.");
  }

  const openai = getOpenAIClient();
  const quality = process.env.VIDEO_IMAGE_QUALITY === "hd" ? "hd" : "standard";
  const scenesDir = absProjectDir(project.id, "scenes");
  fs.mkdirSync(scenesDir, { recursive: true });

  const generateImage = async (prompt: string, absFile: string, hd: boolean) => {
    const result = await openai.images.generate({
      model: "dall-e-3",
      prompt: `${prompt}. ${STYLE_SUFFIX}`,
      n: 1,
      size: "1792x1024",
      quality: hd ? "hd" : quality,
      response_format: "url",
    });
    const url = result.data?.[0]?.url;
    if (!url) throw new Error("No image URL returned from OpenAI");
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to download generated image");
    fs.writeFileSync(absFile, Buffer.from(await res.arrayBuffer()));
  };

  for (const scene of project.scenes) {
    if (scene.imagePath) continue; // keep already-generated images (retry-friendly)
    const filename = `scene-${String(scene.order).padStart(2, "0")}.png`;
    await generateImage(scene.visualPrompt, path.join(scenesDir, filename), false);
    await prisma.videoScene.update({
      where: { id: scene.id },
      data: { imagePath: `${getProjectDir(project.id)}/scenes/${filename}` },
    });
  }

  if (!project.thumbnailPath && project.thumbnailPrompt) {
    const absFile = absProjectDir(project.id, "thumbnail.png");
    await generateImage(project.thumbnailPrompt, absFile, true);
    await prisma.videoProject.update({
      where: { id: project.id },
      data: { thumbnailPath: `${getProjectDir(project.id)}/thumbnail.png` },
    });
  }

  await prisma.videoProject.update({
    where: { id: project.id },
    data: { status: "visualized" },
  });

  const updated = await getProjectWithScenes(project.id);
  if (!updated) throw new Error("Project disappeared during visual generation");
  return updated;
}

// --- Step 4: ffmpeg assembly ---

export function isFfmpegAvailable(): boolean {
  const res = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  return !res.error && res.status === 0;
}

function runFfmpeg(args: string[]) {
  const res = spawnSync("ffmpeg", ["-y", ...args], { encoding: "utf8" });
  if (res.error || res.status !== 0) {
    const stderr = (res.stderr || "").split("\n").slice(-6).join("\n");
    throw new Error(`ffmpeg failed: ${stderr || res.error?.message || "unknown error"}`);
  }
}

/**
 * Assemble scene images + narration audio into one 1920x1080 MP4.
 * Each scene becomes a still-image segment as long as its narration;
 * segments are concatenated losslessly. BGM/transitions stay a manual
 * editing step (CapCut etc.) by design.
 */
export async function assembleVideo(project: ProjectWithScenes): Promise<ProjectWithScenes> {
  if (!isFfmpegAvailable()) {
    throw new Error("ffmpeg is not installed. Install ffmpeg to assemble videos (e.g. `winget install ffmpeg` / `brew install ffmpeg` / `apt install ffmpeg`).");
  }
  const missing = project.scenes.filter((s) => !s.imagePath || !s.audioPath);
  if (project.scenes.length === 0 || missing.length > 0) {
    throw new Error("Every scene needs an image and narration audio before assembly. Run steps 2 and 3 first.");
  }

  const segmentsDir = absProjectDir(project.id, "segments");
  fs.mkdirSync(segmentsDir, { recursive: true });

  const segmentFiles: string[] = [];
  for (const scene of project.scenes) {
    const image = path.resolve(process.cwd(), scene.imagePath);
    const audio = path.resolve(process.cwd(), scene.audioPath);
    if (!fs.existsSync(image) || !fs.existsSync(audio)) {
      throw new Error(`Missing asset file for scene ${scene.order}. Re-run audio/visual generation.`);
    }
    const segment = path.join(segmentsDir, `segment-${String(scene.order).padStart(2, "0")}.mp4`);
    runFfmpeg([
      "-loop", "1",
      "-i", image,
      "-i", audio,
      "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,format=yuv420p",
      "-c:v", "libx264",
      "-tune", "stillimage",
      "-r", "30",
      "-c:a", "aac",
      "-b:a", "192k",
      "-ar", "44100",
      "-shortest",
      segment,
    ]);
    segmentFiles.push(segment);
  }

  const listFile = path.join(segmentsDir, "concat.txt");
  fs.writeFileSync(
    listFile,
    segmentFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n")
  );

  const output = absProjectDir(project.id, "video.mp4");
  runFfmpeg(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", output]);

  await prisma.videoProject.update({
    where: { id: project.id },
    data: {
      videoPath: `${getProjectDir(project.id)}/video.mp4`,
      status: "assembled",
    },
  });

  const updated = await getProjectWithScenes(project.id);
  if (!updated) throw new Error("Project disappeared during assembly");
  return updated;
}

// --- Topic rotation for the cron pipeline ---

/** Pick the next pillar/topic not used by an existing project yet. */
export async function pickNextVideoTopic(): Promise<{ pillar: string; topic: string }> {
  const existing = await prisma.videoProject.findMany({ select: { topic: true } });
  const used = new Set(existing.map((p) => p.topic.toLowerCase()));

  for (const pillar of VIDEO_PILLARS) {
    for (const topic of pillar.topics) {
      if (!used.has(topic.toLowerCase())) {
        return { pillar: pillar.id, topic };
      }
    }
  }

  // All bank topics used: rotate by time so consecutive runs still vary.
  const flat = VIDEO_PILLARS.flatMap((p) => p.topics.map((topic) => ({ pillar: p.id, topic })));
  const pick = flat[Math.floor(Date.now() / (3 * 60 * 60 * 1000)) % flat.length];
  return { ...pick, topic: `${pick.topic} (fresh take ${new Date().toISOString().slice(0, 10)})` };
}

/** Build the plain-text script document used in exports. */
export function buildScriptDocument(project: ProjectWithScenes): string {
  const lines = [
    `# ${project.title || project.topic}`,
    "",
    `Pillar: ${project.pillar}`,
    `Target length: ~${project.durationTargetMin} min`,
    `Voice: ${project.voice}`,
    "",
    "## Scenes",
    "",
  ];
  for (const scene of project.scenes) {
    lines.push(
      `### Scene ${scene.order}${scene.heading ? ` — ${scene.heading}` : ""}`,
      "",
      scene.narration,
      "",
      `Visual: ${scene.visualPrompt}`,
      ""
    );
  }
  lines.push("## YouTube Metadata", "", `Title: ${project.title}`, "", "Description:", project.description, "", `Tags: ${project.tags}`, "", `Thumbnail text: ${project.thumbnailText}`);
  return lines.join("\n");
}
