
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import Image from "next/image";
import { BrandStripMotion } from "./BrandStripMotion";

type BrandStripImageSlot = {
  src: string;
  alt: string;
  fit?: "contain" | "cover";
};

type BrandStripCategory = {
  id: string;
  label: string;
  accessibleLabel: string;
  images: readonly BrandStripImageSlot[];
  href: string;
};

type BrandStripRibbonData = {
  id: "blue" | "orange";
  ariaLabel: string;
  categories: readonly BrandStripCategory[];
};

type BrandStripMotionProfile =
  | "mobilePortrait"
  | "mobileLandscape"
  | "tablet"
  | "desktop";

const brandStripRibbons = [
  {
    id: "blue",
    ariaLabel: "Cinta azul: categorías frías y frescas",
    categories: [
      {
        id: "frios",
        label: "FRÍOS",
        accessibleLabel: "Explorar fríos en el menú",
        href: "/menu?category=rolls",
        images: [
          {
            src: "/images/hero/slide-promo-sushi-frio.webp",
            alt: "Sushi frío de SOKY",
          },
          {
            src: "/images/hero/hero-rotator-sushi-1.webp",
            alt: "Selección surtida de rolls fríos de SOKY",
          },
          {
            src: "/images/hero/slide-1-product-1.webp",
            alt: "Bandeja de rolls fríos con aguacate y topping de SOKY",
          },
        ],
      },
      {
        id: "ensaladas",
        label: "ENSALADAS",
        accessibleLabel: "Explorar ensaladas en el menú",
        href: "/menu?category=ensaladas",
        images: [
          {
            src: "/images/brand-strip/products/ensalada-wakame.webp",
            alt: "Ensalada wakame con edamame y sésamo",
            fit: "cover",
          },
          {
            src: "/images/brand-strip/products/ensalada-kanikama.webp",
            alt: "Ensalada de kanikama, aguacate, pepino y wakame",
            fit: "cover",
          },
        ],
      },
    ],
  },
  {
    id: "orange",
    ariaLabel: "Cinta naranja: categorías crujientes y para compartir",
    categories: [
      {
        id: "tempuras",
        label: "TEMPURAS",
        accessibleLabel: "Explorar tempuras en el menú",
        href: "/menu?category=rolls",
        images: [
          {
            src: "/images/hero/slide-promo-tempura.webp",
            alt: "Tempuras de SOKY",
          },
          {
            src: "/images/hero/slide-promo-mixto.webp",
            alt: "Rolls crujientes con topping de SOKY",
          },
          {
            src: "/images/hero/hero-rotator-camarones.webp",
            alt: "Camarones crujientes de SOKY",
          },
        ],
      },
      {
        id: "entradas",
        label: "ENTRADAS",
        accessibleLabel: "Explorar entradas en el menú",
        href: "/menu?category=entradas",
        images: [
          {
            src: "/images/hero/slide-promo-mixto.webp",
            alt: "Selección mixta de SOKY",
          },
          {
            src: "/images/hero/hero-rotator-camarones.webp",
            alt: "Entrada de camarones de SOKY",
          },
        ],
      },
    ],
  },
] satisfies readonly BrandStripRibbonData[];

const brandStripSilhouetteSrc: Record<BrandStripRibbonData["id"], string> = {
  blue: "/images/brand-strip/brand-strip-blue-desktop.svg",
  orange: "/images/brand-strip/brand-strip-orange-desktop.svg",
};

const brandStripMobileSilhouetteSrc: Record<
  BrandStripRibbonData["id"],
  string
> = {
  blue: "/images/brand-strip/brand-strip-blue-mobile.svg",
  orange: "/images/brand-strip/brand-strip-orange-mobile.svg",
};

const desktopMotionPaths: Record<BrandStripRibbonData["id"], string> = {
  blue: "M -700 417.8 L -96 492 C 160.5 523.5 404 545.5 649.5 510.5 C 834.5 484 1001 429 1143.5 359.5 C 1313 276.5 1484 214.5 1696 168.5 L 2300 37.5",
  orange:
    "M -700 131 L -72 156 C 280 170 610 272 900 370 C 1178 464 1440 500 1672 429 L 2300 237",
};

// Portrait paths share the mobile SVG viewBox and extend beyond its edges along
// the approved endpoint tangents so an entire category can leave the viewport.
const brandStripMotionPaths: Record<
  BrandStripMotionProfile,
  Record<BrandStripRibbonData["id"], string>
