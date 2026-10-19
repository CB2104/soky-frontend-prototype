import type { CategoryDto, ProductDto } from "@/contracts/api";
import { parseMoneyCents } from "@/lib/money";
import { mapProductToCard, type ProductCardViewModel } from "./mappers";

export type DetailGroup =
  | {
      kind: "composition";
      title: "Composición";
      items: { quantity: number; type: string }[];
    }
  | {
      kind: "includes";
      title: "Incluye";
      items: {
        name: string;
        quantity?: number;
        icon?: string;
      }[];
    }
  | {
      kind: "beer";
      title: "Presentación";
      quantity: number;
      unit: string;
      variants: string[];
    }
  | { kind: "variants"; title: "Variantes"; items: string[] };

export type ProductDetailViewModel = {
  card: ProductCardViewModel;
  categoryName: string;
  categoryHref: string;
  description?: string;
  metadata?: string;
  groups: DetailGroup[];
  allergens: string[];
  labels: string[];
  imageStatus: ProductDto["imageStatus"];
  hasValidPrice: boolean;
};

const beerToboSlugs = new Set([
  "tobo-cerveza-light-zulia-negra",
  "tobo-cerveza-solera",
]);

const componentIcons: Record<string, Record<string, string>> = {
  "menu-kids": {
    "chicken tenders": "/images/products/detail-kids-drumstick.svg",
    "papas fritas": "/images/products/detail-kids-fries.svg",
    "jugo pequeño": "/images/products/detail-kids-juice.svg",
  },
  "soky-mix": {
    "cortes de sashimi": "/images/products/detail-soky-sashimi.svg",
    "piezas de nigiri": "/images/products/detail-soky-nigiri.svg",
    temaki: "/images/products/detail-soky-temaki.svg",
    gukans: "/images/products/detail-soky-gunkan.svg",
    "piezas frías": "/images/products/detail-snowflake.svg",
  },
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
  const groups: DetailGroup[] = [];
  const isBeerTobo = beerToboSlugs.has(product.slug);
  const hasBeerPresentation = Boolean(
    isBeerTobo
    && details?.quantity !== undefined
    && details.unit
    && details.variants?.length,
  );

  if (details?.composition?.length) {
    groups.push({
      kind: "composition",
      title: "Composición",
      items: details.composition.map((item) => ({
        quantity: item.quantity,
        type: item.type,
      })),
    });
  }

  if (details?.components?.length) {
    groups.push({
      kind: "includes",
      title: "Incluye",
      items: details.components.map((item) => {
        const name = typeof item === "string" ? item : item.name;
        const icon = componentIcons[product.slug]?.[name.trim().toLocaleLowerCase("es-VE")];
        return typeof item === "string"
          ? { name: item, ...(icon ? { icon } : {}) }
          : {
              name: item.name,
              quantity: item.quantity,
              ...(icon ? { icon } : {}),
            };
      }),
    });
  }

  if (details?.variants?.length) {
    if (hasBeerPresentation && details?.quantity !== undefined && details.unit) {
      groups.push({
        kind: "beer",
        title: "Presentación",
        quantity: details.quantity,
        unit: details.unit,
        variants: [...details.variants],
      });
    } else {
      groups.push({
        kind: "variants",
        title: "Variantes",
        items: [...details.variants],
      });
    }
  }

  const metadata = hasBeerPresentation
    ? undefined
    : card.metadata
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
