// Hand-authored line illustrations for the /shop storefront.
//
// Everything here is drawn from primitive shapes in code — no external asset,
// no traced or copied artwork, nothing fetched at runtime. They double as the
// cover image for products that do not have one yet, so the shop never shows
// a broken or empty card.

const INK = "#2d5a3d";
const SOFT = "#7a9e7e";
const PAPER = "#ede8dc";
const ACCENT = "#c05a4a";

type IllustrationProps = {
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Enso-style studio mark, echoing the "◯" used in the admin header.
 * Strokes with currentColor so callers set it via `style`/text colour.
 */
export function StudioMark({ className, style }: IllustrationProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={style} aria-hidden="true" fill="none">
      <path
        d="M30 9.5a14 14 0 1 0 4.2 8.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Storefront hero: a quiet desk — window light, screen, plant, cup, prints.
 */
export function DeskIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 360 260" className={className} aria-hidden="true" fill="none">
      {/* sun / window light */}
      <circle cx="278" cy="66" r="34" fill={PAPER} />
      <circle cx="278" cy="66" r="34" stroke={SOFT} strokeWidth="1.5" />
      <path d="M244 66h68" stroke={SOFT} strokeWidth="1.5" strokeLinecap="round" />

      {/* wall print */}
      <rect x="44" y="30" width="72" height="96" rx="2" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M56 100c14-26 24-26 34-10s16 10 14 10" stroke={SOFT} strokeWidth="2" strokeLinecap="round" />
      <circle cx="66" cy="56" r="8" stroke={ACCENT} strokeWidth="2" />

      {/* desk surface */}
      <path d="M24 196h312" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M62 196v40M298 196v40" stroke={INK} strokeWidth="2" strokeLinecap="round" />

      {/* laptop */}
      <path
        d="M136 196V150a4 4 0 0 1 4-4h84a4 4 0 0 1 4 4v46"
        fill={PAPER}
        stroke={INK}
        strokeWidth="2"
      />
      <path d="M126 196h108" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M152 162h44M152 174h60" stroke={SOFT} strokeWidth="2" strokeLinecap="round" />

      {/* plant */}
      <path d="M268 196v-26" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M268 176c-16-2-22-12-22-24 12 0 22 8 22 24ZM268 170c14-3 20-13 20-25-12 1-20 9-20 25Z"
        fill={PAPER}
        stroke={SOFT}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M258 196h20l-3 18h-14Z" fill={PAPER} stroke={INK} strokeWidth="2" strokeLinejoin="round" />

      {/* cup */}
      <path d="M92 178h26v12a10 10 0 0 1-10 10h-6a10 10 0 0 1-10-10Z" fill={PAPER} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M118 182h6a6 6 0 0 1 0 12h-6" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M100 168c0-4 4-4 4-8M110 168c0-4 4-4 4-8" stroke={SOFT} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Category fallback covers, drawn on a 3:4 card canvas.
 */
function NotionTemplateArt() {
  return (
    <>
      <rect x="42" y="46" width="156" height="164" rx="4" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <path d="M42 76h156" stroke={INK} strokeWidth="2.5" />
      <circle cx="56" cy="61" r="4" fill={SOFT} />
      <circle cx="70" cy="61" r="4" fill={SOFT} />
      <rect x="60" y="94" width="14" height="14" rx="3" stroke={INK} strokeWidth="2.5" />
      <path d="M64 101l3.5 3.5 6-7" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M86 101h72" stroke={SOFT} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="60" y="126" width="14" height="14" rx="3" stroke={INK} strokeWidth="2.5" />
      <path d="M86 133h58" stroke={SOFT} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="60" y="158" width="14" height="14" rx="3" stroke={INK} strokeWidth="2.5" />
      <path d="M86 165h66" stroke={SOFT} strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

function DigitalArtArt() {
  return (
    <>
      <rect x="46" y="40" width="148" height="176" rx="3" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <circle cx="152" cy="86" r="18" stroke={ACCENT} strokeWidth="2.5" />
      <path
        d="M62 178c22-46 36-58 50-38s24 22 32 8 18-14 34 30"
        stroke={SOFT}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M62 178h116" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

function IllustrationArt() {
  return (
    <>
      <circle cx="120" cy="118" r="66" fill={PAPER} stroke={SOFT} strokeWidth="2.5" />
      {/* pen nib */}
      <path
        d="M96 156 148 78a10 10 0 0 1 16 11l-52 78-18 6Z"
        fill="none"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M104 142l14 9" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      {/* stroke it drew */}
      <path d="M70 190c22 0 30-12 52-12" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

function PosterArt() {
  return (
    <>
      <path d="M30 206h180" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="64" y="34" width="112" height="150" rx="2" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <path d="M80 152c20-40 30-40 42-22s16 12 34-14" stroke={SOFT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="98" cy="66" r="14" stroke={ACCENT} strokeWidth="2.5" />
      <path d="M124 62v34" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M140 62v22" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

const CATEGORY_ART: Record<string, () => React.ReactElement> = {
  "notion-template": NotionTemplateArt,
  "digital-art": DigitalArtArt,
  illustration: IllustrationArt,
  poster: PosterArt,
};

/**
 * Fallback cover for a product with no image yet. Falls back again to the
 * poster drawing for an unknown category, so this always renders something.
 */
export function CategoryIllustration({
  category,
  className,
}: IllustrationProps & { category: string }) {
  const Art = CATEGORY_ART[category] ?? PosterArt;
  return (
    <svg viewBox="0 0 240 240" className={className} aria-hidden="true" fill="none">
      <rect width="240" height="240" fill="#f5f0e8" />
      <Art />
    </svg>
  );
}

/**
 * Small decorative divider used between page sections.
 */
export function LeafDivider({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 24" className={className} aria-hidden="true" fill="none">
      <path d="M0 12h44M76 12h44" stroke={PAPER} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M60 4c6 3 8 6 8 9s-3 7-8 7-8-4-8-7 2-6 8-9Z"
        stroke={SOFT}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
