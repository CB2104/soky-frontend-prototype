"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

type PillActionButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  icon: ReactNode;
  badge?: number;
  children: ReactNode;
  isActive?: boolean;
  variant?: "full" | "compact";
};

const buttonVariants = {
  rest: {
    y: 0,
    scale: 1,
  },
  hover: {
    y: -1,
    scale: 1,
  },
  active: {
    y: 0,
    scale: 1,
  },
  tap: {
    scale: 0.97,
  },
};

const orangePillVariants = {
  rest: {
    opacity: 0,
    scale: 0.96,
  },
  hover: {
    opacity: 1,
    scale: 1,
  },
  active: {
    opacity: 1,
    scale: 1,
  },
  tap: {
    opacity: 1,
    scale: 1,
  },
};

export function PillActionButton({
  icon,
  badge,
  children,
  className,
  isActive = false,
  type = "button",
  variant = "full",
  ...props
}: PillActionButtonProps) {
  const showBadge = typeof badge === "number" && badge > 0;
  const isCompact = variant === "compact";

  return (
    <motion.button
      type={type}
      initial="rest"
      animate={isActive ? "active" : "rest"}
      whileHover="hover"
      whileTap="tap"
      variants={buttonVariants}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={cn(
        "group relative inline-flex touch-manipulation rounded-full border border-soky-border bg-soky-white p-1 shadow-lg shadow-soky-navy/20",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "relative isolate inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full",
          isCompact ? "h-12 w-12" : "gap-2 px-5 pr-6",
        )}
      >
        <motion.span
          aria-hidden="true"
          variants={orangePillVariants}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0 rounded-full bg-soky-orange-deep bg-[url('/images/endless-clouds-light.svg')] bg-size-[56px_28px] bg-repeat"
        />

        <span
          className={cn(
            "relative z-10 grid size-5 shrink-0 -translate-y-px place-items-center transition-colors duration-300 group-active:text-soky-white group-hover:text-soky-white [&_svg]:size-5",
            isActive ? "text-soky-white" : "text-soky-ink",
          )}
          aria-hidden="true"
        >
          {icon}
        </span>

        {isCompact ? (
          <span className="sr-only">{children}</span>
        ) : (
          <span
            className={cn(
              "relative z-10 font-medium transition-colors duration-300 group-active:text-soky-white group-hover:text-soky-white",
              isActive ? "text-soky-white" : "text-soky-ink",
            )}
          >
            {children}
          </span>
        )}
      </span>

      {showBadge ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-soky-blue px-1 text-xs font-black leading-none text-soky-white ring-2 ring-soky-white">
          {badge}
        </span>
      ) : null}
    </motion.button>
  );
}
