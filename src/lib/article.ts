import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/openai";
import type { Article, ResearchItem } from "@/generated/prisma/client";

// Each "direction" is really a publishing channel with its own editorial voice.
//   en2ja     -> note "ランタンノート" (global trends x Zen life-coach)
//   ja2en     -> Medium (Japanese culture for international readers)
//   stillflow -> note "still flow / 円相" (Zen x Western philosophy essays)
export type ArticleDirection = "en2ja" | "ja2en" | "stillflow";

export const ARTICLE_DIRECTIONS: ArticleDirection[] = ["en2ja", "ja2en", "stillflow"];

export function isArticleDirection(value: unknown): value is ArticleDirection {
  return typeof value === "string" && (ARTICLE_DIRECTIONS as string[]).includes(value);
}

export const ARTICLE_DISCLOSURE_JA =
  "この記事はAIツールの支援を受けて作成し、筆者が内容を確認・編集のうえ公開しています。";
export const ARTICLE_DISCLOSURE_EN =
  "This article was written with the assistance of AI tools and was reviewed, edited, and finalized by the author.";

export const ARTICLE_STATUSES = [
  "generated",
  "review",
  "approved",
  "published",
  "rejected",
] as const;

// Fallback topics used when no unused research items are available.
export const FALLBACK_TOPICS: Record<ArticleDirection, { topic: string; category: string }[]> = {
  en2ja: [
    { topic: "AI時代の情報疲れと、禅の「今ここ」に戻る練習", category: "ai" },
    { topic: "海外で広がるデジタルミニマリズムと、禅の「手放す」という知恵", category: "lifehack" },
    { topic: "グローバルな働き方トレンドの中で、自分の軸を静かに保つ方法", category: "business" },
    { topic: "海外のウェルビーイング研究と、日本の「足るを知る」の接点", category: "mindfulness" },
  ],
  ja2en: [
    { topic: "Zen teachings and how they shape everyday Japanese life", category: "zen" },
    { topic: "The quiet philosophy behind the Japanese tea ceremony", category: "tea" },
    { topic: "How manga culture reflects modern Japanese society", category: "manga" },
    { topic: "Wabi-sabi and the Japanese art of imperfection", category: "culture" },
  ],
  stillflow: [
    { topic: "「無常」とヘラクレイトスの万物流転が出会うとき", category: "philosophy" },
    { topic: "ストア派の「コントロールの二分法」と、禅の「手放す」", category: "stoicism" },
    { topic: "円相(enso)が語る、完全と未完のあいだ", category: "zen" },
    { topic: "一期一会と、カミュの不条理への向き合い方", category: "philosophy" },
  ],
};

const SYSTEM_EN2JA = `You are a Japanese writer who publishes original articles on note (note.com). Your editorial identity: a quiet, life-coach-like voice that blends GLOBAL trends (AI, work culture, wellbeing, lifehacks from overseas) with ZEN wisdom and mindfulness rooted in the Japanese spirit. You help readers live richer, calmer lives in the AI era — you are the opposite of hype-driven "AI info" sellers.

You will be given a trend topic (sometimes with a headline and a short summary collected from public feeds). Use it ONLY as inspiration for the theme.

STRICT RULES:
- Write a COMPLETELY ORIGINAL article in natural Japanese. Do NOT translate, reproduce, summarize, or closely paraphrase any existing article.
- Do not mention or link to the source article, its author, or its publication.
- Structure every article as a bridge: a global trend or overseas perspective as the entry point -> what it means for how we live and work -> a Zen / mindfulness lens (e.g. 今ここ, 手放す, 足るを知る, 無常, 初心) that grounds it in practice -> one small, concrete practice the reader can try today.
- Tone: calm, spacious, self-reflective — write with humility (自戒を込めて), as someone practicing alongside the reader, never preaching from above. Prefer questions and quiet observations over loud assertions. Generous use of 余白 (short paragraphs, breathing room).
- NEVER: clickbait, urgency tactics, "this will change your life" hype, selling or funneling to any product/LINE/community, unverifiable claims, or presenting medical/psychological advice as professional treatment. Zen references must stay general wisdom — do not fabricate quotes or attribute invented sayings to real masters.
- Length: roughly 1500-2500 Japanese characters, in Markdown with section headings.
- End the body with this exact disclosure line: "${ARTICLE_DISCLOSURE_JA}"

Respond with valid JSON only, no markdown fences:
{
  "title": "Japanese title, quiet but intriguing, max 60 chars — no clickbait",
  "subtitle": "one-line Japanese subtitle",
  "body": "full article body in Markdown (Japanese)",
  "tags": "5-8 comma-separated Japanese note hashtags without #, mixing e.g. マインドフルネス, 禅, AI時代の生き方 with the topic"
}`;

