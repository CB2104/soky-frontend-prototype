"use client";

import { Button } from "@/components/ui/button";
import styles from "@/features/admin/components/AdminWorkspace.module.css";

type AdminAreaErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function AdminAreaError({ error, retry }: AdminAreaErrorProps) {
  void error;

  return (
    <section className={`${styles.panel} ${styles.panelPadding}`} role="alert" aria-labelledby="admin-error-title">
      <h1 id="admin-error-title" className={styles.pageTitle}>No pudimos cargar esta pantalla</h1>
      <p className={styles.pageDescription}>
        Tus datos siguen en la demo. Intenta cargar la información de nuevo.
      </p>
      <div className={styles.actions}>
        <Button variant="secondary" type="button" onClick={retry}>Reintentar</Button>
      </div>
    </section>
  );
}
