"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import menuSushi from "../../../../public/images/hero/soky-slide4-sushi-cutout.webp";
import styles from "./MenuSushiCutout.module.css";

gsap.registerPlugin(useGSAP);

export function MenuSushiCutout() {
  const imageRef = useRef<HTMLImageElement | null>(null);

  useGSAP(
    () => {
      const image = imageRef.current;
      if (!image) return;

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          image,
          { xPercent: 12, yPercent: 5, scale: 0.94, rotation: -22.5 },
          {
            xPercent: 0,
            yPercent: 0,
            scale: 1,
            rotation: 0,
            duration: 0.75,
            delay: 0.68,
            ease: "back.out(1.18)",
          },
        );
      });

      return () => media.revert();
    },
    {
      scope: imageRef,
    },
  );

  return (
    <Image
      ref={imageRef}
      src={menuSushi}
      alt=""
      width={1448}
      height={1086}
      sizes="(max-width: 359px) 88px, (max-width: 767px) 144px, (max-width: 1023px) 30vw, 512px"
      loading="eager"
      draggable={false}
      className={styles.sushi}
    />
  );
}
