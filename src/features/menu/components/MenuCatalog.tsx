"use client";

import { useEffect, useRef, type MouseEvent } from "react";
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
        <div ref={stripRef} className={styles.strip}>
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
