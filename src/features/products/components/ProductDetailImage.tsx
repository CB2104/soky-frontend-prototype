"use client";

import Image from "next/image";
import { useState } from "react";
import { CardFans, CardWaves } from "@/components/brand/CardArtwork";
import type { ProductDetailViewModel } from "../detail-mapper";
import styles from "./ProductDetailContent.module.css";

type Props = {
  product: ProductDetailViewModel["card"];
  imageStatus: ProductDetailViewModel["imageStatus"];
  imageSizes?: string;
};

export function ProductDetailImage({
  product,
  imageStatus,
  imageSizes = "(min-width: 1212px) 680px, (min-width: 928px) calc(60vw - 3rem), calc(100vw - 2rem)",
}: Props) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const pending = imageStatus === "PENDING";
  const failed = failedImageUrl === product.imageUrl;

  return (
    <figure className={styles.figure}>
      <div
        className={styles.media}
        data-variant={product.variant}
        data-available={product.isAvailable}
      >
        {pending || failed ? (
          <div className={styles.placeholder}>
            <Image
              src="/images/products/detail-photo-pending-icon.svg"
              alt=""
              aria-hidden="true"
              width={58}
              height={48}
            />
            <span>{pending ? "Fotografía por confirmar" : "Imagen no disponible"}</span>
          </div>
        ) : (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            loading="eager"
            sizes={imageSizes}
            className={styles.image}
            onError={() => setFailedImageUrl(product.imageUrl)}
          />
        )}
        <CardFans className={styles.fans} />
        <CardWaves className={styles.waves} />
        {!product.isAvailable ? (
          <div className={styles.unavailableOverlay}>
            <span>Agotado</span>
          </div>
        ) : null}
      </div>
      {imageStatus === "PROVISIONAL" && !failed ? (
        <figcaption className={styles.caption}>Imagen referencial.</figcaption>
      ) : null}
    </figure>
  );
}
