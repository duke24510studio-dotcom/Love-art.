import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  SHOP_CATEGORIES,
  SHOP_DISCLOSURE,
  SHOP_NAME,
  SHOP_TAGLINE_JA,
  categoryBySlug,
} from "@/lib/shop";
import { DeskIllustration, LeafDivider } from "@/components/shop/Illustrations";
import { ProductCard } from "@/components/shop/ProductCard";

export default async function ShopIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = category && categoryBySlug(category) ? category : "";

  const [products, featured] = await Promise.all([
    prisma.digitalProduct.findMany({
      where: { published: true, ...(activeCategory ? { category: activeCategory } : {}) },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.digitalProduct.findMany({
      where: { published: true, featured: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 2,
    }),
  ]);

  const activeLabel = activeCategory ? categoryBySlug(activeCategory) : undefined;

  return (
    <div>
      {/* --- hero --- */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-14 md:pt-24 md:pb-20">
        <div className="grid md:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase opacity-45 mb-5">
              Digital goods studio
            </p>
            <h1 className="text-3xl md:text-[2.6rem] leading-[1.25] font-light tracking-tight">
              Templates, art and
              <br />
              illustration with
              <br />
              <span style={{ color: "#2d5a3d" }}>room to breathe.</span>
            </h1>
            <p className="text-sm opacity-60 mt-6 leading-relaxed max-w-md">
              {SHOP_TAGLINE_JA}
              <br />
              Notionテンプレート、デジタルアート、イラスト素材を制作・販売しています。すべてダウンロード商品です。
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="#products"
                className="px-6 py-3 text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
              >
                Browse products
              </Link>
              <Link
                href="/shop/about"
                className="px-6 py-3 text-xs tracking-[0.2em] uppercase border transition-opacity hover:opacity-60"
                style={{ borderColor: "#d8d0c0" }}
              >
                About the studio
              </Link>
            </div>
          </div>

          <DeskIllustration className="w-full max-w-sm mx-auto" />
        </div>
      </section>

      {/* --- featured --- */}
      {featured.length > 0 && !activeCategory && (
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-[10px] tracking-[0.35em] uppercase opacity-45">Featured</h2>
            <span className="flex-1 h-px" style={{ backgroundColor: "#e6dfd0" }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* --- category strip --- */}
      <section
        className="border-y"
        style={{ borderColor: "#e6dfd0", backgroundColor: "#f5f0e8" }}
        id="products"
      >
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SHOP_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}#products`}
                className="group"
                aria-current={activeCategory === cat.slug ? "true" : undefined}
              >
                <p
                  className="text-xs tracking-[0.18em] uppercase transition-opacity group-hover:opacity-60"
                  style={{ color: activeCategory === cat.slug ? "#2d5a3d" : undefined }}
                >
                  {cat.label}
                </p>
                <p className="text-[11px] opacity-45 mt-1.5 leading-relaxed">{cat.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- catalogue --- */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
          <div>
            <h2 className="text-lg font-light tracking-wide">
              {activeLabel ? activeLabel.label : "All products"}
            </h2>
            <p className="text-xs opacity-45 mt-1">
              {activeLabel ? activeLabel.labelJa : "すべての商品"} · {products.length}
            </p>
          </div>
          {activeCategory && (
            <Link
              href="/shop#products"
              className="text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
              style={{ color: "#2d5a3d" }}
            >
              ← All products
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          <div
            className="text-center py-24 border"
            style={{ borderColor: "#e6dfd0", backgroundColor: "#f5f0e8" }}
          >
            <p className="text-sm opacity-40 tracking-widest">準備中です — coming soon</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* --- disclosure --- */}
      <section className="max-w-2xl mx-auto px-6 pb-4 text-center">
        <LeafDivider className="w-28 mx-auto mb-6" />
        <p className="text-[11px] opacity-40 leading-relaxed">{SHOP_DISCLOSURE}</p>
        <p className="text-[11px] opacity-35 mt-3 tracking-widest uppercase">{SHOP_NAME}</p>
      </section>
    </div>
  );
}
