"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductCardViewModel } from "@/features/products/mappers";

export type CartItem = {
  imageUrlSnapshot?: string;
  notes?: string;
  productId: string;
  quantity: number;
  slug: string;
  titleSnapshot: string;
};

type CartState = {
  isOpen: boolean;
  items: CartItem[];
  addItem: (product: ProductCardViewModel) => void;
  clearCart: () => void;
  closeCart: () => void;
  decrement: (productId: string) => void;
  increment: (productId: string) => void;
  openCart: () => void;
  removeItem: (productId: string) => void;
  setNotes: (productId: string, notes: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      isOpen: false,
      items: [],
      addItem: (product) =>
        set((state) => {
          const current = state.items.find((item) => item.productId === product.id);

          if (current) {
            return {
              isOpen: true,
              items: state.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          }

          return {
            isOpen: true,
            items: [
              ...state.items,
              {
                productId: product.id,
                slug: product.slug,
                titleSnapshot: product.title,
                imageUrlSnapshot: product.imageUrl,
                quantity: 1,
              },
            ],
          };
        }),
      clearCart: () => set({ items: [] }),
      closeCart: () => set({ isOpen: false }),
      decrement: (productId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.productId === productId
                ? { ...item, quantity: Math.max(0, item.quantity - 1) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      increment: (productId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        })),
      openCart: () => set({ isOpen: true }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      setNotes: (productId, notes) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, notes } : item,
          ),
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.productId === productId
                ? { ...item, quantity: Math.max(0, Math.trunc(quantity)) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
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
