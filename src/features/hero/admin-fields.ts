export const HERO_ROLES = [
  { id: "slider-kiyomi", role: "Welcome", label: "Bienvenida", fields: ["status", "primaryCta", "secondaryCta", "rotatorImages", "productLayer"] },
  { id: "slider-boxes", role: "Promos", label: "Boxes y promociones", fields: ["status", "title", "description", "primaryCta", "rotatorImages"] },
  { id: "slider-weekly-special", role: "Bestseller", label: "Producto destacado", fields: ["status", "title", "description", "eyebrow", "badgeLabel", "promoNote", "productId", "primaryCta", "secondaryCta", "productLayer"] },
  { id: "slider-chat", role: "Conversion", label: "Contacto y entrega", fields: ["status", "title", "description", "eyebrow", "primaryCta", "secondaryCta", "productLayer"] },
] as const;
