"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BlogPost } from "@/generated/prisma/client";

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

export default function BlogPostEditClient({ post }: { post: BlogPost }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: post.title,
    slug: post.slug,
    category: post.category,
    excerpt: post.excerpt,
    body: post.body,
    published: post.published,
  });

  const set = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (overrides: Partial<typeof form> = {}) => {
    setLoading("save");
    setError("");
    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...overrides }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
      if (overrides.published !== undefined) set("published", overrides.published as boolean);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setLoading(null);
    }
  };

  const remove = async () => {
    if (!confirm(`「${post.title}」を削除しますか？この操作は取り消せません。`)) return;
    await fetch(`/api/blog/${post.id}`, { method: "DELETE" });
    router.push("/blog-posts");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-start justify-between" style={{ borderBottom: "1px solid #d8d0c0", paddingBottom: "1rem" }}>
        <div>
          <Link href="/blog-posts" className="text-xs tracking-widest uppercase opacity-50 hover:opacity-70 transition-opacity block mb-2" style={{ color: "#2d5a3d" }}>
            ← 記事一覧
          </Link>
          <h1 className="text-xl font-medium leading-snug">{post.title}</h1>
          <p className="text-xs opacity-40 mt-1">
            公開URL:{" "}
            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="underline">
              /blog/{post.slug}
            </a>
          </p>
        </div>
        <button
          onClick={remove}
          className="text-xs tracking-widest uppercase opacity-30 hover:opacity-60 transition-opacity shrink-0"
          style={{ color: "#8b3a3a" }}
        >
          Delete
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => save({ published: !form.published })}
          disabled={loading !== null}
          className="px-5 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
          style={{ backgroundColor: form.published ? "#8a8a8a" : "#2d5a3d", color: "#f5f0e8" }}
        >
          {form.published ? "非公開にする" : "公開する"}
        </button>
        <span
          className="text-xs px-3 py-2 tracking-widest uppercase"
          style={{ backgroundColor: form.published ? "#2d5a3d" : "#8a8a8a", color: "#f5f0e8" }}
        >
          {form.published ? "公開中" : "非公開"}
        </span>
      </div>

      <div className="p-6 space-y-5 border" style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}>
        <FIELD label="タイトル">
          <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} style={inputStyle} />
        </FIELD>
        <FIELD label="slug">
          <input type="text" value={form.slug} onChange={(e) => set("slug", e.target.value)} style={inputStyle} />
        </FIELD>
        <FIELD label="カテゴリ">
          <input type="text" value={form.category} onChange={(e) => set("category", e.target.value)} style={inputStyle} />
        </FIELD>
        <FIELD label="抜粋">
          <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
        </FIELD>
        <FIELD label="本文（Markdown）">
          <textarea
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            rows={20}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }}
          />
        </FIELD>
      </div>

      {error && (
        <div className="text-xs p-3 border" style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}>
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => save()}
          disabled={loading !== null}
          className="px-6 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
        >
          {loading === "save" ? "保存中..." : "変更を保存"}
        </button>
      </div>
    </div>
  );
}
