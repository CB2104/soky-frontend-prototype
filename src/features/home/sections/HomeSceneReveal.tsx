"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useHomeLoading } from "@/features/home/loading/HomeLoadingBoundary";

type HomeSceneRevealProps = {
  children: ReactNode;
  className?: string;
  side: "left" | "right";
};

export function HomeSceneReveal({ children, className, side }: HomeSceneRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const inView = useInView(ref, { once: false, amount: 0.05 });
  const reduceMotion = useReducedMotion();
  const { canAnimate } = useHomeLoading();
  const visible = canAnimate && inView;
  const hiddenX = side === "left" ? "-105%" : "105%";

  return (
    <div
      ref={ref}
      data-home-scene-observer
      hidden={failed}
      onErrorCapture={(event) => {
        if (event.target instanceof HTMLImageElement) setFailed(true);
      }}
    >
      <motion.div
        className={className}
        data-home-scene-reveal
        initial={false}
        animate={{ opacity: visible ? 1 : 0, x: visible ? "0%" : hiddenX }}
        transition={{ duration: reduceMotion ? 0 : visible ? 0.55 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
