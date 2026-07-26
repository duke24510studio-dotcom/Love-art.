import { prisma } from "@/lib/prisma";
import { SEED_SHOP_PRODUCTS } from "@/lib/shop";

/**
 * Seed the storefront on first boot so a fresh deploy is never an empty shop.
 * Runs from src/instrumentation.ts, same as the poster themes and blog seeds.
 *
 * Kept out of src/lib/shop.ts on purpose: that module is imported by client
 * components (the CMS forms), and pulling Prisma into a client bundle breaks
 * the build.
 */
export async function seedShopIfEmpty(): Promise<void> {
  const count = await prisma.digitalProduct.count();
  if (count > 0) return;

  for (const product of SEED_SHOP_PRODUCTS) {
    await prisma.digitalProduct.create({ data: product });
  }
  console.log(`[seed] seeded ${SEED_SHOP_PRODUCTS.length} shop products`);
}