> = {
  mobilePortrait: {
    blue: [
      "M -1100 360.5 L -48 351",
      "C -32 350.9 -16 351.2 0 351.6",
      "C 16 352 32 352.8 48 353.6",
      "C 64 354.4 80 355.4 96 356.2",
      "C 112 357 128 357.9 144 358.4",
      "C 160 358.9 176 359.3 192 359.1",
      "C 208 358.9 224 358.6 240 357.2",
      "C 256 355.7 272 354.1 288 350.4",
      "C 304 346.8 320 341.6 336 335.2",
      "C 352 328.8 368 320.7 384 312.2",
      "C 400 303.7 416 292.7 432 284.3",
      "C 448 275.9 464 266.9 480 262",
      "C 496 257.1 512 253.4 528 255",
      "L 1450 347.2",
    ].join(" "),
    orange:
      "M -1060 196 L -48 98 C 66 87 177 103 285 136 C 373 163 453 185 528 169 L 1540 -47",
  },
  mobileLandscape: desktopMotionPaths,
  tablet: desktopMotionPaths,
  desktop: desktopMotionPaths,
};

const motionMarkerProgress = [0.12, 0.3, 0.5, 0.7, 0.88] as const;
const brandStripCopyCount = 12;
const motionCoordinateSystems = [
  {
    id: "mobile",
    viewBox: "0 0 480 420",
    profiles: ["mobilePortrait"] as const,
  },
  {
    id: "desktop",
    viewBox: "0 0 1600 600",
    profiles: ["mobileLandscape", "tablet", "desktop"] as const,
  },
] as const;

function BrandStripMotionPaths() {
  const isDevelopment = process.env.NODE_ENV !== "production";

  return (
    <>
      {motionCoordinateSystems.map(({ id, profiles, viewBox }) => (
        <svg
          key={id}
          aria-hidden="true"
          className="brand-strip-motion-debug"
          data-brand-strip-motion-coordinate-system={id}
          preserveAspectRatio="none"
          viewBox={viewBox}
        >
          {profiles.flatMap((profile) =>
            (["blue", "orange"] as const).map((ribbon) => (
              <path
                key={`${profile}-${ribbon}-path`}
                data-brand-strip-motion-path={ribbon}
                data-brand-strip-motion-profile={profile}
                className={`brand-strip-motion-debug__path brand-strip-motion-debug__path--${ribbon}`}
                d={brandStripMotionPaths[profile][ribbon]}
              />
            )),
          )}

          {isDevelopment &&
            profiles.flatMap((profile) =>
              (["blue", "orange"] as const).flatMap((ribbon) =>
                motionMarkerProgress.map((progress, index) => (
                  <g
                    key={`${profile}-${ribbon}-${progress}`}
                    data-brand-strip-motion-marker={ribbon}
                    data-brand-strip-motion-profile={profile}
                    data-progress={progress}
                    className="brand-strip-motion-debug__marker"
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="6"
                      className={`brand-strip-motion-debug__marker-dot brand-strip-motion-debug__marker-dot--${ribbon}`}
                    />
                    <text
                      x="9"
                      y="3"
                      className="brand-strip-motion-debug__marker-label"
                    >
                      {index + 1}
                    </text>
                  </g>
                )),
              ),
            )}
        </svg>
      ))}
    </>
  );
}

function BrandStripConveyorArrow() {
  return (
    <span
      aria-hidden="true"
      className="brand-strip-conveyor-arrow font-soky-support"
    >
      →
    </span>
  );
}

function BrandStripCta({
  ribbonId,
  category,
  isClone,
}: {
  ribbonId: BrandStripRibbonData["id"];
  category: BrandStripCategory;
  isClone: boolean;
}) {
  const className =
    "brand-strip-category-cta shrink-0";
  const content = <span>Explorar</span>;

  if (isClone) {
    return (
      <Button size="sm" variant="secondary"
        secondaryTone={ribbonId === "orange" ? "b" : "a"}
        href={category.href}
        aria-hidden="true"
        tabIndex={-1}
        className={className}
      >
        {content}
      </Button>
    );
  }

  return (
    <Button size="sm" variant="secondary"
        secondaryTone={ribbonId === "orange" ? "b" : "a"}
      href={category.href}
      aria-label={category.accessibleLabel}
      data-brand-strip-cta
      className={className}
      tabIndex={-1}
    >
      {content}
    </Button>
  );
}

