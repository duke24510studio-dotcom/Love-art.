// Lightweight RSS 2.0 / Atom parser. Collects title/link/summary only —
// article bodies are never stored (inspiration-only policy, see docs/ARTICLE_PIPELINE.md).

export type FeedEntry = {
  title: string;
  url: string;
  summary: string;
  author: string;
  publishedAt: Date | null;
};

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&[a-z]+;|&#\d+;/gi, (match) => ENTITIES[match] ?? match);
}

function stripCdata(text: string): string {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function stripHtml(text: string): string {
  return decodeEntities(stripCdata(text).replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function getAtomLink(xml: string): string {
  const links = xml.match(/<link\b[^>]*>/gi) ?? [];
  let fallback = "";
  for (const link of links) {
    const href = link.match(/href="([^"]*)"/i)?.[1] ?? "";
    if (!href) continue;
    const rel = link.match(/rel="([^"]*)"/i)?.[1] ?? "alternate";
    if (rel === "alternate") return decodeEntities(href);
    if (!fallback) fallback = href;
  }
  return decodeEntities(fallback);
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseItem(xml: string, isAtom: boolean): FeedEntry | null {
  const title = stripHtml(getTag(xml, "title"));
  const url = isAtom
    ? getAtomLink(xml)
    : stripHtml(getTag(xml, "link")) || getTag(xml, "guid").trim();
  if (!title || !url.startsWith("http")) return null;

  const rawSummary = isAtom
    ? getTag(xml, "summary") || getTag(xml, "content")
    : getTag(xml, "description") || getTag(xml, "content:encoded");
  const rawDate = isAtom
    ? getTag(xml, "published") || getTag(xml, "updated")
    : getTag(xml, "pubDate") || getTag(xml, "dc:date");
  const author = stripHtml(getTag(xml, "dc:creator") || getTag(xml, "author"));

  return {
    title,
    url: stripHtml(url),
    summary: stripHtml(rawSummary).slice(0, 500),
    author: author.slice(0, 120),
    publishedAt: parseDate(stripHtml(rawDate)),
  };
}

export function parseFeed(xml: string): FeedEntry[] {
  const rssItems = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  const atomEntries = rssItems.length ? [] : (xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? []);
  const entries: FeedEntry[] = [];
  for (const item of rssItems) {
    const parsed = parseItem(item, false);
    if (parsed) entries.push(parsed);
  }
  for (const entry of atomEntries) {
    const parsed = parseItem(entry, true);
    if (parsed) entries.push(parsed);
  }
  return entries;
}

export async function fetchFeed(feedUrl: string): Promise<FeedEntry[]> {
  const res = await fetch(feedUrl, {
    headers: {
      "User-Agent": "JapandiArticleStudio/0.1 (trend research; contact: site owner)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`Feed fetch failed (${res.status}): ${feedUrl}`);
  }
  return parseFeed(await res.text());
}
