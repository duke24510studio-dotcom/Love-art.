import { prisma } from "@/lib/prisma";
import { fetchFeed } from "@/lib/rss";
import type { ArticleDirection } from "@/lib/article";

export type CollectResult = {
  feedsPolled: number;
  itemsAdded: number;
  errors: string[];
};

const MAX_ITEMS_PER_FEED = 10;

/** Poll active feeds and store new trend items (deduped by url). */
export async function collectResearch(direction?: ArticleDirection): Promise<CollectResult> {
  const feeds = await prisma.feedSource.findMany({
    where: { active: true, ...(direction ? { direction } : {}) },
  });

  const result: CollectResult = { feedsPolled: 0, itemsAdded: 0, errors: [] };

  for (const feed of feeds) {
    try {
      const entries = await fetchFeed(feed.feedUrl);
      result.feedsPolled += 1;

      for (const entry of entries.slice(0, MAX_ITEMS_PER_FEED)) {
        const existing = await prisma.researchItem.findUnique({
          where: { url: entry.url },
          select: { id: true },
        });
        if (existing) continue;

        await prisma.researchItem.create({
          data: {
            feedId: feed.id,
            direction: feed.direction,
            category: feed.category,
            title: entry.title,
            url: entry.url,
            summary: entry.summary,
            author: entry.author,
            publishedAt: entry.publishedAt,
          },
        });
        result.itemsAdded += 1;
      }

      await prisma.feedSource.update({
        where: { id: feed.id },
        data: { lastFetchedAt: new Date() },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`${feed.name}: ${message}`);
    }
  }

  return result;
}
