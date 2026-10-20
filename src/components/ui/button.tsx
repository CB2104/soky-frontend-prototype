import Link from "next/link";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "tertiary";
export type ButtonSecondaryTone = "standard" | "a" | "b";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

type CommonProps = {
  children: ReactNode;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  secondaryTone?: ButtonSecondaryTone;
};
type ButtonAsButton = CommonProps &
  ComponentPropsWithRef<"button"> & { href?: never };
type ButtonAsLink = CommonProps &
  ComponentPropsWithRef<"a"> & {
    href: string;
    scroll?: boolean;
  };
export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  children,
  className,
  size = "md",
  variant = "primary",
  secondaryTone = "standard",
  ...props
}: ButtonProps) {
  const appearance = {
    className: cn(styles.button, className),
    "data-variant": variant,
    "data-size": size,
    "data-secondary-tone": variant === "secondary" ? secondaryTone : undefined,
  };
  const content = <span className={styles.label}>{children}</span>;

  if ("href" in props && props.href) {
    const { href, scroll, ...anchorProps } = props;
    // Native anchors keep hash/external navigation behavior; Next handles routes.
    if (
      href.startsWith("#") ||
      href.startsWith("/#") ||
      !href.startsWith("/") ||
      href.startsWith("//")
    ) {
      return (
        <a href={href} {...anchorProps} {...appearance}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} scroll={scroll} {...anchorProps} {...appearance}>
        {content}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } =
    props as ComponentPropsWithRef<"button">;
  return (
    <button type={type} {...buttonProps} {...appearance}>
      {content}
    </button>
  );
}
