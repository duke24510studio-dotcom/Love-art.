"use client";

import { useCallback, useEffect, useState } from "react";
import { getCategoryLabel } from "@/lib/youtube-categories";

type Tab = "trending" | "velocity" | "overseas" | "growth" | "ideas";

const TABS: { id: Tab; label: string }[] = [
  { id: "trending", label: "急上昇動画" },
  { id: "velocity", label: "初速ランキング" },
  { id: "overseas", label: "海外トレンド" },
  { id: "growth", label: "急成長チャンネル" },
  { id: "ideas", label: "AI企画提案" },
];

const REGIONS = ["ALL", "US", "GB", "IN", "JP", "KR", "TW"];
const TYPES: { id: string; label: string }[] = [
  { id: "", label: "通常" },
  { id: "shorts", label: "ショート" },
  { id: "live", label: "ライブ" },
];

type VideoRow = {
  id: string;
  videoId: string;
  channelId: string;
  title: string;
  channelTitle: string;
  regionCode: string;
  categoryId: string;
  videoType: "live" | "shorts" | "normal";
  viewCount: number;
  vph: number;
  vphMeasured: boolean;
  snapshotCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  thumbnailUrl: string;
};

type ChannelGrowthRow = {
  channelId: string;
  title: string;
  country: string;
  thumbnailUrl: string;
  subscriberNow: number;
  subscriberGrowth: number;
  subscriberGrowthPerDay: number;
  viewGrowth: number;
};

