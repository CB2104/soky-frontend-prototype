import styles from "./MenuShowcase.module.css";

export function MenuShowcaseBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      <div className={styles.pattern} />

      <svg
        className={styles.wave}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="
            M0 160
            C240 60 420 280 720 180
            C1020 80 1200 60 1440 140
            L1440 320
            L0 320
            Z
          "
        />
      </svg>
    </div>
  );
}
