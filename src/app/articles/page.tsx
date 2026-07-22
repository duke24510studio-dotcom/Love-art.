import Link from "next/link";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  generated: "Generated",
  review: "Review",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  generated: "#4a7c6f",
  review: "#c9a84c",
  approved: "#2d5a3d",
  published: "#3a5a8b",
  rejected: "#8b3a3a",
};

const DIRECTION_LABELS: Record<string, string> = {
  en2ja: "→ note (ランタン)",
  stillflow: "→ note (still flow)",
  ja2en: "→ Medium (EN)",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string; status?: string }>;
}) {
  const { direction, status } = await searchParams;

  const articles = await prisma.article.findMany({
    where: {
      ...(direction ? { direction } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const filterLink = (params: Record<string, string | undefined>) => {
    const merged = { direction, status, ...params };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join("&");
    return qs ? `/articles?${qs}` : "/articles";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl tracking-[0.2em] font-light uppercase">Articles</h1>
          <p className="text-sm opacity-60 mt-2">
            AI-generated original drafts for note (JA) and Medium (EN). Review before publishing manually.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs tracking-widest uppercase">
        <div className="flex gap-2 items-center">
          <span className="opacity-40">Direction:</span>
          {[undefined, "en2ja", "stillflow", "ja2en"].map((d) => (
            <Link
              key={d ?? "all"}
              href={filterLink({ direction: d })}
              className="px-3 py-1 border transition-opacity hover:opacity-70"
              style={{
                borderColor: "#d8d0c0",
                backgroundColor: (direction ?? undefined) === d ? "#2d5a3d" : "transparent",
                color: (direction ?? undefined) === d ? "#f5f0e8" : "#2c2c2c",
              }}
            >
              {d ? DIRECTION_LABELS[d] : "All"}
            </Link>
          ))}
        </div>
        <div className="flex gap-2 items-center">
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

      {articles.length === 0 ? (
        <div
          className="border p-12 text-center text-sm opacity-60"
          style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
        >
          No article drafts yet. Run the pipeline (POST /api/cron/pipeline) or generate one via
          POST /api/articles.
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.id}`}
              className="block border p-5 transition-opacity hover:opacity-80"
              style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{article.title || article.topic}</div>
                  <div className="text-xs opacity-60 mt-1 truncate">{article.subtitle}</div>
                  <div className="text-xs opacity-40 mt-2 tracking-widest uppercase">
                    {DIRECTION_LABELS[article.direction] ?? article.direction}
                    {article.category ? ` · ${article.category}` : ""}
                    {" · "}
                    {new Date(article.createdAt).toISOString().slice(0, 10)}
                  </div>
                </div>
                <span
                  className="text-xs px-3 py-1 tracking-widest uppercase shrink-0"
                  style={{
                    backgroundColor: STATUS_COLORS[article.status] ?? "#8a8a8a",
                    color: "#f5f0e8",
                  }}
                >
                  {STATUS_LABELS[article.status] ?? article.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
