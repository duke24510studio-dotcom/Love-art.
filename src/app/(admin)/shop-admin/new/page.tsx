"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { imageSrc } from "@/lib/shop";
import {
  Field,
  ProductFields,
  emptyProductForm,
  inputStyle,
  type ProductFormState,
} from "../ProductFields";
import { AssetPicker } from "../AssetPicker";

export default function NewShopProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);

  const set = (key: keyof ProductFormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price) || 0,
          sortOrder: Number(form.sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "作成に失敗しました");
      router.push(`/shop-admin/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
      setLoading(false);
    }
  };

  const coverPreview = imageSrc(form.coverImage);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div style={{ borderBottom: "1px solid #d8d0c0", paddingBottom: "1rem" }}>
        <p className="text-xs tracking-[0.4em] uppercase opacity-50 mb-1">New</p>
        <h1 className="text-2xl font-light tracking-widest" style={{ color: "#2d5a3d" }}>
          新規デジタル商品
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

          <p className="text-xs opacity-50 leading-relaxed">
            カバー画像を設定しない場合は、カテゴリごとのイラストが自動で表示されます。
            ギャラリー画像は保存後に追加できます。
          </p>
        </div>

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
            onClick={() => router.back()}
            className="px-6 py-2 text-xs tracking-widest uppercase border hover:opacity-70 transition-opacity"
            style={{ borderColor: "#d8d0c0" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
          >
            {loading ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
