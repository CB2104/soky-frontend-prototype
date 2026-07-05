export type Currency = "USD" | "EUR" | "VES";
export type PriceCurrency = "USD" | "EUR";
export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type ProductType = "SIMPLE" | "PROMO" | "COMBO";
export type FulfillmentType = "PICKUP" | "DELIVERY";
export type OrderIntentStatus =
  | "PENDING_WHATSAPP"
  | "CONFIRMED_BY_OPERATOR"
  | "CANCELLED"
  | "EXPIRED";
export type ExchangeRateMode = "OFFICIAL" | "PARALLEL" | "MANUAL";
export type ExchangeRateSource = "DOLAR_API" | "MANUAL";
export type SliderIntent =
  | "welcome"
  | "promotion"
  | "conversion"
  | "announcement";

export type SliderLayoutHint =
  | "split"
  | "poster"
  | "image-led";

export type SliderPlacement =
  | "home_hero"
  | "promo_section"
  | "menu_banner";

export type SliderStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED";

export type SliderCtaType =
  | "NONE"
  | "MENU"
  | "LOCATION"
  | "CART"
  | "WHATSAPP"
  | "PRODUCT"
  | "CATEGORY"
  | "CUSTOM_PATH";

export type SliderCtaDto = {
  label: string;
  type: SliderCtaType;
  target?: string;
};

export type SliderImageFit = "cover" | "contain";

export type SliderImagePosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "center-left"
  | "center-right";

export type SliderBackgroundColorToken =
  | "brand-primary"
  | "brand-dark"
  | "accent"
  | "paper"
  | "white";

export type SliderBackgroundOpacity = 100 | 70 | 50 | 35;

export type SliderBackgroundBleed =
  | "none"
  | "contained-start"
  | "contained-end";

export type SliderBackgroundImageDto = {
  desktopUrl: string;
  mobileUrl?: string;
  decorative?: true;
  fit?: SliderImageFit;
  position?: SliderImagePosition;
};

export type SliderBackgroundLayerDto = {
  colorToken?: SliderBackgroundColorToken;
  image?: SliderBackgroundImageDto;
  opacity?: SliderBackgroundOpacity;
};

export type SliderBackgroundDto =
  | {
      mode: "none";
    }
  | {
      mode: "single";
      layer: SliderBackgroundLayerDto;
    }
  | {
      mode: "two-layer";
      base: SliderBackgroundLayerDto;
      accent: SliderBackgroundLayerDto & {
        bleed?: SliderBackgroundBleed;
      };
    };

export type SliderMediaMode =
  | "cutout-product"
  | "promo-image"
  | "local-photo";

export type SliderBaseMediaDto = {
  desktopImageUrl: string;
  mobileImageUrl?: string;
  imageAlt: string;
  mediaFit?: SliderImageFit;
  mediaPosition?: SliderImagePosition;
};

export type SliderCutoutMediaDto = SliderBaseMediaDto & {
  mediaMode: "cutout-product";
  frameEnabled?: never;
};

export type SliderFramedMediaDto = SliderBaseMediaDto & {
  mediaMode?: "promo-image" | "local-photo";
  frameEnabled?: boolean;
};

export type SliderMediaDto = SliderCutoutMediaDto | SliderFramedMediaDto;

type PublicSliderItemBaseDto = {
  id: string;
  title: string;
  description?: string;
  eyebrow?: string;
  badgeLabel?: string;
  highlightText?: string;
  background?: SliderBackgroundDto;

  primaryCta?: SliderCtaDto;
  secondaryCta?: SliderCtaDto;

  intent: SliderIntent;
  layoutHint: SliderLayoutHint;
};

export type PublicSliderItemDto = PublicSliderItemBaseDto & SliderMediaDto;

export type AdminSliderItemDto = PublicSliderItemDto & {
  placement: SliderPlacement;
  status: SliderStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};

