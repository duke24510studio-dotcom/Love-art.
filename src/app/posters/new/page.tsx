"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COLLECTIONS = [
  "Kyoto Tea & Zen",
  "Showa Retro Japan",
  "Japanese Original Landscape",
  "Japandi Animals",
];

const STYLE_PRESETS = [
  "Japandi Landscape",
  "Tea Culture",
  "Zen Landscape",
  "Showa Retro",
  "Countryside",
  "Animal Japandi",
];

const COLOR_PALETTES = [
  "sage green, moss green, warm cream, charcoal",
  "warm beige, muted green, dark wood, charcoal",
  "cream, pine green, grey stone, dusty red",
  "cream, indigo, terracotta, warm grey",
  "coffee brown, cream, faded red, charcoal",
  "mist grey, moss green, warm beige, dark brown",
  "muted gold, olive green, cream, charcoal",
  "bamboo green, pale cream, soft grey, charcoal",
  "deep green, ivory, orange red, charcoal",
  "ivory, charcoal, soft red, mist grey",
];

const FIELD = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <label className="block text-xs tracking-widest uppercase opacity-60">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
  </div>
);

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

export default function NewPosterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    collection: COLLECTIONS[0],
    themeJa: "",
    themeEn: "",
    verticalTextJa: "",
    subtitleEn: "",
    motif: "",
    colorPalette: COLOR_PALETTES[0],
    stylePreset: STYLE_PRESETS[0],
  });

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/posters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to create theme");
      const data = await res.json();
      router.push(`/posters/${data.id}`);
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
          Register Poster Theme
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className="p-6 space-y-5 border"
          style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
        >
          <p className="text-xs tracking-[0.3em] uppercase opacity-40">Basic Information</p>

          <FIELD label="Collection" required>
            <select
              value={form.collection}
              onChange={(e) => set("collection", e.target.value)}
              style={inputStyle}
            >
              {COLLECTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FIELD>

          <div className="grid grid-cols-2 gap-4">
            <FIELD label="Theme (Japanese)" required>
              <input
                type="text"
                value={form.themeJa}
                onChange={(e) => set("themeJa", e.target.value)}
                placeholder="例：和束の茶畑"
                required
                style={inputStyle}
              />
            </FIELD>
            <FIELD label="Theme (English)" required>
              <input
                type="text"
                value={form.themeEn}
                onChange={(e) => set("themeEn", e.target.value)}
                placeholder="e.g. Wazuka Tea Fields"
                required
                style={inputStyle}
              />
            </FIELD>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FIELD label="Vertical Text (Japanese)" required>
              <input
                type="text"
                value={form.verticalTextJa}
                onChange={(e) => set("verticalTextJa", e.target.value)}
                placeholder="例：和束"
                required
                style={inputStyle}
              />
            </FIELD>
            <FIELD label="Subtitle (English)" required>
              <input
                type="text"
                value={form.subtitleEn}
                onChange={(e) => set("subtitleEn", e.target.value)}
                placeholder="e.g. WAZUKA / Kyoto Tea Fields"
                required
                style={inputStyle}
              />
            </FIELD>
          </div>
        </div>

        <div
          className="p-6 space-y-5 border"
          style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
        >
          <p className="text-xs tracking-[0.3em] uppercase opacity-40">Poster Design</p>

          <FIELD label="Motif / Scene Description" required>
            <textarea
              value={form.motif}
              onChange={(e) => set("motif", e.target.value)}
              placeholder="Describe the visual scene for the poster..."
              required
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </FIELD>

          <FIELD label="Color Palette" required>
            <select
              value={form.colorPalette}
              onChange={(e) => set("colorPalette", e.target.value)}
              style={inputStyle}
            >
              {COLOR_PALETTES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={form.colorPalette}
              onChange={(e) => set("colorPalette", e.target.value)}
              placeholder="or type custom palette..."
              style={{ ...inputStyle, marginTop: "0.5rem" }}
            />
          </FIELD>

          <FIELD label="Style Preset">
            <select
              value={form.stylePreset}
              onChange={(e) => set("stylePreset", e.target.value)}
              style={inputStyle}
            >
              {STYLE_PRESETS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FIELD>
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
            {loading ? "Saving..." : "Register Theme"}
          </button>
        </div>
      </form>
    </div>
  );
}