type IdeaRow = {
  id: string;
  channelName: string;
  concept: string;
  targetAudience: string;
  contentPillars: string;
  sampleTitles: string;
  postingCadence: string;
  notes: string;
  status: string;
  sourceRegion: string;
  createdAt: string;
  sourceVideo: { title: string; channelTitle: string; regionCode: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  idea: "Idea",
  review: "Review",
  approved: "Approved",
  rejected: "Rejected",
};
const STATUS_COLORS: Record<string, string> = {
  idea: "#8a8a8a",
  review: "#c9a84c",
  approved: "#2d5a3d",
  rejected: "#8b3a3a",
};

const numberFmt = new Intl.NumberFormat("en-US");

function fmt(n: number): string {
  return numberFmt.format(Math.round(n));
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = diffMs / 3_600_000;
  if (hours < 1) return `${Math.max(Math.round(diffMs / 60_000), 1)}分前`;
  if (hours < 24) return `${Math.round(hours)}時間前`;
  return `${Math.round(hours / 24)}日前`;
}

export default function YoutubeResearchClient() {
  const [tab, setTab] = useState<Tab>("trending");
  const [region, setRegion] = useState("ALL");
  const [type, setType] = useState("");
  const [minViews, setMinViews] = useState("");
  const [q, setQ] = useState("");
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [growth, setGrowth] = useState<ChannelGrowthRow[]>([]);
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCollected, setLastCollected] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sort = tab === "velocity" || tab === "overseas" ? "vph" : "views";
      const params = new URLSearchParams({ sort });
      if (tab === "overseas" && region !== "ALL") params.set("region", region);
      if (q.trim()) params.set("q", q.trim());
      if (type) params.set("type", type);
      if (minViews.trim()) params.set("minViews", minViews.trim());
      const res = await fetch(`/api/youtube/videos?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load videos (${res.status})`);
      setVideos(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [tab, region, q, type, minViews]);

  const loadGrowth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube/channels?days=7&limit=25");
      if (!res.ok) throw new Error(`Failed to load channel growth (${res.status})`);
      setGrowth(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load channel growth");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadIdeas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube/ideas");
      if (!res.ok) throw new Error(`Failed to load ideas (${res.status})`);
      setIdeas(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ideas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask (rather than called directly in the effect
    // body) to avoid the set-state-in-effect lint rule.
    queueMicrotask(() => {
      if (tab === "growth") void loadGrowth();
      else if (tab === "ideas") void loadIdeas();
      else void loadVideos();
    });
  }, [tab, loadVideos, loadGrowth, loadIdeas]);

  const collectNow = async () => {
    setBusy("collect");
    setError(null);
    try {
      const res = await fetch("/api/youtube/collect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Collection failed (${res.status})`);
      setLastCollected(
        `Polled ${data.regionsPolled} region(s), +${data.videosAdded} videos, +${data.channelsAdded} channel snapshots` +
          (data.errors?.length ? ` (${data.errors.length} error(s))` : "")
      );
      if (tab === "growth") await loadGrowth();
      else await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Collection failed");
    } finally {
      setBusy(null);
    }
  };

  const resetFilters = () => {
    setRegion("ALL");
    setType("");
    setMinViews("");
    setQ("");
  };

  const generateIdea = async () => {
    setBusy("idea");
    setError(null);
    try {
      const res = await fetch("/api/youtube/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(region !== "ALL" ? { regionCode: region } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Idea generation failed (${res.status})`);
      await loadIdeas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Idea generation failed");
    } finally {
      setBusy(null);
    }
  };

  const setIdeaStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/youtube/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      await loadIdeas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  const isVideoTab = tab === "trending" || tab === "velocity" || tab === "overseas";
  const csvTab = tab === "growth" ? "channels" : tab === "ideas" ? "ideas" : "videos";

  return (
    <div className="space-y-6">
      <div className="pt-4 pb-2" style={{ borderBottom: "1px solid #d8d0c0" }}>
        <p className="text-xs tracking-[0.4em] uppercase opacity-50 mb-1">Market Research</p>
        <h1 className="text-3xl font-light tracking-widest" style={{ color: "#2d5a3d" }}>
          YouTube バズリサーチ
        </h1>
        <p className="text-sm opacity-60 mt-1 tracking-wide">
          Overseas trending-video &amp; channel-growth research, plus AI-assisted original channel
          concept proposals — inspiration only, human-reviewed, no auto-posting.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 text-xs tracking-widest uppercase border transition-opacity hover:opacity-80"
            style={{
              borderColor: "#d8d0c0",
              backgroundColor: tab === t.id ? "#2d5a3d" : "transparent",
              color: tab === t.id ? "#f5f0e8" : "#2c2c2c",
            }}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={collectNow}
          disabled={busy !== null}
          className="px-4 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
        >
          {busy === "collect" ? "Collecting..." : "⟳ Collect Now"}
        </button>
        <a
          href={`/api/export/youtube-csv?tab=${csvTab}`}
          className="px-4 py-2 text-xs tracking-widest uppercase hover:opacity-70 transition-opacity"
          style={{ color: "#2d5a3d", border: "1px solid #2d5a3d" }}
        >
          ⇩ Export CSV
        </a>
      </div>

      {isVideoTab && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadVideos()}
              placeholder="タイトル・チャンネル検索..."
              className="border px-3 py-2 text-sm bg-white/60 focus:outline-none"
              style={{ borderColor: "#d8d0c0", minWidth: "220px" }}
            />

            {tab === "overseas" && (
              <div className="flex flex-wrap gap-2 items-center">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRegion(r)}
                    className="px-3 py-1.5 text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
                    style={
                      region === r
                        ? { backgroundColor: "#2d5a3d", color: "#f5f0e8" }
                        : { backgroundColor: "#f5f0e8", color: "#2c2c2c", border: "1px solid #d8d0c0" }
                    }
                  >
                    {r === "ALL" ? "全地域" : r}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1">
              <span className="text-xs tracking-widest uppercase opacity-40">タイプ</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="border px-2 py-1.5 text-xs bg-white/60 focus:outline-none"
                style={{ borderColor: "#d8d0c0" }}
              >
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs tracking-widest uppercase opacity-40">再生数≥</span>
              <input
                value={minViews}
                onChange={(e) => setMinViews(e.target.value.replace(/[^0-9]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && loadVideos()}
                placeholder="0"
                className="border px-2 py-1.5 text-xs bg-white/60 focus:outline-none w-24"
                style={{ borderColor: "#d8d0c0" }}
              />
            </div>

            <button
              onClick={loadVideos}
              className="px-3 py-2 text-xs tracking-widest uppercase hover:opacity-70"
              style={{ color: "#2d5a3d", border: "1px solid #2d5a3d" }}
            >
              検索
            </button>
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-xs tracking-widest uppercase hover:opacity-70 opacity-60"
            >
              リセット
            </button>
          </div>

          <p className="text-xs opacity-40">
            公開7日以内の動画のみ。snapshotを2回以上実行するとVPHが実測(⚡)になります。
          </p>
        </div>
      )}

      {lastCollected && (
        <div className="text-xs p-3 border" style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}>
          {lastCollected}
        </div>
      )}
      {error && (
        <div className="text-xs p-3 border" style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}>
          {error}
        </div>
      )}

      {loading && <div className="text-sm opacity-50 py-8 text-center">Loading...</div>}

      {!loading && isVideoTab && (
        <VideoTable rows={videos} highlight={tab === "velocity" || tab === "overseas" ? "vph" : "views"} />
      )}

      {!loading && tab === "growth" && <GrowthTable rows={growth} />}

      {!loading && tab === "ideas" && (
        <IdeasPanel ideas={ideas} busy={busy} onGenerate={generateIdea} onSetStatus={setIdeaStatus} />
      )}
    </div>
  );
}

function VideoTable({ rows, highlight }: { rows: VideoRow[]; highlight: "views" | "vph" }) {
  if (rows.length === 0) {
    return (
      <div
        className="border p-12 text-center text-sm opacity-60"
        style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
      >
        No data yet. Click <span className="opacity-90">Collect Now</span> (requires YOUTUBE_API_KEY)
        to poll the current trending charts.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto border" style={{ borderColor: "#d8d0c0" }}>
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-left text-xs tracking-widest uppercase opacity-50"
            style={{ backgroundColor: "#ede8dc" }}
          >
            <th className="p-3">サムネ</th>
            <th className="p-3">タイトル / チャンネル</th>
            <th className="p-3">地域</th>
            <th className="p-3 text-right">再生数</th>
            <th className="p-3 text-right">VPH</th>
            <th className="p-3 text-right">高評価</th>
            <th className="p-3">公開</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.id} className="border-t align-top" style={{ borderColor: "#d8d0c0" }}>
              <td className="p-3">
                <a href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer">
                  {v.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnailUrl} alt="" className="w-28 aspect-video object-cover" />
                  ) : (
                    <div className="w-28 aspect-video" style={{ backgroundColor: "#d8d0c0" }} />
                  )}
                </a>
              </td>
              <td className="p-3 max-w-md">
                <a
                  href={`https://www.youtube.com/watch?v=${v.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {v.title}
                </a>
                <div className="text-xs opacity-50 mt-0.5">{v.channelTitle}</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {v.snapshotCount > 1 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 tracking-wide"
                      style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
                    >
                      追跡中
                    </span>
                  )}
                  {v.videoType !== "normal" && (
                    <span className="text-[10px] px-1.5 py-0.5 tracking-wide border" style={{ borderColor: "#d8d0c0" }}>
                      {v.videoType === "shorts" ? "ショート" : "ライブ"}
                    </span>
                  )}
                  <span className="text-[10px] opacity-50">{getCategoryLabel(v.categoryId)}</span>
                </div>
              </td>
              <td className="p-3 text-xs opacity-70">{v.regionCode}</td>
              <td
                className="p-3 text-right"
                style={highlight === "views" ? { color: "#2d5a3d", fontWeight: 600 } : undefined}
              >
                {fmt(v.viewCount)}
              </td>
              <td
                className="p-3 text-right"
                style={highlight === "vph" ? { color: "#2d5a3d", fontWeight: 600 } : undefined}
              >
                {fmt(v.vph)}
                <span className="ml-1" title={v.vphMeasured ? "実測" : "推定"}>
                  {v.vphMeasured ? "⚡" : ""}
                </span>
              </td>
              <td className="p-3 text-right opacity-70">{fmt(v.likeCount)}</td>
              <td className="p-3 text-xs opacity-50">{relativeTime(v.publishedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GrowthTable({ rows }: { rows: ChannelGrowthRow[] }) {
  if (rows.length === 0) {
    return (
      <div
        className="border p-12 text-center text-sm opacity-60"
        style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
      >
        Not enough history yet. Growth needs at least two Collect Now runs (spread over time) per
        channel to compute a trend.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto border" style={{ borderColor: "#d8d0c0" }}>
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-left text-xs tracking-widest uppercase opacity-50"
            style={{ backgroundColor: "#ede8dc" }}
          >
            <th className="p-3">Channel</th>
            <th className="p-3">Country</th>
            <th className="p-3 text-right">Subscribers</th>
            <th className="p-3 text-right">Growth</th>
            <th className="p-3 text-right">Growth / day</th>
            <th className="p-3 text-right">View Growth</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.channelId} className="border-t" style={{ borderColor: "#d8d0c0" }}>
              <td className="p-3">
                <a
                  href={`https://www.youtube.com/channel/${c.channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {c.title}
                </a>
              </td>
              <td className="p-3 text-xs opacity-70">{c.country || "—"}</td>
              <td className="p-3 text-right">{fmt(c.subscriberNow)}</td>
              <td className="p-3 text-right" style={{ color: "#2d5a3d", fontWeight: 600 }}>
                +{fmt(c.subscriberGrowth)}
              </td>
              <td className="p-3 text-right">+{fmt(c.subscriberGrowthPerDay)}</td>
              <td className="p-3 text-right opacity-70">+{fmt(c.viewGrowth)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IdeasPanel({
  ideas,
  busy,
  onGenerate,
  onSetStatus,
}: {
  ideas: IdeaRow[];
  busy: string | null;
  onGenerate: () => void;
  onSetStatus: (id: string, status: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs opacity-50 max-w-2xl">
          Each proposal is an ORIGINAL channel concept inspired only by the format/niche of a
          trending video — never a copy. Review and approve before building anything.
        </p>
        <button
          onClick={onGenerate}
          disabled={busy !== null}
          className="px-4 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40 shrink-0 ml-4"
          style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
        >
          {busy === "idea" ? "Generating..." : "+ Generate Idea"}
        </button>
      </div>

      {ideas.length === 0 ? (
        <div
          className="border p-12 text-center text-sm opacity-60"
          style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
        >
          No proposals yet. Click <span className="opacity-90">Generate Idea</span> (requires
          OPENAI_API_KEY and at least one Collect Now run).
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => (
            <div key={idea.id} className="border p-5" style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">{idea.channelName}</div>
                  <div className="text-xs opacity-60 mt-1">{idea.concept}</div>
                </div>
                <span
                  className="text-xs px-3 py-1 tracking-widest uppercase shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[idea.status] ?? "#8a8a8a", color: "#f5f0e8" }}
                >
                  {STATUS_LABELS[idea.status] ?? idea.status}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-4 text-xs">
                <div>
                  <div className="tracking-[0.3em] uppercase opacity-50 mb-1">Audience</div>
                  <div className="opacity-80">{idea.targetAudience}</div>
                </div>
                <div>
                  <div className="tracking-[0.3em] uppercase opacity-50 mb-1">Cadence</div>
                  <div className="opacity-80">{idea.postingCadence}</div>
                </div>
                <div>
                  <div className="tracking-[0.3em] uppercase opacity-50 mb-1">Content Pillars</div>
                  <div className="opacity-80">{idea.contentPillars}</div>
                </div>
                <div>
                  <div className="tracking-[0.3em] uppercase opacity-50 mb-1">Sample Titles</div>
                  <div className="opacity-80">{idea.sampleTitles}</div>
                </div>
              </div>

              {idea.sourceVideo && (
                <div className="text-xs opacity-40 mt-3">
                  Inspiration signal: {idea.sourceVideo.regionCode} trending format (not reproduced)
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-4">
                {idea.status !== "approved" && (
                  <button
                    onClick={() => onSetStatus(idea.id, "approved")}
                    disabled={busy !== null}
                    className="px-4 py-1.5 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
                  >
                    {busy === idea.id ? "Saving..." : "Approve"}
                  </button>
                )}
                {idea.status !== "rejected" && (
                  <button
                    onClick={() => onSetStatus(idea.id, "rejected")}
                    disabled={busy !== null}
                    className="px-4 py-1.5 text-xs tracking-widest uppercase border hover:opacity-80 transition-opacity disabled:opacity-40"
                    style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
