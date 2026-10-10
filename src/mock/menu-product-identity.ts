type ExistingProductIdentity = { id: string; slug: string };

// Mantener identidades/URLs ya usadas por carrito, analytics y páginas.
export const existingProductIdentity: Record<string, ExistingProductIdentity> = {
  "box-kiyomi": { id: "prod-kiyomi", slug: "box-kiyomi" },
  "box-kyoto": { id: "prod-kyoto", slug: "box-kyoto" },
  "box-osaka": { id: "prod-osaka", slug: "box-osaka" },
  "box-soky": { id: "prod-soky", slug: "box-soky" },
  "box-samurai": { id: "prod-samurai", slug: "box-samurai" },
  "camarones-crispy": { id: "prod-crispy", slug: "camaron-crispy" },
  "fuji-roll": { id: "prod-fuji", slug: "fuji-roll" },
};
