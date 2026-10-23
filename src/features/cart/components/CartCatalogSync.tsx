"use client";

import { useEffect } from "react";
import { getAllProducts } from "@/features/products/api";
import { useCartStore } from "../store";
import { useCartHydration } from "../useCartHydration";
import { subscribeMonetaryChange } from "@/features/exchange-rates/change-events";

export function CartCatalogSync() {
  const hydrated = useCartHydration();
  const ids = useCartStore((state) => state.items.map((item) => item.productId).sort().join("|"));
  const isOpen = useCartStore((state) => state.isOpen);
  const refreshKey = useCartStore((state) => state.catalogRefreshKey);

  useEffect(() => {
    if (!hydrated || !ids) return;

    let disposed = false;
    let requestId = 0;

    function refresh() {
      const currentId = ++requestId;
      useCartStore.getState().setCatalogStatus("loading");
      void getAllProducts().then(
        (products) => {
          if (!disposed && currentId === requestId) {
            useCartStore.getState().reconcileItems(products);
          }
        },
        () => {
          if (!disposed && currentId === requestId) {
            useCartStore.getState().setCatalogStatus("error");
          }
        },
      );
    }

    refresh();
    window.addEventListener("focus", refresh);
    const unsubscribe = subscribeMonetaryChange(refresh);
    return () => {
      disposed = true;
      unsubscribe();
      window.removeEventListener("focus", refresh);
    };
  }, [hydrated, ids, isOpen, refreshKey]);

  return null;
}
