import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type StampTone = "promo" | "tempura" | "cold" | "new";

const toneClass: Record<StampTone, string> = {
  promo: "border-soky-orange-deep text-soky-orange-deep",
  tempura: "border-soky-tempura text-soky-soy",
  cold: "border-soky-blue text-soky-blue",
  new: "border-japan-seal text-japan-seal",
};

type StampBadgeProps = {
  children: ReactNode;
  className?: string;
  tone?: StampTone;
};

export function StampBadge({ children, className, tone = "promo" }: StampBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex aspect-square min-h-16 min-w-16 rotate-[-5deg] items-center justify-center rounded-full border-4 bg-soky-white/90 px-3 text-center font-display text-sm uppercase leading-none shadow-sm",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
