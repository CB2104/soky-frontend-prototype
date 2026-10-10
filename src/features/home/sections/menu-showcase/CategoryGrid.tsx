"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import { useInView, useReducedMotion } from "motion/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useHomeLoading } from "@/features/home/loading/HomeLoadingBoundary";
import { useHomeGSAP } from "@/features/home/loading/useHomeGSAP";
import { CategoryCard } from "./CategoryCard";
import type { CategoryCardViewModel } from "./category-card-data";
import styles from "./CategoryCard.module.css";

gsap.registerPlugin(useGSAP);

const REST_SECONDS = 4.2;
const DOMINO_STEP_SECONDS = 0.75;

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function getVisibility() {
  return document.visibilityState === "visible";
}

function getServerVisibility() {
  return false;
}

export function CategoryGrid({ categories }: { categories: readonly CategoryCardViewModel[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridId = useId();
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeImages, setActiveImages] = useState<Record<string, number>>({});
  const inView = useInView(gridRef, { amount: "some", once: false });
  const reducedMotion = useReducedMotion();
  const pageVisible = useSyncExternalStore(subscribeVisibility, getVisibility, getServerVisibility);
  const categoryKey = categories.map((category) => category.id).join("|");
  const { canAnimate } = useHomeLoading();
  const canPlay = canAnimate && categories.length > 0 && inView && pageVisible
    && !paused && !hovered && !focused && reducedMotion === false;

  useHomeGSAP((_context, contextSafe) => {
    if (!canPlay || !contextSafe) return;
    let stopped = false;

    const cycle: () => void = contextSafe(() => {
      if (stopped) return;
      const cards = Array.from(
        gridRef.current?.querySelectorAll<HTMLElement>("[data-category-card]") ?? [],
      ).filter((card) => card.dataset.ready === "true" && card.dataset.inView === "true");

      if (cards.length === 0) {
        gsap.delayedCall(REST_SECONDS, cycle);
        return;
      }

      const timeline = gsap.timeline({
        onComplete: contextSafe(() => {
          if (!stopped) gsap.delayedCall(REST_SECONDS, cycle);
        }),
      });

      cards.forEach((card, order) => {
        const start = order * DOMINO_STEP_SECONDS;
        const rows = Array.from(card.querySelectorAll<HTMLElement>("[data-card-row]"));

        rows.forEach((row, rowIndex) => {
          timeline.to(row.children, {
            scaleX: 1,
            duration: 0.22,
            ease: "power3.inOut",
            stagger: { each: 0.02, from: rowIndex % 2 === 0 ? "start" : "end" },
          }, start);
        });

        timeline.call(() => {
          const id = card.dataset.categoryId;
          if (stopped || !id || card.dataset.ready !== "true" || card.dataset.inView !== "true") return;
          setActiveImages((previous) => ({
            ...previous,
            [id]: ((previous[id] ?? 0) + 1) % 2,
          }));
        }, [], start + 0.28);

        rows.forEach((row, rowIndex) => {
          timeline.to(row.children, {
            scaleX: 0,
            duration: 0.24,
            ease: "power3.inOut",
            stagger: { each: 0.02, from: rowIndex % 2 === 0 ? "start" : "end" },
          }, start + 0.36);
        });
      });
    });

    gsap.delayedCall(REST_SECONDS, cycle);
    return () => { stopped = true; };
  }, {
    scope: gridRef,
    dependencies: [canPlay, categoryKey],
    revertOnUpdate: true,
  });

  if (categories.length === 0) {
    return <p className={styles.empty}>No hay categorías disponibles en este momento.</p>;
  }

  return (
    <div>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.pauseButton}
          aria-controls={gridId}
          aria-pressed={paused}
          disabled={reducedMotion === true}
          onClick={() => setPaused((previous) => !previous)}
        >
          {reducedMotion === true ? "Fotos estáticas" : paused ? "Reanudar fotos" : "Pausar fotos"}
        </button>
      </div>
      <div
        ref={gridRef}
        id={gridId}
        className={styles.grid}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse" || event.pointerType === "pen") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
      >
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            activeIndex={activeImages[category.id] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