function BrandStripConveyorItem({
  ribbonId,
  category,
  copyIndex,
}: {
  ribbonId: BrandStripRibbonData["id"];
  category: BrandStripCategory;
  copyIndex: number;
}) {
  const isClone = copyIndex >= brandStripRibbons[0].categories.length;

  return (
    <li
      data-brand-strip-conveyor-item
      data-copy-index={copyIndex}
      data-category={category.id}
      aria-hidden={isClone ? true : undefined}
      className="brand-strip-conveyor-item flex w-max shrink-0 items-center"
    >
      <h3 className="brand-strip-category-title relative shrink-0 whitespace-nowrap font-soky-display font-normal uppercase">
        <Image
          src="/images/hero/soky-slide4-brush-stroke.svg"
          alt=""
          aria-hidden="true"
          width={48}
          height={16}
          className="brand-strip-category-accent"
        />
        {category.label}
      </h3>

      <div
        aria-label={`${category.label}: selección de platos`}
        className="brand-strip-category-gallery flex shrink-0 items-center"
        role="group"
      >
        {category.images.map((image, index) => (
          <div
            key={`${category.id}-${index}`}
            className="brand-strip-category-gallery__frame relative shrink-0"
          >
            <Image
              src={image.src}
              alt={image.alt}
              className={cn(
                image.fit === "cover" ? "object-cover" : "object-contain",
              )}
              fill
              loading="lazy"
              sizes="(min-width: 1600px) 6rem, (min-width: 1024px) 5rem, (min-width: 640px) 2.4rem, 1.8rem"
            />
          </div>
        ))}
      </div>

      <BrandStripCta ribbonId={ribbonId} category={category} isClone={isClone} />
      <BrandStripConveyorArrow />
    </li>
  );
}

function BrandStripConveyor({ ribbon }: { ribbon: BrandStripRibbonData }) {
  return (
    <ol
      data-brand-strip-conveyor={ribbon.id}
      aria-label={ribbon.ariaLabel}
      className={cn(
        "brand-strip-conveyor absolute inset-0 m-0 list-none",
        ribbon.id === "blue"
          ? "brand-strip-conveyor--blue"
          : "brand-strip-conveyor--orange",
      )}
    >
      {Array.from({ length: brandStripCopyCount }, (_, copyIndex) => (
        <BrandStripConveyorItem
          key={`${ribbon.id}-${copyIndex}`}
          ribbonId={ribbon.id}
          category={ribbon.categories[copyIndex % ribbon.categories.length]}
          copyIndex={copyIndex}
        />
      ))}
    </ol>
  );
}

function BrandStripRibbon({ ribbon }: { ribbon: BrandStripRibbonData }) {
  return (
    <div
      data-brand-strip-ribbon={ribbon.id}
      aria-hidden="true"
      className={cn(
        "brand-strip-ribbon absolute inset-x-0",
        ribbon.id === "blue"
          ? "brand-strip-ribbon--blue z-10"
          : "brand-strip-ribbon--orange z-20",
      )}
    >
      <div className="brand-strip-ribbon__decorative-layer absolute inset-0">
        <picture className="brand-strip-ribbon__picture absolute inset-0 block">
          <source
            media="(max-width: 639px) and (orientation: portrait)"
            srcSet={brandStripMobileSilhouetteSrc[ribbon.id]}
          />
          <Image
            src={brandStripSilhouetteSrc[ribbon.id]}
            alt=""
            aria-hidden="true"
            className="brand-strip-ribbon__silhouette object-fill"
            fill
            priority
            sizes="100vw"
          />
        </picture>
        <div
          aria-hidden="true"
          className="brand-strip-ribbon__pattern absolute inset-0"
        />
      </div>
    </div>
  );
}

export function BrandStripSection() {
  return (
    <BrandStripMotion>
      <Section className="brand-strip-section py-0" tone="paper">
        <div className="brand-strip-pattern-surface relative isolate">
          <div className="brand-strip-section__inner relative">
            <div className="brand-strip-stage relative">
              {brandStripRibbons.map((ribbon) => (
                <BrandStripRibbon key={ribbon.id} ribbon={ribbon} />
              ))}

              {brandStripRibbons.map((ribbon) => (
                <BrandStripConveyor key={ribbon.id} ribbon={ribbon} />
              ))}

              <BrandStripMotionPaths />
              <div className="brand-strip-editorial-zone absolute inset-0">
                <Container
                  size="wide"
                  className="brand-strip-section__container relative z-0"
                >
                  <div
                    data-brand-strip-editorial
                    className="brand-strip-editorial"
                  >
                    <p className="brand-strip-editorial__eyebrow font-soky-support font-black uppercase text-soky-orange-deep">
                      DOS FORMAS DE ANTOJARSE
                    </p>

                    <h2
                      id="brand-strip-title"
                      className="brand-strip-editorial__title scroll-mt-28 font-soky-hand font-bold"
                    >
                      <span className="text-soky-orange">Crujiente</span>{" "}
                      <span className="text-soky-blue">o fresco.</span>
                    </h2>

                    <p className="brand-strip-editorial__subtitle font-soky-support font-bold uppercase text-soky-blue">
                      Elige tu lado.
                    </p>
                    <Image
                      data-brand-strip-underline
                      src="/images/hero/soky-slide4-brush-stroke.svg"
                      alt=""
                      aria-hidden="true"
                      width={170}
                      height={32}
                      className="brand-strip-editorial__underline h-auto"
                    />
                  </div>
                </Container>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </BrandStripMotion>
  );
}
