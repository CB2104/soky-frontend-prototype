import type { ProductDto, PriceCurrency } from "@/contracts/api";
import { formatPriceLabel } from "@/lib/money";

export type ProductCardViewModel = {
  badge?: string;
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
    badge: product.featured ? "Promo" : product.tags[0],
    tags: product.tags,
  };
}
