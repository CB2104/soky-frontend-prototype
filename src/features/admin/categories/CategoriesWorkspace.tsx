"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminCategoryCreateDto, CategoryDto } from "@/contracts/api";
import type { DemoSnapshot } from "@/contracts/demo";
import { adminPath } from "@/lib/env";
import { categoryErrors, safeSlug } from "@/lib/catalog-validation";
import { getDemoSnapshot } from "../demo-client";
import { useAdminMutation, useAdminWorkspace } from "../useAdminWorkspace";
import { useAdminConfirmation, useUnsavedChanges } from "../components/AdminConfirmDialog";
import { comparisonRows, EditorStatus, useRecordDraft, WorkspaceState } from "../components/AdminEditorStatus";
import { AdminPageHeader, AdminTable } from "../components/admin-table";
import { CheckField, FormField, ImagePreview } from "../components/AdminFormFields";
import styles from "../components/AdminWorkspace.module.css";

const groups = [{ value: "FOOD", label: "Comida" }, { value: "COMBO", label: "Combos" }, { value: "DRINK", label: "Bebidas" }, { value: "DESSERT", label: "Postres" }, { value: "OTHER", label: "Otros" }];
const labels = { name: "Nombre", slug: "Dirección web", key: "Clave", group: "Grupo", description: "Descripción", imageUrl: "Imagen", sortOrder: "Orden", isActive: "Activa" };
function editableCategory(category: CategoryDto): AdminCategoryCreateDto {
  const { name, slug, key, group, description, imageUrl, sortOrder, isActive } = category;
  return { name, slug, key, group, description, imageUrl, sortOrder, isActive };
}

export function CategoriesWorkspace() {
  const [editing, setEditing] = useState<string | null>(null);
  const workspace = useAdminWorkspace(editing !== null);
  const { snapshot, setSnapshot } = workspace;
  const [notice, setNotice] = useState("");
  const mutation = useAdminMutation();
  const { confirm, confirmation } = useAdminConfirmation();
  if (!snapshot) return <WorkspaceState {...workspace} retry={() => void workspace.reload()} />;
  const count = (id: string) => snapshot.products.filter(product => product.categoryId === id).length;
  const update = (category: CategoryDto, revision: number) => setSnapshot(previous => previous ? { ...previous, revision, categories: previous.categories.some(row => row.id === category.id) ? previous.categories.map(row => row.id === category.id ? category : row) : [...previous.categories, category], products: previous.products.map(product => product.categoryId === category.id ? { ...product, categorySlug: category.slug } : product) } : previous);
  async function action(category: CategoryDto, remove = false) {
    if (!snapshot) return;
    const total = count(category.id);
    if (!await confirm({ title: `${remove ? "Eliminar" : category.isActive ? "Desactivar" : "Activar"} ${category.name}`, description: remove ? total ? `Esta categoría tiene ${total} productos. El servidor bloqueará el borrado; mueve sus productos antes de eliminarla.` : "Esta categoría está vacía. El borrado es definitivo en la demo." : category.isActive ? `${total} productos dejarán de ser vendibles en menú, búsqueda, destacados, Hero y cotización. Sus estados individuales se conservan.` : "Los productos que sigan publicados y disponibles volverán a ser vendibles.", confirmLabel: remove ? "Eliminar categoría" : category.isActive ? "Desactivar categoría" : "Activar categoría" })) return;
    const result = await mutation.mutate<CategoryDto | { deleted: string }>(`/admin/categories/${encodeURIComponent(category.id)}`, { isActive: !category.isActive, confirmDeactivate: true }, snapshot.revision, remove ? "DELETE" : "PATCH");
    if (result) { if ("deleted" in result.data) setSnapshot(previous => previous ? { ...previous, revision: result.revision, categories: previous.categories.filter(row => row.id !== category.id) } : previous); else update(result.data, result.revision); }
  }
  return <div className={styles.page} onChange={() => setNotice("")}>
    <div className={styles.toolbar}><AdminPageHeader title="Categorías" description="Organiza el catálogo y controla qué grupos se pueden vender." />{editing === null ? <button className={styles.primaryButton} onClick={() => { setNotice(""); mutation.clear(); setEditing("new"); }}>Agregar categoría</button> : null}</div>
    {notice ? <p role="status">{notice}</p> : null}
    {editing !== null ? <CategoryEditor key={editing} category={snapshot.categories.find(row => row.id === editing)} snapshot={snapshot} count={count(editing)} onClose={() => setEditing(null)} onSaved={(category, revision) => { update(category, revision); setNotice("Cambios guardados"); if (editing === "new") setEditing(category.id); }} /> : <>
      <EditorStatus mutation={mutation} onCompare={async () => { if (await workspace.reload()) mutation.clear(); }} />
      <AdminTable caption="Categorías del catálogo" headers={["Nombre", "Productos", "Grupo", "Estado", "Orden", "Acciones"]} rowKeys={snapshot.categories.map(row => row.id)} rows={snapshot.categories.toSorted((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)).map(category => [
        <span key="name" className={styles.productCopy}>{category.name}<span className={styles.productSlug}>{category.slug} · {category.key}</span></span>,
        <Link key="count" className={styles.link} href={`/${adminPath}/products?categoryId=${encodeURIComponent(category.id)}`}>{count(category.id)} productos · revisar</Link>,
        groups.find(group => group.value === category.group)?.label ?? "Sin grupo", category.isActive ? "Activa" : "Inactiva", String(category.sortOrder),
        <div key="actions" className={styles.actions}><button className={styles.secondaryButton} disabled={mutation.saving} onClick={() => { setNotice(""); mutation.clear(); setEditing(category.id); }}>Editar {category.name}</button><button className={styles.secondaryButton} disabled={mutation.saving || mutation.conflict || mutation.unauthorized} onClick={() => void action(category)}>{category.isActive ? "Desactivar" : "Activar"}</button><button className={styles.dangerButton} disabled={mutation.saving || mutation.conflict || mutation.unauthorized} onClick={() => void action(category, true)}>Eliminar</button></div>,
      ])} />
    </>}{confirmation}
  </div>;
}

