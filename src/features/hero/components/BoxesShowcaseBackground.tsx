import styles from "./BoxesShowcaseBackground.module.css";

export function BoxesShowcaseBackground() {
  return (
    <div aria-hidden="true" className={styles.root} data-boxes-showcase-background>
      <div className={styles.whiteShape} />
      <div className={styles.whitePattern} />
      <div className={styles.arc}>
        <div className={styles.arcPattern} />
      </div>
    </div>
  );
}
