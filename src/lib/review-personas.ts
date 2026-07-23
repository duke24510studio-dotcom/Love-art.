// Fixed set of 5 reviewer-persona "characters" used to write multi-angle
// affiliate review content for a tracked Rakuten product. These are editorial
// characters (like a blog's cast of writers), NOT real customers — every
// generated review must read that way (see REVIEW_SYSTEM_PROMPT in review.ts).

export type ReviewPersonaKey = "housewife" | "value" | "gift" | "beginner" | "specs";

export type ReviewPersona = {
  key: ReviewPersonaKey;
  nameJa: string;
  angleJa: string;
  voiceJa: string;
};

export const REVIEW_PERSONAS: ReviewPersona[] = [
  {
    key: "housewife",
    nameJa: "3人家族の主婦・ゆかりさん",
    angleJa: "家計・時短・子育て中でも使いやすいか",
    voiceJa: "親しみやすい口語体。家族の日常の一コマを具体的に描く",
  },
  {
    key: "value",
    nameJa: "一人暮らし社会人・けんとさん",
    angleJa: "コストパフォーマンス・耐久性・価格に見合う価値",
    voiceJa: "率直でやや実務的。価格や使用頻度など具体的な軸で語る",
  },
  {
    key: "gift",
    nameJa: "贈り物探しの主婦・さちこさん",
    angleJa: "ギフト向きか・パッケージの印象・贈った相手の反応",
    voiceJa: "丁寧で華やかな口調。贈答シーンを具体的に描く",
  },
  {
    key: "beginner",
    nameJa: "はじめて使う初心者・みさきさん",
    angleJa: "初めてでも迷わず使えるか、最初の不安がどう解消されたか",
    voiceJa: "素朴で正直。戸惑いから安心へ変わる流れを描く",
  },
  {
    key: "specs",
    nameJa: "比較・スペック好きなたかしさん",
    angleJa: "仕様・素材・使い勝手を他の選択肢と比べた視点",
    voiceJa: "落ち着いた解説口調。根拠を示しながら淡々と語る",
  },
];

export function findPersona(key: string): ReviewPersona | undefined {
  return REVIEW_PERSONAS.find((p) => p.key === key);
}
