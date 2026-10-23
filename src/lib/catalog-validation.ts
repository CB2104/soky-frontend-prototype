import type { AdminCategoryCreateDto, AdminProductCreateDto, PublicSettingsDto } from "@/contracts/api";
import { parseMoneyCents } from "./money";

// Shared form/API limits. Amounts are stored as decimal strings in the base currency.
export const CATALOG_LIMITS = { title: 120, slug: 100, shortDescription: 300, description: 4000, imageAlt: 240, imageUrl: 800, name: 100, categoryDescription: 600, sortOrder: 1000000, moneyCents: 1000000000 } as const;
export type FieldErrors = Record<string, string>;
export const safeSlug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, CATALOG_LIMITS.slug).replace(/-$/, "");
export const normalizeAmount = (value: string) => value.trim().replace(",", ".");
export function validAmount(value: unknown) {
  if (typeof value !== "string" || value.length > 14) return false;
  const cents = parseMoneyCents(value);
  return cents !== null && cents <= CATALOG_LIMITS.moneyCents;
}
export function permittedImage(value: unknown) {
  if (typeof value !== "string" || value.length > CATALOG_LIMITS.imageUrl) return false;
  if (/^\/images\/[\w/(). -]+\.(?:webp|png|jpg|jpeg|svg)$/i.test(value) && !value.includes("..")) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !url.port && ["picsum.photos", "images.unsplash.com"].includes(url.hostname); } catch { return false; }
}
function text(errors: FieldErrors, key: string, value: unknown, max: number, required = false) {
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) errors[key] = `Escribe ${required ? "un texto no vacío de " : "hasta "}${max} caracteres como máximo.`;
}
function slug(errors: FieldErrors, key: string, value: unknown) {
  if (typeof value !== "string" || value.length > CATALOG_LIMITS.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) errors[key] = "Usa letras minúsculas, números y guiones (máximo 100 caracteres).";
}
function order(errors: FieldErrors, value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > CATALOG_LIMITS.sortOrder) errors.sortOrder = "Usa un entero entre 0 y 1000000.";
}
export function productErrors(product: AdminProductCreateDto, requireDescription = true): FieldErrors {
  const errors: FieldErrors = {};
  text(errors, "title", product.title, CATALOG_LIMITS.title, true); slug(errors, "slug", product.slug);
  text(errors, "description", product.description, CATALOG_LIMITS.description, requireDescription);
  if (product.shortDescription !== undefined) text(errors, "shortDescription", product.shortDescription, CATALOG_LIMITS.shortDescription);
  text(errors, "imageAlt", product.imageAlt, CATALOG_LIMITS.imageAlt, true);
  if (!permittedImage(product.imageUrl)) errors.imageUrl = "Usa una imagen local existente o HTTPS de picsum.photos / images.unsplash.com.";
  if (!validAmount(product.priceAmount)) errors.priceAmount = "Usa un importe de 0 a 10000000 con hasta dos decimales, sin miles ni exponentes.";
  order(errors, product.sortOrder);
  for (const key of ["tags", "allergens"] as const) if (!Array.isArray(product[key]) || product[key].length > 30 || product[key].some(value => typeof value !== "string" || !value.trim() || value.length > 100)) errors[key] = "Usa hasta 30 textos no vacíos de 100 caracteres.";
  const details = product.details;
  if (details) {
    for (const key of ["pieces", "quantity"] as const) if (details[key] !== undefined && (!Number.isSafeInteger(details[key]) || details[key]! < 0 || details[key]! > CATALOG_LIMITS.sortOrder)) errors.details = "Revisa las cantidades: enteros entre 0 y 1000000.";
    if (details.unit !== undefined) text(errors, "details", details.unit, 80);
    for (const key of ["composition", "components", "variants"] as const) {
      const rows = details[key];
      if (rows !== undefined && (!Array.isArray(rows) || rows.length > 50 || JSON.stringify(rows).length > 5000)) errors.details = "Usa hasta 50 filas por grupo de detalle (máximo 5000 caracteres).";
    }
    const validQuantity = (n: unknown) => Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= CATALOG_LIMITS.sortOrder;
    const validText = (s: unknown) => typeof s === "string" && !!s.trim() && s.length <= 100;
    if (Array.isArray(details.composition) && details.composition.some(row => !row || !validText(row.type) || !validQuantity(row.quantity))) errors.details = "Cada composición necesita un nombre y una cantidad entera válida.";
    if (Array.isArray(details.components) && details.components.some(row => typeof row === "string" ? !validText(row) : !row || !validText(row.name) || !validQuantity(row.quantity))) errors.details = "Revisa el nombre y la cantidad de cada componente.";
    if (Array.isArray(details.variants) && details.variants.some(row => !validText(row))) errors.details = "Cada variante necesita un texto de hasta 100 caracteres.";
  }
  return errors;
}
export function categoryErrors(category: AdminCategoryCreateDto): FieldErrors {
  const errors: FieldErrors = {};
  text(errors, "name", category.name, CATALOG_LIMITS.name, true); slug(errors, "slug", category.slug); slug(errors, "key", category.key); order(errors, category.sortOrder);
  if (category.description !== undefined) text(errors, "description", category.description, CATALOG_LIMITS.categoryDescription);
  if (category.imageUrl && !permittedImage(category.imageUrl)) errors.imageUrl = "Usa una imagen local existente o una URL de imagen permitida.";
  return errors;
}
export function settingsErrors(settings: PublicSettingsDto): FieldErrors {
  const errors: FieldErrors = {};
  text(errors, "businessName", settings.businessName, 120, true);
  if (settings.slogan !== undefined) text(errors, "slogan", settings.slogan, 300);
  if (typeof settings.whatsappPhone !== "string" || !/^\+?\d{8,15}$/.test(settings.whatsappPhone)) errors.whatsappPhone = "Usa un número internacional de 8 a 15 dígitos.";
  for (const key of ["instagramUrl", "googleMapsUrl", "googleMapsEmbedUrl"] as const) if (settings[key]) {
    try { const url = new URL(settings[key]); if (url.protocol !== "https:" || url.username || url.password || url.port || settings[key]!.length > 800) throw new Error();
      const host = url.hostname;
      if (key === "instagramUrl" ? !["instagram.com", "www.instagram.com"].includes(host) : !["maps.app.goo.gl", "goo.gl", "maps.google.com", "google.com", "www.google.com"].includes(host)) throw new Error();
      if (key === "googleMapsEmbedUrl" && (!url.pathname.startsWith("/maps/embed") || !["www.google.com", "google.com"].includes(host))) throw new Error();
    } catch { errors[key] = key === "instagramUrl" ? "Usa un enlace HTTPS de Instagram." : "Usa un enlace HTTPS válido de Google Maps (enlace de inserción para el mapa integrado)."; }
  }
  if (settings.address !== undefined) text(errors, "address", settings.address, 500);
  if (settings.deliveryNotes !== undefined) text(errors, "deliveryNotes", settings.deliveryNotes, 600);
  if (!Array.isArray(settings.openingHoursDisplay) || !settings.openingHoursDisplay.length || settings.openingHoursDisplay.length > 14 || settings.openingHoursDisplay.some(line => typeof line !== "string" || !line.trim() || line.length > 240)) errors.openingHoursDisplay = "Usa de 1 a 14 líneas de horario no vacías, de hasta 240 caracteres.";
  if (!settings.pickupEnabled && !settings.deliveryEnabled) errors.pickupEnabled = "Debe existir al menos una modalidad activa.";
  if (!validAmount(settings.minimumOrderAmount ?? "0")) errors.minimumOrderAmount = "Usa un importe de 0 a 10000000 con hasta dos decimales.";
  return errors;
}
