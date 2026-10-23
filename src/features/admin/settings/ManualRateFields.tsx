"use client";

import { useState } from "react";
import type { PriceCurrency } from "@/contracts/api";
import { normalizeManualRate } from "@/features/exchange-rates/manual-rate";
import { convertMoneyCents, formatMoneyCents, parseMoneyCents } from "@/lib/money";
import styles from "../components/AdminWorkspace.module.css";
import local from "./MonetaryForms.module.css";

export type ManualRateDraft = { rate: string; reference: string; note: string };

export function ManualRateFields({ currency, draft, onChange, errors = {} }: {
  currency: PriceCurrency; draft: ManualRateDraft;
  onChange: (draft: ManualRateDraft) => void; errors?: Record<string, string>;
}) {
  const [testAmount, setTestAmount] = useState("24.00");
  const normalized = normalizeManualRate(draft.rate);
  const preview = (cents: number | null) => {
    const converted = normalized && cents !== null ? convertMoneyCents(cents, normalized) : null;
    return converted === null ? "Por confirmar / fuera de rango" : `${formatMoneyCents(converted)} Bs`;
  };
  return <>
    <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
      <label className={styles.field}>Moneda global<input className={styles.control} value={currency} readOnly /></label>
      <label className={styles.field}>Bolívares por 1 {currency}
        <input className={styles.control} type="text" inputMode="decimal" required value={draft.rate}
          aria-invalid={!!errors.rate} aria-describedby="manual-rate-help manual-rate-error"
          onChange={event => onChange({ ...draft, rate: event.target.value })} />
        <span id="manual-rate-help">Escribe 1000,50 sin separador de miles. Máximo seis decimales.</span>
        <span id="manual-rate-error" className={local.error}>{errors.rate}</span>
      </label>
      <label className={styles.field}>Fecha y hora de referencia (Caracas)
        <input className={styles.control} type="datetime-local" required value={draft.reference}
          aria-invalid={!!errors.fetchedAt} aria-describedby="manual-reference-error"
          onChange={event => onChange({ ...draft, reference: event.target.value })} />
        <span id="manual-reference-error" className={local.error}>{errors.fetchedAt}</span>
      </label>
      <label className={styles.field}>Nota (opcional)
        <input className={styles.control} maxLength={240} value={draft.note} aria-invalid={!!errors.note}
          aria-describedby="manual-note-error" onChange={event => onChange({ ...draft, note: event.target.value })} />
        <span id="manual-note-error" className={local.error}>{errors.note}</span>
      </label>
    </div>
    <div className={local.preview} aria-label="Vista previa de conversión">
      <p role="status">Valor normalizado: <strong>{normalized ?? "Tasa inválida"}</strong> Bs por 1 {currency}</p>
      <p>1 {currency} = {preview(100)} · 10 {currency} = {preview(1000)}</p>
      <label className={styles.field}>Importe de prueba en {currency}
        <input className={styles.control} inputMode="decimal" value={testAmount} onChange={event => setTestAmount(event.target.value)} />
      </label>
      <p>Equivalencia de prueba: {preview(parseMoneyCents(testAmount.replace(",", ".")))}</p>
    </div>
  </>;
}
