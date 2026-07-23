"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RakutenProduct, ReviewRound, ProductReview } from "@/generated/prisma/client";

type RoundWithReviews = ReviewRound & { reviews: ProductReview[] };
type ProductWithRounds = RakutenProduct & { rounds: RoundWithReviews[] };

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};
const PRODUCT_STATUS_COLORS: Record<string, string> = {
  active: "#2d5a3d",
  paused: "#c9a84c",
  archived: "#8a8a8a",
};

const ITEM_STATUS_LABELS: Record<string, string> = {
  generated: "Generated",
  review: "Review",
  approved: "Approved",
  rejected: "Rejected",
  exported: "Exported",
};
const ITEM_STATUS_COLORS: Record<string, string> = {
  generated: "#4a7c6f",
  review: "#c9a84c",
  approved: "#2d5a3d",
  rejected: "#8b3a3a",
  exported: "#3a5a8b",
};

function StatusBadge({
  status,
  labels,
  colors,
}: {
  status: string;
  labels: Record<string, string>;
  colors: Record<string, string>;
}) {
  return (
    <span
      className="text-xs px-3 py-1 tracking-widest uppercase shrink-0"
      style={{ backgroundColor: colors[status] ?? "#8a8a8a", color: "#f5f0e8" }}
    >
      {labels[status] ?? status}
    </span>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
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
  );
}

