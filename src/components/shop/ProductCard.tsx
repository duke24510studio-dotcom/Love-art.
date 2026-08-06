import Link from "next/link";
import { categoryLabel, formatPrice, imageSrc } from "@/lib/shop";
import { CategoryIllustration } from "./Illustrations";

export type ProductCardData = {
  slug: string;
  title: string;
  tagline: string;
  category: string;
  price: number;
  currency: string;
  coverImage: string;
};

/**
 * Storefront grid card. A product with no cover image falls back to its
 * category illustration rather than an empty box, so the shop looks
 * intentional from the very first item.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  const cover = imageSrc(product.coverImage);

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block border transition-all hover:-translate-y-0.5"
      style={{ borderColor: "#d8d0c0", backgroundColor: "#fdfbf7" }}
    >
      <div className="aspect-square overflow-hidden" style={{ backgroundColor: "#f5f0e8" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <CategoryIllustration
            category={product.category}
            className="w-full h-full transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>

      <div className="p-5">
        <p className="text-[10px] tracking-[0.25em] uppercase opacity-45">
          {categoryLabel(product.category)}
        </p>
        <h3 className="text-sm font-medium mt-1.5 leading-snug">{product.title}</h3>
        {product.tagline && (
          <p className="text-xs opacity-55 mt-1.5 leading-relaxed line-clamp-2">{product.tagline}</p>
        )}
        <p className="text-sm mt-3 tracking-wide" style={{ color: "#2d5a3d" }}>
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </Link>
  );
}
