"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { useHomeLoading } from "@/features/home/loading/HomeLoadingBoundary";
import { useHomeGSAP } from "@/features/home/loading/useHomeGSAP";
import gsap from "gsap";
import { AnimatePresence, motion } from "motion/react";
import { getImageProps } from "next/image";

gsap.registerPlugin(useGSAP);

export const HERO_PRODUCT_HOLD_MS = 4200;
const productEase = [0.16, 1, 0.3, 1] as const;
const boxesEntranceDelaySeconds = 0.18;

/** Decode the upcoming responsive image before starting its visual exchange. */
export async function prepareHeroProduct(src: string, sizes: string) {
  const { props } = getImageProps({
    src,
    alt: "",
    width: 1536,
    height: 1024,
    sizes,
  });
  const image = new window.Image();
  image.sizes = props.sizes ?? sizes;
  image.srcset = props.srcSet ?? "";
  image.src = props.src;
  try {
    await image.decode();
    return true;
  } catch {
    return false;
  }
}

type HeroProductMotionProps = {
  active: boolean;
  children: ReactNode;
  className?: string;
  frameKey: string;
  reducedMotion: boolean;
  motionPreset?: "default" | "boxes";
};

export function HeroProductMotion({
  active,
  children,
  className,
  frameKey,
  reducedMotion,
  motionPreset = "default",
}: HeroProductMotionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { startEntrance, canAnimate } = useHomeLoading();
  const isBoxesMotion = motionPreset === "boxes";

  useHomeGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      if (reducedMotion || !active || isBoxesMotion) {
        gsap.set(root, {
          clearProps: "opacity,visibility,transform",
        });
        return;
      }

      const entrance = gsap.fromTo(
        root,
        {
          autoAlpha: 0,
          y: isBoxesMotion ? 18 : 24,
          scale: isBoxesMotion ? 0.99 : 0.975,
          rotation: isBoxesMotion ? 0 : 0.6,
        },
        {
          paused: true,
          autoAlpha: 1,
          y: 0,
          scale: 1,
          rotation: 0,
          duration: isBoxesMotion ? 0.65 : 1.05,
          delay: isBoxesMotion ? 0 : 0.16,
          ease: "power4.out",
          clearProps: "transform",
          overwrite: "auto",
        },
      );
      return startEntrance(() => { entrance.play(0); });
    },
    {
      scope: rootRef,
      dependencies: [active, reducedMotion, motionPreset],
      revertOnUpdate: true,
    },
  );

  return (
    <div
      ref={rootRef}
      className={className}
      data-hero-product-motion
      data-hero-product-motion-preset={motionPreset}
    >
      <AnimatePresence initial={false} mode={isBoxesMotion ? "wait" : "sync"}>
        <motion.div
          key={frameKey}
          className="absolute inset-0"
          data-hero-product-layer-frame
          initial={
            reducedMotion
              ? false
              : isBoxesMotion
                ? { opacity: 0, x: "7%", y: "5%", rotate: 1.5, scale: 0.96 }
                : { opacity: 0, x: 16, y: 8, scale: 0.985 }
          }
          animate={
            !canAnimate && !reducedMotion
              ? isBoxesMotion
                ? { opacity: 0, x: "7%", y: "5%", rotate: 1.5, scale: 0.96 }
                : { opacity: 0, x: 16, y: 8, scale: 0.985 }
              : isBoxesMotion
              ? { opacity: 1, x: "0%", y: "0%", rotate: 0, scale: 1 }
              : { opacity: 1, x: 0, y: 0, scale: 1 }
          }
          exit={
            reducedMotion
              ? { opacity: 0 }
              : isBoxesMotion
                ? {
                    opacity: [1, 0.8, 0],
                    x: ["0%", "-5%", "-12%"],
                    y: ["0%", "-5%", "-1%"],
                    rotate: [0, -1.2, -2.5],
                    scale: [1, 0.985, 0.96],
                    transition: {
                      duration: 0.42,
                      delay: 0,
                      times: [0, 0.5, 1],
                      ease: "easeIn",
                    },
                  }
                : {
                    opacity: 0,
                    x: -10,
                    y: -4,
                    scale: 0.995,
                    transition: {
                      duration: 0.28,
                      ease: productEase,
                    },
                  }
          }
          transition={{
            duration: reducedMotion ? 0 : isBoxesMotion ? 0.62 : 0.85,
            delay: !reducedMotion && isBoxesMotion ? boxesEntranceDelaySeconds : 0,
            ease: isBoxesMotion ? [0.34, 1.2, 0.64, 1] : productEase,
          }}
          style={{ transformOrigin: "50% 75%" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
