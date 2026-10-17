"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import type { MouseEvent, RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";
import { usePathname } from "next/navigation";
import { useTransitionRouter } from "next-transition-router";
import AnimatedSokyLogo from "@/components/brand/AnimatedSokyLogo";
import { CartSVG, CloseIcon, WhatsAppSVG } from "@/components/brand/IconsSVG";
import { Button } from "@/components/ui/button";
import type { NavTabItem } from "@/constants";
import { menuAnchorId } from "@/features/menu/menu-sections";
import { useUiOverlayStore } from "@/features/ui/store";
import { cn } from "@/lib/cn";
import { lockBodyScroll } from "@/lib/body-scroll-lock";
import styles from "./MobileNavDrawer.module.css";

type MobileNavDrawerProps = {
  items: NavTabItem[];
  whatsappUrl: string;
};

type ContextualSection = { title: string; items: readonly NavTabItem[] };
type PanelProps = MobileNavDrawerProps & {
  drawerId: string;
  pathname: string;
  reduceMotion: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

const drawerMedia = "(max-width: 767px), (max-height: 500px) and (orientation: landscape)";
const focusableSelector = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';
const contextualSections: Record<string, ContextualSection> = {
  "/": {
    title: "En esta página",
    items: [
      { href: "/#promos", title: "Promos" },
      { href: "/#destacados", title: "Destacados" },
      { href: "/#ubicacion", title: "Ubicación" },
    ],
  },
  "/menu": {
    title: "Categorías",
    items: [
      { href: "/menu#" + menuAnchorId("combo-boxs"), title: "Combos" },
      { href: "/menu#" + menuAnchorId("piezas-tempura"), title: "Tempura" },
      { href: "/menu#" + menuAnchorId("piezas-frias"), title: "Fríos" },
      { href: "/menu#" + menuAnchorId("entradas"), title: "Entradas" },
      { href: "/menu#" + menuAnchorId("bebidas"), title: "Bebidas" },
    ],
  },
  "/faq": {
    title: "Ayuda",
    items: [
      { href: "/faq#pedidos", title: "Pedidos" },
      { href: "/faq#pagos", title: "Pagos" },
      { href: "/faq#delivery", title: "Delivery" },
    ],
  },
};

const panelVariants: Variants = {
  initial: (reduce: boolean) => ({ x: reduce ? 0 : "-100%" }),
  open: (reduce: boolean) => ({ x: 0, transition: { duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] } }),
  exit: (reduce: boolean) => ({ x: reduce ? 0 : "-100%", transition: { duration: reduce ? 0 : 0.24, ease: [0.4, 0, 0.8, 0.4] } }),
};
const backdropVariants: Variants = {
  initial: (reduce: boolean) => ({ opacity: reduce ? 1 : 0 }),
  open: (reduce: boolean) => ({ opacity: 1, transition: { duration: reduce ? 0 : 0.18 } }),
  exit: (reduce: boolean) => ({ opacity: 0, transition: { duration: reduce ? 0 : 0.24 } }),
};
function subscribeHydration() { return () => {}; }
function clientSnapshot() { return true; }
function serverSnapshot() { return false; }
function visible(element: HTMLElement | null): element is HTMLElement {
  return !!element?.isConnected && element.getClientRects().length > 0
    && getComputedStyle(element).visibility !== "hidden" && !element.closest("[inert]");
}

