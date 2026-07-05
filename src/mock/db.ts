import type {
  AdminAnalyticsProductDto,
  AdminAnalyticsSliderDto,
  AdminAnalyticsSummaryDto,
  AdminSliderItemDto,
  CategoryDto,
  ExchangeRateDto,
  OrderIntentConfirmViewDto,
  ProductDto,
  PublicSettingsDto,
  SliderBackgroundColorToken,
  UserDto,
} from "@/contracts/api";

const now = new Date("2026-06-14T14:00:00.000Z").toISOString();

const heroProductImageUrl = "/images/soky-hero-party-box.png";

type HeroBackgroundAsset = {
  desktopUrl: string;
  mobileUrl?: string;
};

type HeroAccentSide = "left" | "right";

type BlueOrangeBackgroundOptions = {
  accent?: HeroBackgroundAsset;
  accentSide: HeroAccentSide;
  base: HeroBackgroundAsset;
};

const heroBlueBackgroundAssets = {
  v1: {
    desktopUrl: "/images/hero/hero-base-blue-desktopS3.webp",
    mobileUrl: "/images/hero/hero-base-blue-mobile-s2.webp",
  },
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
} as const satisfies Record<string, HeroBackgroundAsset>;

const heroPaperBackgroundAssets = {
  v1: {
    desktopUrl: "/images/hero/hero-base-paper-desktop.webp",
    mobileUrl: "/images/hero/hero-base-paper-mobile.webp",
  },
  v2: {
    desktopUrl: "/images/hero/hero-base-paper-desktop-v2.webp",
    mobileUrl: "/images/hero/hero-base-paper-mobile-v2.webp",
  },
} as const satisfies Record<string, HeroBackgroundAsset>;

const heroOrangeAccentAssets = {
  left: {
    desktopUrl: "/images/hero/hero-accent-orange-desktop-left.webp",
    mobileUrl: "/images/hero/welcome-orange-accent-mobile-original-left.webp",
  },
  right: {
    desktopUrl: "/images/hero/hero-accent-orange-desktop-right.webp",
    mobileUrl: "/images/hero/welcome-orange-accent-mobile-original-right.webp",
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
}: BlueOrangeBackgroundOptions): NonNullable<AdminSliderItemDto["background"]> {
  return {
    mode: "two-layer",
    base: {
      colorToken: "brand-primary",
      image: {
        desktopUrl: base.desktopUrl,
        ...(base.mobileUrl ? { mobileUrl: base.mobileUrl } : {}),
        decorative: true,
        fit: "cover",
        position: "center",
      },
      opacity: 100,
    },
    accent: {
      colorToken: "accent",
      image: {
        desktopUrl: accent.desktopUrl,
        ...(accent.mobileUrl ? { mobileUrl: accent.mobileUrl } : {}),
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
    base: heroBlueBackgroundAssets.v1,
    accentSide: "right",
  }),
  slide2: createBlueOrangeBackground({
    base: heroBlueBackgroundAssets.v2,
    accentSide: "left",
  }),
  slide3: createBlueOrangeBackground({
    base: heroBlueBackgroundAssets.v3,
    accentSide: "left",
  }),
  slide4: createBlueOrangeBackground({
    base: heroBlueBackgroundAssets.v4,
    accentSide: "right",
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
        desktopUrl: asset.desktopUrl,
        ...(asset.mobileUrl ? { mobileUrl: asset.mobileUrl } : {}),
        decorative: true,
        fit: "cover",
        position: "center",
      },
      opacity: 100,
    },
  };
}

function createPaperBackground(
  asset: HeroBackgroundAsset,
): NonNullable<AdminSliderItemDto["background"]> {
  return createSingleImageBackground({ asset, colorToken: "paper" });
}

const heroPaperBackgrounds = {
  v1: createPaperBackground(heroPaperBackgroundAssets.v1),
  v2: createPaperBackground(heroPaperBackgroundAssets.v2),
};

