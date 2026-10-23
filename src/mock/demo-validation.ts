import { existsSync } from "node:fs";
import path from "node:path";
import type { CategoryDto, ExchangeRateDto, ProductDto, PublicSettingsDto } from "@/contracts/api";
import type { DemoState } from "@/contracts/demo";
import { convertMoneyCents, formatMoneyCents, parseMoneyCents } from "@/lib/money";
import { DemoError, invalid } from "./demo-errors";
import { categoryErrors, productErrors, settingsErrors } from "@/lib/catalog-validation";

function assertFields(fields: Record<string, string>) {
  if (Object.keys(fields).length) throw new DemoError("VALIDATION_ERROR", "Revisa los campos indicados.", 422, fields);
}
import { normalizeManualRate, rateNeedsReview, validRateReference } from "@/features/exchange-rates/manual-rate";

export const HERO_IDS = ["slider-kiyomi", "slider-boxes", "slider-weekly-special", "slider-chat"] as const;
export const PRODUCT_FIELDS = ["title", "slug", "shortDescription", "description", "categoryId", "type", "status", "isAvailable", "sortOrder", "priceAmount", "priceCurrency", "imageUrl", "imageAlt", "featured", "tags", "allergens", "details"];
export const CATEGORY_FIELDS = ["key", "name", "slug", "group", "description", "imageUrl", "sortOrder", "isActive"];
export const SETTINGS_FIELDS = ["businessName", "slogan", "whatsappPhone", "instagramUrl", "googleMapsUrl", "googleMapsEmbedUrl", "address", "openingHoursDisplay", "deliveryEnabled", "pickupEnabled", "deliveryNotes", "minimumOrderAmount"];

