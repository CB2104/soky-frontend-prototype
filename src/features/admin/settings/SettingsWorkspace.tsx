"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { PublicSettingsDto } from "@/contracts/api";
import type { DemoSnapshot } from "@/contracts/demo";
import { settingsErrors, normalizeAmount } from "@/lib/catalog-validation";
import { adminPath } from "@/lib/env";
import { useAdminMutation, useAdminWorkspace } from "../useAdminWorkspace";
import { formatAdminAmount } from "../format";
import { getDemoSnapshot } from "../demo-client";
import { useAdminConfirmation, useUnsavedChanges } from "../components/AdminConfirmDialog";
import { CheckField, FormField, FormSection } from "../components/AdminFormFields";
import { comparisonRows, EditorStatus, useRecordDraft, WorkspaceState } from "../components/AdminEditorStatus";
import { AdminPageHeader } from "../components/admin-table";
import { DemoResetPanel } from "../components/DemoResetPanel";
import { CurrencyMigration } from "./CurrencyMigration";
import styles from "../components/AdminWorkspace.module.css";

const labels = { businessName: "Nombre", slogan: "Eslogan", whatsappPhone: "WhatsApp", instagramUrl: "Instagram", googleMapsUrl: "Google Maps", googleMapsEmbedUrl: "Mapa integrado", address: "Dirección", openingHoursDisplay: "Horarios", pickupEnabled: "Retiro", deliveryEnabled: "Entrega a domicilio", deliveryNotes: "Indicaciones de entrega", minimumOrderAmount: "Pedido mínimo" };
function editableSettings(settings: PublicSettingsDto) {
  const { businessName, slogan, whatsappPhone, instagramUrl, googleMapsUrl, googleMapsEmbedUrl, address, openingHoursDisplay, pickupEnabled, deliveryEnabled, deliveryNotes, minimumOrderAmount } = settings;
  return { businessName, slogan, whatsappPhone, instagramUrl, googleMapsUrl, googleMapsEmbedUrl, address, openingHoursDisplay, pickupEnabled, deliveryEnabled, deliveryNotes, minimumOrderAmount };
}
type EditableSettings = ReturnType<typeof editableSettings>;

export function SettingsWorkspace() {
  const [editing, setEditing] = useState(false);
  const workspace = useAdminWorkspace(editing);
  const { snapshot, setSnapshot } = workspace;
  const [notice, setNotice] = useState("");
  if (!snapshot) return <div className={styles.page}><WorkspaceState {...workspace} retry={() => void workspace.reload()} /><DemoResetPanel /></div>;
  return <div className={styles.page} onChange={() => setNotice("")}>
    <AdminPageHeader title="Configuración" description="Datos de demostración del negocio y sus modalidades de atención." />
    {notice ? <p role="status">{notice}</p> : null}
    {editing ? <SettingsEditor snapshot={snapshot} onSaved={(settings, revision) => { setSnapshot(previous => previous ? { ...previous, settings, revision } : previous); setNotice("Cambios guardados"); }} onClose={() => setEditing(false)} /> : <>
      <section className={`${styles.panel} ${styles.panelPadding}`} aria-labelledby="business-summary">
        <div className={styles.toolbar}><h2 id="business-summary" className={styles.panelTitle}>{snapshot.settings.businessName}</h2><Button size="sm" className={styles.adminPrimaryButton} data-admin-primary="true" onClick={async () => { const current = await workspace.reload(); if (current) { setNotice(""); setEditing(true); } }}>Editar configuración</Button></div>
        <p>{snapshot.settings.slogan}</p>
        <dl className={styles.comparison}><div><dt>Contacto</dt><dd>{snapshot.settings.whatsappPhone}</dd><dd>{snapshot.settings.address}</dd></div><div><dt>Horarios</dt>{snapshot.settings.openingHoursDisplay.map((line, index) => <dd key={index}>{line}</dd>)}</div><div><dt>Modalidades</dt><dd>Retiro: {snapshot.settings.pickupEnabled ? "activo" : "inactivo"} · Entrega a domicilio: {snapshot.settings.deliveryEnabled ? "activa" : "inactiva"}</dd></div><div><dt>Pedido mínimo</dt><dd>{formatAdminAmount(snapshot.settings.minimumOrderAmount ?? "0.00")} {snapshot.settings.defaultCurrency}</dd></div></dl>
      </section>
      <section className={`${styles.panel} ${styles.panelPadding}`} aria-labelledby="settings-currency-title"><h2 id="settings-currency-title" className={styles.panelTitle}>Moneda y tasa</h2><p>Catálogo en {snapshot.settings.defaultCurrency}. Tasa manual de demostración.</p><Link className={styles.link} href={`/${adminPath}/exchange-rates`}>Revisar tasa manual</Link><p className={styles.fieldHint}>No se añaden cargos desde esta configuración. Los campos heredados de comisión se conservan sin ofrecer ajustes sin efecto.</p></section>
      <CurrencyMigration initial={snapshot} onApplied={() => void workspace.reload()} />
      <DemoResetPanel />
    </>}
  </div>;
}

