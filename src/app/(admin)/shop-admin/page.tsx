import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SHOP_NAME, categoryLabel, formatPrice, imageSrc } from "@/lib/shop";

export default async function ShopAdminListPage() {
  const products = await prisma.digitalProduct.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { images: true } } },
  });

  return (
    <div className="space-y-8">
      <div
        className="flex items-end justify-between gap-4"
        style={{ borderBottom: "1px solid #d8d0c0", paddingBottom: "1rem" }}
      >
        <div>
          <p className="text-xs tracking-[0.4em] uppercase opacity-50 mb-1">Shop CMS</p>
          <h1 className="text-2xl tracking-[0.2em] font-light uppercase" style={{ color: "#2d5a3d" }}>
            {SHOP_NAME} — 商品管理
          </h1>
          <p className="text-sm opacity-60 mt-2">
            ここで公開した商品は、認証なしで <code className="opacity-80">/shop</code> に表示されます。
            決済はこのアプリでは行わず、各商品の購入リンク（Gumroad / BOOTH / Stripe
            など）に遷移します。
          </p>
        </div>
        <Link
          href="/shop-admin/new"
          className="px-5 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity shrink-0"
          style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
        >
          + 新規商品
        </Link>
      </div>

      {products.length === 0 ? (
        <div
          className="text-center py-20 border"
          style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
        >
          <p className="text-sm opacity-40 tracking-widest">まだ商品がありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const cover = imageSrc(product.coverImage);
            return (
              <Link
                key={product.id}
                href={`/shop-admin/${product.id}`}
                className="flex items-center gap-4 border p-4 transition-opacity hover:opacity-80"
                style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
              >
                <div
                  className="w-16 h-16 shrink-0 overflow-hidden border"
                  style={{ borderColor: "#d8d0c0", backgroundColor: "#f5f0e8" }}
                >
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] opacity-30">
                      no img
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{product.title}</div>
                  <div className="text-xs opacity-50 mt-1 truncate">
                    /shop/{product.slug} · {categoryLabel(product.category)} ·{" "}
                    {formatPrice(product.price, product.currency)}
                    {product._count.images > 0 ? ` · 画像${product._count.images + (cover ? 1 : 0)}枚` : ""}
                    {!product.checkoutUrl ? " · 購入リンク未設定" : ""}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {product.featured && (
                    <span
                      className="text-xs px-2.5 py-1 tracking-widest uppercase border"
                      style={{ borderColor: "#2d5a3d", color: "#2d5a3d" }}
                    >
                      Featured
                    </span>
                  )}
                  <span
                    className="text-xs px-3 py-1 tracking-widest uppercase"
                    style={{
                      backgroundColor: product.published ? "#2d5a3d" : "#8a8a8a",
                      color: "#f5f0e8",
                    }}
                  >
                    {product.published ? "公開中" : "非公開"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
