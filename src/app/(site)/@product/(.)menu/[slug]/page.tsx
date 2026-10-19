import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories } from "@/features/categories/api";
import { ProductDetailContent } from "@/features/products/components/ProductDetailContent";
import { ProductDetailLoadError } from "@/features/products/components/ProductDetailLoadError";
import { loadProductDetail } from "@/features/products/detail-loader";
import { mapProductToDetail } from "@/features/products/detail-mapper";
import { getProductDetailMetadata } from "@/features/products/detail-metadata";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ scenario?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return getProductDetailMetadata(slug, query?.scenario);
}

export default async function InterceptedProductPage({
  params,
  searchParams,
}: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [result, categories] = await Promise.all([
    loadProductDetail(slug, query?.scenario),
    getCategories().catch(() => []),
  ]);

  if (result.status === "not-found") notFound();
  if (result.status === "unavailable") {
    return (
      <ProductDetailLoadError
        headingTag="h2"
        titleId="product-dialog-load-error"
      />
    );
  }

  return (
    <ProductDetailContent
      product={mapProductToDetail(result.product, categories)}
      headingTag="h2"
      presentation="dialog"
      imageSizes="(min-width: 768px) 624px, calc(100vw - 2rem)"
    />
  );
}
