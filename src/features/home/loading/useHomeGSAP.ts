"use client";

import { useId, useLayoutEffect } from "react";
import { useGSAP } from "@gsap/react";
import { useHomeLoading } from "./HomeLoadingBoundary";

type Callback = Extract<NonNullable<Parameters<typeof useGSAP>[0]>, (...args: never[]) => unknown>;
type Config = Exclude<Parameters<typeof useGSAP>[1], unknown[] | undefined>;

// Keeps GSAP's own scoped cleanup. The visible phase is deliberately not a dependency.
export function useHomeGSAP(callback: Callback, config: Config = {}) {
  const id = useId();
  const { fontsReady, register, settle } = useHomeLoading();
  useLayoutEffect(() => register(id), [id, register]);
  return useGSAP((context, contextSafe) => {
    if (!fontsReady) return;
    try {
      const cleanup = callback(context, contextSafe);
      settle(id);
      return cleanup;
    } catch (error) {
      settle(id, true);
      throw error;
    }
  }, { ...config, dependencies: [...(config.dependencies ?? []), fontsReady] });
}
