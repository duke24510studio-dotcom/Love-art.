"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Article } from "@/generated/prisma/client";
import { HUMANIZE_PASSES, type HumanizePassKey } from "@/lib/humanize-passes";
import { getGenreLabel } from "@/lib/genres";

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
  econ: "→ note 知の翻訳室 (Japanese)",
  ja2en: "→ Medium (English)",
  note: "→ note (ジャンル別)",
};

/**
 * The editing passes from the reference prompt set. Applied in sequence, each
 * one a separate model call, always keeping the AI-disclosure line intact —
 * these improve how the prose reads, they are not detector evasion.
 */
function HumanizePanel({ article }: { article: ArticleWithSource }) {
  const router = useRouter();
  const [selected, setSelected] = useState<HumanizePassKey[]>(["editor", "finish"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = (key: HumanizePassKey) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : prev.length >= 4 ? prev : [...prev, key]
    );
  };

  const runPasses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/articles/${article.id}/humanize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passes: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "推敲に失敗しました");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "推敲に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const restore = async () => {
    if (!confirm("推敲前の原稿に戻しますか？（推敲結果は失われます）")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/articles/${article.id}/humanize`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "復元に失敗しました");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "復元に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-5 space-y-4" style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs tracking-[0.3em] uppercase opacity-40">推敲パス（最大4つ）</p>
        {article.humanizeLog && (
          <span className="text-xs opacity-50">適用済み: {article.humanizeLog}</span>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {HUMANIZE_PASSES.map((pass) => {
          const active = selected.includes(pass.key);
          return (
            <button
              key={pass.key}
              type="button"
              onClick={() => toggle(pass.key)}
              disabled={loading}
              className="text-left p-3 border transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{
                borderColor: active ? "#2d5a3d" : "#d8d0c0",
                backgroundColor: active ? "#2d5a3d" : "#f5f0e8",
                color: active ? "#f5f0e8" : "#2c2c2c",
              }}
            >
              <div className="text-xs font-medium">{pass.labelJa}</div>
              <div className="text-xs opacity-70 mt-1 leading-snug">{pass.descriptionJa}</div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={runPasses}
          disabled={loading || selected.length === 0}
          className="px-5 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
        >
          {loading ? "推敲中..." : `${selected.length}パスで書き直す`}
        </button>
        {article.rawBody && (
          <button
            onClick={restore}
            disabled={loading}
            className="px-5 py-2 text-xs tracking-widest uppercase border transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}
          >
            推敲前に戻す
          </button>
        )}
      </div>

      <p className="text-xs opacity-40 leading-relaxed">
        1パスにつき1回モデルを呼びます。①〜⑦で整えてから⑧仕上げ、が基本の並びです。
        どのパスを選んでも、末尾のAI開示文は必ず残ります。
      </p>

      {error && (
        <div className="text-xs p-3 border" style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}>
          {error}
        </div>
      )}
    </div>
  );
}

/** Kick off a YouTube video plan from this article. */
function MakeVideoButton({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [format, setFormat] = useState("long");

  const create = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "動画台本の生成に失敗しました");
      router.push(`/videos/${data.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラー");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        disabled={loading}
        style={{
          backgroundColor: "#f5f0e8",
          border: "1px solid #d8d0c0",
          padding: "0.5rem 0.75rem",
          fontSize: "0.75rem",
          outline: "none",
        }}
      >
        <option value="long">横型 16:9（4〜6分）</option>
        <option value="short">縦型 9:16（Shorts）</option>
      </select>
      <button
        onClick={create}
        disabled={loading}
        className="px-5 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ backgroundColor: "#3a5a8b", color: "#f5f0e8" }}
      >
        {loading ? "台本を生成中..." : "この記事から動画を作る →"}
      </button>
      {error && (
        <span className="text-xs" style={{ color: "#8b3a3a" }}>
          {error}
        </span>
      )}
    </div>
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
              {article.genre ? ` · ${getGenreLabel(article.genre)}` : ""}
              {article.category && article.category !== article.genre
                ? ` · ${article.category}`
                : ""}
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

      <MakeVideoButton articleId={article.id} />

      <HumanizePanel article={article} />

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
