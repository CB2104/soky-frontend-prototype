import type {
  AdminAnalyticsProductDto,
  AdminAnalyticsSliderDto,
  AdminAnalyticsSummaryDto,
  AdminSliderItemDto,
  CategoryDto,
  ExchangeRateDto,
  HeroResponsiveSources,
  LegacyHeroImageSources,
  OrderIntentConfirmViewDto,
  ProductDto,
  PublicSettingsDto,
  SliderBackgroundColorToken,
  UserDto,
} from "@/contracts/api";
import { preparedMenuCategories, preparedMenuProducts } from "./menu-dto-adapter";

const now = new Date("2026-06-14T14:00:00.000Z").toISOString();

const heroProductImageUrl = "/images/soky-hero-party-box.png";
const slidePromoMixtoImageUrl = "/images/hero/slide-promo-mixto.webp";
const slideServiceDeliveryImageUrl = "/images/hero/slide-service-delivery.webp";

const slide1BaseSources = {
  desktop: "/images/hero/slide-1-base-desktop.webp",
  desktopWide: "/images/hero/slide-1-base-desktop-wide.webp",
  tabletLandscape: "/images/hero/slide-1-base-tablet-landscape.webp",
  tabletPortrait: "/images/hero/slide-1-base-tablet-portrait.webp",
  mobile: "/images/hero/slide-1-base-mobile.webp",
} satisfies HeroResponsiveSources;

const slide1AccentSources = {
  desktop: "/images/hero/slide-1-accent-desktop.webp",
  desktopWide: "/images/hero/slide-1-accent-desktop-wide.webp",
  tabletLandscape: "/images/hero/slide-1-accent-tablet-landscape.webp",
  tabletPortrait: "/images/hero/slide-1-accent-tablet-portrait.webp",
  mobile: "/images/hero/slide-1-accent-mobile.webp",
} satisfies HeroResponsiveSources;

const slide1Product1Sources = sameImageForAllSizes(
  "/images/hero/slide-1-product-1-universal.webp",
);

const slide1Product2Sources = sameImageForAllSizes(
  "/images/hero/slide-1-product-2-universal.webp",
);

const slide1Product3Sources = sameImageForAllSizes(
  "/images/hero/slide-1-product-3-universal.webp",
);

const slide2BaseSources = {
  desktop: "/images/hero/slide-2-base-desktop.webp",
  desktopWide: "/images/hero/slide-2-base-desktop-wide.webp",
  tabletLandscape: "/images/hero/slide-2-base-tablet-landscape.webp",
  tabletPortrait: "/images/hero/slide-2-base-tablet-portrait.webp",
  mobile: "/images/hero/slide-2-base-mobile.webp",
} satisfies HeroResponsiveSources;

const slide2AccentSources = {
  desktop: "/images/hero/slide-2-accent-desktop.webp",
  desktopWide: "/images/hero/slide-2-accent-desktop-wide.webp",
  tabletLandscape: "/images/hero/slide-2-accent-tablet-landscape.webp",
  tabletPortrait: "/images/hero/slide-2-accent-tablet-portrait.webp",
  mobile: "/images/hero/slide-2-accent-mobile.webp",
} satisfies HeroResponsiveSources;

const slide2ProductSources = {
  desktop: "/images/hero/slide-2-product-desktop.webp",
  desktopWide: "/images/hero/slide-2-product-desktop-wide.webp",
  tabletLandscape: "/images/hero/slide-2-product-tablet-landscape.webp",
  tabletPortrait: "/images/hero/slide-2-product-tablet-portrait.webp",
  mobile: "/images/hero/slide-2-product-mobile.webp",
} satisfies HeroResponsiveSources;

function sameImageForAllSizes(src: string): HeroResponsiveSources {
  return {
    desktop: src,
    desktopWide: src,
    tabletLandscape: src,
    tabletPortrait: src,
    mobile: src,
  };
}

const boxKiyomiRotatorSources = sameImageForAllSizes(
  "/images/hero/box-kiyomi-rotator.webp",
);
const boxKyotoRotatorSources = sameImageForAllSizes(
  "/images/hero/box-kyoto-rotator.webp",
);
const boxKuramaRotatorSources = sameImageForAllSizes(
  "/images/hero/box-kurama-rotator.webp",
);

type HeroBackgroundAsset = HeroResponsiveSources | LegacyHeroImageSources;

type HeroAccentSide = "left" | "right";

