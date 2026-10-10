import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BrushColor = "orange" | "blue" | "paper";

const colorClass: Record<BrushColor, string> = {
  orange:
    "bg-soky-white text-soky-orange-deep ring-1 ring-soky-orange/25 shadow-[0_8px_18px_rgb(7_5_74_/_0.16)]",
  blue: "bg-soky-blue text-soky-white",
  paper: "bg-soky-paper text-soky-ink",
};

const accentClass: Record<BrushColor, string> = {
  orange: "bg-soky-orange",
  blue: "bg-soky-white",
  paper: "bg-soky-orange",
};

type BrushLabelProps = {
  children: ReactNode;
  className?: string;
  color?: BrushColor;
};

export function BrushLabel({ children, className, color = "orange" }: BrushLabelProps) {
  return (
    <span
      className={cn(
        "relative isolate inline-flex rotate-[-1deg] items-center rounded-[55%_45%_50%_45%/45%_55%_45%_55%] px-4 py-2 font-hand text-lg font-bold leading-none",
        colorClass[color],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute -right-1 top-1/2 size-2.5 -translate-y-1/2 rounded-full",
          accentClass[color],
        )}
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
}
