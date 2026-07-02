import { getImageProps } from "next/image";
import { StampBadge } from "@/components/ui/stamp-badge";
import { cn } from "@/lib/cn";
import type { HeroSlideViewModel } from "../types";

type HeroMediaProps = {
  badgeLabel: string | null;
  image: HeroSlideViewModel["image"];
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

export function HeroMedia({ badgeLabel, image, stampTone }: HeroMediaProps) {
  const isCutoutProduct = image.mode === "cutout-product";
  const hasFrame = image.frameEnabled && !isCutoutProduct;
  const showPromoPlate = !isCutoutProduct && image.frameEnabled;
  const resolvedImageFit = isCutoutProduct ? "contain" : image.fit;

  const imageClassName = cn(
    "h-full w-full",
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
  });

  return (
    <div
      className={cn(
        "relative order-2 z-10 md:col-span-7 md:col-start-6 md:row-span-2 md:row-start-1 md:self-center",
        isCutoutProduct
          ? "min-h-[15.5rem] md:min-h-[29rem] md:-ml-6 lg:min-h-[31rem] lg:-ml-10"
          : "min-h-[14.5rem] md:min-h-[28rem] md:-ml-4 lg:min-h-[30rem] lg:-ml-8",
      )}
    >
      {showPromoPlate ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-2 bottom-4 top-8 -rotate-2 rounded-[2.25rem] bg-soky-orange-deep bg-[url('/images/endless-clouds-light.svg')] bg-size-[auto_64px] bg-repeat md:-right-10 md:left-5 md:bottom-3 md:top-10 md:rounded-[2.5rem]"
        />
      ) : null}
      <div
        aria-hidden="true"
        className={cn(
          "absolute pointer-events-none rounded-full bg-soky-navy/35",
          isCutoutProduct
            ? "bottom-4 left-1/2 h-10 w-2/3 -translate-x-1/2 blur-xl md:bottom-8 md:h-14"
            : "-bottom-4 left-8 h-20 w-2/3 blur-2xl",
        )}
      />
      {badgeLabel ? (
        <div
          className={cn(
            "absolute z-20",
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
            ? "aspect-[4/3] max-w-[22rem] md:mr-0 md:aspect-[6/5] md:max-w-none md:w-[108%] lg:w-[112%]"
            : "aspect-[16/10] max-w-[23rem] md:ml-auto md:mr-0 md:aspect-[16/9] md:max-w-none md:w-[104%] lg:w-[108%]",
          hasFrame
            ? "overflow-hidden rounded-[1.75rem] border-[5px] border-soky-white/30 bg-soky-navy shadow-[0_24px_64px_rgb(7_5_74_/_0.38)] md:-rotate-2 md:rounded-[2rem]"
            : "overflow-visible",
        )}
      >
        <picture className="block h-full w-full">
          <source
            media="(min-width: 768px)"
            srcSet={desktopImageProps.srcSet}
            sizes={desktopImageProps.sizes}
          />
          <img {...mobileImageProps} alt={image.alt} />
        </picture>
      </div>
    </div>
  );
}
