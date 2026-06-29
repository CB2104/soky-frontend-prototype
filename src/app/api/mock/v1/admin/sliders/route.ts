import { NextResponse } from "next/server";
import type {
  AdminSliderItemDto,
  LegacySliderCtaType,
  SliderCtaDto,
} from "@/contracts/api";
import { mockSliderItems } from "@/mock/db";
import { errorResponse, paginate } from "@/mock/helpers";

type LegacySliderCreateFields = {
  imageUrl?: string;
  ctaLabel?: string;
  ctaType?: LegacySliderCtaType;
  ctaTarget?: string;
  isActive?: boolean;
};

type AdminSliderCreateRequest = Partial<AdminSliderItemDto> & LegacySliderCreateFields;

function requireAuth(request: Request) {
  return request.headers.get("authorization")?.startsWith("Bearer ");
}

function getPrimaryCta(body: AdminSliderCreateRequest): SliderCtaDto | undefined {
  if (body.primaryCta) {
    return body.primaryCta;
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

function getStatus(body: AdminSliderCreateRequest): AdminSliderItemDto["status"] {
  if (body.status) {
    return body.status;
  }

  if (body.isActive === true) {
    return "ACTIVE";
  }

  if (body.isActive === false) {
    return "INACTIVE";
  }

  return "DRAFT";
}

function getNextSortOrder(placement: AdminSliderItemDto["placement"]) {
  const sortOrders = mockSliderItems
    .filter((slider) => slider.placement === placement)
    .map((slider) => slider.sortOrder);

  return Math.max(0, ...sortOrders) + 1;
}

function hasActivePlacementLimit(slider: AdminSliderItemDto) {
  if (slider.status !== "ACTIVE") {
    return false;
  }

  const activeCount = mockSliderItems.filter(
    (item) => item.placement === slider.placement && item.status === "ACTIVE",
  ).length;

  return activeCount >= 6;
}

export async function GET(request: Request) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const { searchParams } = new URL(request.url);
  return NextResponse.json(
    paginate(
      mockSliderItems.toSorted((a, b) => a.sortOrder - b.sortOrder),
      Number(searchParams.get("page") ?? "1"),
      Number(searchParams.get("limit") ?? "20"),
    ),
  );
}

export async function POST(request: Request) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const body = (await request.json().catch(() => null)) as AdminSliderCreateRequest | null;
  const desktopImageUrl = body?.desktopImageUrl ?? body?.imageUrl;

  if (!body?.title || !desktopImageUrl || !body.imageAlt) {
    return errorResponse("VALIDATION_ERROR", "Faltan campos requeridos.", 422);
  }

  const timestamp = new Date().toISOString();
  const placement = body.placement ?? "home_hero";
  const status = getStatus(body);
  const slider: AdminSliderItemDto = {
    id: `slider-${Date.now()}`,
    title: body.title,
    description: body.description,
    eyebrow: body.eyebrow,
    badgeLabel: body.badgeLabel,
    highlightText: body.highlightText,
    desktopImageUrl,
    mobileImageUrl: body.mobileImageUrl,
    imageAlt: body.imageAlt,
    primaryCta: getPrimaryCta(body),
    secondaryCta: body.secondaryCta,
    intent: body.intent ?? "promotion",
    layoutHint: body.layoutHint ?? "split",
    placement,
    status,
    sortOrder: body.sortOrder ?? getNextSortOrder(placement),
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: status === "ARCHIVED" ? timestamp : body.archivedAt,
  };

  if (hasActivePlacementLimit(slider)) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Solo se permiten 6 sliders activos por placement.",
      422,
    );
  }

  mockSliderItems.push(slider);
  return NextResponse.json(slider, { status: 201 });
}
