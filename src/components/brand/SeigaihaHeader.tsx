import type { ReactNode } from "react";
import styles from "./SeigaihaHeader.module.css";

export function SeigaihaHeader({ children }: { children: ReactNode }) {
  return <header className={styles.header}><div className={styles.content}>{children}</div></header>;
}
