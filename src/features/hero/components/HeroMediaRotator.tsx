"use client";

import { useHomeLoading } from "@/features/home/loading/HomeLoadingBoundary";

import { useEffect, useState, useSyncExternalStore } from "react";
import { getImageProps } from "next/image";
import { motion } from "motion/react";
import type { Transition } from "motion/react";
import type { HeroResponsiveRotatorImage, HeroRotatorImage } from "../types";
import { HeroFullCanvasLayer } from "./HeroFullCanvasLayer";
import { cn } from "@/lib/cn";
import { HeroProductMotion, HERO_PRODUCT_HOLD_MS, prepareHeroProduct } from "@/features/home/sections/hero/components/HeroProductMotion";

type HeroMediaRotatorBaseProps = {
  className?: string;
  images: HeroResponsiveRotatorImage[];
  priority: boolean;
  viewport?: "all" | "desktop" | "mobile";
};

type HeroContentMediaRotatorProps = HeroMediaRotatorBaseProps & {
  imageClassName: string;
  mode?: "content";
  sizes: string;
};

type HeroProductLayerRotatorProps = HeroMediaRotatorBaseProps & {
  decorative: boolean;
  isSlideActive: boolean;
  mode: "product-layer";
  universalProduct?: boolean;
};

type HeroMediaRotatorProps =
  | HeroContentMediaRotatorProps
  | HeroProductLayerRotatorProps;

const heroRotatorImageWidth = 1680;
const heroRotatorImageHeight = 945;
const rotatorIntervalMs = HERO_PRODUCT_HOLD_MS;

const rotatorTransition: Transition = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1],
};

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const desktopViewportQuery = "(min-width: 768px)";

function subscribeToReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia(reducedMotionQuery).matches;
}

