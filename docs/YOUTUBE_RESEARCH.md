# YouTube Trend Research

Keyword research over the YouTube Data API v3: find videos that are blowing up
right now, filter out Shorts, and track *how fast* views grow — not just the
current totals.

## Setup

1. Log in to [Google Cloud console](https://console.cloud.google.com/)
2. Create a new project (any name, no organization needed)
3. Make that project active
4. Enable **YouTube Data API v3** (APIs & Services → Library)
5. Create an **API key** (APIs & Services → Credentials)
6. Put it in `.env` as `YOUTUBE_API_KEY=...`

The free quota is 10,000 units/day. A search costs ~101 units
(`search.list` = 100, `videos.list` = 1), a tracked-stats refresh costs
1 unit per 50 videos — so roughly 90+ searches/day fit in the free tier.

## Usage

Open **/youtube-research** and search, e.g. keyword `Claude Code`,
uploaded in the last 30 days, Shorts excluded, ranked by views or like rate.
That answers questions like _"top 10 Claude Code videos worldwide with high
views and a high like rate"_.

- **Filters**: upload window (7/30/90/365 days), exclude Shorts (≤ 3 min),
  region code, rank by views / like rate / views-per-day / 24h growth
- **Results are saved and tracked automatically.** Every search and every
  refresh stores a `YoutubeStatSnapshot`; growth (Δ 24h) is the diff between
  the current view count and a ~1-day-old snapshot
- Toggle **Track** off (or ✕ delete) for videos you don't care about
- **Refresh Stats** re-fetches all tracked videos on demand

## Growth tracking (the important part)

A single stat pull only tells you what's *already* big. Snapshots tell you
what's *getting* big: Δ 24h is views gained over the last day, so freshly
rising videos surface before their totals look impressive. Snapshots come from:

- every search (throttled to one per video per 30 min)
- the **Refresh Stats** button
- `POST /api/cron/youtube` (Bearer `CRON_SECRET`) — the
  `.github/workflows/youtube-refresh.yml` workflow hits it every 6 hours

Δ 24h stays `—` until a video has a snapshot that is at least ~1 hour old.

## API

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/youtube/search` | POST | `{ query, publishedWithinDays?, excludeShorts?, regionCode?, top?, order? }` → ranked results |
| `/api/youtube/videos` | GET | saved videos with growth (`?tracked=true`, `?order=growth`) |
| `/api/youtube/videos` | POST | refresh stats for all tracked videos |
| `/api/youtube/videos/[id]` | PATCH | `{ tracked: boolean }` |
| `/api/youtube/videos/[id]` | DELETE | remove video + snapshots |
| `/api/cron/youtube` | POST/GET | cron refresh (auth: `Bearer CRON_SECRET` or `?secret=`) |

## Data model

- `YoutubeVideo` — one row per video (`videoId` unique), latest stats mirrored
  on the row, `tracked` flag controls cron refresh
- `YoutubeStatSnapshot` — point-in-time `viewCount`/`likeCount`/`commentCount`,
  used to compute growth speed
