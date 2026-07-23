import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.rakutenProduct.findUnique({
    where: { id },
    include: {
      rounds: {
        orderBy: { weekNumber: "desc" },
        include: { reviews: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
