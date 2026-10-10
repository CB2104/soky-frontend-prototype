"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductDto } from "@/contracts/api";
import { parseMoneyCents } from "@/lib/money";
import { getProductSnapshot, reconcileCartItems } from "./reconcile-cart";
import type { ProductCardViewModel } from "@/features/products/mappers";

export type CartItem = {
  catalogIssue?: "NOT_FOUND" | "INACTIVE" | "UNAVAILABLE" | "INVALID_PRICE" | "INVALID_QUANTITY";
  descriptionSnapshot?: string;
  imageUrlSnapshot?: string;
  notes?: string;
  priceLabelSnapshot?: string;
  unitPriceCurrencySnapshot?: ProductCardViewModel["priceCurrency"];
  unitPriceCentsSnapshot?: number;
  productId: string;
  quantity: number;
  slug: string;
  titleSnapshot: string;
};

export type CatalogStatus = "idle" | "loading" | "ready" | "error";

type CartState = {
  catalogStatus: CatalogStatus;
  catalogRevision: number;
  catalogRefreshKey: number;
  cartRevision: number;
  setCatalogStatus: (status: CatalogStatus) => void;
  reconcileItems: (products: readonly ProductDto[]) => void;
  retryCatalog: () => void;
  isOpen: boolean;
  items: CartItem[];
  addItem: (product: ProductCardViewModel, options?: { openDrawer?: boolean }) => void;
  clearCart: () => void;
  closeCart: () => void;
  decrement: (productId: string) => void;
  increment: (productId: string) => void;
  openCart: () => void;
  removeItem: (productId: string) => void;
  setNotes: (productId: string, notes: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
};

const MAX_CART_ITEM_QUANTITY = 99;

function clampQuantity(quantity: number) {
  return Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Number.isFinite(quantity) ? Math.trunc(quantity) : 1));
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      isOpen: false,
      items: [],
      catalogStatus: "idle",
      catalogRevision: 0,
      catalogRefreshKey: 0,
      cartRevision: 0,
      setCatalogStatus: (catalogStatus) => set((state) => ({
        catalogStatus,
        catalogRevision: state.catalogRevision + (catalogStatus === "loading" ? 1 : 0),
      })),
      reconcileItems: (products) => set((state) => ({
        items: reconcileCartItems(state.items, products),
        catalogStatus: "ready",
      })),
      retryCatalog: () => set((state) => ({ catalogRefreshKey: state.catalogRefreshKey + 1 })),
      addItem: (product, options = {}) =>
        set((state) => {
          const unitPriceCents = parseMoneyCents(product.priceAmount);

          if (!product.isAvailable || unitPriceCents === null) {
            return state;
          }

          const current = state.items.find(
            (item) => item.productId === product.id,
          );

          if (current) {
            return {
              isOpen: options.openDrawer === false ? state.isOpen : true,
              cartRevision: state.cartRevision + 1,
              items: state.items.map((item) =>
                item.productId === product.id
                  ? {
                      ...item,
                      ...getProductSnapshot(product),
                      catalogIssue: undefined,
                      quantity: clampQuantity(item.quantity + 1),
                    }
                  : item,
              ),
            };
          }

          return {
            isOpen: options.openDrawer === false ? state.isOpen : true,
            cartRevision: state.cartRevision + 1,
            items: [
              ...state.items,
              {
                productId: product.id,
                ...getProductSnapshot(product),
                quantity: 1,
              },
            ],
          };
        }),
      clearCart: () => set((state) => state.items.length > 0
        ? { items: [], cartRevision: state.cartRevision + 1 }
        : state),
      closeCart: () => set({ isOpen: false }),
      decrement: (productId) =>
        set((state) => {
          if (!state.items.some((item) => item.productId === productId)) return state;
          return {
            cartRevision: state.cartRevision + 1,
            items: state.items
            .map((item) =>
              item.productId === productId
                ? {
                    ...item,
                    quantity: Math.max(0, item.quantity - 1),
                  }
                : item,
            )
            .filter((item) => item.quantity > 0),
          };
        }),
      increment: (productId) =>
        set((state) => {
          const current = state.items.find((item) => item.productId === productId);
          if (!current || state.catalogStatus !== "ready" || current.catalogIssue || current.quantity >= MAX_CART_ITEM_QUANTITY) return state;
          return {
            cartRevision: state.cartRevision + 1,
            items: state.items.map((item) => item.productId === productId
              ? { ...item, quantity: clampQuantity(item.quantity + 1) }
              : item),
          };
        }),
      openCart: () => set({ isOpen: true }),
      removeItem: (productId) =>
        set((state) => state.items.some((item) => item.productId === productId)
          ? {
              items: state.items.filter((item) => item.productId !== productId),
              cartRevision: state.cartRevision + 1,
            }
          : state),
      setNotes: (productId, notes) =>
        set((state) => {
          const current = state.items.find((item) => item.productId === productId);
          if (!current || current.notes === notes) return state;
          return {
            cartRevision: state.cartRevision + 1,
            items: state.items.map((item) => item.productId === productId ? { ...item, notes } : item),
          };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => {
          const current = state.items.find((item) => item.productId === productId);
          if (!current || state.catalogStatus !== "ready" || current.catalogIssue) return state;
          const nextQuantity = clampQuantity(quantity);
          if (nextQuantity === current.quantity) return state;
          return {
            cartRevision: state.cartRevision + 1,
            items: state.items
            .map((item) =>
              item.productId === productId
                ? { ...item, quantity: nextQuantity }
                : item,
            )
            .filter((item) => item.quantity > 0),
          };
        }),
    }),
    {
      name: "soky.cart.v1",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function selectCartCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}
