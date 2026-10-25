"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { AdminSliderItemDto, CategoryDto, ProductDto, SliderCtaDto } from "@/contracts/api";
import type { DemoSnapshot } from "@/contracts/demo";
import { HERO_ROLES } from "@/features/hero/admin-fields";
import { getDemoSnapshot } from "@/features/admin/demo-client";
import { resolveProductSlide } from "@/features/hero/resolve-product-slides";
import { useAdminMutation } from "../useAdminWorkspace";
import { useAdminConfirmation, useUnsavedChanges } from "../components/AdminConfirmDialog";
import { EditorStatus, comparisonRows, useRecordDraft } from "../components/AdminEditorStatus";
import { AdminStatus } from "../components/admin-table";
import { FormField, ImagePreview } from "../components/AdminFormFields";
import workspaceStyles from "../components/AdminWorkspace.module.css";
import styles from "./HeroWorkspace.module.css";
import { heroThumbnail, pendingHeroFields } from "./hero-content";
import { decodeHeroDraft, editableHero, materializeHero } from "./hero-draft";

type EditableField = "status" | "title" | "description" | "eyebrow" | "badgeLabel" | "promoNote" | "productId" | "primaryCta" | "secondaryCta" | "rotatorImages" | "productLayer";
type HeroPreviewResponse = { slide: AdminSliderItemDto; revision: number; preview: true };
type Viewport = "desktop" | "mobile";

const sourceKeys = ["desktop", "desktopWide", "tabletLandscape", "tabletPortrait", "mobile", "desktopUrl", "mobileUrl", "src"];
const copyFields: { key: "title" | "description" | "eyebrow" | "badgeLabel" | "promoNote"; label: string; maxLength: number; wide?: boolean }[] = [
  { key: "title", label: "Título", maxLength: 120 },
  { key: "description", label: "Descripción", maxLength: 300, wide: true },
  { key: "eyebrow", label: "Texto superior", maxLength: 120 },
  { key: "badgeLabel", label: "Etiqueta promocional", maxLength: 120 },
  { key: "promoNote", label: "Nota promocional", maxLength: 120 },
];

const ctaOptions = [
  { value: "MENU", label: "Menú" },
  { value: "LOCATION", label: "Ubicación" },
  { value: "CART", label: "Carrito" },
  { value: "WHATSAPP", label: "WhatsApp (vista previa)" },
  { value: "PRODUCT", label: "Producto" },
  { value: "CATEGORY", label: "Categoría" },
  { value: "CUSTOM_PATH", label: "Ruta interna" },
  { value: "NONE", label: "Sin destino" },
];

const fieldLabels: Record<string, string> = {
  status: "Estado",
  title: "Título",
  description: "Descripción",
  eyebrow: "Texto superior",
  badgeLabel: "Etiqueta promocional",
  promoNote: "Nota promocional",
  productId: "Producto destacado",
  primaryCta: "Botón principal",
  secondaryCta: "Botón secundario",
  productLayer: "Imágenes del producto",
  rotatorImages: "Productos del rotador",
};

export function HeroWorkspace({ initialSnapshot }: { initialSnapshot: DemoSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("composition");
    queueMicrotask(() => setSelectedId(HERO_ROLES.some(role => role.id === id) ? id : initialSnapshot.sliders[0]?.id ?? ""));
  }, [initialSnapshot]);
  function select(id: string) {
    const url = new URL(window.location.href); url.searchParams.set("composition", id);
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event("soky-admin-query"));
    setSelectedId(id);
  }
  if (selectedId === null) return <p role="status">Cargando borrador de esta pestaña…</p>;
  const selected = snapshot.sliders.find(slide => slide.id === selectedId);
  if (!selected) return <div role="alert"><p>La composición ya no está disponible. No se aplicará su contenido anterior. Conserva una copia del borrador local antes de descartarlo.</p><button type="button" onClick={() => {
    let content = "{}"; try { content = sessionStorage.getItem(`soky-admin-hero-${selectedId}`) ?? "{}"; } catch { /* No recoverable browser storage. */ }
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = "hero-borrador.json"; a.click(); URL.revokeObjectURL(url);
  }}>Descargar borrador</button><button type="button" onClick={() => { try { sessionStorage.removeItem(`soky-admin-hero-${selectedId}`); } catch { /* Optional storage. */ } select(snapshot.sliders[0]?.id ?? ""); }}>Descartar composición eliminada</button></div>;
  return <HeroEditor key={selected.id} snapshot={snapshot} setSnapshot={setSnapshot} selected={selected} onSelect={select} />;
}

