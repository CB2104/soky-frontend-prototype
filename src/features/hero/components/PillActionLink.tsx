import { cn } from "@/lib/cn";
import Link from "next/link";
import { AnchorHTMLAttributes, ReactNode } from "react";

type PillActionVariant = "primary" | "secondary";

type PillActionLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  children: ReactNode;
  href: string;
  icon: ReactNode;
  variant?: PillActionVariant;
};

const outerVariantClass: Record<PillActionVariant, string> = {
  primary:
    "bg-soky-paper shadow-[0_3px_0_rgb(7_5_74_/_0.16),0_10px_22px_rgb(7_5_74_/_0.12)]",
  secondary:
    "border border-soky-white/90 bg-soky-white/95 shadow-[0_2px_0_rgb(7_5_74_/_0.08),0_8px_18px_rgb(7_5_74_/_0.08)]",
};

const surfaceVariantClass: Record<PillActionVariant, string> = {
  primary:
    "bg-soky-orange-deep bg-[url('/images/patterns/endless-clouds-light.svg')] bg-size-[56px_28px] bg-repeat [font-family:var(--font-outfit)] font-bold uppercase tracking-[0.04em] text-soky-white ring-1 ring-inset ring-soky-white/20 group-hover:bg-soky-orange",
  secondary:
    "bg-soky-white [font-family:var(--font-montserrat)] font-normal uppercase tracking-[0.075em] text-soky-orange-deep ring-1 ring-inset ring-soky-orange/10 group-hover:bg-soky-paper",
};

const iconVariantClass: Record<PillActionVariant, string> = {
  primary:
    "bg-soky-blue/90 text-soky-white shadow-[inset_0_1px_0_rgb(255_255_255_/_0.28),0_2px_5px_rgb(7_5_74_/_0.2)]",
  secondary:
    "bg-soky-orange/12 text-soky-orange-deep shadow-[inset_0_1px_0_rgb(255_255_255_/_0.5)]",
};

export function PillActionLink({
  children,
  className,
  href,
  icon,
  variant = "primary",
  ...props
}: PillActionLinkProps) {
  const isPageAnchor = href.startsWith("#") || href.startsWith("/#");
  const isProductDetail = href.startsWith("/menu/");
  const ActionLink = isPageAnchor ? "a" : Link;

  return (
    <ActionLink
      href={href}
      data-transition-ignore={isPageAnchor || isProductDetail ? "true" : undefined}
      {...(isProductDetail ? { scroll: false } : {})}
      data-hero-cta
      data-pill-action-link
      className={cn(
        "group inline-flex min-h-[3.25rem] w-full touch-manipulation rounded-full p-[3px]",
        "transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:-translate-y-0.5 active:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2",
        "sm:w-auto sm:min-w-52",
        outerVariantClass[variant],
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-flex min-h-[2.875rem] w-full items-center justify-between gap-2.5 rounded-full",
          "px-4 text-[0.82rem] sm:px-5 sm:text-sm",
          "transition-[background-color,transform] duration-300",
          "group-active:scale-[0.98]",
          surfaceVariantClass[variant],
        )}
      >
        <span className="min-w-0 text-pretty leading-tight">{children}</span>
        <span
          aria-hidden="true"
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full sm:size-8",
            "transition-transform duration-200 group-hover:scale-[1.06] group-active:scale-95",
            "[&_svg]:size-5",
            "[@media(max-height:500px)_and_(orientation:landscape)]:[&_svg]:!size-4",
            iconVariantClass[variant],
          )}
        >
          {icon}
        </span>
      </span>
    </ActionLink>
  );
}
