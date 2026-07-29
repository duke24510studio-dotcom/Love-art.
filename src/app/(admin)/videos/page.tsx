import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { assetUrl } from "@/lib/asset-url";
import { getVideoStyle } from "@/lib/video-style";
import { totalDuration } from "@/lib/video-presets";
import NewVideoForm from "./NewVideoForm";

const STATUS_LABELS: Record<string, string> = {
  planned: "台本のみ",
  images: "画像あり",
  narrated: "音声あり",
  ready: "書き出し可",
  published: "投稿済み",
  rejected: "却下",
};

const STATUS_COLORS: Record<string, string> = {
  planned: "#8a8a8a",
  images: "#4a7c6f",
  narrated: "#c9a84c",
  ready: "#2d5a3d",
  published: "#3a5a8b",
  rejected: "#8b3a3a",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const [projects, articles] = await Promise.all([
    prisma.videoProject.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      include: { scenes: { orderBy: { index: "asc" } } },
      take: 60,
    }),
    prisma.article.findMany({
      where: { language: "ja" },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, genre: true, status: true },
      take: 60,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl tracking-[0.2em] font-light uppercase">YouTube Studio</h1>
        <p className="text-sm opacity-60 mt-2">
          note記事から、ナレーション台本・シーン画像・音声・字幕・概要欄までを生成します。
          動画の書き出しはブラウザ内で行い、YouTubeへの投稿は手動です。
        </p>
      </div>

      <NewVideoForm articles={articles} />

      <div className="flex flex-wrap gap-2 items-center text-xs tracking-widest uppercase">
        <span className="opacity-40">Status:</span>
        {[undefined, ...Object.keys(STATUS_LABELS)].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/videos?status=${s}` : "/videos"}
            className="px-3 py-1 border transition-opacity hover:opacity-70"
            style={{
              borderColor: "#d8d0c0",
              backgroundColor: (status ?? undefined) === s ? "#2d5a3d" : "transparent",
              color: (status ?? undefined) === s ? "#f5f0e8" : "#2c2c2c",
            }}
          >
            {s ? STATUS_LABELS[s] : "All"}
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <div
          className="border p-12 text-center text-sm opacity-60"
          style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
        >
          まだ動画プロジェクトがありません。上のフォームから台本を生成してください。
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => {
            const withImages = project.scenes.filter((s) => s.imagePath).length;
            const withAudio = project.scenes.filter((s) => s.audioPath).length;
            const cover = project.thumbnailPath || project.scenes.find((s) => s.imagePath)?.imagePath;

            return (
              <Link
                key={project.id}
                href={`/videos/${project.id}`}
                className="block border p-4 transition-opacity hover:opacity-80"
                style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
              >
                <div className="flex gap-4">
                  <div
                    className="shrink-0 overflow-hidden"
                    style={{
                      width: project.format === "short" ? 68 : 120,
                      height: 68,
                      backgroundColor: "#f5f0e8",
                    }}
                  >
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={assetUrl(cover)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-medium leading-snug line-clamp-2">
                        {project.title || project.topic}
                      </div>
                      <span
                        className="text-xs px-2 py-1 tracking-widest uppercase shrink-0"
                        style={{
                          backgroundColor: STATUS_COLORS[project.status] ?? "#8a8a8a",
                          color: "#f5f0e8",
                        }}
                      >
                        {STATUS_LABELS[project.status] ?? project.status}
                      </span>
                    </div>
                    <div className="text-xs opacity-50 mt-2 tracking-wider">
                      {project.format === "short" ? "縦 9:16" : "横 16:9"} ·{" "}
                      {getVideoStyle(project.visualStyle).labelJa} · {project.scenes.length}シーン ·{" "}
                      約{formatDuration(totalDuration(project.scenes))}
                    </div>
                    <div className="text-xs opacity-40 mt-1 tracking-wider">
                      画像 {withImages}/{project.scenes.length} · 音声 {withAudio}/
                      {project.scenes.length}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
