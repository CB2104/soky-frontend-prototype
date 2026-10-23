"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoSnapshot } from "@/contracts/demo";
import type { PriceCurrency } from "@/contracts/api";
import { Button } from "@/components/ui/button";
import { caracasInputDate, caracasReferenceUtc, normalizeManualRate } from "@/features/exchange-rates/manual-rate";
import { parseMoneyCents } from "@/lib/money";
import { ManualRateFields, type ManualRateDraft } from "./ManualRateFields";
import { useMonetaryWorkspace } from "./useMonetaryWorkspace";
import { formatAdminAmount } from "../format";
import { useAdminConfirmation, useUnsavedChanges } from "../components/AdminConfirmDialog";
import styles from "../components/AdminWorkspace.module.css";
import local from "./MonetaryForms.module.css";

export function CurrencyMigration({ initial, onApplied }: { initial: DemoSnapshot; onApplied?: () => void }) {
  const [active, setActive] = useState(false);
  const workspace = useMonetaryWorkspace(initial, active);
  const { snapshot, busy, message, error, fields } = workspace;
  const { confirm, confirmation } = useAdminConfirmation();
  const discard = useUnsavedChanges(active, confirm);
  const [currency, setCurrency] = useState<PriceCurrency>(initial.settings.defaultCurrency === "EUR" ? "USD" : "EUR");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [minimum, setMinimum] = useState("");
  const [fee, setFee] = useState("");
  const [draft, setDraft] = useState<ManualRateDraft>({ rate: "", reference: "", note: "" });
  const [review, setReview] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState("");
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => { if (validation || error || message) feedback.current?.focus(); }, [validation, error, message]);
  const reviewedCount = snapshot.products.filter(product => prices[product.id] !== undefined && parseMoneyCents(prices[product.id]) !== null).length;
  function startReview() {
    if (currency === snapshot.settings.defaultCurrency) { setValidation("La moneda global ya cambió. Cancela este borrador y prepara el cambio desde la versión actual."); return; }
    if (reviewedCount !== snapshot.products.length || parseMoneyCents(minimum) === null || parseMoneyCents(fee) === null
      || !normalizeManualRate(draft.rate) || !caracasReferenceUtc(draft.reference)) {
      setValidation("Revisa todos los productos, el mínimo, el cargo y la tasa con su fecha. No se ha aplicado ningún cambio."); return;
    }
    setValidation(""); setReview(true); setConfirmed(false);
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!review || !confirmed) { setValidation("Revisa el resumen y confirma la aplicación completa."); return; }
    if (await workspace.save("/admin/currency-change", { currency, prices, minimumOrderAmount: minimum,
      serviceFeeAmount: fee, rate: normalizeManualRate(draft.rate), fetchedAt: caracasReferenceUtc(draft.reference), note: draft.note, confirmed })) {
      setActive(false); setReview(false); setConfirmed(false); setPrices({});
      onApplied?.();
    }
  }
  return <section className={`${styles.panel} ${styles.panelPadding} ${local.stack}`} aria-labelledby="currency-migration-title">
    <h2 id="currency-migration-title" className={styles.panelTitle}>Cambiar moneda global</h2>
    <p>Moneda actual: <strong>{snapshot.settings.defaultCurrency}</strong>. Cambiarla exige revisar todos los precios. No se convierten automáticamente EUR y USD.</p>
    <div ref={feedback} tabIndex={-1} role={error || validation ? "alert" : "status"}>
      {message ? <p>{message}</p> : null}{error || validation ? <p className={local.error}>{error || validation}</p> : null}
      {error ? <Button variant="secondary" disabled={busy} onClick={() => { setReview(false); setConfirmed(false); void workspace.reload(); }}>Cargar versión actual conservando borrador</Button> : null}
    </div>
    {!active ? <Button variant="secondary" onClick={() => { setCurrency(snapshot.settings.defaultCurrency === "EUR" ? "USD" : "EUR"); setDraft({ rate: "", reference: caracasInputDate(), note: "" }); setActive(true); }}>Preparar cambio de moneda</Button> :
      <form onSubmit={save} className={local.stack} noValidate>
        <fieldset disabled={busy} className={local.fieldset}>
          <legend className={styles.srOnly}>Revisión completa de moneda</legend>
          {!review ? <>
            <label className={styles.field}>Nueva moneda<select className={styles.control} value={currency} onChange={event => { setCurrency(event.target.value as PriceCurrency); setPrices({}); setMinimum(""); setFee(""); }}>
              <option value={snapshot.settings.defaultCurrency === "EUR" ? "USD" : "EUR"}>{snapshot.settings.defaultCurrency === "EUR" ? "USD" : "EUR"}</option>
            </select></label>
            <p>{reviewedCount} de {snapshot.products.length} productos revisados, incluidos borradores y archivados. Introduce un nuevo importe o conserva cada cifra explícitamente.</p>
            <ul className={local.prices}>{snapshot.products.map(product => <li key={product.id} className={local.price}>
              <div><strong>{product.title}</strong><small>{productStatusLabel(product.status)} · Actual: {formatAdminAmount(product.priceAmount)} {product.priceCurrency}</small></div>
              <label className={styles.field}>Nuevo importe en {currency}<input className={styles.control} aria-label={`Nuevo importe de ${product.title} en ${currency}`} inputMode="decimal" value={prices[product.id] ?? ""} onChange={event => setPrices(current => ({ ...current, [product.id]: event.target.value.replace(",", ".") }))} /></label>
              <Button variant="tertiary" onClick={() => setPrices(current => ({ ...current, [product.id]: product.priceAmount }))}>Conservar {formatAdminAmount(product.priceAmount)}</Button>
            </li>)}</ul>
            <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
              <label className={styles.field}>Mínimo de pedido en {currency} (actual: {snapshot.settings.minimumOrderAmount ?? "0.00"} {snapshot.settings.defaultCurrency})<input className={styles.control} inputMode="decimal" value={minimum} onChange={event => setMinimum(event.target.value.replace(",", "."))} /></label>
              <label className={styles.field}>Cargo configurado en {currency} ({snapshot.settings.serviceFeeEnabled ? "activo" : "inactivo"}; actual: {snapshot.settings.serviceFeeAmount ?? "0.00"})<input className={styles.control} inputMode="decimal" value={fee} onChange={event => setFee(event.target.value.replace(",", "."))} /></label>
            </div>
            <ManualRateFields currency={currency} draft={draft} onChange={setDraft} errors={fields} />
            <Button onClick={startReview}>Revisar cambio completo</Button>
          </> : <>
            <h3>Resumen: {snapshot.settings.defaultCurrency} → {currency}</h3>
            <ul className={local.summary} aria-label="Precios revisados">{snapshot.products.map(product => <li key={product.id}>{product.title}: {formatAdminAmount(product.priceAmount)} {product.priceCurrency} → {formatAdminAmount(prices[product.id])} {currency}</li>)}</ul>
            <p>Mínimo: {minimum} {currency} · Cargo: {fee} {currency} · 1 {currency} = {normalizeManualRate(draft.rate)} Bs · Referencia Caracas: {draft.reference.replace("T", " ")}</p>
            <p className={local.notice}>Se aplicarán catálogo, configuración, tasa e historial juntos. Las intenciones históricas conservan su moneda y tasa originales.</p>
            <label className={local.check}><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />Confirmo todos los importes y la tasa de la nueva moneda.</label>
            <div className={local.actions}><Button type="submit" disabled={!confirmed} aria-busy={busy}>{busy ? "Aplicando…" : "Aplicar cambio completo"}</Button><Button variant="secondary" onClick={() => { setReview(false); setConfirmed(false); }}>Volver a revisar</Button></div>
          </>}
          <Button variant="tertiary" onClick={async () => { if (await discard()) { setActive(false); setPrices({}); setValidation(""); } }}>Cancelar cambio</Button>
        </fieldset>
      </form>}
    {confirmation}
  </section>;
}

function productStatusLabel(status: DemoSnapshot["products"][number]["status"]) {
  if (status === "ACTIVE") return "Publicado";
  if (status === "ARCHIVED") return "Archivado";
  return "Borrador";
}
