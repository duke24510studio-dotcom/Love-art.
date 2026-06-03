import type { PosterTheme } from "@/generated/prisma/client";

export function buildPosterPrompt(theme: Pick<
  PosterTheme,
  "motif" | "verticalTextJa" | "subtitleEn" | "colorPalette" | "stylePreset"
>): string {
  const styleLine = theme.stylePreset
    ? `${theme.stylePreset}, Japandi, Japanese minimalism`
    : "Japandi, Japanese minimalism";

  return `Create an original vertical Japandi-style wall art poster for overseas interior decor buyers.

Subject: ${theme.motif}
Japanese vertical title: ${theme.verticalTextJa}
English subtitle: ${theme.subtitleEn}

Style: ${styleLine}, warm off-white paper, subtle grain texture, muted natural palette,
premium wall art, elegant negative space, refined composition, bold but tasteful vertical Japanese
typography, small red seal stamp, no brand logos, no copyrighted characters, no copied artwork.

Composition: A vertical 2:3 poster layout. Use bold Japanese vertical text as a major decorative element.
Keep the scene calm, collectible, and suitable for modern homes, cafes, hotels, tea rooms, and interior shops.

Color palette: ${theme.colorPalette}`;
}
