import { getOpenAIClient } from "@/lib/openai";
import { REVIEW_PERSONAS, findPersona } from "@/lib/review-personas";
import type { RakutenProduct } from "@/generated/prisma/client";

// Mandatory disclosure appended to every generated review body. Two things,
// both required: (1) this is sponsored/affiliate content ("PR"), and
// (2) it was AI-drafted and human-reviewed before publishing. This mirrors
// Japan's stealth-marketing (ステマ) labeling rules under 景品表示法 and the
// AI-disclosure convention already used for posters/articles in this repo.
export const REVIEW_DISCLOSURE =
  "【PR】本記事は楽天アフィリエイトプログラムによる広告を含みます。AIの支援を受けて作成し、投稿前に内容を確認・編集しています。";

export const REVIEW_STATUSES = ["generated", "review", "approved", "rejected", "exported"] as const;
export const ROUND_STATUSES = ["generated", "review", "approved", "rejected", "exported"] as const;

const SYSTEM_PROMPT = `あなたは、楽天市場の商品をブログ／SNSで紹介するアフィリエイトサイトのコピーライターです。
サイトには個性の異なる5人の「紹介キャラクター」がいて、それぞれの生活シーン・視点から同じ商品を紹介します。
これは実際の購入者の口コミではなく、サイト運営者が用意した紹介キャラクターによる紹介記事です。

絶対に守るルール（違反した内容は使用できません）:
- 「検証済み購入者」「実際に購入した」「私が買った」など、実購入・実体験を事実として断定する表現は使わない。あくまで紹介キャラクターとしての感想・おすすめとして書く。
- 商品情報（商品名・価格・キャッチコピー・商品説明・楽天レビュー平均や件数）に基づいて書き、存在しない仕様・効果・実験結果・具体的な数値やデータを捏造しない。
- 医療的・健康効果を断定しない（例:「治る」「効果が科学的に証明された」等は禁止）。一般的な感想の範囲にとどめる。
- 「日本一」「絶対」「必ず」などの誇大・断定的な最上級表現は使わない。
- 実在の人物・有名人・他ブランド・他社商品を名指しで貶めるような表現をしない。
- 各キャラクターの語り口・視点は指定されたペルソナに忠実に、5人の内容が互いに重複しないようにする。
- 本文（body）の最後に、必ず次の開示文をそのまま一字一句含める: "${REVIEW_DISCLOSURE}"

商品情報と5人のキャラクター一覧を渡すので、日本語で有効なJSONのみを出力してください（マークダウンフェンスなし）。
形式:
{
  "reviews": [
    { "persona": "housewife", "title": "20-40字程度の見出し", "body": "300-500字程度の紹介文。最後に開示文を含める", "rating": 5, "snsCaption": "X/Instagram投稿用、100字以内、ハッシュタグ2-3個、価格や誇大表現なし" },
    ... 5人分
  ]
}
persona には housewife / value / gift / beginner / specs のキーをそのまま使ってください。rating は1〜5の整数（基本4〜5、誇張しない）。`;

type RawReview = {
  persona?: string;
  title?: string;
  body?: string;
  rating?: number;
  snsCaption?: string;
};

export type GeneratedReview = {
  persona: string;
  personaJa: string;
  angle: string;
  title: string;
  body: string;
  rating: number;
  snsCaption: string;
};

export function getReviewModel(): string {
  return process.env.RAKUTEN_REVIEW_MODEL || "gpt-4o";
}

function ensureDisclosure(body: string): string {
  const trimmed = (body || "").trim();
  if (trimmed.includes(REVIEW_DISCLOSURE)) return trimmed;
  return `${trimmed}\n\n${REVIEW_DISCLOSURE}`;
}

function parseReviewsJson(raw: string): RawReview[] {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  const parsed = JSON.parse(trimmed) as { reviews?: RawReview[] };
  if (!Array.isArray(parsed.reviews) || parsed.reviews.length === 0) {
    throw new Error("OpenAIのレビュー生成結果が不正な形式でした");
  }
  return parsed.reviews;
}

function buildUserPrompt(product: RakutenProduct, weekNumber: number): string {
  const weekNote =
    weekNumber === 1
      ? "これは1週目・初回の紹介です。第一印象を中心に書いてください。"
      : `これは${weekNumber}週目の紹介です。これまでとは違う切り口・気づき（使い続けての印象、季節や使うシーンの広がりなど）を書き、前回までの内容と重複させないでください。`;

  return [
    `商品名: ${product.name}`,
    product.catchcopy ? `キャッチコピー: ${product.catchcopy}` : "",
    `価格: ${product.price}円`,
    product.shopName ? `ショップ名: ${product.shopName}` : "",
    product.genreName ? `ジャンル: ${product.genreName}` : "",
    product.reviewCount > 0
      ? `楽天市場でのレビュー: 平均${product.reviewAverage} / ${product.reviewCount}件`
      : "",
    product.itemCaption
      ? `商品説明(参考情報。そのまま転記せず、着想として使う): ${product.itemCaption.slice(0, 800)}`
      : "",
    "",
    weekNote,
    "",
    "紹介キャラクター一覧:",
    ...REVIEW_PERSONAS.map(
      (p) => `- key: ${p.key} / 名前: ${p.nameJa} / 切り口: ${p.angleJa} / 語り口: ${p.voiceJa}`
    ),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Generate one week's batch of 5 persona reviews for a product (does not persist). */
export async function generateReviewsForRound(
  product: RakutenProduct,
  weekNumber: number
): Promise<GeneratedReview[]> {
  const openai = getOpenAIClient();
  const model = getReviewModel();

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(product, weekNumber) },
    ],
    temperature: 0.9,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAIからレビューが返されませんでした");
  }

  const raw = parseReviewsJson(content);
  return raw.map((r) => {
    const persona = findPersona(r.persona ?? "");
    return {
      persona: persona?.key ?? r.persona ?? "",
      personaJa: persona?.nameJa ?? "",
      angle: persona?.angleJa ?? "",
      title: (r.title ?? "").trim(),
      body: ensureDisclosure(r.body ?? ""),
      rating: Math.min(5, Math.max(1, Math.round(Number(r.rating ?? 5)))),
      snsCaption: (r.snsCaption ?? "").trim(),
    };
  });
}
