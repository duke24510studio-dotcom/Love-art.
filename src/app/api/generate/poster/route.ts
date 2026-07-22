import { NextRequest, NextResponse } from "next/server";
import { getGenerationWithTheme } from "@/lib/generation";
import { renderPosterImage } from "@/lib/poster-image";

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
    if (!generation.prompt) {
      return NextResponse.json(
        { error: "No prompt on this generation. Generate a prompt first." },
        { status: 400 }
      );
    }

    const updated = await renderPosterImage(generation);
    return NextResponse.json({ generation: updated, imagePath: updated.imagePath });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Poster generation failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
