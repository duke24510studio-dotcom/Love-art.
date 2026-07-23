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

const COLLECTIONS = [
  "All",
  "Kyoto Tea & Zen",
  "Showa Retro Japan",
  "Japanese Original Landscape",
  "Japandi Animals",
];

export default async function PostersPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string; status?: string }>;
}) {
  const { collection, status } = await searchParams;

  const themes = await prisma.posterTheme.findMany({
    where: {
      ...(collection && collection !== "All" ? { collection } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      generations: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between" style={{ borderBottom: "1px solid #d8d0c0", paddingBottom: "1rem" }}>
        <div>
          <p className="text-xs tracking-[0.4em] uppercase opacity-50 mb-1">Library</p>
          <h1 className="text-2xl font-light tracking-widest" style={{ color: "#2d5a3d" }}>
            Poster Themes
          </h1>
        </div>
        <Link
          href="/posters/new"
          className="px-5 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity"
          style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
        >
          + New Theme
        </Link>
      </div>

      {/* Collection filter */}
      <div className="flex flex-wrap gap-2">
        {COLLECTIONS.map((col) => {
          const isActive = (!collection && col === "All") || collection === col;
          const href =
            col === "All"
              ? "/posters"
              : `/posters?collection=${encodeURIComponent(col)}`;
          return (
            <Link
              key={col}
              href={href}
              className="px-3 py-1 text-xs tracking-widest uppercase border transition-opacity hover:opacity-70"
              style={{
                backgroundColor: isActive ? "#2d5a3d" : "#ede8dc",
                color: isActive ? "#f5f0e8" : "#2c2c2c",
                borderColor: "#d8d0c0",
              }}
            >
              {col}
            </Link>
          );
        })}
      </div>

      {themes.length === 0 ? (
        <div
          className="text-center py-20 border"
          style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
        >
          <p className="text-sm opacity-40 tracking-widest mb-4">No themes found</p>
          <Link
            href="/posters/new"
            className="text-xs tracking-widest uppercase hover:opacity-70"
            style={{ color: "#2d5a3d" }}
          >
            Register your first theme →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => {
            const latestGen = theme.generations[0];
            const displayStatus = latestGen?.status ?? theme.status;
            return (
              <Link
                key={theme.id}
                href={`/posters/${theme.id}`}
                className="border hover:opacity-90 transition-opacity block"
                style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
              >
                {/* Image placeholder */}
                <div
                  className={`w-full flex items-center justify-center ${
                    latestGen?.orientation === "landscape" ? "aspect-[16/9]" : "aspect-[2/3]"
                  }`}
                  style={{ backgroundColor: "#d8d0c0" }}
                >
                  {latestGen?.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/outputs/images/${latestGen.imagePath.split("/").pop()}`}
                      alt={theme.themeEn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center opacity-40">
                      <div className="text-4xl mb-2" style={{ color: "#2d5a3d" }}>
                        {theme.verticalTextJa}
                      </div>
                      <div className="text-xs tracking-widest uppercase">No image yet</div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm tracking-wide font-medium">{theme.themeJa}</div>
                      <div className="text-xs opacity-60">{theme.themeEn}</div>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 tracking-wider"
                      style={{
                        backgroundColor: STATUS_COLORS[displayStatus] ?? "#8a8a8a",
                        color: "#f5f0e8",
                      }}
                    >
                      {STATUS_LABELS[displayStatus] ?? displayStatus}
                    </span>
                  </div>
                  <div className="text-xs opacity-40 tracking-widest uppercase">{theme.collection}</div>
                  <div
                    className="mt-2 text-xs opacity-50 truncate"
                    style={{ borderTop: "1px solid #d8d0c0", paddingTop: "0.5rem", marginTop: "0.5rem" }}
                  >
                    {theme.stylePreset}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="text-xs tracking-widest opacity-40 text-right">
        {themes.length} theme{themes.length !== 1 ? "s" : ""} total
      </div>
    </div>
  );
}
