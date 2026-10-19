"use client";

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, MotionConfig, motion, useIsPresent, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";
import { usePathname } from "next/navigation";
import { useTransitionRouter } from "next-transition-router";
import type { PriceCurrency } from "@/contracts/api";
import { CloseIcon } from "@/components/brand/IconsSVG";
import { Button } from "@/components/ui/button";
import { lockBodyScroll } from "@/lib/body-scroll-lock";
import { selectCartCount, useCartStore } from "../store";
import { mapCartItem } from "../mappers";
import { useCartHydration } from "../useCartHydration";
import { CartEmptyState } from "./CartEmptyState";
import { CartItemRow } from "./CartItemRow";
import { CartDrawerFooter } from "./CartDrawerFooter";
import styles from "./CartDrawer.module.css";

type CartDrawerProps = { currency: PriceCurrency };
type PanelProps = CartDrawerProps & { reduceMotion: boolean };
const focusableSelector = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';
const panelVariants: Variants = {
  initial: (reduce: boolean) => ({ x: reduce ? 0 : "100%" }),
  open: (reduce: boolean) => ({ x: 0, transition: { duration: reduce ? 0 : .28, ease: [.22, 1, .36, 1] } }),
  exit: (reduce: boolean) => ({ x: reduce ? 0 : "100%", transition: { duration: reduce ? 0 : .24, ease: [.4, 0, .8, .4] } }),
};
const backdropVariants: Variants = {
  initial: (reduce: boolean) => ({ opacity: reduce ? 1 : 0 }),
  open: (reduce: boolean) => ({ opacity: 1, transition: { duration: reduce ? 0 : .18 } }),
  exit: (reduce: boolean) => ({ opacity: 0, transition: { duration: reduce ? 0 : .24 } }),
};
function subscribeClient() { return () => {}; }
function clientSnapshot() { return true; }
function serverSnapshot() { return false; }
function visible(element: HTMLElement | null): element is HTMLElement {
  return !!element?.isConnected && element.getClientRects().length > 0
    && getComputedStyle(element).visibility !== "hidden" && !element.closest("[inert]");
}

