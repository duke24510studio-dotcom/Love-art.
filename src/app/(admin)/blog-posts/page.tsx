import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminBlogListPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between" style={{ borderBottom: "1px solid #d8d0c0", paddingBottom: "1rem" }}>
        <div>
          <p className="text-xs tracking-[0.4em] uppercase opacity-50 mb-1">Public Blog CMS</p>
          <h1 className="text-2xl tracking-[0.2em] font-light uppercase" style={{ color: "#2d5a3d" }}>
            茶と暮らしの手帖 — 記事管理
          </h1>
          <p className="text-sm opacity-60 mt-2">
            ここで作成・公開した記事は、認証なしで <code className="opacity-80">/blog</code> に表示されます。
          </p>
        </div>
        <Link
          href="/blog-posts/new"
          className="px-5 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity shrink-0"
          style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
        >
          + 新規記事
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 border" style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}>
          <p className="text-sm opacity-40 tracking-widest">まだ記事がありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog-posts/${post.id}`}
              className="block border p-5 transition-opacity hover:opacity-80"
              style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{post.title}</div>
                  <div className="text-xs opacity-50 mt-1">
                    /blog/{post.slug}
                    {post.category ? ` · ${post.category}` : ""}
                    {" · "}
                    {new Date(post.createdAt).toLocaleDateString("ja-JP")}
                  </div>
                </div>
                <span
                  className="text-xs px-3 py-1 tracking-widest uppercase shrink-0"
                  style={{
                    backgroundColor: post.published ? "#2d5a3d" : "#8a8a8a",
                    color: "#f5f0e8",
                  }}
                >
                  {post.published ? "公開中" : "非公開"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
