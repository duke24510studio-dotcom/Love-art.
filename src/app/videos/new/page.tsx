"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PILLARS: { id: string; label: string; topics: string[] }[] = [
  {
    id: "morning-routine",
    label: "Morning / Evening Routines",
    topics: ["7 Japanese Morning Habits for a Calm Mind"],
  },
  {
    id: "minimal-home",
    label: "Minimalist Home Habits",
    topics: ["The Minimalist Rule Japanese People Follow Daily"],
  },
  { id: "kitchen", label: "Kitchen Rules", topics: ["Why Japanese Kitchens Never Get Messy"] },
  { id: "calm-mind", label: "Habits for a Calm Mind", topics: ["Japanese Habits That Quietly Reduce Stress"] },
  {
    id: "longevity",
    label: "Longevity & Healthy Aging",
    topics: ["Hara Hachi Bu: The Japanese Habit of Eating Until 80% Full"],
  },
  {
    id: "mottainai",
    label: "Mottainai / Mindful Spending",
    topics: ["Mottainai: The Japanese Mindset That Saves Money Naturally"],
  },
  { id: "ikigai", label: "Ikigai & Purpose", topics: ["Ikigai: Finding a Reason to Get Up in the Morning"] },
  {
    id: "cleaning-ritual",
    label: "Cleaning & Organization Rituals",
    topics: ["Why Cleaning Is a Daily Ritual in Japan, Not a Chore"],
  },
  {
    id: "wabi-sabi",
    label: "Wabi-Sabi & Zen Teachings",
    topics: ["Wabi-Sabi: Learning to Love Imperfection at Home"],
  },
];

const VOICES = [
  { id: "onyx", label: "Onyx — deep, calm (male)" },
  { id: "echo", label: "Echo — soft, steady (male)" },
  { id: "alloy", label: "Alloy — neutral, warm" },
  { id: "ash", label: "Ash — gentle, low" },
  { id: "sage", label: "Sage — quiet, thoughtful" },
  { id: "shimmer", label: "Shimmer — light, warm (female)" },
];

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

export default function NewVideoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    pillar: PILLARS[0].id,
    topic: "",
    durationTargetMin: "10",
    voice: "onyx",
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const currentPillar = PILLARS.find((p) => p.id === form.pillar) ?? PILLARS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          durationTargetMin: Number(form.durationTargetMin),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create video project");
      }
      const data = await res.json();
      router.push(`/videos/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div style={{ borderBottom: "1px solid #d8d0c0", paddingBottom: "1rem" }}>
        <p className="text-xs tracking-[0.4em] uppercase opacity-50 mb-1">New</p>
        <h1 className="text-2xl font-light tracking-widest" style={{ color: "#2d5a3d" }}>
          New Faceless Video
        </h1>
        <p className="text-sm opacity-60 mt-2">
          Leave the topic empty to auto-pick the next unused topic from the idea bank.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className="p-6 space-y-5 border"
          style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
        >
          <div className="space-y-1">
            <label className="block text-xs tracking-widest uppercase opacity-60">Content Pillar</label>
            <select value={form.pillar} onChange={(e) => set("pillar", e.target.value)} style={inputStyle}>
              {PILLARS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs tracking-widest uppercase opacity-60">Topic (English)</label>
            <input
              type="text"
              value={form.topic}
              onChange={(e) => set("topic", e.target.value)}
              placeholder={`e.g. ${currentPillar.topics[0]}`}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => set("topic", currentPillar.topics[0])}
              className="text-xs tracking-widest hover:opacity-60 transition-opacity"
              style={{ color: "#2d5a3d" }}
            >
              Use example topic
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs tracking-widest uppercase opacity-60">Target Length</label>
              <select
                value={form.durationTargetMin}
                onChange={(e) => set("durationTargetMin", e.target.value)}
                style={inputStyle}
              >
                {["8", "10", "12", "15", "18"].map((m) => (
                  <option key={m} value={m}>
                    ~{m} minutes
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs tracking-widest uppercase opacity-60">Narration Voice</label>
              <select value={form.voice} onChange={(e) => set("voice", e.target.value)} style={inputStyle}>
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="px-4 py-3 text-sm border"
            style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#8b3a3a" }}
          >
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
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
