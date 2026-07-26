// Visual style presets for video scene images.
//
// Scene stills are generated WITHOUT any lettering — every caption, title, and
// subtitle is drawn by the browser renderer (src/app/(admin)/videos/[id]/studio)
// on top of the image, so the text is crisp and editable instead of baked in by
// the image model.

export type VideoStyleKey = "japandi" | "aizuri" | "photo" | "sumi" | "flat";

export type VideoStylePreset = {
  key: VideoStyleKey;
  labelJa: string;
  descriptionJa: string;
  /** Appended to every scene image prompt. */
  fragment: string;
};

export const VIDEO_STYLES: VideoStylePreset[] = [
  {
    key: "japandi",
    labelJa: "Japandi ミニマル",
    descriptionJa: "温かみのある生成り色、余白の多い静かな構図",
    fragment:
      "Japandi style, Japanese minimalism, warm off-white paper tone, subtle grain texture, muted natural palette of sand, clay, sage and charcoal, soft diffused daylight, generous negative space, calm and premium, refined composition",
  },
  {
    key: "aizuri",
    labelJa: "藍摺り（浮世絵）",
    descriptionJa: "藍一色の浮世絵調。落ち着いた和のトーン",
    fragment:
      "original aizuri-e style woodblock print aesthetic, indigo and prussian blue monochrome palette with pale paper tone, flat layered planes, gentle line work, traditional Japanese print texture, calm and contemplative, an entirely original composition (never a reproduction of any existing print)",
  },
  {
    key: "photo",
    labelJa: "自然光の写真",
    descriptionJa: "生活感のある、静かな写真トーン",
    fragment:
      "calm editorial photography, natural window light, shallow depth of field, muted desaturated colours, everyday Japanese interior or streetscape, quiet documentary mood, no people's faces in focus, realistic and unstaged",
  },
  {
    key: "sumi",
    labelJa: "墨絵",
    descriptionJa: "余白の広い、静かな水墨表現",
    fragment:
      "sumi-e ink wash painting, soft graded black ink on warm rice paper, sparse brushwork, vast negative space, meditative stillness, subtle bleed and texture, minimal accent of a single muted colour",
  },
  {
    key: "flat",
    labelJa: "フラットイラスト",
    descriptionJa: "説明向けの、落ち着いた平面イラスト",
    fragment:
      "flat vector illustration, simple geometric shapes, muted earthy palette of sage green, clay, cream and charcoal, clean editorial infographic feeling, soft rounded forms, plenty of empty space, no gradients-heavy 3D rendering",
  },
];

export function getVideoStyle(key: string): VideoStylePreset {
  return VIDEO_STYLES.find((s) => s.key === key) ?? VIDEO_STYLES[0];
}

export function isVideoStyleKey(value: unknown): value is VideoStyleKey {
  return typeof value === "string" && VIDEO_STYLES.some((s) => s.key === value);
}

/** Build the full image prompt for one scene. */
export function buildScenePrompt(
  scenePrompt: string,
  styleKey: string,
  format: string
): string {
  const style = getVideoStyle(styleKey);
  const frame =
    format === "short"
      ? "Vertical 9:16 frame composed for a phone screen; keep the important subject in the middle third so overlaid captions at the top and bottom do not cover it."
      : "Horizontal 16:9 frame composed for a video slide; keep the lower third visually calm so overlaid subtitles stay readable.";

  return [
    scenePrompt.trim(),
    style.fragment,
    frame,
    "Absolutely no text, no lettering, no captions, no watermarks, no logos, no signatures, and no readable writing of any kind anywhere in the image.",
    "No recognisable real people, no celebrities, no copyrighted characters, no brand names or trademarks. An entirely original image.",
  ].join(" ");
}
