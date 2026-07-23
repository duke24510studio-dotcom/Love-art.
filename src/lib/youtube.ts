// Thin wrapper around the official YouTube Data API v3. Read-only: trending
// charts + public video/channel stats. No scraping, no unofficial endpoints.

const API_BASE = "https://www.googleapis.com/youtube/v3";

export function getYoutubeApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error("YOUTUBE_API_KEY is not set. Add it to your .env file.");
  }
  return key;
}

export type YtVideoRaw = {
  id: string;
  snippet: {
    title: string;
    channelId: string;
    channelTitle: string;
    categoryId?: string;
    publishedAt: string;
    thumbnails?: { medium?: { url: string }; high?: { url: string }; default?: { url: string } };
    tags?: string[];
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
  contentDetails?: {
    duration?: string;
  };
};

export type YtChannelRaw = {
  id: string;
  snippet: {
    title: string;
    country?: string;
    thumbnails?: { medium?: { url: string }; high?: { url: string }; default?: { url: string } };
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
    hiddenSubscriberCount?: boolean;
  };
};

async function youtubeGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}/${path}`);
  url.searchParams.set("key", getYoutubeApiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YouTube API ${path} failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

/** ISO-8601 duration (e.g. "PT4M13S") -> seconds. */
export function parseIsoDuration(duration: string | undefined): number {
  if (!duration) return 0;
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
  if (!match) return 0;
  const [, days, hours, minutes, seconds] = match;
  return (
    Number(days || 0) * 86400 +
    Number(hours || 0) * 3600 +
    Number(minutes || 0) * 60 +
    Number(seconds || 0)
  );
}

/** Views-per-hour since publish — the "early velocity" signal. */
export function computeVph(viewCount: number, publishedAt: Date, now: Date = new Date()): number {
  const hours = Math.max((now.getTime() - publishedAt.getTime()) / 3_600_000, 1);
  return viewCount / hours;
}

/** Fetch the current "trending" chart for a region (falls back gracefully per-region on error). */
export async function fetchTrendingVideos(
  regionCode: string,
  opts: { maxResults?: number; videoCategoryId?: string } = {}
): Promise<YtVideoRaw[]> {
  const data = await youtubeGet<{ items: YtVideoRaw[] }>("videos", {
    part: "snippet,statistics,contentDetails",
    chart: "mostPopular",
    regionCode,
    maxResults: String(opts.maxResults ?? 25),
    ...(opts.videoCategoryId ? { videoCategoryId: opts.videoCategoryId } : {}),
  });
  return data.items ?? [];
}

/** Batch-fetch channel snippet + statistics (YouTube caps `id` at 50 per call). */
export async function fetchChannelsByIds(channelIds: string[]): Promise<YtChannelRaw[]> {
  const unique = Array.from(new Set(channelIds)).filter(Boolean);
  if (unique.length === 0) return [];

  const batches: string[][] = [];
  for (let i = 0; i < unique.length; i += 50) batches.push(unique.slice(i, i + 50));

  const results: YtChannelRaw[] = [];
  for (const batch of batches) {
    const data = await youtubeGet<{ items: YtChannelRaw[] }>("channels", {
      part: "snippet,statistics",
      id: batch.join(","),
      maxResults: "50",
    });
    results.push(...(data.items ?? []));
  }
  return results;
}
