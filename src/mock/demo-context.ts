import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

export type DemoSession = { datasetId: string; expiresAt: number; tokenHash: string; serialized: string };
const symbol = Symbol.for("soky.demo.request-context.v2");
const shared = globalThis as typeof globalThis & { [symbol]?: AsyncLocalStorage<DemoSession | null> };
const context = shared[symbol] ??= new AsyncLocalStorage<DemoSession | null>();
export const currentDemoSession = () => context.getStore();
export function withDemoSession<T>(session: DemoSession | null, action: () => T): T { return context.run(session, action); }
