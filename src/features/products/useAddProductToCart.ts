"use client";

import { useCartStore } from "@/features/cart/store";
import { trackEvent } from "@/features/analytics/client";
import type { ProductCardViewModel } from "./mappers";

export function useAddProductToCart() {
  const addItem = useCartStore(state=>state.addItem);
  return (product: ProductCardViewModel, options?: { openDrawer?: boolean }) => {
    if (!product.isAvailable) return;
    addItem(product, options);
    try {trackEvent({eventType:"product_add_to_cart",entityType:"product",entityId:product.id});} catch { /* La selección ya se guardó. */ }
  };
}