function getReducedMotionServerSnapshot() {
  return true;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

function subscribeToViewport(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(desktopViewportQuery);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getViewportEnabledSnapshot(viewport: "all" | "desktop" | "mobile") {
  if (viewport === "all" || typeof window === "undefined") {
    return true;
  }

  const isDesktop = window.matchMedia(desktopViewportQuery).matches;

  return viewport === "desktop" ? isDesktop : !isDesktop;
}

function useViewportEnabled(viewport: "all" | "desktop" | "mobile") {
  return useSyncExternalStore(
    subscribeToViewport,
    () => getViewportEnabledSnapshot(viewport),
    () => true,
  );
}

function subscribeToDocumentVisibility(onStoreChange: () => void) {
  document.addEventListener("visibilitychange", onStoreChange);

  return () => document.removeEventListener("visibilitychange", onStoreChange);
}

function getDocumentVisibilitySnapshot() {
  return document.visibilityState === "visible";
}

function getDocumentVisibilityServerSnapshot() {
  return true;
}

function useDocumentVisibility() {
  return useSyncExternalStore(
    subscribeToDocumentVisibility,
    getDocumentVisibilitySnapshot,
    getDocumentVisibilityServerSnapshot,
  );
}

function normalizeFrameIndex(index: number, frameCount: number) {
  return frameCount > 0 ? index % frameCount : 0;
}

function RotatorPicture({
  alt,
  eager,
  imageClassName,
  priority,
  sizes,
  src,
}: Pick<HeroRotatorImage, "alt" | "src"> & {
  eager: boolean;
  imageClassName: string;
  priority: boolean;
  sizes: string;
}) {
  const { props: imageProps } = getImageProps({
    src,
    alt,
    width: heroRotatorImageWidth,
    height: heroRotatorImageHeight,
    sizes,
    loading: eager ? "eager" : "lazy",
    fetchPriority: priority ? "high" : "auto",
    preload: priority,
    className: imageClassName,
    style: { height: "100%", width: "100%" },
  });

  return (
    <picture className="block h-full w-full">
      <img {...imageProps} alt={alt} />
    </picture>
  );
}

function ProductLayerFrame({
  decorative,
  eager,
  image,
  priority,
  universalProduct = false,
}: {
  decorative: boolean;
  eager: boolean;
  image: HeroResponsiveRotatorImage;
  priority: boolean;
  universalProduct?: boolean;
}) {
  if (universalProduct) {
    const { props: imageProps } = getImageProps({
      src: image.src, alt: decorative ? "" : image.alt,
      width: 1536, height: 1024,
      sizes: "(orientation: portrait) 100vw, 65vw",
      loading: eager || priority ? "eager" : "lazy",
      fetchPriority: priority ? "high" : "auto",
      style: { width: "100%", height: "100%", objectFit: "contain" },
    });
    return <img {...imageProps} alt={imageProps.alt} />;
  }
  return (
    <HeroFullCanvasLayer
      alt={image.alt}
      decorative={decorative}
      eager={eager}
      fit="cover"
      position="center"
      priority={priority}
      sources={image.sources}
    />
  );
}

export function HeroMediaRotator(props: HeroMediaRotatorProps) {
  const { className, images, priority, viewport = "all" } = props;
  const shouldReduceMotion = usePrefersReducedMotion();
  const isViewportEnabled = useViewportEnabled(viewport);
  const isDocumentVisible = useDocumentVisibility();
  const [activeIndex, setActiveIndex] = useState(0);
  const frameCount = images.length;
  const firstImage = images[0];
  const displayedActiveIndex = normalizeFrameIndex(activeIndex, frameCount);
  const activeImage = images[displayedActiveIndex] ?? firstImage;
  const isSlideActive = props.mode !== "product-layer" || props.isSlideActive;
  const { loading, canAnimate } = useHomeLoading();
  const canAutoRotate =
    canAnimate &&
    frameCount > 1 &&
    isSlideActive &&
    isViewportEnabled &&
    !shouldReduceMotion &&
    isDocumentVisible;
  const frameSizes = props.mode === "product-layer"
    ? props.universalProduct ? "(orientation: portrait) 100vw, 65vw" : "100vw"
    : props.sizes;
  const debugAttributes = {
    "data-hero-rotator-active-index": displayedActiveIndex,
    "data-hero-rotator-autoplay": canAutoRotate ? "running" : "paused",
    "data-hero-rotator-document-visible": isDocumentVisible ? "true" : "false",
    "data-hero-rotator-frame-count": frameCount,
    "data-hero-rotator-reduced-motion": shouldReduceMotion ? "true" : "false",
    "data-hero-rotator-slide-active": isSlideActive ? "true" : "false",
  } as const;

  useEffect(() => {
    if (!canAutoRotate) {
      return;
    }

    let cancelled = false;
    const nextImage = images[(displayedActiveIndex + 1) % frameCount];
    const ready = prepareHeroProduct(nextImage.src, frameSizes);
    const timeoutId = window.setTimeout(async () => {
      if (!(await ready) || cancelled) return;
      setActiveIndex((currentIndex) => {
        const normalizedIndex = normalizeFrameIndex(currentIndex, frameCount);

        return (normalizedIndex + 1) % frameCount;
      });
    }, rotatorIntervalMs);

    return () => { cancelled = true; window.clearTimeout(timeoutId); };
  }, [canAutoRotate, displayedActiveIndex, frameCount, frameSizes, images]);

  if (!activeImage || !isViewportEnabled) {
    return null;
  }

  const preloadFrames = loading && (props.mode === "product-layer" || shouldReduceMotion) ? (
    <div aria-hidden="true" inert data-home-preload
      style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
      {images.slice(1).map((image) => (
        <div key={image.src}>
          {props.mode === "product-layer" ? (
            <ProductLayerFrame decorative eager image={image} priority={false} universalProduct={props.universalProduct} />
          ) : (
            <RotatorPicture alt="" eager imageClassName={props.imageClassName} priority={false} sizes={props.sizes} src={image.src} />
          )}
        </div>
      ))}
    </div>
  ) : null;

  if (props.mode === "product-layer") {
    return (
      <div
        {...debugAttributes}
        aria-hidden={
          props.decorative || !props.isSlideActive ? "true" : undefined
        }
        className={cn(
          "pointer-events-none absolute inset-0 z-[2] select-none",
          className,
        )}
        data-hero-product-layer-rotator="full-canvas"
      >
        {preloadFrames}
        <HeroProductMotion
          active={props.isSlideActive}
          frameKey={activeImage.src}
          reducedMotion={shouldReduceMotion}
          className="absolute inset-0"
        >
            <ProductLayerFrame
              decorative={props.decorative || !props.isSlideActive}
              eager={props.isSlideActive}
              image={activeImage}
              priority={priority && displayedActiveIndex === 0}
              universalProduct={props.universalProduct}
            />
        </HeroProductMotion>
      </div>
    );
  }

  const { imageClassName, sizes } = props;

  if (shouldReduceMotion || frameCount < 2) {
    return (
      <div
        {...debugAttributes}
        className="h-full w-full"
        data-hero-media-rotator
      >
        {preloadFrames}
        <div className="h-full w-full" data-hero-media-rotator-item>
          <RotatorPicture
            alt={activeImage.alt}
            eager={priority}
            imageClassName={imageClassName}
            priority={priority}
            sizes={sizes}
            src={activeImage.src}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      {...debugAttributes}
      className="relative h-full w-full overflow-hidden"
      data-hero-media-rotator
    >
      {images.map((image, index) => {
        const isActive = index === displayedActiveIndex;

        return (
          <motion.div
            key={image.src}
            animate={{
              opacity: isActive ? 1 : 0,
              scale: isActive ? 1 : 0.98,
            }}
            aria-hidden={isActive ? undefined : true}
            className="absolute inset-0 h-full w-full"
            data-hero-media-rotator-item
            initial={false}
            style={{ zIndex: isActive ? 2 : 1 }}
            transition={rotatorTransition}
          >
            <RotatorPicture
              alt={isActive ? image.alt : ""}
              eager={priority}
              imageClassName={imageClassName}
              priority={priority && index === 0}
              sizes={sizes}
              src={image.src}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
