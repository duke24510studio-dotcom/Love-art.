import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import fs from "fs";
import path from "path";

export async function POST() {
  const approved = await prisma.posterGeneration.findMany({
    where: { status: "approved" },
    include: { theme: true },
    orderBy: { createdAt: "desc" },
  });

  const zip = new JSZip();

  // CSV manifest
  const headers = ["id", "title", "tags", "themeEn", "imagePath"];
  const rows = approved.map((g) =>
    [g.id, g.etsyTitle, g.etsyTags, g.theme.themeEn, g.imagePath]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  zip.file("manifest.csv", [headers.join(","), ...rows].join("\n"));

  // Image files
  for (const g of approved) {
    if (g.imagePath) {
      const absPath = path.resolve(process.cwd(), g.imagePath);
      if (fs.existsSync(absPath)) {
        const fileData = fs.readFileSync(absPath);
        zip.file(`images/${path.basename(g.imagePath)}`, fileData);
      }
    }
  }

  // Per-item text files
  for (const g of approved) {
    const slug = g.theme.themeEn.toLowerCase().replace(/\s+/g, "-");
    const txt = [
      `=== ${g.theme.themeEn} ===`,
      "",
      `[Etsy Title]`,
      g.etsyTitle,
      "",
      `[Etsy Description]`,
      g.etsyDescription,
      "",
      `[Tags]`,
      g.etsyTags,
      "",
      `[Instagram]`,
      g.instagramCaption,
      "",
      `[Pinterest]`,
      g.pinterestCaption,
      "",
      `[X / Twitter]`,
      g.xCaption,
    ].join("\n");
    zip.file(`copy/${slug}.txt`, txt);
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="japandi-export-${Date.now()}.zip"`,
    },
  });
}
