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

type HeroBackgroundImage = NonNullable<HeroBackgroundLayer["image"]>;

const backgroundImageWidth = 1680;
const backgroundImageHeight = 945;

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
    "h-full w-full",
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
  });

  return (
    <picture className="block h-full w-full">
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
  forceObjectCover = false,
  forceObjectRight = false,
  layer,
  priority = false,
}: {
  applyColorTokenWithImage?: boolean;
  className?: string;
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

function AccentImageLayer({ image }: { image: HeroBackgroundImage }) {
  const backgroundSize = "100% 100%";

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 bottom-0 z-1 block h-full w-[34%] bg-top-right bg-no-repeat sm:w-[36%] md:hidden"
        style={{
          backgroundImage: `url(${image.mobileSrc})`,
          backgroundSize,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 bottom-0 z-1 hidden h-full w-[44%] bg-top-right bg-no-repeat md:block lg:w-[46%] xl:w-[48%]"
        style={{
          backgroundImage: `url(${image.desktopSrc})`,
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
        layer={background.layer}
        priority={priority}
      />
    );
  }

  const accentImage = background.accent.image;
  const accentClassName =
    background.accent.bleed === "contained-end"
      ? "right-[-18%] top-0 z-[1] h-[58%] w-[66%] [clip-path:polygon(22%_0,100%_0,100%_100%,0_78%)] md:inset-y-0 md:-right-24 md:h-auto md:w-[58%] md:[clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)]"
      : "right-0 top-0 z-[1] h-[50%] w-[48%] md:inset-y-0 md:h-auto md:w-[50%]";

  return (
    <>
      <BackgroundLayer
        applyColorTokenWithImage
        className="inset-0 z-0"
        forceObjectCover
        layer={background.base}
        priority={priority}
      />
      {accentImage ? (
        <AccentImageLayer image={accentImage} />
      ) : (
        <BackgroundLayer
          className={accentClassName}
          layer={background.accent}
        />
      )}
    </>
  );
}
