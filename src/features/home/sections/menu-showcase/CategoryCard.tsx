"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useInView } from "motion/react";
import { ArrowRightIcon } from "@/components/brand/IconsSVG";
import type { CategoryCardViewModel } from "./category-card-data";
import styles from "./CategoryCard.module.css";

type CategoryCardProps = {
  category: CategoryCardViewModel;
  activeIndex: number;
};

export function CategoryCard({ category, activeIndex }: CategoryCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const inView = useInView(cardRef, { amount: 0.35, once: false });
  const ready = category.images.every((image) => loaded[image.src] && !failed[image.src]);

  return (
    <article
      ref={cardRef}
      className={styles.card}
      data-category-card
      data-category-id={category.id}
      data-ready={ready}
      data-in-view={inView}
      data-tone={category.tone}
    >
      <Link
        href={category.href}
        className={styles.link}
        aria-label={"Explorar " + category.title + " en el menú"}
      >
        <div className={styles.media}>
          {category.images.map((image, index) => (
            <div
              key={image.src}
              className={styles.photo}
              data-active={activeIndex === index}
              aria-hidden={activeIndex !== index}
            >
              {failed[image.src] ? (
                <span className={styles.imageFallback}>Imagen no disponible</span>
              ) : (
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1280px) 304px, (min-width: 1024px) calc((100vw - 6rem) / 4), (min-width: 640px) and (orientation: landscape) calc((100vw - 6rem) / 4), calc((100vw - 3.5rem) / 2)"
                  loading="lazy"
                  className={styles.image}
                  onLoad={() => setLoaded((previous) => previous[image.src]
                    ? previous
                    : { ...previous, [image.src]: true })}
                  onError={() => setFailed((previous) => ({ ...previous, [image.src]: true }))}
                />
              )}
            </div>
          ))}
        </div>

        <div className={styles.curtain} aria-hidden="true">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} data-card-row={row} className={styles.curtainRow}>
              {[0, 1, 2, 3].map((column) => (
                <span key={column} className={styles.tile} />
              ))}
            </div>
          ))}
        </div>

        <span className={styles.shade} aria-hidden="true" />
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{category.eyebrow}</p>
          <h3 className={styles.title}>{category.title}</h3>
        </div>
        <span className={styles.arrow} aria-hidden="true">
          <ArrowRightIcon strokeWidth={2} />
        </span>
      </Link>
    </article>
  );
}
