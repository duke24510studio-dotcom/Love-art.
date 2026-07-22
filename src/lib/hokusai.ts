import { prisma } from "@/lib/prisma";
import type { PosterTheme } from "@/generated/prisma/client";

// Hokusai-inspired aizuri-e (indigo woodblock) poster themes.
// Katsushika Hokusai (1760-1849) is public domain; we use the ukiyo-e / aizuri-e
// tradition as a broad art-historical style, with ORIGINAL compositions only —
// never a reproduction of a specific existing print.
export const HOKUSAI_COLLECTION = "Hokusai Aizuri (Indigo)";

const INDIGO_PALETTE =
  "deep Prussian blue, indigo, pale sky blue gradations, off-white washi paper, a single small red seal";

export const HOKUSAI_THEMES = [
  {
    themeJa: "大波",
    themeEn: "Great Wave",
    verticalTextJa: "大波",
    subtitleEn: "THE GREAT WAVE / Indigo Ukiyo-e",
    motif:
      "a towering, dynamic breaking ocean wave with curling foam claws, a small distant Mount Fuji beneath it, an original composition in the ukiyo-e tradition",
  },
  {
    themeJa: "富士",
    themeEn: "Mount Fuji",
    verticalTextJa: "富士",
    subtitleEn: "MOUNT FUJI / Indigo Ukiyo-e",
    motif:
      "a serene Mount Fuji under a thin crescent moon, layered stylized clouds and a calm foreground of pines",
  },
  {
    themeJa: "鯉滝登り",
    themeEn: "Leaping Carp",
    verticalTextJa: "鯉",
    subtitleEn: "LEAPING CARP / Indigo Ukiyo-e",
    motif:
      "a powerful koi carp leaping up a rushing waterfall, swirling water patterns, dynamic flowing linework",
  },
  {
    themeJa: "波千鳥",
    themeEn: "Plovers Over Waves",
    verticalTextJa: "波千鳥",
    subtitleEn: "PLOVERS & WAVES / Indigo Ukiyo-e",
    motif:
      "a flock of stylized plover birds gliding over rhythmic patterned ocean waves",
  },
  {
    themeJa: "雲龍",
    themeEn: "Cloud Dragon",
    verticalTextJa: "雲龍",
    subtitleEn: "CLOUD DRAGON / Indigo Ukiyo-e",
    motif:
      "a coiling Japanese dragon emerging from swirling storm clouds and rain, bold sweeping linework",
  },
  {
    themeJa: "松に鶴",
    themeEn: "Cranes and Pine",
    verticalTextJa: "松鶴",
    subtitleEn: "CRANES & PINE / Indigo Ukiyo-e",
    motif:
      "elegant red-crowned cranes in flight above a windswept pine on a rocky shore, drifting mist",
  },
  {
    themeJa: "雨の橋",
    themeEn: "Rain Bridge",
    verticalTextJa: "雨橋",
    subtitleEn: "RAIN ON THE BRIDGE / Indigo Ukiyo-e",
    motif:
      "travelers with umbrellas crossing an arched wooden bridge in slanting rain, stylized rain lines",
  },
  {
    themeJa: "満月に薄",
    themeEn: "Moon and Susuki",
    verticalTextJa: "月芒",
    subtitleEn: "MOON & PAMPAS / Indigo Ukiyo-e",
    motif:
      "a full moon behind swaying susuki pampas grass, a few geese crossing the sky, quiet autumn stillness",
  },
] as const;

export function buildHokusaiPrompt(
  theme: Pick<PosterTheme, "motif" | "verticalTextJa" | "subtitleEn" | "colorPalette">
): string {
  return `Create an ORIGINAL vertical Japanese ukiyo-e style wall art poster in the aizuri-e tradition — an indigo / Prussian-blue monochrome woodblock print in the Edo-period spirit of masters such as Katsushika Hokusai. This must be an entirely original composition, NOT a copy or reproduction of any existing artwork or print.

Subject: ${theme.motif}
Japanese vertical title: ${theme.verticalTextJa}
English subtitle: ${theme.subtitleEn}

Style: traditional ukiyo-e woodblock aesthetic, aizuri-e indigo-blue palette, bold confident flowing linework, stylized waves / clouds / wind / rain patterns, visible woodgrain and hand-printed texture, elegant negative space, a single small red seal stamp as the only warm accent, refined vertical Japanese typography. No brand logos, no copyrighted characters, no reproduction of existing artworks.

Composition: a vertical 2:3 poster layout with a bold, dynamic ukiyo-e composition, suitable for modern homes, galleries, cafes, tea rooms, and collectors.

Color palette: ${theme.colorPalette}`;
}

/** Insert the Hokusai theme pool if none exist yet (idempotent by themeEn). */
export async function ensureHokusaiThemes(): Promise<void> {
  for (const t of HOKUSAI_THEMES) {
    const exists = await prisma.posterTheme.findFirst({
      where: { collection: HOKUSAI_COLLECTION, themeEn: t.themeEn },
      select: { id: true },
    });
    if (!exists) {
      await prisma.posterTheme.create({
        data: {
          collection: HOKUSAI_COLLECTION,
          themeJa: t.themeJa,
          themeEn: t.themeEn,
          verticalTextJa: t.verticalTextJa,
          subtitleEn: t.subtitleEn,
          motif: t.motif,
          colorPalette: INDIGO_PALETTE,
          stylePreset: "Hokusai Aizuri Ukiyo-e",
          status: "idea",
        },
      });
    }
  }
}