function ReviewCard({
  review,
  onUpdate,
}: {
  review: ProductReview;
  onUpdate: (id: string, status: string) => void;
}) {
  return (
    <div className="p-4 border space-y-2" style={{ backgroundColor: "#f5f0e8", borderColor: "#d8d0c0" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs tracking-widest uppercase opacity-50">{review.personaJa || review.persona}</div>
          <div className="text-xs opacity-40 mt-0.5">{review.angle}</div>
        </div>
        <StatusBadge status={review.status} labels={ITEM_STATUS_LABELS} colors={ITEM_STATUS_COLORS} />
      </div>
      <div className="text-sm font-medium">{review.title}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs opacity-50">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
        <CopyButton value={review.body} />
      </div>
      <pre
        className="text-xs whitespace-pre-wrap p-3 border leading-relaxed max-h-72 overflow-y-auto"
        style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0", fontFamily: "inherit" }}
      >
        {review.body}
      </pre>
      {review.snsCaption && (
        <div className="flex items-center justify-between">
          <span className="text-xs opacity-40 tracking-widest uppercase">SNS Caption</span>
          <CopyButton value={review.snsCaption} />
        </div>
      )}
      {review.snsCaption && (
        <p className="text-xs opacity-60 p-2 border" style={{ borderColor: "#d8d0c0" }}>
          {review.snsCaption}
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onUpdate(review.id, "approved")}
          disabled={review.status === "approved"}
          className="px-3 py-1 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-30"
          style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
        >
          ✓ Approve
        </button>
        <button
          onClick={() => onUpdate(review.id, "rejected")}
          disabled={review.status === "rejected"}
          className="px-3 py-1 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-30"
          style={{ backgroundColor: "#8b3a3a", color: "#f5f0e8" }}
        >
          ✕ Reject
        </button>
      </div>
    </div>
  );
}

export default function ProductDetailClient({ product }: { product: ProductWithRounds }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const withLoading = async (key: string, fn: () => Promise<Response>) => {
    setLoading(key);
    setError(null);
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error — check the dev server and try again.");
    } finally {
      setLoading(null);
    }
  };

  const generateRound = () =>
    withLoading("generate", () => fetch(`/api/products/${product.id}/generate`, { method: "POST" }));

  const setProductStatus = (status: string) =>
    withLoading(status, () =>
      fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
    );

  const setReviewStatus = (id: string, status: string) =>
    withLoading(`review-${id}`, () =>
      fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
    );

  const deleteProduct = async () => {
    if (!confirm(`「${product.name}」を削除しますか？この操作は取り消せません。`)) return;
    await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    router.push("/products");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between" style={{ borderBottom: "1px solid #d8d0c0", paddingBottom: "1rem" }}>
        <div>
          <Link href="/products" className="text-xs tracking-widest uppercase opacity-50 hover:opacity-70 transition-opacity block mb-2" style={{ color: "#2d5a3d" }}>
            ← Review Studio
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium leading-snug">{product.name}</h1>
            <StatusBadge status={product.status} labels={PRODUCT_STATUS_LABELS} colors={PRODUCT_STATUS_COLORS} />
          </div>
          <p className="text-xs opacity-40 tracking-widest uppercase mt-1">
            {product.shopName}
            {product.price > 0 ? ` · ¥${product.price.toLocaleString()}` : ""}
            {" · "}週 {product.weekCount} 回生成済み
          </p>
        </div>
        <button
          onClick={deleteProduct}
          className="text-xs tracking-widest uppercase opacity-30 hover:opacity-60 transition-opacity shrink-0"
          style={{ color: "#8b3a3a" }}
        >
          Delete
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {product.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover border" style={{ borderColor: "#d8d0c0" }} />
          )}
          <div className="p-5 border space-y-3" style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}>
            <p className="text-xs tracking-[0.3em] uppercase opacity-40">Product</p>
            {product.catchcopy && <p className="text-sm leading-relaxed">{product.catchcopy}</p>}
            {product.reviewCount > 0 && (
              <p className="text-xs opacity-60">
                楽天レビュー 平均{product.reviewAverage} / {product.reviewCount}件
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              <a
                href={product.affiliateUrl || product.itemUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="text-xs underline opacity-70 hover:opacity-100 break-all"
              >
                {product.affiliateUrl || product.itemUrl}
              </a>
              <CopyButton value={product.affiliateUrl || product.itemUrl} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 border space-y-4" style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}>
            <p className="text-xs tracking-[0.3em] uppercase opacity-40">Weekly Generation</p>
            <button
              onClick={generateRound}
              disabled={loading !== null}
              className="px-5 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
              style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
            >
              {loading === "generate" ? "生成中..." : `第${product.weekCount + 1}週のレビューを生成`}
            </button>
            <p className="text-xs opacity-50 leading-relaxed">
              5人の紹介キャラクターによるレビューとAIライフスタイル写真を1週分生成します。
              毎週の自動生成には <code className="opacity-80">/api/cron/rakuten-reviews</code> を使ってください。
            </p>
            <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: "1px solid #d8d0c0" }}>
              <button
                onClick={() => setProductStatus(product.status === "active" ? "paused" : "active")}
                disabled={loading !== null}
                className="px-4 py-2 text-xs tracking-widest uppercase border hover:opacity-80 transition-opacity disabled:opacity-30"
                style={{ borderColor: "#d8d0c0" }}
              >
                {product.status === "active" ? "一時停止" : "再開"}
              </button>
              {product.status !== "archived" && (
                <button
                  onClick={() => setProductStatus("archived")}
                  disabled={loading !== null}
                  className="px-4 py-2 text-xs tracking-widest uppercase border hover:opacity-80 transition-opacity disabled:opacity-30"
                  style={{ borderColor: "#d8d0c0" }}
                >
                  アーカイブ
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="text-xs p-3 border" style={{ borderColor: "#8b3a3a", color: "#8b3a3a" }}>
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xs tracking-[0.4em] uppercase opacity-50">Review Rounds ({product.rounds.length})</h2>
        {product.rounds.length === 0 ? (
          <div className="border p-10 text-center text-sm opacity-60" style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}>
            まだラウンドがありません。上のボタンから第1週のレビューを生成してください。
          </div>
        ) : (
          product.rounds.map((round) => (
            <div key={round.id} className="border p-5 space-y-4" style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm tracking-wide font-medium">第{round.weekNumber}週</span>
                  <StatusBadge status={round.status} labels={ITEM_STATUS_LABELS} colors={ITEM_STATUS_COLORS} />
                </div>
                <span className="text-xs opacity-40">{new Date(round.createdAt).toLocaleDateString()}</span>
              </div>
              {round.imagePath && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/outputs/images/${round.imagePath.split("/").pop()}`}
                  alt={`${product.name} week ${round.weekNumber}`}
                  className="w-full max-w-sm aspect-square object-cover border"
                  style={{ borderColor: "#d8d0c0" }}
                />
              )}
              <div className="grid md:grid-cols-2 gap-4">
                {round.reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} onUpdate={setReviewStatus} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs opacity-40 leading-relaxed">
        生成された内容には必ず「PR」表記とAI利用の開示が含まれます。承認したレビューは
        <code className="opacity-80 mx-1">POST /api/export/rakuten-csv</code>
        でエクスポートし、投稿は必ず人が確認してから手動で行ってください。
      </p>
    </div>
  );
}