type BlueOrangeBackgroundOptions = {
  accent?: HeroBackgroundAsset;
  accentSide: HeroAccentSide;
  base: HeroBackgroundAsset;
  baseColorToken?: SliderBackgroundColorToken;
};

const heroBlueBackgroundAssets = {
  v2: {
    desktopUrl: "/images/hero/hero-base-blue-desktopS1.webp",
    mobileUrl: "/images/hero/hero-base-blue-mobile-s1.webp",
  },
  v3: {
    desktopUrl: "/images/hero/welcome-blue-desktop.webp",
    mobileUrl: "/images/hero/welcome-blue-mobile.webp",
  },
  v4: {
    desktopUrl: "/images/hero/2doHero-base-blue-desktop-s1.webp",
    mobileUrl: "/images/hero/2doHero-base-blue-mobile-s1.webp",
  },
  comboCold: {
    desktopUrl: "/images/hero/2doHero-base-blue-desktop-s2.webp",
    mobileUrl: "/images/hero/2doHero-base-blue-mobile-s2.webp",
  },
  comboLargeMixed: {
    desktopUrl: "/images/hero/2doHero-base-blue-desktop-s1.webp",
    mobileUrl: "/images/hero/2doHero-base-blue-mobile-s2.webp",
  },
} as const satisfies Record<string, HeroBackgroundAsset>;

const heroOrangeAccentAssets = {
  left: {
    desktopUrl: "/images/hero/hero-accent-orange-desktop-left.webp",
    mobileUrl: "/images/hero/welcome-orange-accent-mobile-original-left.webp",
  },
  right: slide1AccentSources,
  comboCold: {
    desktopUrl: "/images/hero/accent-orange-accent-desktop-v2-s2.webp",
    mobileUrl: "/images/hero/Mobile-OrangeAccent-s1.webp",
  },
} as const satisfies Record<string, HeroBackgroundAsset>;

const heroBlackBackgroundAssets = {
  s1: {
    desktopUrl: "/images/hero/hero-base-black-desktop-s1.webp",
    mobileUrl: "/images/hero/hero-base-black-mobile-s1.webp",
  },
} as const satisfies Record<string, HeroBackgroundAsset>;

function createBlueOrangeBackground({
  accentSide,
  accent = heroOrangeAccentAssets[accentSide],
  base,
  baseColorToken = "brand-primary",
}: BlueOrangeBackgroundOptions): NonNullable<AdminSliderItemDto["background"]> {
  return {
    mode: "two-layer",
    base: {
      colorToken: baseColorToken,
      image: {
        ...base,
        decorative: true,
        fit: "cover",
        position: "center",
      },
      opacity: 100,
    },
    accent: {
      colorToken: "accent",
      image: {
        ...accent,
        decorative: true,
        fit: "cover",
        position: "center",
      },
      opacity: 100,
      bleed: "none",
    },
  };
}

const heroBlueOrangeBackgrounds = {
  slide1: createBlueOrangeBackground({
    base: slide1BaseSources,
    accent: slide1AccentSources,
    baseColorToken: "white",
    accentSide: "right",
  }),
  slide2: createBlueOrangeBackground({
    base: slide2BaseSources,
    accent: slide2AccentSources,
    accentSide: "left",
  }),
  slide3: createBlueOrangeBackground({
    base: heroBlueBackgroundAssets.comboCold,
    accent: heroOrangeAccentAssets.comboCold,
    accentSide: "left",
  }),
} as const;

function createSingleImageBackground({
  asset,
  colorToken,
}: {
  asset: HeroBackgroundAsset;
  colorToken: SliderBackgroundColorToken;
}): NonNullable<AdminSliderItemDto["background"]> {
  return {
    mode: "single",
    layer: {
      colorToken,
      image: {
        ...asset,
        decorative: true,
        fit: "cover",
        position: "center",
      },
      opacity: 100,
    },
  };
}

const heroBlackBackgrounds = {
  s1: createSingleImageBackground({
    asset: heroBlackBackgroundAssets.s1,
    colorToken: "brand-dark",
  }),
};

export const mockCategories: CategoryDto[] = preparedMenuCategories.map((category) => ({
  ...category,
  createdAt: now,
  updatedAt: now,
}));

export const mockProducts: ProductDto[] = preparedMenuProducts.map((product) => ({
  ...product,
  createdAt: now,
  updatedAt: now,
}));

