"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { VideoProject, VideoScene } from "@/generated/prisma/client";
import { assetUrl } from "@/lib/asset-url";

// Browser-side video encoder.
//
// Render's free plan has no ffmpeg and 512MB of RAM, so the video is assembled
// HERE: scene stills are drawn to a canvas with a slow Ken Burns move, captions
// are painted on top, the narration clips are scheduled on one AudioContext,
// and canvas.captureStream() + MediaRecorder mux the two into a WebM the user
// downloads and uploads to YouTube by hand.
//
// Consequences worth knowing:
// - Recording runs in REAL TIME. A 5-minute video takes 5 minutes.
// - requestAnimationFrame is throttled in background tabs, which would drop
//   frames, so the tab must stay visible while recording.

type ProjectWithScenes = VideoProject & { scenes: VideoScene[] };

type Frame = {
  scene: VideoScene;
  start: number;
  duration: number;
  image: HTMLImageElement | null;
  buffer: AudioBuffer | null;
};

const CROSSFADE = 0.6;
const FPS = 30;
const FONT_STACK =
  '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif';

const PALETTE = {
  cream: "#f5f0e8",
  green: "#2d5a3d",
  charcoal: "#2c2c2c",
};

function pickMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Break Japanese text into lines that fit `maxWidth` at the current font. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const char of text) {
    if (char === "\n") {
      lines.push(line);
      line = "";
      continue;
    }
    const next = line + char;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default function StudioClient({ project }: { project: ProjectWithScenes }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<Frame[]>([]);
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadNote, setLoadNote] = useState("素材を読み込んでいます...");
  const [recording, setRecording] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const [showCaptions, setShowCaptions] = useState(true);

  const vertical = project.format === "short";
  const width = vertical ? 1080 : 1920;
  const height = vertical ? 1920 : 1080;

  const totalDuration = useMemo(
    () =>
      project.scenes.reduce(
        (sum, s) => sum + (s.audioSeconds > 0 ? s.audioSeconds : s.seconds),
        0
      ),
    [project.scenes]
  );

  const missingImages = project.scenes.filter((s) => !s.imagePath).length;
  const missingAudio = project.scenes.filter((s) => !s.audioPath).length;

  /** Paint one frame of the timeline at time `t` (seconds). */
  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D, t: number) => {
      const frames = framesRef.current;
      ctx.fillStyle = PALETTE.cream;
      ctx.fillRect(0, 0, width, height);

      const index = frames.findIndex((f) => t >= f.start && t < f.start + f.duration);
      const current = index >= 0 ? frames[index] : frames[frames.length - 1];
      if (!current) return;

      const localTime = Math.max(0, t - current.start);
      const progress = Math.min(1, localTime / Math.max(0.001, current.duration));

      const drawStill = (frame: Frame, p: number, alpha: number) => {
        ctx.globalAlpha = alpha;
        if (frame.image) {
          // Slow zoom-in with a gentle drift, kept small so it reads as calm.
          const zoom = 1.04 + 0.07 * p;
          const base = Math.max(width / frame.image.width, height / frame.image.height);
          const scale = base * zoom;
          const dw = frame.image.width * scale;
          const dh = frame.image.height * scale;
          const drift = (p - 0.5) * 0.02;
          ctx.drawImage(
            frame.image,
            (width - dw) / 2 + dw * drift,
            (height - dh) / 2,
            dw,
            dh
          );
        } else {
          ctx.fillStyle = PALETTE.cream;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.globalAlpha = 1;
      };

      // Crossfade out of the previous still.
      const previous = index > 0 ? frames[index - 1] : null;
      if (previous && localTime < CROSSFADE) {
        drawStill(previous, 1, 1);
        drawStill(current, progress, localTime / CROSSFADE);
      } else {
        drawStill(current, progress, 1);
      }

      if (!showCaptions || !current.scene.onScreenText) return;

      // Caption block: scrim first so text stays readable over any image.
      const fontSize = Math.round(width * (vertical ? 0.058 : 0.038));
      ctx.font = `600 ${fontSize}px ${FONT_STACK}`;
      const maxTextWidth = width * 0.82;
      const lines = wrapText(ctx, current.scene.onScreenText, maxTextWidth);
      const lineHeight = fontSize * 1.45;
      const blockHeight = lines.length * lineHeight;
      const baseline = vertical ? height * 0.76 : height * 0.82;
      const scrimTop = baseline - blockHeight - fontSize * 1.1;

      const gradient = ctx.createLinearGradient(0, scrimTop, 0, height);
      gradient.addColorStop(0, "rgba(20,20,20,0)");
      gradient.addColorStop(0.45, "rgba(20,20,20,0.55)");
      gradient.addColorStop(1, "rgba(20,20,20,0.72)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scrimTop, width, height - scrimTop);

      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = PALETTE.cream;
      lines.forEach((line, i) => {
        ctx.fillText(line, width / 2, baseline - blockHeight + (i + 1) * lineHeight);
      });

      // Thin progress line along the bottom edge.
      ctx.fillStyle = "rgba(245,240,232,0.25)";
      ctx.fillRect(0, height - 6, width, 6);
      ctx.fillStyle = PALETTE.cream;
      ctx.fillRect(0, height - 6, width * Math.min(1, t / Math.max(0.001, totalDuration)), 6);
    },
    [height, showCaptions, totalDuration, vertical, width]
  );

  // --- Preload stills and narration -----------------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const frames: Frame[] = [];
        let cursor = 0;

        for (const scene of project.scenes) {
          setLoadNote(`素材を読み込み中 ${scene.index + 1}/${project.scenes.length}`);

          const image = scene.imagePath ? await loadImage(assetUrl(scene.imagePath)) : null;

          let buffer: AudioBuffer | null = null;
          if (scene.audioPath) {
            try {
              const res = await fetch(assetUrl(scene.audioPath));
              if (res.ok) {
                buffer = await ctx.decodeAudioData(await res.arrayBuffer());
              }
            } catch {
              buffer = null;
            }
          }

          const duration = buffer?.duration ?? (scene.audioSeconds > 0 ? scene.audioSeconds : scene.seconds);
          frames.push({ scene, start: cursor, duration, image, buffer });
          cursor += duration;
        }

        if (cancelled) return;
        framesRef.current = frames;
        setLoading(false);

        const canvas = canvasRef.current;
        const c2d = canvas?.getContext("2d");
        if (c2d) drawFrame(c2d, 0);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "素材の読み込みに失敗しました");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // drawFrame is intentionally not a dependency: reloading every asset when a
    // caption toggle changes would be wasteful, and the first paint is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.scenes]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      sourcesRef.current.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      });
      audioCtxRef.current?.close();
    };
  }, []);

  const stopEverything = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    sourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    });
    sourcesRef.current = [];
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
    setPreviewing(false);
  }, []);

  /**
   * Play the timeline. `record` also wires the canvas + audio into a
   * MediaRecorder and hands back a downloadable blob when it finishes.
   */
  const play = useCallback(
    async (record: boolean) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const audioCtx = audioCtxRef.current;
      if (!canvas || !ctx || !audioCtx) return;

      setError("");
      setDownloadUrl("");
      await audioCtx.resume();

      const startAt = audioCtx.currentTime + 0.35; // small lead-in so nothing clips
      sourcesRef.current = [];

      // Audio graph: every clip on one destination so the recorder gets a
      // single mixed track, plus the speakers for monitoring.
      const streamDest = audioCtx.createMediaStreamDestination();
      const monitorGain = audioCtx.createGain();
      monitorGain.gain.value = record ? 0.0001 : 1; // stay silent while recording
      monitorGain.connect(audioCtx.destination);

      for (const frame of framesRef.current) {
        if (!frame.buffer) continue;
        const source = audioCtx.createBufferSource();
        source.buffer = frame.buffer;
        source.connect(streamDest);
        source.connect(monitorGain);
        source.start(startAt + frame.start);
        sourcesRef.current.push(source);
      }

      let recorder: MediaRecorder | null = null;
      if (record) {
        const mimeType = pickMimeType();
        if (!mimeType) {
          setError("このブラウザは動画の書き出しに対応していません（Chrome / Edge を推奨）。");
          return;
        }
        const stream = canvas.captureStream(FPS);
        streamDest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));

        const chunks: BlobPart[] = [];
        recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: vertical ? 6_000_000 : 8_000_000,
        });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          setDownloadUrl(URL.createObjectURL(blob));
        };
        recorder.start(1000);
        recorderRef.current = recorder;
        setRecording(true);
      } else {
        setPreviewing(true);
      }

      const tick = () => {
        const t = audioCtx.currentTime - startAt;
        if (t >= totalDuration) {
          drawFrame(ctx, totalDuration);
          setElapsed(totalDuration);
          // Let the last frame and audio tail land before closing the file.
          setTimeout(() => stopEverything(), 400);
          return;
        }
        drawFrame(ctx, Math.max(0, t));
        setElapsed(Math.max(0, t));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [drawFrame, stopEverything, totalDuration, vertical]
  );

  /** Export a YouTube thumbnail: the thumbnail still with its text drawn on. */
  const exportThumbnail = useCallback(async () => {
    const source = project.thumbnailPath || project.scenes.find((s) => s.imagePath)?.imagePath;
    if (!source) {
      setError("サムネイル用の画像がありません。先に画像を生成してください。");
      return;
    }
    const image = await loadImage(assetUrl(source));
    if (!image) {
      setError("サムネイル画像の読み込みに失敗しました。");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = vertical ? 1080 : 1280;
    canvas.height = vertical ? 1920 : 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const base = Math.max(canvas.width / image.width, canvas.height / image.height);
    const dw = image.width * base;
    const dh = image.height * base;
    ctx.drawImage(image, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);

    const text = project.thumbnailText || project.title;
    if (text) {
      const fontSize = Math.round(canvas.width * 0.11);
      ctx.font = `700 ${fontSize}px ${FONT_STACK}`;
      const lines = wrapText(ctx, text, canvas.width * 0.84);
      const lineHeight = fontSize * 1.3;
      const blockHeight = lines.length * lineHeight;
      const top = (canvas.height - blockHeight) / 2;

      ctx.fillStyle = "rgba(20,20,20,0.42)";
      ctx.fillRect(0, top - fontSize * 0.5, canvas.width, blockHeight + fontSize);

      ctx.textAlign = "center";
      ctx.fillStyle = PALETTE.cream;
      ctx.lineWidth = fontSize * 0.14;
      ctx.strokeStyle = "rgba(20,20,20,0.65)";
      lines.forEach((line, i) => {
        const y = top + (i + 1) * lineHeight - fontSize * 0.25;
        ctx.strokeText(line, canvas.width / 2, y);
        ctx.fillText(line, canvas.width / 2, y);
      });
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `thumbnail-${project.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [project, vertical]);

  const minutes = Math.floor(totalDuration / 60);
  const seconds = Math.round(totalDuration % 60);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href={`/videos/${project.id}`}
          className="text-xs tracking-widest uppercase opacity-50 hover:opacity-80"
        >
          ← {project.title || "動画"}
        </Link>
        <h1 className="text-xl font-medium mt-3">書き出しスタジオ</h1>
        <p className="text-xs opacity-50 mt-2">
          {vertical ? "1080×1920 (9:16)" : "1920×1080 (16:9)"} · {project.scenes.length}シーン ·{" "}
          {minutes}分{seconds}秒
        </p>
      </div>

      {(missingImages > 0 || missingAudio > 0) && (
        <div
          className="text-xs p-3 border leading-relaxed"
          style={{ borderColor: "#c9a84c", backgroundColor: "#faf6ea" }}
        >
          {missingImages > 0 && <div>画像が未生成のシーンが {missingImages} 件あります。</div>}
          {missingAudio > 0 && (
            <div>
              ナレーション音声が未生成のシーンが {missingAudio} 件あります（無音のまま指定秒数で進みます）。
            </div>
          )}
        </div>
      )}

      <div
        className="border overflow-hidden mx-auto"
        style={{
          borderColor: "#d8d0c0",
          backgroundColor: PALETTE.charcoal,
          maxWidth: vertical ? 320 : "100%",
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-auto block"
        />
      </div>

      <div className="flex items-center gap-3 text-xs tracking-widest">
        <div className="flex-1 h-1" style={{ backgroundColor: "#d8d0c0" }}>
          <div
            className="h-full transition-[width] duration-100"
            style={{
              width: `${Math.min(100, (elapsed / Math.max(0.001, totalDuration)) * 100)}%`,
              backgroundColor: PALETTE.green,
            }}
          />
        </div>
        <span className="opacity-50 tabular-nums">
          {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, "0")} /{" "}
          {minutes}:{String(seconds).padStart(2, "0")}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={() => play(true)}
          disabled={loading || recording || previewing}
          className="px-6 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
        >
          {loading ? loadNote : recording ? "録画中..." : "動画を書き出す"}
        </button>

        <button
          onClick={() => play(false)}
          disabled={loading || recording || previewing}
          className="px-6 py-2 text-xs tracking-widest uppercase border hover:opacity-80 transition-opacity disabled:opacity-40"
          style={{ borderColor: "#2d5a3d", color: "#2d5a3d" }}
        >
          {previewing ? "再生中..." : "プレビュー再生"}
        </button>

        {(recording || previewing) && (
          <button
            onClick={stopEverything}
            className="px-6 py-2 text-xs tracking-widest uppercase border hover:opacity-80 transition-opacity"
            style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}
          >
            停止
          </button>
        )}

        <button
          onClick={exportThumbnail}
          disabled={loading}
          className="px-6 py-2 text-xs tracking-widest uppercase border hover:opacity-80 transition-opacity disabled:opacity-40"
          style={{ borderColor: "#d8d0c0" }}
        >
          サムネイルを保存
        </button>

        <label className="flex items-center gap-2 text-xs tracking-widest uppercase opacity-70 cursor-pointer">
          <input
            type="checkbox"
            checked={showCaptions}
            onChange={(e) => setShowCaptions(e.target.checked)}
            disabled={recording || previewing}
          />
          テロップを焼き込む
        </label>
      </div>

      {downloadUrl && (
        <a
          href={downloadUrl}
          download={`${project.format === "short" ? "short" : "video"}-${project.id}.webm`}
          className="inline-block px-6 py-3 text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#3a5a8b", color: "#f5f0e8" }}
        >
          ↓ 動画をダウンロード (.webm)
        </a>
      )}

      {error && (
        <div className="text-xs p-3 border" style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}>
          {error}
        </div>
      )}

      <div
        className="border p-4 text-xs leading-relaxed space-y-2 opacity-70"
        style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
      >
        <p className="tracking-[0.3em] uppercase opacity-60">書き出しについて</p>
        <p>
          書き出しは<strong>実時間</strong>で進みます。5分の動画には5分かかります。
          録画中はこのタブを前面に置いたままにしてください（バックグラウンドだと描画が間引かれ、コマ落ちします）。
        </p>
        <p>
          出力は WebM (VP9 + Opus) です。YouTubeはWebMをそのまま受け付けます。MP4が必要な場合は
          お手元の変換ソフトをお使いください。Chrome / Edge を推奨します。
        </p>
        <p>
          字幕ファイル(.srt)は動画詳細ページからダウンロードできます。YouTubeの字幕として
          アップロードすると、焼き込みテロップより読みやすくなります。
        </p>
      </div>
    </div>
  );
}
