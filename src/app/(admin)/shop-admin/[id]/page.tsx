import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ShopProductEditClient from "./ShopProductEditClient";

export default async function EditShopProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.digitalProduct.findUnique({
    where: { id },
    include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!product) notFound();

  return (
    <ShopProductEditClient
      product={{
        id: product.id,
        slug: product.slug,
        title: product.title,
        tagline: product.tagline,
        description: product.description,
        category: product.category,
        price: product.price,
        currency: product.currency,
        coverImage: product.coverImage,
        checkoutUrl: product.checkoutUrl,
        fileFormat: product.fileFormat,
        includes: product.includes,
        featured: product.featured,
        published: product.published,
        sortOrder: product.sortOrder,
        images: product.images.map((img) => ({
          id: img.id,
          imagePath: img.imagePath,
          caption: img.caption,
        })),
      }}
    />
  );
}
