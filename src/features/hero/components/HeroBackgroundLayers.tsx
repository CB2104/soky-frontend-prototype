import { getImageProps } from "next/image";
import { cn } from "@/lib/cn";
import type { HeroSlideViewModel } from "../types";

type HeroBackgroundLayersProps = {
  background: HeroSlideViewModel["background"];
  priority?: boolean;
};

type HeroBackgroundLayer = Extract<
  HeroSlideViewModel["background"],
  { mode: "single" }
>["layer"];

type HeroTwoLayerBackground = Extract<
  HeroSlideViewModel["background"],
  { mode: "two-layer" }
>;

type HeroAccentLayer = HeroTwoLayerBackground["accent"];

type HeroBackgroundImage = NonNullable<HeroBackgroundLayer["image"]>;
type AccentSide = "left" | "right";
type BackgroundPosition = HeroBackgroundImage["position"];

const backgroundImageWidth = 1920;
const backgroundImageHeight = 1080;

const colorTokenClass: Record<
  NonNullable<HeroBackgroundLayer["colorToken"]>,
  string
> = {
  "brand-primary": "bg-soky-blue",
  "brand-dark": "bg-soky-navy",
  accent: "bg-soky-orange-deep",
  paper: "bg-soky-paper",
  white: "bg-soky-white",
};

const opacityClass: Record<
  NonNullable<HeroBackgroundLayer["opacity"]>,
  string
> = {
  100: "opacity-100",
  70: "opacity-70",
  50: "opacity-50",
  35: "opacity-[0.35]",
};

const imageFitClass: Record<HeroBackgroundImage["fit"], string> = {
  cover: "object-cover",
  contain: "object-contain",
};

const imagePositionClass: Record<HeroBackgroundImage["position"], string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
  "center-left": "object-left",
  "center-right": "object-right",
};

const cssBackgroundPosition: Record<BackgroundPosition, string> = {
  center: "center",
  top: "center top",
  bottom: "center bottom",
  left: "left center",
  right: "right center",
  "center-left": "left center",
  "center-right": "right center",
};

function BackgroundImage({
  forceObjectCover = false,
  forceObjectRight = false,
  image,
  priority = false,
}: {
  forceObjectCover?: boolean;
  forceObjectRight?: boolean;
  image: HeroBackgroundImage;
  priority?: boolean;
}) {
  const imageFit = forceObjectCover ? "cover" : image.fit;
  const imagePositionClassName = forceObjectRight
    ? "object-right"
    : imagePositionClass[image.position];
  const imageLoading = priority ? "eager" : "lazy";
  const imageFetchPriority = priority ? "high" : "auto";

  const imageClassName = cn(
    "block h-full w-full",
    imageFitClass[imageFit],
    imagePositionClassName,
  );

  const { props: desktopImageProps } = getImageProps({
    src: image.desktopSrc,
    alt: "",
    width: backgroundImageWidth,
    height: backgroundImageHeight,
    sizes: "100vw",
    className: imageClassName,
    style: { height: "100%", width: "100%" },
  });

  const { props: mobileImageProps } = getImageProps({
    src: image.mobileSrc,
    alt: "",
    width: backgroundImageWidth,
    height: backgroundImageHeight,
    sizes: "100vw",
    loading: imageLoading,
    fetchPriority: imageFetchPriority,
    className: imageClassName,
    style: { height: "100%", width: "100%" },
  });

  return (
    <picture className="absolute inset-0 block h-full w-full">
      <source
        media="(min-width: 768px)"
        srcSet={desktopImageProps.srcSet}
        sizes={desktopImageProps.sizes}
      />
      <img {...mobileImageProps} alt="" aria-hidden="true" />
    </picture>
  );
}

function BackgroundLayer({
  applyColorTokenWithImage = false,
  className,
  dataRole,
  isBackgroundRoot = false,
  forceObjectCover = false,
  forceObjectRight = false,
  layer,
  priority = false,
}: {
  applyColorTokenWithImage?: boolean;
  className?: string;
  dataRole?: "accent" | "base";
  isBackgroundRoot?: boolean;
  forceObjectCover?: boolean;
  forceObjectRight?: boolean;
  layer: HeroBackgroundLayer;
  priority?: boolean;
}) {
  if (!layer.colorToken && !layer.image) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute overflow-hidden",
        layer.colorToken && (!layer.image || applyColorTokenWithImage)
          ? colorTokenClass[layer.colorToken]
          : null,
        layer.opacity ? opacityClass[layer.opacity] : null,
        className,
      )}
      data-hero-accent={dataRole === "accent" ? "true" : undefined}
      data-hero-background={isBackgroundRoot ? "true" : undefined}
      data-hero-base={dataRole === "base" ? "true" : undefined}
    >
      {layer.image ? (
        <BackgroundImage
          forceObjectCover={forceObjectCover}
          forceObjectRight={forceObjectRight}
          image={layer.image}
          priority={priority}
        />
      ) : null}
    </div>
  );
}

