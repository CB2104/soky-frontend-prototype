"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { ReactNode } from "react";
import { SeigaihaHeader } from "@/components/brand/SeigaihaHeader";
import { WhatsAppSVG } from "@/components/brand/IconsSVG";
import styles from "./CartPage.module.css";

export type CartSummaryViewModel = {subtotal:string;equivalent:string;units:number;rate:string;source:string;warnings:string[];delivery:boolean};
export function CartOrderSummary({summary,status,preview,canSubmit,pending,onSubmit,error,fallbackUrl,onFallback,finalMessage}:{summary:CartSummaryViewModel;status?:ReactNode;preview:string;canSubmit:boolean;pending:boolean;onSubmit:()=>void;error?:string;fallbackUrl?:string;onFallback:()=>void;finalMessage?:string}) {
  const [expanded,setExpanded] = useState(false);
  const [copyStatus,setCopyStatus] = useState("");
  async function copyMessage() {try {await navigator.clipboard.writeText(finalMessage ?? preview);setCopyStatus("Mensaje copiado.");} catch {setCopyStatus("Selecciona y copia el mensaje de la vista previa.");setExpanded(true);}}
  return <aside className={styles.summary} aria-labelledby="cart-summary-title">
    <SeigaihaHeader><p className={styles.overline}>DETALLES DE TU COMPRA</p><h2 id="cart-summary-title">RESUMEN DEL PEDIDO</h2></SeigaihaHeader>
    <div className={styles.summaryBody}>
      {status ? <div className={styles.status} role="status">{status}</div> : null}
      <div className={styles.subtotal}><div><span>Subtotal de productos</span><small>{summary.units} {summary.units === 1 ? "unidad" : "unidades"}</small></div><strong className={summary.subtotal === "Por confirmar" ? styles.pendingValue : undefined}>{summary.subtotal}</strong></div>
      <div className={styles.conversion}><div><span>Equivalente ref. en Bs.</span><strong>{summary.equivalent}</strong></div><p>{summary.rate}<b>{summary.source}</b></p></div>
      {summary.warnings.map(warning=><p key={warning} className={styles.warning}>{warning}</p>)}
      {summary.delivery ? <p className={styles.warning}>Costo de delivery por confirmar por WhatsApp.</p> : null}
      <Button variant="tertiary" type="button" className={styles.previewToggle} aria-expanded={expanded} aria-controls="cart-message-preview" onClick={()=>setExpanded(value=>!value)}>Vista previa del mensaje <span aria-hidden="true">{expanded ? "⌃" : "⌄"}</span></Button>
      {expanded ? <pre id="cart-message-preview" className={styles.preview}>{finalMessage ?? preview}</pre> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {fallbackUrl ? <div className={styles.fallback}><p>Tu solicitud está preparada. Si WhatsApp no abrió, continúa aquí:</p><Button variant="secondary" href={fallbackUrl} target="_blank" rel="noopener noreferrer" onClick={onFallback}>Abrir WhatsApp</Button><Button variant="secondary" type="button" onClick={()=>void copyMessage()}>Copiar mensaje</Button><p role="status">{copyStatus}</p></div> : null}
    </div>
    <div className={styles.summaryFooter}><Button aria-busy={pending} variant="primary" type="button" className={styles.send} disabled={!canSubmit || pending} onClick={onSubmit}><WhatsAppSVG aria-hidden="true" focusable="false"/>{pending ? "Preparando pedido…" : "Enviar pedido por WhatsApp"}</Button><p>Tu pedido queda confirmado cuando el restaurante valida los detalles contigo por WhatsApp.</p></div>
  </aside>;
}
