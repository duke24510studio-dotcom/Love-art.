import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { buildScriptDocument, getProjectWithScenes } from "@/lib/video";

// Export one video project as a ZIP package for upload / manual editing:
// script.md, metadata.txt, scene images, narration audio, thumbnail, video.mp4.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProjectWithScenes(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const zip = new JSZip();

  zip.file("script.md", buildScriptDocument(project));
  zip.file(
    "metadata.txt",
    [
      "[YouTube Title]",
      project.title,
      "",
      "[Description]",
      project.description,
      "",
      "[Tags]",
      project.tags,
      "",
      "[Thumbnail Text]",
      project.thumbnailText,
    ].join("\n")
  );

  const addFile = (relPath: string, zipPath: string) => {
    if (!relPath) return;
    const abs = path.resolve(process.cwd(), relPath);
    if (fs.existsSync(abs)) {
      zip.file(zipPath, fs.readFileSync(abs));
    }
  };

  for (const scene of project.scenes) {
    addFile(scene.imagePath, `images/${path.basename(scene.imagePath || "")}`);
    addFile(scene.audioPath, `audio/${path.basename(scene.audioPath || "")}`);
  }
  addFile(project.thumbnailPath, "thumbnail.png");
  addFile(project.videoPath, "video.mp4");

  if (project.status === "approved") {
    await prisma.videoProject.update({ where: { id }, data: { status: "exported" } });
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  const slug = (project.title || project.topic).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="video-${slug || project.id}.zip"`,
    },
  });
}
