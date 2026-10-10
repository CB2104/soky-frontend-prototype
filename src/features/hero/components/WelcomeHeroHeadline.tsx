import SokyLogo from "@/components/brand/SokyLogo";
import { cn } from "@/lib/cn";
import type { HeroSlideViewModel } from "../types";
import styles from "./WelcomeSplitHero.module.css";

type WelcomeHeroHeadlineProps = {
  as?: "h1" | "h2";
  description: string;
  headingId: string;
  headlineParts?: HeroSlideViewModel["headlineParts"];
  title: string;
};

function HeadlineBrandLogo() {
  return (
    <span className={styles.headlineLogo} data-hero-brand-logo>
      <SokyLogo
        title=""
        white="#FFFDF7"
        orange="#FF6500"
        aria-hidden="true"
        focusable="false"
        className="h-full w-full"
      />
    </span>
  );
}

function HeadlineWords({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  return words.map((word, index) => (
    <span key={`${index}-${word}`} className={styles.titleWord} data-hero-title-word>
      {word}{index < words.length - 1 ? "\u00a0" : ""}
    </span>
  ));
}

function renderHeadlineParts(
  parts: NonNullable<HeroSlideViewModel["headlineParts"]>,
) {
  const [opening, brand, closing] = parts;
  if (
    parts.length === 3 &&
    opening.type === "text" &&
    brand.type === "brand-logo" &&
    closing.type === "text"
  ) {
    const closingWords = closing.text.trim().split(/\s+/);
    if (closingWords.length > 1) {
      const lastWord = closingWords.pop();
      return (
        <>
          <span className={styles.headlineLine} data-hero-headline-line>
            <span data-hero-title-text><HeadlineWords text={opening.text} /></span>
          </span>
          <span className={cn(styles.headlineLine, styles.brandLine)} data-hero-headline-line>
            <HeadlineBrandLogo />
            <span data-hero-title-text><HeadlineWords text={closingWords.join(" ")} /></span>
            <span className={styles.closingLine} data-hero-headline-line>
              <span data-hero-title-text><HeadlineWords text={lastWord ?? ""} /></span>
            </span>
          </span>
        </>
      );
    }
  }

  return parts.map((part, index) => (
    <span key={`${part.type}-${index}`} className="contents">
      {index > 0 ? " " : null}
      {part.type === "text" ? (
        <span data-hero-title-text><HeadlineWords text={part.text} /></span>
      ) : (
        <HeadlineBrandLogo />
      )}
    </span>
  ));
}

export function WelcomeHeroHeadline({
  as: Heading = "h2",
  description,
  headingId,
  headlineParts,
  title,
}: WelcomeHeroHeadlineProps) {
  const hasHeadlineParts = Boolean(headlineParts?.length);

  return (
    <div className="font-soky-body" data-hero-copy>
      <div>
        <Heading
          id={headingId}
          aria-label={hasHeadlineParts ? title : undefined}
          className={cn(
            "font-soky-display font-normal uppercase text-soky-white",
            styles.heading,
          )}
        >
          {hasHeadlineParts && headlineParts ? (
            <span aria-hidden="true">{renderHeadlineParts(headlineParts)}</span>
          ) : (
            <span data-hero-title-text><HeadlineWords text={title} /></span>
          )}
        </Heading>

        <div
          data-hero-underline
          aria-hidden="true"
          className={cn("flex overflow-hidden rounded-full bg-soky-white", styles.underline)}
        >
          <span className="h-full w-1/3 bg-soky-orange" />
        </div>

        <p
          data-hero-description
          className={cn("font-soky-body font-medium text-soky-white/95", styles.description)}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
