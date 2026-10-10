import styles from "./MenuShowcase.module.css";

type MenuShowcaseHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  compact?: boolean;
};

export function MenuShowcaseHeading({
  id,
  eyebrow,
  title,
  accent,
  description,
  compact = false,
}: MenuShowcaseHeadingProps) {
  return (
    <header
      className={`${styles.heading} ${compact ? styles.headingCompact : ""}`}
    >
      <p className={styles.eyebrow}>{eyebrow}</p>

      <h2 id={id} className={styles.headingTitle}>
        {title} <span className={styles.headingAccent}>{accent}</span>
      </h2>

      <p className={styles.headingDescription}>{description}</p>
    </header>
  );
}
