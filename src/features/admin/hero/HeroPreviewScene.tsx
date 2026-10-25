"use client";

import { useEffect, useState } from "react";
import type { AdminSliderItemDto } from "@/contracts/api";
import { ImagePreview } from "../components/AdminFormFields";
import { heroThumbnail, pendingHeroFields } from "./hero-content";
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

  if (!slide) return <main className={styles.empty}>No hay contenido de vista previa disponible. Vuelve al editor y pulsa «Ver borrador».</main>;

  const pending = pendingHeroFields(slide);
  return (
    <main className={styles.scene}>
      <p className={styles.notice}>Vista previa administrativa de contenido. No reproduce exactamente la composición pública.</p>
      <ImagePreview src={heroThumbnail(slide)} alt={slide.rotatorImages?.[0]?.alt ?? slide.productLayer?.alt ?? slide.imageAlt} />
      {slide.eyebrow ? <p>{slide.eyebrow}</p> : null}
      <h1>{slide.title}</h1>
      {pending.includes("title") ? <p className={styles.notice}>Título de borrador · pendiente de conexión al site. El título público sigue siendo «NO TE QUEDES CON LAS GANAS».</p> : null}
      {slide.description ? <p>{slide.description}</p> : null}
      {slide.badgeLabel ? <p>{slide.badgeLabel}</p> : null}
      {slide.productName ? <p><strong>{slide.productName}</strong></p> : null}
      {slide.promoNote ? <p>{slide.promoNote}</p> : null}
      {slide.rotatorImages?.map((image, index) => (
        <section className={styles.product} key={index}>
          <ImagePreview src={"desktop" in image ? image.desktop : image.src} alt={image.alt} compact />
          <p>{image.name ?? `Producto ${index + 1}`}{image.priceAmount ? ` · ${image.priceAmount} ${image.priceCurrency}` : ""}</p>
        </section>
      ))}
      {slide.productLayer && slide.rotatorImages?.length ? <section>
        <p className={styles.notice}>Imagen de respaldo de la composición</p>
        <ImagePreview src={heroThumbnail({ ...slide, rotatorImages: undefined })} alt={slide.productLayer.alt} />
      </section> : null}
      <div className={styles.actions}>
        {[slide.primaryCta, slide.secondaryCta].map((cta, index) => cta && cta.type !== "NONE" ? <button key={index} type="button" disabled>{cta.label}</button> : null)}
      </div>
      <p className={styles.notice}>Los botones son de muestra y no navegan ni envían mensajes.</p>
    </main>
  );
}
