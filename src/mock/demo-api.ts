import "server-only";
import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type { AdminSliderItemDto, CartQuoteRequestDto, CategoryDto, CreateOrderIntentRequestDto, ProductDto } from "@/contracts/api";
import type { DemoState } from "@/contracts/demo";
import { buildCheckoutMessage } from "@/features/checkout/whatsapp-message";
import { resolveProductSlide } from "@/features/hero/resolve-product-slides";
import { HERO_ROLES } from "@/features/hero/admin-fields";
import { getMenuCategorySlugs } from "@/features/categories/menu-category-selection";
import { parseMoneyCents } from "@/lib/money";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { mockCategories, mockProducts, mockSettings, mockSliderItems, mockExchangeRate } from "./db";
import { checkOrigin, requireSession } from "./demo-auth";
import { handleDemoSessionRequest } from "./demo-session-api";
import { DemoError, invalid } from "./demo-errors";
import { appendDemoIntent, demoEnabled, mutateDemo, readDemoState } from "./demo-repository";
import { CATEGORY_FIELDS, HERO_IDS, PRODUCT_FIELDS, SETTINGS_FIELDS, allowedFields, currentRate, image, money, objectBody, validateCategory, validateProduct, validateRate, validateSettings } from "./demo-validation";
import { applyScenarioDelay, buildCartQuote, getPublicProducts, getQuoteRateError, getScenario, paginate } from "./helpers";

