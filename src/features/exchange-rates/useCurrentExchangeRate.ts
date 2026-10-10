"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExchangeRateDto } from "@/contracts/api";
import { getCurrentExchangeRate } from "./api";

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

    function refresh() {
      const currentId = ++requestId;
      void getCurrentExchangeRate().then(
        (rate) => {
          if (!disposed && currentId === requestId) setState({ rate, status: "ready" });
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
    return () => {
      disposed = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshVersion]);

  return { ...state, retry };
}
