import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { ProductDto } from "@/contracts/api";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getCategories } from "@/features/categories/api";
import { ProductCard } from "@/features/products/components/ProductCard";
import { ProductDetailContent } from "@/features/products/components/ProductDetailContent";
import { ProductDetailLoadError } from "@/features/products/components/ProductDetailLoadError";
import styles from "@/features/products/components/ProductDetailContent.module.css";
import { getFeaturedProducts } from "@/features/products/api";
import { mapProductToCard } from "@/features/products/mappers";
import { loadProductDetail } from "@/features/products/detail-loader";
import { getProductDetailMetadata } from "@/features/products/detail-metadata";
import {
  mapProductToDetail,
  serializeProductJsonLd,
} from "@/features/products/detail-mapper";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ scenario?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return getProductDetailMetadata(slug, query?.scenario);
}

async function RelatedProducts({
  products,
  productId,
}: {
  products: Promise<ProductDto[]>;
  productId: string;
}) {
  const related = (await products)
    .filter((item) => item.status === "ACTIVE" && item.id !== productId)
    .slice(0, 2)
    .map(mapProductToCard);

  if (!related.length) return null;

  return (
    <section className={styles.related} aria-labelledby="related-products-title">
      <h2 id="related-products-title" className={styles.relatedTitle}>
        También puede gustarte
      </h2>
      <div className={styles.relatedGrid}>
        {related.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            imageSizes="(max-width: 639px) and (orientation: portrait) calc(50vw - 1.5rem), 340px"
          />
        ))}
      </div>
    </section>
  );
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const featuredPromise = getFeaturedProducts(3).catch(() => []);
  const [result, categories] = await Promise.all([
    loadProductDetail(slug, query?.scenario),
    getCategories().catch(() => []),
  ]);

  if (result.status === "not-found") notFound();

  if (result.status === "unavailable") {
    return (
      <main className="bg-soky-paper text-soky-ink">
        <Container className="py-10">
          <ProductDetailLoadError />
        </Container>
      </main>
    );
  }

  const product = mapProductToDetail(result.product, categories);

  return (
    <main className="relative isolate bg-soky-paper text-soky-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[url('/images/patterns/soky-cloud-wave-pattern.svg')] bg-size-[420px_auto] bg-repeat opacity-[0.035]"
      />
      <Container className="py-8 md:py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeProductJsonLd(result.product, siteUrl),
          }}
        />
        <Button
          href={product.categoryHref}
          variant="ghost"
          className="mb-6 -ml-5 text-soky-blue"
        >
          ← Volver al menú
        </Button>
        <ProductDetailContent product={product} />
        <Suspense fallback={null}>
          <RelatedProducts
            products={featuredPromise}
            productId={product.card.id}
          />
        </Suspense>
      </Container>
    </main>
  );
}
