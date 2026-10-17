import type { ReactNode } from "react";
import styles from "./HomeSharedScene.module.css";

type HomeSharedSceneProps = {
  children: ReactNode;
};

export function HomeSharedScene({ children }: HomeSharedSceneProps) {
  return (
    <div className={styles.scene} data-home-scene>
      <div className={styles.decoration} aria-hidden="true">
        <span className={`${styles.pattern} ${styles.patternLeft}`} />
        <span className={`${styles.pattern} ${styles.patternRight}`} />
      </div>
      {children}
      <noscript>
        <style>{"[data-home-scene] [data-home-scene-reveal] { opacity: 1 !important; transform: none !important; }"}</style>
      </noscript>
    </div>
  );
}
