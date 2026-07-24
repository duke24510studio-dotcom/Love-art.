"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputStyle = {
  backgroundColor: "#f5f0e8",
  borderColor: "#d8d0c0",
  color: "#2c2c2c",
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid #d8d0c0",
  outline: "none",
  fontSize: "0.875rem",
};

const FIELD = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className="block text-xs tracking-widest uppercase opacity-60">{label}</label>
    {children}
  </div>
);

export default function NewBlogPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "",
    excerpt: "",
    body: "",
    published: true,
  });

  const set = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "作成に失敗しました");
      router.push(`/blog-posts/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div style={{ borderBottom: "1px solid #d8d0c0", paddingBottom: "1rem" }}>
        <p className="text-xs tracking-[0.4em] uppercase opacity-50 mb-1">New</p>
        <h1 className="text-2xl font-light tracking-widest" style={{ color: "#2d5a3d" }}>
          新規ブログ記事
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 space-y-5 border" style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}>
          <FIELD label="タイトル">
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              style={inputStyle}
            />
          </FIELD>

          <FIELD label="slug（英数字・ハイフンのみ。空欄ならタイトルから自動生成を試みます）">
            <input
              type="text"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="tea-gift-guide-basics"
              style={inputStyle}
            />
          </FIELD>

          <FIELD label="カテゴリ">
            <input
              type="text"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="ギフト選び"
              style={inputStyle}
            />
          </FIELD>

          <FIELD label="抜粋（一覧ページに表示）">
            <textarea
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </FIELD>

          <FIELD label="本文（Markdown: ## 見出し / - 箇条書き / **太字** / --- 区切り線）">
            <textarea
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              rows={16}
              required
              style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }}
            />
          </FIELD>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
            />
            すぐに公開する（オフにすると下書きとして保存）
          </label>
        </div>

        {error && (
          <div className="px-4 py-3 text-sm border" style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#8b3a3a" }}>
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-xs tracking-widest uppercase border hover:opacity-70 transition-opacity"
            style={{ borderColor: "#d8d0c0" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
          >
            {loading ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
