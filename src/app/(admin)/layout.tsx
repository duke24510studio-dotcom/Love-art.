import Link from "next/link";

// Admin tool shell (dashboard, posters, articles, Rakuten review studio,
// multiview). Everything under this route group is protected by the Basic
// Auth middleware (see middleware.ts) — only /blog is meant to be public.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col flex-1">
      <header style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span style={{ color: "#f5f0e8" }} className="text-xl tracking-widest font-light">
              ◯
            </span>
            <div>
              <div className="text-sm tracking-[0.3em] font-light uppercase">Japandi Poster</div>
              <div className="text-xs tracking-[0.5em] opacity-70 uppercase">Auto Studio</div>
            </div>
          </Link>
          <nav className="flex items-center gap-6 text-sm tracking-widest">
            <Link href="/" className="hover:opacity-70 transition-opacity uppercase font-light">
              Dashboard
            </Link>
            <Link href="/posters" className="hover:opacity-70 transition-opacity uppercase font-light">
              Posters
            </Link>
            <Link href="/articles" className="hover:opacity-70 transition-opacity uppercase font-light">
              Articles
            </Link>
            <Link href="/products" className="hover:opacity-70 transition-opacity uppercase font-light">
              Rakuten Reviews
            </Link>
            <Link href="/youtube-multiview" className="hover:opacity-70 transition-opacity uppercase font-light">
              Multiview
            </Link>
            <Link href="/blog" className="hover:opacity-70 transition-opacity uppercase font-light">
              Public Blog ↗
            </Link>
            <Link
              href="/posters/new"
              style={{ backgroundColor: "#f5f0e8", color: "#2d5a3d" }}
              className="px-4 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity"
            >
              + New Theme
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">{children}</main>
      <footer
        style={{ borderTopColor: "#d8d0c0" }}
        className="border-t text-center py-6 text-xs tracking-widest opacity-40 uppercase"
      >
        Japandi Poster Auto Studio — Admin
      </footer>
    </div>
  );
}
