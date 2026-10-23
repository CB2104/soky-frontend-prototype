"use client";

import { useState, type FormEvent } from "react";
import type { AdminProductCreateDto, ProductDetailsDto, ProductDto } from "@/contracts/api";
import type { DemoSnapshot } from "@/contracts/demo";
import { CATALOG_LIMITS as limits, normalizeAmount, productErrors, safeSlug } from "@/lib/catalog-validation";
import { apiClient } from "@/lib/api/client";
import { useAdminMutation } from "../useAdminWorkspace";
import { useAdminConfirmation, useUnsavedChanges } from "../components/AdminConfirmDialog";
import { CheckField, FormField, FormSection, ImagePreview } from "../components/AdminFormFields";
import { comparisonRows, EditorStatus, useRecordDraft } from "../components/AdminEditorStatus";
import styles from "../components/AdminWorkspace.module.css";

export function editableProduct(product: ProductDto): AdminProductCreateDto {
  const { title, slug, shortDescription, description, categoryId, type, status, isAvailable, sortOrder, priceCurrency, priceAmount, imageUrl, imageAlt, featured, tags, allergens, details } = product;
  return { title, slug, shortDescription, description, categoryId, type, status, isAvailable, sortOrder, priceCurrency, priceAmount, imageUrl, imageAlt, featured, tags, allergens, details };
}
const labels = { title: "Nombre", slug: "Dirección web", shortDescription: "Descripción corta", description: "Descripción", categoryId: "Categoría", type: "Tipo", status: "Estado", isAvailable: "Disponible", sortOrder: "Orden", priceCurrency: "Moneda", priceAmount: "Precio", imageUrl: "Imagen", imageAlt: "Texto alternativo", featured: "Destacado", tags: "Etiquetas", allergens: "Alérgenos", details: "Detalle" };

