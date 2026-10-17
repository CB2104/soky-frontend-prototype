"use client";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type PillActionButtonProps = Omit<ComponentPropsWithRef<"button">, "children"> & {
  icon: ReactNode;
  badge?: number;
  children: ReactNode;
  isActive?: boolean;
  variant?: "full" | "compact";
};
export function PillActionButton({icon,badge,children,className,isActive=false,type="button",variant="full",...props}:PillActionButtonProps) {
  const compact = variant === "compact";
  return <span className="relative inline-flex shrink-0">
    <Button {...props} type={type} variant="secondary" size={compact ? "icon" : "md"}
      className={cn(isActive && "outline-2 outline-offset-4 outline-soky-white", className)}>
      <span aria-hidden="true" className="inline-flex shrink-0">{icon}</span>
      <span className={compact ? "sr-only" : undefined}>{children}</span>
    </Button>
    {typeof badge === "number" && badge > 0 ? <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-soky-orange px-1 text-xs font-black leading-none text-soky-white ring-2 ring-soky-white">{badge}</span> : null}
  </span>;
}
