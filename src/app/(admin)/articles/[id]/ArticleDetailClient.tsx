"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Article } from "@/generated/prisma/client";

type ArticleWithSource = Article & {
  researchItem: { title: string; url: string } | null;
};

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
  en2ja: "→ note ランタンノート (Japanese)",
  stillflow: "→ note still flow / 円相 (Japanese)",
  econ: "→ note 経済/マーケティング解説 (Japanese)",
  ja2en: "→ Medium (English)",
};

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
        className="text-xs whitespace-pre-wrap p-3 border leading-relaxed max-h-96 overflow-y-auto"
        style={{ backgroundColor: "#f5f0e8", borderColor: "#d8d0c0", fontFamily: "inherit" }}
      >
        {value}
      </pre>
    </div>
  );
}

export default function ArticleDetailClient({ article }: { article: ArticleWithSource }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setStatus = async (status: string) => {
    setLoading(status);
    setError(null);
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link href="/articles" className="text-xs tracking-widest uppercase opacity-50 hover:opacity-80">
          ← Articles
        </Link>
        <div className="flex items-start justify-between gap-4 mt-3">
          <div>
            <h1 className="text-xl font-medium leading-snug">{article.title || article.topic}</h1>
            {article.subtitle && <p className="text-sm opacity-60 mt-1">{article.subtitle}</p>}
            <div className="text-xs opacity-40 mt-2 tracking-widest uppercase">
              {DIRECTION_LABELS[article.direction] ?? article.direction}
              {article.category ? ` · ${article.category}` : ""}
              {article.model ? ` · ${article.model}` : ""}
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
      </div>

      {article.researchItem && (
        <div className="border p-4 text-xs space-y-1" style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}>
          <div className="tracking-[0.3em] uppercase opacity-50">Inspiration source (not reproduced)</div>
          <div>{article.researchItem.title}</div>
          <a
            href={article.researchItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline opacity-60 hover:opacity-90 break-all"
          >
            {article.researchItem.url}
          </a>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {article.status !== "approved" && article.status !== "published" && (
          <button
            onClick={() => setStatus("approved")}
            disabled={loading !== null}
            className="px-5 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
          >
            {loading === "approved" ? "Saving..." : "Approve"}
          </button>
        )}
        {article.status === "approved" && (
          <button
            onClick={() => setStatus("published")}
            disabled={loading !== null}
            className="px-5 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "#3a5a8b", color: "#f5f0e8" }}
          >
            {loading === "published" ? "Saving..." : "Mark Published"}
          </button>
        )}
        {article.status !== "rejected" && article.status !== "published" && (
          <button
            onClick={() => setStatus("rejected")}
            disabled={loading !== null}
            className="px-5 py-2 text-xs tracking-widest uppercase border transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}
          >
            {loading === "rejected" ? "Saving..." : "Reject"}
          </button>
        )}
      </div>

      {error && (
        <div className="text-xs p-3 border" style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}>
          {error}
        </div>
      )}

      <div className="space-y-6">
        <CopyBlock label="Title" value={article.title} />
        <CopyBlock label="Subtitle" value={article.subtitle} />
        <CopyBlock label="Body (Markdown)" value={article.body} />
        <CopyBlock label="Tags" value={article.tags} />
      </div>

      <p className="text-xs opacity-40 leading-relaxed">
        Publishing is manual by design: copy the reviewed draft into note / Medium yourself.
        Auto-posting is intentionally not implemented (platform ToS + copyright policy — see
        docs/ARTICLE_PIPELINE.md).
      </p>
    </div>
  );
}
