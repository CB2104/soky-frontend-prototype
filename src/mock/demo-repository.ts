import "server-only";
import type { DemoState } from "@/contracts/demo";
import { createDemoSeed } from "./demo-seed";
import { demoEnabled, demoStorageMode } from "./demo-config";
import { currentDemoSession } from "./demo-context";
import { DemoError } from "./demo-errors";
import { expiredDemo, redisDemoStore } from "./demo-redis";
import { validateState } from "./demo-validation";
import { mockProducts, mockCategories, mockSettings, mockExchangeRate, mockSliderItems } from "./db";
export { demoEnabled } from "./demo-config";

function session() {
  const value = currentDemoSession();
  if (!value || value.expiresAt <= Date.now()) expiredDemo();
  return value;
}
function parse(raw: string): DemoState {
  try { const state = JSON.parse(raw); validateState(state); return state; }
  catch { throw new DemoError("DATA_CORRUPT", "La copia demo no es válida. Puedes restaurar solo tu copia desde Configuración.", 503); }
}
function serialize(state: DemoState) {
  if (state.products.length > 250 || state.categories.length > 64 || state.orderIntents.length > 100) {
    throw new DemoError("DEMO_LIMIT", "Esta copia alcanzó su límite: 250 productos, 64 categorías o 100 intenciones. Restaura tu demo para volver a empezar.", 429);
  }
  state.rateHistory = state.rateHistory.slice(0, 100);
  validateState(state);
  const raw = JSON.stringify(state);
  if (Buffer.byteLength(raw, "utf8") > 2 * 1024 * 1024) throw new DemoError("DEMO_LIMIT", "Esta copia alcanzó el tamaño máximo de la demo. Restaura tus datos para volver a empezar.", 429);
  return raw;
}
export async function readDemoState(): Promise<DemoState> {
  if (!demoEnabled) return { ...createDemoSeed(), products: structuredClone(mockProducts), categories: structuredClone(mockCategories), settings: structuredClone(mockSettings), currentRate: structuredClone(mockExchangeRate), sliders: structuredClone(mockSliderItems) };
  if (demoStorageMode() === "file") return (await import("./demo-file-repository")).readDemoState();
  // Anonymous reads never initialize a dataset or connect to Redis.
  if (!currentDemoSession()) return createDemoSeed();
  return parse(await redisDemoStore().read(session()));
}
export async function mutateDemo<T>(expectedRevision: unknown, mutation: (draft: DemoState) => T | Promise<T>) {
  if (!demoEnabled) throw new DemoError("DEMO_DISABLED", "La administración demo está desactivada.", 403);
  if (demoStorageMode() === "file") return (await import("./demo-file-repository")).mutateDemo(expectedRevision, mutation);
  const visitor = session();
  const raw = await redisDemoStore().read(visitor);
  const draft = parse(raw);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== draft.revision) throw new DemoError("CONFLICT", "Los datos cambiaron en otra pestaña. Conserva tu borrador y carga la versión actual antes de guardar.", 409);
  const result = await mutation(draft);
  draft.revision = (expectedRevision as number) + 1; draft.updatedAt = new Date().toISOString();
  await redisDemoStore().commit(visitor, raw, serialize(draft), expectedRevision as number);
  return { result, state: draft };
}
export async function appendDemoIntent<T>(mutation: (draft: DemoState) => T | Promise<T>): Promise<T> {
  if (!demoEnabled) throw new DemoError("DEMO_DISABLED", "La demo está desactivada. Puedes consultar el catálogo y calcular el pedido, pero no crear intenciones ni abrir WhatsApp desde el checkout.", 403);
  if (demoStorageMode() === "file") return (await import("./demo-file-repository")).appendDemoIntent(mutation);
  const visitor = session();
  const raw = await redisDemoStore().read(visitor);
  const draft = parse(raw);
  const revision = draft.revision;
  const result = await mutation(draft);
  draft.revision = revision + 1; draft.updatedAt = new Date().toISOString();
  await redisDemoStore().commit(visitor, raw, serialize(draft), revision);
  return result;
}
export async function resetDemo(expectedRevision: unknown, authorize: () => void | Promise<void> = () => {}) {
  if (!demoEnabled) throw new DemoError("DEMO_DISABLED", "Modo demo desactivado.", 403);
  if (demoStorageMode() === "file") return (await import("./demo-file-repository")).resetDemo(expectedRevision, authorize);
  await authorize();
  const visitor = session();
  const raw = await redisDemoStore().read(visitor);
  let previous: DemoState | undefined;
  try { previous = parse(raw); } catch (error) { if (!(error instanceof DemoError) || error.code !== "DATA_CORRUPT") throw error; }
  if (previous && (!Number.isSafeInteger(expectedRevision) || expectedRevision !== previous.revision)) throw new DemoError("CONFLICT", "Los datos cambiaron. Recarga antes de restaurar.", 409);
  if (!previous && expectedRevision !== "RECOVER") throw new DemoError("DATA_CORRUPT", "Confirma la recuperación de tu copia dañada desde Configuración.", 503);
  let recordedRevision = 0;
  if (!previous) { try { const value = JSON.parse(raw)?.revision; if (Number.isSafeInteger(value)) recordedRevision = value; } catch { /* Raw content is preserved atomically by the recovery script. */ } }
  const state = createDemoSeed(previous ? previous.revision + 1 : Math.max(recordedRevision, Date.now()) + 1);
  await redisDemoStore().commit(visitor, raw, serialize(state), previous ? previous.revision : "RECOVER");
  return state;
}
