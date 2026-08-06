// Public digital-product storefront ("余白 / YOHAKU STUDIO") shared constants
// + seed catalogue. This is the portfolio/shop half of the public site: /blog
// is editorial content, /shop is the studio's own digital goods.
//
// Payment deliberately lives OUTSIDE this app — each product links to an
// external checkout (Gumroad / BOOTH / Stripe Payment Link) so we never
// handle card data or store orders. See docs/SHOP.md.

export const SHOP_NAME = "YOHAKU STUDIO";
export const SHOP_NAME_JA = "余白";
export const SHOP_TAGLINE = "Digital templates, art & illustration for a calmer desk.";
export const SHOP_TAGLINE_JA = "余白のある、デジタルプロダクト。";

export const SHOP_DISCLOSURE =
  "All artwork and templates here are original works by this studio. Some assets are produced with AI-assisted tools and are curated, edited and finalised by hand before release.";
export const SHOP_DISCLOSURE_JA =
  "掲載しているアートワーク・テンプレートはすべて当スタジオのオリジナル作品です。一部の素材はAIの制作支援を用い、公開前に人の手で確認・調整しています。";

// Digital goods have no physical shipment and no returns once downloaded —
// stating this up front is a legal requirement for JP sellers (特定商取引法)
// and simply good practice everywhere else.
export const SHOP_DELIVERY_NOTE =
  "Digital download. No physical item will be shipped. Files are delivered instantly through the checkout provider.";
export const SHOP_DELIVERY_NOTE_JA =
  "デジタルダウンロード商品です。現物の発送はありません。購入後、決済サービス上ですぐにダウンロードいただけます。";

// Left empty on purpose — set it to a real address to show a contact block on
// /shop/about. Legally-required seller disclosure (特定商取引法 etc.) is carried
// by the external checkout provider, not by this page.
export const SHOP_CONTACT_EMAIL = "";

export const SHOP_LICENSE_SUMMARY = [
  "Personal use and single-seat commercial use are both included.",
  "Print for your own home, studio, office or client project.",
  "Do not resell, redistribute or repackage the files as your own product.",
  "Do not use the files to train or fine-tune generative models.",
];

export type ShopCategory = {
  slug: string;
  label: string;
  labelJa: string;
  blurb: string;
};

// Category slugs double as the key for the fallback illustration drawn when a
// product has no cover image yet (see src/components/shop/Illustrations.tsx).
export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    slug: "notion-template",
    label: "Notion Templates",
    labelJa: "Notionテンプレート",
    blurb: "Calm, structured workspaces you can duplicate in one click.",
  },
  {
    slug: "digital-art",
    label: "Digital Art",
    labelJa: "デジタルアート",
    blurb: "Original prints made for quiet walls — download, print, frame.",
  },
  {
    slug: "illustration",
    label: "Illustration",
    labelJa: "イラスト",
    blurb: "Simple line illustrations and icon sets for your own projects.",
  },
  {
    slug: "poster",
    label: "Posters",
    labelJa: "ポスター",
    blurb: "Print-resolution wall art in standard frame ratios.",
  },
];

export function categoryBySlug(slug: string): ShopCategory | undefined {
  return SHOP_CATEGORIES.find((c) => c.slug === slug);
}

export function categoryLabel(slug: string): string {
  return categoryBySlug(slug)?.label ?? "Digital Goods";
}

/**
 * Resolve a stored image reference to a URL the browser can load.
 * Absolute URLs pass through; anything else is treated as an image-store path
 * ("outputs/images/<file>") and routed through the /outputs rewrite so
 * generated assets work the same as they do in the admin tool.
 */
