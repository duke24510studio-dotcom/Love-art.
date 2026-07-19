"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { VideoProject, VideoScene } from "@/generated/prisma/client";

type ProjectWithScenes = VideoProject & { scenes: VideoScene[] };

const STATUS_LABELS: Record<string, string> = {
  idea: "Idea",
  scripted: "Scripted",
  voiced: "Voiced",
  visualized: "Visualized",
  assembled: "Assembled",
  review: "Review",
  approved: "Approved",
  exported: "Exported",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  idea: "#8a8a8a",
  scripted: "#7a9e7e",
  voiced: "#4a7c6f",
  visualized: "#4a7c6f",
  assembled: "#3a5a8b",
  review: "#c9a84c",
  approved: "#2d5a3d",
  exported: "#3a5a8b",
  rejected: "#8b3a3a",
};

// Map an outputs-relative asset path to the static serving route.
const assetUrl = (relPath: string) => `/api/videos/static/${relPath.replace(/^.*?videos\//, "")}`;

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
        className="text-xs whitespace-pre-wrap p-3 border leading-relaxed max-h-96 overflow-y-auto"
        style={{ backgroundColor: "#f5f0e8", borderColor: "#d8d0c0", fontFamily: "inherit" }}
      >
        {value}
      </pre>
    </div>
  );
}