function MobileNavPanel({ items, whatsappUrl, drawerId, pathname, reduceMotion, onClose, triggerRef }: PanelProps) {
  const isPresent = useIsPresent();
  const router = useTransitionRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const glyphRef = useRef<HTMLSpanElement>(null);
  const glyphSnapshot = useRef<{ transform: string; opacity: string } | null>(null);
  const contextualSection = contextualSections[pathname];
  const titleId = drawerId + "-title";

  function navigate(event: MouseEvent<HTMLElement>, href: string) {
    onClose();
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
      || event.shiftKey || event.altKey) return;
    // Next Link prevents the delegated auto handler from seeing an uncancelled click.
    event.preventDefault();
    router.push(href);
  }

  useEffect(() => {
    const glyph = glyphRef.current;
    if (!glyph || reduceMotion) return;
    const current = getComputedStyle(glyph);
    const start = glyphSnapshot.current ?? { transform: current.transform, opacity: current.opacity };
    // A filled exit animation keeps hover-out from reversing the closing X.
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

    const trigger = triggerRef.current;
    const releaseScroll = lockBodyScroll();
    const isolated = new Map<HTMLElement, { inert: boolean; ariaHidden: string | null }>();

    // Move focus before hiding the background that contains the trigger.
    closeRef.current?.focus({ preventScroll: true });
    function isolateBackground() {
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
    observer.observe(document.body, { childList: true });

    function focusable() {
      return Array.from(panel!.querySelectorAll<HTMLElement>(focusableSelector)).filter(visible);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (!first || !last) { event.preventDefault(); panel!.focus(); return; }
      if (!panel!.contains(document.activeElement)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
    function handleFocus(event: FocusEvent) {
      if (event.target instanceof Node && !panel!.contains(event.target)) closeRef.current?.focus({ preventScroll: true });
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocus);

    // AnimatePresence keeps this component mounted through the complete exit.
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
      const anotherModal = Array.from(document.querySelectorAll<HTMLElement>('[aria-modal="true"]'))
        .some(element => element !== panel && visible(element));
      if (anotherModal) return;
      const fallback = document.querySelector<HTMLElement>('header a[aria-label="Ir al inicio"]');
      const target = visible(trigger) ? trigger : visible(fallback) ? fallback : null;
      target?.focus({ preventScroll: true });
    };
  }, [onClose, triggerRef]);

  return (
    <motion.div ref={overlayRef} className={styles.overlay} data-soky-mobile-nav-overlay
      initial={reduceMotion ? false : "initial"} animate="open" exit="exit" custom={reduceMotion}>
      <motion.button type="button" tabIndex={-1} aria-hidden="true" className={styles.backdrop}
        variants={backdropVariants} custom={reduceMotion} onClick={onClose} />
      <motion.aside ref={panelRef} id={drawerId} role="dialog" aria-modal="true"
        aria-labelledby={titleId} tabIndex={-1} className={styles.panel}
        variants={panelVariants} custom={reduceMotion}>
        <header className={styles.panelHeader}>
          <h2 id={titleId} className={styles.srOnly}>Navegación de SOKY</h2>
          <div className={styles.logoSlot} aria-hidden="true">
            <AnimatedSokyLogo title="" white="#fffdf7" orange="#fe6402"
              className={styles.logo} wrapperClassName={styles.logoWrapper} />
          </div>
          <button ref={closeRef} type="button" aria-label="Cerrar navegación"
            className={styles.close} onClick={onClose}>
            <span ref={glyphRef} aria-hidden="true" className={styles.closeGlyph}>
              <CloseIcon />
            </span>
          </button>
        </header>
        <div className={styles.scroll}>
          <nav className={styles.mainNav} aria-label="Navegación principal">
            {items.map(item => {
              const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
              return <Button key={item.href} href={item.href} variant="secondary" secondaryTone={active ? "b" : "a"}
                aria-current={active ? "page" : undefined} className={styles.mainLink} onClick={event => navigate(event, item.href)}>{item.title}</Button>;
            })}
          </nav>
          {contextualSection ? <section className={styles.context} aria-labelledby={drawerId + "-context"}>
            <h3 id={drawerId + "-context"}>{contextualSection.title}</h3>
            <nav className={styles.contextLinks} aria-label={contextualSection.title}>
              {contextualSection.items.map(item => <Button key={item.href} href={item.href} variant="tertiary"
                data-transition-ignore="true" onClick={onClose}>{item.title}</Button>)}
            </nav>
          </section> : null}
          <section className={styles.order} aria-labelledby={drawerId + "-order"}>
            <h3 id={drawerId + "-order"}>¿Listo para pedir?</h3>
            <p>Elige tu box y confirma por WhatsApp.</p>
            <div className={styles.orderLinks}>
              <Button href={whatsappUrl} variant="primary" target="_blank" rel="noopener noreferrer" onClick={onClose}>
                <span className={styles.actionLabel}><WhatsAppSVG aria-hidden="true" />Pedir por WhatsApp</span>
              </Button>
              <Button href="/cart" variant="primary" onClick={event => navigate(event, "/cart")}>
                <span className={styles.actionLabel}><CartSVG aria-hidden="true" />Ver carrito</span>
              </Button>
            </div>
          </section>
        </div>
      </motion.aside>
    </motion.div>
  );
}

export function MobileNavDrawer({ items, whatsappUrl }: MobileNavDrawerProps) {
  const hydrated = useSyncExternalStore(subscribeHydration, clientSnapshot, serverSnapshot);
  const drawerId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const reduceMotion = useReducedMotion() ?? false;
  const isOpen = useUiOverlayStore(state => state.isMobileNavOpen);
  const openMobileNav = useUiOverlayStore(state => state.openMobileNav);
  const closeMobileNav = useUiOverlayStore(state => state.closeMobileNav);

  useEffect(() => {
    if (previousPath.current !== pathname) { previousPath.current = pathname; closeMobileNav(); }
  }, [pathname, closeMobileNav]);

  useEffect(() => {
    const query = window.matchMedia(drawerMedia);
    const check = () => { if (!query.matches) closeMobileNav(); };
    check();
    query.addEventListener("change", check);
    return () => query.removeEventListener("change", check);
  }, [closeMobileNav]);

  return <>
    <div className={styles.shell}>
      <button ref={triggerRef} type="button" aria-label="Abrir menú" aria-haspopup="dialog"
        aria-controls={drawerId} aria-expanded={isOpen} aria-hidden={isOpen} tabIndex={isOpen ? -1 : 0}
        className={cn(styles.trigger, isOpen && styles.triggerHidden)} onClick={openMobileNav}>
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M 4 6.5 L 20 6.5" /><path d="M 4 12 L 20 12" /><path d="M 4 17.5 L 20 17.5" />
        </svg>
      </button>
    </div>
    {hydrated ? createPortal(<AnimatePresence initial={false} custom={reduceMotion}>
      {isOpen ? <MobileNavPanel key="mobile-navigation" items={items} whatsappUrl={whatsappUrl}
        drawerId={drawerId} pathname={pathname} reduceMotion={reduceMotion} onClose={closeMobileNav} triggerRef={triggerRef} /> : null}
    </AnimatePresence>, document.body) : null}
  </>;
}