function HeroEditor({ snapshot, setSnapshot, selected, onSelect }: { snapshot: DemoSnapshot; setSnapshot: React.Dispatch<React.SetStateAction<DemoSnapshot>>; selected: AdminSliderItemDto; onSelect: (id: string) => void }) {
  const form = useRecordDraft(`soky-admin-hero-${selected.id}`, editableHero(selected), snapshot.revision, value => decodeHeroDraft(value, selected));
  const baseline = materializeHero(selected, form.baseline);
  const draft = materializeHero(selected, form.draft);
  const [previewToken, setPreviewToken] = useState("");
  const [previewMatchesDraft, setPreviewMatchesDraft] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [comparison, setComparison] = useState<{ label: string; current: string; draft: string }[] | null>(null);
  const [compareSnapshot, setCompareSnapshot] = useState<DemoSnapshot | null>(null);
  const mutation = useAdminMutation();
  const { confirm, confirmation } = useAdminConfirmation();

  const role = HERO_ROLES.find((item) => item.id === selected?.id) ?? HERO_ROLES[0];
  const allowedFields = role.fields as readonly EditableField[];
  const isDirty = form.dirty;
  const recoveredConflict = isDirty && form.revision !== snapshot.revision;
  useUnsavedChanges(isDirty, confirm, form.clearStorage);
  const categories = snapshot.categories;
  const products = snapshot.products;
  const pendingFields = selected ? pendingHeroFields(selected) : [];
  const otherPlacements = snapshot.sliders.filter((slide) => !HERO_ROLES.some((item) => item.id === slide.id));

  const setPreviewFrame = useCallback((slide: AdminSliderItemDto) => {
    try {
      const token = window.crypto.randomUUID();
      window.sessionStorage.setItem(`soky-admin-hero-preview-${token}`, JSON.stringify(slide));
      setPreviewToken(token);
    } catch {
      setPreviewError("No pudimos abrir la vista previa. Permite el almacenamiento de esta pestaña y vuelve a intentar.");
    }
  }, []);

  useEffect(() => {
    if (previewToken || !selected) return;
    const timer = window.setTimeout(() => {
      setPreviewFrame(resolveProductSlide(selected, products, categories));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [categories, previewToken, products, selected, setPreviewFrame]);

  useEffect(() => () => {
    try { if (previewToken) window.sessionStorage.removeItem(`soky-admin-hero-preview-${previewToken}`); } catch { /* Preview storage is optional. */ }
  }, [previewToken]);

  function updateDraft(next: (current: AdminSliderItemDto) => AdminSliderItemDto) {
    form.update("values", editableHero(next(draft)).values);
    setPreviewMatchesDraft(false);
    setPreviewError("");
  }

  function resetToSlide(slide: AdminSliderItemDto) {
    form.reset(editableHero(slide), snapshot.revision);
    setPreviewFrame(resolveProductSlide(slide, products, categories));
    setPreviewMatchesDraft(true);
    setPreviewError("");
    setComparison(null);
    setCompareSnapshot(null);
    mutation.clear();
  }

  async function selectSlide(slide: AdminSliderItemDto) {
    if (slide.id === selected?.id) return;
    if (isDirty && !await confirm({
      title: "Cambiar de composición",
      description: "Se descartarán los cambios sin guardar de esta composición.",
      confirmLabel: "Descartar cambios",
      cancelLabel: "Seguir editando",
    })) return;
    form.clearStorage();
    onSelect(slide.id);
  }

  function makePatch() {
    const patch: Record<string, unknown> = {};
    for (const field of allowedFields) {
      const before = baseline[field as keyof AdminSliderItemDto];
      const after = draft[field as keyof AdminSliderItemDto];
      if (JSON.stringify(before) === JSON.stringify(after)) continue;
      patch[field] = field === "rotatorImages" ? cleanRotatorImages(draft.rotatorImages) : after;
    }
    return patch;
  }

  async function runPreview() {
    if (!selected) return;
    setPreviewing(true);
    setPreviewError("");
    try {
      const response = await fetch("/api/mock/v1/admin/sliders/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ expectedRevision: form.revision, slideId: selected.id, patch: makePatch() }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        if (response.status === 409) {
          setPreviewError("Los datos cambiaron. Recarga la versión actual antes de ver este borrador.");
        } else if (response.status === 401) {
          setPreviewError("La sesión de demo terminó. Vuelve a entrar para continuar.");
        } else {
          setPreviewError(error?.message ?? "No pudimos preparar esta vista previa.");
        }
        return;
      }
      const result = await response.json() as HeroPreviewResponse;
      setPreviewFrame(result.slide);
      setPreviewMatchesDraft(true);
    } catch {
      setPreviewError("No pudimos preparar esta vista previa. Tus cambios siguen aquí.");
    } finally {
      setPreviewing(false);
    }
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.ready || form.invalid || !isDirty || recoveredConflict) return;
    const patch = makePatch();
    if (!Object.keys(patch).length) return;
    const pendingChanges = Object.keys(patch).filter((field) => pendingFields.includes(field));
    const connectedChanges = Object.keys(patch).filter((field) => !pendingFields.includes(field));
    if (!await confirm({
      title: "Revisar cambios del Hero",
      description: [
        `Campos modificados: ${Object.keys(patch).map((field) => fieldLabels[field] ?? field).join(", ")}.`,
        connectedChanges.length ? draft.status === "ACTIVE" ? "Los campos conectados se aplicarán al site al guardar." : "La composición quedará fuera del Hero activo." : "",
        pendingChanges.length ? "El título se guardará como borrador administrativo, pendiente de conexión al site. El título público no cambiará." : "",
      ].filter(Boolean).join(" "),
      confirmLabel: pendingChanges.length && !connectedChanges.length ? "Guardar borrador" : "Guardar cambios",
    })) return;
    const result = await mutation.mutate<AdminSliderItemDto>(`/admin/sliders/${encodeURIComponent(selected.id)}`, patch, form.revision);
    if (!result) return;
    if (pendingChanges.length) mutation.setMessage(connectedChanges.length ? "Cambios guardados · título en borrador pendiente de conexión al site" : "Borrador guardado · pendiente de conexión al site");
    const saved = result.data;
    setSnapshot((current) => ({ ...current, revision: result.revision, sliders: current.sliders.map((slide) => slide.id === saved.id ? saved : slide) }));
    form.clearStorage();
    form.reset(editableHero(saved), result.revision);
    setPreviewFrame(resolveProductSlide(saved, products, categories));
    setPreviewMatchesDraft(true);
    setComparison(null);
    setCompareSnapshot(null);
  }

  async function reloadForComparison() {
    try {
      const latest = await getDemoSnapshot();
      setCompareSnapshot(latest);
      setSnapshot(latest);
      const latestSlide = latest.sliders.find((slide) => slide.id === selected?.id);
      if (!latestSlide || !decodeHeroDraft(form.draft, latestSlide)) {
        mutation.setMessage("La composición fue eliminada o cambió su estructura. Descarga tu borrador y descártalo para cargar una composición compatible.");
        return;
      }
      setComparison(comparisonRows(latestSlide, draft, fieldLabels));
    } catch {
      mutation.setMessage("No pudimos cargar la versión actual. Tus cambios siguen aquí.");
    }
  }

  function useCurrentVersion() {
    const latest = compareSnapshot?.sliders.find((slide) => slide.id === selected?.id);
    if (!latest) return;
    resetToSlide(latest);
  }

  function keepDraftOnCurrentVersion() {
    const latest = compareSnapshot?.sliders.find((slide) => slide.id === selected?.id);
    if (!latest) return;
    const changed = Object.fromEntries(allowedFields.filter((field) => JSON.stringify(baseline[field as keyof AdminSliderItemDto]) !== JSON.stringify(draft[field as keyof AdminSliderItemDto])).map((field) => [field, draft[field as keyof AdminSliderItemDto]]));
    const merged = { ...latest, ...changed } as AdminSliderItemDto;
    setSnapshot((current) => ({ ...current, revision: compareSnapshot!.revision, sliders: current.sliders.map((slide) => slide.id === latest.id ? latest : slide) }));
    form.reset(editableHero(latest), compareSnapshot!.revision);
    form.update("values", editableHero(merged).values);
    setPreviewMatchesDraft(false);
    setPreviewError("");
    setComparison(null);
    mutation.clear();
  }

  if (!selected) return <p className={workspaceStyles.emptyState}>No hay composiciones configuradas en esta demo.</p>;

  const roleLabel = HERO_ROLES.find((item) => item.id === selected.id)?.label ?? "Composición";

  return (
    <div className={styles.workspace}>
      <section className={styles.roles} aria-label="Composiciones del Hero">
        {HERO_ROLES.map((item, index) => {
          const slide = snapshot.sliders.find((row) => row.id === item.id);
          if (!slide) return null;
          const active = slide.status === "ACTIVE";
          return (
            <button key={item.id} type="button" className={styles.roleButton} data-selected={item.id === selected.id} onClick={() => void selectSlide(slide)} aria-current={item.id === selected.id ? "page" : undefined}>
              <span className={styles.roleIndex}><ImagePreview src={heroThumbnail(slide)} alt="" compact /><span>0{index + 1}</span></span>
              <span className={styles.roleCopy}><strong>{item.label}</strong><small>{slide.title}</small></span>
              <AdminStatus tone={active ? "positive" : slide.status === "DRAFT" ? "warning" : "neutral"}>{statusLabel(slide.status)}</AdminStatus>
              {pendingHeroFields(slide).length ? <small className={styles.connectionState}>Título pendiente de conexión al site</small> : null}
            </button>
          );
        })}
      </section>

      <div className={styles.layout}>
        <form className={`${workspaceStyles.panel} ${workspaceStyles.panelPadding} ${styles.editor}`} onSubmit={saveDraft}>
          <div className={workspaceStyles.toolbar}>
            <div>
              <h2 className={workspaceStyles.panelTitle}>{roleLabel}</h2>
              <p className={workspaceStyles.sectionDescription}>Los campos conectados actualizan el contenido existente. Los borradores pendientes se indican junto al campo.</p>
            </div>
            <AdminStatus tone={draft.status === "ACTIVE" ? "positive" : draft.status === "DRAFT" ? "warning" : "neutral"}>{statusLabel(draft.status)}</AdminStatus>
          </div>

          {allowedFields.includes("status") ? <FormField name="status" label="Estado de publicación" value={draft.status} onChange={(value) => updateDraft((current) => ({ ...current, status: value as AdminSliderItemDto["status"] }))} options={[{ value: "ACTIVE", label: "Activo" }, { value: "INACTIVE", label: "Inactivo" }, { value: "DRAFT", label: "Borrador" }]} errors={mutation.errors} /> : null}

          {allowedFields.some((field) => ["title", "description", "eyebrow", "badgeLabel", "promoNote"].includes(field)) ? (
            <fieldset className={workspaceStyles.editorFields}>
              <legend className={workspaceStyles.srOnly}>Texto de la composición</legend>
              {copyFields.filter((field) => allowedFields.includes(field.key)).map((field) => (
                <FormField key={field.key} name={field.key} label={pendingFields.includes(field.key) ? `${field.label} (borrador administrativo)` : field.label} hint={pendingFields.includes(field.key) ? "Pendiente de conexión al site. El título público sigue siendo «NO TE QUEDES CON LAS GANAS»." : undefined} value={draft[field.key] ?? ""} type={field.key === "description" ? "textarea" : "text"} maxLength={field.maxLength} wide={field.wide} errors={mutation.errors} onChange={(value) => updateDraft((current) => ({ ...current, [field.key]: value }))} />
              ))}
            </fieldset>
          ) : null}

          {allowedFields.includes("productId") ? <FormField name="productId" label="Producto destacado" value={draft.productId ?? ""} onChange={(value) => updateDraft((current) => ({ ...current, productId: value }))} options={[...(draft.productId ? [] : [{ value: "", label: "Selecciona un producto" }]), ...products.map((product) => ({ value: product.id, label: productOption(product, categories) }))]} hint="El nombre y los datos del producto se toman del catálogo." errors={mutation.errors} /> : null}
          {allowedFields.includes("productId") ? <ProductSummary product={products.find((product) => product.id === draft.productId)} categories={categories} /> : null}

          {allowedFields.includes("primaryCta") ? <CtaEditor title="Botón principal" name="primaryCta" allowNone={role.role !== "Welcome"} value={draft.primaryCta} onChange={(value) => updateDraft((current) => ({ ...current, primaryCta: value }))} products={products} categories={categories} errors={mutation.errors} /> : null}
          {role.role === "Conversion" ? <p className={workspaceStyles.fieldHint}>En pantallas muy estrechas, los botones de WhatsApp y ubicación muestran textos compactos predefinidos. El botón secundario no admite WhatsApp en esta composición.</p> : null}
          {allowedFields.includes("secondaryCta") ? draft.secondaryCta ? <CtaEditor title="Botón secundario" name="secondaryCta" allowNone={role.role !== "Welcome"} allowWhatsApp={role.role !== "Conversion"} value={draft.secondaryCta} onChange={(value) => updateDraft((current) => ({ ...current, secondaryCta: value }))} products={products} categories={categories} errors={mutation.errors} /> : <div className={styles.optionalCta}><p>Esta composición no muestra un segundo botón.</p><button type="button" className={workspaceStyles.secondaryButton} onClick={() => updateDraft((current) => ({ ...current, secondaryCta: { label: "Ver menú", type: "MENU" } }))}>Añadir botón secundario</button></div> : null}

          {role.role === "Welcome" ? <p className={workspaceStyles.fieldHint}>La imagen del producto es un respaldo: el site muestra primero el rotador cuando hay al menos dos productos disponibles.</p> : null}
          {allowedFields.includes("productLayer") && draft.productLayer ? <ImageLayerEditor title="Imagen del producto" layer={draft.productLayer as unknown as Record<string, unknown>} onChange={(value) => updateDraft((current) => ({ ...current, productLayer: value as AdminSliderItemDto["productLayer"] }))} fieldName="productLayer" error={mutation.errors.productLayer} /> : null}
          {allowedFields.includes("rotatorImages") ? <RotatorEditor slide={draft} products={products} categories={categories} onChange={(value) => updateDraft((current) => ({ ...current, rotatorImages: value }))} error={mutation.errors.rotatorImages} /> : null}

          {recoveredConflict ? <p role="status">El servidor cambió mientras editabas. Tu borrador conserva su revisión original. <button type="button" className={workspaceStyles.secondaryButton} onClick={() => void reloadForComparison()}>Comparar con versión actual</button></p> : null}
          <EditorStatus mutation={mutation} recovery={form} comparison={comparison} onCompare={() => void reloadForComparison()} onUseCurrent={useCurrentVersion} onKeepChanges={keepDraftOnCurrentVersion}>
            {mutation.message === "Cambios guardados" ? null : <span>La vista previa no publica los cambios.</span>}
          </EditorStatus>
          <div className={styles.editorActions}>
            <button type="button" className={workspaceStyles.secondaryButton} onClick={() => void runPreview()} disabled={previewing || mutation.saving}>{previewing ? "Preparando vista…" : "Ver borrador"}</button>
            <button type="submit" className={workspaceStyles.primaryButton} disabled={!form.ready || form.invalid || !isDirty || recoveredConflict || mutation.saving || mutation.conflict || mutation.unauthorized}>{mutation.saving ? "Guardando…" : Object.keys(makePatch()).length > 0 && Object.keys(makePatch()).every((field) => pendingFields.includes(field)) ? "Guardar borrador" : "Guardar cambios"}</button>
          </div>
        </form>

        <section className={`${workspaceStyles.panel} ${workspaceStyles.panelPadding} ${styles.previewPanel}`} aria-labelledby="hero-preview-title">
          <div className={workspaceStyles.toolbar}>
            <div><h2 id="hero-preview-title" className={workspaceStyles.panelTitle}>Vista previa administrativa de contenido</h2><p className={workspaceStyles.sectionDescription}>Imágenes, textos, productos y botones de muestra.</p></div>
            <div className={styles.viewportControls} role="group" aria-label="Tamaño de vista previa">
              <button type="button" aria-pressed={viewport === "desktop"} onClick={() => setViewport("desktop")}>Escritorio</button>
              <button type="button" aria-pressed={viewport === "mobile"} onClick={() => setViewport("mobile")}>Móvil</button>
            </div>
          </div>
          <p className={styles.previewState} aria-live="polite">{isDirty ? previewMatchesDraft ? "Vista previa · cambios sin guardar" : "Hay cambios sin previsualizar" : "Composición guardada"}</p>
          {previewError ? <p className={workspaceStyles.fieldError} role="alert">{previewError}</p> : null}
          <div className={`${styles.previewFrame} ${styles[`preview${viewport === "desktop" ? "Desktop" : "Mobile"}`]}`}>
            {previewToken ? <iframe key={previewToken} title={`Vista previa de ${roleLabel} en ${viewport === "desktop" ? "escritorio" : "móvil"}`} className={styles.previewFrameContent} src={`/hero-preview?token=${encodeURIComponent(previewToken)}`} /> : <p className={workspaceStyles.emptyState}>Preparando la composición…</p>}
          </div>
          <p className={styles.previewHint}>No reproduce exactamente la composición pública. Ver borrador y cambiar su tamaño no guardan ni publican.</p>
        </section>
      </div>
      {otherPlacements.length ? <section className={`${workspaceStyles.panel} ${workspaceStyles.panelPadding}`} aria-label="Otras entradas de contenido">
        <h2 className={workspaceStyles.panelTitle}>Otras entradas de contenido</h2>
        <p className={workspaceStyles.fieldHint}>Entradas históricas y otras ubicaciones, conservadas en modo de solo lectura. No forman parte de los cuatro roles editables del Hero.</p>
        {otherPlacements.map((slide) => <div key={slide.id} className={styles.otherPlacement}><ImagePreview src={heroThumbnail(slide)} alt="" compact /><span>{slide.title}</span><AdminStatus tone="neutral">{statusLabel(slide.status)} · solo lectura</AdminStatus></div>)}
      </section> : null}
      {confirmation}
    </div>
  );
}

function CtaEditor({ title, name, value, onChange, products, categories, errors, allowNone = true, allowWhatsApp = true }: { title: string; name: "primaryCta" | "secondaryCta"; value?: SliderCtaDto; onChange: (cta: SliderCtaDto) => void; products: ProductDto[]; categories: CategoryDto[]; errors: Record<string, string>; allowNone?: boolean; allowWhatsApp?: boolean }) {
  const cta = value ?? { label: "Ver menú", type: "MENU" as const };
  const needsTarget = cta.type === "PRODUCT" || cta.type === "CATEGORY" || cta.type === "CUSTOM_PATH";
  const targetOptions = cta.type === "PRODUCT"
    ? products.filter((product) => product.status === "ACTIVE" && product.isAvailable && categories.some((category) => category.id === product.categoryId && category.isActive)).map((product) => ({ value: product.slug, label: product.title }))
    : cta.type === "CATEGORY" ? categories.filter((category) => category.isActive).map((category) => ({ value: category.slug, label: category.name })) : undefined;
  return (
    <fieldset className={workspaceStyles.detailGroup}>
      <legend className={workspaceStyles.srOnly}>{title}</legend>
      <h3>{title}</h3>
      <FormField name={`${name}.label`} label="Texto del botón" value={cta.label} maxLength={60} errors={errors} onChange={(label) => onChange({ ...cta, label })} />
      <FormField name={`${name}.type`} label="Destino" value={cta.type} options={ctaOptions.filter((option) => (allowNone || option.value !== "NONE") && (allowWhatsApp || option.value !== "WHATSAPP"))} errors={errors} onChange={(type) => onChange({ ...cta, type: type as SliderCtaDto["type"], target: undefined })} />
      {needsTarget ? targetOptions ? <FormField name={`${name}.target`} label={cta.type === "PRODUCT" ? "Producto" : "Categoría"} value={cta.target ?? ""} options={[{ value: "", label: "Selecciona un destino" }, ...targetOptions]} errors={errors} onChange={(target) => onChange({ ...cta, target })} /> : <FormField name={`${name}.target`} label="Ruta interna segura" value={cta.target ?? ""} hint="Empieza con una sola barra. No admite dominios externos." maxLength={120} errors={errors} onChange={(target) => onChange({ ...cta, target })} /> : null}
      {errors[name] ? <p className={workspaceStyles.fieldError} role="alert">{errors[name]}</p> : null}
    </fieldset>
  );
}

function ImageLayerEditor({ title, layer, onChange, fieldName, error }: { title: string; layer: Record<string, unknown>; onChange: (layer: Record<string, unknown>) => void; fieldName: string; error?: string }) {
  const fields = Object.keys(layer).filter((key) => sourceKeys.includes(key));
  const primary = primarySource(fields);
  return (
    <fieldset className={workspaceStyles.detailGroup}>
      <legend className={workspaceStyles.srOnly}>{title}</legend>
      <h3>{title}</h3>
      <p className={workspaceStyles.fieldHint}>Elige una imagen existente o una dirección HTTPS compatible. La composición se conserva.</p>
      {primary ? <FormField name={`${fieldName}.${primary}`} label={sourceLabel(primary)} value={String(layer[primary] ?? "")} maxLength={1000} errors={{}} onChange={(value) => onChange({ ...layer, [primary]: value })} /> : null}
      <ResponsiveSourceFields fields={fields.filter((key) => key !== primary)} name={fieldName} record={layer} onChange={(key, value) => onChange({ ...layer, [key]: value })} />
      <FormField name={`${fieldName}.alt`} label="Texto alternativo" value={String(layer.alt ?? "")} maxLength={240} errors={{}} onChange={(value) => onChange({ ...layer, alt: value })} />
      {error ? <p className={workspaceStyles.fieldError} role="alert">{error}</p> : null}
      {primary ? <ImagePreview src={String(layer[primary] ?? "")} alt={String(layer.alt ?? "")} /> : null}
    </fieldset>
  );
}

function RotatorEditor({ slide, products, categories, onChange, error }: { slide: AdminSliderItemDto; products: ProductDto[]; categories: CategoryDto[]; onChange: (items: NonNullable<AdminSliderItemDto["rotatorImages"]>) => void; error?: string }) {
  const images = slide.rotatorImages ?? [];
  return (
    <fieldset className={workspaceStyles.detailGroup}>
      <legend className={workspaceStyles.srOnly}>Productos del rotador</legend>
      <h3>Productos del rotador</h3>
      <p className={workspaceStyles.fieldHint}>Los nombres y precios se toman del producto. Mantén los {images.length} espacios existentes.</p>
      {error ? <p className={workspaceStyles.fieldError} role="alert">{error}</p> : null}
      {images.map((image, index) => {
        const record = image as unknown as Record<string, unknown>;
        const fields = Object.keys(record).filter((key) => sourceKeys.includes(key));
        const primary = primarySource(fields);
        return (
          <div className={styles.rotatorSlot} key={`${slide.id}-rotator-${index}`}>
            <h4>Espacio {index + 1}</h4>
            <FormField name={`rotatorImages.${index}.productId`} label="Producto" value={image.productId ?? ""} options={[{ value: "", label: "Selecciona un producto" }, ...products.map((product) => ({ value: product.id, label: productOption(product, categories) }))]} errors={{}} onChange={(productId) => onChange(updateArrayItem(images, index, { ...image, productId }))} />
            <ProductSummary product={products.find((product) => product.id === image.productId)} categories={categories} />
            <FormField name={`rotatorImages.${index}.alt`} label="Texto alternativo" value={image.alt} maxLength={240} errors={{}} onChange={(alt) => onChange(updateArrayItem(images, index, { ...image, alt }))} />
            {primary ? <FormField name={`rotatorImages.${index}.${primary}`} label={sourceLabel(primary)} value={String(record[primary] ?? "")} maxLength={1000} errors={{}} onChange={(value) => onChange(updateArrayItem(images, index, { ...image, [primary]: value }))} /> : null}
            <ResponsiveSourceFields fields={fields.filter((key) => key !== primary)} name={`rotatorImages.${index}`} record={record} onChange={(key, value) => onChange(updateArrayItem(images, index, { ...image, [key]: value }))} />
            {primary ? <ImagePreview src={String(record[primary] ?? "")} alt={image.alt} /> : null}
          </div>
        );
      })}
    </fieldset>
  );
}

function ResponsiveSourceFields({ fields, name, record, onChange }: { fields: string[]; name: string; record: Record<string, unknown>; onChange: (key: string, value: string) => void }) {
  if (!fields.length) return null;
  return (
    <details className={styles.responsiveSources}>
      <summary>Perfiles de imagen por dispositivo</summary>
      <div>
        {fields.map((key) => <FormField key={key} name={`${name}.${key}`} label={sourceLabel(key)} value={String(record[key] ?? "")} maxLength={1000} errors={{}} onChange={(value) => onChange(key, value)} />)}
      </div>
    </details>
  );
}

function updateArrayItem<T>(items: T[], index: number, value: T): T[] {
  return items.map((item, itemIndex) => itemIndex === index ? value : item);
}

function ProductSummary({ product, categories }: { product?: ProductDto; categories: CategoryDto[] }) {
  if (!product) return null;
  return <div className={styles.productSummary}><ImagePreview src={product.imageUrl} alt={product.imageAlt} compact /><p>{productOption(product, categories)}<small>Datos actuales del catálogo · precio de solo lectura</small></p></div>;
}

function cleanRotatorImages(images: AdminSliderItemDto["rotatorImages"]) {
  const rotatorSourceKeys = new Set(["src", "desktop", "desktopWide", "tabletLandscape", "tabletPortrait", "mobile"]);
  return (images ?? []).map((image) => Object.fromEntries(Object.entries(image).filter(([key]) => rotatorSourceKeys.has(key) || key === "alt" || key === "productId")));
}

function statusLabel(status: string) {
  if (status === "ACTIVE") return "Activo";
  if (status === "DRAFT") return "Borrador";
  return "Inactivo";
}

function sourceLabel(key: string) {
  const labels: Record<string, string> = { desktop: "Imagen escritorio", desktopWide: "Pantalla ancha", tabletLandscape: "Tableta horizontal", tabletPortrait: "Tableta vertical", mobile: "Imagen móvil", desktopUrl: "Imagen escritorio", mobileUrl: "Imagen móvil", src: "Imagen" };
  return labels[key] ?? "Imagen";
}

function primarySource(fields: string[]) {
  return fields.find((key) => key === "desktop")
    ?? fields.find((key) => key === "desktopUrl")
    ?? fields.find((key) => key === "src")
    ?? fields[0];
}

function productOption(product: ProductDto, categories: CategoryDto[]) {
  const category = categories.find((item) => item.id === product.categoryId);
  const unavailable = product.status !== "ACTIVE" || !product.isAvailable || !category?.isActive;
  return `${product.title} · ${product.priceAmount} ${product.priceCurrency}${unavailable ? " · no publicable" : ""}`;
}
