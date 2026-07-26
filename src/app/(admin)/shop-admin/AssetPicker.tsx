"use client";

import { useEffect, useState } from "react";
import { imageSrc } from "@/lib/shop";

type ShopAsset = {
  path: string;
  label: string;
  kind: "poster" | "mockup";
  createdAt: string;
};

/**
 * Browse images already produced by the poster pipeline and pick one for a
 * listing — the bridge that lets generated assets be sold on /shop without
 * re-uploading anything. Loads lazily so the CMS pages stay light.
 */
export function AssetPicker({
  onPick,
  buttonLabel = "生成済み画像から選ぶ",
}: {
  onPick: (path: string) => void;
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<ShopAsset[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || assets !== null) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shop-assets");
        if (!res.ok) throw new Error("読み込みに失敗しました");
        const data = (await res.json()) as ShopAsset[];
        if (!cancelled) setAssets(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "読み込みに失敗しました");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, assets]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 text-xs tracking-widest uppercase border hover:opacity-70 transition-opacity"
        style={{ borderColor: "#d8d0c0" }}
      >
        {open ? "閉じる" : buttonLabel}
      </button>

      {open && (
        <div className="border p-4" style={{ borderColor: "#d8d0c0", backgroundColor: "#f5f0e8" }}>
          {error && <p className="text-xs" style={{ color: "#8b3a3a" }}>{error}</p>}
          {!error && assets === null && <p className="text-xs opacity-50">読み込み中...</p>}
          {assets !== null && assets.length === 0 && (
            <p className="text-xs opacity-50">
              まだ生成済みの画像がありません。/posters で生成すると、ここから選べるようになります。
            </p>
          )}
          {assets !== null && assets.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-h-80 overflow-y-auto">
              {assets.map((asset) => {
                const src = imageSrc(asset.path);
                if (!src) return null;
                return (
                  <button
                    key={asset.path}
                    type="button"
                    title={asset.label}
                    onClick={() => {
                      onPick(asset.path);
                      setOpen(false);
                    }}
                    className="border overflow-hidden hover:opacity-75 transition-opacity"
                    style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={asset.label} className="w-full aspect-square object-cover" />
                    <span className="block text-[10px] opacity-50 px-1 py-1 truncate">
                      {asset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
