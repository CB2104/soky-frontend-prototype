import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { ButtonVariant } from "@/components/ui/button";
import { cn } from "@/lib/cn";
type PillActionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: string;
  icon: ReactNode;
  variant?: ButtonVariant;
};
export function PillActionLink({children,className,href,icon,variant="primary",...props}:PillActionLinkProps) {
  const isPageAnchor=href.startsWith("#")||href.startsWith("/#");
  const isProductDetail=href.startsWith("/menu/");
  return <Button href={href} variant={variant} scroll={isProductDetail ? false : undefined}
    data-transition-ignore={isPageAnchor||isProductDetail ? "true" : undefined}
    data-hero-cta className={cn("w-full sm:w-auto",className)} {...props}>
    {children}<span aria-hidden="true">{icon}</span>
  </Button>;
}