const heroBlackBackgrounds = {
  s1: createSingleImageBackground({
    asset: heroBlackBackgroundAssets.s1,
    colorToken: "brand-dark",
  }),
};

export const mockCategories: CategoryDto[] = [
  {
    id: "cat-boxes",
    key: "boxes",
    name: "Boxes",
    slug: "boxes",
    group: "COMBO",
    description: "Promos generosas para compartir.",
    imageUrl: "https://picsum.photos/seed/soky-sushi-box-category/900/700",
    sortOrder: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "cat-tempura",
    key: "tempura",
    name: "Tempura",
    slug: "tempura",
    group: "FOOD",
    description: "Rolls crocantes con toppings y salsas.",
    imageUrl: "https://picsum.photos/seed/soky-tempura-category/900/700",
    sortOrder: 2,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "cat-frios",
    key: "frios",
    name: "Fríos",
    slug: "frios",
    group: "FOOD",
    description: "Rolls fríos y frescos para combinar.",
    imageUrl: "https://picsum.photos/seed/soky-cold-roll-category/900/700",
    sortOrder: 3,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "cat-entradas",
    key: "entradas",
    name: "Entradas",
    slug: "entradas",
    group: "FOOD",
    description: "Extras crujientes para acompañar.",
    imageUrl: "https://picsum.photos/seed/soky-starters-category/900/700",
    sortOrder: 4,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "cat-bebidas",
    key: "bebidas",
    name: "Bebidas",
    slug: "bebidas",
    group: "DRINK",
    description: "Refrescos y acompañantes.",
    imageUrl: "https://picsum.photos/seed/soky-drinks-category/900/700",
    sortOrder: 5,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockProducts: ProductDto[] = [
  {
    id: "prod-kiyomi",
    title: "Box Kiyomi",
    slug: "box-kiyomi",
    shortDescription: "72 piezas para compartir.",
    description:
      "Una promo grande con rolls tempura, piezas frías, toppings y refresco para una mesa completa.",
    categoryId: "cat-boxes",
    categorySlug: "boxes",
    type: "COMBO",
    status: "ACTIVE",
    isAvailable: true,
    sortOrder: 1,
    priceCurrency: "EUR",
    priceAmount: "38.00",
    imageUrl: "https://picsum.photos/seed/soky-box-kiyomi-sushi/1000/760",
    imageAlt:
      "Box Kiyomi de 72 piezas de sushi con toppings sobre bandeja negra.",
    featured: true,
    tags: ["72 piezas", "Promo", "Compartir"],
    allergens: ["Pescado", "Sésamo"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-kyoto",
    title: "Box Kyoto",
    slug: "box-kyoto",
    shortDescription: "36 piezas con entradas.",
    description:
      "Box mixto con rolls fríos, tempura, entradas y refresco según disponibilidad.",
    categoryId: "cat-boxes",
    categorySlug: "boxes",
    type: "COMBO",
    status: "ACTIVE",
    isAvailable: true,
    sortOrder: 2,
    priceCurrency: "USD",
    priceAmount: "24.00",
    imageUrl: "https://picsum.photos/seed/soky-box-kyoto-rolls/1000/760",
    imageAlt: "Box Kyoto de 36 piezas con rolls fríos y tempura.",
    featured: true,
    tags: ["36 piezas", "Más pedido"],
    allergens: ["Pescado", "Cangrejo"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-osaka",
    title: "Box Osaka",
    slug: "box-osaka",
    shortDescription: "34 piezas mixtas.",
    description:
      "Incluye 10 fríos, 24 tempura y refresco de 1L para compartir.",
    categoryId: "cat-boxes",
    categorySlug: "boxes",
    type: "COMBO",
    status: "ACTIVE",
    isAvailable: true,
    sortOrder: 3,
    priceCurrency: "USD",
    priceAmount: "22.00",
    imageUrl: "https://picsum.photos/seed/soky-box-osaka-tempura/1000/760",
    imageAlt: "Box Osaka mixto de sushi con piezas tempura y frías.",
    featured: true,
    tags: ["34 piezas", "Mixto"],
    allergens: ["Pescado"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-soky",
    title: "Box SOKY",
    slug: "box-soky",
    shortDescription: "36 piezas todos tempura.",
    description:
      "Rolls tempura crujientes con toppings, salsa y una presentación abundante.",
    categoryId: "cat-tempura",
    categorySlug: "tempura",
    type: "PROMO",
    status: "ACTIVE",
    isAvailable: true,
    sortOrder: 4,
    priceCurrency: "USD",
    priceAmount: "20.00",
    imageUrl: "https://picsum.photos/seed/soky-tempura-rolls/1000/760",
    imageAlt: "Box SOKY de rolls tempura con salsa y topping.",
    featured: false,
    tags: ["36 piezas", "Todos tempura"],
    allergens: ["Pescado", "Gluten"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-samurai",
    title: "Box Samurai",
    slug: "box-samurai",
    shortDescription: "30 piezas todos fríos.",
    description:
      "Una opción fresca con rolls fríos, ideal para combinar con entradas.",
    categoryId: "cat-frios",
    categorySlug: "frios",
    type: "PROMO",
    status: "ACTIVE",
    isAvailable: true,
    sortOrder: 5,
    priceCurrency: "USD",
    priceAmount: "18.00",
    imageUrl: "https://picsum.photos/seed/soky-cold-rolls/1000/760",
    imageAlt: "Box Samurai con rolls fríos de sushi.",
    featured: false,
    tags: ["30 piezas", "Fríos"],
    allergens: ["Pescado"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-crispy",
    title: "Camarón crispy",
    slug: "camaron-crispy",
    shortDescription: "Entrada crujiente.",
    description:
      "Camarones crispy para acompañar tu box o armar una orden más completa.",
    categoryId: "cat-entradas",
    categorySlug: "entradas",
    type: "SIMPLE",
    status: "ACTIVE",
    isAvailable: true,
    sortOrder: 6,
    priceCurrency: "USD",
    priceAmount: "8.00",
    imageUrl: "https://picsum.photos/seed/soky-crispy-shrimp/1000/760",
    imageAlt: "Entrada de camarón crispy con salsa.",
    featured: false,
    tags: ["Entrada", "Crispy"],
    allergens: ["Crustáceos", "Gluten"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-fuji",
    title: "Fuji Roll",
    slug: "fuji-roll",
    shortDescription: "Temporalmente no disponible.",
    description:
      "Roll especial con salsa Fuji y topping. Vuelve pronto al menú.",
    categoryId: "cat-tempura",
    categorySlug: "tempura",
    type: "SIMPLE",
    status: "ACTIVE",
    isAvailable: false,
    sortOrder: 7,
    priceCurrency: "USD",
    priceAmount: "10.00",
    imageUrl: "https://picsum.photos/seed/soky-fuji-roll/1000/760",
    imageAlt: "Fuji Roll con topping y salsa.",
    featured: false,
    tags: ["Especial"],
    allergens: ["Pescado", "Gluten"],
    createdAt: now,
    updatedAt: now,
  },
];

export const mockSliderItems: AdminSliderItemDto[] = [
  {
    id: "slider-kiyomi",
    title: "Comida para compartir",
    description: "Combos, entradas y favoritos listos para pedir.",
    eyebrow: "Bienvenido",
    badgeLabel: "Popular",
    desktopImageUrl: heroProductImageUrl,
    mobileImageUrl: heroProductImageUrl,
    imageAlt: "Box SOKY con rolls, toppings y piezas para compartir.",
    mediaMode: "promo-image",
    frameEnabled: true,
    background: heroBlueOrangeBackgrounds.slide1,
    primaryCta: {
      label: "Ver menú",
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
    title: "Combos para compartir",
    description:
      "Boxes generosos para pedir en grupo sin complicar la elección.",
    eyebrow: "Promos SOKY",
    badgeLabel: "Popular",
    highlightText: "COMBOS",
    desktopImageUrl: heroProductImageUrl,
    mobileImageUrl: heroProductImageUrl,
    imageAlt: "Box SOKY con sushi, toppings y piezas para una mesa compartida.",
    mediaMode: "promo-image",
    mediaPosition: "center-right",
    frameEnabled: true,
    background: heroBlueOrangeBackgrounds.slide2,
    primaryCta: {
      label: "Ver boxes",
      type: "CATEGORY",
      target: "boxes",
    },
    secondaryCta: {
      label: "Pedir por WhatsApp",
      type: "WHATSAPP",
    },
    intent: "promotion",
    layoutHint: "poster",
    placement: "home_hero",
    status: "ACTIVE",
    sortOrder: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "slider-weekly-special",
    title: "Favoritos tempura",
    description:
      "Rolls crocantes y combinaciones para sumar textura al pedido.",
    eyebrow: "Crocante",
    badgeLabel: "Favoritos",
    highlightText: "TEMPURA",
    desktopImageUrl: heroProductImageUrl,
    mobileImageUrl: heroProductImageUrl,
    imageAlt: "Rolls SOKY servidos en un box con piezas crocantes y toppings.",
    mediaMode: "promo-image",
    mediaPosition: "center",
    frameEnabled: true,
    background: heroBlueOrangeBackgrounds.slide3,
    primaryCta: {
      label: "Ver tempura",
      type: "CATEGORY",
      target: "tempura",
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
    desktopImageUrl: heroProductImageUrl,
    mobileImageUrl: heroProductImageUrl,
    imageAlt: "Box SOKY listo para pedir por WhatsApp.",
    mediaMode: "local-photo",
    frameEnabled: true,
    mediaPosition: "center",
    background: heroBlueOrangeBackgrounds.slide4,
    primaryCta: {
      label: "Escribir por WhatsApp",
      type: "WHATSAPP",
    },
    intent: "conversion",
    layoutHint: "split",
    placement: "home_hero",
    status: "ACTIVE",
    sortOrder: 4,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "slider-chat",
    title: "Retiro o delivery",
    description:
      "Consulta disponibilidad de retiro o delivery antes de cerrar tu pedido.",
    eyebrow: "Disponibilidad",
    desktopImageUrl: heroProductImageUrl,
    mobileImageUrl: heroProductImageUrl,
    imageAlt: "Pedido SOKY preparado para retiro o delivery.",
    mediaMode: "local-photo",
    mediaPosition: "center-left",
    frameEnabled: true,
    background: heroPaperBackgrounds.v2,
    primaryCta: {
      label: "Consultar disponibilidad",
      type: "WHATSAPP",
    },
    secondaryCta: {
      label: "Ver ubicación",
      type: "LOCATION",
    },
    intent: "conversion",
    layoutHint: "poster",
    placement: "home_hero",
    status: "ACTIVE",
    sortOrder: 5,
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
    status: "ACTIVE",
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
    status: "DRAFT",
    sortOrder: 7,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockSettings: PublicSettingsDto = {
  businessName: "SOKY",
  slogan: "Sushi casual, colorido y fácil de pedir.",
  whatsappPhone: "+584120000000",
  instagramUrl: "https://www.instagram.com/soky_ve",
  googleMapsUrl: "https://maps.google.com",
  address: "Agregar dirección real del local",
  openingHoursDisplay: ["Lunes a domingo", "12:00 PM - 10:00 PM"],
  defaultCurrency: "USD",
  acceptedCurrencies: ["USD", "EUR", "VES"],
  exchangeRateMode: "MANUAL",
  deliveryEnabled: true,
  pickupEnabled: true,
  deliveryNotes: "Delivery sujeto a zona y disponibilidad.",
  minimumOrderAmount: "8.00",
  serviceFeeEnabled: false,
  serviceFeeAmount: "0.00",
};

export const mockExchangeRate: ExchangeRateDto = {
  baseCurrency: "USD",
  targetCurrency: "VES",
  rate: "36.50",
  mode: "MANUAL",
  source: "MANUAL",
  fetchedAt: now,
  stale: false,
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