export const mockSliderItems: AdminSliderItemDto[] = [
  {
    id: "slider-kiyomi",
    title: "TU ANTOJO SOKY EMPIEZA AQUÍ",
    description:
      "Sushi con el equilibrio perfecto entre sabor, calidad y buena vibra.",
    headlineParts: [
      { type: "text", text: "TU ANTOJO" },
      { type: "brand-logo", label: "SOKY" },
      { type: "text", text: "EMPIEZA AQUÍ" },
    ],
    desktopImageUrl: slide1Product1Sources.desktop,
    mobileImageUrl: slide1Product1Sources.mobile,
    imageAlt: "Box SOKY con rolls, toppings y piezas para compartir.",
    productLayer: {
      ...slide1Product1Sources,
      alt: "Sushi tempura SOKY servido en bandeja negra.",
      fit: "cover",
      position: "center",
    },
    colorLayer: {
      value: "#FFFFFF",
      label: "Soky White",
    },
    rotatorImages: [
      {
        ...slide1Product1Sources,
        alt: "Sushi SOKY tempura con toppings en bandeja negra.",
      },
      {
        ...slide1Product2Sources,
        alt: "Sushi SOKY tempura con topping de cangrejo y crocante.",
      },
      {
        ...slide1Product3Sources,
        alt: "Sushi SOKY tempura con salsas y topping crujiente.",
      },
    ],
    mediaMode: "cutout-product",
    background: heroBlueOrangeBackgrounds.slide1,
    backgroundVariant: "signature",
    primaryCta: {
      label: "VER MENÚ",
      type: "MENU",
    },
    secondaryCta: {
      label: "Ubicación",
      type: "LOCATION",
    },
    intent: "welcome",
    layoutHint: "split",
    placement: "home_hero",
    status: "ACTIVE",
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "slider-boxes",
    title: "Un box para cada plan",
    description:
      "Elige entre Kiyomi, Kyoto o Kurama y comparte sin complicar la elección.",
    desktopImageUrl: boxKiyomiRotatorSources.desktop,
    mobileImageUrl: boxKiyomiRotatorSources.mobile,
    imageSources: boxKiyomiRotatorSources,
    imageAlt: "Box Kiyomi de SOKY con sushi y toppings para compartir.",
    rotatorImages: [
      {
        ...boxKiyomiRotatorSources,
        alt: "Box Kiyomi de SOKY con sushi y toppings para compartir.",
        name: "Box Kiyomi",
        priceLabel: "24€",
      },
      {
        ...boxKyotoRotatorSources,
        alt: "Box Kyoto de SOKY con piezas tempura y toppings.",
        name: "Box Kyoto",
        priceLabel: "15€",
      },
      {
        ...boxKuramaRotatorSources,
        alt: "Box Kurama de SOKY con selección de sushi para compartir.",
        name: "Box Kurama",
        priceLabel: "22€",
      },
    ],
    mediaMode: "cutout-product",
    mediaPosition: "center-right",
    background: {
      mode: "none",
    },
    colorLayer: {
      value: "#149EF2",
      label: "Azul cielo SOKY",
    },
    patternOverlay: {
      enabled: true,
      assetKey: "endless-clouds-light",
      opacity: 0.18,
      blendMode: "normal",
      size: "repeat",
      position: "center",
    },
    backgroundVariant: "default",
    primaryCta: {
      label: "Ver boxes",
      type: "CATEGORY",
      target: "boxes",
    },
    intent: "promotion",
    layoutHint: "split",
    placement: "home_hero",
    status: "ACTIVE",
    sortOrder: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "slider-weekly-special",
    title: "PIEZAS",
    description:
      "Todo el sabor SOKY, listo para compartir con bebida de 1 L incluida.",
    eyebrow: "10 FRIOS + 24 TEMPURA",
    badgeLabel: "EL MÁS PEDIDO",
    highlightText: "34",
    productName: "Box Osaka",
    promoNote: "Incluye toppings",
    desktopImageUrl: slidePromoMixtoImageUrl,
    mobileImageUrl: slidePromoMixtoImageUrl,
    imageAlt: "Box Osaka con selección mixta de sushi frío y tempura.",
    productLayer: {
      desktopUrl: "/images/hero/soky-hero-sushi-transparente.webp",
      mobileUrl: "/images/hero/soky-hero-sushi-transparente.webp",
      alt: "Box Osaka con 34 piezas de sushi frío y tempura.",
      fit: "contain",
      position: "center-left",
    },
    mediaMode: "cutout-product",
    mediaPosition: "center",
    background: {
      mode: "none",
    },
    colorLayer: {
      value: "#0E66D0",
      label: "Azul brillante SOKY",
    },
    patternOverlay: {
      enabled: true,
      assetKey: "endless-clouds-light",
      opacity: 0.35,
      blendMode: "normal",
      size: "repeat",
      position: "center",
    },
    backgroundVariant: "most-ordered",
    primaryCta: {
      label: "Pedir Box Osaka",
      type: "PRODUCT",
      target: "box-osaka",
    },
    secondaryCta: {
      label: "Ver menú",
      type: "MENU",
    },
    intent: "promotion",
    layoutHint: "image-led",
    placement: "home_hero",
    status: "ACTIVE",
    sortOrder: 3,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "slider-pickup",
    title: "Pide por WhatsApp",
    description: "Consulta opciones disponibles y cierra tu pedido por chat.",
    eyebrow: "Pedido rápido",
    badgeLabel: "Directo",
    desktopImageUrl: slidePromoMixtoImageUrl,
    mobileImageUrl: slidePromoMixtoImageUrl,
    imageAlt: "Box SOKY listo para pedir por WhatsApp.",
    mediaMode: "cutout-product",
    mediaPosition: "center",
    background: createSingleImageBackground({
      asset: heroBlueBackgroundAssets.comboLargeMixed,
      colorToken: "brand-primary",
    }),
    primaryCta: {
      label: "Escribir por WhatsApp",
      type: "WHATSAPP",
    },
    intent: "conversion",
    layoutHint: "split",
    placement: "home_hero",
    status: "INACTIVE",
    sortOrder: 5,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "slider-chat",
    title: "NO TE QUEDES CON LAS GANAS",
    description: "Pide delivery o ven a vistarnos.",
    eyebrow: "DELIVERY + PICKUP",
    desktopImageUrl: slideServiceDeliveryImageUrl,
    mobileImageUrl: slideServiceDeliveryImageUrl,
    imageAlt: "Sushi SOKY preparado para delivery o pickup.",
    mediaMode: "local-photo",
    mediaPosition: "center-left",
    frameEnabled: true,
    background: { mode: "none" },
    productLayer: {
      desktop: "/images/hero/soky-slide4-sushi-cutout.webp",
      desktopWide: "/images/hero/soky-slide4-sushi-cutout.webp",
      tabletLandscape: "/images/hero/soky-slide4-sushi-cutout.webp",
      tabletPortrait: "/images/hero/soky-slide4-sushi-cutout.webp",
      mobile: "/images/hero/soky-slide4-sushi-cutout.webp",
      alt: "Sushi SOKY preparado para delivery o pickup.",
      decorative: false,
      fit: "contain",
      position: "center-right",
    },
    primaryCta: {
      label: "Pedir por WhatsApp",
      type: "WHATSAPP",
      target: "Hola SOKY, quiero hacer un pedido.",
    },
    secondaryCta: {
      label: "Ver ubicación",
      type: "LOCATION",
      target: "/#ubicacion",
    },
    intent: "conversion",
    layoutHint: "poster",
    placement: "home_hero",
    status: "ACTIVE",
    sortOrder: 4,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "slider-hours",
    title: "Promos actualizadas",
    description: "Revisa el menú antes de pedir para ver las opciones activas.",
    eyebrow: "Aviso",
    highlightText: "NUEVO",
    desktopImageUrl: heroProductImageUrl,
    mobileImageUrl: heroProductImageUrl,
    imageAlt: "Box SOKY usado como imagen de apoyo para avisos del menú.",
    mediaMode: "promo-image",
    mediaPosition: "center-right",
    frameEnabled: true,
    background: heroBlackBackgrounds.s1,
    primaryCta: {
      label: "Ver menú",
      type: "MENU",
    },
    intent: "announcement",
    layoutHint: "image-led",
    placement: "home_hero",
    status: "INACTIVE",
    sortOrder: 6,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "slider-menu-banner",
    title: "Banner de menú",
    description:
      "Slide disponible para otro placement sin aparecer en el hero.",
    desktopImageUrl: "https://picsum.photos/seed/food-menu-banner/1400/980",
    imageAlt: "Ingredientes frescos preparados para cocinar.",
    primaryCta: {
      label: "Explorar",
      type: "CUSTOM_PATH",
      target: "/menu",
    },
    intent: "announcement",
    layoutHint: "image-led",
    placement: "menu_banner",
    status: "ACTIVE",
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "slider-draft",
    title: "Promo SOKY en borrador",
    description:
      "Contenido preparado para reemplazar cuando haya una campaña activa.",
    desktopImageUrl: heroProductImageUrl,
    mobileImageUrl: heroProductImageUrl,
    imageAlt: "Box SOKY usado como imagen temporal para una promo en borrador.",
    mediaMode: "promo-image",
    frameEnabled: true,
    background: heroBlueOrangeBackgrounds.slide1,
    primaryCta: {
      label: "Ver menú",
      type: "MENU",
    },
    intent: "promotion",
    layoutHint: "split",
    placement: "home_hero",
    status: "INACTIVE",
    sortOrder: 6,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockSettings: PublicSettingsDto = {
  businessName: "SOKY",
  slogan: "Sushi casual, colorido y fácil de pedir.",
  whatsappPhone: "+584127785027",
  instagramUrl: "https://www.instagram.com/soky_ve",
  googleMapsUrl: "https://maps.app.goo.gl/ZbBc8t1KkYPPGieRA",
  googleMapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.058560625368!2d-67.9517439!3d10.256860899999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e8043006a1e4489%3A0x5121e84328b258da!2sSoky%20Sushi!5e0!3m2!1ses!2sve!4v1791038800489!5m2!1ses!2sve",
  address: "Calle Ricaurte, San Diego 2006, Carabobo, Venezuela",
  openingHoursDisplay: [
    "Domingo a jueves · 12:00 p. m. – 10:00 p. m.",
    "Viernes y sábado · 12:00 p. m. – 12:00 a. m. (medianoche)",
  ],
  defaultCurrency: "EUR",
  acceptedCurrencies: ["USD", "EUR", "VES"],
  exchangeRateMode: "MANUAL",
  deliveryEnabled: true,
  pickupEnabled: true,
  deliveryNotes: "Delivery sujeto a zona y disponibilidad.",
  minimumOrderAmount: mockProducts
    .filter((product) => product.status === "ACTIVE" && product.isAvailable && product.priceCurrency === "EUR")
    .map((product) => Number(product.priceAmount))
    .toSorted((a, b) => a - b)[0]?.toFixed(2),
  serviceFeeEnabled: false,
  serviceFeeAmount: "0.00",
};

export const mockExchangeRate: ExchangeRateDto = {
  baseCurrency: "EUR",
  targetCurrency: "VES",
  rate: "980.61",
  mode: "MANUAL",
  source: "MANUAL",
  fetchedAt: new Date().toISOString(),
  stale: false,
  warning: "Tasa manual de prueba: 980,61 VES por EUR. Fecha de vigencia pendiente; no es una consulta al proveedor.",
};

export const mockUser: UserDto = {
  id: "user-admin",
  email: "admin@soky.test",
  role: "ADMIN",
  isActive: true,
};

export const mockOrderIntents: OrderIntentConfirmViewDto[] = [
  {
    id: "ord-001",
    publicCode: "SOKY-001",
    status: "PENDING_WHATSAPP",
    fulfillmentType: "PICKUP",
    customerName: "Cliente demo",
    customerPhone: "+584120000000",
    items: [
      {
        productId: "prod-kyoto",
        title: "Box Kyoto",
        slug: "box-kyoto",
        quantity: 1,
        unitPriceAmount: "24.00",
        unitPriceCurrency: "USD",
        lineTotalAmount: "24.00",
        lineTotalCurrency: "USD",
        lineTotalVes: "876.00",
      },
    ],
    totals: {
      subtotalUsd: "24.00",
      totalVes: "876.00",
    },
    rateSnapshot: mockExchangeRate,
    expiresAt: new Date("2026-06-15T14:00:00.000Z").toISOString(),
  },
];

export const adminAnalyticsSummary: AdminAnalyticsSummaryDto = {
  productViews: 284,
  addToCart: 73,
  checkoutStarted: 28,
  whatsappClicked: 21,
  conversionRate: "28.8%",
};

export const adminAnalyticsProducts: AdminAnalyticsProductDto[] = mockProducts
  .slice(0, 5)
  .map((product, index) => ({
    productId: product.id,
    title: product.title,
    views: 90 - index * 11,
    addToCart: 28 - index * 4,
    conversionRate: `${31 - index * 2}%`,
  }));

export const adminAnalyticsSliders: AdminAnalyticsSliderDto[] =
  mockSliderItems.map((slider, index) => ({
    sliderId: slider.id,
    title: slider.title,
    views: 130 - index * 18,
    clicks: 38 - index * 5,
    clickRate: `${29 - index * 3}%`,
  }));
