import { prisma } from "@/lib/prisma";

// YouTube Data API v3 trend research.
// search.list costs 100 quota units per call, videos.list costs 1 — the free
// daily quota is 10,000 units, so one search ≈ 101 units.

const API_BASE = "https://www.googleapis.com/youtube/v3";
// YouTube Shorts are up to 3 minutes long.
const SHORTS_MAX_SEC = 180;
// Skip snapshot creation when the latest one is younger than this.
const SNAPSHOT_MIN_INTERVAL_MS = 30 * 60 * 1000;
// Growth is measured against the newest snapshot at least this old...
const GROWTH_TARGET_AGE_MS = 20 * 60 * 60 * 1000;
// ...falling back to the oldest snapshot if it is at least this old.
const GROWTH_MIN_AGE_MS = 60 * 60 * 1000;

export type YoutubeOrder = "views" | "likeRate" | "viewsPerDay" | "growth";

export type YoutubeSearchParams = {
  query: string;
  /** Only videos published within the last N days (default 30). */
  publishedWithinDays?: number;
  /** Drop Shorts (<= 3 min) from results (default true). */
  excludeShorts?: boolean;
  /** Optional ISO 3166-1 alpha-2 region code, e.g. "US", "JP". */
  regionCode?: string;
  /** How many videos to return (default 10, max 50). */
  top?: number;
  order?: YoutubeOrder;
};

export type YoutubeVideoResult = {
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
  /** likes / views, percent. null when likes are hidden or views are 0. */
  likeRatePct: number | null;
  /** Average views per day since publish. */
  viewsPerDay: number;
  /** Views gained over the last ~24h (normalized). null until 2+ snapshots exist. */
  growthPerDay: number | null;
  tracked: boolean;
  query: string;
  lastCheckedAt: string | null;
};

type SearchListResponse = {
  items?: { id?: { videoId?: string } }[];
  error?: { message?: string };
};

type VideosListResponse = {
  items?: {
    id: string;
    snippet?: {
      title?: string;
      channelId?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    contentDetails?: { duration?: string };
    statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  }[];
  error?: { message?: string };
};

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error(
      "YOUTUBE_API_KEY is not set. Create one in Google Cloud (enable 'YouTube Data API v3', then create an API key) and add it to .env."
    );
  }
  return key;
}

async function youtubeGet<T extends { error?: { message?: string } }>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(`${API_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", getApiKey());

  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) {
    throw new Error(data.error?.message ?? `YouTube API error (${res.status})`);
  }
  return data;
}

/** Parse ISO 8601 durations like PT1H2M3S into seconds. */
export function parseIsoDuration(duration: string): number {
  const m = duration.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  const [, d, h, min, s] = m;
  return (
    (Number(d) || 0) * 86400 + (Number(h) || 0) * 3600 + (Number(min) || 0) * 60 + (Number(s) || 0)
  );
}

function pickThumbnail(thumbnails?: Record<string, { url?: string }>): string {
  return (
    thumbnails?.medium?.url ?? thumbnails?.high?.url ?? thumbnails?.default?.url ?? ""
  );
}

type Snapshot = { viewCount: bigint; capturedAt: Date };

/** Views gained per 24h, diffing current views against a ~1-day-old snapshot. */
function computeGrowthPerDay(
  snapshots: Snapshot[], // sorted newest first
  currentViews: number,
  now: Date
): number | null {
  const aged = snapshots.find((s) => now.getTime() - s.capturedAt.getTime() >= GROWTH_TARGET_AGE_MS);
  const oldest = snapshots[snapshots.length - 1];
  const base =
    aged ??
    (oldest && now.getTime() - oldest.capturedAt.getTime() >= GROWTH_MIN_AGE_MS ? oldest : null);
  if (!base) return null;

  const hours = (now.getTime() - base.capturedAt.getTime()) / 3600000;
  const delta = currentViews - Number(base.viewCount);
  return Math.max(0, Math.round((delta / hours) * 24));
}

function daysSince(date: Date, now: Date): number {
  return Math.max((now.getTime() - date.getTime()) / 86400000, 0.25);
}

type DbVideo = {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: Date;
  durationSec: number;
  query: string;
  viewCount: bigint;
  likeCount: bigint;
  commentCount: bigint;
  tracked: boolean;
  lastCheckedAt: Date | null;
  snapshots: Snapshot[];
};

function serializeVideo(video: DbVideo, now: Date): YoutubeVideoResult {
  const viewCount = Number(video.viewCount);
  const likeCount = Number(video.likeCount);
  return {
    id: video.id,
    videoId: video.videoId,
    url: `https://www.youtube.com/watch?v=${video.videoId}`,
    title: video.title,
    channelTitle: video.channelTitle,
    thumbnailUrl: video.thumbnailUrl,
    publishedAt: video.publishedAt.toISOString(),
    durationSec: video.durationSec,
    viewCount,
    likeCount,
    commentCount: Number(video.commentCount),
    likeRatePct: viewCount > 0 && likeCount > 0 ? (likeCount / viewCount) * 100 : null,
    viewsPerDay: Math.round(viewCount / daysSince(video.publishedAt, now)),
    growthPerDay: computeGrowthPerDay(video.snapshots, viewCount, now),
    tracked: video.tracked,
    query: video.query,
    lastCheckedAt: video.lastCheckedAt?.toISOString() ?? null,
  };
}

