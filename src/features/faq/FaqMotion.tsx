"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTransitionState } from "next-transition-router";
import { useSiteLoading } from "@/providers/SiteLoadingProvider";

gsap.registerPlugin(useGSAP);

export function FaqMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const seen = useRef(new WeakSet<HTMLElement>());
  const { canAnimate } = useSiteLoading();
  const { stage } = useTransitionState();
  const ready = canAnimate && stage === "none";

  useGSAP(() => {
    const root = scope.current;
    if (!root || !ready) return;

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", (context) => {
      // Anchor destinations stay still and immediately readable.
      if (window.location.hash) return;

      const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-faq-reveal]"));
      const tweens = new Set<gsap.core.Tween>();

      const finish = () => {
        observer?.disconnect();
        tweens.forEach((tween) => tween.progress(1).kill());
        tweens.clear();
        targets.forEach((target) => {
          seen.current.add(target);
          target.style.removeProperty("opacity");
          target.style.removeProperty("transform");
        });
      };

      // Record deferred tweens in this media context, without re-entering its parent.
      const reveal = context.add("reveal", (target: HTMLElement, delay = 0) => {
        if (seen.current.has(target)) return;
        seen.current.add(target);
        const header = target.dataset.faqReveal === "header";
        const tween = gsap.fromTo(target,
          { opacity: 0, y: header ? 14 : 18 },
          {
            opacity: 1,
            y: 0,
            duration: header ? 0.6 : 0.45,
            delay,
            ease: "power3.out",
            clearProps: "opacity,transform",
            onComplete: () => { tweens.delete(tween); },
          },
        );
        tweens.add(tween);
      });

      const header = targets.find((target) => target.dataset.faqReveal === "header");
      if (header) reveal(header);

      const observer = new IntersectionObserver((entries) => {
        entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
          observer?.unobserve(entry.target);
          reveal(entry.target as HTMLElement, (index % 3) * 0.06);
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -24px 0px" });
      targets.filter((target) => target !== header).forEach((target) => observer?.observe(target));

      root.addEventListener("focusin", finish);
      window.addEventListener("hashchange", finish);
      const onVisibility = () => { if (document.hidden) finish(); };
      document.addEventListener("visibilitychange", onVisibility);

      return () => {
        finish();
        root.removeEventListener("focusin", finish);
        window.removeEventListener("hashchange", finish);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    });

    return () => media.revert();
  }, { scope, dependencies: [ready], revertOnUpdate: true });

  return <div ref={scope}>{children}</div>;
}
