"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/products/components/ProductCard";
import { PRODUCT_CARD_IMAGE_SIZES } from "@/features/products/components/ProductCard.constants";
import { menuAnchorId, type MenuSection } from "../menu-sections";
import { getMenuSectionDescription } from "../section-copy";
import { useMenuNavigation } from "../useMenuNavigation";
import styles from "./MenuCatalog.module.css";

type Props = {
  sections: MenuSection[];
  initialDestination: string;
};

export function MenuCatalog({ sections, initialDestination }: Props) {
  const { catalogRef, navRef, activeSlug, navigate } = useMenuNavigation(
    sections,
    initialDestination,
  );
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const [canScrollBackward, setCanScrollBackward] = useState(false);
  const pendingControlFocus = useRef<string | null>(null);

  useEffect(() => {
    const selector = pendingControlFocus.current;
    if (!selector) return;
    pendingControlFocus.current = null;
    navRef.current?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
  }, [canScrollBackward, canScrollForward, navRef]);

  useLayoutEffect(() => {
    const strip = stripRef.current;
    const nav = navRef.current;
    const catalog = catalogRef.current;
    if (!strip || !nav || !catalog) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const backward = strip.scrollLeft > 2;
      const forward = strip.scrollWidth - strip.clientWidth - strip.scrollLeft > 2;
      const active = document.activeElement;
      if (active?.hasAttribute("data-menu-category-next") && !forward) {
        pendingControlFocus.current = backward ? "[data-menu-category-prev]" : "." + styles.chip;
      } else if (active?.hasAttribute("data-menu-category-prev") && !backward) {
        pendingControlFocus.current = forward ? "[data-menu-category-next]" : "." + styles.chip;
      }
      setCanScrollBackward(backward);
      setCanScrollForward(forward);
      catalog.style.setProperty("--menu-strip-height", nav.offsetHeight + "px");
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(nav);
    observer.observe(strip);
    Array.from(strip.children).forEach((chip) => observer.observe(chip));
    strip.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();
    return () => {
      observer.disconnect();
      strip.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      catalog.style.removeProperty("--menu-strip-height");
    };
  }, [catalogRef, navRef]);

  useEffect(() => {
    const catalog = catalogRef.current;
    const nav = navRef.current;
    if (!catalog || !nav || !document.fonts) return;

    let cancelled = false;
    let userInteracted = false;
    let correctionTimer = 0;
    const markInteraction = () => { userInteracted = true; };
    const interactionEvents = ["pointerdown", "touchstart", "wheel", "keydown"] as const;
    interactionEvents.forEach((event) => {
      window.addEventListener(event, markInteraction, { passive: true, once: true });
    });

    const alignDestination = () => {
      if (cancelled || userInteracted) return;

      let hash = "";
      try {
        hash = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        // Un hash inválido conserva el destino inicial de la query.
      }
      const hashTarget = hash ? document.getElementById(hash) : null;
      const targetId = hashTarget && catalog.contains(hashTarget) ? hash : initialDestination;
      if (targetId === "menu-start") return;

      const target = document.getElementById(targetId);
      if (!target || !catalog.contains(target)) return;
      const line = (Number.parseFloat(getComputedStyle(nav).top) || 0) + nav.offsetHeight + 15;
      const correction = target.getBoundingClientRect().top - line;
      if (Math.abs(correction) > 2) {
        window.scrollBy({ top: correction, behavior: "instant" });
      }
    };
    const scheduleAlignment = () => {
      window.clearTimeout(correctionTimer);
      correctionTimer = window.setTimeout(() => {
        window.requestAnimationFrame(alignDestination);
      }, 80);
    };
    const masthead = catalog.closest("main")?.querySelector<HTMLElement>(":scope > header");
    const layoutObserver = new ResizeObserver(scheduleAlignment);
    if (masthead) {
      layoutObserver.observe(masthead);
      masthead.addEventListener("load", scheduleAlignment, true);
    }

    document.fonts.ready.then(scheduleAlignment);
    if (document.readyState === "complete") scheduleAlignment();
    else window.addEventListener("load", scheduleAlignment, { once: true });

    return () => {
      cancelled = true;
      window.clearTimeout(correctionTimer);
      layoutObserver.disconnect();
      masthead?.removeEventListener("load", scheduleAlignment, true);
      window.removeEventListener("load", scheduleAlignment);
      interactionEvents.forEach((event) => window.removeEventListener(event, markInteraction));
    };
  }, [catalogRef, initialDestination, navRef]);

  function moveCategories(direction: -1 | 1) {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({
      left: direction * Math.max(120, strip.clientWidth * 0.8),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }
  const selected = sections
    .flatMap((section) => section.subsections)
    .find((subsection) => menuAnchorId(subsection.slug) === initialDestination);
  const selectedGroup = sections.find(
    (section) => menuAnchorId(section.slug) === initialDestination,
  );
  const priorityProducts = selected?.products
    ?? selectedGroup?.subsections.flatMap((item) => item.products)
    ?? sections[0]?.subsections[0]?.products
    ?? [];
  const priorityIds = new Set(priorityProducts.slice(0, 2).map((product) => product.id));

  useEffect(() => {
    const strip = stripRef.current;
    const chip = strip?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!strip || !chip) return;

    strip.scrollTo({
      left: Math.max(
        0,
        chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2,
      ),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [activeSlug]);

  return (
    <div ref={catalogRef} className={styles.catalog}>
      <div id="menu-start" className={styles.start} />
      <nav ref={navRef} className={styles.nav} aria-label="Secciones del menú">
        <div className={styles.island} data-menu-island data-can-advance={canScrollForward} data-can-retreat={canScrollBackward}>
        <div className={styles.retreat} hidden={!canScrollBackward}>
          <Button size="icon" variant="secondary" type="button"
            aria-label="Ver categorías anteriores" aria-controls="menu-category-strip"
            onClick={() => moveCategories(-1)} data-menu-category-prev>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        </div>
        <div ref={stripRef} id="menu-category-strip" className={styles.strip}>
          <Button
            size="sm"
            variant={activeSlug === "all" ? "primary" : "secondary"}
            href="#menu-start"
            data-transition-ignore="true"
            aria-current={activeSlug === "all" ? "location" : undefined}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => navigate(event, "menu-start")}
            className={styles.chip}
          >
            Todo el menú
          </Button>
          {sections.map((section) => (
            <Button
              size="sm"
              variant={activeSlug === section.slug ? "primary" : "secondary"}
              key={section.slug}
              href={"#" + menuAnchorId(section.slug)}
              data-transition-ignore="true"
              aria-current={activeSlug === section.slug ? "location" : undefined}
              onClick={(event: MouseEvent<HTMLAnchorElement>) => navigate(event, menuAnchorId(section.slug))}
              className={styles.chip}
            >
              {section.title}
            </Button>
          ))}
        </div>
        <div className={styles.advance} hidden={!canScrollForward}>
          <Button
            size="icon"
            variant="secondary"
            type="button"
            aria-label="Ver más categorías"
            aria-controls="menu-category-strip"
            onClick={() => moveCategories(1)}
            data-menu-category-next
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        </div>
        </div>
      </nav>
      <div className={styles.sections}>
        {sections.map((section) => {
          const description = getMenuSectionDescription(section.slug);
          const sectionId = menuAnchorId(section.slug);

          return (
            <section
              key={section.slug}
              id={sectionId}
              className={styles.section}
              aria-labelledby={sectionId + "-title"}
              aria-describedby={description ? sectionId + "-description" : undefined}
            >
              <header className={styles.sectionHeading}>
                <div className={styles.sectionTitleRow}>
                  <h2 id={sectionId + "-title"}>{section.title}</h2>
                  <span className={styles.count}>
                    {section.count} {section.count === 1 ? "opción" : "opciones"}
                  </span>
                </div>
                {description ? (
                  <p id={sectionId + "-description"} className={styles.description}>
                    {description}
                  </p>
                ) : null}
              </header>
              {section.subsections.map((subsection) => (
                <div
                  key={subsection.slug}
                  className={styles.subsection}
                  id={section.subsections.length > 1 ? menuAnchorId(subsection.slug) : undefined}
                >
                  {section.subsections.length > 1 ? (
                    <h3 className={styles.subheading}>{subsection.title}</h3>
                  ) : null}
                  {subsection.products.length === 0 ? (
                    <p className={styles.empty}>No hay productos en esta sección por ahora.</p>
                  ) : (
                    <div className={styles.grid}>
                      {subsection.products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          prefetchDetails={false}
                          priority={priorityIds.has(product.id)}
                          imageSizes={PRODUCT_CARD_IMAGE_SIZES}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
