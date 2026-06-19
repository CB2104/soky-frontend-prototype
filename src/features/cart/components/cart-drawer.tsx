"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { selectCartCount, useCartStore } from "@/features/cart/store";
import { cn } from "@/lib/cn";

export function CartDrawer() {
  const [hasMounted, setHasMounted] = useState(false);
  const closeCart = useCartStore((state) => state.closeCart);
  const decrement = useCartStore((state) => state.decrement);
  const increment = useCartStore((state) => state.increment);
  const isOpen = useCartStore((state) => state.isOpen);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const visibleItems = hasMounted ? items : [];
  const count = selectCartCount(visibleItems);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setHasMounted(true), 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCart();
      }
    }

    if (!isOpen) {
      return;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeCart, isOpen]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "fixed inset-0 z-40 transition",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <button
        type="button"
        aria-label="Cerrar carrito"
        className={cn(
          "absolute inset-0 bg-soky-navy/55 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={closeCart}
      />
      <aside
        aria-label="Carrito"
        className={cn(
          "absolute bottom-0 right-0 flex max-h-[88dvh] w-full flex-col rounded-t-3xl bg-soky-white text-soky-ink shadow-2xl transition-transform duration-300 md:bottom-auto md:top-0 md:h-full md:max-h-none md:w-[420px] md:rounded-l-3xl md:rounded-tr-none",
          isOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full md:translate-y-0",
        )}
      >
        <header className="flex items-center justify-between border-b border-soky-border p-5">
          <div>
            <p className="text-sm font-bold text-soky-muted">Pedido</p>
            <h2 className="text-2xl font-black">{count} productos</h2>
          </div>
          <Button type="button" variant="ghost" className="text-soky-ink" onClick={closeCart}>
            Cerrar
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          {visibleItems.length === 0 ? (
            <div className="rounded-2xl bg-soky-paper p-5 text-sm text-soky-muted">
              Tu carrito está vacío. Agrega un box desde el menú para iniciar un pedido.
            </div>
          ) : (
            <ul className="space-y-4">
              {visibleItems.map((item) => (
                <li key={item.productId} className="rounded-2xl border border-soky-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{item.titleSnapshot}</p>
                      <Link
                        href={`/menu/${item.slug}`}
                        className="text-sm font-bold text-soky-blue underline-offset-4 hover:underline"
                        onClick={closeCart}
                      >
                        Ver producto
                      </Link>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-bold text-japan-seal"
                      onClick={() => removeItem(item.productId)}
                    >
                      Quitar
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => decrement(item.productId)}
                      aria-label={`Reducir cantidad de ${item.titleSnapshot}`}
                    >
                      -
                    </Button>
                    <span className="min-w-8 text-center font-black">{item.quantity}</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => increment(item.productId)}
                      aria-label={`Aumentar cantidad de ${item.titleSnapshot}`}
                    >
                      +
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="border-t border-soky-border p-5">
          <Button href="/cart" className="w-full" onClick={closeCart} aria-disabled={visibleItems.length === 0}>
            Revisar pedido
          </Button>
        </footer>
      </aside>
    </div>
  );
}
