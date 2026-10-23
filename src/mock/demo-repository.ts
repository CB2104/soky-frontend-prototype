import "server-only";
import type { DemoState } from "@/contracts/demo";
import { createDemoSeed } from "./demo-seed";
import { DemoError } from "./demo-errors";
import { validateState } from "./demo-validation";
import { demoDirectory, persistDemoFile, preserveCorruptFile, readDemoFile } from "./demo-persistence";
import { mockProducts, mockCategories, mockSettings, mockExchangeRate, mockSliderItems } from "./db";

export const demoEnabled = process.env.SOKY_DEMO_MODE !== "off";
const key = Symbol.for("soky.demo.repository.v1");
type Queue = { tail: Promise<unknown>; lastRevision?: number; directory?: string };
const globals = globalThis as typeof globalThis & { [key]?: Queue };
const queue = globals[key] ??= { tail: Promise.resolve() };
queue.directory ??= demoDirectory();

function serial<T>(operation: () => Promise<T>): Promise<T> {
  if (queue.directory !== demoDirectory()) throw new Error("No cambies la carpeta demo durante la ejecución del proceso.");
  const next = queue.tail.then(operation, operation);
  queue.tail = next.catch(() => undefined);
  return next;
}

function originalState(): DemoState {
  return { ...createDemoSeed(), products: structuredClone(mockProducts), categories: structuredClone(mockCategories), settings: structuredClone(mockSettings), currentRate: structuredClone(mockExchangeRate), sliders: structuredClone(mockSliderItems) };
}

async function persist(state: DemoState) {
  validateState(state);
  await persistDemoFile(state);
  queue.lastRevision = state.revision;
}

async function readUnlocked(): Promise<DemoState> {
  const content = await readDemoFile();
  if (content === null) {
    const initial = createDemoSeed();
    await persist(initial);
    return initial;
  }
  try {
    const state: DemoState = JSON.parse(content);
    validateState(state);
    queue.lastRevision = Math.max(queue.lastRevision ?? 0, state.revision);
    return state;
  } catch {
    throw new DemoError("DATA_CORRUPT", "El archivo demo no es válido. Se ha conservado. Puedes restaurar explícitamente la demo desde Configuración.", 503);
  }
}

export function readDemoState() {
  return demoEnabled ? serial(readUnlocked) : Promise.resolve(originalState());
}

export function mutateDemo<T>(expectedRevision: unknown, mutation: (draft: DemoState) => T | Promise<T>) {
  if (!demoEnabled) throw new DemoError("DEMO_DISABLED", "Activa el modo demo local para editar.", 403);
  return serial(async () => {
    const current = await readUnlocked();
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== current.revision) throw new DemoError("CONFLICT", "Los datos cambiaron en otra pestaña. Conserva tu borrador y carga la versión actual antes de guardar.", 409);
    const draft = structuredClone(current);
    const result = await mutation(draft);
    draft.revision = current.revision + 1;
    draft.updatedAt = new Date().toISOString();
    await persist(draft);
    return { result, state: draft };
  });
}

export function appendDemoIntent<T>(mutation: (draft: DemoState) => T | Promise<T>) {
  if (!demoEnabled) return Promise.resolve(mutation(originalState()));
  return serial(async () => {
    const draft = structuredClone(await readUnlocked());
    const result = await mutation(draft);
    draft.revision++; draft.updatedAt = new Date().toISOString();
    await persist(draft);
    return result;
  });
}

export function resetDemo(expectedRevision: unknown, authorize: () => void = () => {}) {
  if (!demoEnabled) throw new DemoError("DEMO_DISABLED", "Modo demo desactivado.", 403);
  return serial(async () => {
    authorize();
    let revision: number;
    try {
      const current = await readUnlocked();
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== current.revision) throw new DemoError("CONFLICT", "Los datos cambiaron. Recarga antes de restaurar.", 409);
      revision = current.revision + 1;
    } catch (error) {
      if (!(error instanceof DemoError) || error.code !== "DATA_CORRUPT") throw error;
      const content = await readDemoFile();
      if (content === null) throw error;
      if (expectedRevision !== "RECOVER") throw new DemoError("DATA_CORRUPT", "Confirma la recuperación del archivo dañado desde Configuración.", 503);
      await preserveCorruptFile(content);
      let recordedRevision = 0;
      try { const parsed = JSON.parse(content); if (Number.isSafeInteger(parsed?.revision)) recordedRevision = parsed.revision; } catch { /* Preserve unparseable content as well. */ }
      revision = Math.max(queue.lastRevision ?? 0, recordedRevision, Date.now()) + 1;
    }
    const initial = createDemoSeed(revision);
    await persist(initial);
    return initial;
  });
}
