import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { SEED_THEMES } from "../src/lib/seed-themes";

async function main() {
  console.log("🌿 Seeding Japandi Poster themes...\n");

  for (const theme of SEED_THEMES) {
    const existing = await prisma.posterTheme.findFirst({
      where: { themeEn: theme.themeEn },
    });

    if (existing) {
      console.log(`  ⚠  Skipped (already exists): ${theme.themeEn}`);
      continue;
    }

    const created = await prisma.posterTheme.create({
      data: { ...theme, status: "idea" },
    });
    console.log(`  ✓  Created: ${created.themeJa} / ${created.themeEn}`);
  }

  const total = await prisma.posterTheme.count();
  console.log(`\n✅ Done. Total themes in DB: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
