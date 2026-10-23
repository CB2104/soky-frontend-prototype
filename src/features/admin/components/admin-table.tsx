import type { ReactNode } from "react";
import styles from "./AdminWorkspace.module.css";

export function AdminPageHeader({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>{title}</h1>
      <p className={styles.pageDescription}>{description}</p>
    </div>
  );
}

export function AdminIntegrationNotice({ children }: { children: ReactNode }) {
  return <p className={styles.integrationNotice}>{children}</p>;
}

export function AdminMetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.metricCard}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
    </div>
  );
}

export function AdminStatus({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "warning" | "negative";
}) {
  return <span className={styles.status} data-tone={tone}>{children}</span>;
}

export function AdminTable({
  caption,
  emptyMessage = "Todavía no hay registros para mostrar.",
  headers,
  rowKeys,
  rows,
}: {
  caption: string;
  emptyMessage?: string;
  headers: string[];
  rowKeys?: string[];
  rows: ReactNode[][];
}) {
  return (
    <section className={styles.tableCard} aria-label={caption}>
      {rows.length === 0 ? (
        <p className={styles.emptyState}>{emptyMessage}</p>
      ) : (
        <div className={styles.tableRegion} role="region" aria-label={`${caption}, desplaza horizontalmente si hace falta`} tabIndex={0}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>{caption}</caption>
          <thead className="bg-soky-paper">
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowKeys?.[rowIndex] ?? `row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </section>
  );
}
