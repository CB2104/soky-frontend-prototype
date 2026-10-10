import type { RefObject } from "react";
import { SokyLogo } from "@/components/brand/SokyLogo";
import styles from "./PageTransitionOverlay.module.css";

type PageTransitionOverlayProps = {
  overlayRef: RefObject<HTMLDivElement | null>;
  logoRef: RefObject<HTMLDivElement | null>;
};

const ROWS = [0, 1, 2, 3];
const COLUMNS = Array.from({ length: 16 }, (_, index) => index);

export function PageTransitionOverlay({
  overlayRef,
  logoRef,
}: PageTransitionOverlayProps) {
  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      data-active="false"
      aria-hidden="true"
    >
      <div className={styles.grid}>
        {ROWS.map((row) => (
          <div
            key={row}
            className={styles.row}
            data-transition-row
            style={{ top: `${row * 25}%` }}
          >
            {COLUMNS.map((column) => (
              <div
                key={column}
                className={styles.block}
                data-transition-block
              />
            ))}
          </div>
        ))}
      </div>

      <div className={styles.logoPosition}>
        <div ref={logoRef} className={styles.logo}>
          <SokyLogo
            title=""
            white="var(--color-soky-white, #fffdf7)"
            orange="var(--color-soky-orange, #fe6402)"
          />
        </div>
      </div>
    </div>
  );
}
