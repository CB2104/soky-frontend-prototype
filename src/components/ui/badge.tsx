import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "promo" | "tempura" | "cold" | "featured" | "neutral" | "success";

const badgeClass: Record<BadgeVariant, string> = {
  promo: "bg-soky-orange-deep text-soky-white",
  tempura: "bg-soky-tempura text-soky-soy",
  cold: "bg-soky-blue text-soky-white",
  featured: "bg-japan-seal text-soky-white",
  neutral: "bg-soky-paper text-soky-ink ring-1 ring-soky-border",
  success: "bg-soky-wasabi text-soky-ink",
};

type BadgeProps = {
  children: ReactNode;
  className?: string;
  variant?: BadgeVariant;
};

export function Badge({ children, className, variant = "neutral" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-lg px-3 text-xs font-bold",
        badgeClass[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
