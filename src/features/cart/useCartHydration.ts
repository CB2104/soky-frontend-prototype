"use client";

import { useSyncExternalStore } from "react";
import { useCartStore } from "./store";

const noopUnsubscribe = () => {};

function subscribeToCartHydration(onStoreChange: () => void) {
  return (
    useCartStore.persist?.onFinishHydration(onStoreChange) ??
    noopUnsubscribe
  );
}

function getCartHydrationSnapshot() {
  return useCartStore.persist?.hasHydrated() ?? true;
}

function getCartServerHydrationSnapshot() {
  return false;
}

export function useCartHydration() {
  return useSyncExternalStore(
    subscribeToCartHydration,
    getCartHydrationSnapshot,
    getCartServerHydrationSnapshot,
  );
}