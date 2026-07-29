"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VIDEO_STYLES } from "@/lib/video-style";
import { VIDEO_VOICES } from "@/lib/video-presets";

type ArticleOption = { id: string; title: string; genre: string; status: string };

const inputStyle = {
  backgroundColor: "#f5f0e8",
  borderColor: "#d8d0c0",
  color: "#2c2c2c",
  padding: "0.5rem 0.75rem",
  border: "1px solid #d8d0c0",
  outline: "none",
  fontSize: "0.875rem",
};

export default function NewVideoForm({ articles }: { articles: ArticleOption[] }) {
  const router = useRouter();
  const [articleId, setArticleId] = useState("");
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("long");
  const [visualStyle, setVisualStyle] = useState("japandi");
  const [voice, setVoice] = useState("alloy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!articleId && !topic.trim()) {
      setError("記事を選ぶか、トピックを入力してください");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: articleId || undefined,
          topic: topic.trim() || undefined,
          format,
          visualStyle,
          voice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to plan video");
      router.push(`/videos/${data.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(false);
    }
  };

  return (
    <div className="p-5 border space-y-4" style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}>
      <p className="text-xs tracking-[0.3em] uppercase opacity-40">New Video Plan</p>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-xs tracking-widest uppercase opacity-60">
            記事から作る
          </label>
          <select
            value={articleId}
            onChange={(e) => setArticleId(e.target.value)}
            style={{ ...inputStyle, width: "100%" }}
          >
            <option value="">— 記事を使わない —</option>
            {articles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title.slice(0, 48)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs tracking-widest uppercase opacity-60">
            またはトピックから (任意)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例: 夜にスマホを置く場所を変える"
            style={{ ...inputStyle, width: "100%" }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="block text-xs tracking-widest uppercase opacity-60">形式</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} style={inputStyle}>
            <option value="long">横型 16:9（4〜6分）</option>
            <option value="short">縦型 9:16（Shorts / 60秒未満）</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs tracking-widest uppercase opacity-60">映像スタイル</label>
          <select
            value={visualStyle}
            onChange={(e) => setVisualStyle(e.target.value)}
            style={inputStyle}
          >
            {VIDEO_STYLES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.labelJa}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs tracking-widest uppercase opacity-60">読み上げ音声</label>
          <select value={voice} onChange={(e) => setVoice(e.target.value)} style={inputStyle}>
            {VIDEO_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.labelJa}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          className="px-6 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
        >
          {loading ? "構成を生成中..." : "台本を生成"}
        </button>
      </div>

      <p className="text-xs opacity-40 leading-relaxed">
        まず台本とシーン構成だけを作ります。画像・ナレーション・書き出しは詳細画面から順に実行します。
      </p>

      {error && (
        <div
          className="px-4 py-3 text-sm border"
          style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#8b3a3a" }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
