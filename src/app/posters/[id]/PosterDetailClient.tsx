"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PosterTheme, PosterGeneration } from "@/generated/prisma/client";

type ThemeWithGenerations = PosterTheme & { generations: PosterGeneration[] };

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

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="text-xs px-3 py-1 tracking-widest uppercase"
      style={{
        backgroundColor: STATUS_COLORS[status] ?? "#8a8a8a",
        color: "#f5f0e8",
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.3em] uppercase opacity-50">{label}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-xs tracking-widest hover:opacity-60 transition-opacity"
          style={{ color: "#2d5a3d" }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre
        className="text-xs whitespace-pre-wrap p-3 border leading-relaxed"
        style={{ backgroundColor: "#f5f0e8", borderColor: "#d8d0c0", fontFamily: "inherit" }}
      >
        {value}
      </pre>
    </div>
  );
}

export default function PosterDetailClient({ theme }: { theme: ThemeWithGenerations }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const latestGen = theme.generations[0] ?? null;

  const updateGenStatus = async (genId: string, status: string) => {
    setLoading(status);
    await fetch(`/api/generations/${genId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(null);
    router.refresh();
  };

  const deleteTheme = async () => {
    if (!confirm(`Delete "${theme.themeEn}"? This cannot be undone.`)) return;
    await fetch(`/api/posters/${theme.id}`, { method: "DELETE" });
    router.push("/posters");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between" style={{ borderBottom: "1px solid #d8d0c0", paddingBottom: "1rem" }}>
        <div>
          <Link
            href="/posters"
            className="text-xs tracking-widest uppercase opacity-50 hover:opacity-70 transition-opacity block mb-2"
            style={{ color: "#2d5a3d" }}
          >
            ← Posters
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-light tracking-widest" style={{ color: "#2d5a3d" }}>
              {theme.themeJa}
            </h1>
            <StatusBadge status={latestGen?.status ?? theme.status} />
          </div>
          <p className="text-sm opacity-60 mt-1">{theme.themeEn}</p>
          <p className="text-xs opacity-40 tracking-widest uppercase mt-1">{theme.collection}</p>
        </div>
        <button
          onClick={deleteTheme}
          className="text-xs tracking-widest uppercase opacity-30 hover:opacity-60 transition-opacity"
          style={{ color: "#8b3a3a" }}
        >
          Delete
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Image + theme info */}
        <div className="space-y-6">
          {/* Image */}
          <div
            className="w-full aspect-[2/3] flex items-center justify-center border"
            style={{ backgroundColor: "#d8d0c0", borderColor: "#d8d0c0" }}
          >
            {latestGen?.imagePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/outputs/images/${latestGen.imagePath.split("/").pop()}`}
                alt={theme.themeEn}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center opacity-40 p-8">
                <div
                  className="text-5xl mb-3 font-light"
                  style={{ color: "#2d5a3d", writingMode: "vertical-rl" }}
                >
                  {theme.verticalTextJa}
                </div>
                <div className="text-xs tracking-[0.3em] uppercase mt-4">{theme.subtitleEn}</div>
                <div className="text-xs mt-4 opacity-60">No image generated yet</div>
              </div>
            )}
          </div>

          {/* Theme details */}
          <div
            className="p-5 border space-y-3"
            style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
          >
            <p className="text-xs tracking-[0.3em] uppercase opacity-40">Theme Details</p>
            {[
              { label: "Vertical Text", value: theme.verticalTextJa },
              { label: "Subtitle", value: theme.subtitleEn },
              { label: "Style Preset", value: theme.stylePreset },
              { label: "Color Palette", value: theme.colorPalette },
            ].map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <span className="text-xs opacity-40 tracking-widest uppercase block">{label}</span>
                  <span className="text-sm">{value}</span>
                </div>
              ) : null
            )}
            <div>
              <span className="text-xs opacity-40 tracking-widest uppercase block">Motif</span>
              <span className="text-sm leading-relaxed">{theme.motif}</span>
            </div>
          </div>
        </div>

        {/* Right: Generation content */}
        <div className="space-y-6">
          {/* Actions */}
          {latestGen ? (
            <div
              className="p-5 border space-y-4"
              style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
            >
              <p className="text-xs tracking-[0.3em] uppercase opacity-40">Review Actions</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateGenStatus(latestGen.id, "approved")}
                  disabled={loading !== null || latestGen.status === "approved"}
                  className="px-4 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-30"
                  style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
                >
                  {loading === "approved" ? "..." : "✓ Approve"}
                </button>
                <button
                  onClick={() => updateGenStatus(latestGen.id, "rejected")}
                  disabled={loading !== null || latestGen.status === "rejected"}
                  className="px-4 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-30"
                  style={{ backgroundColor: "#8b3a3a", color: "#f5f0e8" }}
                >
                  {loading === "rejected" ? "..." : "✕ Reject"}
                </button>
                <button
                  onClick={() => updateGenStatus(latestGen.id, "review")}
                  disabled={loading !== null}
                  className="px-4 py-2 text-xs tracking-widest uppercase border hover:opacity-80 transition-opacity disabled:opacity-30"
                  style={{ borderColor: "#d8d0c0" }}
                >
                  ↻ Re-review
                </button>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs opacity-40 tracking-widest uppercase">Status:</span>
                <StatusBadge status={latestGen.status} />
              </div>
            </div>
          ) : (
            <div
              className="p-5 border text-center"
              style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
            >
              <p className="text-xs opacity-40 tracking-widest mb-2">No generation yet</p>
              <p className="text-xs opacity-60">
                Use the AI generation tools to generate a prompt, image, and copy.
              </p>
            </div>
          )}

          {/* Prompt */}
          {latestGen?.prompt && (
            <CopyBlock label="Image Generation Prompt" value={latestGen.prompt} />
          )}

          {/* Etsy copy */}
          {latestGen?.etsyTitle && (
            <div
              className="p-5 border space-y-4"
              style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
            >
              <p className="text-xs tracking-[0.3em] uppercase opacity-40">Etsy Copy</p>
              <CopyBlock label="Title" value={latestGen.etsyTitle} />
              <CopyBlock label="Description" value={latestGen.etsyDescription} />
              <CopyBlock label="Tags (13)" value={latestGen.etsyTags} />
            </div>
          )}

          {/* SNS copy */}
          {(latestGen?.instagramCaption || latestGen?.pinterestCaption || latestGen?.xCaption) && (
            <div
              className="p-5 border space-y-4"
              style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
            >
              <p className="text-xs tracking-[0.3em] uppercase opacity-40">SNS Captions</p>
              <CopyBlock label="Instagram" value={latestGen.instagramCaption} />
              <CopyBlock label="Pinterest" value={latestGen.pinterestCaption} />
              <CopyBlock label="X / Twitter" value={latestGen.xCaption} />
            </div>
          )}
        </div>
      </div>

      {/* All generations history */}
      {theme.generations.length > 1 && (
        <div>
          <h2 className="text-xs tracking-[0.4em] uppercase opacity-50 mb-3">Generation History</h2>
          <div className="space-y-2">
            {theme.generations.map((g, i) => (
              <div
                key={g.id}
                className="border px-4 py-3 flex justify-between items-center text-sm"
                style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
              >
                <span className="opacity-50">
                  #{theme.generations.length - i} — {new Date(g.createdAt).toLocaleString()}
                </span>
                <StatusBadge status={g.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
