import { prisma } from "@/lib/prisma";
import { generateReviewsForRound } from "@/lib/review";
import { generateRoundImage } from "@/lib/review-image";
import type { ReviewRound, ProductReview } from "@/generated/prisma/client";

export type RoundWithReviews = ReviewRound & { reviews: ProductReview[] };

/**
 * Generate the next weekly round for a tracked product: creates the round,
 * writes 5 persona reviews, and best-effort generates one AI lifestyle photo
 * from the product's own image. Bumps product.weekCount on success.
 */
export async function generateNextRound(productId: string): Promise<RoundWithReviews> {
  const product = await prisma.rakutenProduct.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error("商品が見つかりません");
  }

  const weekNumber = product.weekCount + 1;
  const round = await prisma.reviewRound.create({
    data: { productId, weekNumber, status: "generated" },
  });

  const reviews = await generateReviewsForRound(product, weekNumber);
  await prisma.productReview.createMany({
    data: reviews.map((r) => ({ roundId: round.id, ...r, status: "generated" })),
  });

  try {
    await generateRoundImage(round, product);
  } catch (err) {
    // Best-effort, same as poster print-upscale: the text reviews still work
    // without the lifestyle photo.
    console.error("[rakuten] round image generation failed:", err);
  }

  await prisma.rakutenProduct.update({
    where: { id: productId },
    data: { weekCount: weekNumber },
  });

  const full = await prisma.reviewRound.findUnique({
    where: { id: round.id },
    include: { reviews: true },
  });
  if (!full) throw new Error("生成直後のラウンド取得に失敗しました");
  return full;
}