function response(data: unknown, revision?: number, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...(revision ? { "X-Demo-Revision": String(revision) } : {}) } });
}
function invalidate() {
  for (const tag of ["soky-menu-products", "soky-menu-categories", "soky-menu-settings", "soky-hero-sliders"]) revalidateTag(tag, { expire: 0 });
}
function find<T extends { id: string }>(rows: T[], id: string) {
  const row = rows.find(candidate => candidate.id === id);
  if (!row) throw new DemoError("NOT_FOUND", "Este registro ya no existe.", 404);
  return row;
}
function referenced(state: DemoState, id: string) {
  const product = state.products.find(product => product.id === id);
  return state.sliders.some(slide => slide.productId === id || slide.rotatorImages?.some(image => image.productId === id) || [slide.primaryCta, slide.secondaryCta].some(cta => cta?.type === "PRODUCT" && cta.target === product?.slug));
}
function updateCtaTargets(state: DemoState, type: "PRODUCT" | "CATEGORY", oldSlug: string, newSlug: string) {
  for (const slide of state.sliders) for (const field of ["primaryCta", "secondaryCta"] as const) {
    const cta = slide[field];
    if (cta?.type === type && cta.target === oldSlug) { slide[field] = { ...cta, target: newSlug }; slide.updatedAt = new Date().toISOString(); }
  }
}
function setRate(state: DemoState, body: Record<string, unknown>) {
  const rate = validateRate(body, state);
  const entry = { ...rate, id: randomUUID(), previousRate: state.currentRate.rate, previousBaseCurrency: state.currentRate.baseCurrency, recordedAt: new Date().toISOString(), note: String(body.note ?? "") };
  state.rateHistory.unshift(entry);
  state.currentRate = { ...rate, id: entry.id, recordedAt: entry.recordedAt };
}
function validateCta(value: unknown, field: string, state: DemoState, requireEligible = true) {
  const cta = objectBody(value);
  allowedFields(cta, ["label", "type", "target"]);
  if (typeof cta.label !== "string" || !cta.label.trim() || cta.label.length > 60) invalid(field, "Escribe un botón de hasta 60 caracteres.");
  if (!["MENU", "LOCATION", "CART", "WHATSAPP", "PRODUCT", "CATEGORY", "CUSTOM_PATH", "NONE"].includes(String(cta.type))) invalid(field, "Selecciona un destino válido.");
  if (cta.type === "PRODUCT" && !(requireEligible ? getPublicProducts(state).filter(product => product.isAvailable) : state.products).some(product => product.slug === cta.target)) invalid(field, requireEligible ? "Selecciona un producto publicado y disponible." : "Selecciona un producto existente.");
  if (cta.type === "CATEGORY" && !state.categories.some(category => (!requireEligible || category.isActive) && category.slug === cta.target)) invalid(field, requireEligible ? "Selecciona una categoría activa." : "Selecciona una categoría existente.");
  if ((cta.type === "CUSTOM_PATH" || cta.type === "LOCATION") && cta.target !== undefined && (typeof cta.target !== "string" || !/^\/(?!\/)[a-zA-Z0-9/#?=&%._-]*$/.test(cta.target))) invalid(field, "Usa una ruta interna segura.");
  if (cta.type === "WHATSAPP" && cta.target !== undefined && (typeof cta.target !== "string" || cta.target.length > 300)) invalid(field, "El mensaje no puede superar 300 caracteres.");
}
function sliderPatch(slide: AdminSliderItemDto, body: Record<string, unknown>, state: DemoState, validatePublication = true) {
  const fields = HERO_ROLES.find(role => role.id === slide.id)?.fields ?? [];
  const patch = allowedFields(body, fields);
  for (const field of ["title", "description", "eyebrow", "badgeLabel", "promoNote", "imageAlt"] as const) if (patch[field] !== undefined && (typeof patch[field] !== "string" || String(patch[field]).length > (field === "description" ? 300 : 120) || (field === "title" && !String(patch[field]).trim()))) invalid(field, "Revisa el texto y su longitud.");
  if (patch.status !== undefined && !["ACTIVE", "INACTIVE", "DRAFT"].includes(String(patch.status))) invalid("status", "Elige un estado válido.");
  if (patch.productId !== undefined && (typeof patch.productId !== "string" || !state.products.some(product => product.id === patch.productId))) invalid("productId", "Selecciona un producto del catálogo.");
  const publishing = validatePublication && (patch.status ?? slide.status) === "ACTIVE";
  for (const field of ["primaryCta", "secondaryCta"]) if (patch[field] !== undefined) validateCta(patch[field], field, state, publishing);
  for (const field of ["desktopImageUrl", "mobileImageUrl"]) if (patch[field] !== undefined) image(patch[field], field);
  if (patch.productLayer !== undefined) {
    const layer = objectBody(patch.productLayer);
    const oldLayer = slide.productLayer;
    if (!oldLayer) invalid("productLayer", "Esta composición no admite capa de producto editable.");
    const sourceKeys = "desktop" in oldLayer ? ["desktop", "desktopWide", "tabletLandscape", "tabletPortrait", "mobile"] : ["desktopUrl", "mobileUrl"];
    if (Object.keys(oldLayer).some(key => !(key in layer)) || Object.keys(layer).some(key => !(key in oldLayer))) invalid("productLayer", "Conserva los perfiles y propiedades de esta composición.");
    for (const [key, value] of Object.entries(layer)) {
      if (sourceKeys.includes(key)) image(value, "productLayer");
      else if (key === "alt") { if (typeof value !== "string" || !value.trim() || value.length > 240) invalid("productLayer", "Escribe un texto alternativo válido."); }
      else if (value !== oldLayer[key as keyof typeof oldLayer]) invalid("productLayer", "La composición visual está protegida.");
    }
  }
  if (patch.rotatorImages !== undefined) {
    if (!Array.isArray(patch.rotatorImages) || patch.rotatorImages.length !== slide.rotatorImages?.length) invalid("rotatorImages", "Conserva los espacios de imagen de esta composición.");
    for (const [index, raw] of patch.rotatorImages.entries()) {
      const item = objectBody(raw);
      const old = slide.rotatorImages?.[index];
      if (!old) invalid("rotatorImages", "Conserva los espacios de esta composición.");
      allowedFields(item, ["productId", "alt", "src", "desktop", "desktopWide", "tabletLandscape", "tabletPortrait", "mobile"]);
      const sourceKeys = "desktop" in old ? ["desktop", "desktopWide", "tabletLandscape", "tabletPortrait", "mobile"] : ["src"];
      if (sourceKeys.some(key => !(key in item)) || Object.keys(item).some(key => ![...sourceKeys, "productId", "alt"].includes(key))) invalid("rotatorImages", "Cada imagen debe conservar todos sus perfiles.");
      if (typeof item.alt !== "string" || !item.alt.trim() || item.alt.length > 240) invalid("rotatorImages", "Agrega texto alternativo a cada imagen.");
      if (typeof item.productId !== "string" || !state.products.some(product => product.id === item.productId)) invalid("rotatorImages", "Selecciona un producto para cada espacio de imagen.");
      for (const [key, value] of Object.entries(item)) if (key !== "alt" && key !== "productId") image(value, "rotatorImages");
    }
  }
  const next: AdminSliderItemDto = { ...slide, ...patch, updatedAt: new Date().toISOString() };
  if (next.productId && next.primaryCta?.type === "PRODUCT") next.primaryCta = { ...next.primaryCta, target: state.products.find(product => product.id === next.productId)?.slug };
  if (next.status === "ACTIVE" && validatePublication) {
    for (const field of ["primaryCta", "secondaryCta"] as const) if (next[field]) validateCta(next[field], field, state);
    if (next.id === "slider-weekly-special" && !next.productId) invalid("productId", "Vincula un producto antes de publicar el destacado.");
    const ids = [next.productId, ...(next.rotatorImages?.map(image => image.productId) ?? [])].filter(Boolean);
    for (const id of ids) if (!getPublicProducts(state).some(product => product.id === id && product.isAvailable)) invalid("productId", "Para publicar, todos los productos vinculados deben estar activos, disponibles y en categoría activa.");
  }
  return next;
}

async function admin(request: Request, resource: string) {
  requireSession(request);
  const url = new URL(request.url);
  const parts = resource.split("/");
  const id = parts[2];
  if (request.method === "GET") {
    const state = await readDemoState();
    if (resource === "admin/demo/workspace") return response({ ...state, currentRate: currentRate(state), demo: true, analyticsSource: "FIXED_DEMO_FIXTURES" }, state.revision);
    const page = Number(url.searchParams.get("page") ?? 1), limit = Number(url.searchParams.get("limit") ?? 20);
    if (parts[1] === "products") {
      if (id) return response(find(state.products, id), state.revision);
      const query = (url.searchParams.get("search") ?? "").toLocaleLowerCase("es");
      const rows = state.products.filter(product => `${product.title} ${product.slug}`.toLocaleLowerCase("es").includes(query)
        && ["categoryId", "status", "isAvailable", "featured"].every(field => !url.searchParams.has(field) || String(product[field as keyof ProductDto]) === url.searchParams.get(field)));
      const sort = url.searchParams.get("sort");
      rows.sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title, "es") : sort === "updatedAt" ? (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "") : a.sortOrder - b.sortOrder) || a.id.localeCompare(b.id));
      return response(paginate(rows, page, limit), state.revision);
    }
    if (parts[1] === "categories") return response(id ? find(state.categories, id) : paginate(state.categories.toSorted((a, b) => a.sortOrder - b.sortOrder), page, limit), state.revision);
    if (parts[1] === "settings") return response(state.settings, state.revision);
    if (parts[1] === "sliders") return response(id ? find(state.sliders, id) : paginate(HERO_IDS.map(id => find(state.sliders, id)), page, limit), state.revision);
    if (resource === "admin/exchange-rates/current") return response(currentRate(state), state.revision);
    if (resource === "admin/exchange-rates/history") return response(state.rateHistory, state.revision);
    if (parts[1] === "order-intents") return response(id ? find(state.orderIntents, id) : paginate(state.orderIntents.toReversed(), page, limit), state.revision);
    if (resource === "admin/dashboard/summary") {
      const published = getPublicProducts(state);
      return response({ total: state.products.length, published: published.length, unavailable: published.filter(product => !product.isAvailable).length, intents: state.orderIntents.length, whatsappClicked: state.orderIntents.filter(intent => intent.whatsappClickedAt).length, rate: currentRate(state) }, state.revision);
    }
    if (parts[1] === "analytics" && ["summary", "products", "sliders"].includes(id)) return response(state.analytics[id as keyof DemoState["analytics"]], state.revision);
    throw new DemoError("NOT_FOUND", "Consulta no disponible.", 404);
  }
  checkOrigin(request);
  const body = request.method === "DELETE" ? { expectedRevision: Number(request.headers.get("if-match")) } : objectBody(await request.json().catch(() => null));
  if (resource === "admin/sliders/preview" && request.method === "POST") {
    const state = await readDemoState();
    allowedFields(body, ["slideId", "patch"]);
    if (body.expectedRevision !== state.revision) throw new DemoError("CONFLICT", "Los datos cambiaron. Recarga el catálogo para previsualizar con datos actuales.", 409);
    if (!HERO_IDS.some(id => id === body.slideId)) invalid("slideId", "Selecciona una de las cuatro composiciones del Hero.");
    const slide = sliderPatch(find(state.sliders, String(body.slideId)), objectBody(body.patch), state, false);
    return response({ slide: resolveProductSlide(slide, state.products, state.categories), revision: state.revision, preview: true }, state.revision);
  }
  if (resource === "admin/exchange-rates/refresh") throw new DemoError("VALIDATION_ERROR", "Introduce y guarda una tasa manual. Recargar no actualiza su fecha.");
  if (parts[1] === "order-intents") throw new DemoError("FORBIDDEN", "Las intenciones son de solo lectura.", 403);
  const { result, state } = await mutateDemo(body.expectedRevision, draft => {
    requireSession(request); checkOrigin(request);
    if (parts[1] === "products") {
      if (request.method === "DELETE") {
        find(draft.products, id);
        if (referenced(draft, id)) throw new DemoError("REFERENCE_CONFLICT", "El Hero usa este producto. Edita primero sus vínculos en Hero y promociones.", 409);
        draft.products = draft.products.filter(product => product.id !== id); return { deleted: id };
      }
      const patch = allowedFields(body, PRODUCT_FIELDS);
      const old = id ? find(draft.products, id) : undefined;
      const product: ProductDto = { id: `prod-${randomUUID()}`, title: "", slug: "", description: "", categoryId: "", type: "SIMPLE", status: "DRAFT", isAvailable: true, featured: false, sortOrder: 0, priceCurrency: draft.settings.defaultCurrency, priceAmount: "0.00", imageUrl: "", imageAlt: "", tags: [], allergens: [], createdAt: new Date().toISOString(), ...old, ...patch, updatedAt: new Date().toISOString() };
      validateProduct(product, draft, !old || patch.status === "ACTIVE" || patch.description !== undefined);
      if (old && old.slug !== product.slug) updateCtaTargets(draft, "PRODUCT", old.slug, product.slug);
      if (old) draft.products[draft.products.indexOf(old)] = product; else draft.products.push(product);
      return product;
    }
    if (parts[1] === "categories") {
      const count = draft.products.filter(product => product.categoryId === id).length;
      if (request.method === "DELETE") {
        find(draft.categories, id);
        if (count) throw new DemoError("REFERENCE_CONFLICT", `Esta categoría tiene ${count} productos. Muévelos a otra categoría antes de eliminarla.`, 409);
        draft.categories = draft.categories.filter(category => category.id !== id); return { deleted: id };
      }
      const patch = allowedFields(body, [...CATEGORY_FIELDS, "confirmDeactivate"]);
      delete patch.confirmDeactivate;
      const old = id ? find(draft.categories, id) : undefined;
      if (old?.isActive && patch.isActive === false && count && body.confirmDeactivate !== true) invalid("isActive", `Desactivar ocultará ${count} productos de la venta. Confirma el alcance.`);
      const category: CategoryDto = { id: `cat-${randomUUID()}`, key: "", name: "", slug: "", sortOrder: 0, isActive: true, createdAt: new Date().toISOString(), ...old, ...patch, updatedAt: new Date().toISOString() };
      validateCategory(category, draft);
      if (old && old.slug !== category.slug) updateCtaTargets(draft, "CATEGORY", old.slug, category.slug);
      if (old) draft.categories[draft.categories.indexOf(old)] = category; else draft.categories.push(category);
      for (const product of draft.products) if (product.categoryId === category.id) product.categorySlug = category.slug;
      return category;
    }
    if (parts[1] === "settings") {
      draft.settings = { ...draft.settings, ...allowedFields(body, SETTINGS_FIELDS) }; validateSettings(draft.settings); return draft.settings;
    }
    if (resource === "admin/exchange-rates/manual") {
      allowedFields(body, ["baseCurrency", "targetCurrency", "rate", "fetchedAt", "note", "source", "mode"]);
      setRate(draft, body); return currentRate(draft);
    }
    if (resource === "admin/currency-change") {
      allowedFields(body, ["currency", "prices", "minimumOrderAmount", "serviceFeeAmount", "rate", "fetchedAt", "note", "confirmed"]);
      if (!["EUR", "USD"].includes(String(body.currency)) || body.currency === draft.settings.defaultCurrency || body.confirmed !== true) invalid("currency", "Elige otra moneda y confirma la revisión completa.");
      const prices = objectBody(body.prices);
      if (Object.keys(prices).length !== draft.products.length || draft.products.some(product => prices[product.id] === undefined)) invalid("prices", "Revisa explícitamente el importe de todos los productos, incluidos borradores y archivados.");
      draft.settings.defaultCurrency = body.currency as "EUR" | "USD";
      for (const product of draft.products) { product.priceAmount = money(prices[product.id]); product.priceCurrency = draft.settings.defaultCurrency; product.updatedAt = new Date().toISOString(); }
      draft.settings.minimumOrderAmount = money(body.minimumOrderAmount, "minimumOrderAmount");
      draft.settings.serviceFeeAmount = money(body.serviceFeeAmount, "serviceFeeAmount");
      setRate(draft, { ...body, baseCurrency: draft.settings.defaultCurrency });
      return { currency: draft.settings.defaultCurrency };
    }
    if (parts[1] === "sliders" && id && HERO_IDS.some(key => key === id) && request.method === "PATCH") {
      const old = find(draft.sliders, id); const next = sliderPatch(old, body, draft);
      draft.sliders[draft.sliders.indexOf(old)] = next; return next;
    }
    throw new DemoError("FORBIDDEN", "Acción no disponible para esta demo.", 403);
  });
  invalidate();
  return response({ data: result, revision: state.revision }, state.revision, request.method === "POST" && ["products", "categories"].includes(parts[1]) ? 201 : 200);
}

