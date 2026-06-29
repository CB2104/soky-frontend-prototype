import { NextResponse } from "next/server";
import type { AdminSliderItemDto, PublicSliderItemDto } from "@/contracts/api";
import { mockSliderItems } from "@/mock/db";
import { applyScenarioDelay, errorResponse, getScenario } from "@/mock/helpers";

function toPublicSliderItem(slider: AdminSliderItemDto): PublicSliderItemDto {
  return {
    id: slider.id,
    title: slider.title,
    description: slider.description,
    eyebrow: slider.eyebrow,
    badgeLabel: slider.badgeLabel,
    highlightText: slider.highlightText,
    desktopImageUrl: slider.desktopImageUrl,
    mobileImageUrl: slider.mobileImageUrl,
    imageAlt: slider.imageAlt,
    primaryCta: slider.primaryCta,
    secondaryCta: slider.secondaryCta,
    intent: slider.intent,
    layoutHint: slider.layoutHint,
  };
}

export async function GET(request: Request) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  if (scenario === "error") {
    return errorResponse("INTERNAL_ERROR", "No se pudieron cargar los sliders.", 500);
  }

  const sliders =
    scenario === "empty"
      ? []
      : mockSliderItems
          .filter((slider) => slider.placement === "home_hero")
          .filter((slider) => slider.status === "ACTIVE")
          .toSorted((a, b) => a.sortOrder - b.sortOrder)
          .slice(0, 6)
          .map(toPublicSliderItem);

  return NextResponse.json(sliders);
}
