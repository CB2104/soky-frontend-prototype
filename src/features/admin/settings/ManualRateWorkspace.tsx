"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoSnapshot } from "@/contracts/demo";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminTable } from "../components/admin-table";
import { caracasInputDate, caracasReferenceUtc, formatRateDate, normalizeManualRate } from "@/features/exchange-rates/manual-rate";
import { isUsableExchangeRate } from "@/features/exchange-rates/rate-validation";
import { ManualRateFields, type ManualRateDraft } from "./ManualRateFields";
import { useMonetaryWorkspace } from "./useMonetaryWorkspace";
import { useAdminConfirmation, useUnsavedChanges } from "../components/AdminConfirmDialog";
import styles from "../components/AdminWorkspace.module.css";
import local from "./MonetaryForms.module.css";

export function ManualRateWorkspace({ initial }: { initial: DemoSnapshot }) {
  const [editing, setEditing] = useState(false);
  const workspace = useMonetaryWorkspace(initial, editing);
  const { snapshot, busy, error, message, fields } = workspace;
  const current = snapshot.currentRate;
  const { confirm, confirmation } = useAdminConfirmation();
  const discard = useUnsavedChanges(editing, confirm);
  const [draft, setDraft] = useState<ManualRateDraft>({ rate: "", reference: "", note: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState<Record<string, string>>({});
  const feedback = useRef<HTMLDivElement>(null);
  const firstInput = useRef<HTMLFieldSetElement>(null);
  useEffect(() => { if (editing) firstInput.current?.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.focus(); }, [editing]);
  useEffect(() => { if (error || message || Object.keys(validation).length) feedback.current?.focus(); }, [error, message, validation]);
  const normalized = normalizeManualRate(draft.rate);
  const change = normalized ? (Number(normalized) / Number(current.rate) - 1) * 100 : null;
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = caracasReferenceUtc(draft.reference);
    const errors: Record<string, string> = {};
    if (!normalized) errors.rate = "Escribe una tasa positiva con hasta seis decimales, sin miles.";
    if (!reference) errors.fetchedAt = "Revisa la fecha de Caracas. Tolerancia futura máxima: cinco minutos.";
    if (!confirmed) errors.confirm = "Confirma el valor normalizado y la fecha antes de guardar.";
    setValidation(errors);
    if (Object.keys(errors).length) return;
    if (await workspace.save("/admin/exchange-rates/manual", { baseCurrency: snapshot.settings.defaultCurrency,
      targetCurrency: "VES", mode: "MANUAL", source: "MANUAL", rate: normalized, fetchedAt: reference, note: draft.note })) {
      setEditing(false); setConfirmed(false);
    }
  }
  return <div className={styles.page}>
    <AdminPageHeader title="Tasas" description="Referencia manual en bolívares por cada unidad de la moneda global. Revisión de demo cada 24 horas." />
    <section className={`${styles.panel} ${styles.panelPadding} ${local.stack}`} aria-labelledby="current-rate-title">
      <div><p className={styles.metricLabel}>Origen manual</p>
        <h2 id="current-rate-title" className={styles.rateValue}>1 {current.baseCurrency} = {formatDisplayRate(current.rate)} Bs</h2>
        <p className={styles.rateMeta}>Referencia: {formatRateDate(current.fetchedAt)} (Caracas)</p>
        <p className={styles.demoStatus}>{isUsableExchangeRate(current, snapshot.settings.defaultCurrency) ? "Vigente para la demo" : "Revisar tasa"}{current.pendingValidation ? " · Valor inicial ficticio pendiente de validación" : ""}</p>
      </div>
      <p>Tasa introducida manualmente para esta demo. No se consulta al proveedor.</p>
      {!editing ? <Button onClick={() => { setDraft({ rate: current.rate, reference: caracasInputDate(), note: "" }); setConfirmed(false); setEditing(true); }}>Actualizar tasa manual</Button> : null}
    </section>
    <div ref={feedback} tabIndex={-1} role={error || Object.keys(validation).length ? "alert" : "status"}>
      {message ? <p>{message}</p> : null}{error ? <p className={local.error}>{error}</p> : null}
      {Object.keys(validation).length ? <p className={local.error}>Revisa los campos indicados. {validation.confirm}</p> : null}
      {error ? <Button variant="secondary" disabled={busy} onClick={() => { setConfirmed(false); void workspace.reload(); }}>Cargar versión actual conservando borrador</Button> : null}
    </div>
    {editing ? <form className={`${styles.panel} ${styles.panelPadding} ${local.stack}`} onSubmit={save} noValidate>
      <h2 className={styles.panelTitle}>Actualizar tasa manual</h2>
      <fieldset disabled={busy} className={local.fieldset} ref={firstInput}>
        <legend className={styles.srOnly}>Valor y referencia manual</legend>
        <ManualRateFields currency={snapshot.settings.defaultCurrency} draft={draft} errors={{ ...fields, ...validation }} onChange={value => { setDraft(value); setConfirmed(false); setValidation({}); }} />
        <div className={local.notice}>
          <p>Anterior: {formatDisplayRate(current.rate)} → Nueva: {normalized ? formatDisplayRate(normalized) : "Por revisar"} Bs por 1 {snapshot.settings.defaultCurrency}.</p>
          {change !== null ? <p>Diferencia: {new Intl.NumberFormat("es-VE", { maximumFractionDigits: 4, signDisplay: "always" }).format(change)} %. Verifica especialmente el separador decimal.</p> : null}
          <p>Guardar el mismo importe con otra referencia crea una nueva entrada de historial.</p>
        </div>
        <label className={local.check}><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />He revisado el valor normalizado, la diferencia y la fecha de referencia.</label>
        <div className={local.actions}><Button type="submit" aria-busy={busy}>{busy ? "Guardando…" : "Guardar tasa"}</Button>
          <Button variant="secondary" onClick={async () => { if (await discard()) { setEditing(false); setValidation({}); } }}>Cancelar</Button></div>
      </fieldset>
    </form> : null}
    <section className={local.stack} aria-labelledby="history-title"><h2 id="history-title" className={styles.sectionTitle}>Historial de guardados</h2>
      <AdminTable caption="Últimas tasas manuales guardadas" headers={["Moneda / origen", "Anterior → nueva (Bs)", "Referencia (Caracas)", "Guardado (Caracas)", "Nota"]}
        rowKeys={snapshot.rateHistory.slice(0, 20).map(rate => rate.id)}
        rows={snapshot.rateHistory.slice(0, 20).map(rate => [ `${rate.baseCurrency} → Bs · Manual`, `${rate.previousRate ? formatDisplayRate(rate.previousRate) : "—"} (${rate.previousBaseCurrency ?? rate.baseCurrency}) → ${formatDisplayRate(rate.rate)} (${rate.baseCurrency})`, formatRateDate(rate.fetchedAt), formatRateDate(rate.recordedAt), rate.note || "—" ])}
        emptyMessage="Todavía no hay tasas guardadas. El valor inicial ficticio no es una entrada de historial." />
    </section>
    {confirmation}
  </div>;
}

function formatDisplayRate(rate: string) {
  const value = Number(rate);
  if (!Number.isFinite(value)) return rate.replace(".", ",");
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}
