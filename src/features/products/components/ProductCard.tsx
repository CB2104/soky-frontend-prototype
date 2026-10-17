"use client";

import { Button } from "@/components/ui/button";

import Image from "next/image";
import Link from "next/link";
import { PercentIcon, PlusSVG } from "@/components/brand/IconsSVG";
import { CardFans, CardWaves } from "@/components/brand/CardArtwork";
import { useAddProductToCart } from "../useAddProductToCart";
import { CompactProductCard } from "./CompactProductCard";
import type { ProductCardViewModel } from "@/features/products/mappers";
import { PRODUCT_CARD_IMAGE_SIZES } from "./ProductCard.constants";
import styles from "./ProductCard.module.css";
import { useRef, useState } from "react";
import { useInView } from "motion/react";

type ProductCardProps = {
  product: ProductCardViewModel;
  priority?: boolean;
  imageSizes?: string;
  presentation?: "card" | "compact";
  onAdd?: (product: ProductCardViewModel) => void;
};

export function ProductCard({
  product,
  priority = false,
  presentation = "card",
  onAdd,
  imageSizes = PRODUCT_CARD_IMAGE_SIZES,
}: ProductCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const isInView = useInView(cardRef, { amount: 0.35, once: false });
  const addProduct = useAddProductToCart();
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const imageFailed = failedImageUrl === product.imageUrl;
  const badgeContent = product.badge ? (
    <>
      <span className={styles.badgeMark} aria-hidden="true">
        {product.variant === "featured" ? (
          <span className={styles.starMark} />
        ) : (
          <PercentIcon className={styles.percentMark} />
        )}
      </span>
      <span>{product.badge}</span>
    </>
  ) : null;
  const cardClassName = [
    styles.card,
    !product.isAvailable ? styles.unavailable : "",
  ]
    .filter(Boolean)
    .join(" ");

  function handleAdd() {
    if (!product.isAvailable) return;

    if (onAdd) onAdd(product);
    else addProduct(product);
  }

  if (presentation === "compact") return <CompactProductCard product={product} onAdd={handleAdd} />;

  return (
    <article
      ref={cardRef}
      className={cardClassName}
      data-variant={product.variant}
      data-in-view={isInView}
    >
      <Link
        href={"/menu/" + encodeURIComponent(product.slug)}
        scroll={false}
        data-transition-ignore="true"
        className={styles.link}
        aria-label={
          "Ver detalles de " +
          product.title +
          (product.isAvailable ? "" : ", agotado")
        }
      >
        <div className={styles.media}>
          {imageFailed ? (
            <div className={styles.imagePlaceholder}>Imagen no disponible</div>
          ) : (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt}
              fill
              loading={priority ? "eager" : "lazy"}
              sizes={imageSizes}
              className={styles.image}
              onError={() => setFailedImageUrl(product.imageUrl)}
            />
          )}

          <CardFans className={styles.fanCluster} />

          {badgeContent ? (
            <span className={`${styles.badge} ${styles.badgeDesktop}`}>
              {badgeContent}
            </span>
          ) : null}

          {!product.isAvailable ? (
            <div className={styles.unavailableOverlay} aria-hidden="true">
              <span>Agotado</span>
            </div>
          ) : null}
        </div>

        <div className={styles.body}>
          <CardWaves className={styles.divider} />

          <span className={styles.panelSurface} aria-hidden="true" />

          <span className={styles.bodyPattern} aria-hidden="true" />

          <div className={styles.bodyContent}>
            <div
              className={`${styles.badgeSlot} ${badgeContent ? "" : styles.badgeSlotEmpty}`}
            >
              {badgeContent ? (
                <span className={`${styles.badge} ${styles.badgeMobile}`}>
                  {badgeContent}
                </span>
              ) : null}
            </div>

            <h3 className={styles.title}>{product.title}</h3>

            <p className={styles.metadata}>{product.metadata}</p>

            <p className={styles.description}>{product.description}</p>

            <div className={styles.footer}>
              <span className={styles.price}>{product.priceLabel}</span>
            </div>
          </div>
        </div>
      </Link>

      <Button size="icon" variant="primary"
        type="button"
        className={styles.addButton}
        disabled={!product.isAvailable}
        onClick={handleAdd}
        aria-label={
          product.isAvailable
            ? "Agregar " + product.title + " al carrito"
            : product.title + " no disponible"
        }
      >
        <PlusSVG
          className={styles.plusIcon}
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        />
      </Button>
    </article>
  );
}
