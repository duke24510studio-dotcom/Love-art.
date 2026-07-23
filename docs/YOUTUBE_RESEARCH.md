# YouTube Research — overseas trend research + original channel ideation

Research tool for spotting overseas YouTube trends early, plus an AI-assisted
generator for **original** channel-concept proposals. Same philosophy as the
poster and article pipelines: automate the research and drafting, keep a
human in the loop before anything is built or published.

## ⚠️ Policy (most important)

- Data comes **only** from the official YouTube Data API v3 (`videos.list`
  `chart=mostPopular` for trending charts, `channels.list` for public stats).
  No scraping, no unofficial endpoints.
- Trending videos/channels are used **only as an inspiration signal** for
  which format/niche is resonating (view velocity, growth rate) — never as
  content to copy. The AI proposal generator is explicitly instructed to
  never reuse a source video's title, a source channel's name/branding, or
  any of its actual content, and never to suggest impersonating, cloning, or
  re-uploading/re-posting an existing channel's videos.
- This pipeline generates **research data and channel-concept proposals
  only**. There is no auto-upload, auto-post, or channel-creation
  automation — a human reviews and approves each proposal before building
  anything, exactly like the article/poster pipelines never auto-publish.

## Data model (Prisma)

- **YtVideoSnapshot** — one polling snapshot of a trending video in a region
  (title, channel, view/like/comment counts, `vph` = views-per-hour since
  publish). History accumulates across runs.
- **YtChannelSnapshot** — one polling snapshot of a channel's public stats
  (subscribers, views, videos). Comparing two snapshots over time yields
  growth rate.
- **ChannelIdea** — an AI-proposed original channel concept (name, concept,
  audience, content pillars, sample titles, cadence), optionally linked to
  the `YtVideoSnapshot` that inspired it. Status flow: `idea → review →
  approved` / `rejected`.

## API routes

| Method | Path | Role |
|--------|------|------|
| POST | `/api/youtube/collect` | Poll trending charts + channel stats for each region, store snapshots |
| GET | `/api/youtube/videos` | Latest video snapshots (`region`, `sort=views\|vph`, `q` search) |
| GET | `/api/youtube/channels` | Rapidly-growing channels (`days` lookback, `limit`) |
| GET/POST | `/api/youtube/ideas` | List proposals / generate one from a trending video |
| GET/PATCH/DELETE | `/api/youtube/ideas/[id]` | Fetch / approve-reject / delete a proposal |
| POST | `/api/cron/youtube` | Collect + generate N proposals in one call (`CRON_SECRET`-protected) |
| GET | `/api/export/youtube-csv` | CSV export (`tab=videos\|channels\|ideas`) |

## Scheduling

Same "external cron hits a protected endpoint" approach as the article/poster
pipelines — no in-app scheduler. `.github/workflows/youtube-research.yml`
runs every 6 hours (`Authorization: Bearer $CRON_SECRET`), collecting fresh
snapshots and generating a small number of proposals (default 1).

## Review UI

`/youtube-research` — five tabs mirroring the reference research tool:

- **急上昇動画 (Trending)** — all-region latest snapshots, sorted by views
- **初速ランキング (Velocity ranking)** — same data sorted by views-per-hour
- **海外トレンド (Overseas trend)** — region-filterable (US/GB/IN/JP/KR/TW/...)
- **急成長チャンネル (Rapidly growing channels)** — subscriber/view growth
  over a lookback window (needs ≥2 Collect Now runs per channel)
- **AI企画提案 (AI channel-idea proposals)** — generate, review, approve/reject

## Environment variables

```
YOUTUBE_API_KEY=       # YouTube Data API v3 key (console.cloud.google.com)
YOUTUBE_REGIONS=       # optional, comma-separated ISO region codes (default US,GB,IN,JP,KR,TW)
CHANNEL_IDEA_MODEL=    # optional, default gpt-4o
```

## Future TODOs (not in MVP)

- Persist per-video rank-change history (not just views/VPH) for a true
  "急上昇" leaderboard delta view
- Category-based filtering (YouTube `videoCategoryId`)
- Duplicate-niche detection across approved `ChannelIdea` proposals
