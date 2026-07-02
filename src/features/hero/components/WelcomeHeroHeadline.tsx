"use client";

import AnimatedSokyLogo from "@/components/brand/AnimatedSokyLogo";
import { cn } from "@/lib/cn";
import { motion, useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";

type WelcomeHeroHeadlineProps = {
  description: string;
  headingId: string;
  showLogo?: boolean;
  title: string;
};

const textTransition: Transition = {
  duration: 0.55,
  delay: 0.72,
  ease: [0.21, 0.47, 0.32, 0.98],
};

export function WelcomeHeroHeadline({
  description,
  headingId,
  showLogo = true,
  title,
}: WelcomeHeroHeadlineProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div>
      {showLogo ? (
        <AnimatedSokyLogo
          title="SOKY"
          wrapperClassName="-ml-1"
          className="h-auto w-full max-w-[15rem] sm:max-w-[20rem] lg:max-w-[28rem]"
        />
      ) : null}

      <div    >
        <h1
          id={headingId}
          className={cn(
            "soky-heading max-w-[9.8ch] text-balance text-[clamp(3rem,12.5vw,4.4rem)] leading-[0.88] text-soky-white [text-shadow:0_3px_0_rgb(7_5_74_/_0.24),0_12px_24px_rgb(7_5_74_/_0.24)] sm:max-w-[10.4ch] sm:text-[4.65rem] md:max-w-[10.8ch] md:text-[5rem] lg:text-[5.55rem] xl:text-[6rem]",
            showLogo ? "mt-3" : "mt-0",
          )}
        >
          {title}
        </h1>

        <div
          aria-hidden="true"
          className="mt-2.5 flex h-1.5 w-full max-w-[10rem] overflow-hidden rounded-full bg-soky-white/85 shadow-[0_4px_0_rgb(7_5_74_/_0.14)] sm:max-w-[12rem]"
        >
          <span className="h-full w-1/3 bg-soky-orange" />
        </div>

        <p className="mt-2.5 max-w-[30rem] text-base leading-6 text-soky-white/84 sm:text-[1.05rem] sm:leading-7">
          {description}
        </p>
      </div>
    </div>
  );
}