function validateItems(body: Record<string, unknown>): asserts body is Record<string, unknown> & CartQuoteRequestDto {
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 200 || body.items.some(item => !item || typeof item.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) || new Set(body.items.map(item => item.productId)).size !== body.items.length) invalid("items", "Revisa los productos y cantidades del carrito.");
}
async function publicApi(request: Request, resource: string) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);
  if (scenario === "error") throw new DemoError("INTERNAL_ERROR", "No se pudo completar la consulta demo.", 503);
  const state = await readDemoState();
  // Normal mock mode remains immutable and uses the original catalog/settings.
  if (!demoEnabled) Object.assign(state, { products: structuredClone(mockProducts), categories: structuredClone(mockCategories), sliders: structuredClone(mockSliderItems), settings: structuredClone(mockSettings), currentRate: structuredClone(mockExchangeRate) });
  const url = new URL(request.url), query = url.searchParams;
  const parts = resource.split("/");
  if (request.method === "GET") {
    if (resource === "demo/revision") return response({ revision: state.revision, demo: demoEnabled }, state.revision);
    if (resource === "categories") return response(scenario === "empty" ? [] : state.categories.filter(category => category.isActive).toSorted((a, b) => a.sortOrder - b.sortOrder), state.revision);
    if (resource === "settings/public") return response({ ...state.settings, demoPreview: demoEnabled }, state.revision);
    if (resource === "exchange-rates/current") return response(scenario === "stale-rate" ? { ...currentRate(state), stale: true } : currentRate(state), state.revision);
    if (resource === "sliders/active") return response(scenario === "empty" ? [] : state.sliders.filter(slide => slide.placement === "home_hero" && slide.status === "ACTIVE").toSorted((a, b) => a.sortOrder - b.sortOrder).map(slide => resolveProductSlide(slide, state.products, state.categories)), state.revision);
    if (parts[0] === "products") {
      let products = scenario === "empty" ? [] : getPublicProducts(state);
      if (parts[1] === "featured") return response(products.filter(product => product.featured).slice(0, Math.max(1, Math.min(100, Number(query.get("limit") ?? 6)))), state.revision);
      if (parts[1]) { const product = products.find(product => product.slug === parts[1]); if (!product) throw new DemoError("PRODUCT_NOT_FOUND", "Producto no encontrado.", 404); return response(product, state.revision); }
      const categories = getMenuCategorySlugs(query.get("categorySlug"));
      products = products.filter(product => (!categories.length || categories.includes(product.categorySlug ?? "")) && (!query.has("featured") || product.featured === (query.get("featured") === "true")) && (!query.has("type") || product.type === query.get("type")));
      const result = paginate(products, Number(query.get("page") ?? 1), Number(query.get("limit") ?? 24));
      return response({ ...result, meta: { ...result.meta, revision: state.revision } }, state.revision);
    }
    if (parts[0] === "order-intents" && parts[1] === "confirm") {
      const intent = state.orderIntents.find(intent => `demo-${intent.id}` === parts[2]);
      if (!intent) throw new DemoError("ORDER_TOKEN_INVALID", "Esta intención demo no existe.", 404);
      return response(intent, state.revision);
    }
  }
  if (resource === "analytics/events") return response({ accepted: true }, undefined, 202); // Deliberately fixed fixtures; no visit-dependent claims.
  if (request.method === "POST") checkOrigin(request);
  if (resource === "cart/quote" || resource === "order-intents") {
    const body = objectBody(await request.json().catch(() => null)); validateItems(body);
    const makeQuote = (snapshot: DemoState) => {
      const rateError = getQuoteRateError(body, scenario, snapshot);
      if (rateError) throw new DemoError("EXCHANGE_RATE_UNAVAILABLE", rateError, 503);
      try { return buildCartQuote(body, scenario, snapshot); }
      catch { throw new DemoError("EXCHANGE_RATE_UNAVAILABLE", "No se puede calcular este importe con la tasa actual. Revisa el catálogo y la tasa antes de continuar.", 503); }
    };
    if (resource === "cart/quote") return response(makeQuote(state), state.revision);
    const result = await appendDemoIntent(draft => {
      checkOrigin(request);
      const quote = makeQuote(draft);
      const expected = body.expectedRate as CreateOrderIntentRequestDto["expectedRate"];
      if (!expected || expected.id !== quote.rateSnapshot.id || expected.rate !== quote.rateSnapshot.rate
        || expected.baseCurrency !== quote.rateSnapshot.baseCurrency || expected.targetCurrency !== "VES"
        || expected.fetchedAt !== quote.rateSnapshot.fetchedAt || body.expectedTotalVes !== quote.totals.totalVes) {
        throw new DemoError("CONFLICT", "La tasa o el pedido cambiaron. Actualiza el cálculo y revisa el mensaje antes de continuar.", 409);
      }
      if (quote.invalidItems.length) invalid("items", "Hay productos que no se pueden comprar. Actualiza el carrito.");
      if (!(["PICKUP", "DELIVERY"].includes(String(body.fulfillmentType))) || !(body.fulfillmentType === "PICKUP" ? draft.settings.pickupEnabled : draft.settings.deliveryEnabled)) invalid("fulfillmentType", "La modalidad seleccionada ya no está disponible.");
      for (const [field, max] of [["customerName", 100], ["customerPhone", 50], ["deliveryAddress", 500], ["notes", 500]] as const) if (body[field] !== undefined && (typeof body[field] !== "string" || String(body[field]).length > max)) invalid(field, "Revisa los datos del pedido.");
      if (body.items.some(item => item.notes !== undefined && (typeof item.notes !== "string" || item.notes.length > 200))) invalid("items", "Las notas por producto admiten hasta 200 caracteres.");
      if (body.fulfillmentType === "DELIVERY" && !String(body.deliveryAddress ?? "").trim()) invalid("deliveryAddress", "Escribe una dirección para delivery.");
      const subtotal = parseMoneyCents((draft.settings.defaultCurrency === "EUR" ? quote.totals.subtotalEur : quote.totals.subtotalUsd) ?? "0");
      if (subtotal === null || subtotal < (parseMoneyCents(draft.settings.minimumOrderAmount ?? "0") ?? 0)) invalid("items", "El pedido no alcanza el importe mínimo.");
      const id = `ord-${randomUUID()}`, publicCode = `SOKY-${String(draft.orderIntents.length + 1).padStart(3, "0")}`;
      const expiresAt = new Date(Date.now() + 86400000).toISOString();
      const whatsappMessage = buildCheckoutMessage(quote, body as unknown as CreateOrderIntentRequestDto);
      draft.orderIntents.push({ id, publicCode, status: "PENDING_WHATSAPP", fulfillmentType: body.fulfillmentType as "PICKUP" | "DELIVERY", customerName: demoEnabled ? "Cliente demo" : String(body.customerName ?? ""), deliveryAddress: demoEnabled ? (body.fulfillmentType === "DELIVERY" ? "Dirección ficticia de presentación" : undefined) : String(body.deliveryAddress ?? ""), items: quote.items, totals: quote.totals, rateSnapshot: quote.rateSnapshot, expiresAt, createdAt: new Date().toISOString() });
      return { id, publicCode, status: "PENDING_WHATSAPP", whatsappUrl: demoEnabled ? "" : buildWhatsAppUrl(draft.settings.whatsappPhone, whatsappMessage), whatsappMessage, confirmationUrl: "", expiresAt, warnings: quote.warnings, demoPreview: demoEnabled };
    });
    return response(result, undefined, 201);
  }
  if (parts[0] === "order-intents" && parts[2] === "whatsapp-clicked") {
    if (demoEnabled) throw new DemoError("FORBIDDEN", "La vista previa demo no registra salidas a WhatsApp.", 403);
    return response(await appendDemoIntent(draft => { const intent = find(draft.orderIntents, parts[1]); intent.whatsappClickedAt = new Date().toISOString(); return intent; }));
  }
  throw new DemoError("NOT_FOUND", "Acción no disponible.", 404);
}

export async function handleDemoRequest(request: Request, resource: string) {
  try {
    if (resource.startsWith("auth/") || resource === "admin/demo/status" || resource === "admin/demo/reset") return await handleDemoSessionRequest(request, resource);
    if (resource.startsWith("admin/")) return await admin(request, resource);
    return await publicApi(request, resource);
  } catch (error) {
    if (error instanceof DemoError) return response({ code: error.code, message: error.message, details: error.fields ? { fields: error.fields } : undefined }, undefined, error.status);
    if (error instanceof SyntaxError) return response({ code: "VALIDATION_ERROR", message: "Revisa los datos del formulario." }, undefined, 422);
    console.error("[SOKY demo]", error);
    return response({ code: "INTERNAL_ERROR", message: "No pudimos completar la operación. Tus cambios no se confirmaron. Vuelve a intentar." }, undefined, 500);
  }
}
