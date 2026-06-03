import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGenerationWithTheme, syncThemeStatus } from "@/lib/generation";
import { AI_DISCLOSURE, getOpenAIClient } from "@/lib/openai";

type CopyPayload = {
  etsyTitle: string;
  etsyDescription: string;
  etsyTags: string;
  instagramCaption: string;
  pinterestCaption: string;
  xCaption: string;
};

const COPY_SYSTEM = `You write Etsy listing copy and social captions for Japandi-style Japanese wall art posters sold as digital downloads to overseas interior decor buyers.

Rules:
- Etsy title: English only, 120-140 characters, include Japandi/Japan keywords, no brand names or artist names
- etsyTags: exactly 13 comma-separated Etsy-friendly search phrases (no hashtags)
- etsyDescription: English, mention digital download, no physical item, no frame, warm professional tone
- Include this AI disclosure sentence verbatim at the end of the description: "${AI_DISCLOSURE}"
- Instagram: engaging caption with 8-12 relevant hashtags at the end
- Pinterest: descriptive pin text, SEO-friendly, 2-3 sentences
- X: short punchy post under 280 characters with 2-3 hashtags
- No trademarked characters, no copied artwork claims, no living artist names

Respond with valid JSON only, no markdown:
{
  "etsyTitle": "...",
  "etsyDescription": "...",
  "etsyTags": "tag1, tag2, ...",
  "instagramCaption": "...",
  "pinterestCaption": "...",
  "xCaption": "..."
}`;

function parseCopyJson(raw: string): CopyPayload {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  const parsed = JSON.parse(trimmed) as CopyPayload;
  const required = [
    "etsyTitle",
    "etsyDescription",
    "etsyTags",
    "instagramCaption",
    "pinterestCaption",
    "xCaption",
  ] as const;
  for (const key of required) {
    if (!parsed[key] || typeof parsed[key] !== "string") {
      throw new Error(`Missing or invalid field: ${key}`);
    }
  }
  return parsed;
}

function ensureDisclosure(description: string): string {
  if (description.includes(AI_DISCLOSURE)) return description;
  return `${description.trim()}\n\n${AI_DISCLOSURE}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const generationId = body.generationId as string | undefined;
    if (!generationId) {
      return NextResponse.json({ error: "generationId is required" }, { status: 400 });
    }

    const generation = await getGenerationWithTheme(generationId);
    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    const { theme } = generation;
    const userPrompt = [
      `Theme (EN): ${theme.themeEn}`,
      `Theme (JA): ${theme.themeJa}`,
      `Collection: ${theme.collection}`,
      `Vertical Japanese text: ${theme.verticalTextJa}`,
      `English subtitle: ${theme.subtitleEn}`,
      `Motif: ${theme.motif}`,
      `Color palette: ${theme.colorPalette}`,
      generation.prompt ? `Image prompt used:\n${generation.prompt}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: COPY_SYSTEM },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No copy returned from OpenAI" }, { status: 502 });
    }

    const copy = parseCopyJson(content);

    const updated = await prisma.posterGeneration.update({
      where: { id: generationId },
      data: {
        etsyTitle: copy.etsyTitle.trim(),
        etsyDescription: ensureDisclosure(copy.etsyDescription),
        etsyTags: copy.etsyTags.trim(),
        instagramCaption: copy.instagramCaption.trim(),
        pinterestCaption: copy.pinterestCaption.trim(),
        xCaption: copy.xCaption.trim(),
        status: "review",
      },
    });

    await syncThemeStatus(generation.themeId, "review");

    return NextResponse.json({ generation: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Copy generation failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
