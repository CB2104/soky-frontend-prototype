import type { Metadata } from "next";
import { loadProductDetail } from "./detail-loader";
import { siteUrl } from "@/lib/env";

export async function getProductDetailMetadata(
  slug: string,
  scenario?: string,
): Promise<Metadata> {
  const result = await loadProductDetail(slug, scenario);

  if (result.status === "not-found") {
    return {
      title: "Producto no encontrado",
      robots: { index: false, follow: true },
    };
  }

  if (result.status === "unavailable") {
    return {
      title: "Producto temporalmente no disponible",
      robots: { index: false, follow: true },
    };
  }

  const product = result.product;
  const canonical = "/menu/" + encodeURIComponent(product.slug);
  const description = product.descriptionSource === "PENDING"
    ? undefined
    : product.shortDescription ?? product.description;

  return {
    title: product.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: product.title + " | SOKY",
      description,
      url: new URL(canonical, siteUrl).href,
      images: product.imageStatus === "PENDING"
        ? []
        : [{
            url: new URL(product.imageUrl, siteUrl).href,
            alt: product.imageAlt,
          }],
    },
  };
}
