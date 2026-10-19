import { SiteLoadingPending } from "@/components/layout/page-loading/SiteLoadingPending";
import { SiteReadySignal } from "@/providers/SiteLoadingProvider";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { ProductDto } from "@/contracts/api";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getCategories } from "@/features/categories/api";
import { ProductRecommendations } from "@/features/products/components/ProductRecommendations";
import { ProductDetailContent } from "@/features/products/components/ProductDetailContent";
import { ProductDetailLoadError } from "@/features/products/components/ProductDetailLoadError";
import { getAllProducts } from "@/features/products/api";
import { mapProductToCard } from "@/features/products/mappers";
import { loadProductDetail } from "@/features/products/detail-loader";
import { getProductDetailMetadata } from "@/features/products/detail-metadata";
import {
  mapProductToDetail,
  serializeProductJsonLd,
} from "@/features/products/detail-mapper";
import { selectDetailRecommendations } from "@/features/products/detail-recommendations";
import { apiMode, siteUrl } from "@/lib/env";
import styles from "./ProductPage.module.css";

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
  current,
}: {
  products: Promise<ProductDto[]>;
  current: ProductDto;
}) {
  const related = selectDetailRecommendations(current, await products)
    .map(mapProductToCard);

  if (!related.length) return null;

  return (
    <div className={styles.recommendations}>
      <ProductRecommendations products={related} presentation="compact" />
    </div>
  );
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const catalogScenario = apiMode === "mock" ? query?.scenario : undefined;
  const catalogPromise = getAllProducts({ scenario: catalogScenario }).catch(() => []);
  const [result, categories] = await Promise.all([
    loadProductDetail(slug, query?.scenario),
    getCategories().catch(() => []),
  ]);

  if (result.status === "not-found") notFound();

  if (result.status === "unavailable") {
    return (
      <main className={styles.page}>
        <Container className={styles.content}>
          <ProductDetailLoadError />
        </Container>
        <SiteReadySignal />
      </main>
    );
  }

  const product = mapProductToDetail(result.product, categories);

  return (
    <main className={styles.page}>
      <Container className={styles.content}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeProductJsonLd(result.product, siteUrl),
          }}
        />
        <Button
          href={product.categoryHref}
          variant="tertiary"
          className={styles.back}
        >
          ← Volver al menú
        </Button>
        <ProductDetailContent product={product} presentation="page" />
        <Suspense fallback={<SiteLoadingPending />}>
          <RelatedProducts products={catalogPromise} current={result.product} />
        </Suspense>
      </Container>
      <SiteReadySignal />
    </main>
  );
}
