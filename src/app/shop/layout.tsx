import Link from "next/link";
import type { Metadata } from "next";
import { SHOP_NAME, SHOP_NAME_JA, SHOP_TAGLINE } from "@/lib/shop";
import { StudioMark } from "@/components/shop/Illustrations";

export const metadata: Metadata = {
  title: `${SHOP_NAME} — Digital goods studio`,
  description: SHOP_TAGLINE,
};

// Public storefront shell. Like /blog, this route group is deliberately free
// of admin navigation and controls — it is reachable without credentials
// (see src/proxy.ts), so nothing here may trigger a paid API call or a write.
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col flex-1" style={{ backgroundColor: "#fdfbf7" }}>
      <header
        className="sticky top-0 z-10 border-b backdrop-blur"
        style={{ borderColor: "#e6dfd0", backgroundColor: "rgba(253,251,247,0.9)" }}
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/shop"
            className="flex items-center gap-2.5 hover:opacity-70 transition-opacity shrink-0"
          >
            <StudioMark className="w-5 h-5 shrink-0" style={{ color: "#2d5a3d" }} />
            <span className="flex items-baseline gap-2 whitespace-nowrap">
              <span
                className="text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.28em] uppercase"
                style={{ color: "#2d5a3d" }}
              >
                {SHOP_NAME}
              </span>
              <span className="hidden sm:inline text-xs opacity-40 tracking-widest">
                {SHOP_NAME_JA}
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs tracking-[0.18em] uppercase whitespace-nowrap">
            <Link href="/shop" className="hover:opacity-60 transition-opacity">
              Shop
            </Link>
            <Link href="/shop/about" className="hover:opacity-60 transition-opacity">
              About
            </Link>
            <Link href="/blog" className="hover:opacity-60 transition-opacity opacity-70">
              Journal
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>

      <footer className="border-t mt-24" style={{ borderColor: "#e6dfd0" }}>
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-wrap gap-8 justify-between text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <StudioMark className="w-4 h-4" style={{ color: "#2d5a3d" }} />
              <span className="tracking-[0.28em] uppercase" style={{ color: "#2d5a3d" }}>
                {SHOP_NAME}
              </span>
            </div>
            <p className="opacity-45 leading-relaxed max-w-xs">{SHOP_TAGLINE}</p>
          </div>

          <nav className="flex flex-col gap-2 tracking-widest uppercase opacity-60">
            <Link href="/shop" className="hover:opacity-60 transition-opacity">
              All products
            </Link>
            <Link href="/shop/about" className="hover:opacity-60 transition-opacity">
              About the studio
            </Link>
            <Link href="/shop/about#licence" className="hover:opacity-60 transition-opacity">
              Licence
            </Link>
            <Link href="/blog" className="hover:opacity-60 transition-opacity">
              Journal
            </Link>
          </nav>
        </div>
        <div
          className="border-t py-5 text-center text-[10px] tracking-[0.25em] uppercase opacity-35"
          style={{ borderColor: "#e6dfd0" }}
        >
          © {new Date().getFullYear()} {SHOP_NAME}
        </div>
      </footer>
    </div>
  );
}
