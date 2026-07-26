import type { VideoScene } from "@/generated/prisma/client";

// Pure video constants and timing helpers — no Prisma, no OpenAI, no Node
// built-ins, so client components can import this directly. The generation
// logic that needs a database or the API lives in src/lib/video.ts.

export const VIDEO_FORMATS = ["long", "short"] as const;
export type VideoFormat = (typeof VIDEO_FORMATS)[number];

export function isVideoFormat(value: unknown): value is VideoFormat {
  return value === "long" || value === "short";
}

export const VIDEO_STATUSES = [
  "planned",
  "images",
  "narrated",
  "ready",
  "published",
  "rejected",
] as const;

/** OpenAI TTS voices usable for narration. */
export const VIDEO_VOICES = [
  { id: "alloy", labelJa: "alloy（中性・落ち着き）" },
  { id: "ash", labelJa: "ash（低め・やわらかい）" },
  { id: "coral", labelJa: "coral（明るめ・やわらかい）" },
  { id: "echo", labelJa: "echo（穏やか・低め）" },
  { id: "nova", labelJa: "nova（明るい・軽やか）" },
  { id: "sage", labelJa: "sage（落ち着いた語り）" },
  { id: "shimmer", labelJa: "shimmer（やわらかい高め）" },
] as const;

export const VIDEO_DISCLOSURE_JA =
  "この動画はAIツールの支援を受けて制作し、投稿者が内容を確認・編集のうえ公開しています。";

/** Rough spoken length of Japanese narration: TTS reads ~6.5 chars/second. */
export function estimateSeconds(text: string): number {
  return Math.max(2, Math.round(text.trim().length / 6.5));
}

/** Actual duration of a scene: measured audio if narrated, else the estimate. */
export function sceneDuration(scene: { audioSeconds: number; seconds: number }): number {
  return scene.audioSeconds > 0 ? scene.audioSeconds : scene.seconds;
}

function formatTimestamp(totalSeconds: number): string {
  const whole = Math.floor(totalSeconds);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return h > 0
    ? `${h}:${mm}:${String(s).padStart(2, "0")}`
    : `${mm}:${String(s).padStart(2, "0")}`;
}

/**
 * YouTube chapter list. YouTube requires the first chapter at 0:00 and at least
 * three chapters, each 10s or longer — short scenes are merged to satisfy that.
 */
export function buildChapters(
  scenes: { heading: string; audioSeconds?: number; seconds: number }[]
): string {
  const lines: string[] = [];
  let elapsed = 0;
  let lastStart = -Infinity;

  for (const scene of scenes) {
    const duration = sceneDuration({
      audioSeconds: scene.audioSeconds ?? 0,
      seconds: scene.seconds,
    });
    const isFirst = lines.length === 0;
    if (isFirst || elapsed - lastStart >= 10) {
      lines.push(`${formatTimestamp(isFirst ? 0 : elapsed)} ${scene.heading || "チャプター"}`);
      lastStart = isFirst ? 0 : elapsed;
    }
    elapsed += duration;
  }

  return lines.length >= 3 ? lines.join("\n") : "";
}

function srtTimestamp(totalSeconds: number): string {
  const ms = Math.round((totalSeconds % 1) * 1000);
  const whole = Math.floor(totalSeconds);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(
    2,
    "0"
  )},${String(ms).padStart(3, "0")}`;
}

const CLOSING_PUNCTUATION = "、。！？」』）";

/** Break a narration line into caption-sized rows at Japanese phrase breaks. */
function wrapCaption(text: string, maxChars = 22): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const chars = [...clean];
  const rows: string[] = [];
  let row = "";

  chars.forEach((char, i) => {
    row += char;
    const atBreak = CLOSING_PUNCTUATION.includes(char);
    // Never break right before closing punctuation — a lone "。" on the next
    // row is the classic ugly subtitle. Let the row run one character long.
    const nextIsClosing = CLOSING_PUNCTUATION.includes(chars[i + 1] ?? "");
    if ((row.length >= maxChars && !nextIsClosing) || (atBreak && row.length >= maxChars - 6)) {
      rows.push(row);
      row = "";
    }
  });
  if (row) rows.push(row);

  // A 2-3 character remainder ("た。") reads as a mistake — fold it back into
  // the row above and let that one run long instead.
  for (let i = rows.length - 1; i > 0; i--) {
    if (rows[i].length < 4) {
      rows[i - 1] += rows[i];
      rows.splice(i, 1);
    }
  }
  return rows.join("\n");
}

/** SRT caption file built from the narration, timed by each scene's duration. */
export function buildSrt(scenes: VideoScene[]): string {
  const blocks: string[] = [];
  let elapsed = 0;

  scenes.forEach((scene, i) => {
    const duration = sceneDuration(scene);
    const start = elapsed;
    const end = elapsed + duration;
    elapsed = end;
    blocks.push(
      `${i + 1}\n${srtTimestamp(start)} --> ${srtTimestamp(end)}\n${wrapCaption(scene.narration)}\n`
    );
  });

  return blocks.join("\n");
}

/** Total runtime of a project, in seconds. */
export function totalDuration(scenes: { audioSeconds: number; seconds: number }[]): number {
  return scenes.reduce((sum, s) => sum + sceneDuration(s), 0);
}
