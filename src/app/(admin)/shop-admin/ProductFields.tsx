"use client";

import { SHOP_CATEGORIES } from "@/lib/shop";

export type ProductFormState = {
  title: string;
  slug: string;
  tagline: string;
  category: string;
  price: string;
  currency: string;
  coverImage: string;
  checkoutUrl: string;
  fileFormat: string;
  includes: string;
  description: string;
  featured: boolean;
  published: boolean;
  sortOrder: string;
};

export const emptyProductForm: ProductFormState = {
  title: "",
  slug: "",
  tagline: "",
  category: SHOP_CATEGORIES[0].slug,
  price: "0",
  currency: "JPY",
  coverImage: "",
  checkoutUrl: "",
  fileFormat: "",
  includes: "",
  description: "",
  featured: false,
  published: true,
  sortOrder: "0",
};

export const inputStyle: React.CSSProperties = {
  backgroundColor: "#f5f0e8",
  borderColor: "#d8d0c0",
  color: "#2c2c2c",
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid #d8d0c0",
  outline: "none",
  fontSize: "0.875rem",
};

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs tracking-widest uppercase opacity-60">{label}</label>
      {children}
    </div>
  );
}

/**
 * The shared field set for creating and editing a shop listing. Gallery
 * images are managed separately (edit screen only) since they need a saved
 * product id to attach to.
 */
export function ProductFields({
  form,
  set,
}: {
  form: ProductFormState;
  set: (key: keyof ProductFormState, value: string | boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="商品名">
        <input
          type="text"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          required
          style={inputStyle}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="slug（空欄なら商品名から自動生成）">
          <input
            type="text"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="quiet-desk-notion-dashboard"
            style={inputStyle}
          />
        </Field>

        <Field label="カテゴリ">
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            style={inputStyle}
          >
            {SHOP_CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label} / {cat.labelJa}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="キャッチコピー（一覧・商品ページ上部に表示）">
        <input
          type="text"
          value={form.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          style={inputStyle}
        />
      </Field>

      <div className="grid sm:grid-cols-3 gap-5">
        <Field label="価格（0で Free 表示）">
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="通貨">
          <select
            value={form.currency}
            onChange={(e) => set("currency", e.target.value)}
            style={inputStyle}
          >
            <option value="JPY">JPY (¥)</option>
            <option value="USD">USD ($)</option>
          </select>
        </Field>

        <Field label="並び順（小さいほど上）">
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="購入リンク（Gumroad / BOOTH / Stripe など。未設定なら「Coming soon」表示）">
        <input
          type="url"
          value={form.checkoutUrl}
          onChange={(e) => set("checkoutUrl", e.target.value)}
          placeholder="https://..."
          style={inputStyle}
        />
      </Field>

      <Field label="ファイル形式（例: PNG + PDF, 300dpi）">
        <input
          type="text"
          value={form.fileFormat}
          onChange={(e) => set("fileFormat", e.target.value)}
          style={inputStyle}
        />
      </Field>

      <Field label="セット内容（1行1項目）">
        <textarea
          value={form.includes}
          onChange={(e) => set("includes", e.target.value)}
          rows={4}
          placeholder={"3 original prints\n300dpi print files\nSetup guide"}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>

      <Field label="商品説明（Markdown: ## 見出し / - 箇条書き / **太字** / --- 区切り線）">
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={12}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }}
        />
      </Field>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
          />
          公開する
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set("featured", e.target.checked)}
          />
          トップページの Featured に表示
        </label>
      </div>
    </div>
  );
}
