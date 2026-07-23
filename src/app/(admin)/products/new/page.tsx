"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Preview = {
  itemUrl: string;
  name: string;
  shopName: string;
  price: number;
  imageUrl: string;
  catchcopy: string;
  reviewAverage: number;
  reviewCount: number;
  affiliateUrl: string;
};

const inputStyle = {
  backgroundColor: "#f5f0e8",
  borderColor: "#d8d0c0",
  color: "#2c2c2c",
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid #d8d0c0",
  outline: "none",
  fontSize: "0.875rem",
};

export default function NewProductPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState<"preview" | "save" | null>(null);
  const [error, setError] = useState("");

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("preview");
    setError("");
    setPreview(null);
    try {
      const res = await fetch("/api/rakuten/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "取得に失敗しました");
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました");
    } finally {
      setLoading(null);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setLoading("save");
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemUrl: preview.itemUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "登録に失敗しました");
      router.push(`/products/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
      setLoading(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div style={{ borderBottom: "1px solid #d8d0c0", paddingBottom: "1rem" }}>
        <p className="text-xs tracking-[0.4em] uppercase opacity-50 mb-1">New</p>
        <h1 className="text-2xl font-light tracking-widest" style={{ color: "#2d5a3d" }}>
          楽天商品を登録
        </h1>
        <p className="text-sm opacity-60 mt-2">
          楽天市場の商品ページURL（item.rakuten.co.jp）を貼り付けてください。1商品ずつ登録し、
          毎週5人の紹介キャラクターによるレビューを積み上げていきます。
        </p>
      </div>

      <form onSubmit={handlePreview} className="space-y-4">
        <div className="p-6 space-y-4 border" style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}>
          <label className="block text-xs tracking-widest uppercase opacity-60">商品URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://item.rakuten.co.jp/shop-code/item-code/"
            required
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading !== null || !url}
            className="px-5 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#4a7c6f", color: "#f5f0e8" }}
          >
            {loading === "preview" ? "取得中..." : "商品情報を取得"}
          </button>
        </div>
      </form>

      {error && (
        <div className="px-4 py-3 text-sm border" style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#8b3a3a" }}>
          {error}
        </div>
      )}

      {preview && (
        <div className="p-6 space-y-4 border" style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}>
          <p className="text-xs tracking-[0.3em] uppercase opacity-40">プレビュー</p>
          <div className="flex gap-4">
            {preview.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.imageUrl}
                alt={preview.name}
                className="w-24 h-24 object-cover border"
                style={{ borderColor: "#d8d0c0" }}
              />
            )}
            <div className="min-w-0 space-y-1">
              <div className="text-sm font-medium">{preview.name}</div>
              <div className="text-xs opacity-60">
                {preview.shopName} · ¥{preview.price.toLocaleString()}
              </div>
              {preview.reviewCount > 0 && (
                <div className="text-xs opacity-60">
                  楽天レビュー 平均{preview.reviewAverage} / {preview.reviewCount}件
                </div>
              )}
              {preview.catchcopy && <div className="text-xs opacity-50">{preview.catchcopy}</div>}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={loading !== null}
            className="px-6 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
          >
            {loading === "save" ? "登録中..." : "この商品を登録する"}
          </button>
        </div>
      )}

      <p className="text-xs opacity-40 leading-relaxed">
        商品情報の取得には楽天ウェブサービスAPI（<code className="opacity-80">RAKUTEN_APP_ID</code>）が必要です。
        アフィリエイトリンクを発行するには <code className="opacity-80">RAKUTEN_AFFILIATE_ID</code> も設定してください。
      </p>
    </div>
  );
}
