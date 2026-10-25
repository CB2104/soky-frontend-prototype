"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAdminMutation } from "../useAdminWorkspace";
import { adminPath } from "@/lib/env";
import styles from "./AdminWorkspace.module.css";

function matchesRecord(value: unknown, sample: unknown): boolean {
  if (sample === undefined || sample === null) return true;
  if (Array.isArray(sample)) return Array.isArray(value) && value.every(item => !sample.length || matchesRecord(item, sample[0]));
  if (typeof sample === "object") return !!value && typeof value === "object" && !Array.isArray(value) && Object.entries(sample).every(([field, item]) => matchesRecord((value as Record<string, unknown>)[field], item));
  return typeof value === typeof sample;
}

export function useRecordDraft<T extends object>(key: string, initial: T, initialRevision: number, decode?: (value: unknown) => T | null) {
  const [state, setState] = useState({ draft: initial, baseline: initial, revision: initialRevision });
  const [ready, setReady] = useState(false);
  const [storage, setStorage] = useState<"pending" | "saved" | "unavailable" | "clean">("pending");
  const [invalid, setInvalid] = useState(false);
  const initialRef = useRef({ initial, initialRevision, decode });
  const discarded = useRef(false);
  // The first client render must match SSR. Never write before the read finishes.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = sessionStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new SyntaxError("Invalid draft envelope");
          const read = initialRef.current.decode ?? ((value: unknown) => matchesRecord(value, initialRef.current.initial) ? value as T : null);
          const draft = read(parsed.draft), baseline = read(parsed.baseline);
          const legacy = !initialRef.current.decode && parsed.version === undefined && parsed.editor === undefined;
          if ((!legacy && (parsed.version !== 1 || parsed.editor !== key)) || !draft || !baseline || !Number.isSafeInteger(parsed.revision) || parsed.revision < 1) setInvalid(true);
          else setState({ draft, baseline, revision: parsed.revision });
        }
      } catch (error) { if (error instanceof SyntaxError) setInvalid(true); else setStorage("unavailable"); }
      setReady(true);
    });
    return () => { active = false; };
  }, [key]);
  const dirty = JSON.stringify(state.draft) !== JSON.stringify(state.baseline);
  useEffect(() => {
    if (!ready || discarded.current || invalid) return;
    let status: typeof storage = "clean";
    try {
      if (dirty) {
        const value = JSON.stringify({ version: 1, editor: key, ...state });
        sessionStorage.setItem(key, value);
        if (sessionStorage.getItem(key) !== value) throw new Error("Draft write not verified");
        status = "saved";
      } else sessionStorage.removeItem(key);
    } catch { status = "unavailable"; }
    queueMicrotask(() => setStorage(status));
  }, [dirty, key, state, ready, invalid]);
  const update = <K extends keyof T>(field: K, value: T[K]) => setState(previous => ({ ...previous, draft: { ...previous.draft, [field]: value } }));
  const reset = (record: T, revision: number) => { discarded.current = false; setInvalid(false); setState({ draft: record, baseline: record, revision }); };
  const rebase = (latest: T, revision: number) => setState(previous => ({ baseline: latest, revision, draft: { ...latest, ...Object.fromEntries(Object.entries(previous.draft).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(previous.baseline[key as keyof T]))) } }));
  const clearStorage = useCallback(() => { discarded.current = true; setState(previous => ({ ...previous, draft: previous.baseline })); try { sessionStorage.removeItem(key); } catch { /* The in-memory draft remains until navigation. */ } }, [key]);
  const exportDraft = () => {
    let content = JSON.stringify({ version: 1, editor: key, ...state }, null, 2);
    try { if (invalid) content = sessionStorage.getItem(key) ?? content; } catch { /* Export the in-memory draft. */ }
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${key}.json`; anchor.click(); URL.revokeObjectURL(url);
  };
  const discardInvalid = () => { clearStorage(); reset(initialRef.current.initial, initialRef.current.initialRevision); };
  return { ...state, dirty, update, reset, rebase, clearStorage, ready, storage, invalid, exportDraft, discardInvalid };
}

export function EditorStatus({ mutation, recovery, onCompare, comparison, onUseCurrent, onKeepChanges, children }: {
  mutation: ReturnType<typeof useAdminMutation>; recovery?: { storage: string; dirty?: boolean; invalid?: boolean; exportDraft: () => void; discardInvalid?: () => void }; onCompare?: () => void; comparison?: { label: string; current: string; draft: string }[] | null; onUseCurrent?: () => void; onKeepChanges?: () => void; children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (mutation.message && mutation.message !== "Cambios guardados") ref.current?.focus(); }, [mutation.message, mutation.errors]);
  const storageWarning = recovery?.dirty && recovery.storage === "unavailable";
  if (!mutation.message && !Object.keys(mutation.errors).length && !comparison && !recovery?.invalid && !storageWarning) return null;
  return <div ref={ref} tabIndex={-1} className={styles.formNotice} role="status" aria-live="polite">
    <div className={styles.statusContent}>
      {mutation.message || Object.keys(mutation.errors).length ? <p>{mutation.message || "Revisa los campos indicados. Tus cambios siguen aquí."}</p> : null}
      {recovery?.invalid ? <div><p>El borrador local es inválido o incompatible. No se ha aplicado. Descárgalo antes de descartarlo si necesitas revisarlo.</p><button type="button" className={styles.secondaryButton} onClick={recovery.exportDraft}>Descargar borrador</button><button type="button" className={styles.secondaryButton} onClick={recovery.discardInvalid}>Descartar datos locales y usar versión actual</button></div> : null}
      {storageWarning ? <p>El almacenamiento de esta pestaña no está disponible. La edición sigue en memoria; la recuperación después de salir no está garantizada. <button type="button" className={styles.secondaryButton} onClick={recovery.exportDraft}>Descargar borrador</button></p> : null}
      {Object.keys(mutation.errors).length ? <p>Hay {Object.keys(mutation.errors).length} campos por revisar.</p> : null}
      {mutation.unauthorized ? <p>{recovery?.storage === "saved" ? "Tu borrador se conserva en esta pestaña." : "La edición sigue en memoria. No se pudo comprobar la recuperación al salir. Descarga el borrador antes de abandonar el editor."} {recovery ? <button type="button" className={styles.secondaryButton} onClick={recovery.exportDraft}>Descargar borrador</button> : null} <Link data-admin-preserve-draft={recovery?.storage === "saved" ? "true" : undefined} className={styles.link} href={`/${adminPath}/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}>Volver a entrar</Link></p> : null}
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