export type LegacySliderCtaType =
  | "NONE"
  | "PRODUCT"
  | "CATEGORY"
  | "CUSTOM_URL";
export type CategoryGroup = "FOOD" | "DRINK" | "COMBO" | "DESSERT" | "OTHER";
export type UserRole = "ADMIN";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "PRODUCT_NOT_FOUND"
  | "CATEGORY_NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "EXCHANGE_RATE_UNAVAILABLE"
  | "ORDER_TOKEN_EXPIRED"
  | "ORDER_TOKEN_USED"
  | "ORDER_TOKEN_INVALID"
  | "INVALID_CART_ITEM"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export type ApiErrorResponse = {
  code: ApiErrorCode | string;
  message: string;
  details?: unknown;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
};

export type UserDto = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export type AuthLoginRequestDto = {
  email: string;
  password: string;
};

export type AuthLoginResponseDto = {
  accessToken: string;
  user: UserDto;
};

export type AuthRefreshResponseDto = {
  accessToken: string;
};

export type CategoryDto = {
  id: string;
  key: string;
  name: string;
  slug: string;
  group?: CategoryGroup;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductDto = {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description: string;
  categoryId: string;
  categorySlug?: string;
  type: ProductType;
  status: ProductStatus;
  isAvailable: boolean;
  sortOrder: number;
  priceCurrency: PriceCurrency;
  priceAmount: string;
  imageUrl: string;
  imageAlt: string;
  featured: boolean;
  tags: string[];
  allergens: string[];
  createdAt?: string;
  updatedAt?: string;
};

/** @deprecated Use PublicSliderItemDto/AdminSliderItemDto after slider mapper migration. */
export type LegacySliderItemDto = {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  imageAlt: string;
  ctaLabel?: string;
  ctaType: LegacySliderCtaType;
  ctaTarget?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

/** @deprecated Temporary compatibility alias for current mock/home/admin usage. */
export type SliderItemDto = LegacySliderItemDto;

export type PublicSettingsDto = {
  businessName: string;
  slogan?: string;
  whatsappPhone: string;
  instagramUrl?: string;
  googleMapsUrl?: string;
  address?: string;
  openingHoursDisplay: string[];
  defaultCurrency: PriceCurrency;
  acceptedCurrencies: Currency[];
  exchangeRateMode: ExchangeRateMode;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryNotes?: string;
  minimumOrderAmount?: string;
  serviceFeeEnabled: boolean;
  serviceFeeAmount?: string;
};

export type ExchangeRateDto = {
  baseCurrency: PriceCurrency;
  targetCurrency: "VES";
  rate: string;
  mode: ExchangeRateMode;
  source: ExchangeRateSource;
  fetchedAt: string;
  stale: boolean;
  warning?: string;
};

export type CartQuoteRequestDto = {
  items: { productId: string; quantity: number; notes?: string }[];
  fulfillmentType?: FulfillmentType;
};

export type CartQuoteItemDto = {
  productId: string;
  title: string;
  slug: string;
  quantity: number;
  unitPriceAmount: string;
  unitPriceCurrency: PriceCurrency;
  lineTotalAmount: string;
  lineTotalCurrency: PriceCurrency;
  lineTotalVes: string;
};

export type InvalidCartItemReason =
  | "NOT_FOUND"
  | "INACTIVE"
  | "UNAVAILABLE"
  | "INVALID_QUANTITY";

export type CartQuoteResponseDto = {
  items: CartQuoteItemDto[];
  totals: { subtotalUsd?: string; subtotalEur?: string; totalVes: string };
  rateSnapshot: ExchangeRateDto;
  warnings: string[];
  invalidItems: { productId: string; reason: InvalidCartItemReason }[];
};

export type CreateOrderIntentRequestDto = {
  items: { productId: string; quantity: number; notes?: string }[];
  customerName?: string;
  customerPhone?: string;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: string;
  notes?: string;
};

export type CreateOrderIntentResponseDto = {
  id: string;
  publicCode: string;
  status: "PENDING_WHATSAPP";
  whatsappUrl: string;
  whatsappMessage: string;
  confirmationUrl: string;
  expiresAt: string;
  warnings: string[];
};

export type OrderIntentConfirmViewDto = {
  id: string;
  publicCode: string;
  status: OrderIntentStatus;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  items: CartQuoteItemDto[];
  totals: CartQuoteResponseDto["totals"];
  rateSnapshot: ExchangeRateDto;
  expiresAt?: string;
  whatsappClickedAt?: string;
  confirmedAt?: string;
};

export type ConfirmOrderIntentResponseDto = {
  id: string;
  publicCode: string;
  status: "CONFIRMED_BY_OPERATOR";
  confirmedAt: string;
};

export type WhatsappClickedResponseDto = {
  id: string;
  status: OrderIntentStatus;
  whatsappClickedAt: string;
};

export type AnalyticsEventType =
  | "page_view"
  | "section_view"
  | "category_view"
  | "product_view"
  | "promo_view"
  | "product_add_to_cart"
  | "product_remove_from_cart"
  | "cart_open"
  | "checkout_started"
  | "whatsapp_clicked"
  | "slider_view"
  | "slider_click"
  | "contact_speed_dial_open"
  | "contact_whatsapp_click"
  | "contact_instagram_click"
  | "contact_tiktok_click";

export type AnalyticsEntityType =
  | "product"
  | "promo"
  | "category"
  | "slider"
  | "cart"
  | "page";

export type AnalyticsEventRequestDto = {
  sessionId: string;
  eventType: AnalyticsEventType;
  entityType?: AnalyticsEntityType;
  entityId?: string;
  section?: string;
  metadata?: Record<string, unknown>;
};

export type AnalyticsEventResponseDto = {
  accepted: true;
};

export type AdminProductCreateDto = {
  title: string;
  slug: string;
  shortDescription?: string;
  description: string;
  categoryId: string;
  type: ProductType;
  status: ProductStatus;
  isAvailable: boolean;
  sortOrder: number;
  priceCurrency: PriceCurrency;
  priceAmount: string;
  imageUrl: string;
  imageAlt: string;
  featured: boolean;
  tags: string[];
  allergens: string[];
};

export type AdminProductUpdateDto = Partial<AdminProductCreateDto>;

export type AdminCategoryCreateDto = {
  key: string;
  name: string;
  slug: string;
  group?: CategoryGroup;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
};

export type AdminCategoryUpdateDto = Partial<AdminCategoryCreateDto>;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type DistributivePartial<T> = T extends unknown ? Partial<T> : never;

type AdminSliderImmutableFields = "id" | "createdAt" | "updatedAt";
type AdminSliderCreateDefaultFields =
  | "intent"
  | "layoutHint"
  | "placement"
  | "status"
  | "sortOrder";

export type AdminSliderCreateDto = DistributiveOmit<
  AdminSliderItemDto,
  AdminSliderImmutableFields | AdminSliderCreateDefaultFields
> &
  Partial<Pick<AdminSliderItemDto, AdminSliderCreateDefaultFields>>;

export type AdminSliderUpdateDto = DistributivePartial<
  DistributiveOmit<AdminSliderItemDto, AdminSliderImmutableFields>
>;

export type AdminSettingsUpdateDto = Partial<PublicSettingsDto>;

export type AdminAnalyticsSummaryDto = {
  productViews: number;
  addToCart: number;
  checkoutStarted: number;
  whatsappClicked: number;
  conversionRate: string;
};

export type AdminAnalyticsProductDto = {
  productId: string;
  title: string;
  views: number;
  addToCart: number;
  conversionRate: string;
};

export type AdminAnalyticsSliderDto = {
  sliderId: string;
  title: string;
  views: number;
  clicks: number;
  clickRate: string;
};
