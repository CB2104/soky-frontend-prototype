import detailStyles from "./ProductDetailContent.module.css";
import styles from "./ProductDetailSkeleton.module.css";

export function ProductDetailSkeleton() {
  return (
    <>
      <p className={styles.srOnly} role="status">
        Cargando producto…
      </p>
      <div
        className={`${detailStyles.root} ${styles.skeleton}`}
        data-presentation="dialog"
        aria-busy="true"
      >
        <div
          className={`${detailStyles.layout} ${styles.visual}`}
          aria-hidden="true"
        >
          <div className={detailStyles.figure}>
            <div className={`${detailStyles.media} ${styles.media}`} />
          </div>
          <div className={detailStyles.info}>
            <div className={`${styles.shape} ${styles.category}`} />
            <div className={`${styles.shape} ${styles.title}`} />
            <div className={styles.badges}>
              <span className={`${styles.shape} ${styles.badge}`} />
              <span className={`${styles.shape} ${styles.metadata}`} />
            </div>
            <div className={detailStyles.group}>
              <div className={`${styles.shape} ${styles.groupTitle}`} />
              <div className={styles.groupRows}>
                <div className={styles.groupRow}>
                  <span className={`${styles.shape} ${styles.icon}`} />
                  <span className={`${styles.shape} ${styles.line}`} />
                </div>
                <div className={styles.groupRow}>
                  <span className={`${styles.shape} ${styles.icon}`} />
                  <span className={`${styles.shape} ${styles.shortLine}`} />
                </div>
              </div>
            </div>
            <div className={`${styles.shape} ${styles.price}`} />
            <div className={detailStyles.actions}>
              <span className={`${styles.shape} ${styles.button}`} />
              <span className={`${styles.shape} ${styles.cartLink}`} />
            </div>
            <div className={`${styles.shape} ${styles.note}`} />
          </div>
        </div>
      </div>
    </>
  );
}
