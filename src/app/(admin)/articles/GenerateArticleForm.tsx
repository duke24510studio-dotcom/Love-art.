"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DIRECTIONS = [
  { value: "en2ja", label: "→ note (ランタン)" },
  { value: "stillflow", label: "→ note (still flow)" },
  { value: "econ", label: "→ note (知の翻訳室)" },
  { value: "ja2en", label: "→ Medium (EN)" },
] as const;

const inputStyle = {
  backgroundColor: "#f5f0e8",
  borderColor: "#d8d0c0",
  color: "#2c2c2c",
  padding: "0.5rem 0.75rem",
  border: "1px solid #d8d0c0",
  outline: "none",
  fontSize: "0.875rem",
};

export default function GenerateArticleForm() {
  const router = useRouter();
  const [direction, setDirection] = useState<string>(DIRECTIONS[0].value);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, topic: topic.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate article");
      router.push(`/articles/${data.article.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(false);
    }
  };

  return (
    <div
      className="p-5 border space-y-3"
      style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
    >
      <p className="text-xs tracking-[0.3em] uppercase opacity-40">Generate Now</p>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="block text-xs tracking-widest uppercase opacity-60">Direction</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            style={inputStyle}
          >
            {DIRECTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 flex-1 min-w-[220px]">
          <label className="block text-xs tracking-widest uppercase opacity-60">
            Topic (optional)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Leave blank to pick from research feed / fallback topics"
            style={{ ...inputStyle, width: "100%" }}
          />
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="px-6 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
        >
          {loading ? "Generating..." : "Generate 1 Draft"}
        </button>
      </div>
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
