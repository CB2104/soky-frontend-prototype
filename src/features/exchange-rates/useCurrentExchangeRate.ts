"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExchangeRateDto } from "@/contracts/api";
import { getCurrentExchangeRate } from "./api";
import { subscribeMonetaryChange } from "./change-events";
import { RATE_REVIEW_MS } from "./manual-rate";

type RateState = {
  rate: ExchangeRateDto | null;
  status: "loading" | "ready" | "error";
};

export function useCurrentExchangeRate(): RateState & { retry: () => void } {
  const [state, setState] = useState<RateState>({ rate: null, status: "loading" });

  const [refreshVersion, setRefreshVersion] = useState(0);
  const retry = useCallback(() => {
    setState({ rate: null, status: "loading" });
    setRefreshVersion(version => version + 1);
  }, []);

  useEffect(() => {
    let disposed = false;
    let requestId = 0;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;

    function refresh() {
      const currentId = ++requestId;
      void getCurrentExchangeRate().then(
        (rate) => {
          if (!disposed && currentId === requestId) {
            clearTimeout(expiryTimer);
            setState({ rate, status: "ready" });
            const remaining = Date.parse(rate.fetchedAt) + RATE_REVIEW_MS - Date.now();
            if (!rate.stale && remaining > 0) expiryTimer = setTimeout(onFocus, remaining);
          }
        },
        () => {
          if (!disposed && currentId === requestId) setState({ rate: null, status: "error" });
        },
      );
    }

    function onFocus() {
      setState({ rate: null, status: "loading" });
      refresh();
    }

    refresh();
    window.addEventListener("focus", onFocus);
    const unsubscribe = subscribeMonetaryChange(onFocus);
    return () => {
      disposed = true;
      clearTimeout(expiryTimer);
      unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshVersion]);

  return { ...state, retry };
}
