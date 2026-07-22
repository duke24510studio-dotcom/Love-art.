import { prisma } from "@/lib/prisma";

// Default trend feeds. All are public RSS endpoints used for inspiration only.
// Add note creator feeds via /api/feeds (format: https://note.com/{creator}/rss).
export const SEED_FEEDS = [
  // en2ja: English trends -> original Japanese articles for note
  {
    name: "Medium — Artificial Intelligence",
    feedUrl: "https://medium.com/feed/tag/artificial-intelligence",
    direction: "en2ja",
    category: "ai",
  },
  {
    name: "Medium — Business",
    feedUrl: "https://medium.com/feed/tag/business",
    direction: "en2ja",
    category: "business",
  },
  {
    name: "Medium — Productivity",
    feedUrl: "https://medium.com/feed/tag/productivity",
    direction: "en2ja",
    category: "lifehack",
  },
  {
    name: "Medium — Life Hacks",
    feedUrl: "https://medium.com/feed/tag/life-hacks",
    direction: "en2ja",
    category: "lifehack",
  },
  {
    name: "Medium — Mindfulness",
    feedUrl: "https://medium.com/feed/tag/mindfulness",
    direction: "en2ja",
    category: "mindfulness",
  },
  {
    name: "Medium — Self Improvement",
    feedUrl: "https://medium.com/feed/tag/self-improvement",
    direction: "en2ja",
    category: "mindfulness",
  },
  // ja2en: Japanese culture trends -> original English articles for Medium
  {
    name: "Google News JP — 禅",
    feedUrl: "https://news.google.com/rss/search?q=%E7%A6%85%E3%81%AE%E6%95%99%E3%81%88&hl=ja&gl=JP&ceid=JP:ja",
    direction: "ja2en",
    category: "zen",
  },
  {
    name: "Google News JP — 茶道",
    feedUrl: "https://news.google.com/rss/search?q=%E8%8C%B6%E9%81%93&hl=ja&gl=JP&ceid=JP:ja",
    direction: "ja2en",
    category: "tea",
  },
  {
    name: "Google News JP — 漫画文化",
    feedUrl: "https://news.google.com/rss/search?q=%E6%BC%AB%E7%94%BB%20%E6%96%87%E5%8C%96&hl=ja&gl=JP&ceid=JP:ja",
    direction: "ja2en",
    category: "manga",
  },
  {
    name: "Google News JP — 日本文化",
    feedUrl: "https://news.google.com/rss/search?q=%E6%97%A5%E6%9C%AC%E6%96%87%E5%8C%96&hl=ja&gl=JP&ceid=JP:ja",
    direction: "ja2en",
    category: "culture",
  },
] as const;

export async function seedFeedsIfEmpty(): Promise<void> {
  const count = await prisma.feedSource.count();
  if (count > 0) return;

  for (const feed of SEED_FEEDS) {
    await prisma.feedSource.create({ data: { ...feed } });
  }
}
