"use client";

import { PillActionButton } from "@/components/ui/PillActionButtom";
import CartSVG from "@/components/brand/CartSVG";
import { selectCartCount, useCartStore } from "@/features/cart/store";
import { trackEvent } from "@/features/analytics/client";
import { useCartHydration } from "../useCartHydration";

type CartButtonProps = {
  className?: string;
  variant?: "full" | "compact";
};

export function CartButton({ className, variant = "full" }: CartButtonProps) {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const openCart = useCartStore((state) => state.openCart);

const hasHydrated = useCartHydration()
  const count = hasHydrated ? selectCartCount(items) : 0;

  return (
    <PillActionButton
      icon={<CartSVG />}
      badge={count}
      className={className}
      isActive={isOpen}
      variant={variant}
      onClick={() => {
        openCart();
        trackEvent({ eventType: "cart_open", entityType: "cart" });
      }}
      aria-label={`Abrir carrito con ${count} productos`}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
    >
      PIDE YA!
    </PillActionButton>
  );
}
