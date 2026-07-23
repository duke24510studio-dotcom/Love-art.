import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/openai";
import type { ChannelIdea, YtVideoSnapshot } from "@/generated/prisma/client";

export const CHANNEL_IDEA_STATUSES = ["idea", "review", "approved", "rejected"] as const;
export type ChannelIdeaStatus = (typeof CHANNEL_IDEA_STATUSES)[number];

export function isChannelIdeaStatus(value: unknown): value is ChannelIdeaStatus {
  return typeof value === "string" && (CHANNEL_IDEA_STATUSES as readonly string[]).includes(value);
}

export function getChannelIdeaModel(): string {
  return process.env.CHANNEL_IDEA_MODEL || "gpt-4o";
}

// STRICT originality rules, mirroring the article pipeline: trending data is
// inspiration only, never material to copy or a channel to imitate directly.
const SYSTEM_PROMPT = `You are a YouTube channel strategist. You will be given metadata about ONE currently-trending video (title, channel name, view velocity, niche/category, region) collected from the public YouTube Data API. Use it ONLY as a signal for which FORMAT and NICHE are resonating right now — never as content to copy.

STRICT RULES:
- Propose a channel concept that is COMPLETELY ORIGINAL: a new channel name, new branding, new episode/video titles. Do NOT reuse or closely paraphrase the source video's title, the source channel's name, or any of its specific content.
- Do NOT propose impersonating, cloning, or "reposting" the source channel. Do NOT suggest re-uploading, translating-and-reposting, or lightly editing someone else's existing videos.
- Do NOT reference the source channel by name in the output — describe only the general format/niche/style it suggests.
- Do NOT include real people's names, trademarked characters, brand logos, or copyrighted music/clips in the plan.
- The plan must describe genuinely original content the user would film/produce/design themselves (or generate as original AI content clearly meant to be their own creative work).
- Keep suggestions realistic and safe: no misleading thumbnails/titles ("clickbait deception"), no scraped/aggregated news reposting, no medical/financial advice, nothing illegal, adult, or hateful.

Respond with valid JSON only, no markdown fences:
{
  "channelName": "an original, brandable channel name idea",
  "concept": "2-4 sentences describing the original channel concept and what makes it distinct",
  "targetAudience": "one sentence describing who it's for",
  "contentPillars": "4-6 comma-separated original content pillar/series ideas",
  "sampleTitles": "5 comma-separated ORIGINAL sample video title ideas (not translations/paraphrases of the source)",
  "postingCadence": "a realistic suggested posting frequency",
  "notes": "one or two sentences on production tips or differentiation strategy"
}`;

type IdeaPayload = {
  channelName: string;
  concept: string;
  targetAudience: string;
  contentPillars: string;
  sampleTitles: string;
  postingCadence: string;
  notes: string;
};

function parseIdeaJson(raw: string): IdeaPayload {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  const parsed = JSON.parse(trimmed) as IdeaPayload;
  for (const key of [
    "channelName",
    "concept",
    "targetAudience",
    "contentPillars",
    "sampleTitles",
    "postingCadence",
  ] as const) {
    if (!parsed[key] || typeof parsed[key] !== "string") {
      throw new Error(`Missing or invalid field: ${key}`);
    }
  }
  return parsed;
}

/** Pick a recent high-velocity trending video that hasn't already spawned an idea. */
export async function pickTrendingSource(regionCode?: string): Promise<YtVideoSnapshot | null> {
  const recentIdeaVideoIds = (
    await prisma.channelIdea.findMany({
      where: { sourceVideoId: { not: null } },
      select: { sourceVideoId: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    })
  )
    .map((i) => i.sourceVideoId)
    .filter((id): id is string => Boolean(id));

  return prisma.ytVideoSnapshot.findFirst({
    where: {
      ...(regionCode ? { regionCode } : {}),
      ...(recentIdeaVideoIds.length > 0 ? { id: { notIn: recentIdeaVideoIds } } : {}),
    },
    orderBy: { vph: "desc" },
  });
}

/** Generate one original channel-concept proposal and persist it. */
export async function generateChannelIdea(sourceVideo: YtVideoSnapshot): Promise<ChannelIdea> {
  const userPrompt = [
    `Region: ${sourceVideo.regionCode}`,
    `Category ID: ${sourceVideo.categoryId || "unknown"}`,
    `Views-per-hour (velocity signal): ${Math.round(sourceVideo.vph)}`,
    `Total views: ${sourceVideo.viewCount}`,
    "Propose one original channel concept inspired by the FORMAT/NICHE this signal represents.",
  ].join("\n");

  const model = getChannelIdeaModel();
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.9,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No channel idea returned from OpenAI");
  }
  const payload = parseIdeaJson(content);

  return prisma.channelIdea.create({
    data: {
      sourceVideoId: sourceVideo.id,
      sourceChannelId: sourceVideo.channelId,
      sourceRegion: sourceVideo.regionCode,
      niche: sourceVideo.categoryId,
      channelName: payload.channelName.trim(),
      concept: payload.concept.trim(),
      targetAudience: payload.targetAudience.trim(),
      contentPillars: payload.contentPillars.trim(),
      sampleTitles: payload.sampleTitles.trim(),
      postingCadence: payload.postingCadence.trim(),
      notes: payload.notes?.trim() ?? "",
      model,
      status: "idea",
    },
  });
}