export function imageSrc(reference: string): string | null {
  const ref = reference.trim();
  if (!ref) return null;
  if (/^https?:\/\//i.test(ref)) return ref;
  const file = ref.split("/").pop();
  return file ? `/outputs/images/${file}` : null;
}

export function formatPrice(price: number, currency: string): string {
  if (price <= 0) return "Free";
  if (currency === "JPY") return `¥${price.toLocaleString("ja-JP")}`;
  if (currency === "USD") return `$${price.toLocaleString("en-US")}`;
  return `${price.toLocaleString("en-US")} ${currency}`;
}

/**
 * Split the "includes" field into bullet items — one per line, matching what
 * the CMS field says. Deliberately not splitting on commas: items like
 * "2:3 ratio (fits A4/A3, 12x18in, 24x36in)" are one bullet, not four.
 */
export function parseIncludes(includes: string): string[] {
  return includes
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Accept only http(s) URLs for anything that ends up in an href or img src.
 * checkoutUrl is rendered as a link and coverImage may be an absolute URL, so
 * a `javascript:`/`data:` value pasted into the CMS must never survive a save.
 * Returns null when the input is not a usable absolute http(s) URL.
 */
export function sanitizeExternalUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Normalise a stored image reference: an absolute http(s) URL, or an
 * image-store path restricted to a bare filename under outputs/images (which
 * is all /api/static resolves anyway). Anything else is rejected.
 */
export function sanitizeImageReference(input: string): string | null {
  const value = input.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return sanitizeExternalUrl(value);
  const file = value.split("/").pop() ?? "";
  return /^[A-Za-z0-9._-]+\.(png|jpe?g|webp)$/i.test(file) ? `outputs/images/${file}` : null;
}

export function slugifyShop(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type SeedShopProduct = {
  slug: string;
  title: string;
  tagline: string;
  category: string;
  price: number;
  currency: string;
  fileFormat: string;
  includes: string;
  featured: boolean;
  sortOrder: number;
  description: string;
};

// Seed catalogue so a fresh deploy has a real-looking storefront immediately
// (same pattern as SEED_BLOG_POSTS). checkoutUrl is intentionally left empty:
// products show as "Coming soon" until a real checkout link is pasted in the
// CMS, rather than shipping dead buy buttons.
export const SEED_SHOP_PRODUCTS: SeedShopProduct[] = [
  {
    slug: "quiet-desk-notion-dashboard",
    title: "Quiet Desk — Notion Dashboard",
    tagline: "余白のあるNotionダッシュボード。1日1画面で完結する構成。",
    category: "notion-template",
    price: 1800,
    currency: "JPY",
    fileFormat: "Notion duplicate link + setup PDF",
    includes:
      "Daily dashboard page\nTask & project databases\nWeekly review template\nSetup guide (EN / JA)",
    featured: true,
    sortOrder: 10,
    description: `A single-screen Notion workspace built around one idea: you should be able to see today, and nothing else, when you open it.

## What it is

Most productivity templates try to hold everything at once. This one hides the archive by default and shows a short daily view — today's tasks, the project they belong to, and a small space for notes. Everything else lives one click away.

## How it is built

- A daily dashboard page as the home view
- Task and project databases linked by relation, filtered to "today" and "this week"
- A weekly review page that pulls in what you finished
- No formulas you need to understand to use it

## Setup

Duplicate the page into your own workspace and follow the included PDF. Setup takes about ten minutes, and nothing needs a paid Notion plan.`,
  },
  {
    slug: "aizuri-indigo-print-set",
    title: "Aizuri — Indigo Print Set (3 posters)",
    tagline: "藍摺りの浮世絵から着想した、オリジナルの縦型プリント3点セット。",
    category: "digital-art",
    price: 2400,
    currency: "JPY",
    fileFormat: "PNG + PDF, 300dpi, 2:3 ratio",
    includes:
      "3 original prints\n2:3 ratio (fits A4/A3, 12x18in, 24x36in)\n300dpi print files\nPersonal + single-seat commercial licence",
    featured: true,
    sortOrder: 20,
    description: `Three original vertical prints in a deep indigo palette, drawn in the spirit of aizuri-e — the blue-dominant woodblock printing style of the Edo period — without reproducing any existing print.

## What you get

Three print-ready files at 300dpi in a 2:3 ratio, so they drop straight into standard frames without cropping: A4, A3, 12×18in and 24×36in all work.

## Where they sit well

Quiet rooms. Hallways, studies, tea rooms, small cafés. The palette stays in one narrow band of blue so the set reads as one piece across a wall.

## Printing notes

Matte or textured paper suits the grain in these files better than gloss. If you are printing larger than A2, use the PDF rather than the PNG.`,
  },
  {
    slug: "minimal-line-icon-set",
    title: "Minimal Line Icons — 60 SVG set",
    tagline: "手描きの線で描いた、汎用60アイコン。SVGで自由に色を変えられます。",
    category: "illustration",
    price: 1200,
    currency: "JPY",
    fileFormat: "SVG + PNG",
    includes: "60 icons\nSVG (editable stroke)\nPNG @2x\nFigma file",
    featured: false,
    sortOrder: 30,
    description: `Sixty simple line icons drawn on a consistent grid with a single stroke weight, for interfaces, slide decks and printed material.

## Details

- Consistent 24px grid, 1.5px stroke
- Editable stroke in SVG — change weight and colour freely
- PNG exports at 2x for quick use
- Figma file with every icon as a component

## Licence

Use them in personal and commercial projects, including client work. The one thing you cannot do is resell the icon set itself.`,
  },
  {
    slug: "japandi-poster-starter-pack",
    title: "Japandi Wall Art — Starter Pack",
    tagline: "Japandiな部屋づくりのための、落ち着いた5枚のウォールアート。",
    category: "poster",
    price: 2800,
    currency: "JPY",
    fileFormat: "PNG + PDF, 300dpi",
    includes:
      "5 original posters\n2:3 and 3:4 ratios included\n300dpi print files\nFrame & paper guide",
    featured: false,
    sortOrder: 40,
    description: `Five original posters in a muted natural palette — warm off-white paper, soft grain, generous negative space — made for rooms that are already calm and want to stay that way.

## What you get

Each poster ships in both 2:3 and 3:4 ratios at 300dpi, so you can frame them without cropping whichever size you already own.

## A short guide is included

The pack comes with a one-page guide on paper stock and frame choices, because a warm-white matte paper changes these files more than any edit would.`,
  },
  {
    slug: "studio-log-notion-template",
    title: "Studio Log — Creative Work Tracker",
    tagline: "制作物・公開先・売上を1か所で追うための、クリエイター向けNotion。",
    category: "notion-template",
    price: 1500,
    currency: "JPY",
    fileFormat: "Notion duplicate link",
    includes:
      "Work log database\nRelease & platform tracker\nIdea inbox\nMonthly summary view",
    featured: false,
    sortOrder: 50,
    description: `A tracker for people who make things and lose track of where they published them.

## The problem it solves

You finish a piece of work. It goes to two or three places — a shop, a social account, a portfolio. Three months later you cannot remember which. This template keeps one row per work and links every release to it.

## Inside

- A work log with status, format and finish date
- A release tracker linked to each work, one row per platform
- An idea inbox for things you have not started
- A monthly view that shows what you actually shipped

No revenue formulas or forecasting — just a record of what exists and where it went.`,
  },
];
