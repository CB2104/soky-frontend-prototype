"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProductDto } from "@/contracts/api";
import { adminPath } from "@/lib/env";
import { formatAdminAmount } from "../format";
import { useAdminMutation, useAdminWorkspace } from "../useAdminWorkspace";
import { useAdminConfirmation } from "../components/AdminConfirmDialog";
import { EditorStatus, WorkspaceState } from "../components/AdminEditorStatus";
import { AdminPageHeader, AdminTable } from "../components/admin-table";
import { FormField, ImagePreview } from "../components/AdminFormFields";
import { ProductEditor } from "./ProductEditor";
import styles from "../components/AdminWorkspace.module.css";

export function ProductsWorkspace() {
  const [editing, setEditing] = useState<string | null>(null);
  const workspace = useAdminWorkspace(editing !== null);
  const { snapshot, setSnapshot } = workspace;
  const mutation = useAdminMutation();
  const { confirm, confirmation } = useAdminConfirmation();
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState<URLSearchParams>(() => new URLSearchParams(typeof window === "undefined" ? "" : window.location.search));
  useEffect(() => { const sync = () => setQuery(new URLSearchParams(window.location.search)); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, []);
  function filter(key: string, value: string) {
    const next = new URLSearchParams(query);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page");
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${next.size ? `?${next}` : ""}`);
    window.dispatchEvent(new Event("soky-admin-query")); setQuery(next);
  }
  function clearFilters() {
    setQuery(new URLSearchParams()); window.history.replaceState(window.history.state, "", window.location.pathname); window.dispatchEvent(new Event("soky-admin-query"));
  }
  if (!snapshot) return <WorkspaceState {...workspace} retry={() => void workspace.reload()} />;
  const categories = new Map(snapshot.categories.map(category => [category.id, category]));
  const search = (query.get("search") ?? "").toLocaleLowerCase("es");
  const rows = snapshot.products.filter(product => `${product.title} ${product.slug}`.toLocaleLowerCase("es").includes(search) && ["categoryId", "status", "isAvailable", "featured"].every(key => !query.get(key) || String(product[key as keyof ProductDto]) === query.get(key)));
  const sort = query.get("sort");
  rows.sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title, "es") : sort === "updatedAt" ? (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "") : a.sortOrder - b.sortOrder) || a.id.localeCompare(b.id));
  const pageCount = Math.max(1, Math.ceil(rows.length / 20));
  const requestedPage = Number(query.get("page") ?? 1);
  const page = Math.min(pageCount, Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1));
  const visible = rows.slice((page - 1) * 20, page * 20);
  const updateSnapshot = (product: ProductDto, revision: number) => setSnapshot(previous => previous ? { ...previous, revision, products: previous.products.some(row => row.id === product.id) ? previous.products.map(row => row.id === product.id ? product : row) : [...previous.products, product] } : previous);
  async function action(product: ProductDto, kind: "archive" | "availability" | "delete") {
    if (!snapshot) return;
    if (kind !== "availability" && !await confirm({ title: kind === "delete" ? `Eliminar ${product.title}` : product.status === "ARCHIVED" ? `Reactivar ${product.title}` : `Archivar ${product.title}`, description: kind === "delete" ? "El borrado es definitivo en esta demo. Las intenciones históricas conservan su información. Si el Hero lo usa, deberás corregir sus referencias primero." : product.status === "ARCHIVED" ? "Volverá a publicarse si pertenece a una categoría activa. Su disponibilidad se conserva." : "Dejará de venderse. Los carritos existentes mostrarán que el producto ya no está disponible.", confirmLabel: kind === "delete" ? "Eliminar producto" : product.status === "ARCHIVED" ? "Reactivar" : "Archivar" })) return;
    const result = await mutation.mutate<ProductDto | { deleted: string }>(`/admin/products/${encodeURIComponent(product.id)}`, kind === "availability" ? { isAvailable: !product.isAvailable } : { status: product.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED" }, snapshot.revision, kind === "delete" ? "DELETE" : "PATCH");
    if (result) {
      if ("deleted" in result.data) setSnapshot(previous => previous ? { ...previous, revision: result.revision, products: previous.products.filter(row => row.id !== product.id) } : previous);
      else updateSnapshot(result.data, result.revision);
    }
  }
  return <div className={styles.page} onChange={() => setNotice("")}>
    <div className={styles.toolbar}><AdminPageHeader title="Productos" description={`${snapshot.products.length} productos en el catálogo de demostración.`} />{editing === null ? <button className={styles.primaryButton} onClick={() => { mutation.clear(); setEditing("new"); }}>Agregar producto</button> : null}</div>
    {notice ? <p role="status">{notice}</p> : null}
    {editing !== null ? <ProductEditor key={editing} product={snapshot.products.find(product => product.id === editing)} snapshot={snapshot} onSaved={(product, revision) => { updateSnapshot(product, revision); setNotice("Cambios guardados"); if (editing === "new") setEditing(product.id); }} onClose={() => setEditing(null)} /> : <>
      <EditorStatus mutation={mutation} onCompare={async () => { if (await workspace.reload()) mutation.clear(); }}><Link className={styles.link} href={`/${adminPath}/sliders`}>Revisar referencias del Hero</Link></EditorStatus>
      {workspace.error ? <p role="alert">{workspace.error}</p> : null}
      <div className={styles.filters} aria-label="Filtros del catálogo">
        <FormField name="search" label="Buscar nombre o dirección web" value={query.get("search") ?? ""} onChange={value => filter("search", value)} />
        <FormField name="categoryId" label="Filtrar categoría" value={query.get("categoryId") ?? ""} onChange={value => filter("categoryId", value)} options={[{ value: "", label: "Todas las categorías" }, ...snapshot.categories.map(category => ({ value: category.id, label: `${category.name}${category.isActive ? "" : " · inactiva"}` }))]} />
        <FormField name="status" label="Filtrar estado" value={query.get("status") ?? ""} onChange={value => filter("status", value)} options={[{ value: "", label: "Todos los estados" }, { value: "ACTIVE", label: "Publicado" }, { value: "DRAFT", label: "Borrador" }, { value: "ARCHIVED", label: "Archivado" }]} />
        <FormField name="isAvailable" label="Filtrar disponibilidad" value={query.get("isAvailable") ?? ""} onChange={value => filter("isAvailable", value)} options={[{ value: "", label: "Cualquier disponibilidad" }, { value: "true", label: "Disponible" }, { value: "false", label: "Agotado" }]} />
        <FormField name="featured" label="Filtrar destacado" value={query.get("featured") ?? ""} onChange={value => filter("featured", value)} options={[{ value: "", label: "Todos" }, { value: "true", label: "Destacados" }, { value: "false", label: "Sin destacar" }]} />
        <FormField name="sort" label="Ordenar productos" value={query.get("sort") ?? ""} onChange={value => filter("sort", value)} options={[{ value: "", label: "Orden de catálogo" }, { value: "title", label: "Nombre" }, { value: "updatedAt", label: "Última actualización" }]} />
        <button className={styles.secondaryButton} onClick={clearFilters}>Limpiar filtros</button>
      </div>
      {query.get("categoryId") && !categories.has(query.get("categoryId")!) ? <p role="status">Esta categoría ya no existe. <button className={styles.secondaryButton} onClick={() => filter("categoryId", "")}>Ver todas las categorías</button></p> : null}
      <p className={styles.pageDescription} role="status">{rows.length} resultados · página {page} de {pageCount}</p>
      <AdminTable caption="Productos del catálogo" headers={["Producto", "Categoría", "Estado", "Disponibilidad", "Precio", "Acciones"]} rowKeys={visible.map(product => product.id)} emptyMessage="No hay productos con estos filtros. Prueba a limpiar los filtros o agrega un producto." rows={visible.map(product => [
        <div key="product" className={styles.productCell}><ImagePreview src={product.imageUrl} alt={product.imageAlt} compact /><span className={styles.productCopy}><span className={styles.productName}>{product.title}</span><span className={styles.productSlug}>{product.slug}</span></span></div>,
        `${categories.get(product.categoryId)?.name ?? "Sin categoría"}${categories.get(product.categoryId)?.isActive === false ? " · inactiva" : ""}`,
        product.status === "ACTIVE" ? "Publicado" : product.status === "ARCHIVED" ? "Archivado" : "Borrador",
        product.isAvailable ? "Disponible" : "Agotado",
        <span key="price" className={styles.numericCell}>{formatAdminAmount(product.priceAmount)} {product.priceCurrency}</span>,
        <div key="actions" className={styles.rowActions}><button className={styles.secondaryButton} aria-label={`Editar ${product.title}`} disabled={mutation.saving} onClick={() => { mutation.clear(); setEditing(product.id); }}>Editar</button><button className={styles.secondaryButton} disabled={mutation.saving || mutation.conflict || mutation.unauthorized} onClick={() => void action(product, "availability")}>{product.isAvailable ? "Marcar agotado" : "Marcar disponible"}</button><button className={styles.secondaryButton} disabled={mutation.saving || mutation.conflict || mutation.unauthorized} onClick={() => void action(product, "archive")}>{product.status === "ARCHIVED" ? "Reactivar" : "Archivar"}</button><button className={styles.dangerButton} disabled={mutation.saving || mutation.conflict || mutation.unauthorized} onClick={() => void action(product, "delete")}>Eliminar</button></div>,
      ])} />
      <nav className={styles.pagination} aria-label="Paginación del catálogo"><button className={styles.secondaryButton} disabled={page <= 1} onClick={() => filter("page", String(page - 1))}>Anterior</button><span>Página {page} de {pageCount}</span><button className={styles.secondaryButton} disabled={page >= pageCount} onClick={() => filter("page", String(page + 1))}>Siguiente</button></nav>
    </>}
    {confirmation}
  </div>;
}
