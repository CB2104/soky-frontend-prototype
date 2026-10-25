import assert from "node:assert/strict";
import {
  editableHero,
  decodeHeroDraft,
  materializeHero,
} from "../src/features/admin/hero/hero-draft.ts";
import { mockSliderItems } from "../src/mock/db.ts";
import { HERO_ROLES } from "../src/features/hero/admin-fields.ts";
for (const role of HERO_ROLES) {
  const slide = mockSliderItems.find((slide) => slide.id === role.id);
  const original = structuredClone(slide);
  const saved = JSON.parse(JSON.stringify(editableHero(slide)));
  if (saved.values.title !== undefined)
    saved.values.title = "Borrador recuperable";
  saved.values.primaryCta.label = "CTA recuperable";
  if (saved.values.productLayer)
    saved.values.productLayer.alt = "Capa recuperable";
  if (saved.values.rotatorImages)
    saved.values.rotatorImages[0].alt = "Rotador recuperable";
  assert.deepEqual(decodeHeroDraft(saved, slide), saved);
  const restored = materializeHero(slide, saved);
  assert.equal(restored.primaryCta.label, "CTA recuperable");
  for (const field of [
    "id",
    "intent",
    "layoutHint",
    "background",
    "headlineParts",
    "sortOrder",
  ])
    assert.deepEqual(restored[field], slide[field]);
  if (restored.rotatorImages) {
    assert.equal(
      restored.rotatorImages[0].priceAmount,
      slide.rotatorImages[0].priceAmount,
    );
    for (const field of ["priceAmount", "priceCurrency", "name", "priceLabel"])
      assert.equal(field in saved.values.rotatorImages[0], false);
    const injected = structuredClone(saved);
    injected.values.rotatorImages[0].priceAmount = "0.01";
    assert.equal(decodeHeroDraft(injected, slide), null);
  }
  for (const invalid of [
    null,
    [],
    {},
    { ...saved, composition: "foreign" },
    { ...saved, values: { ...saved.values, headlineParts: [] } },
    {
      ...saved,
      values: { ...saved.values, primaryCta: { label: "bad", type: "SCRIPT" } },
    },
  ])
    assert.equal(decodeHeroDraft(invalid, slide), null);
  assert.deepEqual(slide, original);
}
console.log(
  "PASS Hero recovery: all four roles, nested allowlist, protected/canonical data, incompatible/invalid records",
);
