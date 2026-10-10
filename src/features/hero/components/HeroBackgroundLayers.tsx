import { cn } from "@/lib/cn";
import type { HeroSlideViewModel } from "../types";
import { HeroFullCanvasLayer } from "./HeroFullCanvasLayer";

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

type AccentSide = "left" | "right";

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

function BackgroundLayer({
  applyColorTokenWithImage = false,
  className,
  dataRole,
  isBackgroundRoot = false,
  layer,
  priority = false,
}: {
  applyColorTokenWithImage?: boolean;
  className?: string;
  dataRole?: "accent" | "base";
  isBackgroundRoot?: boolean;
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
        <HeroFullCanvasLayer
          decorative
          fit={layer.image.fit}
          position={layer.image.position}
          priority={priority}
          sources={layer.image.sources}
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

function getLateralAccentImageClassName(side: AccentSide) {
  return side === "left"
    ? "inset-y-0 left-0 z-[1] h-full w-[40%] sm:w-[38%] md:w-[40%] lg:w-[42%] xl:w-[44%] [mask-image:linear-gradient(to_right,black_0%,black_64%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_0%,black_64%,transparent_100%)] md:[mask-image:linear-gradient(to_right,black_0%,black_68%,transparent_100%)] md:[-webkit-mask-image:linear-gradient(to_right,black_0%,black_68%,transparent_100%)]"
    : "inset-y-0 right-0 z-[1] h-full w-[42%] sm:w-[40%] md:w-[44%] lg:w-[46%] xl:w-[48%] [mask-image:linear-gradient(to_left,black_0%,black_66%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_left,black_0%,black_66%,transparent_100%)] md:[mask-image:linear-gradient(to_left,black_0%,black_70%,transparent_100%)] md:[-webkit-mask-image:linear-gradient(to_left,black_0%,black_70%,transparent_100%)]";
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

  const isFullCanvasAccent = background.accent.bleed === "none";
  const accentClassName = background.accent.image
    ? isFullCanvasAccent
      ? "inset-0 z-[1]"
      : getLateralAccentImageClassName(getAccentSide(background.accent))
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
      <BackgroundLayer
        className={accentClassName}
        dataRole="accent"
        layer={background.accent}
      />
    </div>
  );
}
