import type { AdminSliderItemDto } from "@/contracts/api";

export function pendingHeroFields(slide: AdminSliderItemDto): readonly string[] {
  // ServiceAnnouncementHero renders a literal headline instead of slide.title.
  return slide.id === "slider-chat" ? ["title"] : [];
}

export function heroThumbnail(slide: AdminSliderItemDto) {
  const source = slide.rotatorImages?.[0] ?? slide.productLayer;
  if (source && "desktop" in source) return source.desktop;
  if (source && "src" in source) return source.src;
  if (source && "desktopUrl" in source) return source.desktopUrl;
  return slide.desktopImageUrl;
}
