import type { RefObject } from "react";
import { SokyLogo } from "@/components/brand/SokyLogo";
import styles from "./HomeLoadingOverlay.module.css";

type Props = {
  overlayRef?: RefObject<HTMLDivElement | null>;
  error?: boolean;
  errorDetail?: string;
  onContinue?: () => void;
};

export function HomeLoadingOverlay({ overlayRef, error = false, errorDetail, onContinue }: Props) {
  return (
    <div ref={overlayRef} className={`soky-home-loading ${styles.overlay}`} data-home-loading-overlay>
      <div className={styles.grid} aria-hidden="true">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className={styles.row} data-loading-row style={{ top: `${row * 25}%` }}>
            {Array.from({ length: 16 }, (_, column) => (
              <div key={column} className={styles.block} data-loading-block />
            ))}
          </div>
        ))}
      </div>
      <div className={styles.content} data-loading-copy>
        <div className={styles.logo} aria-hidden="true">
          <SokyLogo title="" white="var(--color-soky-white, #fffdf7)" orange="var(--color-soky-orange, #fe6402)" />
        </div>
        <p role="status">{error ? "La preparación está tardando más de lo esperado." : "Preparando SOKY"}</p>
        {error ? (
          <div className={styles.actions}>
            <button type="button" onClick={() => window.location.reload()}>Reintentar</button>
            <button type="button" onClick={onContinue}>Continuar de todos modos</button>
          </div>
        ) : <div className={styles.activity} aria-hidden="true" />}
        {error && errorDetail && process.env.NODE_ENV !== "production" ? (
          <details data-home-loading-diagnostic style={{ width: "min(100%, 640px)", textAlign: "left" }}>
            <summary>Diagnóstico de carga</summary>
            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12, maxHeight: "30dvh", overflow: "auto" }}>{errorDetail}</pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}
