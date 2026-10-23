"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DemoSnapshot } from "@/contracts/demo";
import { apiClient } from "@/lib/api/client";
import { getErrorMessage, isApiError } from "@/lib/api/errors";
import { notifyMonetaryChange } from "@/features/exchange-rates/change-events";

export function useMonetaryWorkspace(initial: DemoSnapshot, editing = false) {
  const [snapshot, setSnapshot] = useState(initial);
  const [receivedRevision, setReceivedRevision] = useState(initial.revision);
  if (initial.revision !== receivedRevision) {
    setReceivedRevision(initial.revision);
    if (!editing) setSnapshot(initial);
  }
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const lock = useRef(false);
  const router = useRouter();

  async function reload() {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try {
      setSnapshot(await apiClient.get<DemoSnapshot>("/admin/demo/workspace"));
      setError(""); setFields({});
      setMessage("Versión actual cargada. Tu borrador se conserva; revisa el resumen antes de guardar.");
    } catch (error) { setError(getErrorMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  }

  async function save(path: string, body: Record<string, unknown>) {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setError(""); setFields({}); setMessage("");
    try {
      await apiClient.post(path, { ...body, expectedRevision: snapshot.revision });
      // A successful mutation must invalidate public consumers even if rereading fails.
      notifyMonetaryChange();
      router.refresh();
      try { setSnapshot(await apiClient.get<DemoSnapshot>("/admin/demo/workspace")); }
      catch { setError("El cambio se guardó. Carga la versión actual para comprobar los datos antes de volver a guardar."); }
      setMessage("Cambios guardados.");
      return true;
    } catch (error) {
      setError(getErrorMessage(error));
      if (isApiError(error)) {
        const details = error.details as { fields?: Record<string, string> } | undefined;
        setFields(details?.fields ?? {});
      }
      return false;
    } finally { lock.current = false; setBusy(false); }
  }

  return { snapshot, busy, message, error, fields, reload, save };
}
