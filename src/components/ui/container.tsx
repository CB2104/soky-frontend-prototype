import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide";
};

export function Container({ children, className, size = "default" }: ContainerProps) {
  return (
    <div
      className={cn(
        size === "wide" ? "soky-container-wide" : "soky-container",
        className,
      )}
    >
      {children}
    </div>
  );
}
