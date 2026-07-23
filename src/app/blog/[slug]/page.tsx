import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { renderSimpleMarkdown } from "@/lib/simple-markdown";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });

  if (!post || !post.published) notFound();

  return (
    <article className="space-y-6">
      <Link href="/blog" className="text-xs tracking-widest uppercase opacity-50 hover:opacity-80 transition-opacity">
        ← 記事一覧
      </Link>
      <div>
        {post.category && (
          <span className="text-xs tracking-widest uppercase opacity-50">{post.category}</span>
        )}
        <h1 className="text-2xl font-medium leading-snug mt-2" style={{ color: "#2d5a3d" }}>
          {post.title}
        </h1>
        <div className="text-xs opacity-40 mt-2">{new Date(post.createdAt).toLocaleDateString("ja-JP")}</div>
      </div>
      <div className="text-sm" style={{ color: "#2c2c2c" }}>
        {renderSimpleMarkdown(post.body)}
      </div>
    </article>
  );
}