function getAccentSide(accent: HeroAccentLayer): AccentSide {
  if (accent.bleed === "contained-start") {
    return "left";
  }

  if (accent.bleed === "contained-end") {
    return "right";
  }

  if (
    accent.image?.position === "left" ||
    accent.image?.position === "center-left"
  ) {
    return "left";
  }

  return "right";
}

function getAccentFallbackClassName(accent: HeroAccentLayer) {
  const accentSide = getAccentSide(accent);

  if (accent.bleed === "contained-start") {
    return "left-[-18%] top-0 z-[1] h-[58%] w-[66%] [clip-path:polygon(0_0,78%_0,100%_78%,0_100%)] md:inset-y-0 md:-left-24 md:h-auto md:w-[58%] md:[clip-path:polygon(0_0,82%_0,100%_100%,0_100%)]";
  }

  if (accent.bleed === "contained-end") {
    return "right-[-18%] top-0 z-[1] h-[58%] w-[66%] [clip-path:polygon(22%_0,100%_0,100%_100%,0_78%)] md:inset-y-0 md:-right-24 md:h-auto md:w-[58%] md:[clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)]";
  }

  return accentSide === "left"
    ? "left-0 top-0 z-[1] h-[50%] w-[48%] md:inset-y-0 md:h-auto md:w-[50%]"
    : "right-0 top-0 z-[1] h-[50%] w-[48%] md:inset-y-0 md:h-auto md:w-[50%]";
}

function FullCanvasAccentImageLayer({ image }: { image: HeroBackgroundImage }) {
  const backgroundSize = "cover";
  const backgroundPosition = cssBackgroundPosition[image.position];

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] block h-full w-full bg-no-repeat md:hidden"
        data-hero-accent="true"
        style={{
          backgroundImage: `url(${image.mobileSrc})`,
          backgroundPosition,
          backgroundSize,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] hidden h-full w-full bg-no-repeat md:block"
        data-hero-accent="true"
        style={{
          backgroundImage: `url(${image.desktopSrc})`,
          backgroundPosition,
          backgroundSize,
        }}
      />
    </>
  );
}

function LateralAccentImageLayer({
  image,
  side,
}: {
  image: HeroBackgroundImage;
  side: AccentSide;
}) {
  const backgroundSize = "cover";
  const backgroundPosition = side === "left" ? "left top" : "right top";

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 z-[1] block h-full bg-no-repeat md:hidden",
          side === "left"
            ? "left-0 w-[40%] sm:w-[38%] [mask-image:linear-gradient(to_right,black_0%,black_64%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_0%,black_64%,transparent_100%)]"
            : "right-0 w-[42%] sm:w-[40%] [mask-image:linear-gradient(to_left,black_0%,black_66%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_left,black_0%,black_66%,transparent_100%)]",
        )}
        data-hero-accent="true"
        style={{
          backgroundImage: `url(${image.mobileSrc})`,
          backgroundPosition,
          backgroundSize,
        }}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 z-[1] hidden h-full bg-no-repeat md:block",
          side === "left"
            ? "left-0 w-[40%] lg:w-[42%] xl:w-[44%] [mask-image:linear-gradient(to_right,black_0%,black_68%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_0%,black_68%,transparent_100%)]"
            : "right-0 w-[44%] lg:w-[46%] xl:w-[48%] [mask-image:linear-gradient(to_left,black_0%,black_70%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_left,black_0%,black_70%,transparent_100%)]",
        )}
        data-hero-accent="true"
        style={{
          backgroundImage: `url(${image.desktopSrc})`,
          backgroundPosition,
          backgroundSize,
        }}
      />
    </>
  );
}

export function HeroBackgroundLayers({
  background,
  priority = false,
}: HeroBackgroundLayersProps) {
  if (background.mode === "none") {
    return null;
  }

  if (background.mode === "single") {
    return (
      <BackgroundLayer
        applyColorTokenWithImage
        className="inset-0 z-0"
        dataRole="base"
        isBackgroundRoot
        layer={background.layer}
        priority={priority}
      />
    );
  }

  const accentImage = background.accent.image;
  const isFullCanvasAccent = background.accent.bleed === "none";
  const accentClassName = isFullCanvasAccent
    ? "inset-0 z-[1]"
    : getAccentFallbackClassName(background.accent);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      data-hero-background="true"
    >
      <BackgroundLayer
        applyColorTokenWithImage
        className="inset-0 z-0"
        dataRole="base"
        layer={background.base}
        priority={priority}
      />
      {accentImage ? (
        isFullCanvasAccent ? (
          <FullCanvasAccentImageLayer image={accentImage} />
        ) : (
          <LateralAccentImageLayer
            image={accentImage}
            side={getAccentSide(background.accent)}
          />
        )
      ) : (
        <BackgroundLayer
          className={accentClassName}
          dataRole="accent"
          layer={background.accent}
        />
      )}
    </div>
  );
}
