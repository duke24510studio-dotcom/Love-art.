import Link from "next/link";
import { prisma } from "@/lib/prisma";

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

export default async function ProductsPage() {
  const products = await prisma.rakutenProduct.findMany({
    orderBy: { createdAt: "desc" },
    include: { rounds: { orderBy: { weekNumber: "desc" }, take: 1 } },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between" style={{ borderBottom: "1px solid #d8d0c0", paddingBottom: "1rem" }}>
        <div>
          <p className="text-xs tracking-[0.4em] uppercase opacity-50 mb-1">Rakuten Affiliate</p>
          <h1 className="text-2xl tracking-[0.2em] font-light uppercase" style={{ color: "#2d5a3d" }}>
            Review Studio
          </h1>
          <p className="text-sm opacity-60 mt-2 max-w-xl">
            商品を1件ずつ登録し、5人の紹介キャラクターによる多面的なレビューを毎週コツコツ積み上げます。
            公開は人によるレビュー・承認後、手動で行ってください。
          </p>
        </div>
        <Link
          href="/products/new"
          className="px-5 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity shrink-0"
          style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
        >
          + 商品を追加
        </Link>
      </div>

      {products.length === 0 ? (
        <div
          className="text-center py-20 border"
          style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
        >
          <p className="text-sm opacity-40 tracking-widest mb-4">まだ商品が登録されていません</p>
          <Link href="/products/new" className="text-xs tracking-widest uppercase hover:opacity-70" style={{ color: "#2d5a3d" }}>
            楽天の商品URLを貼り付けて登録する →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const latestRound = product.rounds[0];
            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="border hover:opacity-90 transition-opacity block"
                style={{ backgroundColor: "#ede8dc", borderColor: "#d8d0c0" }}
              >
                <div className="w-full aspect-square flex items-center justify-center" style={{ backgroundColor: "#d8d0c0" }}>
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xs opacity-40 tracking-widest uppercase">No image</div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="text-sm tracking-wide font-medium line-clamp-2">{product.name || "(no name)"}</div>
                    <span
                      className="text-xs px-2 py-0.5 tracking-wider shrink-0"
                      style={{
                        backgroundColor: PRODUCT_STATUS_COLORS[product.status] ?? "#8a8a8a",
                        color: "#f5f0e8",
                      }}
                    >
                      {PRODUCT_STATUS_LABELS[product.status] ?? product.status}
                    </span>
                  </div>
                  <div className="text-xs opacity-60">
                    {product.shopName}
                    {product.price > 0 ? ` · ¥${product.price.toLocaleString()}` : ""}
                  </div>
                  <div
                    className="text-xs opacity-50 flex justify-between"
                    style={{ borderTop: "1px solid #d8d0c0", paddingTop: "0.5rem", marginTop: "0.5rem" }}
                  >
                    <span>週 {product.weekCount} 回生成済み</span>
                    {latestRound && <span>最新: 第{latestRound.weekNumber}週</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="text-xs tracking-widest opacity-40 text-right">
        {products.length} product{products.length !== 1 ? "s" : ""} total
      </div>
    </div>
  );
}
