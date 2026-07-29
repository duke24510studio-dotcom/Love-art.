// Editing passes that turn a machine-shaped draft into something with a human
// rhythm. Adapted from a set of Japanese "推敲プロンプト" the user brought in:
// each pass is one focused rewrite instruction, applied in sequence, with the
// 仕上げ (finish) pass meant to run last.
//
// IMPORTANT — how this differs from the original list:
// The source list included a pass framed as "make it not read as AI-written"
// (すり抜け). This studio's whole content policy is built on HONEST AI
// disclosure: every article ends with ARTICLE_DISCLOSURE_JA/EN, and the blog,
// poster, and review pipelines all disclose AI assistance. So that pass is
// implemented here as a PROSE-QUALITY pass — strip the formulaic templates and
// filler phrasing that make a draft tiring to read — NOT as detector evasion,
// and every pass is required to keep the disclosure line intact. The point is
// writing that's genuinely better to read, not writing that hides its origin.
//
// This file is pure data so client components can import it; the OpenAI calls
// live in src/lib/humanize.ts.

export type HumanizePassKey =
  | "editor"
  | "human"
  | "deformula"
  | "talk"
  | "warmth"
  | "plain"
  | "rhythm"
  | "finish";

export type HumanizePass = {
  key: HumanizePassKey;
  labelJa: string;
  descriptionJa: string;
  instruction: string;
};

export const HUMANIZE_PASSES: HumanizePass[] = [
  {
    key: "editor",
    labelJa: "① 編集長",
    descriptionJa: "硬い構造をほどいて、会話に近い運びにする",
    instruction:
      "プロの編集者として、この文章を会話に近いトーンに直してください。硬い構造と、いかにも定型的な言い回しを取り除き、意味と情報は一切変えずに残すこと。",
  },
  {
    key: "human",
    labelJa: "② 人間化",
    descriptionJa: "経験者が書いたような語彙とリズムにする",
    instruction:
      "経験のある書き手が自分の言葉で書いたように、文のリズムと言葉選びを改善してください。テンプレート的な型や、内容のない形式ワード（「いかがでしたか」「〜と言えるでしょう」など）は避けること。",
  },
  {
    key: "deformula",
    labelJa: "③ 型くずし",
    descriptionJa: "定型パターンを崩し、文長に変化をつける",
    instruction:
      "文章から定型パターンを取り除いてください。すべての段落が同じ形・同じ長さで始まる状態をやめ、文の長さに変化をつけ、自然な言い回しを足すこと。内容は変えず、誇張や余計な盛りは一切加えないこと。",
  },
  {
    key: "talk",
    labelJa: "④ 語りかけ",
    descriptionJa: "親しい専門家が話すようなカジュアルさに",
    instruction:
      "仲の良い専門家が目の前で話しているような、カジュアルな語り口に直してください。教科書のような説明口調は削ること。ただし敬体（です・ます）は保ち、馴れ馴れしくなりすぎないこと。",
  },
  {
    key: "warmth",
    labelJa: "⑤ 体温",
    descriptionJa: "感情の起伏と強弱を入れる",
    instruction:
      "人間らしい感情の動きと、文の強弱を加えてください。単調な繰り返しを消し、読み手の心が動く箇所をつくること。事実を誇張したり、実際にない体験を足したりはしないこと。",
  },
  {
    key: "plain",
    labelJa: "⑥ 地声",
    descriptionJa: "飾りを落とし、核心をまっすぐ書く",
    instruction:
      "着飾らない自然な言葉に直してください。装飾的な言い回しと形式的な型を捨て、一番伝えたい核心をまっすぐに書くこと。短くなって構いません。",
  },
  {
    key: "rhythm",
    labelJa: "⑦ リズム",
    descriptionJa: "文長とペースを整える",
    instruction:
      "文の長さを変えて全体のペースを調整してください。繰り返しや、先が読めてしまう予定調和の言い回しはカットすること。段落の切り方も読みやすさに合わせて見直してよい。",
  },
  {
    key: "finish",
    labelJa: "⑧ 仕上げ（最後に）",
    descriptionJa: "下書きを、実在の書き手の最終稿にする",
    instruction:
      "この下書きを、実在する一人の書き手が自信をもって公開する最終稿に仕上げてください。トーンと構成を整え、迷いのある表現を締めること。ここで新しい主張や事実を足さないこと。",
  },
];

/** The recommended order from the source list: shape with ①〜⑦, finish with ⑧. */
export const DEFAULT_PASS_ORDER: HumanizePassKey[] = ["editor", "rhythm", "finish"];

export function isHumanizePassKey(value: unknown): value is HumanizePassKey {
  return typeof value === "string" && HUMANIZE_PASSES.some((p) => p.key === value);
}

/** Sort requested passes into the canonical order, always ending with 仕上げ. */
export function orderPasses(keys: HumanizePassKey[]): HumanizePassKey[] {
  const canonical = HUMANIZE_PASSES.map((p) => p.key);
  const unique = Array.from(new Set(keys));
  return unique.sort((a, b) => canonical.indexOf(a) - canonical.indexOf(b));
}

