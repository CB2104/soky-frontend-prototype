import type { HeroVisualProfile } from "@/contracts/api";

type HeroSourceProfile = Exclude<HeroVisualProfile, "mobile">;

export const HERO_PROFILE_DIMENSIONS = {
  desktop: { width: 1920, height: 1080 },
  desktopWide: { width: 1920, height: 923 },
  tabletLandscape: { width: 1536, height: 1152 },
  tabletPortrait: { width: 1152, height: 1536 },
  mobile: { width: 968, height: 2097 },
} as const satisfies Readonly<
  Record<HeroVisualProfile, Readonly<{ width: number; height: number }>>
>;

export const HERO_PROFILE_MEDIA_QUERIES = {
  desktopWide: "(min-aspect-ratio: 31/16)",
  desktop: "(min-aspect-ratio: 14/9)",
  tabletLandscape: "(min-aspect-ratio: 25/24)",
  tabletPortrait: "(min-aspect-ratio: 3/5)",
} as const satisfies Readonly<Record<HeroSourceProfile, string>>;

export const HERO_SOURCE_PROFILE_ORDER = [
  "desktopWide",
  "desktop",
  "tabletLandscape",
  "tabletPortrait",
] as const satisfies ReadonlyArray<HeroSourceProfile>;

export const HERO_PROFILE_ORDER = [
  ...HERO_SOURCE_PROFILE_ORDER,
  "mobile",
] as const satisfies ReadonlyArray<HeroVisualProfile>;

export const HERO_FULL_CANVAS_SIZES = "100vw";
