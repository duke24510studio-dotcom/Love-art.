import Link from "next/link";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  idea: "Idea",
  prompted: "Prompted",
  generated: "Generated",
  review: "Review",
  approved: "Approved",
  rejected: "Rejected",
  exported: "Exported",
};

const STATUS_COLORS: Record<string, string> = {
  idea: "#8a8a8a",
  prompted: "#7a9e7e",
  generated: "#4a7c6f",
  review: "#c9a84c",
  approved: "#2d5a3d",
  rejected: "#8b3a3a",
  exported: "#3a5a8b",
};

export default async function DashboardPage() {
  const [themeCount, generationCount, themes] = await Promise.all([
    prisma.posterTheme.count(),
    prisma.posterGeneration.count(),
    prisma.posterTheme.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { generations: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);

  const approvedCount = await prisma.posterGeneration.count({ where: { status: "approved" } });
  const generatedCount = await prisma.posterGeneration.count({ where: { status: "generated" } });

  const collectionCounts = await prisma.posterTheme.groupBy({
    by: ["collection"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  return (
    <div className="space-y-10">
      <div className="pt-4 pb-2" style={{ borderBottom: "1px solid #d8d0c0" }}>
        <p className="text-xs tracking-[0.4em] uppercase opacity-50 mb-1">Studio Dashboard</p>
        <h1 className="text-3xl font-light tracking-widest" style={{ color: "#2d5a3d" }}>
          和 の 作 業 台
        </h1>
        <p className="text-sm opacity-60 mt-1 tracking-wide">Japandi Poster Auto Studio</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Themes", value: themeCount },
          { label: "Generations", value: generationCount },
          { label: "Approved", value: approvedCount },
          { label: "Generated", value: generatedCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border p-5 text-center"
            style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
          >
            <div className="text-3xl font-light tracking-wider" style={{ color: "#2d5a3d" }}>
              {stat.value}
            </div>
            <div className="text-xs tracking-widest uppercase opacity-50 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xs tracking-[0.4em] uppercase opacity-50 mb-4">Collections</h2>
          <div className="space-y-2">
            {collectionCounts.map((c) => (
              <div
                key={c.collection}
                className="border px-4 py-3 flex justify-between items-center"
                style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
              >
                <span className="text-sm tracking-wide">{c.collection}</span>
                <span
                  className="text-xs px-2 py-0.5 tracking-widest"
                  style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
                >
                  {c._count.id}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs tracking-[0.4em] uppercase opacity-50 mb-4">Recent Themes</h2>
          <div className="space-y-2">
            {themes.map((theme) => {
              const latestGen = theme.generations[0];
              const status = latestGen?.status ?? theme.status;
              return (
                <Link
                  key={theme.id}
                  href={`/posters/${theme.id}`}
                  className="border px-4 py-3 flex justify-between items-center hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0", display: "flex" }}
                >
                  <div>
                    <span className="text-sm tracking-wide">{theme.themeJa}</span>
                    <span className="text-xs opacity-50 ml-2">{theme.themeEn}</span>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 tracking-widest"
                    style={{
                      backgroundColor: STATUS_COLORS[status] ?? "#8a8a8a",
                      color: "#f5f0e8",
                    }}
                  >
                    {STATUS_LABELS[status] ?? status}
                  </span>
                </Link>
              );
            })}
          </div>
          {themes.length === 0 && (
            <div className="text-sm opacity-40 text-center py-8 border" style={{ borderColor: "#d8d0c0" }}>
              No themes yet. <Link href="/posters/new" style={{ color: "#2d5a3d" }}>Add your first theme →</Link>
            </div>
          )}
          <div className="mt-4 text-right">
            <Link href="/posters" className="text-xs tracking-widest uppercase hover:opacity-70" style={{ color: "#2d5a3d" }}>
              View all posters →
            </Link>
          </div>
        </div>
      </div>

      <div className="border p-6" style={{ borderColor: "#d8d0c0" }}>
        <h2 className="text-xs tracking-[0.4em] uppercase opacity-50 mb-5">Core Workflow</h2>
        <div className="flex flex-wrap gap-2 items-center text-sm">
          {[
            "① Register Theme",
            "② Generate Prompt",
            "③ Generate Image",
            "④ Generate Etsy Copy",
            "⑤ Generate SNS Copy",
            "⑥ Review",
            "⑦ Approve / Reject",
            "⑧ Export CSV & ZIP",
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span
                className="px-3 py-1 text-xs tracking-wide"
                style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
              >
                {step}
              </span>
              {i < 7 && <span className="opacity-30">→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
