import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-10">
      <div style={{ borderBottom: "1px solid #d8d0c0", paddingBottom: "1rem" }}>
        <p className="text-xs tracking-[0.3em] uppercase opacity-50 mb-1">Articles</p>
        <h1 className="text-xl font-light tracking-wide" style={{ color: "#2d5a3d" }}>
          記事一覧
        </h1>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm opacity-50 text-center py-16">まだ記事がありません。</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block border p-6 transition-opacity hover:opacity-80"
              style={{ borderColor: "#d8d0c0", backgroundColor: "#ede8dc" }}
            >
              {post.category && (
                <span className="text-xs tracking-widest uppercase opacity-50">{post.category}</span>
              )}
              <h2 className="text-base font-medium mt-1 leading-snug">{post.title}</h2>
              {post.excerpt && <p className="text-sm opacity-60 mt-2 leading-relaxed">{post.excerpt}</p>}
              <div className="text-xs opacity-40 mt-3">
                {new Date(post.createdAt).toLocaleDateString("ja-JP")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
