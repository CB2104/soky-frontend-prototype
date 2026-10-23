"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./AdminWorkspace.module.css";

type Confirmation = { title: string; description: string; confirmLabel: string; cancelLabel?: string };
export function useAdminConfirmation() {
  const [request, setRequest] = useState<Confirmation | null>(null);
  const resolver = useRef<((answer: boolean) => void) | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const confirm = useCallback((options: Confirmation) => new Promise<boolean>(resolve => {
    resolver.current?.(false);
    resolver.current = resolve;
    returnFocus.current = document.activeElement as HTMLElement;
    setRequest(options);
  }), []);
  const answer = useCallback((value: boolean) => {
    dialogRef.current?.close();
    resolver.current?.(value); resolver.current = null;
    setRequest(null);
    returnFocus.current?.focus();
  }, []);
  useEffect(() => { if (request && !dialogRef.current?.open) dialogRef.current?.showModal(); }, [request]);
  useEffect(() => () => resolver.current?.(false), []);
  const confirmation = request ? <dialog ref={dialogRef} className={styles.confirmDialog} aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-description" onCancel={event => { event.preventDefault(); answer(false); }}>
    <h2 id="admin-confirm-title" className={styles.panelTitle}>{request.title}</h2>
    <p id="admin-confirm-description">{request.description}</p>
    <div className={styles.actions}>
      <button type="button" className={styles.secondaryButton} autoFocus onClick={() => answer(false)}>{request.cancelLabel ?? "Cancelar"}</button>
      <button type="button" className={styles.dangerButton} onClick={() => answer(true)}>{request.confirmLabel}</button>
    </div>
  </dialog> : null;
  return { confirm, confirmation };
}

export function useUnsavedChanges(dirty: boolean, confirm: ReturnType<typeof useAdminConfirmation>["confirm"], onDiscard?: () => void) {
  const bypass = useRef(false);
  const discard = useCallback(async () => {
    if (!dirty) return true;
    const accepted = await confirm({ title: "Cambios sin guardar", description: "Si sales ahora, se perderán los cambios de este editor.", confirmLabel: "Descartar", cancelLabel: "Seguir editando" });
    if (accepted) onDiscard?.();
    return accepted;
  }, [dirty, confirm, onDiscard]);
  useEffect(() => {
    if (!dirty) { bypass.current = false; return; }
    let currentUrl = window.location.href;
    const beforeUnload = (event: BeforeUnloadEvent) => { if (!bypass.current) { event.preventDefault(); event.returnValue = ""; } };
    const navigate = async (href: string) => {
      if (await discard()) { bypass.current = true; window.location.assign(href); }
    };
    const click = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      // Reauthentication deliberately keeps the stored draft for this tab.
      if (anchor.hasAttribute("data-admin-preserve-draft")) { bypass.current = true; return; }
      if (anchor.href === window.location.href || (anchor.origin === window.location.origin && anchor.pathname === window.location.pathname && anchor.search === window.location.search)) return;
      event.preventDefault(); event.stopPropagation(); void navigate(anchor.href);
    };
    const pop = () => {
      const target = window.location.href;
      if (target === currentUrl) return;
      window.history.pushState(window.history.state, "", currentUrl);
      void navigate(target);
    };
    const rememberUrl = () => { currentUrl = window.location.href; };
    document.addEventListener("click", click, true);
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", pop);
    window.addEventListener("soky-admin-query", rememberUrl);
    return () => { document.removeEventListener("click", click, true); window.removeEventListener("beforeunload", beforeUnload); window.removeEventListener("popstate", pop); window.removeEventListener("soky-admin-query", rememberUrl); };
  }, [dirty, discard]);
  return discard;
}
