# Digital Product Shop (`/shop`) — 「余白 / YOHAKU STUDIO」

A public storefront + portfolio for the studio's own digital goods: Notion templates,
digital art, illustration sets and poster downloads. It is the second public surface of
this app, alongside `/blog`.

## Why it exists

The poster and article pipelines generate digital assets, but until now there was nowhere
to *show and sell* them. `/shop` is that place: a simple, illustration-led storefront that
doubles as a portfolio, and that any generated asset can be published to from the admin CMS.

## What it is not

- **Not a payment processor.** This app never sees a card number, never stores an order, and
  has no cart. Each product carries a `checkoutUrl` pointing at an external provider
  (Gumroad / BOOTH / Stripe Payment Link) which handles payment, file delivery and the
  legally-required seller disclosure (特定商取引法 etc.). A product with no `checkoutUrl`
  renders as "Coming soon" rather than a dead button.
- **Not auto-publishing.** Nothing is listed automatically. A human picks the asset, writes
  the copy and toggles `published` in the CMS.

## Routes

| Path | Auth | What |
| --- | --- | --- |
| `/shop` | public | Hero, featured products, category strip, catalogue (`?category=` filter) |
| `/shop/[slug]` | public | Product detail: gallery, price, buy link, includes, licence |
| `/shop/about` | public | Studio, production/AI disclosure, delivery, licence |
| `/shop-admin` | Basic Auth | Product list |
| `/shop-admin/new`, `/shop-admin/[id]` | Basic Auth | Create / edit / delete + gallery |
| `/api/shop`, `/api/shop/[id]` | Basic Auth | CRUD |
| `/api/shop/[id]/images[/imageId]` | Basic Auth | Attach / detach gallery images |
| `/api/shop-assets` | Basic Auth | Browse generated poster + mockup images to attach |

The CMS deliberately lives at `/shop-admin`, not under `/shop`, so the public prefix stays a
clean read-only boundary — the same split as `/blog-posts` vs `/blog`.

## Auth boundary

`src/proxy.ts` exempts `^/shop(/|$)` from Basic Auth. That pattern does **not** match
`/shop-admin` (the next character must be `/` or end-of-string), so the CMS and every
`/api/shop*` write route stay protected. Verified: unauthenticated requests get 200 on
`/shop*` and 401 on `/shop-admin` and `/api/shop*`.

## Data model

- `DigitalProduct` — slug, title, tagline, markdown `description`, `category`, `price` +
  `currency`, `coverImage`, `checkoutUrl`, `fileFormat`, `includes` (one item per line),
  `featured`, `published`, `sortOrder`.
- `DigitalProductImage` — extra gallery shots, cascade-deleted with the product.

`coverImage` / `imagePath` hold either an absolute `https` URL or an image-store path
(`outputs/images/<file>`), the same string the poster pipeline writes. `imageSrc()` in
`src/lib/shop.ts` resolves both to a browser URL via the `/outputs/images` rewrite.

Deleting a listing removes only the listing — the underlying `ImageAsset` rows stay, since
the poster studio still owns them.

## Selling a generated asset

1. Generate a poster at `/posters` (or let the daily cron do it).
2. `/shop-admin/new` → fill in the copy → **生成済み画像から選ぶ** to pick the generated
   image as the cover.
3. Save, then attach more shots (e.g. room mockups) in the ギャラリー画像 section.
4. Upload the actual files to Gumroad/BOOTH/Stripe, paste the checkout link into 購入リンク.
5. Tick 公開する.

## Input safety

`checkoutUrl` is rendered as an `href` and `coverImage` as an `img src`, so both are
validated server-side on create and update:

- `sanitizeExternalUrl` accepts only absolute `http:`/`https:` URLs — a `javascript:` or
  `data:` value is rejected with a 400.
- `sanitizeImageReference` accepts an https URL or a bare image filename, which it
  re-anchors to `outputs/images/`, so a path like `../../../etc/passwd` cannot be stored.

## Content rules

Same spirit as the poster and blog pipelines:

- Original work only. No reproduction of an existing print, template or another studio's
  design; no artist names, brand names or trademarked characters.
- Every product page and the About page carry the AI-assistance disclosure
  (`SHOP_DISCLOSURE` / `SHOP_DISCLOSURE_JA` in `src/lib/shop.ts`).
- Digital-download and no-physical-shipment are stated on every product page.
- The licence summary (personal + single-seat commercial, no resale, no model training)
  ships with every listing.

## Illustrations

`src/components/shop/Illustrations.tsx` holds hand-authored inline SVGs — the desk hero, the
enso studio mark, and one fallback cover per category. They are drawn from primitives in
code: no external asset, no CDN request, nothing traced from existing artwork. A product
with no cover image renders its category illustration, so the shop never shows an empty box.

## Seeding

`seedShopIfEmpty()` in `src/lib/seed-shop.ts` runs from `src/instrumentation.ts` on first
boot and inserts `SEED_SHOP_PRODUCTS`, so a fresh Render deploy has a populated storefront
immediately. The seed products ship with no `checkoutUrl` on purpose — they display as
"Coming soon" until real links are added.

The seed lives in `seed-shop.ts` rather than `shop.ts` because `shop.ts` is imported by
client components; pulling Prisma into a client bundle breaks the build.
