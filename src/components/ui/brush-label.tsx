import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BrushColor = "orange" | "blue" | "paper";

const colorClass: Record<BrushColor, string> = {
  orange: "bg-soky-orange-deep text-soky-white",
  blue: "bg-soky-blue text-soky-white",
  paper: "bg-soky-paper text-soky-ink",
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
        "inline-flex rotate-[-1deg] items-center rounded-[55%_45%_50%_45%/45%_55%_45%_55%] px-4 py-2 font-hand text-lg font-bold leading-none shadow-sm",
        colorClass[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
