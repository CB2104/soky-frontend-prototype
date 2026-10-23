"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useTransitionState } from "next-transition-router";
import { useSiteLoading } from "@/providers/SiteLoadingProvider";

gsap.registerPlugin(useGSAP);

const DESKTOP_MOTION_QUERY =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

export function SmoothScroll() {
  const pathname = usePathname();
  const { loading } = useSiteLoading();
  const { stage } = useTransitionState();

  useGSAP(
    () => {
      if (pathname !== "/" || loading) return;

      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();

      media.add(DESKTOP_MOTION_QUERY, () => {
        const lenis = new Lenis({
          lerp: 0.14,
          smoothWheel: true,
          syncTouch: false,
          autoRaf: false,
          anchors: true,
          respectReducedMotion: true,
          // Los paneles conservan su desplazamiento nativo, incluso con Lenis detenido.
          prevent: (node) => node.closest('[role="dialog"]') !== null,
        });

        const syncLock = () => {
          // Solo leer estilos inline: .lenis-stopped aplica overflow: clip por CSS.
          // Leer ese CSS calculado confundiría el bloqueo de Lenis con uno externo.
          const rootOverflow = document.documentElement.style.overflow;
          const bodyOverflow = document.body.style.overflow;
          const locked =
            stage !== "none" ||
            rootOverflow === "hidden" || rootOverflow === "clip" ||
            bodyOverflow === "hidden" || bodyOverflow === "clip";

          if (locked) lenis.stop();
          else lenis.start();
        };

        const observer = new MutationObserver(syncLock);
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["style"],
        });
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ["style"],
        });
        syncLock();

        const updateScroll = () => ScrollTrigger.update();
        const tick = (time: number) => lenis.raf(time * 1000);
        lenis.on("scroll", updateScroll);
        gsap.ticker.add(tick);

        return () => {
          observer.disconnect();
          gsap.ticker.remove(tick);
          lenis.off("scroll", updateScroll);
          lenis.destroy();
        };
      });

      return () => media.revert();
    },
    { dependencies: [pathname, loading, stage], revertOnUpdate: true },
  );

  return null;
}
