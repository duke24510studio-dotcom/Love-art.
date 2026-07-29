import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HUMANIZE_PASSES, humanizeBody, isHumanizePassKey, orderPasses } from "@/lib/humanize";

// One OpenAI call per pass over a full article body.
export const maxDuration = 600;

const MAX_PASSES = 4;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const requested = Array.isArray(body.passes) ? body.passes : [];
  const keys = requested.filter(isHumanizePassKey);
  if (keys.length === 0) {
    return NextResponse.json(
      { error: `passes must contain at least one of: ${HUMANIZE_PASSES.map((p) => p.key).join(", ")}` },
      { status: 400 }
    );
  }
  if (keys.length > MAX_PASSES) {
    return NextResponse.json(
      { error: `Select at most ${MAX_PASSES} passes per run (each one is a separate model call)` },
      { status: 400 }
    );
  }

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!article.body.trim()) {
    return NextResponse.json({ error: "This article has no body to edit" }, { status: 400 });
  }

  try {
    const result = await humanizeBody(article.body, orderPasses(keys), article.language);

    const appliedLabels = result.applied.map((p) => p.labelJa);
    const humanizeLog = [article.humanizeLog, ...appliedLabels].filter(Boolean).join(", ");

    const updated = await prisma.article.update({
      where: { id },
      data: {
        // Keep the very first version so a bad edit is never destructive.
        rawBody: article.rawBody || article.body,
        body: result.body,
        humanizeLog,
      },
    });

    return NextResponse.json({ article: updated, applied: result.applied });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Humanize failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Restore the pre-edit draft. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!article.rawBody) {
    return NextResponse.json({ error: "No original draft stored" }, { status: 400 });
  }

  const updated = await prisma.article.update({
    where: { id },
    data: { body: article.rawBody, rawBody: "", humanizeLog: "" },
  });
  return NextResponse.json({ article: updated });
}
