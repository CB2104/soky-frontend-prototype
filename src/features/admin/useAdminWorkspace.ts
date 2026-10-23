"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DemoSnapshot } from "@/contracts/demo";
import type { FieldErrors } from "@/lib/catalog-validation";
import { ApiError } from "@/lib/api/errors";
import { getDemoSnapshot, mutateAdminDemo } from "./demo-client";
import { DEMO_CHANNEL, DEMO_REVISION_EVENT } from "@/features/demo/revision-client";

export function useAdminWorkspace(preserveEditor = false) {
  const [snapshot, setSnapshot] = useState<DemoSnapshot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try { const next = await getDemoSnapshot(); setSnapshot(previous => previous && previous.revision > next.revision ? previous : next); setUnauthorized(false); return next; }
    catch (error) { setError(error instanceof ApiError ? error.message : "No pudimos cargar los datos. Vuelve a intentar."); setUnauthorized(error instanceof ApiError && error.status === 401); return null; }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (preserveEditor) return;
    const refresh = () => { void reload(); };
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(DEMO_CHANNEL) : null;
    window.addEventListener(DEMO_REVISION_EVENT, refresh);
    window.addEventListener("focus", refresh);
    channel?.addEventListener("message", refresh);
    return () => { window.removeEventListener(DEMO_REVISION_EVENT, refresh); window.removeEventListener("focus", refresh); channel?.close(); };
  }, [preserveEditor, reload]);
  useEffect(() => {
    let active = true;
    void getDemoSnapshot().then(next => { if (active) { setSnapshot(next); setLoading(false); } }, error => {
      if (active) { setError(error instanceof ApiError ? error.message : "No pudimos cargar los datos. Vuelve a intentar."); setUnauthorized(error instanceof ApiError && error.status === 401); setLoading(false); }
    });
    return () => { active = false; };
  }, []);
  return { snapshot, setSnapshot, loading, error, unauthorized, reload };
}

export function useAdminMutation() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [conflict, setConflict] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const lock = useRef(false);
  const clear = () => { setErrors({}); setMessage(""); setConflict(false); };
  async function mutate<T>(path: string, body: object, revision: number, method: "POST" | "PATCH" | "DELETE" = "PATCH") {
    if (lock.current || unauthorized || conflict) return null;
    lock.current = true; setSaving(true); clear();
    try {
      const result = await mutateAdminDemo(path, { ...body }, revision, method) as { data: T; revision: number };
      setMessage("Cambios guardados"); return result;
    } catch (error) {
      if (error instanceof ApiError) {
        const fields = (error.details as { fields?: FieldErrors } | undefined)?.fields;
        setErrors(fields ?? {}); setConflict(error.code === "CONFLICT"); setUnauthorized(error.status === 401);
        setMessage(error.message);
      } else setMessage("No pudimos guardar. Tus cambios siguen aquí. Vuelve a intentar.");
      return null;
    } finally { lock.current = false; setSaving(false); }
  }
  return { saving, message, errors, setErrors, setMessage, conflict, unauthorized, mutate, clear };
}
