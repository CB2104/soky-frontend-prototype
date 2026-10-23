"use client";
import { apiClient } from "@/lib/api/client";

export const DEMO_REVISION_EVENT = "soky:demo-revision";
export const DEMO_CHANNEL = "soky-demo";
export type DemoRevisionNotice = { revision?: number; clearCart?: boolean };
let lastRevision: number | undefined;
let pending: Promise<{ demo: boolean; revision: number }> | undefined;

// Focus/poll and checkout use the same check, including when BroadcastChannel is absent.
export function verifyDemoRevision() {
  if (pending) return pending;
  pending = apiClient.get<{ demo: boolean; revision: number }>("/demo/revision").then(state => {
    if (state.demo && Number.isSafeInteger(state.revision)) {
      const changed = lastRevision !== undefined && lastRevision !== state.revision;
      lastRevision = state.revision;
      if (changed) window.dispatchEvent(new CustomEvent(DEMO_REVISION_EVENT, { detail: { revision: state.revision, verified: true } }));
    }
    return state;
  }).finally(() => { pending = undefined; });
  return pending;
}

export function publishDemoRevision(revision?: number, clearCart = false) {
  if (revision !== undefined) lastRevision = revision;
  const detail: DemoRevisionNotice = { revision, clearCart };
  window.dispatchEvent(new CustomEvent(DEMO_REVISION_EVENT, { detail }));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(DEMO_CHANNEL);
    channel.postMessage(detail);
    channel.close();
  }
}
