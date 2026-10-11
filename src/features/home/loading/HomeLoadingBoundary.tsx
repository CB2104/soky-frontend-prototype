"use client";

// Existing Hero consumers keep their feature API; the shared provider owns loading.
export {
  useSiteLoading as useHomeLoading,
  SiteReadySignal as HomeReadySignal,
} from "@/providers/SiteLoadingProvider";
