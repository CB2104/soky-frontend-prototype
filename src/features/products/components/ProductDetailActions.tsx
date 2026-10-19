"use client";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/features/analytics/client";
import { useCartStore } from "@/features/cart/store";
import type { ProductDetailViewModel } from "../detail-mapper";
import styles from "./ProductDetailContent.module.css";

type Props = {
  product: ProductDetailViewModel["card"];
  hasValidPrice: boolean;
};

export function ProductDetailActions({ product, hasValidPrice }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const canAdd = product.isAvailable && hasValidPrice;

  function handleAdd() {
    if (!canAdd) return;

    const before = useCartStore.getState().items
      .find((item) => item.productId === product.id)?.quantity ?? 0;
    addItem(product);
    const after = useCartStore.getState().items
      .find((item) => item.productId === product.id)?.quantity ?? 0;

    if (after <= before) return;
    try {
      trackEvent({
        eventType: "product_add_to_cart",
        entityType: "product",
        entityId: product.id,
      });
    } catch {
      // La analítica no debe revertir un producto ya agregado.
    }
  }

  return (
    <div className={styles.actions}>
      <Button
        type="button"
        disabled={!canAdd}
        onClick={handleAdd}
        className={styles.primaryAction}
      >
        {!product.isAvailable
          ? "Agotado"
          : !hasValidPrice
            ? "Precio por confirmar"
            : "Añadir al carrito"}
      </Button>
      <Button variant="tertiary"
        href="/cart"
        data-transition-ignore="true"
        className={styles.cartLink}
      >
        Ver carrito
      </Button>
    </div>
  );
}
