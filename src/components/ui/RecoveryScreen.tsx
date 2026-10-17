"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SokyLogo } from "@/components/brand/SokyLogo";
import styles from "./RecoveryScreen.module.css";

type RecoveryScreenBaseProps = {
  as?: "main" | "section";
  compact?: boolean;
  description: string;
  headingTag?: "h1" | "h2";
  isPending?: boolean;
  onPrimaryAction?: () => void;
  primaryActionLabel: string;
  primaryActionPendingLabel?: string;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
  showLogo?: boolean;
  statusCode?: 404;
  title: string;
  titleId?: string;
};

type RecoveryScreenProps = RecoveryScreenBaseProps & (
  | { onPrimaryAction?: never; primaryActionHref: string }
  | { onPrimaryAction: () => void; primaryActionHref?: never }
);

export function RecoveryScreen({
  as = "main",
  compact = false,
  description,
  headingTag = "h1",
  isPending = false,
  onPrimaryAction,
  primaryActionHref,
  primaryActionLabel,
  primaryActionPendingLabel = "Reintentando…",
  secondaryActionHref = "/",
  secondaryActionLabel = "Ir al inicio",
  showLogo = false,
  statusCode,
  title,
  titleId = "recovery-screen-title",
}: RecoveryScreenProps) {
  const Screen = as;
  const Heading = headingTag;
  const screenClassName = compact
    ? `${styles.screen} ${styles.compact}`
    : styles.screen;
  const visualClassName = statusCode
    ? `${styles.visual} ${styles.visualWithCode}`
    : `${styles.visual} ${styles.visualWithoutCode}`;

  return (
    <Screen
      className={screenClassName}
      aria-labelledby={titleId}
      aria-busy={isPending || undefined}
    >
      <div className={`${styles.patternFade} ${styles.patternFadeTop}`} aria-hidden="true">
        <span className={styles.patternMask} />
      </div>
      <div className={`${styles.patternFade} ${styles.patternFadeBottom}`} aria-hidden="true">
        <span className={styles.patternMask} />
      </div>

      {showLogo ? (
        <header className={styles.header}>
          <Link className={styles.logoLink} href="/" aria-label="SOKY, ir al inicio">
            <SokyLogo title="" className={styles.logo} />
          </Link>
        </header>
      ) : null}

      <div className={styles.content}>
        <div className={visualClassName}>
          {statusCode ? <p className={styles.code}>{statusCode}</p> : null}
          <Image
            className={styles.illustration}
            src="/images/recovery/sushi-roll-chopsticks.png"
            alt=""
            aria-hidden="true"
            width={1024}
            height={369}
            priority
          />
        </div>

        <div className={styles.message}>
          <Heading id={titleId} className={styles.title}>
            {title}
          </Heading>
          <p className={styles.description}>{description}</p>

          <div className={styles.actions}>
            {primaryActionHref ? (
              <Button
                href={primaryActionHref}
                className={styles.primaryAction}
                size="lg"
              >
                {primaryActionLabel}
              </Button>
            ) : (
              <Button aria-busy={isPending}
                type="button"
                className={styles.primaryAction}
                size="lg"
                disabled={isPending}
                onClick={onPrimaryAction}
              >
                {isPending ? primaryActionPendingLabel : primaryActionLabel}
              </Button>
            )}
            <Button
              href={secondaryActionHref}
              className={styles.secondaryAction}
              variant="secondary"
              data-transition-ignore="true"
            >
              {secondaryActionLabel}
            </Button>
          </div>
          <span className={styles.status} role="status" aria-live="polite" aria-atomic="true">
            {isPending ? "Reintentando la página." : ""}
          </span>
        </div>
      </div>
    </Screen>
  );
}