export default function VideoDetailClient({ project }: { project: ProjectWithScenes }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const call = async (key: string, url: string, init?: RequestInit) => {
    setLoading(key);
    setError(null);
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(null);
    }
  };

  const post = (key: string, url: string, body?: Record<string, unknown>) =>
    call(key, url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });

  const setStatus = (status: string) =>
    call(status, `/api/videos/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

  const hasScript = project.scenes.length > 0;
  const hasAudio = hasScript && project.scenes.every((s) => s.audioPath);
  const hasVisuals = hasScript && project.scenes.every((s) => s.imagePath);
  const totalSec = project.scenes.reduce((sum, s) => sum + s.durationSec, 0);

  const steps: { key: string; label: string; done: boolean; enabled: boolean; url: string }[] = [
    {
      key: "script",
      label: hasScript ? "Regenerate Script" : "① Generate Script",
      done: hasScript,
      enabled: true,
      url: "/api/generate/video-script",
    },
    {
      key: "audio",
      label: "② Generate Narration",
      done: hasAudio,
      enabled: hasScript,
      url: "/api/generate/video-audio",
    },
    {
      key: "visuals",
      label: "③ Generate Visuals",
      done: hasVisuals,
      enabled: hasScript,
      url: "/api/generate/video-visuals",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Link href="/videos" className="text-xs tracking-widest uppercase opacity-50 hover:opacity-80">
          ← Videos
        </Link>
        <div className="flex items-start justify-between gap-4 mt-3">
          <div>
            <h1 className="text-xl font-medium leading-snug">{project.title || project.topic}</h1>
            <div className="text-xs opacity-40 mt-2 tracking-widest uppercase">
              {project.pillar} · ~{project.durationTargetMin} min target · voice: {project.voice}
              {hasScript ? ` · ${project.scenes.length} scenes` : ""}
              {totalSec > 0 ? ` · ${Math.round(totalSec / 60)} min ${Math.round(totalSec % 60)} s narration` : ""}
            </div>
          </div>
          <span
            className="text-xs px-3 py-1 tracking-widest uppercase shrink-0"
            style={{
              backgroundColor: STATUS_COLORS[project.status] ?? "#8a8a8a",
              color: "#f5f0e8",
            }}
          >
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
        </div>
      </div>

      <div className="border p-5 space-y-4" style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}>
        <p className="text-xs tracking-[0.3em] uppercase opacity-40">Generation Pipeline</p>
        <div className="flex flex-wrap gap-3">
          {steps.map((step) => (
            <button
              key={step.key}
              onClick={() => post(step.key, step.url, { projectId: project.id })}
              disabled={loading !== null || !step.enabled}
              className="px-5 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
              style={
                step.done
                  ? { border: "1px solid #2d5a3d", color: "#2d5a3d", backgroundColor: "transparent" }
                  : { backgroundColor: "#2d5a3d", color: "#f5f0e8" }
              }
            >
              {loading === step.key ? "Working... (may take minutes)" : step.label + (step.done ? " ✓" : "")}
            </button>
          ))}
          <button
            onClick={() => post("assemble", `/api/videos/${project.id}/assemble`)}
            disabled={loading !== null || !hasAudio || !hasVisuals}
            className="px-5 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
            style={
              project.videoPath
                ? { border: "1px solid #3a5a8b", color: "#3a5a8b", backgroundColor: "transparent" }
                : { backgroundColor: "#3a5a8b", color: "#f5f0e8" }
            }
          >
            {loading === "assemble" ? "Assembling..." : `④ Assemble MP4${project.videoPath ? " ✓" : ""}`}
          </button>
        </div>
        <p className="text-xs opacity-40 leading-relaxed">
          Regenerating the script resets scenes; narration and visuals must then be generated again.
          Assembly requires ffmpeg installed on this machine.
        </p>
      </div>

      {error && (
        <div className="text-xs p-3 border" style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}>
          {error}
        </div>
      )}

      {project.videoPath && (
        <div className="space-y-2">
          <p className="text-xs tracking-[0.3em] uppercase opacity-50">Assembled Video</p>
          <video controls className="w-full border" style={{ borderColor: "#d8d0c0", maxHeight: "420px" }}>
            <source src={assetUrl(project.videoPath)} type="video/mp4" />
          </video>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {project.status !== "approved" && project.status !== "exported" && (
          <button
            onClick={() => setStatus("approved")}
            disabled={loading !== null || !hasScript}
            className="px-5 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
          >
            {loading === "approved" ? "Saving..." : "Approve"}
          </button>
        )}
        {project.status !== "rejected" && (
          <button
            onClick={() => setStatus("rejected")}
            disabled={loading !== null}
            className="px-5 py-2 text-xs tracking-widest uppercase border transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}
          >
            {loading === "rejected" ? "Saving..." : "Reject"}
          </button>
        )}
        {hasScript && (
          <a
            href={`/api/videos/${project.id}/export`}
            onClick={(e) => {
              e.preventDefault();
              // POST download via a temporary form-less fetch is messy; use fetch + blob.
              (async () => {
                setLoading("export");
                setError(null);
                try {
                  const res = await fetch(`/api/videos/${project.id}/export`, { method: "POST" });
                  if (!res.ok) throw new Error(`Export failed (${res.status})`);
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `video-${project.id}.zip`;
                  a.click();
                  URL.revokeObjectURL(url);
                  router.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Export failed");
                } finally {
                  setLoading(null);
                }
              })();
            }}
            className="px-5 py-2 text-xs tracking-widest uppercase border transition-opacity hover:opacity-80"
            style={{ borderColor: "#2d5a3d", color: "#2d5a3d" }}
          >
            {loading === "export" ? "Packaging..." : "Download ZIP Package"}
          </a>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <CopyBlock label="YouTube Title" value={project.title} />
          <CopyBlock label="Description" value={project.description} />
          <CopyBlock label="Tags" value={project.tags} />
          <CopyBlock label="Thumbnail Text" value={project.thumbnailText} />
        </div>
        <div className="space-y-2">
          {project.thumbnailPath && (
            <>
              <p className="text-xs tracking-[0.3em] uppercase opacity-50">Thumbnail Background</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(project.thumbnailPath)}
                alt="Thumbnail background"
                className="w-full border"
                style={{ borderColor: "#d8d0c0" }}
              />
              <p className="text-xs opacity-40">
                Add the thumbnail text on top in Canva / CapCut before uploading.
              </p>
            </>
          )}
        </div>
      </div>

      {hasScript && (
        <div className="space-y-4">
          <p className="text-xs tracking-[0.3em] uppercase opacity-50">
            Scenes ({project.scenes.length})
          </p>
          {project.scenes.map((scene) => (
            <div
              key={scene.id}
              className="border p-4 grid md:grid-cols-[220px_1fr] gap-4"
              style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
            >
              <div className="space-y-2">
                {scene.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={assetUrl(scene.imagePath)}
                    alt={`Scene ${scene.order}`}
                    className="w-full border"
                    style={{ borderColor: "#d8d0c0" }}
                  />
                ) : (
                  <div
                    className="w-full aspect-video border flex items-center justify-center text-xs opacity-40"
                    style={{ borderColor: "#d8d0c0" }}
                  >
                    No image yet
                  </div>
                )}
                {scene.audioPath && (
                  <audio controls className="w-full" style={{ height: "32px" }}>
                    <source src={assetUrl(scene.audioPath)} type="audio/mpeg" />
                  </audio>
                )}
              </div>
              <div className="space-y-2 min-w-0">
                <div className="text-xs tracking-widest uppercase opacity-50">
                  Scene {scene.order}
                  {scene.heading ? ` — ${scene.heading}` : ""}
                  {scene.durationSec > 0 ? ` · ${Math.round(scene.durationSec)}s` : ""}
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{scene.narration}</p>
                <p className="text-xs opacity-40 leading-relaxed">Visual: {scene.visualPrompt}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs opacity-40 leading-relaxed">
        Uploading to YouTube is manual by design: review the script for factual accuracy, add BGM and
        transitions in your editor if you like, then upload the MP4 (or the ZIP assets) yourself. The
        description includes an AI-assistance disclosure — keep it.
      </p>
    </div>
  );
}
