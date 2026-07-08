"use client";

import gsap from "gsap";
import { TransitionRouter } from "next-transition-router";
import { ReactNode, useCallback, useEffect, useRef } from "react";

const ROWS = 4;
const COLS = 16;

type TransitionProviderProps = {
  children: ReactNode;
};

type TransitionCallback = () => void;

export default function TransitionProvider({
  children,
}: TransitionProviderProps) {
  const transitionGridRef = useRef<HTMLDivElement | null>(null);
  const blocksRef = useRef<HTMLDivElement[]>([]);

  const getRowBlocks = useCallback((row: number) => {
    return blocksRef.current.slice(row * COLS, row * COLS + COLS);
  }, []);

  const createTransitionGrid = useCallback(() => {
    const container = transitionGridRef.current;

    if (!container) return;

    container.innerHTML = "";
    blocksRef.current = [];

    const blockWidth = window.innerWidth / COLS;
    const blockHeight = window.innerHeight / ROWS;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const block = document.createElement("div");

        block.className =
          "absolute bg-soky-paper will-change-transform";
        block.style.cssText = `
        width: ${blockWidth + 1}px; 
        height: ${blockHeight + 1}px; 
        left: ${col * blockWidth}px; 
        top: ${row * blockHeight}px; 
        transform-origin: ${row % 2 === 0 ? "left" : "right"} center`;

        container.appendChild(block);
        blocksRef.current.push(block);
      }
    }
    gsap.set(blocksRef.current, { scaleX: 0 });
  }, []);

  useEffect(() => {
    createTransitionGrid();
    window.addEventListener("resize", createTransitionGrid);
    return () => {
      window.removeEventListener("resize", createTransitionGrid);
    };
  }, [createTransitionGrid]);

  const animateIn = useCallback(
    (onComplete: TransitionCallback) => {
      const tl = gsap.timeline({ onComplete });

      for (let row = 0; row < ROWS; row++) {
        const blocks = getRowBlocks(row);
        tl.to(
          blocks,
          {
            scaleX: 1,
            duration: 0.6,
            ease: "power3.inOut",
            stagger: {
              each: 0.025,
              from: row % 2 === 0 ? "start" : "end",
            },
          },
          "<",
        );
      }
      return tl;
    },
    [getRowBlocks],
  );

  const animateOut = useCallback(
    (onComplete: TransitionCallback) => {
      const tl = gsap.timeline({ onComplete });

      for (let row = 0; row < ROWS; row++) {
        const blocks = getRowBlocks(row);
        tl.to(
          blocks,
          {
            scaleX: 0,
            duration: 0.6,
            ease: "power3.inOut",
            stagger: {
              each: 0.025,
              from: row % 2 === 0 ? "start" : "end",
            },
          },
          "<",
        );
      }
      return tl;
    },
    [getRowBlocks],
  );

  return (
    <TransitionRouter
      auto
      leave={(next: TransitionCallback) => {
        const tl = animateIn(next);
        return () => tl.kill();
      }}
      enter={(next: TransitionCallback) => {
        const tl = animateOut(next);
        return () => tl.kill();
      }}
    >
      <div
        ref={transitionGridRef}
        className="pointer-events-none fixed inset-0 z-100 h-full w-full overflow-hidden"
      />
      {children}
    </TransitionRouter>
  );
}
