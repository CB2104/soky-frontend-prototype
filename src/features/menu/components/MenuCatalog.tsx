"use client";

import { useEffect, useRef } from "react";
import { ProductCard } from "@/features/products/components/ProductCard";
import { menuAnchorId, type MenuSection } from "../menu-sections";
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
          <a
            href="#menu-start"
            data-transition-ignore="true"
            aria-current={activeSlug === "all" ? "location" : undefined}
            onClick={(event) => navigate(event, "menu-start")}
            className={styles.chip}
          >
            Todo el menú
          </a>
          {sections.map((section) => (
            <a
              key={section.slug}
              href={"#" + menuAnchorId(section.slug)}
              data-transition-ignore="true"
              aria-current={activeSlug === section.slug ? "location" : undefined}
              onClick={(event) => navigate(event, menuAnchorId(section.slug))}
              className={styles.chip}
            >
              {section.title}
            </a>
          ))}
        </div>
      </nav>
      <div className={styles.sections}>
        {sections.map((section) => (
          <section
            key={section.slug}
            id={menuAnchorId(section.slug)}
            className={styles.section}
            aria-labelledby={menuAnchorId(section.slug) + "-title"}
          >
            <header className={styles.sectionHeading}>
              <h2 id={menuAnchorId(section.slug) + "-title"}>{section.title}</h2>
              <span>
                {section.count} {section.count === 1 ? "opción" : "opciones"}
              </span>
            </header>
            {section.subsections.map((subsection) => (
              <div
                key={subsection.slug}
                className={styles.subsection}
                id={section.subsections.length > 1
                  ? menuAnchorId(subsection.slug)
                  : undefined}
              >
                {section.subsections.length > 1 ? (
                  <h3 className={styles.subheading}>{subsection.title}</h3>
                ) : null}
                {subsection.products.length === 0 ? (
                  <p className={styles.empty}>
                    No hay productos en esta sección por ahora.
                  </p>
                ) : (
                  <div className={styles.grid}>
                    {subsection.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        priority={priorityIds.has(product.id)}
                        imageSizes="(max-width: 639px) and (orientation: portrait) calc(50vw - 1.5rem), (min-width: 380px) 340px, calc(100vw - 2rem)"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
