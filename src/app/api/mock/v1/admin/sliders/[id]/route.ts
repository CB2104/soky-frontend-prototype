import { NextResponse } from "next/server";
import type {
  AdminSliderItemDto,
  AdminSliderUpdateDto,
  LegacySliderCtaType,
  SliderCtaDto,
  SliderMediaDto,
  SliderMediaMode,
} from "@/contracts/api";
import { mockSliderItems } from "@/mock/db";
import { errorResponse } from "@/mock/helpers";
import { getPatchedModernSliderFields } from "@/mock/slider-modern-fields";

const DEFAULT_MEDIA_MODE: Exclude<SliderMediaMode, "cutout-product"> =
  "promo-image";
const DEFAULT_FRAME_ENABLED = true;

type RouteContext = {
  params: Promise<{ id: string }>;
};

type LegacySliderUpdateFields = {
  imageUrl?: string;
  ctaLabel?: string;
  ctaType?: LegacySliderCtaType;
  ctaTarget?: string;
  isActive?: boolean;
};

type AdminSliderUpdateRequest = AdminSliderUpdateDto & LegacySliderUpdateFields;

function requireAuth(request: Request) {
  return request.headers.get("authorization")?.startsWith("Bearer ");
}

function hasLegacyCtaFields(body: AdminSliderUpdateRequest) {
  return (
    body.ctaLabel !== undefined ||
    body.ctaType !== undefined ||
    body.ctaTarget !== undefined
  );
}

function getPrimaryCta(
  body: AdminSliderUpdateRequest,
  current: AdminSliderItemDto,
): SliderCtaDto | undefined {
  if (body.primaryCta) {
    return body.primaryCta;
  }

  if (!hasLegacyCtaFields(body)) {
    return current.primaryCta;
  }

  if (!body.ctaLabel || !body.ctaType || body.ctaType === "NONE") {
    return undefined;
  }

  if (body.ctaType === "PRODUCT" || body.ctaType === "CATEGORY") {
    return {
      label: body.ctaLabel,
      type: body.ctaType,
      target: body.ctaTarget,
    };
  }

  return {
    label: body.ctaLabel,
    type: "CUSTOM_PATH",
    target: body.ctaTarget,
  };
}

function getStatus(
  body: AdminSliderUpdateRequest,
  current: AdminSliderItemDto,
): AdminSliderItemDto["status"] {
  if (body.status) {
    return body.status;
  }

  if (body.isActive === true) {
    return "ACTIVE";
  }

  if (body.isActive === false) {
    return "INACTIVE";
  }

  return current.status;
}

function hasActivePlacementLimit(slider: AdminSliderItemDto) {
  if (slider.status !== "ACTIVE") {
    return false;
  }

  const activeCount = mockSliderItems.filter(
    (item) =>
      item.id !== slider.id &&
      item.placement === slider.placement &&
      item.status === "ACTIVE",
  ).length;

  return activeCount >= 6;
}

function getMediaFields(
  body: AdminSliderUpdateRequest,
  current: AdminSliderItemDto,
): SliderMediaDto {
  const desktopImageUrl =
    body.desktopImageUrl ?? body.imageUrl ?? current.desktopImageUrl;
  const mediaMode = body.mediaMode ?? current.mediaMode ?? DEFAULT_MEDIA_MODE;
  const mediaBase = {
    desktopImageUrl,
    mobileImageUrl: body.mobileImageUrl ?? current.mobileImageUrl,
    imageSources: body.imageSources ?? current.imageSources,
    imageAlt: body.imageAlt ?? current.imageAlt,
    mediaFit: body.mediaFit ?? current.mediaFit,
    mediaPosition: body.mediaPosition ?? current.mediaPosition,
    rotatorImages: body.rotatorImages ?? current.rotatorImages,
  };

  if (mediaMode === "cutout-product") {
    return {
      ...mediaBase,
      mediaMode,
    };
  }

  const existingFrameEnabled =
    current.mediaMode === "cutout-product" ? undefined : current.frameEnabled;

  return {
    ...mediaBase,
    mediaMode,
    frameEnabled:
      body.frameEnabled ?? existingFrameEnabled ?? DEFAULT_FRAME_ENABLED,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const { id } = await context.params;
  const index = mockSliderItems.findIndex((slider) => slider.id === id);

  if (index < 0) {
    return errorResponse("NOT_FOUND", "Slider no encontrado.", 404);
  }

  const body = (await request
    .json()
    .catch(() => null)) as AdminSliderUpdateRequest | null;

  if (!body) {
    return errorResponse("VALIDATION_ERROR", "Payload inválido.", 422);
  }

  const current = mockSliderItems[index];
  const timestamp = new Date().toISOString();
  const status = getStatus(body, current);
  const modernFields = getPatchedModernSliderFields(body, current);
  const updatedSlider: AdminSliderItemDto = {
    id: current.id,
    title: body.title ?? current.title,
    description: body.description ?? current.description,
    eyebrow: body.eyebrow ?? current.eyebrow,
    badgeLabel: body.badgeLabel ?? current.badgeLabel,
    productName: body.productName ?? current.productName,
    promoNote: body.promoNote ?? current.promoNote,
    highlightText: body.highlightText ?? current.highlightText,
    ...modernFields,
    ...getMediaFields(body, current),
    background: body.background ?? current.background,
    primaryCta: getPrimaryCta(body, current),
    secondaryCta: body.secondaryCta ?? current.secondaryCta,
    intent: body.intent ?? current.intent,
    layoutHint: body.layoutHint ?? current.layoutHint,
    placement: body.placement ?? current.placement,
    status,
    sortOrder: body.sortOrder ?? current.sortOrder,
    createdAt: current.createdAt,
    updatedAt: timestamp,
    archivedAt:
      status === "ARCHIVED"
        ? (body.archivedAt ?? current.archivedAt ?? timestamp)
        : body.archivedAt,

    backgroundVariant: body.backgroundVariant ?? current.backgroundVariant,
  };

  if (hasActivePlacementLimit(updatedSlider)) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Solo se permiten 6 sliders activos por placement.",
      422,
    );
  }

  mockSliderItems[index] = updatedSlider;

  return NextResponse.json(updatedSlider);
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const { id } = await context.params;
  const index = mockSliderItems.findIndex((slider) => slider.id === id);

  if (index < 0) {
    return errorResponse("NOT_FOUND", "Slider no encontrado.", 404);
  }

  const timestamp = new Date().toISOString();
  mockSliderItems[index] = {
    ...mockSliderItems[index],
    status: "ARCHIVED",
    archivedAt: timestamp,
    updatedAt: timestamp,
  };

  return new NextResponse(null, { status: 204 });
}