function SettingsEditor({ snapshot, onSaved, onClose }: { snapshot: DemoSnapshot; onSaved: (settings: PublicSettingsDto, revision: number) => void; onClose: () => void }) {
  const form = useRecordDraft<EditableSettings>("soky-admin-settings", editableSettings(snapshot.settings), snapshot.revision);
  const { draft, update } = form;
  const mutation = useAdminMutation();
  const { confirm, confirmation } = useAdminConfirmation();
  const discard = useUnsavedChanges(form.dirty, confirm, form.clearStorage);
  const [latest, setLatest] = useState<DemoSnapshot | null>(null);
  async function compare() {
    try { setLatest(await getDemoSnapshot()); } catch { mutation.setMessage("No pudimos cargar la versión actual. Tus cambios siguen aquí."); }
  }
  return <form className={`${styles.panel} ${styles.panelPadding}`} aria-labelledby="settings-editor-title" noValidate onChange={() => { if (mutation.message === "Cambios guardados") mutation.setMessage(""); }} onSubmit={async event => {
    event.preventDefault(); if (mutation.saving) return;
    const payload = { ...draft, minimumOrderAmount: normalizeAmount(draft.minimumOrderAmount ?? "0") };
    const validation = settingsErrors({ ...(latest?.settings ?? snapshot.settings), ...payload });
    if (Object.keys(validation).length) { mutation.setErrors(validation); mutation.setMessage("Revisa los campos indicados. Tus cambios siguen aquí."); return; }
    const response = await mutation.mutate<PublicSettingsDto>("/admin/settings", payload, form.revision);
    if (response) { form.clearStorage(); form.reset(editableSettings(response.data), response.revision); onSaved(response.data, response.revision); }
  }}>
    <div className={styles.toolbar}><h2 id="settings-editor-title" className={styles.sectionTitle}>Editar configuración</h2><button className={styles.secondaryButton} type="button" onClick={async () => { if (await discard()) { form.clearStorage(); onClose(); } }}>Cerrar editor</button></div>
    <p className={styles.fieldHint}>{form.dirty ? "Cambios sin guardar" : "Sin cambios pendientes"}. * Campo obligatorio.</p>
    <EditorStatus mutation={mutation} recovery={form} onCompare={compare} comparison={latest ? comparisonRows(editableSettings(latest.settings), draft, labels) : null} onUseCurrent={() => { if (latest) { form.reset(editableSettings(latest.settings), latest.revision); mutation.clear(); } }} onKeepChanges={() => { if (latest) { form.rebase(editableSettings(latest.settings), latest.revision); mutation.clear(); } }} />
    <fieldset className={styles.editorFields} disabled={mutation.saving || mutation.unauthorized}>
      <FormSection title="Negocio">
        <FormField name="businessName" label="Nombre del negocio" required value={draft.businessName} maxLength={120} onChange={value => update("businessName", value)} errors={mutation.errors} />
        <FormField name="slogan" label="Slogan" value={draft.slogan ?? ""} maxLength={300} onChange={value => update("slogan", value)} errors={mutation.errors} />
      </FormSection>
      <FormSection title="Contacto y ubicación">
        <FormField name="whatsappPhone" label="WhatsApp" required value={draft.whatsappPhone} onChange={value => update("whatsappPhone", value)} errors={mutation.errors} hint="Número internacional, de 8 a 15 dígitos. Puede comenzar por +." />
        <FormField name="instagramUrl" label="Instagram" value={draft.instagramUrl ?? ""} maxLength={800} onChange={value => update("instagramUrl", value)} errors={mutation.errors} />
        <FormField name="googleMapsUrl" label="Enlace de Google Maps" value={draft.googleMapsUrl ?? ""} maxLength={800} onChange={value => update("googleMapsUrl", value)} errors={mutation.errors} />
        <FormField name="googleMapsEmbedUrl" label="Google Maps · enlace de inserción" value={draft.googleMapsEmbedUrl ?? ""} maxLength={800} onChange={value => update("googleMapsEmbedUrl", value)} errors={mutation.errors} hint="Pega solo el enlace https://www.google.com/maps/embed…, sin código HTML." />
        <FormField name="address" label="Dirección" type="textarea" value={draft.address ?? ""} maxLength={500} onChange={value => update("address", value)} errors={mutation.errors} wide />
      </FormSection>
      <FormSection title="Horarios">
        <FormField name="openingHoursDisplay" label="Horarios · una línea por franja" type="textarea" rows={5} value={draft.openingHoursDisplay.join("\n")} onChange={value => update("openingHoursDisplay", value.split("\n"))} errors={mutation.errors} hint="De 1 a 14 líneas de hasta 240 caracteres. Escribe horarios de demostración." wide required />
      </FormSection>
      <FormSection title="Modalidades y pedido mínimo">
        <CheckField label="Permitir retiro en el local" checked={draft.pickupEnabled} onChange={value => update("pickupEnabled", value)} error={mutation.errors.pickupEnabled} />
        <CheckField label="Permitir delivery" checked={draft.deliveryEnabled} onChange={value => update("deliveryEnabled", value)} error={mutation.errors.deliveryEnabled} />
        <FormField name="deliveryNotes" label="Nota de delivery" type="textarea" value={draft.deliveryNotes ?? ""} maxLength={600} onChange={value => update("deliveryNotes", value)} errors={mutation.errors} />
        <FormField name="minimumOrderAmount" label={`Pedido mínimo en ${(latest?.settings ?? snapshot.settings).defaultCurrency}`} type="decimal" value={draft.minimumOrderAmount ?? "0.00"} onChange={value => update("minimumOrderAmount", value)} errors={mutation.errors} hint="Importe explícito en moneda base; no cambia al editar precios de productos." required />
      </FormSection>
      <div className={styles.actions}><Button size="sm" className={styles.adminPrimaryButton} data-admin-primary="true" type="submit" disabled={mutation.conflict || !form.dirty}>{mutation.saving ? "Guardando…" : "Guardar configuración"}</Button><button className={styles.secondaryButton} type="button" onClick={async () => { if (await discard()) { form.clearStorage(); onClose(); } }}>Cancelar</button></div>
    </fieldset>{confirmation}
  </form>;
}
