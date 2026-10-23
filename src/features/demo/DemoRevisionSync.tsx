"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/features/cart/store";
import { DEMO_CHANNEL, DEMO_REVISION_EVENT, verifyDemoRevision, type DemoRevisionNotice } from "./revision-client";

export function DemoRevisionSync({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let pending = false;
    let rerun = false;
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(DEMO_CHANNEL) : null;

    function invalidate(clearCart = false) {
      const cart = useCartStore.getState();
      if (clearCart) cart.clearCart();
      // Blocks checkout immediately; CartCatalogSync reconciles authoritative snapshots.
      cart.setCatalogStatus("loading");
      cart.retryCatalog();
      router.refresh();
    }
    async function check() {
      if (pending) { rerun = true; return; }
      pending = true;
      try {
        await verifyDemoRevision();
      } catch {
        // No stale checkout is allowed while the authoritative dataset is unavailable.
        if (!disposed) useCartStore.getState().setCatalogStatus("error");
      } finally {
        pending = false;
        if (rerun && !disposed) { rerun = false; void check(); }
      }
    }
    function changed(event: Event) {
      const notice = (event as CustomEvent<DemoRevisionNotice & { verified?: boolean }>).detail;
      invalidate(notice?.clearCart);
      if (notice?.verified) return;
      void check();
    }
    function broadcast(event: MessageEvent<DemoRevisionNotice>) {
      window.dispatchEvent(new CustomEvent(DEMO_REVISION_EVENT, { detail: event.data }));
    }
    function focus() { if (document.visibilityState !== "hidden") void check(); }
    channel?.addEventListener("message", broadcast);
    window.addEventListener(DEMO_REVISION_EVENT, changed);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    const timer = window.setInterval(focus, 15000);
    void check();
    return () => {
      disposed = true;
      window.clearInterval(timer);
      channel?.close();
      window.removeEventListener(DEMO_REVISION_EVENT, changed);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [enabled, router]);
  return null;
}