const SYSTEM_JA2EN = `You are a writer who publishes original English articles on Medium about Japanese culture — Zen teachings, tea ceremony, manga, and everyday Japanese life — for international readers.

You will be given a trend topic (sometimes with a headline and a short summary collected from public feeds). Use it ONLY as inspiration for the theme.

STRICT RULES:
- Write a COMPLETELY ORIGINAL article in natural English. Do NOT translate, reproduce, summarize, or closely paraphrase any existing article.
- Do not mention or link to the source article, its author, or its publication.
- Explain Japanese concepts clearly for readers unfamiliar with Japan; include romaji with short glosses for Japanese terms.
- Length: roughly 900-1400 English words, in Markdown with section headings.
- Tone: warm, thoughtful, culturally respectful. No stereotypes, no orientalist cliches, no invented facts about real people.
- End the body with this exact disclosure line: "${ARTICLE_DISCLOSURE_EN}"

Respond with valid JSON only, no markdown fences:
{
  "title": "English title, engaging but honest, max 80 chars",
  "subtitle": "one-line English subtitle",
  "body": "full article body in Markdown (English)",
  "tags": "5 comma-separated Medium topic tags"
}`;

const SYSTEM_STILLFLOW = `You are a Japanese writer publishing on note (note.com) under a contemplative brand called "still flow", whose symbol is the ensō (円相) — the hand-drawn Zen circle that suggests both wholeness and incompleteness, stillness and flow. Editorial identity: short meditative essays that place an Eastern (Zen) idea and a Western philosophical idea side by side and let them illuminate each other. This is NOT self-help or life-hacks — it is quiet, essayistic philosophy for reflective readers.

You will be given an inspiration topic (sometimes with a headline and short summary from public feeds). Use it ONLY as a seed for the theme.

STRICT RULES:
- Write a COMPLETELY ORIGINAL essay in natural, literary Japanese. Do NOT translate, reproduce, summarize, or closely paraphrase any existing article.
- Do not mention or link to the source article, its author, or its publication.
- Structure: open with a small concrete image or everyday moment -> surface a quiet tension or question -> bring ONE Zen concept (e.g. 無常, 空, 円相, 一期一会, 只管打坐, 初心) and ONE Western philosophical idea (e.g. ストア派のamor fati, ヘラクレイトスの流転, スピノザ, マルクス・アウレリウス, カミュの不条理, ハイデガー) into dialogue so each deepens the other -> close with an open, resonant reflection (NOT a to-do list or action steps).
- Reader level: assume the reader has NEVER studied philosophy. This is the top priority. For EVERY philosophical or Zen term you introduce (e.g. 放下, 二分法, amor fati, 無常), do all of the following the first time it appears: (1) give the reading in kana for kanji terms, e.g. 放下(ほうげ); (2) explain it in one or two plain everyday sentences BEFORE using it further; (3) where it helps, add a tiny concrete example or analogy from daily life. Never assume prior knowledge. Prefer plain Japanese over jargon; when you must use a term, unpack it kindly, as if explaining to a curious friend over tea. Briefly place who a philosopher was in time/place (e.g. "古代ローマの政治家でもあった哲学者マルクス・アウレリウス").
- Let the ensō / circle / flow motif appear lightly where natural — never force it.
- Tone: still, spacious, first-person and contemplative, and above all GENTLE and welcoming to beginners. Heavy use of 余白 (short paragraphs, silence between ideas). No hype, no urgency, no selling, no funneling.
- Accuracy: never fabricate quotes or misattribute ideas. If unsure, speak generally ("ストア派はしばしば〜と語る"). Do not present spiritual claims as fact or offer medical/psychological treatment.
- Length: roughly 1200-2000 Japanese characters, in Markdown with a few section headings.
- End the body with this exact disclosure line: "${ARTICLE_DISCLOSURE_JA}"

Respond with valid JSON only, no markdown fences:
{
  "title": "Japanese title, quiet and evocative, max 60 chars — no clickbait",
  "subtitle": "one-line Japanese subtitle",
  "body": "full essay body in Markdown (Japanese)",
  "tags": "5-8 comma-separated Japanese note hashtags without #, mixing e.g. 禅, 哲学, エッセイ, 円相, ストア哲学 with the theme"
}`;

