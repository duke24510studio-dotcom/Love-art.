"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { VideoProject, VideoScene } from "@/generated/prisma/client";
import { assetUrl } from "@/lib/asset-url";
import { getVideoStyle } from "@/lib/video-style";

type ProjectWithScenes = VideoProject & {
  scenes: VideoScene[];
  article: { id: string; title: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  planned: "台本のみ",
  images: "画像あり",
  narrated: "音声あり",
  ready: "書き出し可",
  published: "投稿済み",
  rejected: "却下",
};

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.3em] uppercase opacity-50">{label}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-xs tracking-widest hover:opacity-60 transition-opacity"
          style={{ color: "#2d5a3d" }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre
        className="text-xs whitespace-pre-wrap p-3 border leading-relaxed max-h-80 overflow-y-auto"
        style={{ backgroundColor: "#f5f0e8", borderColor: "#d8d0c0", fontFamily: "inherit" }}
      >
        {value}
      </pre>
    </div>
  );
}

export default function VideoDetailClient({ project }: { project: ProjectWithScenes }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const scenes = project.scenes;
  const missingImages = scenes.filter((s) => !s.imagePath).length;
  const missingAudio = scenes.filter((s) => !s.audioPath).length;
  const totalSeconds = scenes.reduce(
    (sum, s) => sum + (s.audioSeconds > 0 ? s.audioSeconds : s.seconds),
    0
  );

  const post = async (path: string, body: Record<string, unknown>) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  };

  /**
   * Images are generated a few at a time so no single request runs past the
   * platform timeout; keep calling until nothing is missing.
   */
  const generateImages = async () => {
    setBusy("images");
    setError("");
    try {
      let remaining = missingImages;
      let guard = 0;
      while (remaining > 0 && guard < 12) {
        setProgress(`残り ${remaining} シーンの画像を生成中...`);
        const data = await post(`/api/videos/${project.id}/images`, { limit: 3 });
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          throw new Error(data.errors.join(" / "));
        }
        remaining = data.remaining ?? 0;
        guard += 1;
      }
      setProgress("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像生成に失敗しました");
      setProgress("");
    } finally {
      setBusy(null);
    }
  };

  const run = async (key: string, path: string, body: Record<string, unknown> = {}) => {
    setBusy(key);
    setError("");
    try {
      const data = await post(path, body);
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        throw new Error(data.errors.join(" / "));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "処理に失敗しました");
    } finally {
      setBusy(null);
    }
  };

  const setStatus = async (status: string) => {
    setBusy(status);
    setError("");
    try {
      const res = await fetch(`/api/videos/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "更新に失敗しました");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!confirm("この動画プロジェクトを削除しますか？")) return;
    setBusy("delete");
    await fetch(`/api/videos/${project.id}`, { method: "DELETE" });
    router.push("/videos");
  };

  const buttonStyle = {
    backgroundColor: "#2d5a3d",
    color: "#f5f0e8",
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <Link href="/videos" className="text-xs tracking-widest uppercase opacity-50 hover:opacity-80">
          ← YouTube Studio
        </Link>
        <div className="flex items-start justify-between gap-4 mt-3">
          <div className="min-w-0">
            <h1 className="text-xl font-medium leading-snug">{project.title || project.topic}</h1>
            <div className="text-xs opacity-40 mt-2 tracking-widest uppercase">
              {project.format === "short" ? "縦 9:16 / Shorts" : "横 16:9"} ·{" "}
              {getVideoStyle(project.visualStyle).labelJa} · {project.voice} · {scenes.length}シーン ·
              約{Math.floor(totalSeconds / 60)}分{Math.round(totalSeconds % 60)}秒
            </div>
            {project.article && (
              <div className="text-xs mt-2">
                <span className="opacity-40">元記事: </span>
                <Link href={`/articles/${project.article.id}`} className="underline opacity-70 hover:opacity-100">
                  {project.article.title}
                </Link>
              </div>
            )}
          </div>
          <span
            className="text-xs px-3 py-1 tracking-widest uppercase shrink-0"
            style={{ backgroundColor: "#4a7c6f", color: "#f5f0e8" }}
          >
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
        </div>
      </div>

      {/* --- Pipeline actions --- */}
      <div className="border p-5 space-y-4" style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}>
        <p className="text-xs tracking-[0.3em] uppercase opacity-40">制作ステップ</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={generateImages}
            disabled={busy !== null || missingImages === 0}
            className="px-5 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
            style={buttonStyle}
          >
            {busy === "images"
              ? "生成中..."
              : missingImages === 0
                ? "① 画像 完了"
                : `① シーン画像を生成 (残り${missingImages})`}
          </button>

          <button
            onClick={() => run("narration", `/api/videos/${project.id}/narration`)}
            disabled={busy !== null || missingAudio === 0}
            className="px-5 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
            style={buttonStyle}
          >
            {busy === "narration"
              ? "生成中..."
              : missingAudio === 0
                ? "② ナレーション 完了"
                : `② ナレーションを生成 (残り${missingAudio})`}
          </button>

          <button
            onClick={() => run("thumbnail", `/api/videos/${project.id}/images`, { target: "thumbnail" })}
            disabled={busy !== null || !project.thumbnailPrompt}
            className="px-5 py-2 text-xs tracking-widest uppercase border hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ borderColor: "#2d5a3d", color: "#2d5a3d" }}
          >
            {busy === "thumbnail" ? "生成中..." : "③ サムネイル背景を生成"}
          </button>

          <Link
            href={`/videos/${project.id}/studio`}
            className="px-5 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#3a5a8b", color: "#f5f0e8" }}
          >
            ④ 動画を書き出す →
          </Link>

          <a
            href={`/api/videos/${project.id}/srt`}
            className="px-5 py-2 text-xs tracking-widest uppercase border transition-opacity hover:opacity-80"
            style={{ borderColor: "#d8d0c0" }}
          >
            字幕 .srt
          </a>
        </div>

        {progress && <p className="text-xs opacity-60">{progress}</p>}
        <p className="text-xs opacity-40 leading-relaxed">
          画像とナレーションは1シーンずつ順番に生成します（無料プランのメモリ制限のため）。
          時間がかかるのでタブを閉じずにお待ちください。
        </p>
      </div>

      {error && (
        <div className="text-xs p-3 border" style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}>
          {error}
        </div>
      )}

      {/* --- YouTube metadata --- */}
      <div className="space-y-6">
        <CopyBlock label="タイトル" value={project.title} />
        <CopyBlock label="概要欄" value={project.description} />
        <CopyBlock label="チャプター" value={project.chapters} />
        <CopyBlock label="タグ" value={project.tags} />
        <CopyBlock label="サムネ文字" value={project.thumbnailText} />
      </div>

      {project.thumbnailPath && (
        <div className="space-y-2">
          <span className="text-xs tracking-[0.3em] uppercase opacity-50">サムネイル背景</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetUrl(project.thumbnailPath)}
            alt="thumbnail"
            className="border max-w-md w-full"
            style={{ borderColor: "#d8d0c0" }}
          />
          <p className="text-xs opacity-40">
            文字は入っていません。書き出し画面でサムネ画像（文字入り）も保存できます。
          </p>
        </div>
      )}

      {/* --- Scenes --- */}
      <div className="space-y-3">
        <p className="text-xs tracking-[0.3em] uppercase opacity-40">シーン ({scenes.length})</p>
        {scenes.map((scene) => (
          <div
            key={scene.id}
            className="border p-4 flex gap-4"
            style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
          >
            <div
              className="shrink-0 overflow-hidden relative"
              style={{
                width: project.format === "short" ? 60 : 106,
                height: project.format === "short" ? 106 : 60,
                backgroundColor: "#f5f0e8",
              }}
            >
              {scene.imagePath && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(scene.imagePath)} alt="" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-3 text-xs opacity-50 tracking-widest">
                <span>#{scene.index + 1}</span>
                {scene.heading && <span>{scene.heading}</span>}
                <span>
                  {(scene.audioSeconds > 0 ? scene.audioSeconds : scene.seconds).toFixed(1)}秒
                </span>
              </div>
              <p className="text-sm leading-relaxed">{scene.narration}</p>
              {scene.onScreenText && (
                <p className="text-xs opacity-60">画面テロップ: {scene.onScreenText}</p>
              )}
              {scene.audioPath && (
                <audio controls src={assetUrl(scene.audioPath)} className="h-8 w-full max-w-xs" />
              )}
              <div className="flex gap-3 text-xs">
                <button
                  onClick={() =>
                    run(`scene-img-${scene.id}`, `/api/videos/${project.id}/images`, {
                      sceneId: scene.id,
                    })
                  }
                  disabled={busy !== null}
                  className="tracking-widest uppercase hover:opacity-60 disabled:opacity-30"
                  style={{ color: "#2d5a3d" }}
                >
                  {busy === `scene-img-${scene.id}` ? "生成中..." : "画像を作り直す"}
                </button>
                <button
                  onClick={() =>
                    run(`scene-tts-${scene.id}`, `/api/videos/${project.id}/narration`, {
                      sceneId: scene.id,
                    })
                  }
                  disabled={busy !== null}
                  className="tracking-widest uppercase hover:opacity-60 disabled:opacity-30"
                  style={{ color: "#2d5a3d" }}
                >
                  {busy === `scene-tts-${scene.id}` ? "生成中..." : "音声を作り直す"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Review --- */}
      <div className="flex flex-wrap gap-3 pt-4 border-t" style={{ borderColor: "#d8d0c0" }}>
        {project.status !== "published" && (
          <button
            onClick={() => setStatus("published")}
            disabled={busy !== null}
            className="px-5 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "#3a5a8b", color: "#f5f0e8" }}
          >
            投稿済みにする
          </button>
        )}
        {project.status !== "rejected" && (
          <button
            onClick={() => setStatus("rejected")}
            disabled={busy !== null}
            className="px-5 py-2 text-xs tracking-widest uppercase border transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}
          >
            却下
          </button>
        )}
        <button
          onClick={remove}
          disabled={busy !== null}
          className="px-5 py-2 text-xs tracking-widest uppercase border transition-opacity hover:opacity-80 disabled:opacity-40 ml-auto"
          style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}
        >
          削除
        </button>
      </div>

      <p className="text-xs opacity-40 leading-relaxed">
        YouTubeへの自動投稿は実装していません。書き出した動画とサムネイル、概要欄を確認したうえで、
        ご自身でアップロードしてください。概要欄末尾のAI開示文は消さないでください。
      </p>
    </div>
  );
}
