import Link from "next/link";
import type { Metadata } from "next";
import { BLOG_SITE_NAME, BLOG_SITE_TAGLINE } from "@/lib/blog";

export const metadata: Metadata = {
  title: BLOG_SITE_NAME,
  description: BLOG_SITE_TAGLINE,
};

// Public blog shell — deliberately has no admin navigation or controls.
// This is the only part of the app meant to be open to the public internet
// without authentication (see middleware.ts).
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col flex-1">
      <header style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }} className="px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="inline-block hover:opacity-80 transition-opacity">
            <div className="text-xl tracking-[0.15em] font-light">{BLOG_SITE_NAME}</div>
            <div className="text-xs tracking-[0.2em] opacity-70 mt-1">{BLOG_SITE_TAGLINE}</div>
          </Link>
          <nav className="flex gap-5 text-xs tracking-widest mt-4 opacity-90">
            <Link href="/blog" className="hover:opacity-70 transition-opacity">
              記事一覧
            </Link>
            <Link href="/blog/about" className="hover:opacity-70 transition-opacity">
              このサイトについて
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">{children}</main>
      <footer
        style={{ borderTopColor: "#d8d0c0" }}
        className="border-t text-center py-6 text-xs tracking-widest opacity-40"
      >
        © {new Date().getFullYear()} {BLOG_SITE_NAME}
      </footer>
    </div>
  );
}