function CategoryEditor({ category, snapshot, count, onSaved, onClose }: { category?: CategoryDto; snapshot: DemoSnapshot; count: number; onSaved: (category: CategoryDto, revision: number) => void; onClose: () => void }) {
  const initial: AdminCategoryCreateDto = category ? editableCategory(category) : { name: "", slug: "", key: "", description: "", imageUrl: "", group: "FOOD", sortOrder: 0, isActive: true };
  const form = useRecordDraft(`soky-admin-category-${category?.id ?? "new"}`, initial, snapshot.revision);
  const { draft, update } = form;
  const mutation = useAdminMutation();
  const { confirm, confirmation } = useAdminConfirmation();
  const discard = useUnsavedChanges(form.dirty, confirm, form.clearStorage);
  const [latest, setLatest] = useState<{ category: AdminCategoryCreateDto; revision: number } | null>(null);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  async function compare() {
    try { const current = await getDemoSnapshot(); const saved = current.categories.find(row => row.id === category?.id); if (category && !saved) { mutation.setMessage("Esta categoría fue eliminada. Tu borrador sigue aquí; copia sus valores antes de cerrar."); return; } setLatest({ category: saved ? editableCategory(saved) : initial, revision: current.revision }); }
    catch { mutation.setMessage("No pudimos cargar la versión actual. Tu borrador sigue aquí."); }
  }
  return <form className={`${styles.panel} ${styles.panelPadding}`} aria-labelledby="category-editor-title" noValidate onChange={() => { if (mutation.message === "Cambios guardados") mutation.setMessage(""); }} onSubmit={async event => {
    event.preventDefault(); if (mutation.saving) return;
    const validation = categoryErrors(draft);
    for (const field of ["slug", "key"] as const) if (snapshot.categories.some(row => row.id !== category?.id && row[field] === draft[field])) validation[field] = "Este valor ya está en uso.";
    if (draft.imageUrl && brokenSrc === draft.imageUrl) validation.imageUrl = "La imagen no carga. Revisa el enlace.";
    if (Object.keys(validation).length) { mutation.setErrors(validation); mutation.setMessage("Revisa los campos indicados. Tus cambios siguen aquí."); return; }
    const deactivating = category?.isActive && !draft.isActive && count > 0;
    if (deactivating && !await confirm({ title: "Desactivar categoría", description: `${count} productos dejarán de ser vendibles en todas las superficies públicas. Sus estados individuales se conservarán.`, confirmLabel: "Desactivar categoría" })) return;
    const response = await mutation.mutate<CategoryDto>(`/admin/categories${category ? `/${encodeURIComponent(category.id)}` : ""}`, { ...draft, ...(deactivating ? { confirmDeactivate: true } : {}) }, form.revision, category ? "PATCH" : "POST");
    if (response) { form.clearStorage(); form.reset(editableCategory(response.data), response.revision); onSaved(response.data, response.revision); }
  }}>
    <div className={styles.toolbar}><h2 id="category-editor-title" className={styles.sectionTitle}>{category ? `Editar ${category.name}` : "Agregar categoría"}</h2><button type="button" className={styles.secondaryButton} onClick={async () => { if (await discard()) { form.clearStorage(); onClose(); } }}>Cerrar editor</button></div>
    <p className={styles.fieldHint}>{form.dirty ? "Cambios sin guardar" : "Sin cambios pendientes"}. * Campo obligatorio.</p>
    <EditorStatus mutation={mutation} onCompare={compare} comparison={latest ? comparisonRows(latest.category, draft, labels) : null} onUseCurrent={() => { if (latest) { form.reset(latest.category, latest.revision); setLatest(null); mutation.clear(); } }} onKeepChanges={() => { if (latest) { form.rebase(latest.category, latest.revision); setLatest(null); mutation.clear(); } }} />
    <fieldset className={styles.editorFields} disabled={mutation.saving || mutation.unauthorized}>
      <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
        <FormField name="name" label="Nombre" required maxLength={100} value={draft.name} onChange={value => { update("name", value); if (!category && (!draft.slug || draft.slug === safeSlug(draft.name))) update("slug", safeSlug(value)); if (!category && (!draft.key || draft.key === safeSlug(draft.name))) update("key", safeSlug(value)); }} errors={mutation.errors} />
        <FormField name="slug" label="Dirección web" required maxLength={100} value={draft.slug} onChange={value => update("slug", value)} errors={mutation.errors} />
        <FormField name="key" label="Clave" required maxLength={100} value={draft.key} onChange={value => update("key", value)} errors={mutation.errors} hint="Letras minúsculas, números y guiones." />
        <FormField name="group" label="Grupo" value={draft.group ?? "OTHER"} onChange={value => update("group", value as AdminCategoryCreateDto["group"])} options={groups} errors={mutation.errors} />
        <FormField name="sortOrder" label="Orden en el catálogo" type="number" value={Number.isFinite(draft.sortOrder) ? draft.sortOrder : ""} onChange={value => update("sortOrder", value === "" ? NaN : Number(value))} errors={mutation.errors} />
        <FormField name="description" label="Descripción" type="textarea" maxLength={600} value={draft.description ?? ""} onChange={value => update("description", value)} errors={mutation.errors} />
        <FormField name="imageUrl" label="Imagen opcional · ruta o enlace" maxLength={800} value={draft.imageUrl ?? ""} onChange={value => update("imageUrl", value)} errors={mutation.errors} />
        <ImagePreview src={draft.imageUrl ?? ""} alt={`Categoría ${draft.name}`} onBroken={broken => setBrokenSrc(broken ? draft.imageUrl ?? null : null)} />
        <CheckField label="Categoría activa" checked={draft.isActive} onChange={value => update("isActive", value)} error={mutation.errors.isActive} />
      </div>
      <div className={styles.actions}><button type="submit" className={styles.primaryButton} disabled={mutation.conflict || !form.dirty}>{mutation.saving ? "Guardando…" : "Guardar categoría"}</button><button type="button" className={styles.secondaryButton} onClick={async () => { if (await discard()) { form.clearStorage(); onClose(); } }}>Cancelar</button></div>
    </fieldset>{confirmation}
  </form>;
}
