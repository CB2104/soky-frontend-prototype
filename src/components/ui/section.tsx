import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionTone = "paper" | "blue" | "navy" | "white";

const toneClass: Record<SectionTone, string> = {
  paper: "bg-soky-paper text-soky-ink",
  blue: "bg-soky-blue text-soky-white",
  navy: "bg-soky-navy text-soky-white",
  white: "bg-soky-white text-soky-ink",
};

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: SectionTone;
};

export function Section({ children, className, id, tone = "paper" }: SectionProps) {
  return (
    <section id={id} className={cn("soky-section", toneClass[tone], className)}>
      {children}
    </section>
  );
}
