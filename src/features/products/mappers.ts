import { getProductCardSelection, type ProductCardTheme, type ProductBadgeKind } from "./product-card-editorial";
import type { ProductDto, PriceCurrency } from "@/contracts/api";
import { formatPriceLabel } from "@/lib/money";

export type ProductCardVariant = "default" | "featured" | "promo";

export type ProductCardViewModel = {
  variant: ProductCardVariant;
  theme?: ProductCardTheme;
  badgeKind?: ProductBadgeKind;
  isEditorial?: boolean;
  badge?: string;
  metadata?: string;
  description: string;
  id: string;
  imageAlt: string;
  imageUrl: string;
  isAvailable: boolean;
  priceLabel: string;
  priceAmount: string;
  priceCurrency: PriceCurrency;
  slug: string;
  tags: string[];
  title: string;
};

export function mapProductToCard(product: ProductDto): ProductCardViewModel {
  const variant: ProductCardVariant =
    product.type === "PROMO"
      ? "promo"
      : product.featured
        ? "featured"
        : "default";

  const badge =
    variant === "promo"
      ? "Promo"
      : variant === "featured"
        ? "Favorito"
        : undefined;

  const metadata = product.metadata ?? product.tags.find((tag) =>
    /^\d+\s+piezas?$/i.test(tag.trim()),
  );

  const selection = getProductCardSelection(product);

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.shortDescription ?? product.description,
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
    priceLabel: formatPriceLabel(product.priceAmount, product.priceCurrency),
    priceAmount: product.priceAmount,
    priceCurrency: product.priceCurrency,
    isAvailable: product.status === "ACTIVE" && product.isAvailable,
    variant,
    theme: selection?.theme,
    badgeKind: selection?.badgeKind ?? (badge ? variant === "promo" ? "promo" : "favorite" : undefined),
    isEditorial: Boolean(selection),
    badge: selection?.badge ?? badge,
    metadata,
    tags: selection ? [...product.tags, "editorial:" + selection.badgeKind] : product.tags,
  };
}
