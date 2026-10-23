import { DEMO_REVISION_EVENT, publishDemoRevision } from "@/features/demo/revision-client";

export function notifyMonetaryChange() {
  publishDemoRevision();
}

export function subscribeMonetaryChange(refresh: () => void) {
  window.addEventListener(DEMO_REVISION_EVENT, refresh);
  return () => {
    window.removeEventListener(DEMO_REVISION_EVENT, refresh);
  };
}
