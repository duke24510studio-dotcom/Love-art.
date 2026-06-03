import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getGenerationWithTheme, syncThemeStatus } from "@/lib/generation";
import { getOpenAIClient, getOutputImagesDir } from "@/lib/openai";

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

    const openai = getOpenAIClient();
    const result = await openai.images.generate({
      model: "dall-e-3",
      prompt: generation.prompt,
      n: 1,
      size: "1024x1792",
      quality: "hd",
      response_format: "url",
    });

    const imageUrl = result.data?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL returned from OpenAI" }, { status: 502 });
    }

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return NextResponse.json({ error: "Failed to download generated image" }, { status: 502 });
    }

    const imagesDir = path.resolve(process.cwd(), getOutputImagesDir());
    fs.mkdirSync(imagesDir, { recursive: true });

    const filename = `${generationId}.png`;
    const absPath = path.join(imagesDir, filename);
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    fs.writeFileSync(absPath, buffer);

    const imagePath = path.join(getOutputImagesDir(), filename).replace(/\\/g, "/");

    const updated = await prisma.posterGeneration.update({
      where: { id: generationId },
      data: {
        imagePath,
        imageUrl,
        status: "generated",
      },
    });

    await syncThemeStatus(generation.themeId, "generated");

    return NextResponse.json({ generation: updated, imagePath });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Poster generation failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
