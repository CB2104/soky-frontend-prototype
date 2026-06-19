"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { NavTabItem } from "@/constants";
import { cn } from "@/lib/cn";
import AnimatedSokyLogo from "../brand/AnimatedSokyLogo";
import WhatsAppSVG from "../brand/WhatsAppSVG";
import CartSVG from "../brand/CartSVG";

type MobileNavDrawerProps = {
  items: NavTabItem[];
  whatsappUrl: string;
};

type ContextualRoute = "/" | "/menu" | "/faq";

type ContextualSection = {
  title: string;
  items: readonly NavTabItem[];
};

const contextualSections = {
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
      { href: "/menu#combos", title: "Combos" },
      { href: "/menu#tempura", title: "Tempura" },
      { href: "/menu#frios", title: "Fríos" },
      { href: "/menu#entradas", title: "Entradas" },
      { href: "/menu#bebidas", title: "Bebidas" },
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
} satisfies Record<ContextualRoute, ContextualSection>;

function getContextualSection(pathname: string): ContextualSection | null {
  if (pathname === "/" || pathname === "/menu" || pathname === "/faq") {
    return contextualSections[pathname];
  }
  return null;
}

const panelVariants = {
  closed: {
    x: "-100%",
  },
  open: {
    x: 0,
  },
};

const linksVariants = {
  closed: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
  open: {
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.08,
    },
  },
};

const linkVariants = {
  closed: {
    opacity: 0,
    x: -18,
  },
  open: {
    opacity: 1,
    x: 0,
  },
};

const topPathClosed = "M 4 6.5 L 20 6.5";
const topPathOpen = "M 6 18 L 18 6";
const bottomPathClosed = "M 4 17.5 L 20 17.5";
const bottomPathOpen = "M 6 6 L 18 18";

