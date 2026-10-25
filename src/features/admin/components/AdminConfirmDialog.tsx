"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./AdminWorkspace.module.css";

type Confirmation = { title: string; description: string; confirmLabel: string; cancelLabel?: string };

const historyKey = "sokyAdminIndex";
// Track real entries; a canceled Back/Forward traversal never pushes a duplicate.
export function useAdminHistory() {
  useLayoutEffect(() => {
    let index = window.history.state?.[historyKey] ?? 0;
    const push = window.history.pushState, replace = window.history.replaceState;
    replace.call(window.history, { ...window.history.state, [historyKey]: index }, "");
    window.history.pushState = function(data, unused, url) { index = (window.history.state?.[historyKey] ?? index) + 1; push.call(this, { ...data, [historyKey]: index }, unused, url); };
    window.history.replaceState = function(data, unused, url) { replace.call(this, { ...data, [historyKey]: window.history.state?.[historyKey] ?? index }, unused, url); };
    return () => { window.history.pushState = push; window.history.replaceState = replace; };
  }, []);
}

export async function requestAdminLeave() {
  const detail: { result?: Promise<boolean> } = {};
  window.dispatchEvent(new CustomEvent("soky-admin-leave", { detail }));
  return detail.result ? await detail.result : true;
}
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
    const accepted = await confirm({ title: "Cambios sin guardar", description: "Si sales ahora, se perderán los cambios de este editor.", confirmLabel: "Descartar cambios", cancelLabel: "Seguir editando" });
    if (accepted) { onDiscard?.(); bypass.current = true; }
    return accepted;
  }, [dirty, confirm, onDiscard]);
  useEffect(() => {
    if (!dirty) { bypass.current = false; return; }
    let currentIndex = window.history.state?.[historyKey] ?? 0;
    let reverting = false;
    let pending = false;
    const beforeUnload = (event: BeforeUnloadEvent) => { if (!bypass.current) { event.preventDefault(); event.returnValue = ""; } };
    const navigate = async (href: string) => {
      if (await discard()) { bypass.current = true; window.location.assign(href); }
    };
    const click = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      // Reauthentication deliberately keeps the stored draft for this tab.
      if (anchor.hasAttribute("data-admin-preserve-draft")) { bypass.current = true; return; }
      if (anchor.href === window.location.href || (anchor.origin === window.location.origin && anchor.pathname === window.location.pathname && anchor.search === window.location.search)) return;
      event.preventDefault(); event.stopPropagation(); void navigate(anchor.href);
    };
    const pop = (notice: Event) => {
      const event = (notice as CustomEvent<PopStateEvent>).detail;
      if (bypass.current) return;
      event.stopImmediatePropagation();
      if (reverting) { reverting = false; return; }
      const delta = (event.state?.[historyKey] ?? currentIndex - 1) - currentIndex;
      if (!delta) return;
      reverting = true;
      window.history.go(-delta);
      if (pending) return;
      pending = true;
      void discard().then(accepted => { pending = false; if (accepted) window.history.go(delta); });
    };
    const leave = (event: Event) => { (event as CustomEvent<{ result: Promise<boolean> }>).detail.result = discard(); };
    const rememberUrl = () => { currentIndex = window.history.state?.[historyKey] ?? currentIndex; };
    document.addEventListener("click", click, true);
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("soky-admin-pop", pop);
    window.addEventListener("soky-admin-leave", leave);
    window.addEventListener("soky-admin-query", rememberUrl);
    return () => { document.removeEventListener("click", click, true); window.removeEventListener("beforeunload", beforeUnload); window.removeEventListener("soky-admin-pop", pop); window.removeEventListener("soky-admin-leave", leave); window.removeEventListener("soky-admin-query", rememberUrl); };
  }, [dirty, discard]);
  return discard;
}
