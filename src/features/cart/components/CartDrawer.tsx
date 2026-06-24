"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { selectCartCount, useCartStore } from "../store";
import { CartEmptyState } from "./CartEmptyState";
import { CartItemRow } from "./CartItemRow";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import { useCartHydration } from "../useCartHydration";
import { CartDrawerFooter } from "./CartDrawerFooter";

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const desktopQuery = "(min-width: 768px)";

function subscribeToDesktop(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(desktopQuery);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(desktopQuery).matches;
}

const mobilePanelVariants = {
  closed: { opacity: 0, x: 0, y: 24 },
  open: { opacity: 1, x: 0, y: 0 },
};

const desktopPanelVariants = {
  closed: { opacity: 1, x: "100%", y: 0 },
  open: { opacity: 1, x: 0, y: 0 },
};

export default function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const decrement = useCartStore((state) => state.decrement);
  const increment = useCartStore((state) => state.increment);
  const removeItem = useCartStore((state) => state.removeItem);
  const items = useCartStore((state) => state.items);

  const reduceMotion = useReducedMotion() ?? false;

  const hasHydrated = useCartHydration();
  const visibleItems = hasHydrated ? items : [];
  const count = selectCartCount(visibleItems);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  const isDesktop = useSyncExternalStore(
    subscribeToDesktop,
    getDesktopSnapshot,
    () => false,
  );
  const panelVariants = isDesktop ? desktopPanelVariants : mobilePanelVariants;

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCart();
      }

      if (event.key === "Tab") {
        const elements = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ??
            [],
        );

        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];

        if (!firstElement || !lastElement) {
          event.preventDefault();
          dialogRef.current?.focus();
          return;
        }

        if (!dialogRef.current?.contains(document.activeElement)) {
          event.preventDefault();
          firstElement.focus();
          return;
        }

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [closeCart, isOpen]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {isOpen ? (
          <motion.div key="cart-drawer" className="fixed inset-0 z-50">
            <motion.button
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="absolute inset-0 bg-soky-navy/55"
              onClick={closeCart}
            />
            <motion.aside
              variants={reduceMotion ? undefined : panelVariants}
              initial={reduceMotion ? false : "closed"}
              animate={reduceMotion ? undefined : "open"}
              exit={reduceMotion ? undefined : "closed"}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 380, damping: 36 }
              }
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cart-drawer-title"
              tabIndex={-1}
              className="absolute bottom-0 right-0 flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-soky-white text-soky-ink shadow-2xl md:bottom-auto md:top-0 md:h-dvh md:max-h-none md:w-105 md:rounded-l-3xl md:rounded-tr-none"
            >
              <header className="flex shrink-0 items-center gap-4 border-b border-soky-blue/15 bg-soky-white px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-soky-orange-deep">
                    Carrito
                  </p>

                  <div className="mt-1 flex items-center gap-3">
                    <h2 id="cart-drawer-title" className="text-2xl font-black">
                      Tu pedido
                    </h2>

                    <span
                      aria-label={`${count} ${count === 1 ? "producto" : "productos"}`}
                      className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-soky-blue px-2 text-xs font-black text-soky-white"
                    >
                      {count}
                    </span>
                  </div>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Cerrar carrito"
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-soky-border bg-soky-paper text-soky-blue transition-colors hover:border-soky-orange hover:bg-soky-orange hover:text-soky-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2"
                  onClick={closeCart}
                >
                  <svg
                    aria-hidden="true"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M6 6L18 18M18 6L6 18"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                  </svg>
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-soky-paper bg-[url('/images/endless-clouds.svg')] bg-size-[56px_28px] bg-repeat p-5">
                {!hasHydrated ? (
                  <p role="status" className="text-sm text-soky-muted">
                    Cargando tu pedido
                    <span aria-hidden="true" className="inline-flex">
                      {[0, 1, 2].map((index) => (
                        <motion.span
                          key={index}
                          animate={
                            reduceMotion
                              ? undefined
                              : { opacity: [0.25, 1, 0.25] }
                          }
                          transition={
                            reduceMotion
                              ? undefined
                              : {
                                  duration: 0.9,
                                  repeat: Infinity,
                                  delay: index * 0.12,
                                }
                          }
                        >
                          .
                        </motion.span>
                      ))}
                    </span>
                  </p>
                ) : (
                  <AnimatePresence initial={false} mode="wait">
                    {visibleItems.length === 0 ? (
                      <motion.div
                        key="cart-empty"
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.15 }}
                      >
                        <CartEmptyState onClose={closeCart} />
                      </motion.div>
                    ) : (
                      <motion.ul key="cart-items" className="space-y-3">
                        <AnimatePresence propagate>
                          {visibleItems.map((item, index) => (
                            <CartItemRow
                              key={item.productId}
                              accent={index % 2 === 0 ? "blue" : "orange"}
                              item={item}
                              onClose={closeCart}
                              onDecrease={() => decrement(item.productId)}
                              onIncrease={() => increment(item.productId)}
                              onRemove={() => removeItem(item.productId)}
                            />
                          ))}
                        </AnimatePresence>
                      </motion.ul>
                    )}
                  </AnimatePresence>
                )}
              </div>
              {hasHydrated && visibleItems.length > 0 ? (
                <CartDrawerFooter items={visibleItems} onClose={closeCart} />
              ) : null}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </MotionConfig>
  );
}
