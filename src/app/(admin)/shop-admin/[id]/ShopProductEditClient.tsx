"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { imageSrc } from "@/lib/shop";
import {
  Field,
  ProductFields,
  inputStyle,
  type ProductFormState,
} from "../ProductFields";
import { AssetPicker } from "../AssetPicker";

type GalleryImage = { id: string; imagePath: string; caption: string };

type EditableProduct = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  coverImage: string;
  checkoutUrl: string;
  fileFormat: string;
  includes: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  images: GalleryImage[];
};

export default function ShopProductEditClient({ product }: { product: EditableProduct }) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormState>({
    title: product.title,
    slug: product.slug,
    tagline: product.tagline,
    category: product.category,
    price: String(product.price),
    currency: product.currency,
    coverImage: product.coverImage,
    checkoutUrl: product.checkoutUrl,
    fileFormat: product.fileFormat,
    includes: product.includes,
    description: product.description,
    featured: product.featured,
    published: product.published,
    sortOrder: String(product.sortOrder),
  });
  const [images, setImages] = useState<GalleryImage[]>(product.images);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const set = (key: keyof ProductFormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/shop/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price) || 0,
          sortOrder: Number(form.sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
      setMessage("保存しました");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const attachImage = async (path: string) => {
    setError("");
    try {
      const res = await fetch(`/api/shop/${product.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePath: path }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "画像の追加に失敗しました");
      setImages((prev) => [...prev, { id: data.id, imagePath: data.imagePath, caption: data.caption }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像の追加に失敗しました");
    }
  };

  const detachImage = async (imageId: string) => {
    setError("");
    try {
      const res = await fetch(`/api/shop/${product.id}/images/${imageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("画像の削除に失敗しました");
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像の削除に失敗しました");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`「${product.title}」を削除します。よろしいですか？`)) return;
    setError("");
    try {
      const res = await fetch(`/api/shop/${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      router.push("/shop-admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const coverPreview = imageSrc(form.coverImage);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div
        className="flex items-end justify-between gap-4"
        style={{ borderBottom: "1px solid #d8d0c0", paddingBottom: "1rem" }}
      >
        <div className="min-w-0">
          <p className="text-xs tracking-[0.4em] uppercase opacity-50 mb-1">Edit</p>
          <h1 className="text-2xl font-light tracking-widest truncate" style={{ color: "#2d5a3d" }}>
            {product.title}
          </h1>
        </div>
        <Link
          href={`/shop/${product.slug}`}
          className="text-xs tracking-widest uppercase hover:opacity-70 transition-opacity shrink-0"
          style={{ color: "#2d5a3d" }}
        >
          公開ページを見る ↗
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div
          className="p-6 space-y-5 border"
          style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
        >
          <ProductFields form={form} set={set} />

          <Field label="カバー画像（生成済み画像のパス、または https のURL）">
            <input
              type="text"
              value={form.coverImage}
              onChange={(e) => set("coverImage", e.target.value)}
              placeholder="outputs/images/xxxx.png"
              style={inputStyle}
            />
          </Field>

          <AssetPicker onPick={(path) => set("coverImage", path)} />

          {coverPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverPreview}
              alt="カバー画像プレビュー"
              className="w-40 aspect-square object-cover border"
              style={{ borderColor: "#d8d0c0" }}
            />
          )}
        </div>

        {message && (
          <div
            className="px-4 py-3 text-sm border"
            style={{ backgroundColor: "#ede8dc", borderColor: "#2d5a3d", color: "#2d5a3d" }}
          >
            {message}
          </div>
        )}
        {error && (
          <div
            className="px-4 py-3 text-sm border"
            style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#8b3a3a" }}
          >
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleDelete}
            className="px-6 py-2 text-xs tracking-widest uppercase border hover:opacity-70 transition-opacity"
            style={{ borderColor: "#c9a5a0", color: "#8b3a3a" }}
          >
            削除
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>

      {/* --- gallery --- */}
      <section
        className="p-6 space-y-4 border"
        style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
      >
        <div>
          <h2 className="text-xs tracking-[0.3em] uppercase opacity-60">ギャラリー画像</h2>
          <p className="text-xs opacity-50 mt-1.5 leading-relaxed">
            カバー画像に続けて商品ページに表示されます。追加・削除は即時反映されます（保存ボタンは不要）。
          </p>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((img) => {
              const src = imageSrc(img.imagePath);
              return (
                <div key={img.id} className="space-y-1">
                  <div
                    className="border overflow-hidden"
                    style={{ borderColor: "#d8d0c0", backgroundColor: "#f5f0e8" }}
                  >
                    {src && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={img.caption} className="w-full aspect-square object-cover" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => detachImage(img.id)}
                    className="text-[10px] tracking-widest uppercase hover:opacity-60 transition-opacity"
                    style={{ color: "#8b3a3a" }}
                  >
                    削除
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <AssetPicker onPick={attachImage} buttonLabel="生成済み画像を追加する" />
      </section>
    </div>
  );
}