export function objectBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new DemoError("VALIDATION_ERROR", "Revisa el formulario.");
  return value as Record<string, unknown>;
}
export function allowedFields(body: Record<string, unknown>, fields: readonly string[]) {
  for (const key of Object.keys(body)) if (!fields.includes(key) && key !== "expectedRevision") invalid(key, "Este campo no se puede editar aquí.");
  return Object.fromEntries(Object.entries(body).filter(([key]) => fields.includes(key)));
}
function text(value: unknown, field: string, max: number, required = false) {
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) invalid(field, `Revisa este campo (máximo ${max} caracteres).`);
}
function slug(value: unknown, field = "slug") {
  if (typeof value !== "string" || value.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) invalid(field, "Usa letras minúsculas, números y guiones.");
}
function bool(value: unknown, field: string) { if (typeof value !== "boolean") invalid(field, "Elige sí o no."); }
function order(value: unknown) { if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > 1000000) invalid("sortOrder", "El orden debe ser un entero entre 0 y 1000000."); }
export function money(value: unknown, field = "priceAmount") {
  if (typeof value !== "string" || value.length > 14) invalid(field, "Escribe un importe sin miles, con hasta dos decimales.");
  const cents = parseMoneyCents(value);
  if (cents === null || cents > 1000000000) invalid(field, "Escribe un importe entre 0 y 10000000, con hasta dos decimales.");
  return formatMoneyCents(cents);
}
export function image(value: unknown, field = "imageUrl") {
  text(value, field, 800, true);
  const src = String(value);
  if (/^\/images\/[\w/(). -]+\.(?:webp|png|jpg|jpeg|svg)$/i.test(src) && !src.includes("..") && existsSync(path.join(process.cwd(), "public", src))) return;
  try { const url = new URL(src); if (url.protocol === "https:" && !url.username && !url.password && !url.port && ["picsum.photos", "images.unsplash.com"].includes(url.hostname)) return; } catch { /* validation below */ }
  invalid(field, "Selecciona una imagen existente o una URL HTTPS de picsum.photos o images.unsplash.com.");
}
export function validateProduct(product: ProductDto, state: DemoState, strict = false) {
  assertFields(productErrors(product, strict));
  text(product.title, "title", 120, true); slug(product.slug);
  text(product.description, "description", 4000, strict);
  if (product.shortDescription !== undefined) text(product.shortDescription, "shortDescription", 300);
  text(product.imageAlt, "imageAlt", 240, true); image(product.imageUrl);
  const category = state.categories.find(row => row.id === product.categoryId);
  if (!category) invalid("categoryId", "Selecciona una categoría existente.");
  if (strict && product.status === "ACTIVE" && !category.isActive) invalid("categoryId", "Para publicar, activa la categoría.");
  if (state.products.some(row => row.id !== product.id && row.slug === product.slug)) throw new DemoError("DUPLICATE_SLUG", "Este slug ya existe.", 409, { slug: "Elige otra dirección web; esta ya existe." });
  if (!["SIMPLE", "PROMO", "COMBO"].includes(product.type)) invalid("type", "Selecciona un tipo válido.");
  if (!["DRAFT", "ACTIVE", "ARCHIVED"].includes(product.status)) invalid("status", "Selecciona un estado válido.");
  bool(product.isAvailable, "isAvailable"); bool(product.featured, "featured"); order(product.sortOrder);
  product.priceAmount = money(product.priceAmount);
  if (product.priceCurrency !== state.settings.defaultCurrency) invalid("priceCurrency", "La moneda debe coincidir con la moneda global.");
  for (const field of ["tags", "allergens"] as const) if (!Array.isArray(product[field]) || product[field].length > 30 || product[field].some(v => typeof v !== "string" || v.length > 100)) invalid(field, "Usa hasta 30 textos de 100 caracteres.");
  if (product.details !== undefined) {
    const details = objectBody(product.details);
    allowedFields(details, ["pieces", "quantity", "unit", "composition", "components", "variants"]);
    for (const key of ["pieces", "quantity"] as const) if (details[key] !== undefined && (!Number.isInteger(details[key]) || Number(details[key]) < 0 || Number(details[key]) > 1000000)) invalid("details", "Revisa las cantidades del detalle.");
    if (details.unit !== undefined) text(details.unit, "details", 80);
    for (const key of ["composition", "components", "variants"]) if (details[key] !== undefined && (!Array.isArray(details[key]) || JSON.stringify(details[key]).length > 5000)) invalid("details", "Revisa el detalle del producto.");
  }
  product.categorySlug = category.slug;
}
export function validateCategory(category: CategoryDto, state: DemoState) {
  assertFields(categoryErrors(category));
  text(category.name, "name", 100, true); slug(category.slug); slug(category.key, "key"); order(category.sortOrder); bool(category.isActive, "isActive");
  if (category.group && !["FOOD", "DRINK", "COMBO", "DESSERT", "OTHER"].includes(category.group)) invalid("group", "Selecciona un grupo válido.");
  if (category.description !== undefined) text(category.description, "description", 600);
  if (category.imageUrl) image(category.imageUrl);
  for (const field of ["slug", "key"] as const) if (state.categories.some(row => row.id !== category.id && row[field] === category[field])) throw new DemoError("DUPLICATE_SLUG", "El slug o la clave ya está en uso.", 409, { [field]: "Este valor ya está en uso." });
}
export function validateSettings(settings: PublicSettingsDto) {
  assertFields(settingsErrors(settings));
  text(settings.businessName, "businessName", 120, true);
  if (settings.slogan !== undefined) text(settings.slogan, "slogan", 300);
  if (!/^\+?\d{8,15}$/.test(settings.whatsappPhone)) invalid("whatsappPhone", "Usa un número internacional de 8 a 15 dígitos.");
  for (const field of ["instagramUrl", "googleMapsUrl", "googleMapsEmbedUrl"] as const) if (settings[field]) {
    try { const url = new URL(settings[field]); if (url.protocol !== "https:" || url.username || url.password) throw new Error(); }
    catch { invalid(field, "Usa una URL HTTPS válida."); }
  }
  if (settings.address !== undefined) text(settings.address, "address", 500);
  if (settings.deliveryNotes !== undefined) text(settings.deliveryNotes, "deliveryNotes", 600);
  if (!Array.isArray(settings.openingHoursDisplay) || !settings.openingHoursDisplay.length || settings.openingHoursDisplay.length > 14) invalid("openingHoursDisplay", "Escribe al menos una línea de horario (máximo 14).");
  settings.openingHoursDisplay.forEach(line => text(line, "openingHoursDisplay", 240, true));
  bool(settings.pickupEnabled, "pickupEnabled"); bool(settings.deliveryEnabled, "deliveryEnabled");
  if (!settings.pickupEnabled && !settings.deliveryEnabled) invalid("pickupEnabled", "Debe haber al menos una modalidad activa.");
  settings.minimumOrderAmount = money(settings.minimumOrderAmount ?? "0", "minimumOrderAmount");
  if (!["EUR", "USD"].includes(settings.defaultCurrency) || settings.exchangeRateMode !== "MANUAL") invalid("defaultCurrency", "Configuración monetaria incompatible.");
}
export function validateRate(body: Record<string, unknown>, state: DemoState): ExchangeRateDto {
  if (body.baseCurrency !== state.settings.defaultCurrency || (body.targetCurrency !== undefined && body.targetCurrency !== "VES") || (body.source !== undefined && body.source !== "MANUAL") || (body.mode !== undefined && body.mode !== "MANUAL")) invalid("baseCurrency", "La tasa debe ser manual y corresponder a la moneda global hacia Bs.");
  const rate = typeof body.rate === "string" ? normalizeManualRate(body.rate) : null;
  if (!rate) invalid("rate", "Escribe una tasa positiva, sin miles, con hasta seis decimales.");
  if (typeof body.fetchedAt !== "string" || !validRateReference(body.fetchedAt)) invalid("fetchedAt", "Selecciona una fecha válida, con tolerancia futura máxima de cinco minutos.");
  if (body.note !== undefined) text(body.note, "note", 240);
  if (convertMoneyCents(100, rate) === null || state.products.some(product => convertMoneyCents((parseMoneyCents(product.priceAmount) ?? 0) * 99, rate) === null)) invalid("rate", "La tasa supera el rango de cálculo seguro para este catálogo.");
  return { baseCurrency: state.settings.defaultCurrency, targetCurrency: "VES", rate, mode: "MANUAL", source: "MANUAL", fetchedAt: new Date(body.fetchedAt).toISOString(), stale: false };
}
export function currentRate(state: DemoState): ExchangeRateDto {
  const rate = state.currentRate;
  const stale = rateNeedsReview(rate.fetchedAt, rate.pendingValidation) || rate.baseCurrency !== state.settings.defaultCurrency || rate.targetCurrency !== "VES";
  return { ...rate, stale, warning: rate.pendingValidation ? "Valor ficticio inicial pendiente de validación. Revisa y guarda la tasa antes de cotizar." : stale ? "La tasa necesita revisión para calcular el total en bolívares." : "Tasa introducida manualmente para esta demo. No se consulta al proveedor." };
}
export function validateState(state: DemoState) {
  if (!state || state.schemaVersion !== 1 || !Number.isSafeInteger(state.revision) || state.revision < 1 || !Number.isFinite(Date.parse(state.updatedAt))) throw new DemoError("DATA_CORRUPT", "Versión de datos incompatible.", 503);
  for (const key of ["products", "categories", "sliders", "orderIntents", "rateHistory"] as const) if (!Array.isArray(state[key])) throw new DemoError("DATA_CORRUPT", "Estructura de datos inválida.", 503);
  if (!state.currentRate || !state.analytics || !state.analytics.summary || !Array.isArray(state.analytics.products) || !Array.isArray(state.analytics.sliders)) throw new DemoError("DATA_CORRUPT", "Datos incompletos.", 503);
  validateSettings(state.settings);
  if (state.currentRate.baseCurrency !== state.settings.defaultCurrency || state.currentRate.targetCurrency !== "VES" || !/^\d+(?:\.\d{1,6})?$/.test(state.currentRate.rate) || Number(state.currentRate.rate) <= 0 || state.currentRate.mode !== "MANUAL") throw new DemoError("DATA_CORRUPT", "Tasa incompatible.", 503);
  for (const rows of [state.products, state.categories, state.sliders, state.orderIntents]) if (new Set(rows.map(row => row.id)).size !== rows.length) throw new DemoError("DATA_CORRUPT", "Identificadores duplicados.", 503);
  state.categories.forEach(category => validateCategory(category, state));
  state.products.forEach(product => validateProduct(product, state));
  const corrupt = (condition: boolean, message: string) => { if (!condition) throw new DemoError("DATA_CORRUPT", message, 503); };
  const date = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value));
  const count = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
  const amount = (value: unknown) => typeof value === "string" && parseMoneyCents(value) !== null;
  const validRate = (rate: ExchangeRateDto) => !!rate && ["EUR", "USD"].includes(rate.baseCurrency) && rate.targetCurrency === "VES" && typeof rate.rate === "string" && /^\d+(?:\.\d{1,6})?$/.test(rate.rate) && Number(rate.rate) > 0 && rate.mode === "MANUAL" && rate.source === "MANUAL" && date(rate.fetchedAt) && typeof rate.stale === "boolean";
  corrupt(validRate(state.currentRate), "Tasa actual inválida.");
  for (const rows of [state.products, state.categories, state.sliders, state.orderIntents, state.rateHistory]) {
    corrupt(rows.every(row => !!row && typeof row.id === "string" && !!row.id.trim()), "Identificadores inválidos.");
    corrupt(new Set(rows.map(row => row.id)).size === rows.length, "Identificadores duplicados.");
  }
  for (const slide of state.sliders) {
    corrupt(typeof slide.title === "string" && ["ACTIVE", "INACTIVE", "DRAFT"].includes(slide.status) && count(slide.sortOrder), "Slide inválido.");
    corrupt(slide.rotatorImages === undefined || Array.isArray(slide.rotatorImages), "Imágenes de slide inválidas.");
    for (const id of [slide.productId, ...(slide.rotatorImages?.map(item => item.productId) ?? [])]) {
      corrupt(id === undefined || state.products.some(product => product.id === id), "Un slide referencia un producto inexistente.");
    }
  }
  for (const entry of state.rateHistory) corrupt(validRate(entry) && date(entry.recordedAt) && typeof entry.note === "string" && (entry.previousRate === null || (typeof entry.previousRate === "string" && /^\d+(?:\.\d{1,6})?$/.test(entry.previousRate))), "Historial de tasas inválido.");
  for (const key of ["productViews", "addToCart", "checkoutStarted", "whatsappClicked"] as const) corrupt(count(state.analytics.summary[key]), "Fixtures de analítica inválidos.");
  for (const row of state.analytics.products) corrupt(typeof row.productId === "string" && typeof row.title === "string" && count(row.views) && count(row.addToCart) && typeof row.conversionRate === "string", "Fixture de producto inválido.");
  for (const row of state.analytics.sliders) corrupt(typeof row.sliderId === "string" && typeof row.title === "string" && count(row.views) && count(row.clicks) && typeof row.clickRate === "string", "Fixture de slide inválido.");
  // Intents and analytics are historical snapshots: deleting a catalog row must not erase them.
  for (const intent of state.orderIntents) {
    corrupt(typeof intent.publicCode === "string" && intent.status === "PENDING_WHATSAPP" && ["PICKUP", "DELIVERY"].includes(intent.fulfillmentType) && Array.isArray(intent.items) && intent.items.length > 0 && validRate(intent.rateSnapshot), "Intención demo inválida.");
    for (const item of intent.items) corrupt(typeof item.productId === "string" && count(item.quantity) && item.quantity >= 1 && item.quantity <= 99 && amount(item.unitPriceAmount) && amount(item.lineTotalAmount) && amount(item.lineTotalVes) && item.unitPriceCurrency === intent.rateSnapshot.baseCurrency && item.lineTotalCurrency === intent.rateSnapshot.baseCurrency, "Importes de intención inválidos.");
    corrupt(!!intent.totals && amount(intent.totals.totalVes) && amount(intent.rateSnapshot.baseCurrency === "EUR" ? intent.totals.subtotalEur : intent.totals.subtotalUsd), "Totales de intención inválidos.");
  }
}