function CartDrawerPanel({ currency, reduceMotion }: PanelProps) {
  const router = useTransitionRouter();
  const isPresent = useIsPresent();
  const items = useCartStore(state => state.items);
  const catalogStatus = useCartStore(state => state.catalogStatus);
  const closeCart = useCartStore(state => state.closeCart);
  const decrement = useCartStore(state => state.decrement);
  const increment = useCartStore(state => state.increment);
  const removeItem = useCartStore(state => state.removeItem);
  const retryCatalog = useCartStore(state => state.retryCatalog);
  const hasHydrated = useCartHydration();
  const visibleItems = hasHydrated ? items : [];
  const count = selectCartCount(visibleItems);
  const mappedItems = visibleItems.map(item => mapCartItem(item, catalogStatus === "ready", currency));
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const glyphRef = useRef<HTMLSpanElement>(null);
  const glyphSnapshot = useRef<{ transform: string; opacity: string } | null>(null);
  const navigationRef = useRef(false);
  const pendingFocus = useRef<{ id: string | null } | null>(null);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const viewport = window.visualViewport;
    let frame = 0;
    function syncViewport() {
      // Keep native pinch zoom; do not shrink/reflow the drawer to counter it.
      if (viewport && Math.abs(viewport.scale - 1) > .01) return;
      const height = viewport?.height ?? window.innerHeight;
      const top = viewport?.offsetTop ?? 0;
      if (!Number.isFinite(height) || height <= 0) return;
      overlay!.style.setProperty("--cart-viewport-height", `${height}px`);
      overlay!.style.setProperty("--cart-viewport-top", `${top}px`);
    }
    function scheduleSync() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => { frame = 0; syncViewport(); });
    }
    syncViewport();
    viewport?.addEventListener("resize", scheduleSync);
    viewport?.addEventListener("scroll", scheduleSync);
    window.addEventListener("resize", scheduleSync);
    window.addEventListener("orientationchange", scheduleSync);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", scheduleSync);
      viewport?.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("orientationchange", scheduleSync);
    };
  }, []);

  function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigationRef.current = true;
    closeCart();
    router.push(href);
  }

  function remove(id: string) {
    const index = items.findIndex(item => item.productId === id);
    pendingFocus.current = { id: (items[index + 1] ?? items[index - 1])?.productId ?? null };
    removeItem(id);
  }

  useLayoutEffect(() => {
    const request = pendingFocus.current;
    if (!request) return;
    pendingFocus.current = null;
    const row = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("[data-cart-item]") ?? [])
      .find(element => element.dataset.cartItem === request.id);
    const target = row?.querySelector<HTMLElement>("[data-cart-remove] button")
      ?? panelRef.current?.querySelector<HTMLElement>("[data-cart-empty-action]")
      ?? closeRef.current;
    target?.focus({ preventScroll: true });
  }, [items]);

  useEffect(() => {
    const glyph = glyphRef.current;
    if (!glyph || reduceMotion) return;
    const current = getComputedStyle(glyph);
    const start = glyphSnapshot.current ?? { transform: current.transform, opacity: current.opacity };
    const animation = glyph.animate(isPresent
      ? [{ transform: "rotate(-90deg) scale(.7)", opacity: 0 }, { transform: "rotate(0) scale(1)", opacity: 1 }]
      : [start, { transform: "rotate(180deg) scale(.65)", opacity: 0 }], {
      duration: isPresent ? 360 : 200,
      easing: isPresent ? "cubic-bezier(.22,1,.36,1)" : "ease-in",
      fill: isPresent ? "none" : "forwards",
    });
    return () => {
      const computed = getComputedStyle(glyph);
      glyphSnapshot.current = { transform: computed.transform, opacity: computed.opacity };
      animation.cancel();
    };
  }, [isPresent, reduceMotion]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const releaseScroll = lockBodyScroll();
    const isolated = new Map<HTMLElement, { inert: boolean; ariaHidden: string | null }>();
    let activated = false;

    function ownsFocus() {
      return !document.querySelector('[data-soky-mobile-nav-overlay]')
        && !Array.from(document.querySelectorAll<HTMLDialogElement>("dialog[open]"))
          .some(dialog => !overlay!.contains(dialog))
        && !overlay!.closest("[inert]");
    }
    function isolateBackground() {
      if (!ownsFocus()) return;
      if (!activated) { closeRef.current?.focus({ preventScroll: true }); activated = true; }
      for (const child of document.body.children) {
        if (!(child instanceof HTMLElement) || child === overlay || child.contains(overlay)
          || ["SCRIPT", "STYLE", "LINK"].includes(child.tagName) || isolated.has(child)) continue;
        isolated.set(child, { inert: child.inert, ariaHidden: child.getAttribute("aria-hidden") });
        child.inert = true;
        child.setAttribute("aria-hidden", "true");
      }
    }
    isolateBackground();
    const observer = new MutationObserver(isolateBackground);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
    function handleKeyDown(event: KeyboardEvent) {
      if (!ownsFocus()) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeCart(); return; }
      if (event.key !== "Tab") return;
      const elements = Array.from(panel!.querySelectorAll<HTMLElement>(focusableSelector)).filter(visible);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) { event.preventDefault(); panel!.focus(); return; }
      if (!panel!.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    function handleFocus(event: FocusEvent) {
      if (ownsFocus() && event.target instanceof Node && !panel!.contains(event.target)) closeRef.current?.focus({ preventScroll: true });
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocus);
    // This component remains mounted until AnimatePresence finishes the exit.
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocus);
      for (const [element, previous] of isolated) {
        element.inert = previous.inert;
        if (previous.ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", previous.ariaHidden);
      }
      releaseScroll();
      if (navigationRef.current || document.querySelector('dialog[open], [aria-modal="true"]:not([data-cart-dialog])')) return;
      const fallback = document.querySelector<HTMLElement>('header a[aria-label="Ir al inicio"]');
      (visible(origin) ? origin : visible(fallback) ? fallback : null)?.focus({ preventScroll: true });
    };
  }, [closeCart]);

  return <motion.div ref={overlayRef} className={styles.overlay} data-soky-cart-overlay
    initial={reduceMotion ? false : "initial"} animate="open" exit="exit" custom={reduceMotion}>
    <motion.button type="button" tabIndex={-1} aria-hidden="true" className={styles.backdrop}
      variants={backdropVariants} custom={reduceMotion} onClick={closeCart} />
    <motion.aside ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title"
      data-cart-dialog tabIndex={-1} className={styles.panel} variants={panelVariants} custom={reduceMotion}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Carrito</p>
          <div className={styles.titleLine}>
            <h2 id="cart-drawer-title">TU <span>PEDIDO</span></h2>
            <span className={styles.count} aria-label={hasHydrated ? `${count} ${count === 1 ? "unidad" : "unidades"}` : "Cargando carrito"}>
              {hasHydrated ? count : "…"}
            </span>
          </div>
        </div>
        <button ref={closeRef} type="button" aria-label="Cerrar carrito" className={styles.close} onClick={closeCart}>
          <span ref={glyphRef} className={styles.closeGlyph} aria-hidden="true"><CloseIcon /></span>
        </button>
      </header>
      <div className={styles.scroll}>
        <p className={styles.intro}>Revisa tus favoritos antes de continuar.</p>
        {!hasHydrated ? <div role="status" className={styles.loading} aria-busy="true">
          <p>Cargando tu pedido…</p>
          {[0, 1].map(index => <div key={index} className={styles.skeleton} aria-hidden="true"><i /><div><i /><i /><i /></div></div>)}
        </div> : visibleItems.length === 0 ? <CartEmptyState onNavigate={navigate} /> : <>
          {catalogStatus !== "ready" ? <div className={styles.notice} role="status">
            <p>{catalogStatus === "error" ? "No pudimos actualizar tu carrito." : "Verificando productos y precios…"}</p>
            {catalogStatus === "error" ? <Button type="button" variant="tertiary" onClick={retryCatalog}>Reintentar actualización</Button> : null}
          </div> : mappedItems.some(item => item.issue) ? <p className={styles.notice} role="status">Revisa los productos marcados. Puedes quitarlos del pedido.</p> : null}
          <ul className={styles.items}>
            <AnimatePresence initial={false}>
              {mappedItems.map((item, index) => <CartItemRow key={item.id} item={item}
                description={visibleItems[index].descriptionSnapshot} onNavigate={navigate}
                onDecrease={() => item.quantity === 1 ? remove(item.id) : decrement(item.id)}
                onIncrease={() => increment(item.id)} onRemove={() => remove(item.id)} />)}
            </AnimatePresence>
          </ul>
          <CartDrawerFooter items={visibleItems} currency={currency} onNavigate={navigate} />
        </>}
      </div>
    </motion.aside>
  </motion.div>;
}

export default function CartDrawer({ currency }: CartDrawerProps) {
  const canPortal = useSyncExternalStore(subscribeClient, clientSnapshot, serverSnapshot);
  const isOpen = useCartStore(state => state.isOpen);
  const closeCart = useCartStore(state => state.closeCart);
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const reduceMotion = useReducedMotion() ?? false;
  useEffect(() => {
    if (previousPath.current !== pathname) { previousPath.current = pathname; closeCart(); }
  }, [pathname, closeCart]);
  return canPortal ? createPortal(<MotionConfig reducedMotion="user">
    <AnimatePresence initial={false} custom={reduceMotion}>
      {isOpen ? <CartDrawerPanel key="cart-drawer" currency={currency} reduceMotion={reduceMotion} /> : null}
    </AnimatePresence>
  </MotionConfig>, document.body) : null;
}
