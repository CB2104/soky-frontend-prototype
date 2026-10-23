"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAdminMutation } from "../useAdminWorkspace";
import { adminPath } from "@/lib/env";
import styles from "./AdminWorkspace.module.css";

export function useRecordDraft<T extends object>(key: string, initial: T, initialRevision: number) {
  const [state, setState] = useState(() => {
    const fallback = { draft: initial, baseline: initial, revision: initialRevision };
    try { const saved = sessionStorage.getItem(key); if (saved) { const parsed = JSON.parse(saved); if (parsed.draft && parsed.baseline && Number.isSafeInteger(parsed.revision)) return parsed as typeof fallback; } } catch { /* Storage is optional. */ }
    return fallback;
  });
  const dirty = JSON.stringify(state.draft) !== JSON.stringify(state.baseline);
  useEffect(() => {
    try { if (dirty) sessionStorage.setItem(key, JSON.stringify(state)); else sessionStorage.removeItem(key); } catch { /* In-memory draft remains available. */ }
  }, [dirty, key, state]);
  const update = <K extends keyof T>(field: K, value: T[K]) => setState(previous => ({ ...previous, draft: { ...previous.draft, [field]: value } }));
  const reset = (record: T, revision: number) => setState({ draft: record, baseline: record, revision });
  const rebase = (latest: T, revision: number) => setState(previous => ({ baseline: latest, revision, draft: { ...latest, ...Object.fromEntries(Object.entries(previous.draft).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(previous.baseline[key as keyof T]))) } }));
  const clearStorage = () => { try { sessionStorage.removeItem(key); } catch { /* Optional storage. */ } };
  return { ...state, dirty, update, reset, rebase, clearStorage };
}

export function EditorStatus({ mutation, onCompare, comparison, onUseCurrent, onKeepChanges, children }: {
  mutation: ReturnType<typeof useAdminMutation>; onCompare?: () => void; comparison?: { label: string; current: string; draft: string }[] | null; onUseCurrent?: () => void; onKeepChanges?: () => void; children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (mutation.message && mutation.message !== "Cambios guardados") ref.current?.focus(); }, [mutation.message, mutation.errors]);
  if (!mutation.message && !Object.keys(mutation.errors).length) return null;
  return <div ref={ref} tabIndex={-1} className={styles.formNotice} role="status" aria-live="polite">
    <div className={styles.statusContent}>
      <p>{mutation.message || "Revisa los campos indicados. Tus cambios siguen aquí."}</p>
      {Object.keys(mutation.errors).length ? <p>Hay {Object.keys(mutation.errors).length} campos por revisar.</p> : null}
      {mutation.unauthorized ? <p>Tu borrador se conserva en esta pestaña. <Link data-admin-preserve-draft className={styles.link} href={`/${adminPath}/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}>Volver a entrar</Link></p> : null}
      {mutation.conflict && onCompare ? <button className={styles.secondaryButton} type="button" onClick={onCompare}>Comparar con versión actual</button> : null}
      {comparison ? <div>
        <p>Versión guardada y borrador. Revisa las diferencias antes de continuar.</p>
        <dl className={styles.comparison}>{comparison.length ? comparison.map(row => <div key={row.label}><dt>{row.label}</dt><dd>Actual: {row.current || "Vacío"}</dd><dd>Tu borrador: {row.draft || "Vacío"}</dd></div>) : <p>Los campos editables coinciden; cambió otra parte de la demo.</p>}</dl>
        <div className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={onUseCurrent}>Usar versión actual</button><button type="button" className={styles.secondaryButton} onClick={onKeepChanges}>Conservar mis cambios sobre esta versión</button></div>
      </div> : null}
      {children}
    </div>
  </div>;
}

export function comparisonRows(current: object, draft: object, labels: Record<string, string>) {
  const describe = (value: unknown): string => typeof value === "boolean" ? value ? "Sí" : "No" : Array.isArray(value) ? value.map(describe).join(" · ") : value && typeof value === "object" ? Object.values(value).map(describe).join(" / ") : String(value ?? "");
  return Object.entries(labels).filter(([key]) => JSON.stringify(current[key as keyof typeof current]) !== JSON.stringify(draft[key as keyof typeof draft])).map(([key, label]) => ({ label, current: describe(current[key as keyof typeof current]), draft: describe(draft[key as keyof typeof draft]) }));
}

export function WorkspaceState({ loading, error, unauthorized, retry }: { loading: boolean; error: string; unauthorized: boolean; retry: () => void }) {
  return <div className={styles.panelPadding} role="status">{loading ? "Cargando datos de la demo…" : <><p>{error}</p>{unauthorized ? <Link className={styles.link} href={`/${adminPath}/login?next=${encodeURIComponent(window.location.pathname)}`}>Entrar a la demo</Link> : <button className={styles.secondaryButton} onClick={retry}>Reintentar</button>}</>}</div>;
}