function sortResults(results: YoutubeVideoResult[], order: YoutubeOrder): YoutubeVideoResult[] {
  const key: Record<YoutubeOrder, (r: YoutubeVideoResult) => number> = {
    views: (r) => r.viewCount,
    likeRate: (r) => r.likeRatePct ?? -1,
    viewsPerDay: (r) => r.viewsPerDay,
    growth: (r) => r.growthPerDay ?? -1,
  };
  return [...results].sort((a, b) => key[order](b) - key[order](a));
}

type FetchedVideo = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: Date;
  durationSec: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

/** videos.list for up to 50 ids per call. */
async function fetchVideoDetails(videoIds: string[]): Promise<FetchedVideo[]> {
  const results: FetchedVideo[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const data = await youtubeGet<VideosListResponse>("videos", {
      part: "snippet,contentDetails,statistics",
      id: chunk.join(","),
      maxResults: "50",
    });
    for (const item of data.items ?? []) {
      if (!item.snippet) continue;
      results.push({
        videoId: item.id,
        title: item.snippet.title ?? "",
        channelId: item.snippet.channelId ?? "",
        channelTitle: item.snippet.channelTitle ?? "",
        thumbnailUrl: pickThumbnail(item.snippet.thumbnails),
        publishedAt: new Date(item.snippet.publishedAt ?? Date.now()),
        durationSec: parseIsoDuration(item.contentDetails?.duration ?? ""),
        viewCount: Number(item.statistics?.viewCount ?? 0),
        likeCount: Number(item.statistics?.likeCount ?? 0),
        commentCount: Number(item.statistics?.commentCount ?? 0),
      });
    }
  }
  return results;
}

