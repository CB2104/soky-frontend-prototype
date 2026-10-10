import { getImageProps } from "next/image";
import type {
  HeroResponsiveSources,
  SliderImageFit,
  SliderImagePosition,
} from "@/contracts/api";
import { cn } from "@/lib/cn";
import {
  HERO_FULL_CANVAS_SIZES,
  HERO_PROFILE_DIMENSIONS,
  HERO_PROFILE_MEDIA_QUERIES,
  HERO_SOURCE_PROFILE_ORDER,
} from "../responsive-profiles";

export type HeroFullCanvasLayerProps = Readonly<{
  sources: HeroResponsiveSources;
  alt?: string;
  decorative?: boolean;
  fit?: SliderImageFit;
  position?: SliderImagePosition;
  eager?: boolean;
  priority?: boolean;
  opacity?: number;
  className?: string;
  sizes?: string;
}>;

export function HeroFullCanvasLayer({
  sources,
  alt = "",
  decorative = true,
  fit = "cover",
  position = "center",
  eager = false,
  priority = false,
  opacity = 1,
  className,
  sizes = HERO_FULL_CANVAS_SIZES,
}: HeroFullCanvasLayerProps) {
  const sourceProps = HERO_SOURCE_PROFILE_ORDER.map((profile) => {
    const dimensions = HERO_PROFILE_DIMENSIONS[profile];
    const { props } = getImageProps({
      src: sources[profile],
      alt: "",
      width: dimensions.width,
      height: dimensions.height,
      sizes,
    });

    return {
      media: HERO_PROFILE_MEDIA_QUERIES[profile],
      profile,
      sizes: props.sizes,
      srcSet: props.srcSet,
    };
  });
  const mobileDimensions = HERO_PROFILE_DIMENSIONS.mobile;
  const imageLoading = eager || priority ? "eager" : "lazy";
  const imageFetchPriority = priority ? "high" : "auto";
  const isDecorative = decorative || !alt;
  const { props: mobileImageProps } = getImageProps({
    src: sources.mobile,
    alt: isDecorative ? "" : alt,
    width: mobileDimensions.width,
    height: mobileDimensions.height,
    sizes,
    loading: imageLoading,
    fetchPriority: imageFetchPriority,
    style: {
      display: "block",
      height: "100%",
      margin: 0,
      objectFit: fit,
      objectPosition: position,
      opacity: Math.min(Math.max(opacity, 0), 1),
      padding: 0,
      width: "100%",
    },
  });

  return (
    <picture
      className={cn("absolute inset-0 m-0 block h-full w-full p-0", className)}
      data-hero-full-canvas-layer="true"
    >
      {sourceProps.map((source) => (
        <source
          key={source.profile}
          data-hero-profile={source.profile}
          media={source.media}
          sizes={source.sizes}
          srcSet={source.srcSet}
        />
      ))}
      <img
        {...mobileImageProps}
        alt={isDecorative ? "" : alt}
        aria-hidden={isDecorative ? "true" : undefined}
        data-hero-profile="mobile"
      />
    </picture>
  );
}
