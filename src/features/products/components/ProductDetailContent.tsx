import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { DetailGroup, ProductDetailViewModel } from "../detail-mapper";
import { ProductBadgeMark } from "./ProductBadgeMark";
import { ProductDetailActions } from "./ProductDetailActions";
import { ProductDetailImage } from "./ProductDetailImage";
import styles from "./ProductDetailContent.module.css";

type Props = {
  product: ProductDetailViewModel;
  headingTag?: "h1" | "h2";
  imageSizes?: string;
  presentation?: "page" | "dialog";
};

const beerTone: Record<string, string> = {
  light: "#F5CC2B",
  zulia: "#20925A",
  negra: "#2D241E",
  "solera azul": "#2A66D3",
  "solera verde": "#23874D",
};

function toneForBeer(name: string) {
  return beerTone[name.trim().toLocaleLowerCase("es-VE")] ?? "#838DA0";
}

function DetailGroup({
  group,
  headingTag,
}: {
  group: DetailGroup;
  headingTag: "h1" | "h2";
}) {
  const SectionHeading = headingTag === "h1" ? "h2" : "h3";

  return (
    <section
      className={styles.group}
      data-group={group.kind}
      aria-label={group.kind === "beer" ? group.title : undefined}
    >
      {group.kind !== "beer" ? (
        <SectionHeading className={styles.groupTitle}>{group.title}</SectionHeading>
      ) : null}
      {group.kind === "composition" ? (
        <ul className={styles.compositionList}>
          {group.items.map((item, index) => {
            const normalizedType = item.type.trim().toLocaleLowerCase("es-VE");
            const icon = normalizedType.includes("tempura")
              ? "/images/products/detail-fire.svg"
              : normalizedType.includes("fría") || normalizedType.includes("fria")
                ? "/images/products/detail-snowflake.svg"
                : undefined;

            return (
              <li key={`${item.type}-${index}`} className={styles.compositionItem}>
                {icon ? (
                  <Image src={icon} alt="" aria-hidden="true" width={34} height={34} />
                ) : null}
                <span>
                  <strong>{item.quantity} piezas</strong>
                  <span>{item.type}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {group.kind === "includes" ? (
        <ul className={styles.includesList}>
          {group.items.map((item, index) => (
            <li key={`${item.name}-${index}`}>
              {item.icon ? (
                <Image
                  src={item.icon}
                  alt=""
                  aria-hidden="true"
                  width={36}
                  height={36}
                />
              ) : null}
              <span>
                {item.quantity !== undefined ? `${item.quantity} ` : ""}
                {item.name}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {group.kind === "beer" ? (
        <div className={styles.beerDetails}>
          <div className={styles.beerPresentation}>
            <SectionHeading className={styles.beerSubheading}>Presentación</SectionHeading>
            <div className={styles.beerQuantity}>
              <Image
                src="/images/products/detail-beer-bottle.svg"
                alt=""
                aria-hidden="true"
                width={24}
                height={54}
              />
              <strong>{group.quantity} {group.unit}</strong>
            </div>
          </div>
          <div className={styles.beerVariants}>
            <SectionHeading className={styles.beerSubheading}>Variedades</SectionHeading>
            <ul>
              {group.variants.map((name) => (
                <li
                  key={name}
                  style={{ "--beer-tone": toneForBeer(name) } as CSSProperties}
                >
                  <span className={styles.beerDot} aria-hidden="true" />
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      {group.kind === "variants" ? (
        <ul className={styles.variantsList}>
          {group.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : null}
    </section>
  );
}

export function ProductDetailContent({
  product,
  headingTag = "h1",
  imageSizes,
  presentation = "page",
}: Props) {
  const Heading = headingTag;
  const titleId = "product-" + headingTag + "-" + product.card.slug;

  return (
    <div
      className={styles.root}
      data-variant={product.card.variant}
      data-presentation={presentation}
    >
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
          {product.card.badge || product.metadata ? (
            <div className={styles.metaRow}>
              {product.card.badge ? (
                <span className={styles.badge}>
                  <ProductBadgeMark
                    variant={product.card.variant}
                    kind={product.card.badgeKind}
                    className={styles.badgeMark}
                    starClassName={styles.star}
                    percentClassName={styles.badgeIcon}
                  />
                  {product.card.badge}
                </span>
              ) : null}
              {product.metadata ? (
                <p className={styles.metadata}>{product.metadata}</p>
              ) : null}
            </div>
          ) : null}
          {product.labels.length ? (
            <p className={styles.editorial}>{product.labels.join(" · ")}</p>
          ) : null}
          {product.description ? (
            <p className={styles.description}>{product.description}</p>
          ) : null}
          {product.groups.map((group) => (
            <DetailGroup
              key={group.title}
              group={group}
              headingTag={headingTag}
            />
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
            <section className={styles.group}>
              {headingTag === "h1" ? (
                <h2 className={styles.groupTitle}>Alérgenos</h2>
              ) : (
                <h3 className={styles.groupTitle}>Alérgenos</h3>
              )}
              <p className={styles.list}>{product.allergens.join(", ")}</p>
            </section>
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
