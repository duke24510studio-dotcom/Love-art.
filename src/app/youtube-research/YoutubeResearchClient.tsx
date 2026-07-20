"use client";

import { useCallback, useEffect, useState } from "react";

type Video = {
  id: string;
  videoId: string;
  url: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationSec: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  likeRatePct: number | null;
  viewsPerDay: number;
  growthPerDay: number | null;
  tracked: boolean;
  query: string;
  lastCheckedAt: string | null;
};

type SearchResponse = { results: Video[]; scanned: number; filteredShorts: number };

const COLORS = {
  border: "#d8d0c0",
  panel: "#ede8dc",
  accent: "#2d5a3d",
  cream: "#f5f0e8",
  ink: "#2c2c2c",
};

const ORDER_OPTIONS = [
  { value: "views", label: "Views" },
  { value: "likeRate", label: "Like rate" },
  { value: "viewsPerDay", label: "Views / day" },
  { value: "growth", label: "Growth (24h)" },
];

const nf = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function fmtCount(n: number | null): string {
  return n === null ? "—" : nf.format(n);
}

function fmtDuration(sec: number): string {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function fmtDate(iso: string): string {
  return iso.slice(0, 10);
}

function VideoTable({
  videos,
  showRank,
  onToggleTrack,
  onDelete,
}: {
  videos: Video[];
  showRank: boolean;
  onToggleTrack: (video: Video) => void;
  onDelete?: (video: Video) => void;
}) {
  return (
    <div className="overflow-x-auto border" style={{ borderColor: COLORS.border }}>
      <table className="w-full text-sm" style={{ backgroundColor: COLORS.panel }}>
        <thead>
          <tr
            className="text-xs tracking-widest uppercase text-left"
            style={{ backgroundColor: COLORS.accent, color: COLORS.cream }}
          >
            {showRank && <th className="px-3 py-2 font-light">#</th>}
            <th className="px-3 py-2 font-light">Video</th>
            <th className="px-3 py-2 font-light">Published</th>
            <th className="px-3 py-2 font-light">Length</th>
            <th className="px-3 py-2 font-light text-right">Views</th>
            <th className="px-3 py-2 font-light text-right">Like %</th>
            <th className="px-3 py-2 font-light text-right">Views/day</th>
            <th className="px-3 py-2 font-light text-right">Δ 24h</th>
            <th className="px-3 py-2 font-light text-center">Track</th>
            {onDelete && <th className="px-3 py-2 font-light" />}
          </tr>
        </thead>
        <tbody>
          {videos.map((video, i) => (
            <tr key={video.id} className="border-t align-top" style={{ borderColor: COLORS.border }}>
              {showRank && <td className="px-3 py-3 opacity-50">{i + 1}</td>}
              <td className="px-3 py-3">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 hover:opacity-70 transition-opacity"
                >
                  {video.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnailUrl}
                      alt=""
                      className="w-24 h-14 object-cover shrink-0 border"
                      style={{ borderColor: COLORS.border }}
                    />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block font-medium leading-snug line-clamp-2">{video.title}</span>
                    <span className="block text-xs opacity-60 mt-1">{video.channelTitle}</span>
                  </span>
                </a>
              </td>
              <td className="px-3 py-3 whitespace-nowrap opacity-70">{fmtDate(video.publishedAt)}</td>
              <td className="px-3 py-3 whitespace-nowrap opacity-70">{fmtDuration(video.durationSec)}</td>
              <td className="px-3 py-3 text-right whitespace-nowrap font-medium">
                {fmtCount(video.viewCount)}
              </td>
              <td className="px-3 py-3 text-right whitespace-nowrap">
                {video.likeRatePct === null ? "—" : `${video.likeRatePct.toFixed(2)}%`}
              </td>
              <td className="px-3 py-3 text-right whitespace-nowrap">{fmtCount(video.viewsPerDay)}</td>
              <td
                className="px-3 py-3 text-right whitespace-nowrap font-medium"
                style={{ color: COLORS.accent }}
              >
                {video.growthPerDay === null ? "—" : `+${fmtCount(video.growthPerDay)}`}
              </td>
              <td className="px-3 py-3 text-center">
                <button
                  onClick={() => onToggleTrack(video)}
                  className="px-2 py-1 text-xs tracking-widest uppercase border transition-opacity hover:opacity-70"
                  style={{
                    borderColor: COLORS.border,
                    backgroundColor: video.tracked ? COLORS.accent : "transparent",
                    color: video.tracked ? COLORS.cream : COLORS.ink,
                  }}
                >
                  {video.tracked ? "On" : "Off"}
                </button>
              </td>
              {onDelete && (
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => onDelete(video)}
                    className="text-xs opacity-40 hover:opacity-100 transition-opacity"
                    title="Remove from saved videos"
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function YoutubeResearchClient() {
  const [query, setQuery] = useState("");
  const [days, setDays] = useState(30);
  const [excludeShorts, setExcludeShorts] = useState(true);
  const [regionCode, setRegionCode] = useState("");
  const [top, setTop] = useState(10);
  const [order, setOrder] = useState("views");

  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Video[] | null>(null);
  const [meta, setMeta] = useState<{ scanned: number; filteredShorts: number } | null>(null);

  const [saved, setSaved] = useState<Video[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSaved = useCallback(async () => {
    try {
      const res = await fetch("/api/youtube/videos?order=growth");
      if (res.ok) setSaved(await res.json());
    } catch {
      // saved list is secondary; search errors are surfaced separately
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/youtube/videos?order=growth")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Video[] | null) => {
        if (!cancelled && data) setSaved(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || searching) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch("/api/youtube/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          publishedWithinDays: days,
          excludeShorts,
          regionCode: regionCode || undefined,
          top,
          order,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      const { results, scanned, filteredShorts } = data as SearchResponse;
      setResults(results);
      setMeta({ scanned, filteredShorts });
      loadSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const toggleTrack = async (video: Video) => {
    const tracked = !video.tracked;
    const res = await fetch(`/api/youtube/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracked }),
    });
    if (!res.ok) return;
    const patch = (v: Video) => (v.id === video.id ? { ...v, tracked } : v);
    setResults((r) => (r ? r.map(patch) : r));
    setSaved((s) => s.map(patch));
  };

  const deleteVideo = async (video: Video) => {
    const res = await fetch(`/api/youtube/videos/${video.id}`, { method: "DELETE" });
    if (!res.ok) return;
    setSaved((s) => s.filter((v) => v.id !== video.id));
    setResults((r) => (r ? r.filter((v) => v.id !== video.id) : r));
  };

  const refreshTracked = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/youtube/videos", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Refresh failed");
      if (data.errors?.length) setError(data.errors.join("; "));
      await loadSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const trackedSaved = saved.filter((v) => v.tracked);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl tracking-[0.2em] font-light uppercase">YouTube Research</h1>
        <p className="text-sm opacity-60 mt-2">
          Find what&apos;s trending by keyword via the YouTube Data API, filter out Shorts, and track
          how fast views grow day over day.
        </p>
      </div>

      <form
        onSubmit={runSearch}
        className="border p-5 space-y-4"
        style={{ borderColor: COLORS.border, backgroundColor: COLORS.panel }}
      >
        <div className="flex flex-wrap gap-4 items-end">
          <label className="flex-1 min-w-64">
            <span className="block text-xs tracking-widest uppercase opacity-60 mb-1">Keyword</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "Claude Code", "japandi interior", "zen garden"'
              className="w-full border px-3 py-2 bg-white/60 focus:outline-none"
              style={{ borderColor: COLORS.border }}
            />
          </label>
          <label>
            <span className="block text-xs tracking-widest uppercase opacity-60 mb-1">Uploaded</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border px-3 py-2 bg-white/60"
              style={{ borderColor: COLORS.border }}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </label>
          <label>
            <span className="block text-xs tracking-widest uppercase opacity-60 mb-1">Region</span>
            <input
              value={regionCode}
              onChange={(e) => setRegionCode(e.target.value)}
              placeholder="Any (e.g. US, JP)"
              maxLength={2}
              className="w-28 border px-3 py-2 bg-white/60 uppercase focus:outline-none"
              style={{ borderColor: COLORS.border }}
            />
          </label>
          <label>
            <span className="block text-xs tracking-widest uppercase opacity-60 mb-1">Rank by</span>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="border px-3 py-2 bg-white/60"
              style={{ borderColor: COLORS.border }}
            >
              {ORDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="block text-xs tracking-widest uppercase opacity-60 mb-1">Top</span>
            <select
              value={top}
              onChange={(e) => setTop(Number(e.target.value))}
              className="border px-3 py-2 bg-white/60"
              style={{ borderColor: COLORS.border }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={excludeShorts}
              onChange={(e) => setExcludeShorts(e.target.checked)}
            />
            Exclude Shorts (≤ 3 min)
          </label>
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="px-6 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: COLORS.accent, color: COLORS.cream }}
          >
            {searching ? "Searching…" : "Search"}
          </button>
          {meta && (
            <span className="text-xs opacity-50">
              Scanned {meta.scanned} videos
              {meta.filteredShorts > 0 ? ` · filtered ${meta.filteredShorts} Shorts` : ""}
            </span>
          )}
        </div>
      </form>

      {error && (
        <div
          className="border p-4 text-sm"
          style={{ borderColor: "#8b3a3a", color: "#8b3a3a", backgroundColor: COLORS.panel }}
        >
          {error}
        </div>
      )}

      {results && (
        <section className="space-y-3">
          <h2 className="text-sm tracking-[0.2em] font-light uppercase opacity-70">
            Search Results
          </h2>
          {results.length === 0 ? (
            <div
              className="border p-8 text-center text-sm opacity-60"
              style={{ borderColor: COLORS.border, backgroundColor: COLORS.panel }}
            >
              No videos matched. Try a longer period or include Shorts.
            </div>
          ) : (
            <VideoTable videos={results} showRank onToggleTrack={toggleTrack} />
          )}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm tracking-[0.2em] font-light uppercase opacity-70">
            Tracked Videos ({trackedSaved.length})
          </h2>
          <button
            onClick={refreshTracked}
            disabled={refreshing || trackedSaved.length === 0}
            className="px-4 py-2 text-xs tracking-widest uppercase border transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ borderColor: COLORS.border }}
          >
            {refreshing ? "Refreshing…" : "Refresh Stats"}
          </button>
        </div>
        <p className="text-xs opacity-50">
          Tracked videos get a stats snapshot on every refresh (cron: every 6 hours). Δ 24h shows
          views gained over the last day — the growth speed, not just the total.
        </p>
        {trackedSaved.length === 0 ? (
          <div
            className="border p-8 text-center text-sm opacity-60"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.panel }}
          >
            Nothing tracked yet. Run a search — results are tracked automatically.
          </div>
        ) : (
          <VideoTable
            videos={trackedSaved}
            showRank={false}
            onToggleTrack={toggleTrack}
            onDelete={deleteVideo}
          />
        )}
      </section>
    </div>
  );
}
