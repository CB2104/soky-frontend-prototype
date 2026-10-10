import Link from "next/link";
import type { ProductDetailViewModel } from "../detail-mapper";
import { ProductDetailActions } from "./ProductDetailActions";
import { ProductDetailImage } from "./ProductDetailImage";
import styles from "./ProductDetailContent.module.css";

type Props = {
  product: ProductDetailViewModel;
  headingTag?: "h1" | "h2";
  imageSizes?: string;
};

export function ProductDetailContent({
  product,
  headingTag = "h1",
  imageSizes,
}: Props) {
  const Heading = headingTag;
  const SectionHeading = headingTag === "h1" ? "h2" : "h3";
  const titleId = "product-" + headingTag + "-" + product.card.slug;
  const hasInformation = Boolean(
    product.description || product.metadata || product.groups.length,
  );

  return (
    <div className={styles.root} data-variant={product.card.variant}>
      <div className={styles.layout}>
        <ProductDetailImage
          product={product.card}
          imageStatus={product.imageStatus}
          imageSizes={imageSizes}
        />
        <section className={styles.info} aria-labelledby={titleId}>
          <Link
            href={product.categoryHref}
            data-transition-ignore="true"
            className={styles.category}
          >
            {product.categoryName}
          </Link>
          <Heading id={titleId} className={styles.title}>
            {product.card.title}
          </Heading>
          {product.card.badge ? (
            <span className={styles.badge}>
              <span className={styles.badgeMark} aria-hidden="true">
                {product.card.variant === "promo"
                  ? "%"
                  : <span className={styles.star} />}
              </span>
              {product.card.badge}
            </span>
          ) : null}
          {product.metadata ? (
            <p className={styles.metadata}>{product.metadata}</p>
          ) : null}
          {product.description ? (
            <p className={styles.description}>{product.description}</p>
          ) : null}
          {!hasInformation ? (
            <p className={styles.pending}>Detalles del producto por confirmar.</p>
          ) : null}
          {product.labels.length ? (
            <p className={styles.editorial}>{product.labels.join(" · ")}</p>
          ) : null}
          {product.groups.map((group) => (
            <div key={group.title} className={styles.group}>
              <SectionHeading className={styles.groupTitle}>
                {group.title}
              </SectionHeading>
              <ul className={styles.list}>
                {group.items.map((item, index) => (
                  <li key={group.title + "-" + index}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className={styles.price}>
            {product.hasValidPrice
              ? product.card.priceLabel
              : "Precio por confirmar"}
          </p>
          <ProductDetailActions
            product={product.card}
            hasValidPrice={product.hasValidPrice}
          />
          {product.allergens.length ? (
            <div className={styles.group}>
              <SectionHeading className={styles.groupTitle}>
                Alérgenos
              </SectionHeading>
              <p className={styles.list}>{product.allergens.join(", ")}</p>
            </div>
          ) : (
            <p className={styles.allergenPending}>
              Información de alérgenos por confirmar.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
