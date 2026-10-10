import { getImageProps } from "next/image";
import { StampBadge } from "@/components/ui/stamp-badge";
import { cn } from "@/lib/cn";
import type { HeroSlideViewModel } from "../types";
import { HeroMediaRotator } from "./HeroMediaRotator";

type HeroMediaProps = {
  badgeLabel: string | null;
  image: HeroSlideViewModel["image"];
  renderImage?: boolean;
  rotatorImages?: HeroSlideViewModel["rotatorImages"];
  rotatorViewport?: "all" | "desktop" | "mobile";
  stampTone: "promo" | "cold" | "new";
};

const heroDesktopImageWidth = 1680;
const heroDesktopImageHeight = 945;
const heroMobileImageWidth = 1680;
const heroMobileImageHeight = 945;

const imageFitClass: Record<HeroSlideViewModel["image"]["fit"], string> = {
  cover: "object-cover",
  contain: "object-contain",
};

const imagePositionClass: Record<
  HeroSlideViewModel["image"]["position"],
  string
> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
  "center-left": "object-left",
  "center-right": "object-right",
};

export function HeroMedia({
  badgeLabel,
  image,
  renderImage = true,
  rotatorImages,
  rotatorViewport = "all",
  stampTone,
}: HeroMediaProps) {
  const isCutoutProduct = image.mode === "cutout-product";
  const hasFrame = image.frameEnabled && !isCutoutProduct;
  const showPromoPlate = !isCutoutProduct && image.frameEnabled;
  const resolvedImageFit = isCutoutProduct ? "contain" : image.fit;
  const safeRotatorImages = rotatorImages ?? [];
  const shouldRenderRotator = safeRotatorImages.length >= 2;

  const imageClassName = cn(
    "block h-full w-full",
    imageFitClass[resolvedImageFit],
    imagePositionClass[image.position],
  );
  const imageLoading = image.priority ? "eager" : "lazy";
  const imageFetchPriority = image.priority ? "high" : "auto";

  const { props: desktopImageProps } = getImageProps({
    src: image.desktopSrc,
    alt: image.alt,
    width: heroDesktopImageWidth,
    height: heroDesktopImageHeight,
    sizes: image.sizes,
    preload: image.priority,
  });

  const { props: mobileImageProps } = getImageProps({
    src: image.mobileSrc,
    alt: image.alt,
    width: heroMobileImageWidth,
    height: heroMobileImageHeight,
    sizes: image.sizes,
    loading: imageLoading,
    fetchPriority: imageFetchPriority,
    preload: image.priority,
    className: imageClassName,
    style: { height: "100%", width: "100%" },
  });

  return (
    <div
      className={cn(
        "relative order-3 z-10 self-end md:col-span-7 md:col-start-6 md:row-span-2 md:row-start-1 md:self-center",
        isCutoutProduct
          ? "min-h-0 md:min-h-0"
          : "min-h-[14.5rem] md:min-h-[28rem] md:-ml-4 lg:min-h-[30rem] lg:-ml-8",
      )}
    >
      {showPromoPlate ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-2 bottom-4 top-8 -rotate-2 rounded-[2.25rem] bg-soky-orange-deep bg-[url('/images/patterns/endless-clouds-light.svg')] bg-size-[auto_64px] bg-repeat md:-right-10 md:left-5 md:bottom-3 md:top-10 md:rounded-[2.5rem]"
        />
      ) : null}
      {badgeLabel ? (
        <div
          className={cn(
            "absolute z-20",
            "[@media(max-height:500px)_and_(orientation:landscape)]:hidden",
            isCutoutProduct
              ? "left-2 top-2 md:left-8 md:top-10"
              : "-left-3 top-3 md:left-1 md:top-8",
          )}
        >
          <StampBadge tone={stampTone}>{badgeLabel}</StampBadge>
        </div>
      ) : null}
      <div
        className={cn(
          "relative z-10 mx-auto w-full",
          isCutoutProduct
            ? "h-[15rem] max-h-[27svh] max-w-[20rem] [@media(max-height:500px)]:h-8 [@media(max-height:500px)]:max-h-8 md:mr-0 md:h-[38rem] md:max-h-[70vh] md:max-w-[39rem] lg:h-[40rem] lg:max-h-[72vh] lg:max-w-[42rem]"
            : "aspect-[16/10] max-w-[23rem] md:ml-auto md:mr-0 md:aspect-[16/9] md:max-w-none md:w-[104%] lg:w-[108%]",
          hasFrame
            ? "overflow-hidden rounded-[1.75rem] border-[5px] border-soky-white/30 bg-soky-navy md:-rotate-2 md:rounded-[2rem]"
            : "overflow-visible",
        )}
      >
        {!renderImage ? null : shouldRenderRotator ? (
          <HeroMediaRotator
            imageClassName={imageClassName}
            images={safeRotatorImages}
            priority={image.priority}
            sizes={image.sizes}
            viewport={rotatorViewport}
          />
        ) : (
          <picture className="block h-full w-full">
            <source
              media="(min-width: 768px)"
              srcSet={desktopImageProps.srcSet}
              sizes={desktopImageProps.sizes}
            />
            <img {...mobileImageProps} alt={image.alt} />
          </picture>
        )}
      </div>
    </div>
  );
}
