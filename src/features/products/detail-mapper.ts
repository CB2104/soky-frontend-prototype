import type { CategoryDto, ProductDto } from "@/contracts/api";
import { parseMoneyCents } from "@/lib/money";
import { mapProductToCard, type ProductCardViewModel } from "./mappers";

export type ProductDetailViewModel = {
  card: ProductCardViewModel;
  categoryName: string;
  categoryHref: string;
  description?: string;
  metadata?: string;
  groups: { title: string; items: string[] }[];
  allergens: string[];
  labels: string[];
  imageStatus: ProductDto["imageStatus"];
  hasValidPrice: boolean;
};

export function mapProductToDetail(
  product: ProductDto,
  categories: readonly CategoryDto[] = [],
): ProductDetailViewModel {
  const card = mapProductToCard(product);
  const details = product.details;
  const category = categories.find((item) =>
    item.isActive
    && (item.id === product.categoryId || item.slug === product.categorySlug),
  );
  const groups: ProductDetailViewModel["groups"] = [];

  if (details?.composition?.length) {
    groups.push({
      title: "Composición",
      items: details.composition.map((item) =>
        `${item.quantity} ${item.quantity === 1 ? "pieza" : "piezas"} ${item.type}`,
      ),
    });
  }

  if (details?.components?.length) {
    groups.push({
      title: "Incluye",
      items: details.components.map((item) => typeof item === "string"
        ? item
        : `${item.quantity} ${item.name}`),
    });
  }

  if (details?.variants?.length) {
    groups.push({ title: "Variantes", items: [...details.variants] });
  }

  const metadata = card.metadata
    ?? (details?.pieces !== undefined
      ? `${details.pieces} ${details.pieces === 1 ? "pieza" : "piezas"}`
      : details?.quantity !== undefined && details.unit
        ? `${details.quantity} ${details.unit}`
        : undefined);

  return {
    card,
    categoryName: category?.name ?? "Menú SOKY",
    categoryHref: category
      ? "/menu?category=" + encodeURIComponent(category.slug)
      : "/menu",
    // DETAILS ya se presenta en metadata/listas; evita repetir su resumen.
    description: product.descriptionSource === "PENDING"
      || product.descriptionSource === "DETAILS"
      ? undefined
      : product.description.trim() || undefined,
    metadata,
    groups,
    allergens: [...product.allergens],
    labels: (product.labels ?? product.tags)
      .map((label) => label.trim())
      .filter((label) => Boolean(label) && label !== "★" && label !== "♥"),
    imageStatus: product.imageStatus,
    hasValidPrice: parseMoneyCents(product.priceAmount) !== null,
  };
}

export function buildProductJsonLd(product: ProductDto, baseUrl: string) {
  const path = "/menu/" + encodeURIComponent(product.slug);
  const url = new URL(path, baseUrl).href;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.descriptionSource === "PENDING"
      ? undefined
      : product.description,
    image: product.imageStatus === "PENDING"
      ? undefined
      : new URL(product.imageUrl, baseUrl).href,
    url,
    offers: parseMoneyCents(product.priceAmount) === null
      ? undefined
      : {
          "@type": "Offer",
          price: product.priceAmount,
          priceCurrency: product.priceCurrency,
          availability: product.status === "ACTIVE" && product.isAvailable
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url,
        },
  };
}

export function serializeProductJsonLd(product: ProductDto, baseUrl: string) {
  return JSON.stringify(buildProductJsonLd(product, baseUrl))
    .replace(/</g, "\\u003c");
}