/** Upsert fetched videos and add a stat snapshot (throttled per video). */
async function saveVideos(videos: FetchedVideo[], query: string, now: Date): Promise<string[]> {
  const ids: string[] = [];
  for (const v of videos) {
    const stats = {
      viewCount: BigInt(v.viewCount),
      likeCount: BigInt(v.likeCount),
      commentCount: BigInt(v.commentCount),
    };
    const saved = await prisma.youtubeVideo.upsert({
      where: { videoId: v.videoId },
      create: {
        videoId: v.videoId,
        title: v.title,
        channelId: v.channelId,
        channelTitle: v.channelTitle,
        thumbnailUrl: v.thumbnailUrl,
        publishedAt: v.publishedAt,
        durationSec: v.durationSec,
        ...(query ? { query } : {}),
        ...stats,
        lastCheckedAt: now,
      },
      update: {
        title: v.title,
        channelTitle: v.channelTitle,
        thumbnailUrl: v.thumbnailUrl,
        durationSec: v.durationSec,
        ...(query ? { query } : {}),
        ...stats,
        lastCheckedAt: now,
      },
      select: { id: true },
    });
    ids.push(saved.id);

    const latest = await prisma.youtubeStatSnapshot.findFirst({
      where: { youtubeVideoId: saved.id },
      orderBy: { capturedAt: "desc" },
      select: { capturedAt: true },
    });
    if (!latest || now.getTime() - latest.capturedAt.getTime() >= SNAPSHOT_MIN_INTERVAL_MS) {
      await prisma.youtubeStatSnapshot.create({
        data: { youtubeVideoId: saved.id, ...stats, capturedAt: now },
      });
    }
  }
  return ids;
}

async function loadVideos(where: object, now: Date): Promise<YoutubeVideoResult[]> {
  const videos = await prisma.youtubeVideo.findMany({
    where,
    include: {
      snapshots: {
        orderBy: { capturedAt: "desc" },
        select: { viewCount: true, capturedAt: true },
      },
    },
  });
  return videos.map((v) => serializeVideo(v, now));
}

/**
 * Search YouTube for trending videos on a topic, store them (with a stat
 * snapshot), and return the top N ranked by the requested metric.
 */
export async function searchYoutubeTrends(params: YoutubeSearchParams): Promise<{
  results: YoutubeVideoResult[];
  scanned: number;
  filteredShorts: number;
}> {
  const query = params.query.trim();
  if (!query) throw new Error("query is required");

  const withinDays = Math.min(Math.max(params.publishedWithinDays ?? 30, 1), 365);
  const excludeShorts = params.excludeShorts ?? true;
  const top = Math.min(Math.max(params.top ?? 10, 1), 50);
  const order = params.order ?? "views";
  const now = new Date();

  const publishedAfter = new Date(now.getTime() - withinDays * 86400000).toISOString();
  const search = await youtubeGet<SearchListResponse>("search", {
    part: "snippet",
    type: "video",
    q: query,
    order: "viewCount",
    maxResults: "50",
    publishedAfter,
    ...(params.regionCode ? { regionCode: params.regionCode } : {}),
  });

  const videoIds = (search.items ?? [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => Boolean(id));

  const fetched = await fetchVideoDetails(videoIds);
  const kept = excludeShorts ? fetched.filter((v) => v.durationSec > SHORTS_MAX_SEC) : fetched;

  const dbIds = await saveVideos(kept, query, now);
  const results = sortResults(await loadVideos({ id: { in: dbIds } }, now), order).slice(0, top);

  return {
    results,
    scanned: fetched.length,
    filteredShorts: fetched.length - kept.length,
  };
}

/** List saved videos (optionally tracked-only) with growth metrics. */
export async function listSavedVideos(options: {
  trackedOnly?: boolean;
  order?: YoutubeOrder;
}): Promise<YoutubeVideoResult[]> {
  const now = new Date();
  const results = await loadVideos(options.trackedOnly ? { tracked: true } : {}, now);
  return sortResults(results, options.order ?? "growth");
}

/**
 * Re-fetch current stats for all tracked videos and snapshot them.
 * Meant to run on a cron so day-over-day growth can be computed.
 */
export async function refreshTrackedVideos(): Promise<{
  refreshed: number;
  errors: string[];
}> {
  const tracked = await prisma.youtubeVideo.findMany({
    where: { tracked: true },
    select: { videoId: true },
  });
  if (tracked.length === 0) return { refreshed: 0, errors: [] };

  const now = new Date();
  const errors: string[] = [];
  let refreshed = 0;
  try {
    const fetched = await fetchVideoDetails(tracked.map((t) => t.videoId));
    await saveVideos(fetched, "", now);
    refreshed = fetched.length;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }
  return { refreshed, errors };
}
