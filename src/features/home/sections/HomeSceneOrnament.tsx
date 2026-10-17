import Image, { getImageProps } from "next/image";
import type { ReactNode } from "react";
import { HomeSceneReveal } from "./HomeSceneReveal";
import styles from "./HomeSharedScene.module.css";

type HomeSceneOrnamentProps = {
  placement: "products" | "categories" | "order";
  children: ReactNode;
};

const artwork = {
  products: {
    src: "/images/hero/soky-slide4-sushi-cutout.webp",
    width: 1448,
    height: 1086,
    side: "right",
    headingClass: "headingProducts",
    photoClass: "photoProducts",
    sizes: "(max-width: 767px) 144px, (max-width: 1439.98px) 200px, (max-width: 1600px) 20vw, 320px",
  },
  categories: {
    src: "/images/hero/hero-rotator-camarones.webp",
    width: 1600,
    height: 1600,
    side: "left",
    headingClass: "headingCategories",
    photoClass: "photoCategories",
    sizes: "(max-width: 767px) 128px, (max-width: 1439.98px) 160px, 168px",
  },
  order: {
    src: "/images/hero/soky-hero-palillos-transparente.webp",
    width: 1106,
    height: 870,
    side: "right",
    headingClass: "headingOrder",
    photoClass: "photoOrder",
    sizes: "(max-width: 767px) 176px, (max-width: 1439.98px) 216px, 280px",
  },
} as const;

export function HomeSceneOrnament({ placement, children }: HomeSceneOrnamentProps) {
  const item = artwork[placement];

  return (
    <div
      className={`${styles.headingFrame} ${styles[item.headingClass]}`}
      data-home-scene-heading={placement}
    >
      <div className={styles.ornament} data-home-scene-ornament={placement} aria-hidden="true">
        <div className={`${styles.photoAnchor} ${styles[item.photoClass]}`}>
          <HomeSceneReveal className={styles.reveal} side={item.side}>
            <Image
              src={item.src}
              alt=""
              width={item.width}
              height={item.height}
              sizes={item.sizes}
              loading="lazy"
              decoding="async"
              className={styles.photo}
            />
          </HomeSceneReveal>
        </div>
      </div>
      <div className={styles.headingCopy}>{children}</div>
    </div>
  );
}

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export function HomeSceneBottle() {
  const { props } = getImageProps({
    src: "/images/hero/soky-hero-botella-transparente.webp",
    alt: "",
    width: 575,
    height: 1415,
    sizes: "104px",
  });

  return (
    <div className={styles.bottleStage} data-home-scene-ornament="bottle" aria-hidden="true">
      <div className={`${styles.photoAnchor} ${styles.photoBottle}`}>
        <HomeSceneReveal className={styles.reveal} side="right">
          <picture>
            <source media="(min-width: 1440px)" srcSet={props.srcSet} sizes={props.sizes} />
            <Image
              src={TRANSPARENT_PIXEL}
              alt=""
              width={575}
              height={1415}
              unoptimized
              loading="lazy"
              decoding="async"
              className={styles.photo}
            />
          </picture>
        </HomeSceneReveal>
      </div>
    </div>
  );
}