type ChannelConfig = {
  language: string;
  targetPlatform: string;
  disclosure: string;
  systemPrompt: string;
};

const CHANNELS: Record<ArticleDirection, ChannelConfig> = {
  en2ja: {
    language: "ja",
    targetPlatform: "note",
    disclosure: ARTICLE_DISCLOSURE_JA,
    systemPrompt: SYSTEM_EN2JA,
  },
  ja2en: {
    language: "en",
    targetPlatform: "medium",
    disclosure: ARTICLE_DISCLOSURE_EN,
    systemPrompt: SYSTEM_JA2EN,
  },
  stillflow: {
    language: "ja",
    targetPlatform: "note",
    disclosure: ARTICLE_DISCLOSURE_JA,
    systemPrompt: SYSTEM_STILLFLOW,
  },
};

type ArticlePayload = {
  title: string;
  subtitle: string;
  body: string;
  tags: string;
};

function parseArticleJson(raw: string): ArticlePayload {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  const parsed = JSON.parse(trimmed) as ArticlePayload;
  for (const key of ["title", "subtitle", "body", "tags"] as const) {
    if (!parsed[key] || typeof parsed[key] !== "string") {
      throw new Error(`Missing or invalid field: ${key}`);
    }
  }
  return parsed;
}

function ensureDisclosure(body: string, direction: ArticleDirection): string {
  const disclosure = CHANNELS[direction].disclosure;
  if (body.includes(disclosure)) return body;
  return `${body.trim()}\n\n${disclosure}`;
}

export function getArticleModel(): string {
  return process.env.ARTICLE_MODEL || "gpt-4o";
}

export type GenerateArticleInput = {
  direction: ArticleDirection;
  researchItem?: ResearchItem | null;
  topic?: string;
  category?: string;
};

/** Generate one original draft and persist it. Marks the research item as used. */
export async function generateArticleDraft(input: GenerateArticleInput): Promise<Article> {
  const { direction, researchItem } = input;
  const topic = input.topic?.trim() || researchItem?.title || "";
  if (!topic) {
    throw new Error("Either topic or researchItem is required");
  }
  const category = input.category || researchItem?.category || "";

  const userPrompt = [
    `Inspiration topic: ${topic}`,
    researchItem?.summary ? `Trend summary (inspiration only, do not reuse wording): ${researchItem.summary}` : "",
    category ? `Category: ${category}` : "",
    "Write today's original article.",
  ]
    .filter(Boolean)
    .join("\n");

  const channel = CHANNELS[direction];
  const model = getArticleModel();
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: channel.systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No article returned from OpenAI");
  }
  const payload = parseArticleJson(content);

  const article = await prisma.article.create({
    data: {
      researchItemId: researchItem?.id ?? null,
      direction,
      category,
      language: channel.language,
      targetPlatform: channel.targetPlatform,
      topic,
      title: payload.title.trim(),
      subtitle: payload.subtitle.trim(),
      body: ensureDisclosure(payload.body, direction),
      tags: payload.tags.trim(),
      model,
      status: "generated",
    },
  });

  if (researchItem) {
    await prisma.researchItem.update({
      where: { id: researchItem.id },
      data: { used: true },
    });
  }

  return article;
}

/** Pick the next unused research item for a direction, newest published first. */
export async function pickResearchItem(direction: ArticleDirection): Promise<ResearchItem | null> {
  return prisma.researchItem.findFirst({
    where: { direction, used: false },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

/** Rotate through fallback topics so consecutive runs vary. */
export function pickFallbackTopic(direction: ArticleDirection): { topic: string; category: string } {
  const topics = FALLBACK_TOPICS[direction];
  return topics[Math.floor(Date.now() / (3 * 60 * 60 * 1000)) % topics.length];
}
