"use client";

import { useEffect, useState } from "react";
import { PillActionButton } from "@/components/ui/PillActionButtom";
import CartSVG from "@/components/brand/CartSVG";
import { selectCartCount, useCartStore } from "@/features/cart/store";
import { trackEvent } from "@/features/analytics/client";

type CartButtonProps = {
  className?: string;
  variant?: "full" | "compact";
};

export function CartButton({ className, variant = "full" }: CartButtonProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const openCart = useCartStore((state) => state.openCart);
  const count = hasMounted ? selectCartCount(items) : 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setHasMounted(true), 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

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
