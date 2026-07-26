import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  SHOP_DELIVERY_NOTE,
  SHOP_DELIVERY_NOTE_JA,
  SHOP_DISCLOSURE,
  SHOP_LICENSE_SUMMARY,
  SHOP_NAME,
  categoryLabel,
  formatPrice,
  imageSrc,
  parseIncludes,
} from "@/lib/shop";
import { renderSimpleMarkdown } from "@/lib/simple-markdown";
import { ProductGallery, type GalleryShot } from "@/components/shop/ProductGallery";
import { ProductCard } from "@/components/shop/ProductCard";

async function getProduct(slug: string) {
  return prisma.digitalProduct.findFirst({
    where: { slug, published: true },
    include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: SHOP_NAME };
  return {
    title: `${product.title} — ${SHOP_NAME}`,
    description: product.tagline,
  };
}

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = await prisma.digitalProduct.findMany({
    where: { published: true, category: product.category, NOT: { id: product.id } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 3,
  });

  const shots: GalleryShot[] = [
    ...(imageSrc(product.coverImage) ? [{ src: imageSrc(product.coverImage)!, caption: "" }] : []),
    ...product.images.flatMap((img) => {
      const src = imageSrc(img.imagePath);
      return src ? [{ src, caption: img.caption }] : [];
    }),
  ];

  const includes = parseIncludes(product.includes);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <nav className="text-[11px] tracking-widest uppercase opacity-45 mb-8">
        <Link href="/shop" className="hover:opacity-60 transition-opacity">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/shop?category=${product.category}#products`}
          className="hover:opacity-60 transition-opacity"
        >
          {categoryLabel(product.category)}
        </Link>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
        <ProductGallery shots={shots} category={product.category} title={product.title} />

        <div className="space-y-6 md:sticky md:top-24">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase opacity-45">
              {categoryLabel(product.category)}
            </p>
            <h1 className="text-2xl font-light leading-snug mt-2">{product.title}</h1>
            {product.tagline && (
              <p className="text-sm opacity-60 mt-3 leading-relaxed">{product.tagline}</p>
            )}
          </div>

          <p className="text-2xl font-light tracking-wide" style={{ color: "#2d5a3d" }}>
            {formatPrice(product.price, product.currency)}
          </p>

          {product.checkoutUrl ? (
            <a
              href={product.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center px-6 py-4 text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
            >
              Buy & download →
            </a>
          ) : (
            <div
              className="text-center px-6 py-4 text-xs tracking-[0.2em] uppercase border opacity-50"
              style={{ borderColor: "#d8d0c0" }}
            >
              Coming soon — 準備中
            </div>
          )}

          <p className="text-[11px] opacity-45 leading-relaxed">
            {SHOP_DELIVERY_NOTE}
            <br />
            {SHOP_DELIVERY_NOTE_JA}
          </p>

          {(includes.length > 0 || product.fileFormat) && (
            <div className="border p-5 space-y-3" style={{ borderColor: "#e6dfd0", backgroundColor: "#f5f0e8" }}>
              <p className="text-[10px] tracking-[0.25em] uppercase opacity-45">What&apos;s included</p>
              {includes.length > 0 && (
                <ul className="space-y-1.5 text-sm">
                  {includes.map((item, i) => (
                    <li key={i} className="flex gap-2.5 leading-relaxed">
                      <span style={{ color: "#7a9e7e" }}>—</span>
                      <span className="opacity-75">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {product.fileFormat && (
                <p className="text-xs opacity-50 pt-1">
                  <span className="tracking-widest uppercase opacity-70">Format:</span>{" "}
                  {product.fileFormat}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {product.description && (
        <div className="max-w-2xl mt-16 text-sm" style={{ color: "#2c2c2c" }}>
          {renderSimpleMarkdown(product.description)}
        </div>
      )}

      <div className="max-w-2xl mt-14 border-t pt-8 space-y-3" style={{ borderColor: "#e6dfd0" }} id="licence">
        <p className="text-[10px] tracking-[0.25em] uppercase opacity-45">Licence</p>
        <ul className="space-y-1.5 text-xs opacity-60">
          {SHOP_LICENSE_SUMMARY.map((line, i) => (
            <li key={i} className="flex gap-2.5 leading-relaxed">
              <span style={{ color: "#7a9e7e" }}>—</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] opacity-40 leading-relaxed pt-3">{SHOP_DISCLOSURE}</p>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-[10px] tracking-[0.35em] uppercase opacity-45">More like this</h2>
            <span className="flex-1 h-px" style={{ backgroundColor: "#e6dfd0" }} />
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
