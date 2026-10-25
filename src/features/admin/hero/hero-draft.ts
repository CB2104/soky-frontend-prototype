import type { AdminSliderItemDto } from "@/contracts/api";
import { HERO_ROLES } from "@/features/hero/admin-fields";

const sources = ["src", "desktop", "desktopWide", "tabletLandscape", "tabletPortrait", "mobile", "desktopUrl", "mobileUrl"];
const ctaTypes = ["MENU", "LOCATION", "CART", "WHATSAPP", "PRODUCT", "CATEGORY", "CUSTOM_PATH", "NONE"];
type RecordValue = Record<string, unknown>;
export type HeroDraft = { composition: string; values: RecordValue };
const object = (value: unknown): value is RecordValue => !!value && typeof value === "object" && !Array.isArray(value);
const pick = (value: RecordValue, fields: readonly string[]) => Object.fromEntries(fields.filter(key => value[key] !== undefined).map(key => [key, value[key]]));
const imageFields = (value: unknown, rotator = false) => object(value) ? pick(value, [...sources, "alt", ...(rotator ? ["productId"] : [])]) : value;

// Only editable values enter recovery storage. Product prices, visual composition,
// canonical labels and preview data always come from the current server snapshot.
export function editableHero(slide: AdminSliderItemDto): HeroDraft {
  const fields = HERO_ROLES.find(role => role.id === slide.id)?.fields ?? [];
  const values = pick(slide as unknown as RecordValue, fields);
  for (const field of ["primaryCta", "secondaryCta"]) if (object(values[field])) values[field] = pick(values[field], ["label", "type", "target"]);
  if (values.productLayer) values.productLayer = imageFields(values.productLayer);
  if (Array.isArray(values.rotatorImages)) values.rotatorImages = values.rotatorImages.map(image => imageFields(image, true));
  return {
    composition: JSON.stringify([slide.id, slide.intent, slide.layoutHint, slide.mediaMode,
      slide.productLayer ? Object.keys(imageFields(slide.productLayer) as object).sort() : null,
      slide.rotatorImages?.map(image => Object.keys(imageFields(image, true) as object).sort())]),
    values,
  };
}

export function decodeHeroDraft(value: unknown, slide: AdminSliderItemDto): HeroDraft | null {
  const initial = editableHero(slide);
  if (!object(value) || value.composition !== initial.composition || !object(value.values)) return null;
  const fields: readonly string[] = HERO_ROLES.find(role => role.id === slide.id)?.fields ?? [];
  const values = value.values;
  if (Object.keys(values).some(key => !fields.includes(key))) return null;
  for (const [key, item] of Object.entries(values)) {
    if (key === "primaryCta" || key === "secondaryCta") {
      if (!object(item) || Object.keys(item).some(field => !["label", "type", "target"].includes(field)) || typeof item.label !== "string" || !ctaTypes.includes(String(item.type)) || (item.target !== undefined && typeof item.target !== "string")) return null;
    } else if (key === "rotatorImages" || key === "productLayer") {
      const items = key === "rotatorImages" ? item : [item];
      const originals = key === "rotatorImages" ? initial.values.rotatorImages : [initial.values.productLayer];
      if (!Array.isArray(items) || !Array.isArray(originals) || items.length !== originals.length) return null;
      for (const [index, image] of items.entries()) {
        if (!object(image) || !object(originals[index]) || Object.keys(image).sort().join() !== Object.keys(originals[index]).sort().join() || Object.values(image).some(source => typeof source !== "string" || source.length > 1000)) return null;
      }
    } else if (typeof item !== "string" || item.length > 1000 || (key === "status" && !["ACTIVE", "INACTIVE", "DRAFT"].includes(item))) return null;
  }
  if (Object.keys(initial.values).some(key => !(key in values))) return null;
  return { composition: initial.composition, values };
}

export function materializeHero(slide: AdminSliderItemDto, draft: HeroDraft): AdminSliderItemDto {
  const next = { ...slide, ...draft.values } as AdminSliderItemDto;
  if (next.productLayer) next.productLayer = { ...slide.productLayer, ...next.productLayer } as AdminSliderItemDto["productLayer"];
  if (next.rotatorImages) next.rotatorImages = next.rotatorImages.map((image, index) => ({ ...slide.rotatorImages?.[index], ...image }));
  return next;
}
