import styles from "./LocationBackground.module.css";

/** Draft for guided integration. Decorative server component; no motion hooks. */
export function LocationBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      <span className={styles.textureTop} />
      <span className={styles.textureBottom} />
      <span className={styles.orangeCorner} />
      <span className={styles.orangeWave} />
      <span className={styles.whiteWave} />
    </div>
  );
}
