"use client";

import {
  CloseIcon,
  ContactIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppSVG,
} from "@/components/brand/IconsSVG";
import type { AnalyticsEventType } from "@/contracts/api";
import { trackEvent } from "@/features/analytics/client";
import { useCartStore } from "@/features/cart/store";
import { useUiOverlayStore } from "@/features/ui/store";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

export type ContactSpeedDialProps = {
  whatsappUrl: string;
  instagramUrl?: string;
  tiktokUrl?: string;
};

type ContactChannel = "whatsapp" | "instagram" | "tiktok";

type ContactAction = {
  id: ContactChannel;
  label: string;
  href: string;
  icon: ReactNode;
  eventType: AnalyticsEventType;
};

const actionsVariants: Variants = {
  closed: {
    opacity: 0,
    y: 8,
    transition: {
      duration: 0.12,
      when: "afterChildren",
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
  open: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.16,
      when: "beforeChildren",
      staggerChildren: 0.06,
    },
  },
};

const actionVariants: Variants = {
  closed: {
    opacity: 0,
    x: 8,
  },
  open: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.18,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function ContactSpeedDial(props: ContactSpeedDialProps) {
  const pathname = usePathname();
  const isHiddenRoute =
    pathname === "/cart" ||
    pathname.startsWith("/cart/") ||
    pathname === "/order-intents" ||
    pathname.startsWith("/order-intents/");
  const isCartOpen = useCartStore((state) => state.isOpen);

  const closeContactSpeedDial = useUiOverlayStore(
    (state) => state.closeContactSpeedDial,
  );

  useEffect(() => {
    closeContactSpeedDial();
  }, [closeContactSpeedDial, pathname]);

  useEffect(() => {
    if (!isCartOpen) {
      return;
    }

    closeContactSpeedDial();
  }, [closeContactSpeedDial, isCartOpen]);

  if (isCartOpen || isHiddenRoute) {
    return null;
  }
  return <ContactSpeedDialContent {...props} />;
}
function ContactSpeedDialContent({
  whatsappUrl,
  instagramUrl,
  tiktokUrl,
}: ContactSpeedDialProps) {
  const containerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const actions: ContactAction[] = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: whatsappUrl,
      icon: <WhatsAppSVG />,
      eventType: "contact_whatsapp_click",
    },
  ];

  const actionsId = useId();
  const isOpen = useUiOverlayStore((state) => state.isContactSpeedDialOpen);

  const closeContactSpeedDial = useUiOverlayStore(
    (state) => state.closeContactSpeedDial,
  );
  const toggleContactSpeedDial = useUiOverlayStore(
    (state) => state.toggleContactSpeedDial,
  );
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && !containerRef.current?.contains(target)) {
        closeContactSpeedDial();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      closeContactSpeedDial();
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeContactSpeedDial, isOpen]);

  if (instagramUrl) {
    actions.push({
      id: "instagram",
      label: "Instagram",
      href: instagramUrl,
      icon: <InstagramIcon />,
      eventType: "contact_instagram_click",
    });
  }

  if (tiktokUrl) {
    actions.push({
      id: "tiktok",
      label: "TikTok",
      href: tiktokUrl,
      icon: <TikTokIcon />,
      eventType: "contact_tiktok_click",
    });
  }

  return (
    <aside
      ref={containerRef}
      aria-label="Opciones de contacto"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-20 flex flex-col-reverse items-end gap-3"
    >
      <motion.button
        type="button"
        ref={triggerRef}
        aria-expanded={isOpen}
        aria-controls={actionsId}
        aria-label={
          isOpen ? "Cerrar opciones de contacto" : "Abrir opciones de contacto"
        }
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        className={[
          "group inline-grid size-14 touch-manipulation place-items-center rounded-full",
          "border border-soky-orange/70 bg-soky-white p-1",
          "shadow-[0_12px_24px_rgb(236_99_35/0.18)]",
          "transition-[border-color,background-color,transform] duration-200",
          "hover:border-soky-blue active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-soky-focus focus-visible:ring-offset-2",
        ].join(" ")}
        onClick={() => {
          if (!isOpen) {
            trackEvent({
              eventType: "contact_speed_dial_open",
              entityType: "page",
              metadata: {
                placement: "floating_speed_dial",
              },
            });
          }

          toggleContactSpeedDial();
        }}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={isOpen ? "close" : "contact"}
            aria-hidden="true"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    scale: 0.8,
                  }
            }
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={
              reduceMotion
                ? undefined
                : {
                    opacity: 0,
                    scale: 0.8,
                  }
            }
            transition={{ duration: reduceMotion ? 0 : 0.12 }}
            className={[
              "grid size-full place-items-center rounded-full",
              "bg-soky-orange bg-[url('/images/endless-clouds-light.svg')] bg-size-[56px_28px] bg-repeat text-soky-white/90",
              "transition-colors duration-200",
              "group-hover:bg-soky-blue group-hover:text-soky-white",
              isOpen && "bg-soky-blue text-soky-white",
              "[&_svg]:size-5",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {isOpen ? <CloseIcon /> : <ContactIcon />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="contact-actions"
            id={actionsId}
            variants={reduceMotion ? undefined : actionsVariants}
            initial={reduceMotion ? false : "closed"}
            animate={reduceMotion ? undefined : "open"}
            exit={reduceMotion ? undefined : "closed"}
            className="flex flex-col items-end gap-2 pb-1"
          >
            {actions.map((action) => (
              <motion.a
                key={action.id}
                href={action.href}
                target="_blank"
                rel="noreferrer"
                variants={reduceMotion ? undefined : actionVariants}
                onClick={() => {
                  trackEvent({
                    eventType: action.eventType,
                    entityType: "page",
                    metadata: {
                      channel: action.id,
                      placement: "floating_speed_dial",
                    },
                  });

                  closeContactSpeedDial();
                }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 28,
                }}
                className={[
                  "group inline-flex min-h-12 touch-manipulation rounded-full",
                  "border border-soky-orange/70 bg-soky-white p-1",
                  "shadow-[0_12px_24px_rgb(236_99_35/0.14)]",
                  "transition-[border-color,background-color,transform] duration-200",
                  "hover:border-soky-blue active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-soky-focus focus-visible:ring-offset-2",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex min-h-10 items-center gap-2 rounded-full",
                    "bg-soky-orange bg-[url('/images/soky-wave-outline-white-soft.svg')] bg-size-[360px_120px] bg-position-[center_58%] bg-no-repeat",
                    "px-3 pr-4 text-soky-white/90",
                    "transition-colors duration-200",
                    "group-hover:bg-soky-blue group-hover:text-soky-white",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className="grid size-7 shrink-0 place-items-center text-soky-white/80 transition-colors group-hover:text-soky-white [&_svg]:size-4.5"
                  >
                    {action.icon}
                  </span>

                  <span className="text-sm font-extrabold leading-none text-soky-white">
                    {action.label}
                  </span>
                </span>

                <span className="sr-only">, abre en una nueva pestaña</span>
              </motion.a>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </aside>
  );
}
