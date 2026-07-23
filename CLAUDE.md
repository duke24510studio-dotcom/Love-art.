# Japandi Poster Auto Studio

## Project Purpose

This app generates and manages AI-assisted Japandi-style poster products for overseas interior decor buyers.

The app helps create:
- Japanese landscape posters
- Wazuka tea field posters
- Tea ceremony posters
- Zen temple posters
- Showa retro street posters
- Japanese countryside posters
- Koi, fox, crane, cat, and other Japan-inspired animal posters

## Important Rules

Do not copy specific artists, Etsy shops, brand names, or copyrighted designs.

Use broad and original style descriptors only:
- Japandi
- Japanese minimalism
- wabi-sabi
- muted natural palette
- tea culture
- Showa retro
- Japanese countryside
- Zen landscape
- minimal wall art
- vintage Japanese print feeling

MVP must not auto-publish to Etsy or SNS.

MVP only:
- generates poster data
- generates images
- generates Etsy copy
- generates SNS captions
- saves files locally
- exports CSV
- exports ZIP
- allows human review

## Tech Stack

- Next.js App Router (v15+)
- TypeScript
- Tailwind CSS
- Prisma 7 + SQLite
- OpenAI API (image generation via DALL-E 3)
- Local storage under /outputs/images

## Prisma Notes (v7)

Prisma 7 has breaking changes:
- `datasource.url` is NOT set in `schema.prisma` — it's configured in `prisma.config.ts`
- Client is generated to `src/generated/prisma`
- Import from `@/generated/prisma` not `@prisma/client`

## Brand Aesthetic

UI should feel:
- Japanese minimal
- calm
- clean
- warm
- premium
- creative studio-like

Colors:
- warm cream (#f5f0e8)
- deep green (#2d5a3d)
- charcoal (#2c2c2c)
- parchment (#ede8dc)
- border (#d8d0c0)

## Poster Status Flow

```
idea → prompted → generated → review → approved → exported
                                     ↘ rejected
```

## Core Workflow

1. Create poster theme (/posters/new)
2. Generate prompt (POST /api/generate/prompt) — TODO
3. Generate poster image (POST /api/generate/poster) — TODO
4. Generate Etsy copy (POST /api/generate/copy) — TODO
5. Generate SNS captions — TODO
6. Review image and copy (/posters/[id])
7. Approve or reject
8. Export approved items (POST /api/export/csv, POST /api/export/zip)

## Poster Prompt Template

Create an original vertical Japandi-style wall art poster for overseas interior decor buyers.

Subject: {motif}
Japanese vertical title: {verticalTextJa}
English subtitle: {subtitleEn}

Style: Japandi, Japanese minimalism, warm off-white paper, subtle grain texture, muted natural palette,
premium wall art, elegant negative space, refined composition, bold but tasteful vertical Japanese
typography, small red seal stamp, no brand logos, no copyrighted characters, no copied artwork.

Composition: A vertical 2:3 poster layout. Use bold Japanese vertical text as a major decorative element.
Keep the scene calm, collectible, and suitable for modern homes, cafes, hotels, tea rooms, and interior shops.

Color palette: {colorPalette}

## Etsy Copy Rules

Title: English only, 120-140 chars, include Japandi/Japan keywords, no brand names
Tags: Exactly 13, Etsy-friendly natural search phrases
Description: English, mention digital download, no physical item, no frame, AI-assisted disclosure

## AI Disclosure Text

This artwork was created using AI-assisted tools and carefully curated, edited, and finalized by the seller.

## Safety

Do not generate illegal, offensive, adult, political, or hateful content.
Do not use living artists' names.
Do not imitate a specific Etsy seller.
Do not include trademarked characters or logos.

## Article Pipeline (Medium <-> note draft studio)

See docs/ARTICLE_PIPELINE.md for full design.

- Collects trends from public RSS feeds (Medium tags, Google News JP) as INSPIRATION ONLY
- Generates COMPLETELY ORIGINAL drafts via OpenAI — never translates or reproduces source articles (copyright + platform ToS)
- Channels (direction): en2ja (ランタンノート — global trends x Zen life-coach, note), stillflow (still flow / 円相 — Zen x Western philosophy essays, note), econ (知の翻訳室 / THE KNOWLEDGE EDIT — behavioral economics / marketing / overseas business practices, note), ja2en (Japanese culture for Medium, not on the daily schedule)
- Publishing is manual after human review at /articles — no auto-posting (note has no public API; Medium's is closed)
- External cron hits POST /api/cron/pipeline (Bearer CRON_SECRET); GitHub Actions workflow runs it daily (1 draft each for en2ja + stillflow + econ)
- Article status flow: generated → review → approved → published / rejected

## Poster Pipeline (Hokusai aizuri-e auto-generation)

- Daily cron generates original Hokusai-style aizuri-e (indigo ukiyo-e) poster images (default 3)
- POST /api/cron/posters (Bearer CRON_SECRET); GitHub Actions workflow runs it daily at 00:15 UTC
- Orientation: "portrait" (2:3 wall art), "landscape" (16:9 — YouTube thumbnails/banners, EC hero images), or "mixed" (default: 1-in-3 landscape)
- Image model configurable via POSTER_IMAGE_MODEL (default gpt-image-1; dall-e-3 fallback), quality via POSTER_IMAGE_QUALITY
- Print-resolution upscale (src/lib/upscale.ts, default 4x via sharp) written to PosterGeneration.printImagePath alongside the preview image
- Themes/prompts in src/lib/hokusai.ts (original compositions only, no reproduction of existing prints); image render shared via src/lib/poster-image.ts
- Images only — approval/export stays human-reviewed at /posters

## YouTube Research (overseas trend research + original channel ideation)

- Research tool for overseas YouTube trends: periodic polling of trending charts + channel stats
  via the official YouTube Data API v3 (no scraping)
- POST /api/cron/youtube (Bearer CRON_SECRET); GitHub Actions workflow runs it every 6 hours
- Prisma models: YtVideoSnapshot (trending video polls, tracks views-per-hour "vph"), YtChannelSnapshot
  (channel stat polls, used to compute subscriber/view growth), ChannelIdea (AI-proposed original
  channel concept, human-reviewed)
- Trending data is INSPIRATION ONLY for niche/format — the AI channel-idea generator
  (src/lib/channel-ideas.ts) is explicitly instructed to never reuse a source video's title, a
  source channel's name/branding, or its content, and never to suggest impersonation or re-uploads
- No auto-channel-creation, no auto-upload, no auto-posting — proposals are reviewed/approved at
  /youtube-research, same "generate but don't auto-publish" MVP philosophy as posters/articles
- See docs/YOUTUBE_RESEARCH.md for full design

## Future TODOs (not in MVP)

- POST /api/generate/prompt — build prompt from theme, save to PosterGeneration
- POST /api/generate/poster — call OpenAI image API, save to /outputs/images
- POST /api/generate/copy — call OpenAI chat API for Etsy+SNS copy
- Etsy API auto-listing (requires OAuth)
- Pinterest auto-pin
- Instagram auto-post
- Buffer/social scheduler integration
