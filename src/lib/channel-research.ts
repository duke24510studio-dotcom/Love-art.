import { prisma } from "@/lib/prisma";
import {
  computeVph,
  fetchChannelsByIds,
  fetchTrendingVideos,
  parseIsoDuration,
} from "@/lib/youtube";

// Regions polled for "overseas trend" research, matching the region chips in
// the reference tool (全地域 / GB / IN / JP / KR / TW / US / ...).
export const DEFAULT_REGIONS = ["US", "GB", "IN", "JP", "KR", "TW"];

export function getResearchRegions(): string[] {
  const raw = process.env.YOUTUBE_REGIONS;
  if (!raw) return DEFAULT_REGIONS;
  const regions = raw
    .split(",")
    .map((r) => r.trim().toUpperCase())
    .filter(Boolean);
  return regions.length > 0 ? regions : DEFAULT_REGIONS;
}

export type CollectResult = {
  regionsPolled: number;
  videosAdded: number;
  channelsAdded: number;
  errors: string[];
};

/** Poll the trending chart for each region, snapshotting videos + their channels' stats. */
export async function collectTrendingVideos(regions?: string[]): Promise<CollectResult> {
  const targetRegions = regions && regions.length > 0 ? regions : getResearchRegions();
  const result: CollectResult = { regionsPolled: 0, videosAdded: 0, channelsAdded: 0, errors: [] };
  const now = new Date();

  for (const regionCode of targetRegions) {
    try {
      const videos = await fetchTrendingVideos(regionCode, { maxResults: 25 });
      result.regionsPolled += 1;
      if (videos.length === 0) continue;

      const channelIds = videos.map((v) => v.snippet.channelId);
      const channels = await fetchChannelsByIds(channelIds);

      for (const video of videos) {
        const publishedAt = video.snippet.publishedAt ? new Date(video.snippet.publishedAt) : null;
        const viewCount = Number(video.statistics?.viewCount ?? 0);
        await prisma.ytVideoSnapshot.create({
          data: {
            videoId: video.id,
            regionCode,
            title: video.snippet.title,
            channelId: video.snippet.channelId,
            channelTitle: video.snippet.channelTitle,
            categoryId: video.snippet.categoryId ?? "",
            publishedAt,
            viewCount,
            likeCount: Number(video.statistics?.likeCount ?? 0),
            commentCount: Number(video.statistics?.commentCount ?? 0),
            durationSec: parseIsoDuration(video.contentDetails?.duration),
            thumbnailUrl:
              video.snippet.thumbnails?.high?.url ??
              video.snippet.thumbnails?.medium?.url ??
              video.snippet.thumbnails?.default?.url ??
              "",
            tags: (video.snippet.tags ?? []).slice(0, 20).join(","),
            vph: publishedAt ? computeVph(viewCount, publishedAt, now) : 0,
            fetchedAt: now,
          },
        });
        result.videosAdded += 1;
      }

      for (const channel of channels) {
        await prisma.ytChannelSnapshot.create({
          data: {
            channelId: channel.id,
            title: channel.snippet.title,
            country: channel.snippet.country ?? "",
            subscriberCount: channel.statistics?.hiddenSubscriberCount
              ? 0
              : Number(channel.statistics?.subscriberCount ?? 0),
            viewCount: Number(channel.statistics?.viewCount ?? 0),
            videoCount: Number(channel.statistics?.videoCount ?? 0),
            thumbnailUrl:
              channel.snippet.thumbnails?.high?.url ??
              channel.snippet.thumbnails?.medium?.url ??
              channel.snippet.thumbnails?.default?.url ??
              "",
            fetchedAt: now,
          },
        });
        result.channelsAdded += 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`${regionCode}: ${message}`);
    }
  }

  return result;
}

export type ChannelGrowth = {
  channelId: string;
  title: string;
  country: string;
  thumbnailUrl: string;
  subscriberStart: number;
  subscriberNow: number;
  subscriberGrowth: number;
  subscriberGrowthPerDay: number;
  viewGrowth: number;
  windowHours: number;
};

/** Compare each channel's earliest vs. latest snapshot within the lookback window. */
export async function getRapidlyGrowingChannels(
  lookbackDays = 7,
  limit = 25
): Promise<ChannelGrowth[]> {
  const since = new Date(Date.now() - lookbackDays * 86_400_000);
  const snapshots = await prisma.ytChannelSnapshot.findMany({
    where: { fetchedAt: { gte: since } },
    orderBy: { fetchedAt: "asc" },
  });

  const byChannel = new Map<string, typeof snapshots>();
  for (const snap of snapshots) {
    const list = byChannel.get(snap.channelId) ?? [];
    list.push(snap);
    byChannel.set(snap.channelId, list);
  }

  const growth: ChannelGrowth[] = [];
  for (const [channelId, list] of byChannel) {
    if (list.length < 2) continue;
    const first = list[0];
    const last = list[list.length - 1];
    const windowHours = Math.max((last.fetchedAt.getTime() - first.fetchedAt.getTime()) / 3_600_000, 1);
    const subscriberGrowth = last.subscriberCount - first.subscriberCount;
    growth.push({
      channelId,
      title: last.title,
      country: last.country,
      thumbnailUrl: last.thumbnailUrl,
      subscriberStart: first.subscriberCount,
      subscriberNow: last.subscriberCount,
      subscriberGrowth,
      subscriberGrowthPerDay: subscriberGrowth / (windowHours / 24),
      viewGrowth: last.viewCount - first.viewCount,
      windowHours,
    });
  }

  return growth.sort((a, b) => b.subscriberGrowthPerDay - a.subscriberGrowthPerDay).slice(0, limit);
}
