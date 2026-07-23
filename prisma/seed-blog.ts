import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { SEED_BLOG_POSTS } from "../src/lib/blog";

async function main() {
  console.log("🍵 Seeding public blog posts...\n");

  for (const post of SEED_BLOG_POSTS) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      console.log(`  ⚠  Skipped (already exists): ${post.title}`);
      continue;
    }
    const created = await prisma.blogPost.create({ data: { ...post, published: true } });
    console.log(`  ✓  Created: ${created.title}`);
  }

  const total = await prisma.blogPost.count();
  console.log(`\n✅ Done. Total blog posts in DB: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
