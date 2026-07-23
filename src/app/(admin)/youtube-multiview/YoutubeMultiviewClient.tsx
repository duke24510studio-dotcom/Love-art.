"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Video = { id: string };

const STORAGE_KEY = "youtube-multiview:videos";
const COLUMN_PRESETS = [0, 1, 2, 3, 4, 6, 8] as const;

function extractVideoId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^m\./, "").replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  let candidate: string | null = null;
  if (host === "youtu.be") {
    candidate = parts[0] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      candidate = url.searchParams.get("v");
    } else if (["embed", "live", "shorts"].includes(parts[0])) {
      candidate = parts[1] ?? null;
    }
  }

  return candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
}

function idsToVideos(ids: string[]): Video[] {
  const seen = new Set<string>();
  const result: Video[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push({ id });
    }
  }
  return result;
}

export default function YoutubeMultiviewClient() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [columns, setColumns] = useState<number>(0);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const tileRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    // Deferred to a microtask callback (rather than called directly in the
    // effect body) to load one-time external state without a lint warning.
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("v");
      if (fromUrl) {
        setVideos(idsToVideos(fromUrl.split(",").map((s) => s.trim()).filter(Boolean)));
      } else {
        try {
          const stored = window.localStorage.getItem(STORAGE_KEY);
          if (stored) setVideos(idsToVideos(JSON.parse(stored)));
        } catch {
          // ignore malformed storage
        }
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(videos.map((v) => v.id)));

    const url = new URL(window.location.href);
    if (videos.length > 0) {
      url.searchParams.set("v", videos.map((v) => v.id).join(","));
    } else {
      url.searchParams.delete("v");
    }
    window.history.replaceState({}, "", url.toString());
  }, [videos, ready]);

  const addFromInput = useCallback(() => {
    const chunks = input.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    const newIds = chunks.map(extractVideoId).filter((id): id is string => Boolean(id));
    if (newIds.length === 0) return;

    setVideos((prev) => {
      const existing = new Set(prev.map((v) => v.id));
      const merged = [...prev];
      for (const id of newIds) {
        if (!existing.has(id)) {
          existing.add(id);
          merged.push({ id });
        }
      }
      return merged;
    });
    setInput("");
  }, [input]);

  const removeVideo = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    setFocusedId((cur) => (cur === id ? null : cur));
  }, []);

  const clearAll = useCallback(() => {
    setVideos([]);
    setFocusedId(null);
  }, []);

  const copyShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable, ignore
    }
  }, []);

  const requestTileFullscreen = useCallback((id: string) => {
    const el = tileRefs.current.get(id);
    el?.requestFullscreen?.();
  }, []);

  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: columns === 0 ? "repeat(auto-fit, minmax(280px, 1fr))" : `repeat(${columns}, 1fr)`,
    }),
    [columns]
  );

  return (
    <div className="space-y-6">
      <div className="pt-4 pb-2" style={{ borderBottom: "1px solid #d8d0c0" }}>
        <p className="text-xs tracking-[0.4em] uppercase opacity-50 mb-1">Watch Tool</p>
        <h1 className="text-3xl font-light tracking-widest" style={{ color: "#2d5a3d" }}>
          マ ル チ 視 聴
        </h1>
        <p className="text-sm opacity-60 mt-1 tracking-wide">
          YouTube Multiview — watch several YouTube videos or live streams side by side
        </p>
      </div>

      <div className="border p-5 space-y-4" style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}>
        <div className="space-y-2">
          <label className="text-xs tracking-widest uppercase opacity-50">Add YouTube links</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                addFromInput();
              }
            }}
            placeholder={"Paste one or more YouTube URLs (one per line), then Add.\nhttps://www.youtube.com/watch?v=...\nhttps://youtu.be/...\nhttps://www.youtube.com/live/..."}
            rows={3}
            className="w-full border px-3 py-2 text-sm bg-white/60 focus:outline-none"
            style={{ borderColor: "#d8d0c0" }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={addFromInput}
            className="px-4 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
          >
            + Add Video(s)
          </button>

          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs tracking-widest uppercase opacity-50">Layout</span>
            {COLUMN_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setColumns(c)}
                className="px-3 py-1.5 text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
                style={
                  columns === c
                    ? { backgroundColor: "#2d5a3d", color: "#f5f0e8" }
                    : { backgroundColor: "#f5f0e8", color: "#2c2c2c", border: "1px solid #d8d0c0" }
                }
              >
                {c === 0 ? "Auto" : c}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <span className="text-xs opacity-50 tracking-wide">{videos.length} video{videos.length === 1 ? "" : "s"}</span>

          <button
            onClick={copyShareLink}
            disabled={videos.length === 0}
            className="px-3 py-1.5 text-xs tracking-widest uppercase hover:opacity-70 transition-opacity disabled:opacity-30"
            style={{ color: "#2d5a3d", border: "1px solid #2d5a3d" }}
          >
            {copied ? "Copied!" : "Copy Share Link"}
          </button>

          <button
            onClick={clearAll}
            disabled={videos.length === 0}
            className="px-3 py-1.5 text-xs tracking-widest uppercase hover:opacity-70 transition-opacity disabled:opacity-30"
            style={{ color: "#8b3a3a", border: "1px solid #8b3a3a" }}
          >
            Clear All
          </button>
        </div>

        {focusedId && (
          <p className="text-xs opacity-50 tracking-wide">
            Audio focused on one tile — click <span className="opacity-80">Unfocus Audio</span> on it, or focus another tile, to change.
          </p>
        )}
      </div>

      {videos.length === 0 ? (
        <div
          className="border text-center py-16 px-6 text-sm opacity-50 tracking-wide"
          style={{ borderColor: "#d8d0c0" }}
        >
          No videos yet. Paste one or more YouTube links above to start watching in multiview.
        </div>
      ) : (
        <div className="grid gap-4" style={gridStyle}>
          {videos.map((video) => {
            const muted = focusedId ? focusedId !== video.id : true;
            const isFocused = focusedId === video.id;
            return (
              <div
                key={video.id}
                ref={(el) => {
                  if (el) tileRefs.current.set(video.id, el);
                  else tileRefs.current.delete(video.id);
                }}
                className="group relative bg-black overflow-hidden"
                style={{
                  aspectRatio: "16 / 9",
                  outline: isFocused ? "2px solid #2d5a3d" : "1px solid #d8d0c0",
                }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=${muted ? 1 : 0}&playsinline=1&rel=0`}
                  title={`YouTube video ${video.id}`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />

                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
                  <button
                    onClick={() => setFocusedId(isFocused ? null : video.id)}
                    className="pointer-events-auto px-2 py-1 text-[10px] tracking-widest uppercase hover:opacity-80"
                    style={{ backgroundColor: isFocused ? "#2d5a3d" : "rgba(245,240,232,0.9)", color: isFocused ? "#f5f0e8" : "#2c2c2c" }}
                  >
                    {isFocused ? "🔊 Unfocus Audio" : "🔇 Focus Audio"}
                  </button>
                  <div className="pointer-events-auto flex items-center gap-1">
                    <button
                      onClick={() => requestTileFullscreen(video.id)}
                      className="px-2 py-1 text-[10px] tracking-widest uppercase hover:opacity-80"
                      style={{ backgroundColor: "rgba(245,240,232,0.9)", color: "#2c2c2c" }}
                    >
                      ⛶
                    </button>
                    <button
                      onClick={() => removeVideo(video.id)}
                      className="px-2 py-1 text-[10px] tracking-widest uppercase hover:opacity-80"
                      style={{ backgroundColor: "rgba(139,58,58,0.9)", color: "#f5f0e8" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
