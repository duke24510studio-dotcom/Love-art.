import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const generation = await prisma.posterGeneration.create({
    data: {
      themeId: body.themeId,
      prompt: body.prompt ?? "",
      status: "prompted",
    },
  });

  return NextResponse.json(generation, { status: 201 });
}