export function ProductEditor({ product, snapshot, onSaved, onClose }: { product?: ProductDto; snapshot: DemoSnapshot; onSaved: (product: ProductDto, revision: number) => void; onClose: () => void }) {
  const initial: AdminProductCreateDto = product ? editableProduct(product) : { title: "", slug: "", shortDescription: "", description: "", categoryId: snapshot.categories.find(category => category.isActive)?.id ?? "", type: "SIMPLE", status: "DRAFT", isAvailable: true, sortOrder: 0, priceCurrency: snapshot.settings.defaultCurrency, priceAmount: "0.00", imageUrl: "", imageAlt: "", featured: false, tags: [], allergens: [] };
  const form = useRecordDraft(`soky-admin-product-${product?.id ?? "new"}`, initial, snapshot.revision);
  const { draft, update } = form;
  const mutation = useAdminMutation();
  const { confirm, confirmation } = useAdminConfirmation();
  const discard = useUnsavedChanges(form.dirty, confirm, form.clearStorage);
  const [latest, setLatest] = useState<{ product: AdminProductCreateDto; revision: number } | null>(null);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const errors = mutation.errors;
  const detail = draft.details ?? {};
  const updateDetail = <K extends keyof ProductDetailsDto>(key: K, value: ProductDetailsDto[K]) => update("details", { ...detail, [key]: value });

  async function compare() {
    try {
      const current = await apiClient.get<DemoSnapshot>("/admin/demo/workspace");
      const saved = current.products.find(row => row.id === product?.id);
      if (product && !saved) { mutation.setMessage("Este producto fue eliminado. Tu borrador sigue aquí; copia sus valores antes de cerrar."); return; }
      setLatest({ product: saved ? editableProduct(saved) : { ...initial, priceCurrency: current.settings.defaultCurrency }, revision: current.revision });
    } catch { mutation.setMessage("No pudimos cargar la versión actual. Tu borrador sigue aquí."); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.saving) return;
    const payload = { ...draft, priceAmount: normalizeAmount(draft.priceAmount), tags: draft.tags.map(tag => tag.trim()).filter(Boolean), allergens: draft.allergens.map(tag => tag.trim()).filter(Boolean) };
    const validation = productErrors(payload);
    const category = snapshot.categories.find(category => category.id === payload.categoryId);
    if (!category || (payload.status === "ACTIVE" && !category.isActive)) validation.categoryId = "Selecciona una categoría activa para publicar.";
    if (snapshot.products.some(row => row.id !== product?.id && row.slug === payload.slug)) validation.slug = "Esta dirección web ya está en uso.";
    if (brokenSrc === draft.imageUrl) validation.imageUrl = "La imagen no carga. Selecciona otra imagen antes de guardar.";
    if (Object.keys(validation).length) { mutation.setErrors(validation); mutation.setMessage("Revisa los campos indicados. Tus cambios siguen aquí."); return; }
    const response = await mutation.mutate<ProductDto>(`/admin/products${product ? `/${encodeURIComponent(product.id)}` : ""}`, payload, form.revision, product ? "PATCH" : "POST");
    if (response) { form.clearStorage(); form.reset(editableProduct(response.data), response.revision); onSaved(response.data, response.revision); }
  }
  return <form className={`${styles.panel} ${styles.panelPadding}`} onSubmit={submit} onChange={() => { if (mutation.message === "Cambios guardados") mutation.setMessage(""); }} noValidate aria-labelledby="product-editor-title">
    <div className={styles.toolbar}><h2 id="product-editor-title" className={styles.sectionTitle}>{product ? `Editar ${product.title}` : "Agregar producto"}</h2><button type="button" className={styles.secondaryButton} onClick={async () => { if (await discard()) { form.clearStorage(); onClose(); } }}>Cerrar editor</button></div>
    <p className={styles.fieldHint}>{form.dirty ? "Cambios sin guardar" : "Sin cambios pendientes"}. * Campo obligatorio. Archivar retira el producto de la venta; agotado conserva su ficha.</p>
    <EditorStatus mutation={mutation} onCompare={compare} comparison={latest ? comparisonRows(latest.product, draft, labels) : null} onUseCurrent={() => { if (latest) { form.reset(latest.product, latest.revision); setLatest(null); mutation.clear(); } }} onKeepChanges={() => { if (latest) { form.rebase(latest.product, latest.revision); setLatest(null); mutation.clear(); } }} />
    <fieldset disabled={mutation.saving || mutation.unauthorized} className={styles.editorFields}>
      <FormSection title="Identidad">
        <FormField name="title" label="Nombre" value={draft.title} onChange={value => { update("title", value); if (!product && (!draft.slug || draft.slug === safeSlug(draft.title))) update("slug", safeSlug(value)); }} errors={errors} maxLength={limits.title} required />
        <FormField name="slug" label="Dirección web" value={draft.slug} onChange={value => update("slug", value)} errors={errors} maxLength={limits.slug} hint="Letras minúsculas, números y guiones. Cambiarla retira la dirección anterior." required />
        <FormField name="shortDescription" label="Descripción corta" value={draft.shortDescription ?? ""} onChange={value => update("shortDescription", value)} errors={errors} maxLength={limits.shortDescription} />
        <FormField name="description" label="Descripción completa" type="textarea" value={draft.description} onChange={value => update("description", value)} errors={errors} maxLength={limits.description} required />
      </FormSection>
      <FormSection title="Catálogo">
        <FormField name="categoryId" label="Categoría" value={draft.categoryId} onChange={value => update("categoryId", value)} errors={errors} options={[{ value: "", label: "Selecciona una categoría" }, ...snapshot.categories.map(category => ({ value: category.id, label: `${category.name}${category.isActive ? "" : " · inactiva"}` }))]} required />
        <FormField name="type" label="Tipo" value={draft.type} onChange={value => update("type", value as AdminProductCreateDto["type"])} options={[{ value: "SIMPLE", label: "Simple" }, { value: "PROMO", label: "Promoción" }, { value: "COMBO", label: "Combo" }]} errors={errors} />
        <FormField name="status" label="Estado" value={draft.status} onChange={value => update("status", value as AdminProductCreateDto["status"])} options={[{ value: "DRAFT", label: "Borrador" }, { value: "ACTIVE", label: "Publicado" }, { value: "ARCHIVED", label: "Archivado" }]} errors={errors} />
        <FormField name="sortOrder" label="Orden en el catálogo" type="number" value={Number.isFinite(draft.sortOrder) ? draft.sortOrder : ""} onChange={value => update("sortOrder", value === "" ? NaN : Number(value))} errors={errors} />
        <CheckField label="Producto destacado" checked={draft.featured} onChange={value => update("featured", value)} />
      </FormSection>
      <FormSection title="Precio y disponibilidad">
        <FormField name="priceAmount" label={`Precio en ${draft.priceCurrency}`} type="decimal" value={draft.priceAmount} onChange={value => update("priceAmount", value)} errors={errors} hint="Hasta dos decimales. Puedes usar coma o punto; sin separadores de miles." required />
        <FormField name="priceCurrency" label="Moneda global" value={draft.priceCurrency} readOnly hint="El cambio de moneda se gestiona en Tasas." />
        <CheckField label="Disponible para comprar" checked={draft.isAvailable} onChange={value => update("isAvailable", value)} />
      </FormSection>
      <FormSection title="Imagen">
        <FormField name="imageUrl" label="Imagen · ruta local o enlace" value={draft.imageUrl} onChange={value => update("imageUrl", value)} errors={errors} maxLength={limits.imageUrl} required />
        <FormField name="asset" label="Elegir imagen del catálogo" value={snapshot.products.some(row => row.imageUrl === draft.imageUrl) ? draft.imageUrl : ""} onChange={value => { if (value) update("imageUrl", value); }} options={[{ value: "", label: "Selecciona una imagen existente" }, ...Array.from(new Map(snapshot.products.map(row => [row.imageUrl, { value: row.imageUrl, label: row.title }])).values())]} />
        <FormField name="imageAlt" label="Texto alternativo" value={draft.imageAlt} onChange={value => update("imageAlt", value)} errors={errors} maxLength={limits.imageAlt} required />
        <ImagePreview src={draft.imageUrl} alt={draft.imageAlt} onBroken={broken => setBrokenSrc(broken ? draft.imageUrl : null)} />
      </FormSection>
      <FormSection title="Detalle del producto">
        <FormField name="tags" label="Etiquetas" value={draft.tags.join(",")} onChange={value => update("tags", value.split(","))} errors={errors} hint="Separadas por comas. Hasta 30 etiquetas de 100 caracteres." />
        <FormField name="allergens" label="Alérgenos" value={draft.allergens.join(",")} onChange={value => update("allergens", value.split(","))} errors={errors} hint="Separados por comas. Un campo vacío no certifica ausencia de alérgenos." />
        <FormField name="pieces" label="Piezas" type="number" value={detail.pieces ?? ""} onChange={value => updateDetail("pieces", value === "" ? undefined : Number(value))} errors={errors} />
        <FormField name="quantity" label="Cantidad" type="number" value={detail.quantity ?? ""} onChange={value => updateDetail("quantity", value === "" ? undefined : Number(value))} errors={errors} />
        <FormField name="unit" label="Unidad" value={detail.unit ?? ""} onChange={value => updateDetail("unit", value)} maxLength={80} />
        <FormField name="variants" label="Variantes · una por línea" type="textarea" value={(detail.variants ?? []).join("\n")} onChange={value => updateDetail("variants", value ? value.split("\n") : [])} />
        <div className={styles.fieldWide}>
          <DetailRows title="Composición" rows={(detail.composition ?? []).map(row => ({ name: row.type, quantity: row.quantity }))} onChange={rows => updateDetail("composition", rows.map(row => ({ type: row.name, quantity: row.quantity ?? 0 })))} quantityRequired />
          <DetailRows title="Componentes" rows={(detail.components ?? []).map(row => typeof row === "string" ? { name: row } : row)} onChange={rows => updateDetail("components", rows.map(row => row.quantity === undefined ? row.name : { name: row.name, quantity: row.quantity }))} />
          {errors.details ? <p className={styles.fieldError} role="alert">{errors.details}</p> : null}
        </div>
      </FormSection>
      <div className={styles.actions}><button type="submit" className={styles.primaryButton} disabled={mutation.conflict || !form.dirty}>{mutation.saving ? "Guardando…" : draft.status === "DRAFT" ? "Guardar borrador" : "Guardar cambios"}</button><button type="button" className={styles.secondaryButton} onClick={async () => { if (await discard()) { form.clearStorage(); onClose(); } }}>Cancelar</button></div>
    </fieldset>
    {confirmation}
  </form>;
}

function DetailRows({ title, rows, onChange, quantityRequired }: { title: string; rows: { name: string; quantity?: number }[]; onChange: (rows: { name: string; quantity?: number }[]) => void; quantityRequired?: boolean }) {
  return <div className={styles.detailGroup}><h4>{title}</h4>{rows.map((row, index) => <div key={index} className={styles.detailRow}>
    <FormField name={`${title}-${index}-name`} label={`${title} ${index + 1} · nombre`} value={row.name} maxLength={100} onChange={name => onChange(rows.map((item, i) => i === index ? { ...item, name } : item))} />
    <FormField name={`${title}-${index}-quantity`} label="Cantidad" type="number" value={row.quantity ?? ""} onChange={value => onChange(rows.map((item, i) => i === index ? { ...item, quantity: value === "" && !quantityRequired ? undefined : Number(value) } : item))} />
    <button type="button" className={styles.secondaryButton} aria-label={`Quitar ${title.toLowerCase()} ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}>Quitar</button>
  </div>)}<button type="button" className={styles.secondaryButton} disabled={rows.length >= 50} onClick={() => onChange([...rows, { name: "", ...(quantityRequired ? { quantity: 1 } : {}) }])}>Agregar {title.toLowerCase()}</button></div>;
}
