import type { ProductDto } from "@/contracts/api";
import { mapProductToCard, type ProductCardViewModel } from "@/features/products/mappers";
import { parseMoneyCents } from "@/lib/money";
import type { CartItem } from "./store";

export function getProductSnapshot(product: ProductCardViewModel) {
  return {
    slug: product.slug,
    titleSnapshot: product.title,
    imageUrlSnapshot: product.imageUrl,
    descriptionSnapshot: product.description,
    priceLabelSnapshot: product.priceLabel,
    unitPriceCentsSnapshot: parseMoneyCents(product.priceAmount) ?? undefined,
    unitPriceCurrencySnapshot: product.priceCurrency,
  };
}

export function reconcileCartItems(
  items: readonly CartItem[],
  products: readonly ProductDto[],
): CartItem[] {
  const byId = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) return { ...item, catalogIssue: "NOT_FOUND" };

    const snapshot = getProductSnapshot(mapProductToCard(product));
    const catalogIssue: CartItem["catalogIssue"] =
      !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99
        ? "INVALID_QUANTITY"
        : product.status !== "ACTIVE"
          ? "INACTIVE"
          : !product.isAvailable
            ? "UNAVAILABLE"
            : snapshot.unitPriceCentsSnapshot === undefined
              ? "INVALID_PRICE"
              : undefined;

    return { ...item, ...snapshot, catalogIssue };
  });
}

export function getCartQuoteKey(
  items: readonly CartItem[],
  fulfillmentType: string,
  revision: number,
  cartRevision = 0,
  formRevision = 0,
) {
  return JSON.stringify({
    revision,
    cartRevision,
    formRevision,
    fulfillmentType,
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      notes: item.notes ?? "",
      cents: item.unitPriceCentsSnapshot,
      currency: item.unitPriceCurrencySnapshot,
      issue: item.catalogIssue,
    })),
  });
}

export function getCartIntentItemsKey(items: readonly CartItem[]) {
  return JSON.stringify(items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    notes: item.notes ?? "",
  })));
}
