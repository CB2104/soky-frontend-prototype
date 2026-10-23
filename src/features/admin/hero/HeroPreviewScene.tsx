"use client";

import { useEffect, useState } from "react";
import type { AdminSliderItemDto } from "@/contracts/api";
import { mapPublicSliderToHeroSlide } from "@/features/hero/mappers";
import { HeroSlideRenderer } from "@/features/hero/components/HeroSlideRenderer";
import styles from "./HeroPreviewScene.module.css";

export function HeroPreviewScene({ token }: { token: string }) {
  const [slide, setSlide] = useState<AdminSliderItemDto | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.sessionStorage.getItem(`soky-admin-hero-preview-${token}`);
        if (saved) setSlide(JSON.parse(saved) as AdminSliderItemDto);
      } catch {
        setSlide(null);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [token]);

  if (!slide) return <main className={styles.empty} aria-label="Vista previa">Preparando la vista previa…</main>;

  return (
    <main className={styles.scene} inert={true} aria-hidden="true">
      <HeroSlideRenderer
        slide={mapPublicSliderToHeroSlide(slide, 0)}
        whatsappUrl="https://example.invalid/preview"
        isActive={false}
        isInitialSlide={false}
        renderBackground
        renderLegacyMedia
        showWaveDivider={false}
        fallbackDescription="Vista previa de la composición SOKY"
      />
    </main>
  );
}
