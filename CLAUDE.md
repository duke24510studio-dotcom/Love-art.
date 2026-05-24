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

## Future TODOs (not in MVP)

- POST /api/generate/prompt — build prompt from theme, save to PosterGeneration
- POST /api/generate/poster — call OpenAI image API, save to /outputs/images
- POST /api/generate/copy — call OpenAI chat API for Etsy+SNS copy
- Etsy API auto-listing (requires OAuth)
- Pinterest auto-pin
- Instagram auto-post
- Buffer/social scheduler integration
