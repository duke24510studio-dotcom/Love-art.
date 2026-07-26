import { getOpenAIClient } from "@/lib/openai";
import { ARTICLE_DISCLOSURE_EN, ARTICLE_DISCLOSURE_JA } from "@/lib/article";
import { HUMANIZE_PASSES, orderPasses, type HumanizePassKey } from "@/lib/humanize-passes";

// Re-exported so server-side callers keep a single import site.
export * from "@/lib/humanize-passes";

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

const SYSTEM_BASE = `You are a meticulous Japanese copy editor working on a draft that will be published on note (note.com) under the author's own name.

ABSOLUTE RULES for every rewrite:
- Preserve the meaning, the facts, the structure of the argument, and the author's intent. You are editing prose, not rewriting content.
- Do NOT add new facts, statistics, studies, product names, prices, or personal experiences that are not already in the draft.
- Do NOT remove, reword, or relocate the AI-disclosure line at the end of the article. It must survive verbatim as the last line.
- Keep Markdown structure (headings, lists, blank lines) intact unless the instruction explicitly asks you to adjust paragraphing.
- Do not add meta-commentary, preambles, or notes about what you changed.
- Return ONLY the rewritten article body. No code fences, no explanation.`;

const SYSTEM_BASE_EN = `You are a meticulous English copy editor working on a draft that will be published on Medium under the author's own name.

ABSOLUTE RULES for every rewrite:
- Preserve the meaning, the facts, the structure of the argument, and the author's intent. You are editing prose, not rewriting content.
- Do NOT add new facts, statistics, studies, product names, prices, or personal experiences that are not already in the draft.
- Do NOT remove, reword, or relocate the AI-disclosure line at the end of the article. It must survive verbatim as the last line.
- Keep Markdown structure intact unless the instruction explicitly asks you to adjust paragraphing.
- Do not add meta-commentary or notes about what you changed.
- Return ONLY the rewritten article body. No code fences, no explanation.`;

export function getHumanizeModel(): string {
  return process.env.HUMANIZE_MODEL || process.env.ARTICLE_MODEL || "gpt-4o";
}

/** Re-append the disclosure if a pass dropped it despite the instruction. */
function restoreDisclosure(body: string, language: string): string {
  const disclosure = language === "en" ? ARTICLE_DISCLOSURE_EN : ARTICLE_DISCLOSURE_JA;
  const cleaned = body.trim().replace(/^```(?:markdown|md)?\s*/i, "").replace(/```\s*$/, "").trim();
  if (cleaned.includes(disclosure)) return cleaned;
  return `${cleaned}\n\n${disclosure}`;
}

export type HumanizeResult = {
  body: string;
  applied: { key: HumanizePassKey; labelJa: string }[];
};

/**
 * Run the requested editing passes in canonical order, feeding each pass the
 * previous pass's output. One OpenAI call per pass, so keep the selection small.
 */
export async function humanizeBody(
  body: string,
  keys: HumanizePassKey[],
  language = "ja"
): Promise<HumanizeResult> {
  const ordered = orderPasses(keys);
  if (ordered.length === 0) {
    throw new Error("Select at least one editing pass");
  }

  const openai = getOpenAIClient();
  const model = getHumanizeModel();
  const system = language === "en" ? SYSTEM_BASE_EN : SYSTEM_BASE;

  let current = body;
  const applied: HumanizeResult["applied"] = [];

  for (const key of ordered) {
    const pass = HUMANIZE_PASSES.find((p) => p.key === key);
    if (!pass) continue;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `${pass.instruction}\n\n---- 記事本文 ----\n${current}`,
        },
      ],
      temperature: 0.7,
    });

    const next = completion.choices[0]?.message?.content?.trim();
    if (!next) {
      throw new Error(`Pass "${pass.labelJa}" returned nothing`);
    }
    current = restoreDisclosure(next, language);
    applied.push({ key: pass.key, labelJa: pass.labelJa });
  }

  return { body: current, applied };
}