const focusableElementSelector = [
  "a[href]",
  "button:not([disabled])",
  'input:not([type="hidden"]):not([disabled])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function MobileNavDrawer({ items, whatsappUrl }: MobileNavDrawerProps) {
  const drawerId = useId();
  const drawerTitleId = `${drawerId}-title`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const reduceMotion = useReducedMotion() ?? false;
  const [isOpen, setIsOpen] = useState(false);
  const contextualSection = getContextualSection(pathname);

  const isItemActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const triggerElement = triggerRef.current;
    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const drawerElement = drawerRef.current;

      if (!drawerElement) {
        return;
      }

      const focusableElements = Array.from(
        drawerElement.querySelectorAll<HTMLElement>(focusableElementSelector),
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
        drawerElement.focus();
        return;
      }

      const activeElement = document.activeElement;

      if (!drawerElement.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (
        event.shiftKey &&
        (activeElement === firstElement || activeElement === drawerElement)
      ) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [isOpen]);

  return (
    <div className="relative z-60 md:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-label={isOpen ? "Cerrar menu" : "Abrir menu"}
        aria-controls={drawerId}
        aria-expanded={isOpen}
        aria-hidden={isOpen}
        tabIndex={isOpen ? -1 : 0}
        className={cn(
          "relative z-60 -ml-2 grid size-11 touch-manipulation place-items-center transition-[color,opacity] active:text-soky-orange",
          isOpen ? "pointer-events-none opacity-0" : "text-soky-white",
        )}
        onClick={() => setIsOpen((current) => !current)}
      >
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
          <motion.path
            d={topPathClosed}
            initial={false}
            animate={isOpen ? "open" : "closed"}
            variants={{
              closed: { d: topPathClosed },
              open: { d: topPathOpen },
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
            }
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
          <motion.path
            animate={isOpen ? "open" : "closed"}
            variants={{
              closed: { opacity: 1 },
              open: { opacity: 0 },
            }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            d="M 4 12 L 20 12"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
          <motion.path
            d={bottomPathClosed}
            initial={false}
            animate={isOpen ? "open" : "closed"}
            variants={{
              closed: { d: bottomPathClosed },
              open: { d: bottomPathOpen },
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
            }
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-40"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={reduceMotion ? undefined : { duration: 0.2 }}
          >
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="absolute inset-0 bg-soky-navy/55"
              onClick={() => setIsOpen(false)}
            />

            <motion.aside
              ref={drawerRef}
              id={drawerId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={drawerTitleId}
              tabIndex={-1}
              className="absolute left-0 top-0 flex h-dvh w-[min(82vw,22rem)] overflow-hidden flex-col border-r border-soky-border bg-soky-white text-soky-ink shadow-2xl focus:outline-none"
              variants={reduceMotion ? undefined : panelVariants}
              initial={reduceMotion ? false : "closed"}
              animate={reduceMotion ? undefined : "open"}
              exit={reduceMotion ? undefined : "closed"}
              transition={
                reduceMotion
                  ? undefined
                  : { type: "spring", stiffness: 360, damping: 34 }
              }
            >
              <header className="flex min-h-20 shrink-0 items-center gap-3 border-b border-soky-blue/20 bg-soky-white px-5 py-4">
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Cerrar navegación"
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-soky-border bg-soky-paper text-soky-blue transition-colors hover:border-soky-orange hover:bg-soky-orange hover:text-soky-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-orange focus-visible:ring-offset-2"
                  onClick={() => setIsOpen(false)}
                >
                  <svg
                    aria-hidden="true"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M6 6L18 18M18 6L6 18"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                  </svg>
                </button>
                <h2 id={drawerTitleId} className="sr-only">
                  Navegación de SOKY
                </h2>
                <div className="ml-auto">
                  <AnimatedSokyLogo title="" className="h-10 w-auto" />
                </div>
              </header>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-soky-paper bg-[url('/images/endless-clouds.svg')] bg-size-[56px_28px] bg-repeat px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <motion.nav
                  className="mt-6 flex flex-col gap-2"
                  variants={reduceMotion ? undefined : linksVariants}
                  initial={reduceMotion ? false : "closed"}
                  animate={reduceMotion ? undefined : "open"}
                  exit={reduceMotion ? undefined : "closed"}
                >
                  {items.map((item) => {
                    const isActive = isItemActive(item.href);

                    return (
                      <motion.div
                        key={item.href}
                        variants={reduceMotion ? undefined : linkVariants}
                      >
                        <Link
                          href={item.href}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "block rounded-full px-5 py-4 text-lg font-black uppercase transition-colors",
                            isActive
                              ? "bg-soky-orange-deep text-soky-white"
                              : "text-soky-ink active:bg-soky-blue-bright active:text-soky-white",
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.title}
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.nav>

                {contextualSection ? (
                  <section
                    aria-labelledby={`${drawerId}-context-heading`}
                    className="mt-8 border-y-2 border-soky-blue py-5"
                  >
                    <h2
                      id={`${drawerId}-context-heading`}
                      className="px-4 text-sm font-black uppercase tracking-wide text-soky-blue"
                    >
                      {contextualSection.title}
                    </h2>

                    <nav
                      aria-label={contextualSection.title}
                      className="mt-3 flex flex-col gap-1"
                    >
                      {contextualSection.items.map((item) => (
                        <Link
                          href={item.href}
                          key={item.href}
                          onClick={() => setIsOpen(false)}
                          className="flex min-h-11 items-center rounded-xl px-4 py-2 font-extrabold transition-colors hover:bg-soky-blue hover:text-soky-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-orange focus-visible:ring-offset-2"
                        >
                          {item.title}
                        </Link>
                      ))}
                    </nav>
                  </section>
                ) : null}

                <section
                  aria-labelledby={`${drawerId}-quick-actions-heading`}
                  className="mt-auto pt-8"
                >
                  <div className="rounded-2xl border border-soky-border bg-soky-white p-4 shadow-soky-card">
                    <h2
                      id={`${drawerId}-quick-actions-heading`}
                      className="text-xl font-black text-soky-blue"
                    >
                      ¿Listo para pedir?
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-soky-muted">
                      Elige tu box y confirma por WhatsApp.
                    </p>

                    <div className="mt-4 grid gap-3">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex w-full touch-manipulation rounded-full bg-soky-orange p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-soky-blue bg-[url('/images/endless-clouds-light.svg')] bg-size-[56px_28px] bg-repeat px-4 text-sm font-bold text-soky-white transition-[background-color,transform] duration-200 group-hover:bg-soky-navy group-active:scale-[0.98] group-active:bg-soky-navy">
                          <span
                            aria-hidden="true"
                            className="grid size-5 shrink-0 place-items-center [&_svg]:size-5"
                          >
                            <WhatsAppSVG />
                          </span>
                          Pedir por WhatsApp
                        </span>
                      </a>

                      <Link
                        href="/cart"
                        className="group inline-flex w-full touch-manipulation rounded-full bg-soky-orange p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-soky-blue bg-[url('/images/endless-clouds-light.svg')] bg-size-[56px_28px] bg-repeat
                         px-4 text-sm font-bold text-soky-white transition-[background-color,transform] duration-200 group-hover:bg-soky-navy group-active:scale-[0.98] group-active:bg-soky-navy">
                          <span
                            aria-hidden="true"
                            className="grid size-5 shrink-0 place-items-center [&_svg]:size-5"
                          >
                            <CartSVG />
                          </span>
                          Ver carrito
                        </span>
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
