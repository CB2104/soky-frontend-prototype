"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { publishDemoRevision } from "@/features/demo/revision-client";
import { useCartStore } from "@/features/cart/store";
import { useCartHydration } from "@/features/cart/useCartHydration";
import styles from "./AdminWorkspace.module.css";
import resetStyles from "./DemoResetPanel.module.css";

type Status = { demo: boolean; revision: number | null; storageState: "ready" | "corrupt" | "unavailable"; message?: string };

export function DemoResetPanel() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  const hydrated = useCartHydration();
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [clearCart, setClearCart] = useState(false);

  async function loadStatus() {
    const current = await apiClient.get<Status>("/admin/demo/status");
    setStatus(current);
    return current;
  }
  useEffect(() => {
    let disposed = false;
    void apiClient.get<Status>("/admin/demo/status").then(value => { if (!disposed) setStatus(value); }, error => { if (!disposed) setError(error instanceof Error ? error.message : "No pudimos leer el estado demo."); });
    return () => { disposed = true; };
  }, []);

  async function open() {
    setError(""); setMessage("");
    try {
      const current = await loadStatus();
      if (!current.demo || current.storageState === "unavailable") throw new Error(current.message ?? "La demo no está disponible.");
      dialog.current?.showModal();
      cancel.current?.focus();
    } catch (error) { setError(error instanceof Error ? error.message : "No pudimos preparar la restauración."); }
  }
  async function restore() {
    if (!status || busy.current) return;
    busy.current = true; setPending(true); setError("");
    try {
      const result = await apiClient.post<{ revision: number }>("/admin/demo/reset", { confirm: "RESTORE", expectedRevision: status.storageState === "corrupt" ? "RECOVER" : status.revision });
      if (clearCart) useCartStore.getState().clearCart();
      else useCartStore.getState().retryCatalog();
      publishDemoRevision(result.revision, clearCart);
      dialog.current?.close();
      setStatus({ demo: true, revision: result.revision, storageState: "ready" });
      setMessage(`Datos restaurados. Revisión ${result.revision}. ${clearCart ? "Carrito de presentación vacío." : "El carrito se actualizará con el catálogo restaurado al volver al sitio."}`);
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo restaurar. Los cambios no se confirmaron."); }
    finally { busy.current = false; setPending(false); }
  }

  return <section className={`${styles.panel} ${styles.panelPadding}`} aria-labelledby="demo-reset-title">
    <h2 id="demo-reset-title" className={styles.panelTitle}>Datos de demostración</h2>
    <p className={styles.sectionDescription}>Restaura productos, categorías, configuración, Hero, tasa inicial, historial, analítica e intenciones de ejemplo. Tu sesión permanece abierta.</p>
    {status?.storageState === "corrupt" ? <p role="alert">El archivo demo está dañado o usa una versión desconocida. La recuperación guardará una copia del archivo antes de restaurar.</p> : null}
    {message ? <p role="status">{message}</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    <Button ref={trigger} type="button" variant="secondary" disabled={pending} onClick={() => void open()}>Restaurar demo</Button>
    <dialog ref={dialog} className={resetStyles.dialog} aria-labelledby="demo-reset-confirm-title" aria-describedby="demo-reset-description" onCancel={event => { if (pending) event.preventDefault(); }} onClose={() => trigger.current?.focus()}>
      <h2 id="demo-reset-confirm-title">Restaurar datos de la demo</h2>
      <p id="demo-reset-description">Se reemplazarán todos los cambios del catálogo, categorías, configuración, Hero, tasa e historial, analítica e intenciones demo. La tasa inicial requerirá revisión manual.</p>
      <p>Las imágenes originales se conservan. La sesión del presentador sigue abierta.</p>
      <label className={resetStyles.choice}><input type="checkbox" checked={clearCart} disabled={pending || !hydrated} onChange={event => setClearCart(event.target.checked)} /> Vaciar también el carrito de la presentación. Si lo conservas, se actualizarán productos, moneda y precios.</label>
      {error ? <p role="alert">{error}</p> : null}
      <div className={resetStyles.actions}>
        <Button ref={cancel} type="button" variant="secondary" disabled={pending} onClick={() => dialog.current?.close()}>Cancelar</Button>
        <Button type="button" disabled={pending} aria-busy={pending} onClick={() => void restore()}>{pending ? "Restaurando…" : "Restaurar datos"}</Button>
      </div>
    </dialog>
  </section>;
}
