import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Pattern = "seigaiha" | "asanoha";
type Intensity = "subtle" | "medium";

type PatternSurfaceProps = {
  children: ReactNode;
  className?: string;
  intensity?: Intensity;
  pattern?: Pattern;
};

const patternClass: Record<Pattern, string> = {
  seigaiha:
    "bg-[radial-gradient(circle_at_50%_120%,transparent_22px,rgb(255_255_255_/_0.16)_23px,rgb(255_255_255_/_0.16)_25px,transparent_26px)] bg-[length:56px_28px]",
  asanoha:
    "bg-[linear-gradient(30deg,rgb(23_41_166_/_0.07)_12%,transparent_12.5%,transparent_87%,rgb(23_41_166_/_0.07)_87.5%,rgb(23_41_166_/_0.07)),linear-gradient(150deg,rgb(23_41_166_/_0.07)_12%,transparent_12.5%,transparent_87%,rgb(23_41_166_/_0.07)_87.5%,rgb(23_41_166_/_0.07))] bg-[length:42px_42px]",
};

const intensityClass: Record<Intensity, string> = {
  subtle: "opacity-[0.35]",
  medium: "opacity-[0.55]",
};

export function PatternSurface({
  children,
  className,
  intensity = "subtle",
  pattern = "seigaiha",
}: PatternSurfaceProps) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 -z-10",
          patternClass[pattern],
          intensityClass[intensity],
        )}
      />
      {children}
    </div>
  );
}
