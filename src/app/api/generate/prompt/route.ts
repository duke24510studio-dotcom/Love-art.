import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPosterPrompt } from "@/lib/prompt";
import {
  getOrCreateActiveGeneration,
  getThemeWithGenerations,
  syncThemeStatus,
} from "@/lib/generation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const themeId = body.themeId as string | undefined;
    if (!themeId) {
      return NextResponse.json({ error: "themeId is required" }, { status: 400 });
    }

    const theme = await getThemeWithGenerations(themeId);
    if (!theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });
    }

    const prompt = buildPosterPrompt(theme);
    const generation = await getOrCreateActiveGeneration(themeId);

    const updated = await prisma.posterGeneration.update({
      where: { id: generation.id },
      data: { prompt, status: "prompted" },
    });

    await syncThemeStatus(themeId, "prompted");

    return NextResponse.json({ generation: updated, prompt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prompt generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
