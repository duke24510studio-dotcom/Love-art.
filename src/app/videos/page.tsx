import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VIDEO_PILLARS } from "@/lib/video";

const STATUS_LABELS: Record<string, string> = {
  idea: "Idea",
  scripted: "Scripted",
  voiced: "Voiced",
  visualized: "Visualized",
  assembled: "Assembled",
  review: "Review",
  approved: "Approved",
  exported: "Exported",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  idea: "#8a8a8a",
  scripted: "#7a9e7e",
  voiced: "#4a7c6f",
  visualized: "#4a7c6f",
  assembled: "#3a5a8b",
  review: "#c9a84c",
  approved: "#2d5a3d",
  exported: "#3a5a8b",
  rejected: "#8b3a3a",
};

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; pillar?: string }>;
}) {
  const { status, pillar } = await searchParams;

  const projects = await prisma.videoProject.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(pillar ? { pillar } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { scenes: { select: { id: true } } },
  });

  const filterLink = (params: Record<string, string | undefined>) => {
    const merged = { status, pillar, ...params };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join("&");
    return qs ? `/videos?${qs}` : "/videos";
  };

  const pillarLabel = (id: string) => VIDEO_PILLARS.find((p) => p.id === id)?.label ?? id;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl tracking-[0.2em] font-light uppercase">Videos</h1>
          <p className="text-sm opacity-60 mt-2">
            Faceless YouTube drafts on Japandi / wabi-sabi living. Script → voice → visuals → assembly,
            then human review before uploading manually.
          </p>
        </div>
        <Link
          href="/videos/new"
          className="px-4 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity shrink-0"
          style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
        >
          + New Video
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 text-xs tracking-widest uppercase">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="opacity-40">Status:</span>
          {[undefined, ...Object.keys(STATUS_LABELS)].map((s) => (
            <Link
              key={s ?? "all"}
              href={filterLink({ status: s })}
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
      </div>

      {projects.length === 0 ? (
        <div
          className="border p-12 text-center text-sm opacity-60"
          style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
        >
          No video drafts yet.{" "}
          <Link href="/videos/new" style={{ color: "#2d5a3d" }}>
            Create your first video →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/videos/${project.id}`}
              className="block border p-5 transition-opacity hover:opacity-80"
              style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{project.title || project.topic}</div>
                  <div className="text-xs opacity-40 mt-2 tracking-widest uppercase">
                    {pillarLabel(project.pillar)}
                    {" · "}~{project.durationTargetMin} min
                    {" · "}
                    {project.scenes.length} scenes
                    {" · "}
                    {new Date(project.createdAt).toISOString().slice(0, 10)}
                  </div>
                </div>
                <span
                  className="text-xs px-3 py-1 tracking-widest uppercase shrink-0"
                  style={{
                    backgroundColor: STATUS_COLORS[project.status] ?? "#8a8a8a",
                    color: "#f5f0e8",
                  }}
                >
                  {STATUS_LABELS[project.status] ?? project.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
